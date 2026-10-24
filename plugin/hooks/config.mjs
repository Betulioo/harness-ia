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
  };
  if (!COMMIT_POLICIES.includes(config.commitPolicy)) {
    throw new Error(`commitPolicy debe ser ${COMMIT_POLICIES.join(" o ")}, no "${config.commitPolicy}"`);
  }
  return config;
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
