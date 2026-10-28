---
name: iniciar-sesion
description: Prepara una sesión nueva: identifica a la persona, lee el estado del proyecto (bitácora común, la suya y el plan), comprueba la rama y la verificación, y propone por dónde seguir. Úsala al empezar cada sesión o después de un traspaso.
---

# Iniciar sesión

No implementes nada hasta que la persona confirme.

1. **Quién es.** Lee `HARNESS_PERSONA` con `node -e "console.log(process.env.HARNESS_PERSONA || '')"`. Si está
   vacía, pregúntale su nombre corto (`luis`, `rafa`…), úsalo en esta sesión y dile cómo dejarlo fijo: en
   `~/.claude/settings.json`, `"env": { "HARNESS_PERSONA": "<nombre>" }`. No uses la identidad de git: varias
   personas pueden commitear con la misma.
2. **Configuración.** Lee `.claude/harness.json`: rama principal (`mainBranch`), política de commits
   (`commitPolicy`) y comando de verificación (`verifyCommand`). Si no existe, avisa de que el harness no está
   instalado del todo (el guardián aplica la política `persona` por defecto y no protege rutas del proyecto) y
   **sigue**: lo demás funciona igual. Sin `verifyCommand`, usa el script `verify` de `package.json` si existe.
3. **Versión del harness.** La que usa esta sesión está en `version` de `../../.claude-plugin/plugin.json`, contando
   desde la carpeta de esta skill (la ruta que te dio Claude Code al cargarla; también se ve en ella, p. ej.
   `…\harness-ia\0.6.0\skills\iniciar-sesion`). La que pide el proyecto es el `ref` del marketplace `harness-ia` en
   `extraKnownMarketplaces` de `.claude/settings.json` (`"ref": "v0.6.0"` pide 0.6.0). Si el proyecto no fija `ref`,
   no compares. Si no coinciden, avisa en la primera línea del resumen: «Esta sesión usa el harness X y el proyecto
   pide Y: las protecciones pueden no ser las que el proyecto espera. Alguien técnico tiene que actualizar el plugin
   en este equipo (README, "Actualizar el plugin") y abrir una sesión nueva.» Y **sigue**: no lo arregles tú.
4. **Lo vigente, no el historial:**
   - `docs/bitacora.md` entero: formato, Estado y Problemas abiertos del proyecto. Es corto a propósito.
   - `docs/bitacora/<persona>.md`: en qué está, su próximo paso y sus problemas. Si no existe, es su primera
     sesión: dilo.
   - De `docs/registro/`, solo su última entrada en la rama actual (`ls docs/registro/*-<persona>-<rama>.md`) o, si
     no hay, su entrada más reciente. Las demás, solo si su Próximo paso o la persona remiten a una; búscalas con
     `grep`.
   - De `docs/plan.md`, solo la sección del paso en curso.

   Si alguno no existe, dilo. Si el `CLAUDE.md` manda leer al empezar un archivo que no está en este equipo, dilo
   una vez y sigue con la bitácora: no te detengas por eso.
5. Ejecuta `git status`, `git branch --show-current` y `git log --oneline -3`.
6. Ejecuta el comando de verificación.
7. Responde en 10 líneas como máximo:
   - En qué está esta persona (su bitácora) y en qué punto va el plan común.
   - Su próximo paso concreto.
   - Rama actual y cambios sin commit. Si estás en la rama principal y `commitPolicy` es `rama`, avisa de que el
     primer cambio se hará en una rama de trabajo nueva.
   - Estado de la verificación. Si falla, propón arreglarlo como primera tarea.
   - Si otra persona tiene algo en curso que toca lo mismo (bitácora común o su archivo), avísalo.
8. Pregunta si continuar con ese próximo paso.

Si la persona no programa (lo dice el `CLAUDE.md` o ella misma), escribe el resumen sin jerga: "las comprobaciones
pasan" en vez de "typecheck y lint en verde"; "hay cambios guardados sin publicar" en vez de "working tree sucio".
