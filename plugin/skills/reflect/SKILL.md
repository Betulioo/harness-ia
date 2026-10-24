---
name: reflect
description: Reflexión a fondo sobre el trabajo reciente: cumplimiento de las reglas, si está completo, cómo se ha verificado y qué se podría refactorizar. No cambia nada.
disable-model-invocation: true
---

# Reflexionar sobre el trabajo reciente

Tómate tiempo para analizar a fondo tu última implementación antes de sacar conclusiones.

## 1. Reglas
- Repasa TODAS las reglas aplicables: `CLAUDE.md`, las skills del proyecto y `.claude/harness.json`.
- ¿Las seguiste al pie de la letra o tomaste atajos?
- ¿Pasaste por alto o malinterpretaste alguna?
- ¿Las aplicaste igual en todo el trabajo?

## 2. Completitud
- ¿Hiciste TODO lo que se planeó o se pidió? Relee la petición o el plan original.
- ¿Queda algo pendiente, a medias o marcado como TODO?
- ¿Te saltaste algún paso pensando que era opcional? Aplica "Hueco, incumplimiento u opcional" del `CLAUDE.md`.
- ¿Funciona de principio a fin?

## 3. Verificación
- ¿Comprobaste que funciona? ¿Con qué: tests, el `verifyCommand`, la aplicación en marcha?
- ¿Qué casos límite y errores no probaste?
- ¿Algún test pasaría aunque el código estuviera mal? (criterios de la skill `tests-semanticos`)

## 4. Refactorización
- Mirándolo con ojos nuevos, ¿qué mejorarías?
- ¿Seguiste los patrones del proyecto?
- ¿Hay lógica duplicada que extraer, o nombres y estructura que mejorar?

---

Sé crítico y honesto, y piensa en el contexto concreto de este código.

Después presenta a la persona, de forma concisa:
- Qué hiciste bien.
- Qué reglas o patrones incumpliste o pasaste por alto.
- Qué se podría refactorizar.

**No implementes ningún cambio todavía**: solo comparte la reflexión.
