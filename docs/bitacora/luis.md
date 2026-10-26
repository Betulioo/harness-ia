# Bitácora de luis

Su foto vigente: se reemplaza al cerrar cada paso. Formato en [la bitácora común](../bitacora.md#cómo-se-escribe-esta-bitácora).

## En curso

0.5.0 sin commit en la rama `cambio/auditoria-0.5.0`: los arreglos del plugin que pide la auditoría de
moneyball-web ([registro](../registro/2026-10-26-luis-cambio-auditoria-0.5.0.md)). `node --test` en verde.

## Próximo paso

1. Revisar el diff, commit, PR y mezclar. Etiqueta `v0.5.0` en ese commit y push de la etiqueta.
2. Actualizar el plugin instalado (README, "Actualizar el plugin") y abrir una sesión nueva. Comprobar que se bloquean
   `npm pkg set` y `mcp__ccd_pr__set_auto_merge`.
3. Seguir en moneyball-web con el paso B2 (fijar el plugin en `v0.5.0` y las barreras de la CI).
4. Probar en un clon limpio de moneyball-web, desde la app de escritorio, la activación por `.claude/settings.json`
   antes de preparar el equipo de rafa; corregir la guía con lo que se vea (nombres de botones, settings inexistente).
5. Sin decidir: `.gitattributes` con `eol=lf` en el plugin y en la plantilla (el `pre-push` con CRLF falla).

## Problemas abiertos

- `gh` no está en el PATH de la terminal del agente: lo que lo necesita lo hace luis a mano.
