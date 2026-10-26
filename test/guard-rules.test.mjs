// Tests de las reglas del guardián: cada test nombra la protección que comprueba (ver README, "Qué bloquea").
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_CONFIG, HARNESS_PATHS } from "../plugin/hooks/config.mjs";
import { evaluateToolUse } from "../plugin/hooks/guard-rules.mjs";

const PROJECT_DIR = "/proyecto";

function buildContext({ branch = "cambio/titulo", maintenance = false, ...configOverrides } = {}) {
  return {
    config: {
      ...DEFAULT_CONFIG,
      commitPolicy: "rama",
      ...configOverrides,
      protectedPaths: [...HARNESS_PATHS, ...(configOverrides.protectedPaths ?? [])],
    },
    projectDir: PROJECT_DIR,
    getCurrentBranch: () => branch,
    maintenance,
  };
}

const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });
const fileTool = (toolName, filePath) => ({ tool_name: toolName, tool_input: { file_path: filePath } });

function isBlocked(hookInput, context = buildContext()) {
  return evaluateToolUse(hookInput, context).blocked;
}

function assertBlocked(commands, context) {
  const allowed = commands.filter((command) => !isBlocked(bash(command), context));
  assert.deepEqual(allowed, [], "estos comandos deberían estar bloqueados");
}

function assertAllowed(commands, context) {
  const rejected = commands.filter((command) => isBlocked(bash(command), context));
  assert.deepEqual(rejected, [], "estos comandos deberían estar permitidos");
}

describe("Credenciales: el agente no lee .env", () => {
  it("bloquea leer .env y .env.* con Read, Grep o Edit", () => {
    const attempts = [
      fileTool("Read", "/proyecto/.env"),
      fileTool("Read", "C:\\proyecto\\.env.local"),
      { tool_name: "Grep", tool_input: { pattern: "KEY", path: "/proyecto/.env.production" } },
      fileTool("Edit", "/proyecto/.env"),
    ];

    const results = attempts.map((attempt) => isBlocked(attempt));

    assert.deepEqual(results, [true, true, true, true]);
  });

  it("permite .env.example y archivos que solo se parecen (.envrc, env.ts)", () => {
    const attempts = [fileTool("Read", "/proyecto/.env.example"), fileTool("Read", "/proyecto/.envrc"), fileTool("Read", "/proyecto/src/env.ts")];

    const results = attempts.map((attempt) => isBlocked(attempt));

    assert.deepEqual(results, [false, false, false]);
  });

  it("bloquea comandos que mencionan .env, también dentro de otro comando", () => {
    assertBlocked(["cat .env", "type .env.local", 'bash -c "source ./.env"', "node --env-file=.env app.js", "Get-Content .env"]);
  });

  it("permite comandos que no tocan .env", () => {
    assertAllowed(["cat .env.example", "echo $NODE_ENV", "grep process.env src/app.ts"]);
  });
});

describe("Rama principal: nada llega a main sin PR (política rama)", () => {
  it("bloquea commit estando en main o en una rama desconocida", () => {
    const onMain = buildContext({ branch: "main" });
    const unknownBranch = buildContext({ branch: "" });

    const results = [isBlocked(bash('git commit -m "x"'), onMain), isBlocked(bash('git commit -m "x"'), unknownBranch)];

    assert.deepEqual(results, [true, true]);
  });

  it("permite commit en una rama de trabajo", () => {
    assertAllowed(['git add -A && git commit -m "Cambia el título"']);
  });

  it("bloquea push a main en todas sus formas", () => {
    assertBlocked(["git push origin main", "git push origin HEAD:main", "git push origin cambio/x:refs/heads/main", "git push"], buildContext({ branch: "main" }));
    assertBlocked(["git push origin main", "git push origin HEAD:main"]);
  });

  it("permite push de la rama de trabajo", () => {
    assertAllowed(["git push -u origin cambio/titulo", "git push", "git push origin HEAD"]);
  });

  it("bloquea push que pisa o borra (force, +refspec, :rama, --delete, --no-verify)", () => {
    assertBlocked([
      "git push --force origin cambio/titulo",
      "git push -f",
      "git push --force-with-lease",
      "git push origin +cambio/titulo",
      "git push origin :cambio/viejo",
      "git push --delete origin cambio/viejo",
      "git push --no-verify",
    ]);
  });

  it("bloquea merge local estando en main", () => {
    assertBlocked(["git merge cambio/titulo"], buildContext({ branch: "main" }));
  });
});

describe("Política persona: el agente no hace commit, push ni merge de PR", () => {
  it("bloquea commit, push y gh pr merge aunque se esté en una rama de trabajo", () => {
    assertBlocked(['git commit -m "x"', "git push -u origin cambio/x", "gh pr merge 12 --auto"], buildContext({ commitPolicy: "persona" }));
  });
});

describe("Cambios irreversibles en git", () => {
  it("bloquea comandos que descartan cambios o reescriben el historial", () => {
    assertBlocked([
      "git checkout -- src/app.ts",
      "git checkout main",
      "git restore .",
      "git reset --hard HEAD~1",
      "git clean -fd",
      "git rebase main",
      "git branch -D cambio/x",
      "git stash drop",
      "git switch --discard-changes main",
      'git commit -n -m "x"',
    ]);
  });

  it("permite lo que no pierde trabajo", () => {
    assertAllowed(["git status", "git diff --stat", "git switch -c cambio/nuevo", "git checkout -b cambio/nuevo", "git switch main", "git reset HEAD src/app.ts", "git stash", "git branch -d cambio/viejo", "git log --oneline -3"]);
  });
});

describe("Hooks de git: se pueden consultar, no cambiar", () => {
  it("bloquea cambiar o borrar core.hooksPath, también solo para un comando", () => {
    assertBlocked([
      "git config core.hooksPath /dev/null",
      "git config --global core.hooksPath ''",
      "git config --unset core.hooksPath",
      "git config set core.hooksPath /tmp",
      "git config --file .git/config core.hooksPath x",
      "git -c core.hooksPath=/dev/null commit -m x",
    ]);
  });

  it("permite leer core.hooksPath y la configuración", () => {
    assertAllowed(["git config core.hooksPath", "git config --get core.hooksPath", "git config get core.hooksPath", "git config --list", "git config user.name"]);
  });
});

describe("GitHub: las PRs las aprueba y mezcla una persona", () => {
  it("bloquea cualquier merge de PR, también el automático, en las dos políticas", () => {
    const commands = ["gh pr merge 12 --squash", "gh pr merge 12 --auto --squash", "gh pr merge 12 --auto --admin", "gh pr merge"];

    assertBlocked(commands, buildContext({ commitPolicy: "rama" }));
    assertBlocked(commands, buildContext({ commitPolicy: "persona" }));
  });

  it("bloquea que el agente apruebe una PR", () => {
    assertBlocked(["gh pr review 12 --approve", "gh pr review 12 -a"]);
  });

  it("permite abrir PRs, consultar su estado y comentar", () => {
    assertAllowed(['gh pr create --title "x" --body "y"', "gh pr checks 12", "gh pr view 12", 'gh pr review 12 --comment -b "listo"']);
  });
});

describe("GitHub: API y configuración del repositorio, solo lectura", () => {
  it("bloquea escrituras con gh api y cambios en la configuración del repositorio", () => {
    assertBlocked([
      "gh api -X DELETE repos/org/repo/branches/main/protection",
      "gh api repos/org/repo/rulesets -f name=x",
      "gh secret set KEY",
      "gh repo delete org/repo",
      "gh workflow disable ci.yml",
      "gh auth token",
    ]);
  });

  it("permite leer la API y listar secretos sin verlos", () => {
    assertAllowed(["gh api repos/org/repo/branches/main/protection", "gh secret list"]);
  });
});

describe("Borrados recursivos", () => {
  it("bloquea borrar carpetas con trabajo", () => {
    assertBlocked(["rm -rf src", "rm -r docs/", "rm -rf node_modules src", "Remove-Item -Recurse -Force src", "rmdir /s /q src"]);
  });

  it("permite borrar carpetas generadas y archivos sueltos", () => {
    assertAllowed(["rm -rf node_modules", "rm -rf .next ./dist/", "rm src/viejo.ts"]);
  });
});

describe("Protecciones del propio harness y rutas protegidas del proyecto", () => {
  it("bloquea editar la CI, los hooks, los settings y harness.json", () => {
    const attempts = [
      fileTool("Edit", "/proyecto/.github/workflows/ci.yml"),
      fileTool("Write", "/proyecto/.githooks/pre-push"),
      fileTool("Edit", "/proyecto/.claude/settings.json"),
      fileTool("Write", "/proyecto/.claude/harness.json"),
    ];

    const results = attempts.map((attempt) => isBlocked(attempt));

    assert.deepEqual(results, [true, true, true, true]);
  });

  it("bloquea rutas protegidas del proyecto y también su modificación por terminal", () => {
    const context = buildContext({ protectedPaths: ["supabase/migrations/", "package.json"] });

    const results = [isBlocked(fileTool("Write", "/proyecto/supabase/migrations/066_x.sql"), context), isBlocked(fileTool("Edit", "/proyecto/package.json"), context)];

    assert.deepEqual(results, [true, true]);
    assertBlocked(["echo x > .github/workflows/ci.yml", "sed -i s/a/b/ supabase/migrations/001.sql"], context);
  });

  it("permite leer rutas protegidas y editar el resto del proyecto", () => {
    const attempts = [fileTool("Read", "/proyecto/.github/workflows/ci.yml"), fileTool("Edit", "/proyecto/src/app/page.tsx")];

    const results = attempts.map((attempt) => isBlocked(attempt));

    assert.deepEqual(results, [false, false]);
    assertAllowed(["cat .github/workflows/ci.yml 2>&1", "git add .github/workflows/ci.yml"]);
  });

  it("en mantenimiento (HARNESS_MAINTENANCE=1) se pueden editar, pero .env sigue bloqueado", () => {
    const context = buildContext({ maintenance: true });

    const results = [isBlocked(fileTool("Edit", "/proyecto/.github/workflows/ci.yml"), context), isBlocked(fileTool("Read", "/proyecto/.env"), context)];

    assert.deepEqual(results, [false, true]);
  });
});

describe("Reglas propias del proyecto (.claude/harness.json)", () => {
  it("blockedTools bloquea por nombre exacto o por prefijo con *", () => {
    const context = buildContext({ blockedTools: ["mcp__supabase__apply_migration", "mcp__vercel__*"] });
    const attempts = [{ tool_name: "mcp__supabase__apply_migration" }, { tool_name: "mcp__vercel__deploy" }, { tool_name: "mcp__supabase__list_tables" }];

    const results = attempts.map((attempt) => isBlocked(attempt, context));

    assert.deepEqual(results, [true, true, false]);
  });

  it("blockedCommands bloquea con el motivo configurado", () => {
    const context = buildContext({ blockedCommands: [{ pattern: "supabase\\s+db\\s+push", reason: "las migraciones las aplica el comisionado" }] });

    const result = evaluateToolUse(bash("npx supabase db push"), context);

    assert.deepEqual(result, { blocked: true, reason: "las migraciones las aplica el comisionado" });
  });
});
