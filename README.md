# harness-ia

Plugin de Claude Code para usar la IA en un repositorio **sin romper nada y dentro de los estándares del proyecto**,
incluso cuando quien lo usa no programa. Generaliza el harness del TFM `azdo-daily-brief` (sesiones con bitácora,
cierre verificado, revisión frente al plan, reglas que se comprueban) y añade un guardián que bloquea lo irreversible.

## Idea

Una regla escrita en el `CLAUDE.md` depende de que el agente la recuerde. Si nadie técnico revisa el código, eso no
basta: lo peligroso tiene que estar **impedido**. Por eso hay cuatro capas:

| Capa | Qué hace | Dónde |
|---|---|---|
| Forma de trabajar | Sesiones con bitácora, pasos pequeños, criterios ante la ambigüedad, cierre con lista | Skills y plantilla de `CLAUDE.md` |
| Guardián local | Bloquea antes de ejecutar: secretos, comandos irreversibles, push a la rama principal y rutas protegidas | Hooks del plugin + `.claude/harness.json` |
| Barrera final | Nada llega a la rama principal sin PR y sin la CI en verde | Protección de rama en GitHub + CI (las configura una persona) |
| Visto bueno humano | Una persona mira la preview y aprueba y mezcla la PR en GitHub. El agente nunca mezcla ni aprueba, tampoco con merge automático | Guardián (bloquea `gh pr merge` y `gh pr review --approve`) + GitHub |

El guardián analiza texto y un comando muy retorcido podría escaparse. La barrera final no depende del agente. Las
comprobaciones solo ven lo que tiene tests: si el resultado es lo que se pidió, solo lo ve una persona en la preview.

## Contenido

| Pieza | Para qué |
|---|---|
| skill `iniciar-sesion` | Lee la bitácora y el plan, comprueba la rama y la verificación, y propone el siguiente paso |
| skill `pedir-cambio` | Flujo para quien no programa: petición en lenguaje llano → ficha → rama → verificación → PR que una persona revisa en la preview y mezcla en GitHub |
| skill `cerrar-paso` | Lista de cierre: verificación, archivos cambiados, instrucciones, bitácora y publicación |
| skill `reflect` (`/reflect`) | Reflexión crítica sobre el trabajo del turno |
| skill `revisar` + agente `revisor` | Revisión en solo lectura frente al plan y a las reglas; informe en `docs/revisiones/` |
| skill `tests-semanticos` | Qué debe comprobar un test para que proteja algo |
| skill `auditar-repo` | Auditoría en solo lectura de un repo heredado: despliegue, datos, secretos, dependencias y comprobaciones mínimas, con un subagente que intenta refutar cada hallazgo. Informe en `docs/auditoria-AAAA-MM-DD.md`. La configuración del agente no: eso es [`pape:harness-audit`](#auditorías-cuál-usar) |
| skill `instalar-harness` | Copia y adapta las plantillas (`CLAUDE.md`, bitácora, `harness.json`, settings, pre-push y CI) |
| hook `PreToolUse` (`guard.mjs`) | Bloquea con un motivo en lenguaje llano (ver "Qué bloquea") |
| hook `Stop` (`verify-on-stop.mjs`) | Si hay cambios sin commitear, ejecuta el `verifyCommand` antes de que el agente termine; si falla, le obliga a corregir o explicar |

## Bitácora: en el repo del proyecto, por personas

El plugin trae el método; el estado de cada proyecto vive **en el repo de ese proyecto**, para que cualquier
sesión abierta allí lo encuentre:

```
docs/
  bitacora.md              foto común: Estado del plan y Problemas abiertos del proyecto
  bitacora/<persona>.md    foto de cada persona: en curso, próximo paso y sus problemas
  registro/AAAA-MM-DD-<persona>-<rama>.md   historial: una entrada por sesión, persona y rama
  decisiones.md            índice común de decisiones
```

Cada persona solo escribe en lo suyo, así que dos personas en ramas distintas no chocan. La sesión sabe quién es
quién por la variable `HARNESS_PERSONA` (ver "Preparar el equipo de una persona"); si falta, pregunta. Formato
completo en la plantilla `plugin/skills/instalar-harness/plantillas/bitacora.md`.

## Auditorías: cuál usar

| | `harness-ia:auditar-repo` | `pape:harness-audit` (plugin `pape`) |
|---|---|---|
| Pregunta | ¿Puede alguien que no programa cambiar este repo sin romper la aplicación ni sus datos? | ¿El harness del agente es coherente y está aplicado? |
| Mira | Despliegue, previews, BD y RLS, crons, secretos, vulnerabilidades, comprobaciones mínimas | CLAUDE.md, permisos, hooks, CI frente al DoD, tests, subagentes, skills, MCP |
| Cuándo | Al adoptar un repo, antes de `instalar-harness` | Después de `instalar-harness`, y de vez en cuando para ver la tendencia |

No se solapan a propósito: `auditar-repo` apunta lo que ve del harness en una línea y remite a pape.

## Qué bloquea el guardián

Siempre:
- Leer, editar o cargar `.env` y `.env.*` (salvo `.env.example`), también por terminal.
- `git checkout` (salvo `-b`), `restore`, `clean`, `rebase`, `reset --hard`, `branch -D`, `stash drop|clear`,
  `switch --discard-changes`, `--no-verify` y desactivar `core.hooksPath`.
- `git push` con force, `+refspec`, borrado de ramas, `--mirror` o `--all`.
- `gh api` con escritura, `gh secret|variable` (salvo `list`), `gh repo delete|edit|…`, `gh workflow disable`,
  `gh auth token`.
- Borrados recursivos, salvo de carpetas generadas (`node_modules`, `.next`, `dist`…).
- Editar las protecciones del propio harness (`.claude/settings*.json`, `.claude/harness.json`, `.githooks/`,
  `.github/workflows/`) y las `protectedPaths` del proyecto, salvo en modo mantenimiento.

Según `commitPolicy`:
- `persona` (por defecto): el agente no hace `commit` ni `push`. Así trabaja el TFM.
- `rama`: commit y push solo fuera de la rama principal, y abre la PR.

En las dos, `gh pr merge` (también con `--auto`) y `gh pr review --approve` están bloqueados: las PRs las aprueba y
las mezcla una persona en GitHub.

## Configuración por proyecto: `.claude/harness.json`

```json
{
  "mainBranch": "main",
  "commitPolicy": "rama",
  "verifyCommand": "npm run verify",
  "protectedPaths": ["package.json", "package-lock.json", "supabase/migrations/"],
  "blockedTools": ["mcp__supabase__apply_migration", "mcp__supabase__execute_sql"],
  "blockedCommands": [{ "pattern": "supabase\\s+(db\\s+push|migration)", "reason": "las migraciones las aplica alguien técnico" }]
}
```

- `protectedPaths`: rutas relativas a la raíz; si terminan en `/`, toda la carpeta. Se suman a las del harness.
- `blockedTools`: nombre exacto o prefijo con `*` (`mcp__vercel__*`).
- `blockedCommands`: expresión regular (sin distinguir mayúsculas) y motivo.

**Modo mantenimiento:** quien sea técnico arranca Claude con `HARNESS_MAINTENANCE=1` para editar las rutas
protegidas. Los secretos siguen bloqueados. El agente no puede activarlo desde dentro de la sesión.

## Instalación

Requisitos: Node ≥ 20.19 (los hooks son scripts de Node sin dependencias), `git` y `gh` autenticado si la política es
`rama`.

Desde GitHub:

```bash
claude plugin marketplace add Betulioo/harness-ia
```

```bash
claude plugin install harness-ia@harness-ia
```

Para probar cambios sin publicarlos, el marketplace también se puede añadir desde la carpeta local
(`claude plugin marketplace add <ruta a harness-ia>`).

En un proyecto, su `.claude/settings.json` lo activa para todo el equipo (plantilla en
`plugin/skills/instalar-harness/plantillas/settings.json`): cada persona solo tiene que aceptar el plugin al abrir
Claude Code en el repo. El repositorio del plugin es público, así que no hace falta darle acceso a nadie.
Después, en el proyecto: `auditar-repo` → `instalar-harness` → pasos manuales en GitHub que lista esa skill.

## Actualizar el plugin

Cuando se publica una versión nueva (la de `plugin/.claude-plugin/plugin.json`), cada persona la recoge en su
equipo con dos comandos. El primero descarga de GitHub la lista nueva del marketplace; el segundo instala la versión
nueva del plugin:

```bash
claude plugin marketplace update harness-ia
```

```bash
claude plugin update harness-ia@harness-ia
```

Después hay que **cerrar la sesión de Claude y abrir una nueva**: los hooks y las skills se cargan al arrancar.

Para saber qué versión está usando un equipo, mira las carpetas de `~/.claude/plugins/cache/harness-ia/harness-ia/`
(en Windows, `C:\Users\<usuario>\.claude\plugins\cache\harness-ia\harness-ia\`): la sesión usa la más reciente. Los
mensajes de bloqueo del guardián también la muestran en la ruta (`…\harness-ia\0.3.0\hooks\guard.mjs`).

## Preparar el equipo de una persona

Lo hace alguien técnico, una vez por persona y equipo. Sin esto, el plugin no protege nada en ese equipo. Para quien
no programa y lo hace con ayuda, la misma lista paso a paso y sin jerga está en
[docs/guia-no-programadores.md](docs/guia-no-programadores.md): necesita que le des la dirección del repositorio, la
identidad de git y su nombre corto.

| Qué | Para qué |
|---|---|
| App de Claude, `git` y **Node ≥ 20.19** | Los hooks son scripts de Node: sin Node no se ejecutan y no bloquean nada |
| El repo del proyecto clonado y sus dependencias instaladas (`npm ci`) | Para que la verificación funcione |
| La identidad de git que exija el proyecto, en el clon (`git config user.name` / `user.email`) | Algunos despliegues solo publican commits de una identidad; el agente no debe cambiarla |
| `gh` instalado y con sesión iniciada | Con la política `rama`, el agente abre las PRs con `gh` |
| `HARNESS_PERSONA` en la configuración de usuario de Claude: `{ "env": { "HARNESS_PERSONA": "rafa" } }` | La bitácora sabe quién es (su archivo y sus entradas del registro) |

La configuración de usuario de Claude es `~/.claude/settings.json`: en Windows,
`C:\Users\<usuario>\.claude\settings.json` (se abre con `notepad $env:USERPROFILE\.claude\settings.json`). No es el
`.claude/settings.json` del proyecto: ese es común a todos y lo protege el guardián. Si el archivo de usuario ya tiene
un bloque `"env"`, la clave va dentro de él; si no, se añade el bloque.

Al terminar, comprueba en ese equipo que el guardián funciona: abre el proyecto en Claude, acepta el plugin y pide
leer `.env` y hacer `git push origin main`. Los dos deben quedar bloqueados.

El día a día de quien no programa: abrir la carpeta del proyecto en Claude, escribir "iniciar sesión" y pedir los
cambios en lenguaje normal (skill `pedir-cambio`).

El guardián vive en cada equipo: si alguien desactiva el plugin, deja de bloquear. La barrera que no depende del
equipo es la protección de la rama principal en GitHub con la CI obligatoria.

## Desarrollo

```bash
npm run verify
```

Ejecuta los tests de las reglas del guardián, de la configuración y de la estructura del plugin (`node:test`, sin
dependencias). Bitácora en [docs/bitacora.md](docs/bitacora.md).

Para publicar una versión nueva, sube el número en `plugin/.claude-plugin/plugin.json` (y en `package.json`): cada
versión se instala en su propia carpeta, y sin cambiar el número los equipos no recogen los cambios.
