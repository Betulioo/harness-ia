# Bitácora de luis

Su foto vigente: se reemplaza al cerrar cada paso. Formato en [la bitácora común](../bitacora.md#cómo-se-escribe-esta-bitácora).

## En curso

0.3.0 sin commit (bitácora por personas).

## Próximo paso

1. Commit y push de 0.3.0; hacer público el repo (GitHub → Settings → General → Change visibility); actualizar el
   plugin instalado y reiniciar la sesión.
2. Poner `HARNESS_PERSONA` = `luis` en `~/.claude/settings.json` (`"env"`).
3. Probar en un clon limpio de moneyball-web, desde la app de escritorio, la activación por `.claude/settings.json`
   antes de preparar el equipo de rafa.
4. Sin decidir: `.gitattributes` con `eol=lf` en el plugin y en la plantilla (el `pre-push` con CRLF falla).

## Problemas abiertos

- `claude` y `gh` no están en el PATH de la terminal del agente: lo que los necesita lo hace luis a mano.
