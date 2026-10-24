# harness-ia

Plugin de Claude Code para usar la IA en un repositorio **sin romper nada y dentro de los estándares del proyecto**,
incluso cuando quien lo usa no programa. Generaliza el harness del TFM `azdo-daily-brief` (sesiones con bitácora,
cierre verificado, revisión frente al plan, reglas que se comprueban) y añade un guardián que bloquea lo irreversible.

## Idea

Una regla escrita en el `CLAUDE.md` depende de que el agente la recuerde. Si nadie técnico revisa los cambios, eso no
basta: lo peligroso tiene que estar **impedido**. Por eso hay tres capas:

| Capa | Qué hace | Dónde |
|---|---|---|
| Forma de trabajar | Sesiones con bitácora, pasos pequeños, criterios ante la ambigüedad, cierre con lista | Skills y plantilla de `CLAUDE.md` |
| Guardián local | Bloquea antes de ejecutar: secretos, comandos irreversibles, push a la rama principal y rutas protegidas | Hooks del plugin + `.claude/harness.json` |
| Barrera final | Nada llega a la rama principal sin PR y sin la CI en verde | Protección de rama en GitHub + CI (las configura una persona) |

El guardián analiza texto y un comando muy retorcido podría escaparse. La barrera final no depende del agente.

## Contenido

| Pieza | Para qué |
|---|---|
| skill `iniciar-sesion` | Lee la bitácora y el plan, comprueba la rama y la verificación, y propone el siguiente paso |
| skill `pedir-cambio` | Flujo para quien no programa: petición en lenguaje llano → ficha → rama → verificación → PR con merge automático |
| skill `cerrar-paso` | Lista de cierre: verificación, archivos cambiados, instrucciones, bitácora y publicación |
| skill `reflect` (`/reflect`) | Reflexión crítica sobre el trabajo del turno |
| skill `revisar` + agente `revisor` | Revisión en solo lectura frente al plan y a las reglas; informe en `docs/revisiones/` |
| skill `tests-semanticos` | Qué debe comprobar un test para que proteja algo |
| skill `auditar-repo` | Auditoría en solo lectura de un repo heredado; informe en `docs/auditoria-AAAA-MM-DD.md` |
| skill `instalar-harness` | Copia y adapta las plantillas (`CLAUDE.md`, bitácora, `harness.json`, settings, pre-push y CI) |

La bitácora se reparte en tres archivos para que no crezca sin límite ni choque entre ramas: `docs/bitacora.md`
(foto vigente, corta, se reemplaza), `docs/registro/AAAA-MM-DD-<rama>.md` (una entrada por sesión y rama) y
`docs/decisiones.md` (índice de una línea por decisión). Formato en la plantilla `bitacora.md`.
| hook `PreToolUse` (`guard.mjs`) | Bloquea con un motivo en lenguaje llano (ver "Qué bloquea") |
| hook `Stop` (`verify-on-stop.mjs`) | Si hay cambios sin commitear, ejecuta el `verifyCommand` antes de que el agente termine; si falla, le obliga a corregir o explicar |

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
- `persona` (por defecto): el agente no hace `commit`, `push` ni `gh pr merge`. Así trabaja el TFM.
- `rama`: commit y push solo fuera de la rama principal; `gh pr merge` solo con `--auto` y sin `--admin`.

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

En local, mientras el plugin no esté publicado:

```bash
claude plugin marketplace add C:/Users/luisn/Desktop/money-ball/harness-ia
```

```bash
claude plugin install harness-ia@harness-ia
```

Una vez en GitHub, el `.claude/settings.json` del proyecto lo activa para todo el equipo (plantilla en
`plugin/skills/instalar-harness/plantillas/settings.json`). Después, en el proyecto: `auditar-repo` →
`instalar-harness` → pasos manuales en GitHub que lista esa skill.

## Desarrollo

```bash
npm run verify
```

Ejecuta los tests de las reglas del guardián, de la configuración y de la estructura del plugin (`node:test`, sin
dependencias). Bitácora en [docs/bitacora.md](docs/bitacora.md).
