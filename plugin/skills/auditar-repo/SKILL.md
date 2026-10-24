---
name: auditar-repo
description: Audita en solo lectura un repositorio heredado o hecho sin criterio ("vibe coding") antes de que lo use gente que no programa. Revisa cómo se valida, el despliegue, los secretos, la base de datos, el código y las instrucciones para agentes, y escribe un informe con prioridades. Úsala al adoptar un repo nuevo o cuando se pida "auditar el repo" o "¿está listo para el harness?". No corrige nada.
---

# Auditar un repositorio

Objetivo: saber qué hay que arreglar para que una persona que no programa pueda hacer cambios **con validación solo
automática** sin romper nada. Informas; la persona decide. **No modificas nada** salvo el informe.

## Reglas

- Solo lectura: archivos, `git log`/`git show`, los scripts de comprobación que ya existan y `gh` en modo lectura
  (`gh api` sin `-X`, `gh repo view`). No instales dependencias ni ejecutes migraciones, despliegues ni seeds.
- Nunca abras `.env*` ni copies un valor secreto en el informe: si encuentras uno, cita el archivo y la línea y
  escribe `[secreto]`.
- Cada hallazgo lleva su evidencia (ruta y línea, o comando y salida). Lo que no puedas comprobar, márcalo
  "no verificable" y di qué haría falta (por ejemplo, acceso al panel de Vercel).
- No propongas funcionalidades nuevas, solo lo necesario para trabajar con seguridad.

## Qué revisar

### 1. Cómo se valida hoy
- Scripts de `package.json` (o equivalentes): ¿hay typecheck, lint, tests y un único comando de verificación?
  Ejecuta los que existan y anota el resultado.
- Tests: cuántos hay, qué lógica cubren y cuál de la lógica con riesgo no tiene ninguno.
- CI (`.github/workflows/`, otros): ¿existe? ¿qué ejecuta? ¿en PRs?
- Hooks de git (`.githooks/`, `.husky/`, `core.hooksPath`).
- Protección de la rama principal: `gh api repos/{owner}/{repo}/branches/{rama}/protection` y
  `gh api repos/{owner}/{repo}/rulesets`. ¿Exige PR y CI en verde? ¿Prohíbe el push directo?

### 2. Despliegue
- ¿Qué despliega y cuándo? (Vercel, Netlify, Actions…): ¿un push a la rama principal va a producción?
- ¿Hay previews por rama o PR? ¿Usan los datos y servicios de producción?
- Crons y tareas programadas (`vercel.json`, workflows): qué tocan.

### 3. Secretos
- `.gitignore` cubre `.env*`; `git ls-files` no contiene ningún `.env` salvo los de ejemplo.
- Busca claves en el código versionado (`grep -rnE "(sk_|secret|service_role|api[_-]?key|token)" --exclude-dir=node_modules`).
- Variables públicas del cliente (`NEXT_PUBLIC_*`, `VITE_*`) que no deberían serlo.
- Historial: `git log -p -S "<patrón>"` solo si hay indicios; no lo recorras entero.

### 4. Base de datos y servicios externos
- Migraciones: dónde están, cuántas hay, cómo se aplican y quién las aplica.
- ¿Hay un entorno de pruebas separado o todo apunta a producción?
- Permisos y seguridad de filas (RLS o equivalente) en las tablas que escribe la aplicación.
- Servidores MCP o CLIs configurados (`.mcp.json`, `.claude/settings*.json`) que puedan escribir en producción.

### 5. Código
- Estructura: carpetas, archivos de más de 400 líneas y lógica de negocio mezclada con la interfaz.
- Tipos: `strict` en tsconfig, `any`, `@ts-ignore` y `eslint-disable`, contando cuántos y dónde.
- Duplicación evidente y código muerto (sin buscar exhaustivamente: ejemplos representativos).
- Dependencias: versiones fijadas, `npm audit --omit=dev` si se puede sin instalar.

### 6. Instrucciones para agentes
- `CLAUDE.md`, `AGENTS.md`, skills y settings: qué reglas hay.
- Para cada regla: ¿la comprueba una herramienta (hook, lint, test, CI, permiso) o depende de la memoria del agente?
- Documentos citados que no están en el repo (rutas a otras máquinas, carpetas privadas).

## Salida

Escribe `docs/auditoria-AAAA-MM-DD.md` (crea `docs/` si no existe) y muestra el resumen en el chat.

1. **Veredicto** en 3 líneas: ¿puede usarlo ya alguien que no programa? Si no, qué lo impide.
2. **Requisitos mínimos para validación automática**, con ✅/❌ y evidencia:
   - Un solo comando de verificación que pasa en local.
   - Tests sobre la lógica con más riesgo.
   - CI que ejecuta la verificación en cada PR.
   - Rama principal protegida: PR obligatoria, CI obligatoria y sin push directo.
   - Harness instalado (`.claude/harness.json` y plugin activo) con las rutas peligrosas protegidas.
   - El agente no puede leer secretos ni escribir en producción (BD, despliegue, MCP).
   - Las previews no usan datos de producción (o el riesgo está aceptado por escrito).
3. **Hallazgos**: tabla con id · área (1–6) · hallazgo · evidencia · riesgo (alto/medio/bajo) · propuesta ·
   ¿bloquea el uso por no programadores? (sí/no). Ordenada por riesgo.
4. **Plan de mejora** en pasos pequeños, cada uno publicable por separado, empezando por los que bloquean.
   Para cada paso: qué, por qué (id del hallazgo) y cómo se comprobará que está hecho.
5. **Reglas para `harness.json`**: los `protectedPaths`, `blockedTools` y `blockedCommands` que propones para este
   proyecto, con el motivo de cada uno.
6. **Lo que no se pudo verificar** y qué haría falta.
