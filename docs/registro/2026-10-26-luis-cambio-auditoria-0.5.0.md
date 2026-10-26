# 2026-10-26 · luis · cambio/auditoria-0.5.0

Versión 0.5.0: arreglos del plugin que pide la auditoría `pape:harness-audit` de moneyball-web
(`moneyball-web/harness-audits/2026-10-26-1426-report.md`, ISSUE-3, 6, 8, 16, 18, 19, 20 y 21).

## Decisiones

- **El guardián bloquea lo que reescribe el listón sin nombrar el archivo** (ISSUE-3). Fuera del mantenimiento:
  `git apply|am` siempre, y `npm pkg set|delete`, `npm install|add|uninstall|update…` si el proyecto protege
  `package.json` o su lock (`npm ci` y `npm pkg get` siguen permitidos). Sigue siendo análisis de texto: la barrera
  que no depende de él es la CI de cada proyecto.
- **`blockedTools` acepta expresiones regulares entre barras** (ISSUE-6). Los conectores de claude.ai llegan con un
  prefijo UUID que no se conoce de antemano. Las expresiones se validan al cargar: una mal escrita invalida
  `harness.json`, y entonces el guardián bloquea.
- **Merge, aprobación y auto-merge por herramienta, bloqueados en el plugin** (ISSUE-20): `HARNESS_BLOCKED_TOOLS`
  se suma a los `blockedTools` de cada proyecto, como `HARNESS_PATHS` con las rutas. Además, el agente no pone ni
  quita etiquetas (`gh pr edit --add-label`, `gh label`), porque en moneyball-web la etiqueta `mantenimiento`
  autoriza tocar rutas protegidas.
- **El agente no edita `~/.claude/settings*.json`, ni siquiera en mantenimiento** (ISSUE-8): ahí vive
  `HARNESS_MAINTENANCE`.
- **El guardián falla cerrado también al evaluar** (ISSUE-18): un error sin capturar salía con 1, y Claude Code no lo
  trata como bloqueo.
- **El fin de turno verifica los commits sin subir** (ISSUE-19): se compara con `@{upstream}` o, si no hay, con la
  rama principal. Si git no responde, verifica. La función está en `config.mjs`, junto a `readCurrentBranch`, para
  probarla sin lanzar el hook.
- **El revisor no escribe** (ISSUE-21): devuelve el informe completo y lo guarda el agente principal. `revisar` y
  `revisor` se usan antes de una entrega o cuando se pide; el cierre de un paso es de `cerrar-paso` (ISSUE-16).

## Hechos comprobados

- `node --test`: 53 tests en verde (18 nuevos).
- `guard.mjs` con la configuración de moneyball-web bloquea `npm pkg set`, `mcp__ccd_pr__set_auto_merge` y editar
  `C:/Users/luisn/.claude/settings.json`. Deja pasar `npm run verify` y escribir en `~/.claude/plans/`.

## Errores y correcciones

- La primera versión bloqueaba también `npm pkg get` → corregido: solo `pkg set|delete|fix…`.
- Al probar `guard.mjs` desde Git Bash, las rutas con `\\` en el JSON llegaban mal escapadas → se probó con `/`.
