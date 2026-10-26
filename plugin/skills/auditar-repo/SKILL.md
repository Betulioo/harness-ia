---
name: auditar-repo
description: Audita en solo lectura si un repositorio heredado o hecho sin criterio ("vibe coding") está listo para que una persona que no programa haga cambios sin revisión técnica del código (comprobaciones automáticas y visto bueno en la preview): despliegue, datos, secretos, dependencias, código y las comprobaciones mínimas. Escribe un informe verificado con prioridades. Úsala al adoptar un repo o cuando se pida "auditar el repo" o "¿está listo para el harness?". No revisa la configuración del agente (eso es pape:harness-audit) ni corrige nada.
---

# Auditar un repositorio

Objetivo: saber qué hay que arreglar para que una persona que no programa pueda hacer cambios **sin revisión técnica
del código** sin romper la aplicación ni sus datos: las comprobaciones automáticas deciden si algo se rompe y una
persona, mirando la preview, si es lo que se pidió. Informas; la persona decide. **No modificas nada** salvo el
informe.

## Qué no cubre: la configuración del agente

La coherencia del harness (instrucciones que se contradicen, reglas sin nada que las aplique, hooks que fallan
abiertos, permisos, subagentes, skills, MCP del proyecto, DoD distinto de la CI) la revisa **`pape:harness-audit`**,
que lo hace con más rigor. Aquí solo se comprueba si existen las piezas mínimas (§1) para dar el veredicto.

- Si `pape:harness-audit` está disponible, dilo al final y recomienda pasarla **después de instalar el harness**:
  antes solo encontraría ausencias.
- Si no lo está, di que la revisión del harness queda fuera de este informe y cómo instalarla (plugin `pape`).

No dupliques sus comprobaciones. Si al auditar ves algo del harness, apúntalo en una línea en "Para
pape:harness-audit" (§Salida 6) sin desarrollarlo.

## Reglas

- Solo lectura: archivos, `git log`/`git show`, los scripts de comprobación que ya existan, `npm audit
  --package-lock-only` y `gh` en modo lectura (`gh api` sin `-X`, `gh repo view`). No instales dependencias ni
  ejecutes migraciones, despliegues ni seeds.
- Nunca abras `.env*` ni copies un valor secreto: si encuentras uno, cita el archivo y la línea y escribe `[secreto]`.
- Cada hallazgo lleva su evidencia (ruta y línea, o comando y salida) y dos valoraciones **separadas**:
  - **Riesgo**: alto (puede romper producción, perder datos o filtrar secretos), medio (coste real, recuperable) o
    bajo (fricción).
  - **Confianza**: **Confirmado** (leído en un archivo o en la salida de un comando; cítalo) o **Probable**
    (deducido; di de qué y qué haría falta para confirmarlo). La ausencia de una prueba no es una prueba de
    ausencia: si algo podría estar en un sitio raro, es Probable con la búsqueda que hiciste.
- Lo que no puedas comprobar, márcalo "no verificable" y di qué haría falta (por ejemplo, el panel de Vercel).
- No propongas funcionalidades nuevas, solo lo necesario para trabajar con seguridad.

## Qué revisar

### 1. Comprobaciones mínimas (solo si existen y qué ejecutan)
- Scripts de `package.json` (o equivalentes): typecheck, lint, tests y un único comando de verificación. Ejecuta los
  que existan sin instalar nada; si faltan dependencias, anótalo como no verificable.
- Tests: cuántos hay y qué lógica con riesgo no tiene ninguno.
- CI: ¿existe? ¿ejecuta la verificación en cada PR?
- Protección de la rama principal: `gh api repos/{owner}/{repo}/branches/{rama}/protection` y
  `gh api repos/{owner}/{repo}/rulesets`. ¿Exige PR y CI en verde? ¿Prohíbe el push directo? Si el repo es privado,
  el plan de GitHub (con Free no hay rulesets en repos privados).

### 2. Despliegue
- ¿Qué despliega y cuándo? ¿Un push a la rama principal va a producción?
- ¿Hay previews por rama o PR? ¿Usan los datos y servicios de producción?
- Crons y tareas programadas (`vercel.json`, workflows, `pg_cron`…): qué tocan y cómo se autentican. Un endpoint que
  deja pasar la llamada si falta su secreto falla abierto.
- ¿Algo exige una identidad de commit concreta para publicar?

### 3. Secretos
- `.gitignore` cubre `.env*` y comprueba que el patrón casa de verdad con los archivos; `git ls-files` no contiene
  ningún `.env` salvo los de ejemplo.
- Claves en el código versionado (`git grep -nE "(sk_|secret|service_role|api[_-]?key|token)"`).
- Variables públicas del cliente (`NEXT_PUBLIC_*`, `VITE_*`) que no deberían serlo.
- Clientes con privilegios (claves de servicio, admin): dónde se usan y si algo impide importarlos desde el navegador.

### 4. Base de datos y servicios externos
- Migraciones: dónde están, cuántas hay, cómo se aplican y quién las aplica.
- ¿Hay un entorno de pruebas separado o todo apunta a producción?
- Seguridad de filas (RLS o equivalente) en las tablas: cuéntalas con una búsqueda que tolere espacios y compara
  el total con las que lo activan.
- Lógica de negocio que vive en la base de datos (funciones, triggers): cuánta hay y si se puede probar.
- CLIs o MCP que puedan escribir en producción, según las instrucciones del repo (la configuración MCP en sí es de
  `pape:harness-audit`).

### 5. Código y dependencias
- Vulnerabilidades: `npm audit --omit=dev --package-lock-only` (o el equivalente del ecosistema). Las críticas y
  altas en dependencias directas son hallazgos de riesgo alto.
- Estructura: archivos de más de 400 líneas y lógica de negocio mezclada con la interfaz.
- Tipos: `strict`, `any`, `@ts-ignore` y `eslint-disable`, contando cuántos y dónde.
- Módulos de lógica pura que se pueden probar sin base de datos: son el primer sitio para empezar los tests.

## Verificación independiente (obligatoria)

Quien escribe los hallazgos no debe ser el único que los comprueba. Antes de escribir el informe:

1. Lanza **un subagente de solo lectura** (tipo `Explore` o similar, sin herramientas de escritura) con la lista de
   hallazgos en el prompt: para cada uno, la afirmación, la evidencia citada (`archivo:línea` o comando) y la
   confianza. No le pases el borrador del informe.
2. Su encargo: **intentar refutar** cada hallazgo releyendo el archivo o repitiendo el comando, y devolver un
   veredicto por hallazgo: **se mantiene**, **corregido** (con el dato bueno) o **descartado** (con el porqué). No
   opina sobre propuestas ni añade hallazgos nuevos.
3. Aplica los veredictos. Un hallazgo corregido cambia en el informe; uno descartado no aparece, pero se lista en
   §Salida 7 con el motivo. Si el verificador y tú no estáis de acuerdo, vuelve a abrir el archivo tú mismo y
   decide con la evidencia, no con la opinión.

## Salida

Escribe `docs/auditoria-AAAA-MM-DD.md` (crea `docs/` si no existe) y muestra el resumen en el chat.

1. **Veredicto** en 3 líneas: ¿puede usarlo ya alguien que no programa? Si no, qué lo impide.
2. **Requisitos mínimos para trabajar sin revisión técnica**, con ✅/❌/❓ y evidencia:
   - Un solo comando de verificación que pasa en local.
   - Tests sobre la lógica con más riesgo.
   - CI que ejecuta la verificación en cada PR.
   - Rama principal protegida: PR obligatoria, CI obligatoria, sin push directo y sin merge automático.
   - Previews por PR donde una persona pueda ver el cambio antes de aprobarlo (con sesión, si la app la pide).
   - Harness instalado (`.claude/harness.json` y plugin activo) con las rutas peligrosas protegidas.
   - El agente no puede leer secretos ni escribir en producción (BD, despliegue).
   - Las previews no usan datos de producción (o el riesgo está aceptado por escrito).
3. **Hallazgos**: tabla con id · área (1–5) · hallazgo · evidencia · riesgo · confianza · propuesta · ¿bloquea el
   uso por no programadores? (sí/no). Ordenada por riesgo y, a igual riesgo, Confirmado antes que Probable. Después,
   en una lista corta, lo que está bien y conviene conservar.
4. **Plan de mejora** en pasos pequeños, cada uno publicable por separado, empezando por los que bloquean. Para cada
   paso: qué, por qué (id del hallazgo) y cómo se comprobará que está hecho.
5. **Reglas para `harness.json`**: los `protectedPaths`, `blockedTools` y `blockedCommands` que propones para este
   proyecto, con el motivo de cada uno.
6. **Para `pape:harness-audit`**: lo que viste de la configuración del agente sin desarrollarlo, y cuándo pasarla.
7. **Verificación**: cuántos hallazgos se mantuvieron, cuáles se corrigieron (antes → después) y cuáles se
   descartaron y por qué.
8. **Lo que no se pudo verificar** y qué haría falta.
