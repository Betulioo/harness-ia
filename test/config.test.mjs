// Tests de la configuración: valores por defecto y que las protecciones del harness no se puedan quitar.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { HARNESS_PATHS, loadConfig } from "../plugin/hooks/config.mjs";

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
});
