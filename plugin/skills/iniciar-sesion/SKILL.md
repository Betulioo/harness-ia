---
name: iniciar-sesion
description: Prepara una sesión nueva: lee el estado del proyecto (bitácora y plan), comprueba la rama y la verificación, y propone por dónde seguir. Úsala al empezar cada sesión o después de un traspaso.
---

# Iniciar sesión

No implementes nada hasta que la persona confirme.

1. Lee `.claude/harness.json`: rama principal (`mainBranch`), política de commits (`commitPolicy`) y comando de
   verificación (`verifyCommand`). Si no existe, dilo: el proyecto no tiene el harness instalado; propón la skill
   `instalar-harness` y para aquí.
2. Lee lo vigente, no el historial:
   - `docs/bitacora.md` entero: formato, Estado, Próximo paso y Problemas abiertos. Es corto a propósito.
   - De `docs/registro/`, solo la última entrada de la rama actual (`ls docs/registro/*-<rama>.md`) o, si no hay,
     la más reciente. Las demás, solo si el Próximo paso o la persona remiten a una; búscalas con `grep`.
   - De `docs/plan.md`, solo la sección del paso actual.

   Si alguno no existe, dilo.
3. Ejecuta `git status`, `git branch --show-current` y `git log --oneline -3`.
4. Ejecuta el `verifyCommand`.
5. Responde en 10 líneas como máximo:
   - Paso actual, qué está hecho y qué falta.
   - Próximo paso concreto según la bitácora.
   - Rama actual y cambios sin commit. Si estás en la rama principal y `commitPolicy` es `rama`, avisa de que el
     primer cambio se hará en una rama de trabajo nueva.
   - Estado de la verificación. Si falla, propón arreglarlo como primera tarea.
6. Pregunta si continuar con ese próximo paso.

Si la persona no programa (lo dice el `CLAUDE.md` o ella misma), escribe el resumen sin jerga: "las comprobaciones
pasan" en vez de "typecheck y lint en verde"; "hay cambios guardados sin publicar" en vez de "working tree sucio".
