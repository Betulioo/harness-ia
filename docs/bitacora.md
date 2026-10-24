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
- [x] 1. Plugin `harness-ia`, publicado en `github.com/Betulioo/harness-ia`; versión 0.2.0 en local, sin publicar
- [x] 2. Auditoría de `moneyball-web` (`moneyball-web/docs/auditoria-2026-10-24.md`, hecha con 0.1.0: sin verificador)
- [ ] 3. Hacer el piloto verificable (P1–P5 del informe) e instalar el harness
- [ ] 4. Prueba con Rafa

## Próximo paso

1. La persona hace commit y push de 0.2.0, y actualiza el plugin instalado (`claude plugin marketplace update
   harness-ia` + `claude plugin update harness-ia@harness-ia`, o reinstalar).
2. Opcional: pasar el verificador sobre los hallazgos de la auditoría de moneyball-web (se hizo antes de que existiera).
3. Fase 3 en moneyball-web, empezando por P1 (Next.js 16.4.3, vulnerabilidad crítica); necesita `npm ci`.
4. Decidir si se añade CODEOWNERS (aprobación de Luis solo en rutas sensibles); propuesto, sin decidir.

## Problemas abiertos

- Comprobado en sesión real solo con Bash. Sin comprobar: que `"matcher": "*"` dispare el hook también en las
  herramientas MCP y en `PowerShell`.
- `claude` y `gh` no están en el PATH de la terminal del agente: lo que los necesita lo hace la persona.
