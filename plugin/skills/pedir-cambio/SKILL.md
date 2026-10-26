---
name: pedir-cambio
description: Flujo para que una persona que no programa pida un cambio en la aplicación en lenguaje llano. Lo convierte en un paso pequeño con criterio de aceptación, pide confirmación, lo implementa en una rama, lo verifica y abre una PR que una persona aprueba y mezcla en GitHub después de mirar la preview. Úsala cuando alguien pida "cambia…", "añade…", "arregla…" o "quiero que la web…".
---

# Pedir un cambio

La persona sabe **qué** quiere ver en la aplicación, no **cómo** está hecho. Tu trabajo es traducir, hacerlo pequeño
y seguro, y contárselo en sus palabras. Nunca le pidas que lea código, un diff o un error técnico.

## 1. Entender (no toques nada todavía)

1. Si no se ha hecho en esta sesión, sigue `iniciar-sesion`.
2. Busca en el código dónde está lo que pide, sin cambiar nada.
3. Responde con esta ficha, en lenguaje llano y en 8 líneas como máximo:
   - **Lo que he entendido:** una frase.
   - **Lo que cambiará:** lo que verá el usuario de la aplicación (pantalla, texto o comportamiento).
   - **Lo que no cambiará:** lo que se queda igual, sobre todo si se parece.
   - **Cómo comprobarlo:** qué mirar y dónde (la preview de la PR o una pantalla concreta).
   - **Tamaño:** pequeño (un texto o un estilo), medio (una pantalla) o grande.
4. Si la petición admite dos lecturas, no elijas: pregunta con las dos opciones y qué verá en cada una.
5. Si es **grande**, propón partirlo en cambios pequeños, cada uno publicable por separado, y empieza solo por el
   primero.
6. Para y pregunta antes de seguir si el cambio:
   - toca una **ruta protegida** (`protectedPaths` en `.claude/harness.json`): base de datos, configuración o
     dependencias. Eso lo hace alguien técnico.
   - contradice una regla del `CLAUDE.md` o de los documentos del producto que este cite.
   - necesita algo que no existe (una tabla, un servicio, un dato nuevo).

   En estos casos explica en una frase por qué no lo puedes hacer tú y a quién se lo debe pedir (sección
   "A quién avisar" del `CLAUDE.md`).
7. Espera a que la persona confirme la ficha.

## 2. Hacer

1. Crea una rama de trabajo si estás en la principal: `git switch -c cambio/<descripcion-corta>`.
2. Haz el cambio más pequeño que cumpla la ficha y sigue el estilo del código que lo rodea.
3. Si el cambio toca lógica (cálculos, reglas, permisos), añade o ajusta un test que falle sin el cambio. Aplica la
   skill `tests-semanticos`.
4. No añadas dependencias, no cambies la configuración ni toques nada fuera de lo acordado. Si hace falta, vuelve
   al punto 1.6.

## 3. Cerrar y dejarlo listo para revisar

Sigue `cerrar-paso` entero, incluida la PR. **No la mezcles ni la apruebes**: eso lo hace una persona en GitHub.
El mensaje final para la persona:
- Qué has cambiado, en una o dos frases y con sus palabras.
- Dónde verlo: el enlace de la PR y, cuando Vercel (o el servicio de previews) la publique, el de la preview.
- Qué pasa ahora: "mira la preview; si es lo que querías y las comprobaciones están en verde, se aprueba y se
  publica desde GitHub. Si quieres algo distinto, dímelo y lo cambio en la misma PR".

Si la persona pide cambios después de ver la preview, hazlos en la misma rama (vuelve a `cerrar-paso`: el push
actualiza la PR y su preview). No abras una PR nueva para lo mismo.

## Si algo se bloquea

Si un hook del harness o la CI bloquean algo, **no busques otro camino**. Cuéntale a la persona en una frase qué
intentabas, que el sistema lo ha impedido para proteger la aplicación y qué opciones hay. Apúntalo en su bitácora
(`docs/bitacora/<persona>.md`, Problemas abiertos) para que alguien técnico lo revise.
