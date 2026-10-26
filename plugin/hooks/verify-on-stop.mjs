// Hook Stop: si hay cambios sin commitear o commits sin subir, ejecuta el comando de verificación del proyecto antes
// de que el agente termine el turno. Si falla, le devuelve la salida para que lo corrija o explique por qué no puede.
// Es el "terminado" de la lista de cierre, comprobado por la herramienta y no por la memoria del agente.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { hasWorkToVerify, loadConfig } from "./config.mjs";

const BLOCK_EXIT_CODE = 2;
const OUTPUT_TAIL_LINES = 40;
const VERIFY_TIMEOUT_MS = 9 * 60 * 1000;

function tail(text, lineCount) {
  return text.trim().split("\n").slice(-lineCount).join("\n");
}

const hookInput = JSON.parse(readFileSync(0, "utf8"));
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? hookInput.cwd ?? process.cwd();
const { verifyCommand, mainBranch } = loadConfig(projectDir);

// stop_hook_active: el agente ya está respondiendo a un fallo de este hook; no se repite para no entrar en bucle.
const shouldVerify = !hookInput.stop_hook_active && verifyCommand && hasWorkToVerify(projectDir, mainBranch);

if (shouldVerify) {
  try {
    execSync(verifyCommand, { cwd: projectDir, encoding: "utf8", stdio: "pipe", timeout: VERIFY_TIMEOUT_MS });
  } catch (error) {
    const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    process.stderr.write(
      `La verificación (\`${verifyCommand}\`) falla con los cambios actuales:\n\n${tail(output, OUTPUT_TAIL_LINES)}\n\n` +
        "Corrígelo antes de terminar. Si no puedes, explícale a la persona en lenguaje llano qué falla y por qué; " +
        "no desactives ni te saltes la comprobación.\n",
    );
    process.exit(BLOCK_EXIT_CODE);
  }
}
