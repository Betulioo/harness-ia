# harness-ia

Plugin de Claude Code con la forma de trabajar y las protecciones para usar la IA en un repositorio sin romper nada.
Qué contiene y qué bloquea: [README.md](README.md). Estado: [docs/bitacora.md](docs/bitacora.md); decisiones:
[docs/decisiones.md](docs/decisiones.md); historial: `docs/registro/`.

Este repositorio se trabaja con su propio método: al empezar, lee la bitácora (Estado, Próximo paso y Problemas
abiertos); al terminar un paso, la lista de cierre de `plugin/skills/cerrar-paso/SKILL.md` con política `persona`
(no hagas commit ni push).

## Reglas

- `npm run verify` en verde antes de dar algo por hecho.
- Cada regla nueva del guardián lleva un test en `test/guard-rules.test.mjs` que la bloquea y otro que comprueba que
  no bloquea lo legítimo. Ante la duda, el guardián bloquea: es más seguro parar que dejar pasar.
- Los motivos de bloqueo se escriben para alguien que no programa: qué se ha impedido y qué hacer en su lugar.
- Las skills son genéricas: nada de un proyecto concreto. Lo propio de cada proyecto va en su `CLAUDE.md` y en su
  `.claude/harness.json`.
- Una pieza tomada del TFM (`../TFM-DEMO/TFM-DEMO`) se generaliza sin perder sus reglas; si se quita una, se anota
  en la bitácora con el porqué.

## Convenciones

- Node ≥ 20.19, ESM (`.mjs`), sin dependencias. Tests con `node:test` y `node:assert/strict`.
- Código y comentarios en español sencillo; nombres de variables en inglés, completos (nada de `cmd`, `cfg`, `ctx`).
- Funciones pequeñas con nombre que diga qué hacen; los comentarios explican el porqué.
