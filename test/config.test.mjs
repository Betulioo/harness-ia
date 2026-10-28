// Tests de la configuración: valores por defecto y que las protecciones del harness no se puedan quitar.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { findWorktreeRoot, HARNESS_BLOCKED_TOOLS, HARNESS_PATHS, hasWorkToVerify, loadConfig, readMaintenance, settingsFilesFor } from "../plugin/hooks/config.mjs";

const temporaryDirs = [];

function projectWithConfig(configText) {
  const projectDir = mkdtempSync(path.join(tmpdir(), "harness-ia-"));
  temporaryDirs.push(projectDir);
  if (configText !== undefined) {
    mkdirSync(path.join(projectDir, ".claude"));
    writeFileSync(path.join(projectDir, ".claude", "harness.json"), configText);
  }
  return projectDir;
}

const git = (directory, ...args) =>
  execFileSync("git", ["-c", "user.name=prueba", "-c", "user.email=prueba@example.com", "-c", "commit.gpgsign=false", ...args], {
    cwd: directory,
    stdio: "ignore",
  });

after(() => temporaryDirs.forEach((directory) => rmSync(directory, { recursive: true, force: true })));

describe("Configuración del harness", () => {
  it("sin harness.json, la política es persona (el agente no hace commits)", () => {
    const result = loadConfig(projectWithConfig());

    assert.equal(result.commitPolicy, "persona");
  });

  it("las rutas del proyecto se suman a las del harness, no las sustituyen", () => {
    const projectDir = projectWithConfig(JSON.stringify({ protectedPaths: ["supabase/migrations/"] }));

    const result = loadConfig(projectDir);

    assert.deepEqual(result.protectedPaths, [...HARNESS_PATHS, "supabase/migrations/"]);
  });

  it("una política desconocida es un error, no se ignora", () => {
    const projectDir = projectWithConfig(JSON.stringify({ commitPolicy: "libre" }));

    const loading = () => loadConfig(projectDir);

    assert.throws(loading, /commitPolicy/);
  });

  it("las herramientas bloqueadas del proyecto se suman a las del harness, no las sustituyen", () => {
    const projectDir = projectWithConfig(JSON.stringify({ blockedTools: ["mcp__vercel__*"] }));

    const result = loadConfig(projectDir);

    assert.deepEqual(result.blockedTools, [...HARNESS_BLOCKED_TOOLS, "mcp__vercel__*"]);
  });

  it("una expresión mal escrita en blockedTools o blockedCommands es un error al cargar", () => {
    const badTool = projectWithConfig(JSON.stringify({ blockedTools: ["/__(execute_sql$/"] }));
    const badCommand = projectWithConfig(JSON.stringify({ blockedCommands: [{ pattern: "psql(", reason: "x" }] }));

    const results = [() => loadConfig(badTool), () => loadConfig(badCommand)];

    results.forEach((loading) => assert.throws(loading, /no es válida/));
  });
});

describe("Fin de turno: qué trabajo hay que verificar", () => {
  function repositoryOnMain() {
    const directory = projectWithConfig();
    git(directory, "init", "-b", "main");
    writeFileSync(path.join(directory, "a.txt"), "a");
    git(directory, "add", "a.txt");
    git(directory, "commit", "-m", "inicio");
    return directory;
  }

  it("sin cambios ni commits nuevos, no hay nada que verificar", () => {
    const directory = repositoryOnMain();

    assert.equal(hasWorkToVerify(directory, "main"), false);
  });

  it("verifica los cambios sin commitear", () => {
    const directory = repositoryOnMain();
    writeFileSync(path.join(directory, "a.txt"), "cambiado");

    assert.equal(hasWorkToVerify(directory, "main"), true);
  });

  it("verifica los commits que aún no se han subido, aunque el árbol esté limpio", () => {
    const directory = repositoryOnMain();
    git(directory, "switch", "-c", "cambio/x");
    writeFileSync(path.join(directory, "b.txt"), "b");
    git(directory, "add", "b.txt");
    git(directory, "commit", "-m", "cambio");

    assert.equal(hasWorkToVerify(directory, "main"), true);
  });

  it("si git no responde (fuera de un repositorio), verifica por si acaso", () => {
    const directory = projectWithConfig();

    assert.equal(hasWorkToVerify(directory, "main"), true);
  });
});

describe("Worktrees: la copia del repositorio que contiene un archivo", () => {
  function repositoryWithWorktree() {
    const projectDir = projectWithConfig();
    git(projectDir, "init", "-b", "main");
    writeFileSync(path.join(projectDir, "CLAUDE.md"), "reglas");
    git(projectDir, "add", "CLAUDE.md");
    git(projectDir, "commit", "-m", "inicio");
    git(projectDir, "worktree", "add", "-b", "sesion", path.join(".claude", "worktrees", "sesion"));
    return { projectDir, worktreeDir: realpathSync(path.join(projectDir, ".claude", "worktrees", "sesion")) };
  }

  it("un archivo de un worktree del proyecto, aunque aún no exista, pertenece a ese worktree", () => {
    const { projectDir, worktreeDir } = repositoryWithWorktree();

    const results = [
      findWorktreeRoot(path.join(worktreeDir, "CLAUDE.md"), projectDir),
      findWorktreeRoot(path.join(worktreeDir, "supabase", "migrations", "066_x.sql"), projectDir),
      findWorktreeRoot(worktreeDir, projectDir),
    ];

    results.forEach((root) => assert.equal(path.relative(worktreeDir, root), ""));
  });

  it("un archivo de la carpeta principal pertenece a la carpeta principal", () => {
    const { projectDir } = repositoryWithWorktree();

    const root = findWorktreeRoot(path.join(projectDir, "CLAUDE.md"), projectDir);

    assert.equal(path.relative(realpathSync(projectDir), root), "");
  });

  it("un archivo de otro repositorio, o fuera de git, no es del proyecto", () => {
    const { projectDir } = repositoryWithWorktree();
    const otherRepository = projectWithConfig();
    git(otherRepository, "init", "-b", "main");

    const results = [findWorktreeRoot(path.join(otherRepository, "CLAUDE.md"), projectDir), findWorktreeRoot(path.join(projectWithConfig(), "CLAUDE.md"), projectDir)];

    assert.deepEqual(results, [undefined, undefined]);
  });
});

describe("Modo mantenimiento: solo desde la variable puesta al arrancar", () => {
  function settingsFile(content) {
    const directory = projectWithConfig();
    const file = path.join(directory, "settings.json");
    writeFileSync(file, content);
    return file;
  }

  it("sin HARNESS_MAINTENANCE=1, no está activo", () => {
    const result = readMaintenance({ HARNESS_MAINTENANCE: "0" }, []);

    assert.deepEqual(result, { active: false, ignoredBecause: [] });
  });

  it("con la variable y ningún ajuste que la defina, está activo", () => {
    const cleanSettings = settingsFile(JSON.stringify({ env: { HARNESS_PERSONA: "luis" } }));

    const result = readMaintenance({ HARNESS_MAINTENANCE: "1" }, [cleanSettings, path.join(projectWithConfig(), "no-existe.json")]);

    assert.deepEqual(result, { active: true, ignoredBecause: [] });
  });

  it("si un settings.json la define, no vale, aunque el archivo no sea JSON válido", () => {
    const withVariable = settingsFile(JSON.stringify({ env: { HARNESS_MAINTENANCE: "1" } }));
    const broken = settingsFile('{ "env": { "HARNESS_MAINTENANCE": "1", }');

    const result = readMaintenance({ HARNESS_MAINTENANCE: "1" }, [withVariable, broken]);

    assert.deepEqual(result, { active: false, ignoredBecause: [withVariable, broken] });
  });

  it("se miran los ajustes de la persona y los de cada carpeta del proyecto, sin repetir", () => {
    const result = settingsFilesFor({ claudeConfigDir: path.join("casa", ".claude"), projectDirs: ["proyecto", "proyecto"] });

    assert.deepEqual(result, [
      path.join("casa", ".claude", "settings.json"),
      path.join("casa", ".claude", "settings.local.json"),
      path.join("proyecto", ".claude", "settings.json"),
      path.join("proyecto", ".claude", "settings.local.json"),
    ]);
  });
});
