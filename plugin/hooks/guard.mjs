// Hook PreToolUse: antes de cada herramienta, decide si puede ejecutarse (reglas en guard-rules.mjs).
// Salir con 2 bloquea la herramienta y Claude Code le pasa al agente el motivo escrito en stderr.
// Si algo falla al leer la petición, la configuración o al evaluar las reglas, bloquea: es más seguro parar que dejar
// pasar (un error sin capturar sale con 1, y Claude Code no lo trata como bloqueo).
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { loadConfig, readCurrentBranch } from "./config.mjs";
import { evaluateToolUse } from "./guard-rules.mjs";

const BLOCK_EXIT_CODE = 2;

function block(reason) {
  process.stderr.write(`Bloqueado por el harness: ${reason}\n`);
  process.exit(BLOCK_EXIT_CODE);
}

function readHookInput() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch (error) {
    return block(`no se pudo leer la petición del hook (${error.message}).`);
  }
}

function readConfig(projectDir) {
  try {
    return loadConfig(projectDir);
  } catch (error) {
    return block(`.claude/harness.json no es válido: ${error.message}`);
  }
}

const hookInput = readHookInput();
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? hookInput.cwd ?? process.cwd();
const workingDir = hookInput.cwd ?? projectDir;

function evaluate(config) {
  try {
    return evaluateToolUse(hookInput, {
      config,
      projectDir,
      homeDir: homedir(),
      // Solo los comandos de git lo necesitan; se lee bajo demanda para no lanzar git en cada herramienta.
      getCurrentBranch: () => readCurrentBranch(workingDir),
      maintenance: process.env.HARNESS_MAINTENANCE === "1",
    });
  } catch (error) {
    return { blocked: true, reason: `el guardián falló al revisar la orden (${error.message}). Avisa a alguien técnico.` };
  }
}

const verdict = evaluate(readConfig(projectDir));

if (verdict.blocked) block(verdict.reason);
