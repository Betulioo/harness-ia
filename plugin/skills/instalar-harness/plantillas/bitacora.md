# Bitácora del proyecto

La foto común del proyecto: lo que todos leen al empezar una sesión. No crece: se reemplaza. Lo de cada persona va
en `docs/bitacora/<persona>.md`, el historial en `docs/registro/` y el índice de decisiones en
[`docs/decisiones.md`](decisiones.md).

## Cómo se escribe esta bitácora

Este bloque es la única definición del formato; las skills y el CLAUDE.md enlazan aquí.

**Quién es quién.** Cada persona tiene un nombre corto en minúsculas (`luis`, `rafa`) en la variable
`HARNESS_PERSONA` de su configuración de Claude (`~/.claude/settings.json` → `"env"`). Si falta, la sesión
pregunta. No sirve la identidad de git: varias personas pueden commitear con la misma.

**Dónde va cada cosa**

| Sección | Archivo | Va aquí si… | No va aquí |
|---|---|---|---|
| Estado | `bitacora.md` | Es el avance de un paso del plan común: hecho, en curso (y quién) o pendiente | Explicaciones del porqué |
| Problemas abiertos del proyecto | `bitacora.md` | Algo que falla o falta y afecta a todos, con el error exacto | Lo que solo bloquea la tarea de una persona |
| En curso | `bitacora/<persona>.md` | En qué está esa persona: rama, paso y qué falta de él | Lo ya terminado |
| Próximo paso | `bitacora/<persona>.md` | Lo concreto por lo que sigue su próxima sesión y las decisiones que le faltan | Lo de otra persona |
| Problemas abiertos propios | `bitacora/<persona>.md` | Lo que bloquea su tarea, con el error exacto. También lo que el harness le bloqueó | Lo que afecta a todos: va a `bitacora.md` |
| Decisiones | entrada del registro + una línea en `decisiones.md` | Se eligió entre alternativas: qué, por qué y qué se descartó | Lo que se hizo sin elegir nada |
| Hechos comprobados | entrada del registro | Algo verificado con un comando, un test o el sistema real, citando cómo | Suposiciones |
| Errores y correcciones | entrada del registro | Algo que se intentó y falló: intento → por qué falló → qué cambia | Fallos aún sin resolver: van a Problemas abiertos |
| Aprendizajes | entrada del registro | Algo que cambia cómo se trabaja a partir de ahora | Detalles de un solo paso |

En caso de duda entre dos secciones, elige una y escribe "(dudoso: X o Y)" para que la persona lo revise.

**`bitacora.md` y `bitacora/<persona>.md`: fotos vigentes, cortas**
- Se **reemplazan**, no se acumulan. Cada persona solo escribe en su archivo; `bitacora.md` cambia cuando avanza un
  paso del plan común o aparece un problema que afecta a todos.
- Máximo orientativo: Estado 15 líneas y Problemas abiertos 10 en `bitacora.md`; cada sección de un archivo personal,
  10. Si no cabe, resume: los pasos terminados en una línea ("1–6 hechos") y el detalle en el registro, con enlace.
- El archivo de quien no programa se escribe en lenguaje llano, sin jerga ni rutas de archivos.

**`docs/registro/AAAA-MM-DD-<persona>-<rama>.md`: una entrada por sesión, persona y rama**
- Nombre: fecha, persona y rama con `/` cambiada por `-` (`2026-10-27-rafa-cambio-clasificacion.md`). Si la misma
  persona vuelve a trabajar el mismo día en la misma rama, se añade al mismo archivo. Así dos personas nunca
  escriben en el mismo archivo de historial.
- Secciones: Decisiones, Hechos comprobados, Errores y correcciones, Aprendizajes (solo las que tengan algo).
- Es historial: no se poda ni se reescribe; solo se corrige lo que sea falso o se reclasifica según la tabla.
- Un aprendizaje que cambia cómo se trabaja se aplica en el `CLAUDE.md`, una skill o una regla del lint; en la
  entrada queda la frase y el enlace a donde se aplicó.

**`docs/decisiones.md`: índice común**
- Una línea por decisión importante: `AAAA-MM-DD · persona · decisión · por qué · [entrada](registro/…)`. El
  detalle (qué se descartó) está en la entrada.

Siempre: distingue hechos de inferencias, no escribas motivos que la persona no ha dado y nunca tokens ni datos
personales.

## Estado

- [ ] {{paso 1 del plan}}

## Problemas abiertos del proyecto

(ninguno)
