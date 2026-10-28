# Bitácora de harness-ia

La foto común del plugin: lo que hay que leer al empezar una sesión. Lo de cada persona va en
[`bitacora/`](bitacora/), el historial en [`registro/`](registro/) y las decisiones en [`decisiones.md`](decisiones.md).
El estado de cada proyecto que usa el plugin está en el repo de ese proyecto (moneyball-web: `docs/bitacora.md`).

## Cómo se escribe esta bitácora

El formato es el de la plantilla [`plugin/skills/instalar-harness/plantillas/bitacora.md`](../plugin/skills/instalar-harness/plantillas/bitacora.md),
sección "Cómo se escribe esta bitácora". Las entradas del registro anteriores al 26/10 no llevan la persona en el
nombre: son de antes de ese formato y no se renombran.

## Estado

- [x] 0.1.0 → 0.2.0 (publicada): guardián, skills, plantillas, `auditar-repo` con verificador y remisión a pape
- [x] 0.3.0 (publicada): bitácora por personas (`HARNESS_PERSONA`), `iniciar-sesion` no se detiene sin
  `harness.json`, README con "Preparar el equipo de una persona" y guía para quien no programa
- [x] 0.4.0 (publicada): ningún merge automático; una persona aprueba y mezcla la PR en GitHub tras ver la preview
- [x] 0.5.0 (publicada, PR #1 y etiqueta `v0.5.0`): lo que salió de `pape:harness-audit` en moneyball-web. El
  guardián bloquea `npm pkg|install…` y `git apply|am`, etiquetas, auto-merge por herramienta, la edición de
  `~/.claude/settings*.json` y cualquier error al evaluar; `blockedTools` acepta expresiones; el fin de turno verifica
  los commits sin subir; el revisor ya no escribe
- [x] 0.6.0 (rama `cambio/0.6.0`, sin commit): segunda auditoría de moneyball-web. Etiquetas en todas sus formas,
  rutas protegidas y verificación en worktrees, mantenimiento solo desde la variable al arrancar, el fin de turno
  no deja terminar si no puede leer, `iniciar-sesion` avisa si la versión no es la fijada
- [ ] Piloto en moneyball-web: en curso, con su propia bitácora
- [ ] Probar en la app de escritorio la activación por `.claude/settings.json` del proyecto (opción sin comandos)

## Problemas abiertos del proyecto

- Sin comprobar en sesión real que el hook salte con herramientas MCP. Con Bash y con `PowerShell`, sí (26/10:
  bloqueó `git commit` en moneyball-web desde PowerShell).
- Sin comprobar en sesión real qué `CLAUDE_PROJECT_DIR` llega en una sesión de worktree (0.6.0 funciona con las dos
  respuestas) ni que el `env` de `settings.json` llegue a los hooks.
