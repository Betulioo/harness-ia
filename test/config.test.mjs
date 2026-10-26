// Tests de la configuración: valores por defecto y que las protecciones del harness no se puedan quitar.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { HARNESS_BLOCKED_TOOLS, HARNESS_PATHS, hasWorkToVerify, loadConfig } from "../plugin/hooks/config.mjs";

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
  const git = (directory, ...args) =>
    execFileSync("git", ["-c", "user.name=prueba", "-c", "user.email=prueba@example.com", "-c", "commit.gpgsign=false", ...args], {
      cwd: directory,
      stdio: "ignore",
    });

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
