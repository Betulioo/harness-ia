// Configuración del harness en cada proyecto: `.claude/harness.json`, mezclada con los valores por defecto.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const CONFIG_PATH = ".claude/harness.json";

export const COMMIT_POLICIES = Object.freeze(["persona", "rama"]);

// Lo que protege al propio harness: si el agente pudiera editarlo, podría desactivar sus protecciones.
export const HARNESS_PATHS = Object.freeze([
  ".claude/settings.json",
  ".claude/settings.local.json",
  CONFIG_PATH,
  ".githooks/",
  ".github/workflows/",
]);

// Herramientas que mezclan, aprueban o programan el merge de una PR, venga de un MCP o de la app: lo hace una persona.
export const HARNESS_BLOCKED_TOOLS = Object.freeze([
  "/__(merge_pull_request|approve_pull_request|set_auto_merge|enable_auto_merge|enable_pull_request_auto_merge)$/",
]);

export const DEFAULT_CONFIG = Object.freeze({
  mainBranch: "main",
  // "persona": el agente nunca hace commit ni push (los hace alguien técnico).
  // "rama": el agente hace commit y push solo en ramas de trabajo y abre una PR; nada llega a main sin la CI.
  commitPolicy: "persona",
  verifyCommand: null,
  protectedPaths: [],
  blockedTools: [],
  blockedCommands: [],
});

export function loadConfig(projectDir) {
  const configFile = path.join(projectDir, CONFIG_PATH);
  const projectConfig = existsSync(configFile) ? JSON.parse(readFileSync(configFile, "utf8")) : {};
  const config = {
    ...DEFAULT_CONFIG,
    ...projectConfig,
    protectedPaths: [...HARNESS_PATHS, ...(projectConfig.protectedPaths ?? [])],
    blockedTools: [...HARNESS_BLOCKED_TOOLS, ...(projectConfig.blockedTools ?? [])],
  };
  if (!COMMIT_POLICIES.includes(config.commitPolicy)) {
    throw new Error(`commitPolicy debe ser ${COMMIT_POLICIES.join(" o ")}, no "${config.commitPolicy}"`);
  }
  // Una expresión mal escrita se descubre al cargar, no a mitad de una evaluación del guardián.
  config.blockedTools.forEach(toolMatcher);
  config.blockedCommands.forEach((rule) => compilePattern(rule.pattern));
  return config;
}

/**
 * Función que dice si un nombre de herramienta encaja con una entrada de `blockedTools`: nombre exacto, prefijo
 * terminado en `*` (`mcp__vercel__*`) o expresión regular entre barras (`/__execute_sql$/`). La expresión sirve para
 * los conectores que llegan con un prefijo que no se conoce de antemano (`mcp__<uuid>__execute_sql`).
 */
export function toolMatcher(pattern) {
  if (pattern.length > 2 && pattern.startsWith("/") && pattern.endsWith("/")) {
    const expression = compilePattern(pattern.slice(1, -1));
    return (toolName) => expression.test(toolName);
  }
  if (pattern.endsWith("*")) return (toolName) => toolName.startsWith(pattern.slice(0, -1));
  return (toolName) => toolName === pattern;
}

function compilePattern(pattern) {
  try {
    return new RegExp(pattern, "i");
  } catch (error) {
    throw new Error(`la expresión "${pattern}" no es válida (${error.message})`);
  }
}

/**
 * ¿Hay trabajo sin verificar? Cambios sin commitear o commits que aún no se han subido (por delante de la rama
 * remota o, si no tiene, de la principal). Si git no responde, se verifica: es más seguro que dar el turno por bueno.
 */
export function hasWorkToVerify(directory, mainBranch) {
  const runGit = (args) =>
    execFileSync("git", args, { cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  try {
    if (runGit(["status", "--porcelain"]) !== "") return true;
  } catch {
    return true;
  }
  for (const base of ["@{upstream}", mainBranch]) {
    try {
      return Number(runGit(["rev-list", "--count", `${base}..HEAD`])) > 0;
    } catch {
      // Sin rama remota: se prueba con la principal.
    }
  }
  return true;
}

/** Rama actual, o "" si no se puede saber (fuera de git o HEAD separado se tratan como la rama principal). */
export function readCurrentBranch(directory) {
  try {
    const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: directory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return branch === "HEAD" ? "" : branch;
  } catch {
    return "";
  }
}
