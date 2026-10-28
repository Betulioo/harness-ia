// Tests del hook de fin de turno: se lanza el script como lo lanza Claude Code (petición por la entrada estándar).
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const HOOK_SCRIPT = fileURLToPath(new URL("../plugin/hooks/verify-on-stop.mjs", import.meta.url));
const BLOCK_EXIT_CODE = 2;
// Falla solo si en la carpeta donde se ejecuta hay un archivo roto.txt.
const VERIFY_COMMAND = "node -e \"process.exit(require('fs').existsSync('roto.txt') ? 1 : 0)\"";

const temporaryDirs = [];
after(() => temporaryDirs.forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const git = (directory, ...args) =>
  execFileSync("git", ["-c", "user.name=prueba", "-c", "user.email=prueba@example.com", "-c", "commit.gpgsign=false", ...args], {
    cwd: directory,
    stdio: "ignore",
  });

function projectWithConfig(configText) {
  const projectDir = mkdtempSync(path.join(tmpdir(), "harness-ia-stop-"));
  temporaryDirs.push(projectDir);
  mkdirSync(path.join(projectDir, ".claude"));
  writeFileSync(path.join(projectDir, ".claude", "harness.json"), configText);
  git(projectDir, "init", "-b", "main");
  git(projectDir, "add", ".");
  git(projectDir, "commit", "-m", "inicio");
  return projectDir;
}

function runHook({ projectDir, input }) {
  const result = spawnSync(process.execPath, [HOOK_SCRIPT], {
    input,
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });
  return { exitCode: result.status, message: result.stderr };
}

describe("Fin de turno: si no puede comprobar, no deja terminar", () => {
  it("con una petición ilegible, para el turno y lo explica", () => {
    const projectDir = projectWithConfig(JSON.stringify({ verifyCommand: VERIFY_COMMAND }));

    const result = runHook({ projectDir, input: "esto no es JSON" });

    assert.equal(result.exitCode, BLOCK_EXIT_CODE);
    assert.match(result.message, /No se ha podido comprobar el trabajo/);
  });

  it("con un harness.json roto, para el turno y lo explica", () => {
    const projectDir = projectWithConfig('{ "verifyCommand": ');

    const result = runHook({ projectDir, input: JSON.stringify({ cwd: projectDir }) });

    assert.equal(result.exitCode, BLOCK_EXIT_CODE);
    assert.match(result.message, /harness\.json no es válido/);
  });

  it("si ya avisó en este turno (stop_hook_active), no vuelve a parar", () => {
    const projectDir = projectWithConfig('{ "verifyCommand": ');

    const result = runHook({ projectDir, input: JSON.stringify({ cwd: projectDir, stop_hook_active: true }) });

    assert.equal(result.exitCode, 0);
  });
});

describe("Fin de turno: verifica la copia donde trabaja la sesión", () => {
  function projectWithBrokenWorktree() {
    const projectDir = projectWithConfig(JSON.stringify({ verifyCommand: VERIFY_COMMAND }));
    const worktreeDir = path.join(projectDir, ".claude", "worktrees", "sesion");
    git(projectDir, "worktree", "add", "-b", "sesion", worktreeDir);
    writeFileSync(path.join(worktreeDir, "roto.txt"), "cambio sin commitear que rompe la verificación");
    return { projectDir, worktreeDir };
  }

  it("en un worktree, verifica el worktree aunque la carpeta principal esté limpia", () => {
    const { projectDir, worktreeDir } = projectWithBrokenWorktree();

    const result = runHook({ projectDir, input: JSON.stringify({ cwd: worktreeDir }) });

    assert.equal(result.exitCode, BLOCK_EXIT_CODE);
    assert.match(result.message, /La verificación .* falla/);
  });

  it("en la carpeta principal limpia, no hay nada que verificar", () => {
    const { projectDir } = projectWithBrokenWorktree();

    const result = runHook({ projectDir, input: JSON.stringify({ cwd: projectDir }) });

    assert.equal(result.exitCode, 0);
  });
});
