# Bitácora del proyecto

La foto vigente del proyecto: lo que hay que leer al empezar una sesión. No crece: se reemplaza.
El historial va en `docs/registro/` y el índice de decisiones en [`docs/decisiones.md`](decisiones.md).

## Cómo se escribe esta bitácora

Este bloque es la única definición del formato; las skills y el CLAUDE.md enlazan aquí.

**Dónde va cada cosa**

| Sección | Archivo | Va aquí si… | No va aquí |
|---|---|---|---|
| Estado | `bitacora.md` | Es el avance de un paso del plan: hecho, en curso o pendiente | Explicaciones del porqué |
| Próximo paso | `bitacora.md` | Es lo concreto por lo que sigue la próxima sesión (archivo, función o comando) y las decisiones que faltan | Lo ya hecho |
| Problemas abiertos | `bitacora.md` | Algo que falla o está sin resolver, con el error exacto. También lo que el harness bloqueó | Cosas ya resueltas: pasan al registro |
| Decisiones | entrada del registro + una línea en `decisiones.md` | Se eligió entre alternativas: qué, por qué y qué se descartó | Lo que se hizo sin elegir nada |
| Hechos comprobados | entrada del registro | Algo verificado con un comando, un test o el sistema real, citando cómo | Suposiciones |
| Errores y correcciones | entrada del registro | Algo que se intentó y falló: intento → por qué falló → qué cambia | Fallos aún sin resolver: van a Problemas abiertos |
| Aprendizajes | entrada del registro | Algo que cambia cómo se trabaja a partir de ahora | Detalles de un solo paso |

En caso de duda entre dos secciones, elige una y escribe "(dudoso: X o Y)" para que la persona lo revise.

**`bitacora.md`: la foto vigente, corta**
- Estado, Próximo paso y Problemas abiertos se **reemplazan**, no se acumulan.
- Máximo orientativo: Estado 15 líneas, Próximo paso 10, Problemas abiertos 10. Si no cabe, resume: los pasos
  terminados en una línea ("1–6 hechos") y el detalle en el registro, con enlace.

**`docs/registro/AAAA-MM-DD-<rama>.md`: una entrada por sesión y rama**
- Nombre: fecha de la sesión y rama con `/` cambiada por `-` (`2026-10-24-cambio-titulo-liga.md`). Si se trabaja
  otra vez el mismo día en la misma rama, se añade al mismo archivo. Así dos personas en ramas distintas nunca
  escriben en el mismo archivo.
- Secciones: Decisiones, Hechos comprobados, Errores y correcciones, Aprendizajes (solo las que tengan algo).
- Es historial: no se poda ni se reescribe; solo se corrige lo que sea falso o se reclasifica según la tabla.
- Un aprendizaje que cambia cómo se trabaja se aplica en el `CLAUDE.md`, una skill o una regla del lint; en la
  entrada queda la frase y el enlace a donde se aplicó.

**`docs/decisiones.md`: índice**
- Una línea por decisión importante: `AAAA-MM-DD · decisión · por qué · [entrada](registro/…)`. El detalle (qué se
  descartó) está en la entrada.

Siempre: distingue hechos de inferencias, no escribas motivos que la persona no ha dado y nunca tokens ni datos
personales.

## Estado

- [ ] {{paso 1 del plan}}

## Próximo paso

{{Qué hacer en la próxima sesión.}}

## Problemas abiertos

(ninguno)
