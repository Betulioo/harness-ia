// Hook Stop: si hay cambios sin commitear o commits sin subir, ejecuta el comando de verificación del proyecto antes
// de que el agente termine el turno. Si falla, le devuelve la salida para que lo corrija o explique por qué no puede.
// Es el "terminado" de la lista de cierre, comprobado por la herramienta y no por la memoria del agente.
// Si no puede leer la petición o la configuración, tampoco deja terminar: salir con 1 (un error sin capturar) no para
// el turno, y el trabajo quedaría sin verificar sin que nadie lo sepa.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { findWorktreeRoot, hasWorkToVerify, loadConfig } from "./config.mjs";

const BLOCK_EXIT_CODE = 2;
const OUTPUT_TAIL_LINES = 40;
const VERIFY_TIMEOUT_MS = 9 * 60 * 1000;

function tail(text, lineCount) {
  return text.trim().split("\n").slice(-lineCount).join("\n");
}

function stopTurn(message) {
  process.stderr.write(`${message}\n`);
  process.exit(BLOCK_EXIT_CODE);
}

function readHookInput() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch (error) {
    return stopTurn(
      `No se ha podido comprobar el trabajo: el hook de fin de turno no entendió la petición (${error.message}). ` +
        "Díselo a la persona y no des el trabajo por terminado hasta que alguien técnico lo revise.",
    );
  }
}

function readConfig(projectDir, hookInput) {
  try {
    return loadConfig(projectDir);
  } catch (error) {
    // stop_hook_active: ya se avisó en este turno; repetirlo solo haría un bucle.
    if (hookInput.stop_hook_active) process.exit(0);
    return stopTurn(
      `No se ha podido comprobar el trabajo: .claude/harness.json no es válido (${error.message}). ` +
        "Díselo a la persona en lenguaje llano y no des el trabajo por terminado; lo corrige alguien técnico.",
    );
  }
}

const hookInput = readHookInput();
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? hookInput.cwd ?? process.cwd();
const { verifyCommand, mainBranch } = readConfig(projectDir, hookInput);
// Se verifica la copia donde trabaja la sesión: en un worktree, el worktree, no la carpeta principal del proyecto.
const workingDir = (hookInput.cwd ? findWorktreeRoot(hookInput.cwd, projectDir) : undefined) ?? projectDir;

// stop_hook_active: el agente ya está respondiendo a un fallo de este hook; no se repite para no entrar en bucle.
const shouldVerify = !hookInput.stop_hook_active && verifyCommand && hasWorkToVerify(workingDir, mainBranch);

if (shouldVerify) {
  try {
    execSync(verifyCommand, { cwd: workingDir, encoding: "utf8", stdio: "pipe", timeout: VERIFY_TIMEOUT_MS });
  } catch (error) {
    const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    stopTurn(
      `La verificación (\`${verifyCommand}\`) falla con los cambios actuales:\n\n${tail(output, OUTPUT_TAIL_LINES)}\n\n` +
        "Corrígelo antes de terminar. Si no puedes, explícale a la persona en lenguaje llano qué falla y por qué; " +
        "no desactives ni te saltes la comprobación.",
    );
  }
}
