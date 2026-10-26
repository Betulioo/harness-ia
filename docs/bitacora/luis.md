# Bitácora de luis

Su foto vigente: se reemplaza al cerrar cada paso. Formato en [la bitácora común](../bitacora.md#cómo-se-escribe-esta-bitácora).

## En curso

0.4.0 sin commit: ningún merge automático (el guardián bloquea `gh pr merge` y `gh pr review --approve`), skills,
README y guía de quien no programa adaptados.

## Próximo paso

1. Commit y push de 0.4.0; actualizar el plugin instalado (README, "Actualizar el plugin") y abrir sesión nueva.
2. Si no está hecho: `HARNESS_PERSONA` = `luis` en `~/.claude/settings.json` (`"env"`).
3. Probar en un clon limpio de moneyball-web, desde la app de escritorio, la activación por `.claude/settings.json`
   antes de preparar el equipo de rafa; corregir la guía con lo que se vea (nombres de botones, settings inexistente).
4. Sin decidir: `.gitattributes` con `eol=lf` en el plugin y en la plantilla (el `pre-push` con CRLF falla).

## Problemas abiertos

- `gh` no está en el PATH de la terminal del agente: lo que lo necesita lo hace luis a mano.
