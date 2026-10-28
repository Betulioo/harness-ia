# 2026-10-28 · luis · cambio/0.6.0

Versión 0.6.0: lo que vive en el plugin del informe de auditoría de moneyball-web
(`moneyball-web/harness-audits/2026-10-26-2140-report.md`, ISSUE-22, 23, 31, 35, 38 y la parte del plugin de 24).
Paso P10 del plan de moneyball-web. Rama sacada de `v0.5.0`: `cambio/auditoria-0.5.0` ya estaba mezclada (PR #1).

## Decisiones

- **Las etiquetas, en todas sus formas y salvo en mantenimiento** (ISSUE-22). Además de `gh label` y
  `gh pr edit --add-label|--remove-label`, el guardián bloquea `gh pr|issue create|edit` con `--label`, `-l` (también
  pegada o agrupada, `-dl`) y `--add-label|--remove-label`, y las herramientas de MCP que cambian etiquetas (nombre con
  «label» que no empieza por list/get/search/read, o que reciben `labels` no vacío). Bloquea cualquier etiqueta, no
  solo `mantenimiento`: el plugin no sabe qué etiqueta autoriza algo en cada proyecto. En mantenimiento se permiten,
  como pedía la auditoría; antes `gh label` y `gh pr edit` se bloqueaban siempre.
- **`gh api` ya bloqueaba toda escritura**; lo que faltaba eran las formas pegadas: `-XPOST`, `-fcampo=x`, `--field=x`
  y letras agrupadas (`-iX`). Se tratan como escritura. Ante la duda, no es GET.
- **`gh alias set|import` bloqueado siempre**: un atajo ejecuta otra orden con un nombre que el guardián no reconoce
  (también serviría para un merge).
- **Rutas protegidas desde la copia que contiene el archivo** (ISSUE-23). Primero, relativa al proyecto; después,
  quitando `.claude/worktrees/<n>/` (funciona sin git); por último, relativa a la raíz que da
  `git rev-parse --show-toplevel` desde la carpeta del archivo, si comparte `--git-common-dir` con el proyecto (un
  worktree del mismo repo, esté donde esté). Un archivo de otro repositorio no cuenta como del proyecto.
- **El fin de turno verifica la copia donde trabaja la sesión**: la raíz del repo de `hookInput.cwd` si es el mismo
  repositorio; si no, la carpeta del proyecto. La configuración se sigue leyendo de la carpeta del proyecto.
- **Mantenimiento solo desde la variable puesta al arrancar** (ISSUE-31). Claude Code no le dice al hook de dónde
  viene una variable, así que no se puede distinguir la fuente. Alternativa: si `HARNESS_MAINTENANCE` aparece en el
  `env` de algún `settings.json`/`settings.local.json` (de la persona, en `CLAUDE_CONFIG_DIR` o `~/.claude`, o del
  proyecto y su worktree), el mantenimiento no se activa y el motivo de bloqueo lo explica. Un archivo que no es JSON
  válido y la menciona tampoco se da por limpio. Y el guardián bloquea fijarla: `setx`, `SetEnvironmentVariable`,
  `reg add`, mencionarla junto a una escritura por terminal, o escribirla en un archivo fuera del proyecto
  (`~/.bashrc`). Leerla (`process.env.…`, `$env:…`, `$…`) o ponerla para una sola orden sigue permitido.
- **El fin de turno no deja terminar si no puede leer** (ISSUE-35): sale con 2 y un mensaje si la petición o
  `harness.json` no se pueden leer. Con `stop_hook_active` y la configuración rota sale con 0 para no entrar en bucle
  (ya avisó en ese turno).
- **`iniciar-sesion` compara la versión** (ISSUE-24): la de `plugin.json` junto a la skill con el `ref` del
  marketplace en `.claude/settings.json`; si no coinciden, lo avisa en la primera línea y sigue. Es una instrucción
  de la skill, no un hook: no está comprobada por la herramienta.
- `tests-semanticos` revisa los criterios 1–6 (ISSUE-38). `package.json` estaba en 0.4.0; ahora los dos manifiestos
  dicen 0.6.0 y un test exige que coincidan.

## Hechos comprobados

- `npm run verify`: 81 tests en verde (28 nuevos).
- Cada regla nueva se rompió a propósito y su test falló (worktree sin git, fin de turno en el worktree; el de
  `$PROFILE` falló de verdad antes de corregir la expresión de lectura).
- `guard.mjs` de punta a punta, con git real y un worktree fuera del proyecto: bloquea editar su `CLAUDE.md`, deja
  editar `src/`, lo permite con `HARNESS_MAINTENANCE=1`, lo vuelve a bloquear si la variable está también en
  `settings.json` (con la nota en el motivo) y bloquea `gh pr create --fill --label mantenimiento`.

## Sin comprobar

- Qué `CLAUDE_PROJECT_DIR` llega en una sesión de worktree de la app. El arreglo funciona con las dos respuestas
  (carpeta principal o worktree), pero no se ha visto en una sesión real.
- Qué hace `gh` de verdad con las formas pegadas (`-XPOST`, `-fcampo=x`): se bloquean por si acaso; `gh` no está en
  el PATH de esta terminal.
- Que las variables del `env` de `settings.json` lleguen a los hooks (se supone; por eso se ignoran).
- Los nombres reales de las herramientas de etiquetas del MCP de GitHub (`add_labels`, `update_issue` con `labels`…):
  la regla va por la forma, no por una lista.

## Errores y correcciones

- La primera versión de la lectura de la variable quitaba también `$env:HARNESS_MAINTENANCE = "1"`, y escribirlo en
  `$PROFILE` pasaba → la lectura no cuenta si lleva `=` detrás.
- El guardián 0.5.0 instalado en este equipo paró el montaje de la prueba de punta a punta (el comando nombraba un
  `harness.json` de prueba en la carpeta temporal) → los archivos de prueba se crearon con Write.
