# {{nombre del proyecto}}

{{Qué es el proyecto en 2-3 frases: para quién es y qué hace.}}

**Al empezar cada sesión**, sigue la skill `iniciar-sesion`. Se trabaja un paso cada vez; al terminar uno, sigue la
skill `cerrar-paso`. Para pedir un cambio en lenguaje llano, la skill `pedir-cambio`. `/reflect` revisa el trabajo del
turno, y el agente `revisor` revisa el repositorio frente al plan y a las reglas.

### Quién usa el agente

{{Quién trabaja con el agente y si programa o no. Ejemplo: "Lo usan personas que no programan: explícalo todo sin
jerga, no les pidas leer código ni diffs, y cuando algo se bloquee cuéntales qué ha pasado y a quién avisar."}}

**A quién avisar** cuando el harness o la CI bloquean algo, o un cambio necesita a alguien técnico:
{{nombre y canal}}.

### Forma de trabajar

**Antes de implementar**
- Cuenta en 2-3 líneas qué vas a hacer, también cuando la persona ya te da la lista de tareas.
- Busca lo que ya existe (`CLAUDE.md`, `docs/`, `.claude/`, el código y los tests) antes de añadir una regla, una
  skill o un check. Si algo ya lo cubre, dilo y propón ampliarlo en vez de duplicarlo.
- No amplíes el alcance: aplica "Hueco, incumplimiento u opcional" (en Criterios, abajo).

**Al editar**
- Edita con la herramienta Edit después de leer el archivo, no con scripts (`sed`, Python): así no se pisan cambios
  ajenos ni se edita a ciegas.
- Para una prueba temporal, guarda antes una copia y restáurala. No deshagas cambios con `git checkout` ni
  `git restore`: descartan también lo que no es tuyo (el harness los bloquea).

**Contexto**
- Se trabaja una sesión por paso. Si la persona avisa de que va a cambiar de sesión, deja la bitácora lista para que
  otra sesión continúe sin esta conversación.
- Si el contexto está fallando, no implementes ni corrijas: deja la bitácora al día y pide abrir una sesión nueva.

### Criterios

**Ambigüedad.** Si una petición admite dos lecturas que llevan a cambios distintos, no elijas: pregunta con las dos
opciones y lo que implica cada una. Si solo cambia un detalle menor, elige la lectura más literal y dilo.

**Hueco, incumplimiento u opcional.**
- Hueco: falta algo que exigen {{fuentes del proyecto: docs/plan.md, documentos de producto, casos esperados}}. Se
  presenta como pendiente, citando la fuente. Nunca se ofrece como opcional.
- Incumplimiento: algo hecho contradice una regla de este `CLAUDE.md` o de una skill. Se corrige en el mismo paso,
  citando la regla. Nunca se ofrece como opcional.
- Opcional: algo útil que ninguna de esas fuentes ni reglas exige. Se propone y no se hace.

**Desviación del plan aprobado.** Si al ejecutar hay que salirse del plan (una función, un archivo o un patrón que no
estaban), para y pregunta antes de seguir, con lo que cambia y por qué. Avisar después no basta.

### Bitácora

`docs/bitacora.md` (foto común del proyecto), `docs/bitacora/<persona>.md` (en qué está y qué sigue cada persona,
según `HARNESS_PERSONA`), `docs/registro/` (una entrada por sesión, persona y rama) y `docs/decisiones.md` (índice
de decisiones). El formato y sus reglas están en un solo sitio:
[Cómo se escribe esta bitácora](docs/bitacora.md#cómo-se-escribe-esta-bitácora).

## Arquitectura

{{Capas o carpetas principales y qué va en cada una. Las reglas que se puedan comprobar, en una lista, y dónde se
comprueban (lint, test de arquitectura).}}

## Reglas

Las protecciones las aplica el plugin `harness-ia` con `.claude/harness.json` (política de commits: **{{persona|rama}}**):
- No se leen ni se cargan `.env*` (salvo `.env.example`). Si hace falta un valor, lo pega la persona.
- No se descartan cambios ni se reescribe el historial (`checkout`, `restore`, `reset --hard`, `rebase`, force-push).
- {{Con "rama": los cambios van a una rama de trabajo con PR; nada llega a {{rama principal}} sin la CI en verde.
  / Con "persona": no hagas commit ni push; los hace la persona.}}
- Nunca mezcles ni apruebes una PR (tampoco con merge automático): lo hace una persona en GitHub después de mirar la
  preview. El harness lo bloquea.
- Rutas protegidas, que solo cambia alguien técnico: {{lista de protectedPaths y su porqué}}.
- {{Reglas propias del proyecto. Para cada una, di si la comprueba una herramienta o depende de la persona.}}

Si una protección bloquea algo, no busques otro camino: explica qué se bloqueó y avisa (ver "A quién avisar").

## Convenciones

- {{Lenguaje, versión, framework, cómo se ejecuta.}}
- Código y comentarios en {{idioma}}; nombres de variables en {{idioma}}.

### Código limpio

- **Nombres legibles:** palabras completas que digan qué es. Nada de letras sueltas ni abreviaturas, salvo `id` y el
  índice `i` de un bucle.
- **DRY:** lo que se repite en 3 o más archivos se extrae a un módulo compartido.
- **Funciones pequeñas con un solo propósito.** Los comentarios explican el *porqué*, no el *qué*.
- Lo comprobable lo comprueba el lint. Una corrección que se repite pasa a ser una regla del lint, no una nota en la
  bitácora.

## Comandos

- `{{comando de verificación}}`: el "terminado" de `cerrar-paso` (lo ejecuta también el hook al terminar el turno,
  el pre-push y la CI).
- {{Otros comandos: arrancar en local, tests, etc.}}
