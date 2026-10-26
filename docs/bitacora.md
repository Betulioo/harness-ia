# Bitácora de harness-ia

La foto vigente: lo que hay que leer al empezar una sesión. Historial en [`registro/`](registro/) y decisiones en
[`decisiones.md`](decisiones.md).

## Cómo se escribe esta bitácora

El formato es el de la plantilla [`plugin/skills/instalar-harness/plantillas/bitacora.md`](../plugin/skills/instalar-harness/plantillas/bitacora.md),
sección "Cómo se escribe esta bitácora".

## Estado

Plan: `C:\Users\luisn\.claude\plans\lo-que-necesito-es-fluffy-meteor.md` (fases 0 a 4).

- [~] 0. Persona: quién usa el agente, hecho (Luis técnico, Rafa no técnico). Pendientes: plan de GitHub de la
  organización y ruleset en `main`; con el socio, previews contra la BD de producción y documentos de producto
- [x] 1. Plugin `harness-ia` 0.2.0, publicado e instalado (commit `b48302f`)
- [x] 2. Auditoría de moneyball-web: `docs/auditoria-2026-10-24.md`, con verificador, en la rama `docs-auditoria`
- [ ] 3. Piloto verificable, PRs encadenadas en moneyball-web, **ninguna mergeada** (P1 por decisión de la persona):
  - [x] P1 `seguridad-next-16-4` (Next 16.4.3, `npm audit` 0) → base `main`; producción sigue en 16.3.6
  - [x] P2 `verificacion-automatica` (`typecheck`, `test`, `verify`) → base P1
  - [x] P3 `feat/P3_primeros_tests` (37 tests, `fa5da6d`) → base P2
  - [ ] Arquitectura hexagonal: propuesta, sin decidir (ver Próximo paso) · P4 CI y ruleset · P5 harness
- [ ] 4. Prueba con Rafa

## Próximo paso

1. **Decidir la arquitectura hexagonal** de moneyball-web. Propuesta y datos en
   [registro/2026-10-24-main.md](registro/2026-10-24-main.md#propuesta-arquitectura-hexagonal-moneyball-web).
   Decisiones que faltan: alcance (pragmática, completa o solo capa de datos; recomendada la pragmática) y orden
   respecto a P4 (recomendado: ADR ahora y migrar tras P4, empezando por la ficha del jugador).
2. Después, P4: `.github/workflows/ci.yml` (`npm ci && npm run verify`, plantilla de `instalar-harness`) y ruleset.
3. Sin decidir: CODEOWNERS (aprobación de Luis solo en rutas sensibles) y `.gitattributes` con `eol=lf` (el
   `pre-push` con CRLF falla). Las dos propuestas como opcionales.

## Problemas abiertos

- Sin comprobar en sesión real que el hook salte con herramientas MCP y `PowerShell` (con Bash, sí).
- `claude` y `gh` no están en el PATH de la terminal del agente: lo que los necesita lo hace la persona.
- P3: reglas sacadas de comentarios del código, sin confirmar con el producto: comodín impar ("sale de 7.5"),
  fecha por defecto 16/10/2026, 15 comunes de bateo y BAA común.
