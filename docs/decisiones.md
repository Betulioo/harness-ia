# Decisiones

Índice de las decisiones importantes, una por línea y la más reciente arriba. El detalle (qué se descartó y por qué)
está en la entrada del registro enlazada. Formato en [bitacora.md](bitacora.md#cómo-se-escribe-esta-bitácora).

- 2026-10-28 · luis · El mantenimiento no vale si `HARNESS_MAINTENANCE` aparece en un `settings.json`, y el agente no puede fijarla · Claude Code no dice de dónde viene la variable · [entrada](registro/2026-10-28-luis-cambio-0.6.0.md)
- 2026-10-28 · luis · Las rutas protegidas cuentan desde la copia del repo que contiene el archivo (worktrees incluidos) · en un worktree no se protegía nada · [entrada](registro/2026-10-28-luis-cambio-0.6.0.md)
- 2026-10-28 · luis · El agente no pone etiquetas de ninguna forma salvo en mantenimiento · una etiqueta puede saltarse la CI · [entrada](registro/2026-10-28-luis-cambio-0.6.0.md)
- 2026-10-26 · luis · Ningún merge automático: una persona aprueba y mezcla la PR en GitHub tras ver la preview (sustituye a "validación solo automática") · las comprobaciones no ven si el resultado es lo que se pidió · [entrada](registro/2026-10-26-luis-main.md)
- 2026-10-26 · luis · Repo del plugin público · instalarlo no exige dar acceso a cada persona · [entrada](registro/2026-10-26-luis-main.md)
- 2026-10-26 · luis · Bitácora por personas con `HARNESS_PERSONA`; el estado de cada proyecto, en su repo · una sesión en el proyecto no encontraba el estado; varias personas a la vez · [entrada](registro/2026-10-26-luis-main.md)
- 2026-10-24 · `auditar-repo` con verificador independiente y confianza separada del riesgo · quien escribe un hallazgo no debe ser el único que lo comprueba · [entrada](registro/2026-10-24-main.md)
- 2026-10-24 · La configuración del agente la audita `pape:harness-audit`; `auditar-repo`, la aplicación y sus datos · pape lo hace con más rigor; no duplicar · [entrada](registro/2026-10-24-main.md)
- 2026-10-24 · Bitácora en tres archivos (foto vigente, registro por sesión y rama, índice de decisiones) · no crece sin límite ni choca entre ramas · [entrada](registro/2026-10-24-master.md)
- 2026-10-24 · Ante un error, el guardián bloquea (falla cerrado) · es más seguro parar que dejar pasar · [entrada](registro/2026-10-24-master.md)
- 2026-10-24 · Hooks en Node sin dependencias · funcionan igual en Windows y Linux · [entrada](registro/2026-10-24-master.md)
- 2026-10-24 · El harness protege sus propios archivos; mantenimiento con `HARNESS_MAINTENANCE=1` · el agente no puede desactivar sus protecciones · [entrada](registro/2026-10-24-master.md)
- 2026-10-24 · Políticas de commit `persona` y `rama` · el TFM y el piloto necesitan cosas opuestas · [entrada](registro/2026-10-24-master.md)
- 2026-10-24 · Validación solo automática · elegido por la persona; el guardián bloquea y la barrera final es rama protegida + CI · [entrada](registro/2026-10-24-master.md)
- 2026-10-24 · Plugin de Claude Code con marketplace local · elegido por la persona · [entrada](registro/2026-10-24-master.md)
