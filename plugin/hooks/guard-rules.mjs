// Reglas del guardián (hook PreToolUse). Funciones puras: reciben la petición de Claude Code y el contexto, y
// devuelven { blocked, reason }. Así se prueban sin Claude Code (test/guard-rules.test.mjs).
//
// Los motivos se escriben para que el agente pueda explicárselos a alguien que no programa.
// Esto es un cinturón de seguridad, no la barrera final: un comando muy retorcido puede escaparse de un análisis
// por texto. La barrera final es la CI en GitHub: obligatoria donde el plan permite proteger la rama principal y, donde
// no, comprobada por la persona que mezcla.
import path from "node:path";
import { toolMatcher } from "./config.mjs";

const ALLOWED = Object.freeze({ blocked: false });
const blocked = (reason) => ({ blocked: true, reason });

const SHELL_TOOLS = new Set(["Bash", "PowerShell"]);
const READ_TOOLS = new Set(["Read", "Grep", "Glob"]);
const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
const FILE_PATH_FIELDS = ["file_path", "path", "notebook_path"];

const ENV_EXAMPLE = ".env.example";
// Carpetas generadas que se pueden borrar sin perder trabajo.
const DISPOSABLE_DIRS = new Set(["node_modules", ".next", "dist", "build", "coverage", "out"]);
// Señales de que un comando de terminal escribe o borra (para las rutas protegidas).
const WRITE_INDICATOR =
  /(>|\btee\b|\bsed\s+-i|\brm\b|\bmv\b|\bcp\b|\bperl\s+-[pi]|\bpython3?\b|\bnode\s+-e|Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item|New-Item)/i;
// Redirecciones que no escriben archivos: 2>&1, >/dev/null, > $null, >NUL.
const HARMLESS_REDIRECTIONS = /\d*>&\d+|\d*>\s*(\/dev\/null|\$null|NUL)\b/gi;
// Ajustes de Claude Code de la persona (~/.claude/settings*.json): ahí viven HARNESS_MAINTENANCE y sus permisos.
const USER_SETTINGS_FILES = new Set(["settings.json", "settings.local.json"]);
const USER_SETTINGS_IN_COMMAND =
  /(~|\$home|\$\{home\}|\$env:userprofile|%userprofile%|\/users\/[^/\s]+|\/home\/[^/\s]+)\/\.claude\/settings(\.local)?\.json/i;
// Subcomandos de npm que reescriben package.json o el lock. `npm ci` instala lo que ya hay y queda permitido.
const NPM_MANIFEST_SUBCOMMANDS = new Set([
  "pkg", "install", "i", "add", "uninstall", "un", "remove", "rm", "r", "update", "up", "upgrade", "dedupe", "link",
  "init",
]);
const MANIFEST_FILES = ["package.json", "package-lock.json"];

const PUSH_FORBIDDEN_FLAGS = new Set([
  "-f", "--force", "--force-if-includes", "--mirror", "--delete", "-d", "--all", "--prune", "--no-verify",
]);

// `git config` escribe con estas opciones (o con la sintaxis nueva `git config set|unset …`) y lee con las de
// lectura; sin ninguna, escribe si hay un valor después de la clave.
const CONFIG_WRITE_OPTIONS = new Set([
  "--unset", "--unset-all", "--add", "--replace-all", "--rename-section", "--remove-section", "--edit", "-e",
  "set", "unset", "rename-section", "remove-section", "edit",
]);
const CONFIG_READ_OPTIONS = new Set(["--get", "--get-all", "--get-regexp", "--list", "-l", "get", "list"]);

export function evaluateToolUse(hookInput, context) {
  const toolName = hookInput.tool_name ?? "";
  const toolInput = hookInput.tool_input ?? {};

  if (matchesAny(toolName, context.config.blockedTools)) {
    return blocked(`la herramienta ${toolName} está prohibida: mezcla o aprueba PRs, o la prohíbe este proyecto (blockedTools en .claude/harness.json).`);
  }
  if (SHELL_TOOLS.has(toolName)) return evaluateCommand(String(toolInput.command ?? ""), context);
  if (READ_TOOLS.has(toolName) || WRITE_TOOLS.has(toolName)) return evaluateFileTool(toolName, toolInput, context);
  return ALLOWED;
}

// ---------- Herramientas de archivos ----------

function evaluateFileTool(toolName, toolInput, context) {
  const filePaths = FILE_PATH_FIELDS.map((field) => toolInput[field]).filter((value) => typeof value === "string");
  for (const filePath of filePaths) {
    if (isSecretFile(filePath)) {
      return blocked(`${filePath} guarda credenciales y el agente no puede abrirlo. Si hace falta un valor, que lo pegue la persona.`);
    }
    // También en mantenimiento: si el agente pudiera escribir aquí, podría activar el mantenimiento él mismo.
    if (WRITE_TOOLS.has(toolName) && isUserSettingsFile(filePath, context)) {
      return blocked(`${filePath} son los ajustes de Claude Code de la persona: los cambia ella, no el agente.`);
    }
    if (WRITE_TOOLS.has(toolName) && !context.maintenance && isProtectedPath(filePath, context)) {
      return blocked(`${filePath} forma parte de las protecciones del proyecto y solo lo cambia alguien técnico.`);
    }
  }
  return ALLOWED;
}

function isSecretFile(filePath) {
  const fileName = toForwardSlashes(filePath).split("/").pop() ?? "";
  return fileName === ".env" || (fileName.startsWith(".env.") && fileName !== ENV_EXAMPLE);
}

function isUserSettingsFile(filePath, context) {
  if (!context.homeDir) return false;
  const expandedPath = filePath.replace(/^~(?=$|[\\/])/, context.homeDir);
  const relativePath = toForwardSlashes(path.relative(path.join(context.homeDir, ".claude"), path.resolve(expandedPath)));
  return USER_SETTINGS_FILES.has(relativePath.toLowerCase());
}

function isProtectedPath(filePath, context) {
  const absolutePath = path.resolve(context.projectDir, filePath);
  const relativePath = toForwardSlashes(path.relative(context.projectDir, absolutePath)).toLowerCase();
  if (relativePath.startsWith("..")) return false;
  return context.config.protectedPaths.some((protectedPath) => {
    const normalized = protectedPath.toLowerCase();
    return normalized.endsWith("/") ? relativePath.startsWith(normalized) : relativePath === normalized;
  });
}

// ---------- Comandos de terminal ----------

function evaluateCommand(command, context) {
  const wholeCommandChecks = [checkSecretFiles, checkUserSettingsInCommand, checkProtectedPathsInCommand, checkConfiguredCommands];
  for (const check of wholeCommandChecks) {
    const verdict = check(command, context);
    if (verdict.blocked) return verdict;
  }
  const segmentChecks = [checkDestructiveDelete, checkGit, checkGitHubCli, checkPackageManifest];
  for (const segment of splitSegments(command)) {
    for (const check of segmentChecks) {
      const verdict = check(segment, context);
      if (verdict.blocked) return verdict;
    }
  }
  return ALLOWED;
}

/** Trozos de un comando encadenado: `a && b; c | d` → [a, b, c, d]. */
function splitSegments(command) {
  return command
    .split(/&&|\|\||[;|\n]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

/** Argumentos que siguen a `program` dentro del trozo, o undefined si no aparece. */
function findInvocation(segment, program) {
  const invocation = new RegExp(`(?:^|[\\s"'(\`])${program}(?:\\.exe)?((?:\\s+-[Cc]\\s+\\S+)*)\\s+(.*)$`, "i");
  const match = segment.match(invocation);
  if (!match) return undefined;
  return { globalOptions: match[1] ?? "", args: tokenize(match[2] ?? "") };
}

// Un argumento vacío entre comillas ('' o "") se conserva: `git config core.hooksPath ''` también escribe.
const EMPTY_ARGUMENT = '""';

function tokenize(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.replace(/^["'`]+|["'`)]+$/g, "") || EMPTY_ARGUMENT);
}

function checkSecretFiles(command) {
  const envMentions = command.matchAll(/(?:^|[\s"'=/\\:;|&(<>`])(\.env(?:\.[\w-]+)*)(?=$|[\s"';|&)<>`])/g);
  for (const mention of envMentions) {
    if (mention[1] !== ENV_EXAMPLE) {
      return blocked(`el comando usa ${mention[1]}, que guarda credenciales. El agente no puede leerlo ni cargarlo.`);
    }
  }
  return ALLOWED;
}

function checkUserSettingsInCommand(command, context) {
  const normalized = toForwardSlashes(command);
  const homeSettings = context.homeDir ? `${toForwardSlashes(context.homeDir)}/.claude/settings`.toLowerCase() : undefined;
  const mentionsSettings = USER_SETTINGS_IN_COMMAND.test(normalized) || (homeSettings && normalized.toLowerCase().includes(homeSettings));
  if (mentionsSettings && WRITE_INDICATOR.test(command.replace(HARMLESS_REDIRECTIONS, ""))) {
    return blocked("el comando parece modificar los ajustes de Claude Code de la persona (~/.claude/settings.json): los cambia ella, no el agente.");
  }
  return ALLOWED;
}

function checkProtectedPathsInCommand(command, context) {
  if (context.maintenance) return ALLOWED;
  const normalized = toForwardSlashes(command).toLowerCase();
  const touched = context.config.protectedPaths.find((protectedPath) => normalized.includes(protectedPath.toLowerCase()));
  if (touched && WRITE_INDICATOR.test(command.replace(HARMLESS_REDIRECTIONS, ""))) {
    return blocked(`el comando parece modificar ${touched}, que forma parte de las protecciones del proyecto.`);
  }
  return ALLOWED;
}

function checkConfiguredCommands(command, context) {
  for (const rule of context.config.blockedCommands) {
    if (new RegExp(rule.pattern, "i").test(command)) return blocked(rule.reason);
  }
  return ALLOWED;
}

function checkDestructiveDelete(segment) {
  const removal = findInvocation(segment, "rm");
  if (removal) {
    const isRecursive = removal.args.some((arg) => /^-[a-zA-Z]*[rR]/.test(arg) || arg === "--recursive");
    const targets = removal.args.filter((arg) => !arg.startsWith("-"));
    if (isRecursive && !targets.every(isDisposableDir)) {
      return blocked("borrar carpetas enteras no se puede deshacer. Solo se permite con carpetas generadas (node_modules, .next, dist…).");
    }
  }
  if (/Remove-Item\b.*-Recurse/i.test(segment) || /\b(rmdir|rd)\s+\/s\b/i.test(segment) || /\bdel\s+.*\/s\b/i.test(segment)) {
    return blocked("borrar carpetas enteras no se puede deshacer.");
  }
  return ALLOWED;
}

function isDisposableDir(target) {
  return DISPOSABLE_DIRS.has(toForwardSlashes(target).replace(/^\.\//, "").replace(/\/$/, ""));
}

// ---------- git ----------

function checkGit(segment, context) {
  const invocation = findInvocation(segment, "git");
  if (!invocation) return ALLOWED;
  if (/hooksPath/i.test(invocation.globalOptions)) return blocked("no se pueden desactivar los hooks de git.");

  const [subcommand = "", ...args] = invocation.args;
  if (args.includes("--no-verify")) return blocked("--no-verify se salta las comprobaciones del proyecto.");

  switch (subcommand) {
    case "checkout":
      return args[0] === "-b" && args.length >= 2
        ? ALLOWED
        : blocked("git checkout puede descartar cambios sin aviso. Para cambiar de rama usa `git switch <rama>`; para crear una, `git switch -c <rama>`.");
    case "restore":
    case "clean":
    case "rebase":
    case "filter-branch":
    case "filter-repo":
    case "update-ref":
      return blocked(`git ${subcommand} descarta cambios o reescribe el historial y no se puede deshacer con seguridad.`);
    case "reset":
      return args.some((arg) => ["--hard", "--merge", "--keep"].includes(arg))
        ? blocked("git reset --hard descarta cambios sin posibilidad de recuperarlos.")
        : ALLOWED;
    case "switch":
      return args.some((arg) => ["-f", "--force", "--discard-changes", "-C", "--force-create"].includes(arg))
        ? blocked("esa forma de git switch descarta cambios o pisa una rama.")
        : ALLOWED;
    case "branch":
      return args.some((arg) => ["-D", "-M", "-f", "--force"].includes(arg))
        ? blocked("borrar o pisar ramas a la fuerza no se puede deshacer con seguridad.")
        : ALLOWED;
    case "stash":
      return ["drop", "clear"].includes(args[0] ?? "") ? blocked("borrar cambios guardados con stash no se puede deshacer.") : ALLOWED;
    case "config":
      return writesHooksPath(args) ? blocked("no se pueden cambiar los hooks de git.") : ALLOWED;
    case "apply":
    case "am":
      // Un parche cambia archivos sin nombrarlos en el comando, también los protegidos.
      return context.maintenance
        ? ALLOWED
        : blocked(`git ${subcommand} aplica un parche que puede cambiar archivos protegidos sin que se vea. Edita los archivos uno a uno.`);
    case "commit":
      return checkCommit(args, context);
    case "push":
      return checkPush(args, context);
    case "merge":
      return context.config.commitPolicy === "rama" && isMainBranch(context.getCurrentBranch(), context)
        ? blocked(`no se mezclan cambios en ${context.config.mainBranch} desde aquí: se hace con una PR.`)
        : ALLOWED;
    default:
      return ALLOWED;
  }
}

/** Leer `core.hooksPath` es inofensivo; cambiarlo o borrarlo desactiva el pre-push. */
function writesHooksPath(args) {
  if (!args.some((arg) => /hooksPath/i.test(arg))) return false;
  if (args.some((arg) => CONFIG_WRITE_OPTIONS.has(arg))) return true;
  if (args.some((arg) => CONFIG_READ_OPTIONS.has(arg))) return false;
  const positional = args.filter((arg) => !arg.startsWith("-"));
  const keyIndex = positional.findIndex((arg) => /hooksPath/i.test(arg));
  return positional.length > keyIndex + 1;
}

function checkCommit(args, context) {
  if (args.includes("-n")) return blocked("-n se salta las comprobaciones del proyecto.");
  if (context.config.commitPolicy === "persona") {
    return blocked("en este proyecto los commits los hace la persona. Deja los cambios sin commitear.");
  }
  if (isMainBranch(context.getCurrentBranch(), context)) {
    return blocked(`estás en la rama principal (${context.config.mainBranch}). Crea antes una rama de trabajo: \`git switch -c cambio/<nombre>\`.`);
  }
  return ALLOWED;
}

function checkPush(args, context) {
  const { mainBranch, commitPolicy } = context.config;
  if (commitPolicy === "persona") return blocked("en este proyecto el push lo hace la persona.");

  const forbiddenFlag = args.find((arg) => PUSH_FORBIDDEN_FLAGS.has(arg) || arg.startsWith("--force-with-lease"));
  if (forbiddenFlag) return blocked(`git push ${forbiddenFlag} puede borrar o pisar trabajo publicado.`);

  const positional = args.filter((arg) => !arg.startsWith("-"));
  const refspecs = positional.slice(1);
  if (refspecs.length === 0) {
    return isMainBranch(context.getCurrentBranch(), context)
      ? blocked(`no se sube nada a ${mainBranch} directamente: crea una rama de trabajo y abre una PR.`)
      : ALLOWED;
  }
  for (const refspec of refspecs) {
    if (refspec.startsWith("+") || refspec.startsWith(":")) {
      return blocked(`git push ${refspec} pisa o borra una rama publicada.`);
    }
    const destination = (refspec.split(":").pop() ?? "").replace(/^refs\/heads\//, "");
    const target = destination === "HEAD" ? context.getCurrentBranch() : destination;
    if (isMainBranch(target, context)) {
      return blocked(`no se sube nada a ${mainBranch} directamente: crea una rama de trabajo y abre una PR.`);
    }
  }
  return ALLOWED;
}

/** La rama principal, o una rama desconocida (por seguridad se trata igual). */
function isMainBranch(branch, context) {
  return branch === "" || branch === context.config.mainBranch;
}

// ---------- gh (GitHub CLI) ----------

function checkGitHubCli(segment, context) {
  const invocation = findInvocation(segment, "gh");
  if (!invocation) return ALLOWED;
  const [group = "", action = "", ...args] = invocation.args;

  // Ningún merge automático ni desde el agente: una persona aprueba y mezcla la PR en GitHub, después de mirar la
  // preview. Las comprobaciones solo ven lo que tiene tests; si el resultado es el que se pidió, solo lo ve alguien.
  if (group === "pr" && action === "merge") {
    return blocked("las PRs las aprueba y las mezcla una persona en GitHub; el agente no las mezcla, tampoco con --auto.");
  }
  if (group === "pr" && action === "review" && args.some((arg) => arg === "--approve" || arg === "-a")) {
    return blocked("aprobar una PR le toca a una persona en GitHub, no al agente.");
  }
  // Las etiquetas pueden autorizar algo en la CI (p. ej. tocar rutas protegidas): las pone una persona.
  if (group === "label" && action !== "list") return blocked(`gh label ${action} cambia las etiquetas del repositorio en GitHub.`);
  if (group === "pr" && action === "edit" && args.some((arg) => /^--(add|remove)-label/.test(arg))) {
    return blocked("las etiquetas de una PR las pone o las quita una persona en GitHub: algunas autorizan cambios en la CI.");
  }
  if (group === "api" && apiMethod(invocation.args) !== "GET") {
    return blocked("con `gh api` solo se permite leer (GET): escribir podría cambiar la configuración del repositorio.");
  }
  if ((group === "secret" || group === "variable") && action !== "list") {
    return blocked(`gh ${group} ${action} cambia la configuración del repositorio en GitHub.`);
  }
  if (group === "repo" && ["delete", "edit", "archive", "unarchive", "rename"].includes(action)) {
    return blocked(`gh repo ${action} cambia o borra el repositorio.`);
  }
  if (group === "workflow" && action === "disable") return blocked("no se pueden desactivar los workflows de la CI.");
  if (group === "auth" && (action === "token" || args.includes("--show-token") || args.includes("-t"))) {
    return blocked("ese comando muestra el token de GitHub.");
  }
  return ALLOWED;
}

// ---------- npm ----------

/** Si el proyecto protege package.json o su lock, el agente no los reescribe con npm aunque no los nombre. */
function checkPackageManifest(segment, context) {
  if (context.maintenance) return ALLOWED;
  const protectsManifest = context.config.protectedPaths.some((protectedPath) => MANIFEST_FILES.includes(protectedPath.toLowerCase()));
  if (!protectsManifest) return ALLOWED;
  const invocation = findInvocation(segment, "npm");
  const [subcommand = "", pkgAction = ""] = invocation?.args.filter((arg) => !arg.startsWith("-")) ?? [];
  if (!NPM_MANIFEST_SUBCOMMANDS.has(subcommand.toLowerCase())) return ALLOWED;
  if (subcommand === "pkg" && pkgAction === "get") return ALLOWED;
  return blocked(`npm ${subcommand} cambia package.json o su lock, que son rutas protegidas. Para instalar lo que ya está en el lock, usa \`npm ci\`; añadir, quitar o actualizar dependencias lo hace alguien técnico.`);
}

function apiMethod(args) {
  const methodIndex = args.findIndex((arg) => arg === "-X" || arg === "--method");
  if (methodIndex >= 0) return (args[methodIndex + 1] ?? "").toUpperCase();
  const inlineMethod = args.find((arg) => arg.startsWith("--method="));
  if (inlineMethod) return inlineMethod.slice("--method=".length).toUpperCase();
  const sendsFields = args.some((arg) => ["-f", "-F", "--field", "--raw-field", "--input"].includes(arg));
  return sendsFields ? "POST" : "GET";
}

// ---------- utilidades ----------

function matchesAny(name, patterns) {
  return patterns.some((pattern) => toolMatcher(pattern)(name));
}

function toForwardSlashes(text) {
  return text.replace(/\\/g, "/");
}
