---
name: instalar-harness
description: Instala la forma de trabajar del harness en un proyecto: CLAUDE.md, bitácora, .claude/harness.json, settings, pre-push y CI a partir de plantillas, preguntando lo que es propio del proyecto. Úsala cuando se pida "instalar el harness" o "preparar el repo para el harness", después de auditar-repo.
---

# Instalar el harness en un proyecto

Lo hace alguien técnico, una vez por proyecto. Como el harness protege sus propios archivos, arranca Claude con
`HARNESS_MAINTENANCE=1` para poder escribirlos (por ejemplo, `HARNESS_MAINTENANCE=1 claude`). Comprueba que la
variable está puesta con `node -e "console.log(process.env.HARNESS_MAINTENANCE)"`; si no, para y explícalo.

Las plantillas están en la carpeta `plantillas/` junto a esta skill.

## 1. Antes de copiar nada

1. Busca una auditoría (`docs/auditoria-*.md`). Si no hay, propón ejecutar `auditar-repo` primero y para.
2. Pregunta lo que no puedas deducir del repositorio, todo en un solo mensaje:
   - Rama principal y comando de verificación. Si no existe un comando único, propón crearlo en el paso 3.
   - Política de commits: `persona` (el agente nunca hace commit; para equipos técnicos) o `rama` (el agente
     publica en ramas y abre la PR, que aprueba y mezcla una persona en GitHub; para gente que no programa).
   - Rutas protegidas, herramientas y comandos bloqueados: parte de la sección 5 de la auditoría.
   - A quién avisar cuando el harness bloquea algo.
   - Quién usará el agente: el nombre corto de cada persona (`HARNESS_PERSONA`) y si programa o no.
3. Presenta la lista de archivos que vas a crear o cambiar y espera a que confirme.

## 2. Copiar y adaptar

| Plantilla | Destino | Si ya existe |
|---|---|---|
| `CLAUDE.md` | `CLAUDE.md` | No lo sustituyas: propón añadir las secciones que falten y conserva las reglas del proyecto |
| `bitacora.md` | `docs/bitacora.md` | Propón migrarla: la foto vigente se queda, cada fecha del historial pasa a una entrada de `docs/registro/` y las decisiones al índice. No la migres sin confirmación |
| `bitacora-persona.md` | `docs/bitacora/<persona>.md`, uno por cada persona que use el agente | — |
| `decisiones.md` | `docs/decisiones.md` | Mezcla las líneas |
| `registro-entrada.md` | `docs/registro/AAAA-MM-DD-<persona>-<rama>.md` (la primera entrada) | — |
| `harness.json` | `.claude/harness.json` | Mezcla los valores |
| `settings.json` | `.claude/settings.json` | Mezcla `permissions.deny` y `enabledPlugins` sin quitar nada |
| `pre-push` | `.githooks/pre-push` | Compara y pregunta |
| `ci.yml` | `.github/workflows/ci.yml` | Compara y pregunta |

- Sustituye cada `{{...}}` por el valor del proyecto. Al terminar,
  `grep -rnE '(^|[^$]){{' CLAUDE.md docs .claude .githooks .github` no debe encontrar nada (las expresiones `${{ }}`
  de GitHub Actions no son huecos).
- Añade a `package.json` (o equivalente) el script `verify` si falta y `"prepare": "git config core.hooksPath .githooks"`.
- Si no hay `docs/plan.md`, crea uno mínimo con los pasos del "Plan de mejora" de la auditoría.

## 3. Comprobar

1. Ejecuta el comando de verificación: debe pasar. Si no pasa, el primer paso del plan es arreglarlo.
2. Comprueba el guardián desde una sesión **sin** `HARNESS_MAINTENANCE`: pide al agente leer `.env` y hacer
   `git push origin <rama principal>`. Los dos deben quedar bloqueados.
3. Recomienda pasar `pape:harness-audit` ahora que el harness existe: comprueba su coherencia (que el
   `verifyCommand` sea lo que ejecuta la CI, que ningún hook falle abierto, que las reglas escritas tengan algo que
   las aplique). Si el plugin `pape` no está instalado, dilo.
4. Escribe la primera entrada del registro (qué se instaló, con qué política y qué queda pendiente), su línea en
   `docs/decisiones.md`, el Estado de `docs/bitacora.md` y el Próximo paso en el archivo de cada persona.

## 4. Lo que el agente no puede hacer (dáselo a la persona como lista)

- En GitHub, **Settings → Branches/Rules** de la rama principal: exigir PR, exigir que pase la CI (`verify`),
  prohibir el push directo y el force-push, y no permitir que los administradores se lo salten.
- **No** actives *Settings → General → Allow auto-merge*: las PRs las aprueba y las mezcla una persona en GitHub
  después de mirar la preview (el guardián impide al agente mezclar o aprobar). Decide en el ruleset cuántas
  aprobaciones hacen falta; GitHub no deja que quien abrió la PR la apruebe.
- Si hay despliegue automático: que las previews no usen secretos ni datos de producción.
- Dar acceso a quien vaya a usar el agente: rol de escritura, no de administrador.
- Preparar el equipo de cada persona: sección "Preparar el equipo de una persona" del README del plugin.
