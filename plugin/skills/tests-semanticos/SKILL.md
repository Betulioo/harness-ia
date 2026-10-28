---
name: tests-semanticos
description: Criterios para que cada test compruebe un comportamiento con significado (una regla de negocio, un caso esperado o una regla del CLAUDE.md) y no detalles internos. Úsala al escribir o revisar tests.
---

# Tests semánticos

Un test vale lo que vale la regla que protege. Antes de escribir o aprobar uno, responde: **¿qué regla de negocio,
qué caso esperado o qué regla del `CLAUDE.md` dejaría de cumplirse si este test fallara?** Si no hay respuesta, el
test sobra o está mal enfocado.

Las reglas de negocio están donde diga el `CLAUDE.md` del proyecto (glosario, documentos de producto, casos de
prueba). Enlázalas; no copies su contenido en los tests.

## Criterios

1. **Cada test nombra lo que protege.** El nombre cita la regla, el término o el caso, en español:
   `"un equipo con 4 traspasos no puede hacer otro"`, `"el draft salta al equipo que no ha elegido a tiempo"`.
   Un nombre como `"funciona correctamente"` o `"filtra bien"` no dice qué regla se rompe.
2. **Aserciones sobre resultados observables.** Se comprueba lo que devuelve la función o lo que ve el usuario, no
   cómo se calcula: ni el orden de llamadas internas, ni variables privadas, ni cuántas veces se llamó a una
   función auxiliar. Excepción: cuando el comportamiento **es** una llamada a un servicio externo (qué se pide y
   con qué parámetros).
3. **Tiempo y umbrales inyectados.** La fecha actual y los umbrales se pasan como parámetros con valores fijos.
   Nunca la hora real: un test que pasa hoy y falla mañana no protege nada. Para un umbral, prueba el límite exacto
   y sus vecinos.
4. **Los negativos pesan igual que los positivos.** Lo que **no** debe aparecer también es parte del
   comportamiento. Compara la lista completa (`deepEqual`), no `includes` de los que sí están: así un elemento que
   sobra también hace fallar el test.
5. **Sin red ni credenciales.** Los tests usan datos en memoria o dobles que implementan la interfaz real, nunca la
   base de datos ni la API de producción.
6. **Usar AAA Arrange, Act, Assert**: Los test tienen que preparar los datos y el entorno, ejecutar la acción que se quiere comprobar y verificar que el resultado sea el esperado.   

## Para comprobar que un test sirve

Rompe a propósito la regla que cubre (guarda antes una copia del archivo), mira que el test falla y restaura la
copia. Si no falla, el test no protege esa regla.

## Al revisar un test existente

Para cada test, anota:
- **Qué protege:** la regla, el término o el caso (o "nada identificable").
- **Qué falla** de los criterios 1–6, con la línea.
- **Qué falta:** reglas o casos sin ningún test, sobre todo los negativos y los límites.

No corrijas al revisar: informa y deja que la persona decida.
