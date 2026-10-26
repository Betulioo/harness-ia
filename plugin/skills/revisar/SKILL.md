---
name: revisar
description: Revisa en solo lectura si lo implementado cumple el plan y las reglas del proyecto, y lista lo que falta con evidencias. Úsala antes de una entrega o cuando se pida "revisar" o "qué me falta"; el cierre de un paso es de cerrar-paso. No corrige nada. Para no llenar el contexto, prefiere el agente revisor.
---

# Revisar el proyecto

Revisión independiente del estado del proyecto frente a su plan y sus reglas. Informas; la persona decide.
**No modificas ningún archivo** salvo el informe de revisión.

## Fuentes (léelas todas antes de opinar)

Si falta alguna, sigue con lo demás y di al principio del resultado qué archivo falta.

- `CLAUDE.md` — reglas del proyecto. Las fuentes que cite en "Hueco, incumplimiento u opcional" también son
  fuentes de esta revisión (requisitos, glosario, casos esperados…).
- `.claude/harness.json` — verificación, política de commits y rutas protegidas.
- `docs/plan.md` — diseño y criterio de "hecho" de cada paso.
- `docs/bitacora.md` y `docs/bitacora/*.md` — estado declarado, común y de cada persona; `docs/decisiones.md` —
  decisiones (el detalle, en la entrada de `docs/registro/` que enlaza cada una).
- El código y los tests.

## Comprobaciones

1. Ejecuta el `verifyCommand` y anota el resultado tal cual. Si el proyecto tiene comprobaciones separadas (tipos,
   lint, tests, arquitectura), anota cada una.
2. Revisa los tests con la skill `tests-semanticos`, apartado "Al revisar un test existente". Cita el número del
   criterio que falla; no copies los criterios en el informe.
3. Para cada paso marcado como hecho en la bitácora: ¿el código cumple el diseño y el criterio de "hecho" de
   `plan.md`?
4. Para cada regla del `CLAUDE.md`: ¿la comprueba una herramienta (hook, lint, test, CI) o depende de la memoria del
   agente? Las que no se comprueban y se podrían comprobar son hallazgos.
5. Secretos y datos: ningún token en archivos versionados ni en la salida de los scripts; `.env*` fuera de git.
6. ¿La bitácora refleja el estado real? (pasos marcados sin hacer, decisiones sin registrar o sin línea en
   `decisiones.md`, archivos por encima de los máximos del formato, trabajo "en curso" de una persona que el
   registro da por terminado)

## Reglas de la revisión

- Cada afirmación lleva su evidencia (ruta del archivo o resultado de un comando). Si algo no se puede comprobar,
  escribe "no verificable" y por qué.
- No des algo por bueno porque esté escrito en la bitácora o en un comentario: compruébalo.
- No propongas funcionalidades nuevas. Señala solo lo que falta para cumplir el plan o las reglas.

## Salida

Escribe `docs/revisiones/AAAA-MM-DD.md` (crea la carpeta si no existe) y muestra el resumen en el chat. Si te ejecutas
como agente `revisor`, no escribes nada: devuelves el informe completo y lo guarda el agente principal.

1. **Resultado de la verificación**, por comprobación.
2. **Tabla de tests:** archivo · test · qué protege · criterio de `tests-semanticos` que falla · lo que falta.
3. **Tabla del plan:** paso · estado · evidencia · problema detectado.
4. **Tabla de reglas:** regla · ¿se comprueba? (con qué) · evidencia.
5. **Los 3 riesgos principales**, ordenados por impacto.
6. **Siguientes acciones**, 5 como máximo, concretas y ordenadas.
