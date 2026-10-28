# Bitácora de luis

Su foto vigente: se reemplaza al cerrar cada paso. Formato en [la bitácora común](../bitacora.md#cómo-se-escribe-esta-bitácora).

## En curso

0.6.0 sin commit en la rama `cambio/0.6.0` (sacada de `v0.5.0`): lo que vive en el plugin del informe de auditoría
del 26/10 21:40 de moneyball-web, paso P10 de su plan ([registro](../registro/2026-10-28-luis-cambio-0.6.0.md)).
`npm run verify` en verde (81 tests).

## Próximo paso

1. Revisar el diff, commit, PR y mezclar. Etiqueta `v0.6.0` en ese commit y push de la etiqueta. El `main` local está
   atrasado (en `f836e52`): ponerlo al día con `origin/main` antes.
2. En moneyball-web: subir el `ref` a `v0.6.0`, actualizar el plugin (README, "Actualizar el plugin") y abrir una
   sesión nueva. `iniciar-sesion` debería no avisar de versión.
3. Prueba real desde una sesión normal de moneyball-web: `gh pr create --fill --label mantenimiento` y
   `gh issue edit <n> --add-label mantenimiento` bloqueados; en una sesión de worktree, un Edit de `CLAUDE.md`
   bloqueado. Anotar qué `CLAUDE_PROJECT_DIR` llega en esa sesión (`node -e "console.log(process.env.CLAUDE_PROJECT_DIR)"`).
4. Lo del informe que se arregla en moneyball-web con modo mantenimiento (ci.yml, .gitignore, package.json,
   CLAUDE.md) y lo de cada equipo (reinstalar el plugin en las rutas registradas con 0.4.0, ISSUE-24): decidir ahora.
5. Sin decidir: `.gitattributes` con `eol=lf` en el plugin y en la plantilla (el `pre-push` con CRLF falla).

## Problemas abiertos

- `gh` no está en el PATH de la terminal del agente: lo que lo necesita lo hace luis a mano.
- `isUserSettingsFile` y el bloqueo por terminal de `~/.claude/settings*.json` no miran `CLAUDE_CONFIG_DIR` (el
  mantenimiento sí). Solo importa si algún equipo lo usa.
