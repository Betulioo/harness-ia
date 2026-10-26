# Guía para trabajar con el agente sin saber programar

Esta guía es para ti si vas a pedir cambios en una aplicación hablando con Claude, sin escribir código. Explica qué
es lo que vas a usar, cómo dejar tu ordenador preparado (una sola vez) y cómo es el día a día.

No hace falta entender cómo funciona por dentro. Si algo de lo que lees aquí no coincide con lo que ves en tu
pantalla, para y avisa a la persona técnica de tu proyecto.

---

## 1. Qué es esto y para qué sirve

**Claude** es el asistente al que le pides los cambios: "quiero que la tabla de clasificación muestre también los
puntos", "cambia el texto del botón de entrar". Él busca dónde está eso en la aplicación, lo cambia, lo comprueba y
lo deja listo para que una persona lo revise y lo publique.

**El harness** (un "arnés", como el de escalada) es lo que hemos añadido a Claude para que no pueda romper nada.
Tiene cuatro partes:

| Parte | Qué hace por ti |
|---|---|
| **El guardián** | Impide a Claude hacer cosas peligrosas: borrar trabajo, ver contraseñas, publicar o tocar la base de datos. Si lo intenta, se bloquea y te explica por qué |
| **Las comprobaciones automáticas** | Con cada cambio se ejecutan unas pruebas que confirman que la aplicación sigue funcionando. Si fallan, no se puede publicar |
| **Tu visto bueno** | Claude nunca publica. Una persona mira el cambio en una versión de prueba (la *preview*) y, si es lo que se pidió, lo publica desde GitHub (sección 4) |
| **La bitácora** | Un cuaderno donde Claude apunta en qué estás, qué decidiste y qué sigue. Así, cuando vuelvas otro día, retoma donde lo dejaste |

**Lo importante:** tú dices **qué** quieres. Claude se encarga del **cómo**; las comprobaciones vigilan que no se
rompa nada, y una persona mira que el resultado sea el que se pidió. No tienes que leer código ni entender errores
técnicos.

---

## 2. Palabras que vas a oír

| Palabra | Qué significa |
|---|---|
| **Rama** | Una copia aparte de la aplicación donde se prepara un cambio sin tocar la que usa la gente |
| **PR** (*pull request*) | La propuesta de cambio: "esto es lo que he cambiado en mi rama; ¿lo pasamos a la aplicación de verdad?" |
| **Preview** | Una versión de prueba de la aplicación con tu cambio, con su propio enlace, para verlo antes de que lo vea nadie más |
| **Comprobaciones** o **CI** | Las pruebas automáticas que se ejecutan con cada cambio. En verde, todo bien; en rojo, algo falla |
| **Publicar** o **producción** | La aplicación que usa la gente de verdad |
| **El guardián** | La parte del harness que bloquea lo peligroso |
| **La bitácora** | El cuaderno de trabajo (sección 1) |

---

## 3. Preparar tu ordenador (una sola vez)

Se hace una vez y tarda una hora, más o menos. Si prefieres, hazlo en una videollamada con la persona técnica. Los
pasos son para Windows.

**Antes de empezar, pide a la persona técnica estos tres datos:**

| Dato | Ejemplo | El tuyo |
|---|---|---|
| Dirección del repositorio del proyecto | `https://github.com/empresa/proyecto.git` | |
| Identidad para guardar cambios (nombre y correo) | `proyecto` · `proyecto@ejemplo.com` | |
| Tu nombre corto para la bitácora | `rafa` | |

Vas a escribir algunos comandos en **PowerShell**: es una ventana para dar órdenes al ordenador escribiéndolas.
Para abrirla, pulsa la tecla Windows, escribe `PowerShell` y pulsa Enter. Para cada comando de esta guía: cópialo,
pégalo en esa ventana (clic derecho) y pulsa Enter. Si un paso dice "ya lo tienes", puedes saltártelo.

### Paso 1. Instalar los programas

Comprueba primero cuáles tienes ya. Escribe cada uno y mira la respuesta:

```powershell
node -v
```

```powershell
git --version
```

```powershell
gh --version
```

Si responde con un número de versión, ya lo tienes. Si dice que **no se reconoce**, instálalo:

| Programa | Para qué | Dónde se descarga |
|---|---|---|
| **Node.js** (versión LTS) | El guardián funciona con él: **sin Node, no protege nada** | nodejs.org → botón "LTS" |
| **Git** | Guarda y sube los cambios | git-scm.com → Download for Windows |
| **GitHub CLI** (`gh`) | Claude lo usa para crear las propuestas de cambio (PR) | cli.github.com → Download for Windows |

Instálalos con las opciones que vienen marcadas. Al terminar, **cierra PowerShell y ábrelo de nuevo**, y repite las
tres comprobaciones. `node -v` tiene que dar una versión **20.19 o mayor** (por ejemplo, `v22.x.x`).

Instala también la **terminal de Claude** (sirve para instalar y actualizar el harness):

```powershell
npm install -g @anthropic-ai/claude-code
```

Comprueba que funciona con `claude --version`. Si sale un error que habla de "ejecución de scripts deshabilitada",
para y avisa a la persona técnica.

Y, si no la tienes, la **app de escritorio de Claude** (claude.ai/download), con tu cuenta.

### Paso 2. Conectar con GitHub

GitHub es donde vive el código del proyecto. Escribe:

```powershell
gh auth login
```

Responde así a sus preguntas (con las flechas y Enter): **GitHub.com** → **HTTPS** → **Yes** → **Login with a web
browser**. Te dará un código; se abrirá el navegador, pega el código e inicia sesión con tu cuenta de GitHub.

### Paso 3. Descargar el proyecto

Esto crea una carpeta con el proyecto dentro de tus Documentos. Cambia la dirección por la del primer dato:

```powershell
cd $HOME\Documents
```

```powershell
git clone https://github.com/empresa/proyecto.git
```

Entra en la carpeta (cambia `proyecto` por el nombre que se haya creado) e instala lo que necesita:

```powershell
cd proyecto
```

```powershell
npm ci
```

Tarda un par de minutos. Al final puede hablar de *vulnerabilities* o *funding*: no te preocupes, la persona técnica
lo revisa.

### Paso 4. Tu identidad para guardar cambios

Algunos proyectos solo publican los cambios guardados con una identidad concreta. Dentro de la carpeta del proyecto,
escribe estos dos comandos con el segundo dato:

```powershell
git config user.name "proyecto"
```

```powershell
git config user.email "proyecto@ejemplo.com"
```

No escribe nada si sale bien. Claude no puede cambiar esto: es a propósito.

### Paso 5. Instalar el harness

Si la persona técnica ya lo ha dejado preparado en el proyecto, al abrirlo en Claude (paso 7) te ofrecerá instalar
**harness-ia**: acepta y sáltate este paso. Si no, escribe:

```powershell
claude plugin marketplace add Betulioo/harness-ia
```

```powershell
claude plugin install harness-ia@harness-ia
```

### Paso 6. Decirle a Claude quién eres

Así la bitácora sabe cuál es tu cuaderno. Abre tu configuración de Claude con:

```powershell
notepad $env:USERPROFILE\.claude\settings.json
```

Se abre el Bloc de notas. Justo después de la primera llave `{`, añade estas líneas, con tu nombre corto (tercer
dato) y **con la coma del final**:

```json
  "env": {
    "HARNESS_PERSONA": "rafa"
  },
```

Si el archivo ya tenía una sección `"env"`, añade solo la línea `"HARNESS_PERSONA": "rafa",` dentro de ella. Si el
Bloc de notas dice que el archivo no existe y pregunta si quieres crearlo, avisa a la persona técnica. Guarda y
cierra.

### Paso 7. Comprobar que todo funciona

1. Abre la app de Claude, ve a la pestaña **Code** y elige la carpeta del proyecto (la del paso 3).
2. Escribe: **iniciar sesión**. Claude debería saludarte por tu nombre y contarte en qué punto está el proyecto.
   Si te pregunta quién eres, el paso 6 no se ha aplicado: cierra la app, ábrela de nuevo y repite.
3. Escribe: **lee el archivo .env**. Claude tiene que responder que está **bloqueado por el harness**. Si lo lee,
   **para y avisa** a la persona técnica: el guardián no está funcionando.

Si las dos cosas salen bien, tu ordenador está listo.

---

## 4. El día a día

### Empezar

Abre la carpeta del proyecto en Claude (pestaña Code) y escribe **iniciar sesión**. Claude lee tu bitácora y te
cuenta en qué estabas y qué sigue.

### Pedir un cambio

Escríbelo como se lo dirías a una persona. Cuanto más concreto, mejor:

- ✅ "En la pantalla de Mi equipo, quiero que los jugadores lesionados salgan en gris."
- ❌ "Mejora Mi equipo."

Claude no empieza a cambiar nada todavía. Primero te responde con una **ficha**:

> **Lo que he entendido:** …
> **Lo que cambiará:** lo que vas a ver distinto.
> **Lo que no cambiará:** …
> **Cómo comprobarlo:** dónde mirarlo.
> **Tamaño:** pequeño, medio o grande.

**Léela con calma.** Si algo no es lo que querías, díselo antes de confirmar: es el momento más barato para
corregir. Si es grande, te propondrá partirlo en cambios pequeños.

Cuando confirmes, Claude hace el cambio en una rama, ejecuta las comprobaciones, abre la PR y te da su enlace.
**Nada se publica todavía**: Claude no puede publicar, aunque se lo pidas. Eso lo decide una persona en GitHub.

### Revisar y publicar

Normalmente lo haces tú mismo con tus cambios: eres quien sabe si el resultado es lo que pediste. Si en tu proyecto
lo aprueba otra persona, mándale el enlace de la PR.

1. Abre el enlace de la PR que te dio Claude. Se abre en GitHub.
2. **Mira la preview.** Unos minutos después de abrirse la PR, aparece en ella un comentario con el enlace a la
   versión de prueba (en muchos proyectos lo pone Vercel, con un botón *Visit Preview*). Ábrelo y comprueba que
   ves lo que pediste, en la pantalla que decía la ficha.
3. **Mira las comprobaciones**, abajo en la PR. Tienen que estar en verde (✓). Si están en rojo (✗), no se puede
   publicar: díselo a Claude y lo arreglará en la misma PR.
4. Si algo no es como querías, **no publiques**: vuelve a Claude y díselo ("el gris es demasiado claro"). Cambia la
   misma PR, y la preview se actualiza sola en unos minutos.
5. Si todo está bien, pulsa el botón verde **Merge pull request** y luego **Confirm merge**. En unos minutos el cambio
   está publicado en la aplicación de verdad.

Si tu proyecto exige una **aprobación** antes de publicar, la tiene que dar otra persona: GitHub no deja que quien
abrió la PR la apruebe.

### Terminar

No hace falta despedirse: al terminar cada cambio, Claude apunta en tu bitácora qué hizo y qué sigue. La próxima
vez, **iniciar sesión** lo retoma.

---

## 5. Si algo no sale bien

| Qué pasa | Qué hacer |
|---|---|
| Claude dice que algo está **bloqueado por el harness** | Es el guardián haciendo su trabajo. No le pidas que busque otra forma. Lee el motivo; si necesitas eso de verdad, avisa a la persona técnica |
| Claude dice que **eso lo tiene que hacer alguien técnico** (base de datos, configuración, programas nuevos) | Avisa a la persona técnica con lo que querías conseguir |
| **Las comprobaciones fallan** y Claude no consigue arreglarlo | No se ha publicado nada. Avisa a la persona técnica con el enlace de la PR |
| **No entiendes** lo que te dice Claude | Díselo: "explícamelo sin palabras técnicas" |
| Algo publicado **no está bien** | Avisa a la persona técnica. No intentes deshacerlo tú |
| Ves algo raro, **distinto de esta guía** | Para y avisa. Es mejor preguntar que adivinar |

**Nunca** pegues en el chat contraseñas, claves ni datos personales de nadie, aunque Claude te los pida.

---

## 6. Actualizar el harness

De vez en cuando, la persona técnica te avisará de que hay una versión nueva. En PowerShell:

```powershell
claude plugin marketplace update harness-ia
```

```powershell
claude plugin update harness-ia@harness-ia
```

Después cierra la app de Claude y ábrela de nuevo.
