---
name: cerrar-paso
description: Lista de cierre al terminar un paso o un cambio: verificación en verde, archivos cambiados, instrucciones cumplidas, bitácora al día y, si la política es "rama", publicar en una rama con PR. Úsala antes de dar algo por terminado.
---

# Cerrar un paso

Nada está terminado hasta completar esta lista. Lee `.claude/harness.json` para saber el `verifyCommand`, la
`mainBranch` y la `commitPolicy`.

1. **Verificación.** Ejecuta el `verifyCommand` hasta que pase. Si falla, corrígelo. Nunca desactives un test, una
   regla del lint ni un hook para que pase: si crees que la comprobación está mal, dilo y para.
2. **Archivos cambiados.** `git diff --stat` (y `git status` para los nuevos). Si alguno no debería haberse tocado,
   revísalo y avisa.
3. **Instrucciones.** Relee lo que pidió la persona en este turno y comprueba cada punto; di cuál queda pendiente y
   por qué. Si dio una instrucción que debe mantenerse, propón añadirla al `CLAUDE.md`; no la añadas sin confirmación.
4. **Bitácora.** Según el formato de `docs/bitacora.md` ("Cómo se escribe esta bitácora"), con la persona de la
   sesión (`HARNESS_PERSONA`, o la que dijo en `iniciar-sesion`):
   - La entrada de esta sesión en `docs/registro/AAAA-MM-DD-<persona>-<rama>.md` (créala o añade a la de hoy).
   - Cada decisión importante, también como una línea en `docs/decisiones.md`.
   - En `docs/bitacora/<persona>.md` (créalo desde la plantilla si no existe), reemplaza En curso, Próximo paso y
     Problemas abiertos; el Próximo paso, al terminar y no al empezar. No toques el archivo de otra persona.
   - En `docs/bitacora.md`, solo si avanzó un paso del plan común o hay un problema que afecta a todos.
   - Si algo pasa de los máximos del formato, resume y deja el detalle en la entrada.
   - Comprueba que el Estado y el README siguen siendo ciertos.
5. **Publicar** (solo si `commitPolicy` es `rama`; con `persona` deja los cambios sin commitear):
   1. Si estás en la rama principal, crea una rama: `git switch -c cambio/<descripcion-corta>`.
   2. `git add` de los archivos del paso (no `git add -A` a ciegas: revisa el paso 2) y `git commit` con un mensaje
      en español que diga qué cambia para el usuario de la aplicación.
   3. `git push -u origin <rama>` y `gh pr create` con: qué cambia, por qué (la petición de la persona), cómo
      comprobarlo en la preview y el resultado de la verificación.
   4. Comprueba con `gh pr checks <número>` que la CI arrancó. No esperes en bucle a que termine.
   5. **Aquí paras.** La PR la aprueba y la mezcla una persona en GitHub, después de mirar la preview. No la mezcles
      ni la apruebes tú, tampoco con merge automático (el guardián lo bloquea).
6. **Mensaje final**, no solo un resumen: qué ha cambiado, cómo comprobarlo (la URL de la preview si la hay, o qué
   pantalla mirar) y lo que la persona haya pedido expresamente. Si no programa, sin jerga y sin rutas de archivos
   salvo que las pida.

Si un hook del harness bloquea algo durante el cierre, no intentes rodearlo: explica qué se bloqueó y por qué, y
pregunta.
