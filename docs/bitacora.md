# Bitácora de harness-ia

La foto vigente: lo que hay que leer al empezar una sesión. Historial en [`registro/`](registro/) y decisiones en
[`decisiones.md`](decisiones.md).

## Cómo se escribe esta bitácora

El formato es el de la plantilla [`plugin/skills/instalar-harness/plantillas/bitacora.md`](../plugin/skills/instalar-harness/plantillas/bitacora.md),
sección "Cómo se escribe esta bitácora".

## Estado

Plan: `C:\Users\luisn\.claude\plans\lo-que-necesito-es-fluffy-meteor.md` (fases 0 a 4).

- [ ] 0. Tareas de la persona:
  - [ ] Proteger `main` en GitHub (ruleset + auto-merge; el check de CI se añade al terminar la fase 3). Antes,
    confirmar el plan de GitHub de la organización (con Free y repo privado no hay rulesets)
  - [ ] En espera (hablar con el socio que creó el repo): ¿las previews de Vercel usan la BD de producción?
  - [ ] En espera (ídem): traer al repo los documentos de producto de `C:\Users\rafap\...`
  - [x] Quién usa el agente: Luis (técnico: configuración, tests, arquitectura, auditoría) y Rafa (no técnico:
    funcionalidades nuevas y cambios en las existentes)
- [x] 1. Plugin `harness-ia` (sin probar aún dentro de Claude Code); bitácora repartida en tres archivos
- [ ] 2. Auditoría de `moneyball-web` con `auditar-repo`
- [ ] 3. Hacer el piloto verificable (verify, tests, CI, harness.json) e instalar el harness
- [ ] 4. Prueba con Rafa

## Próximo paso

1. Repo publicado en `github.com/Betulioo/harness-ia`. La persona instala el plugin desde GitHub
   (`claude plugin marketplace add Betulioo/harness-ia` + `claude plugin install`) y hace la prueba en una carpeta
   desechable: skills visibles, `.env` y push a `main` bloqueados, hook `Stop` con verify rojo.
2. Decidir si se añade CODEOWNERS (aprobación de Luis solo en rutas sensibles) al plan; propuesto, sin decidir.
3. Fase 2: abrir una sesión en `moneyball-web` y ejecutar `auditar-repo`.

## Problemas abiertos

- No verificado dentro de Claude Code: que `"matcher": "*"` dispare el hook en todas las herramientas (también las
  MCP) y que el hook reciba la herramienta `PowerShell` con `tool_input.command`.
- `claude` y `gh` no están en el PATH de la terminal del agente: lo que los necesita lo hace la persona.
