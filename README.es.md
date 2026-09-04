<div align="center">

# 👥 dsh-background-agents
- **Canal 1024 store**: `npm i -g dsh1024` una vez, luego `dsh1024 plugin --profile web add dsh-background-agents` (cuenta para el ranking de instalaciones de [deepseek1024.com](https://deepseek1024.com)).

**Agentes de fondo interactivos de sesión larga más salas de equipo multiagente persistentes para DeepSeek Harness — inicia un agente hijo duradero que sigue trabajando mientras tú sigues hablando.**

*Dirige conversaciones en vivo y coordina un equipo entre sesiones; todo sobrevive a los reinicios mediante el almacenamiento propio del harness.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-background-agents/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-background-agents/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-background-agents?label=version)](https://github.com/PerryLink/dsh-background-agents/releases)
[![npm version](https://img.shields.io/npm/v/dsh-background-agents)](https://www.npmjs.com/package/dsh-background-agents)
[![npm downloads](https://img.shields.io/npm/dm/dsh-background-agents)](https://www.npmjs.com/package/dsh-background-agents)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## Compatibilidad

Los hosts `0.1.2-alpha.2` y posteriores fallan en cerrado ante el vocabulario de eventos de sesión, así que este plugin ya no escribe allí sus eventos de hechos solo-registro (`background-agents/fact`, `team-room/fact`): los hechos van al canal de logger/panel y las proyecciones se degradan a un pliegue vacío. Las líneas rc anteriores (hasta `0.1.1-rc.2`) mantienen la disciplina del marcador ignorable. La mitad de cliente ahora usa los paquetes de cliente actuales (`dsh-api-session-controller`, `dsh-client-web`) y el remoto subagent actual (`interruptByParent`, `prompt` con `requestId` acuñado por el cliente; el antiguo RPC `history` desapareció — los vistazos de resultado leen la proyección `conversation` de la sesión hija).
0.1.2-rc.1 (adaptado el 2026-09-04): el sobre de sesión conserva su campo ignorable solo para compatibilidad de lectura de logs almacenados - Session.append aún no puede estamparlo (el tercer parámetro es SurfaceIntent, solo para tipos de eventos de superficie, nunca un paquete de opciones), por lo que el comportamiento de la puerta de hechos no cambia.

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `0.1.2-rc.1` (peers `>=0.1.0-rc.8 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Todas (herramientas de host; panel lateral web y salas de equipo opcionales mediante la capacidad de dominio de almacenamiento) |
| Modelo | Cualquiera (los hijos heredan la ruta del padre; `childProvider`/`childModel` la reemplazan) |

## Qué obtienes

`dsh-background-agents` convierte los *jobs* de fondo de DSH (dispara y olvida) en dos superficies coordinadas:

1. **Cinco herramientas de dirección** — `background_agent` inicia un hijo duradero y continuable en la costura oficial de subagentes (`tool_filter` opcional — elimina herramientas, nunca concede nuevas; `persona`; `max_depth`; ruta `childProvider`/`childModel`). `bg_message` entrega un turno posterior; `bg_list` informa el estado (o el árbol de descendientes con `parentId`/`depth`); `bg_result` lee el último texto de resultado (el respaldo de razonamiento se marca `textSource: 'reasoning'`); `bg_stop` solicita la interrupción.
2. **Progreso y archivado** — `autoReport` inyecta una línea de progreso con límite de frecuencia tras cada turno del hijo; `reportDelivery: wakeup` inicia un turno del padre cuando está inactivo. El barrido de inactividad archiva los hijos callados y `bg_message` los despierta de nuevo (`autoArchive: false` deja estacionados a los observadores callados en su lugar).
3. **Proyección de panel + panel web** — la proyección de sesión `backgroundAgents` pliega el log del padre en filas; un panel lateral muestra estado en vivo, salto, mensaje, parada y vista previa del resultado. Todo se reconstruye desde el log duradero — sin base de datos separada.
4. **Salas de equipo (v0.5.0+)** — la familia de comandos `/room` más ocho herramientas `room_*` construyen salas multiagente persistentes: miembros (cada uno una sesión independiente), un bus de mensajes (dirigido/difusión), un tablero de tareas compartido y una línea de tiempo compartida — almacenados en el dominio de almacenamiento `team_rooms` (SQLite o JSONL) y recuperados tras reinicios de DSH. Los traspasos de tareas entre miembros pasan por la costura oficial de aprobación.

## Inicio rápido

```sh
# 1. instala el bundle en tu perfil
dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"

# o desde npm (versiones publicadas)
dsh plugin --profile web add dsh-background-agents

# 2. reinicia y verifica la fila
dsh --profile web --dump-config | grep -A4 'id: background-agents'
```

El parche del bundle lleva la fila del plugin; `provider` es obligatorio. El repo commitea su salida de build (`lib/`), así que la instalación por git no necesita paso de build. El plugin necesita la espina dorsal de subagentes ya montada (cualquier perfil construido sobre `@deepseek-ai/dsh-base` la tiene). Las salas de equipo se montan donde se componga el dominio de almacenamiento (`@deepseek-ai/dsh-storage-domain`); las cinco herramientas `bg_*` funcionan sin él.

Luego, en cualquier sesión, simplemente pídeselo al modelo — o llama a las herramientas directamente:

```
background_agent "watch the repo for test failures and keep me posted" (label: test-watch)
bg_list
bg_message <agentId> "also check the snapshot tests now"
bg_stop <agentId>
```

## Instalación y desinstalación

- **Canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"` — `lib/` commiteado, sin paso de `prepare` ni `allowBuilds`.
- **Canal npm** (versiones publicadas): `dsh plugin --profile web add dsh-background-agents`.
- **Canal tarball**: `pnpm pack` en este repo y luego `dsh plugin --profile web add ./dsh-background-agents-<version>.tgz`.
- **Desinstalación**: `dsh plugin --profile web remove dsh-background-agents` (o elimina la fila del parche de perfil).

## Configuración

Cada opción es un campo Schemastery `Config` validado — cámbialo en cordis.yml, nunca en código. Solo `provider` es obligatorio.

| Clave | Por defecto | Significado |
|---|---|---|
| `provider` | *(obligatorio)* | Nombre del proveedor `ctx.subagents` para inicios continuables (`spawn`) |
| `autoReport` | `true` | Inyecta una línea de progreso en el padre tras cada turno del hijo |
| `reportDelivery` | `quiet` | `quiet` añade la línea a la siguiente petición del modelo; `wakeup` inicia un turno del padre cuando está inactivo |
| `reportThrottleMs` | `15000` | Brecha mínima entre dos inyecciones de progreso de un hijo |
| `reportSummaryMaxChars` | `300` | Límite duro del texto de la línea de progreso (con puntos suspensivos) |
| `resultMaxChars` | `4000` | Límite duro del texto de `bg_result` (con puntos suspensivos, marcado `truncated`) |
| `maxBackgroundAgents` | `4` | Límite duro de agentes de fondo no archivados por sesión padre |
| `autoArchive` | `true` | Interruptor de archivado por inactividad; en `false`, el barrido nunca archiva hijos callados |
| `idleTimeoutMinutes` | `120` | Ventana de inactividad tras la cual se archiva un hijo callado (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | Periodo del barrido de archivado |
| `maxLabelChars` | `120` | Límite de la etiqueta de visualización (con puntos suspensivos) |
| `childProvider` | *(heredado)* | Ruta de proveedor para las peticiones del modelo del hijo |
| `childModel` | *(heredado)* | Id del modelo para las peticiones del hijo |
| `maxChildDepth` | *(ninguno)* | Techo de configuración para el argumento `max_depth` de un inicio |
| `allowedChildTools` | *(ninguna)* | Lista blanca de nombres de `tool_filter`; vacía/ausente = sin límite |
| `maxRooms` | `16` | Límite duro de salas de equipo en el perfil |
| `maxMembersPerRoom` | `8` | Límite duro de miembros por sala |
| `maxRoomsPerMember` | `4` | Límite duro de salas a las que una sesión miembro puede unirse |
| `busRetention` | `200` | Mensajes de bus conservados por sala |
| `timelineRetention` | `500` | Eventos de línea de tiempo conservados por sala |
| `taskRetention` | `50` | Tareas completadas conservadas por sala |
| `maxMessageChars` | `4000` | Límite duro del texto de un mensaje de sala (rechazo por encima, nunca truncado) |
| `injectRoomBrief` | `true` | Inyecta el resumen breve de la sala en las sesiones miembro (al unirse + al reanudar) |
| `roomOpenTimeoutMs` | `15000` | Cuánto puede tardar la apertura del dominio de almacenamiento `team_rooms` antes de que cada operación falle claramente (`store-unavailable`) en lugar de colgarse |
| `allowUnmarkedFacts` | `false` | Fuerza los eventos de hecho en hosts que descartan el marcador `ignorable` (peligroso: los hechos sin marcar hacen las sesiones irrecuperables en otros hosts); por defecto se detecta y se omite |
| `observability` | `true` | Conmutador de observabilidad de coste/estado por agente: captura un hecho `metrics` por turno hijo (tokens, tiempo de pared del turno, marca de error) y los agrega en los totales `metrics` de cada fila para el panel de coste; `false` desactiva la captura (el panel muestra las métricas como no disponibles) |
| `inbound.enabled` | `false` | Habilita el puente de entrada JSON-RPC 2.0 sobre stdio para runtimes externos (OpenAI Agents SDK / CrewAI); deshabilitado por defecto (fail-closed) |
| `inbound.command` | *(ninguno)* | Comando de lanzamiento del runtime externo; si está habilitado y presente, el plugin lo genera y escucha notificaciones JSON-RPC delimitadas por saltos de línea. Ausente/no generable = el puente permanece inactivo (registrado) |

## Herramientas y superficies

| Superficie | Tipo | Notas |
|---|---|---|
| `background_agent` | herramienta | Inicia un hijo duradero y continuable (label, `tool_filter`, `persona`, `max_depth`) |
| `bg_message` | herramienta | Entrega un turno posterior a un hijo por agent id |
| `bg_list` | herramienta | Estado de tus agentes (o el árbol de descendientes con `recursive: true`) |
| `bg_result` | herramienta | Recupera el último texto de salida del asistente del hijo |
| `bg_stop` | herramienta | Solicita la interrupción del turno actual |
| `/room` | comando | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` / `room_post` / `room_read` | herramientas | Bus de mensajes: lista, publicación (difusión/dirigida), lectura del historial |
| `room_list_tasks` / `room_create_task` / `room_claim_task` | herramientas | Tablero de tareas compartido |
| `room_transfer_task` / `room_complete_task` | herramientas | Traspaso (con aprobación) y finalización |
| Proyección `backgroundAgents` | proyección de sesión | Filas del panel plegadas desde el log del padre |
| Proyección `teamRoom` | proyección de sesión | Línea de tiempo compartida plegada desde eventos `team-room/fact` |
| Panel lateral web | cliente | Estado en vivo, salto, mensaje, parada, vista previa del resultado |

## Cómo funciona — y por qué sobrevive a los reinicios

Todo se apoya en la costura oficial de subagentes: `startContinuable`, `followup`, `interrupt`, `listChildren` — el plugin no realiza ningún enrutamiento de ciclo de vida propio, nunca toca el `Agent` de otra sesión y nunca mata un árbol de procesos (parar = *solicitar interrupción*; el desmontaje pertenece al administrador de continuación).

El plugin escribe cada hecho a través de **un canal estructurado y un canal visible para el modelo**:

- **eventos de hecho estructurados `background-agents/fact`** — los hechos registrado / mensaje / parada / progreso / archivado, añadidos al log del padre como registros solo-log con el marcador de sobre `ignorable: true`; los lectores que no conocen el tipo omiten los registros en lugar de rechazar el log. Los hosts cuyo `Session.append` es anterior al marcador (todas las líneas rc publicadas hasta `0.1.0-rc.8` y `0.1.1-rc.2` lo descartan silenciosamente — la corrección del marcador solo existe en master — dejando las sesiones sin marcar irrecuperables en compilaciones más estrictas) se detectan antes del primer append (precomprobación de la versión del peer y sondeo del sobre devuelto) y los appends de hechos se omiten con un aviso único — el almacén durable, los avisos y las herramientas siguen funcionando, y las proyecciones se degradan a un plegado vacío.
- **metadatos de repetición `tool/result`** — los mismos hechos en logs escritos antes del canal estructurado (plegados solo mientras una fila no tenga procedencia estructurada).
- **avisos `user/message` inyectados** (visibles para el modelo), fuente `{ kind: 'plugin', plugin: 'dsh-background-agents' }` — las líneas de progreso con límite de frecuencia y los avisos de archivado (prefijo canónico `[background-agent <id>] …`).
- el **aviso oficial `subagent-settled`** — el hecho duradero "settled" del hijo.
- Las salas de equipo reflejan la misma disciplina: cada mensaje de sala entregado es un `user/message` duradero en el log del propio miembro, y la línea de tiempo compartida se refleja como eventos `team-room/fact` solo-log en el dominio de almacenamiento `team_rooms`.

La proyección `backgroundAgents` pliega el canal estructurado y conserva los pliegues heredados; el valor del panel y los hechos de `bg_list` se reconstruyen en cada reapertura sin analizar el texto legible de los avisos. Cuando el propio catálogo no está disponible, `bg_list` devuelve un marcador explícito **`unrecoverable`** — nunca fabrica una lista vacía.

## Cómo se relaciona con las herramientas de subagente integradas

El núcleo del harness incluye sus propias herramientas de subagente (`subagent`, `send_message`, `interrupt_agent` y la herramienta `report` del lado del hijo). Las herramientas `bg_*` de este plugin son sus **compañeras con ámbito de sesión**; ambas pueden montarse juntas:

| Herramienta integrada | Este plugin | Diferencia |
|---|---|---|
| `subagent` (`backgroundMode: 'continuable'`) | `background_agent` | La misma costura `startContinuable`; este plugin añade validación de tool_filter/persona/max_depth por hijo y el límite por sesión |
| `send_message` | `bg_message` | La misma semántica de entrega; `bg_message` se dirige a los agentes de fondo de esta conversación y mantiene los hechos de la proyección |
| `interrupt_agent` | `bg_stop` | La misma semántica de interrupción; `bg_stop` también registra un hecho de parada estructurado |
| herramienta `report` del hijo | autoReport | La integrada la llama el propio modelo del hijo; este plugin inyecta progreso con límite de frecuencia **después de cada turno del hijo automáticamente** |

Lo que les falta a las herramientas del núcleo: `bg_list`, `bg_result`, archivado por inactividad y la proyección de panel plegada por padre.

Fuera de alcance: activación programada (la costura de programación existe), agentes remotos/entre máquinas y cualquier cambio al contrato oficial de activación de subagentes.

## No es este plugin

| Proyecto | Qué hace | La frontera |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Tareas de codificación programadas en sesiones de agente nuevas | Es dueño de **cuándo** se ejecutan las tareas (programación). Este plugin es dueño de la **dirección interactiva** de una conversación de larga duración — sin costura de programador, sin cron. |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | Barra de estado para *jobs* de fondo (progreso + cola de salida) | **Muestra** jobs a nivel de herramienta. Este plugin crea y dirige **sesiones de agente**; su panel es un panel de ello, no el producto. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Habilidad de panel multiagente | Orientado a la visualización. Las filas de este plugin son **accionables**: saltar a la sesión del hijo, enviar mensajes, parar — a través del plano de control oficial. |

## Permisos y datos

- **Permisos**: el manifiesto del workshop declara `session:append`, `subagent:spawn` y `tools:register`.
- **Datos**: las salas de equipo viven en el dominio de almacenamiento `team_rooms` (SQLite o JSONL — cero servicios extra); los hechos de agentes de fondo viajan en el log de sesión del padre. Sin base de datos separada, sin red.
- **Registro de sesión**: los eventos `background-agents/fact` y `team-room/fact` se añaden con el marcador de sobre `ignorable: true` en hosts que lo respetan (los hosts anteriores al marcador se detectan y los appends se omiten — véase `allowUnmarkedFacts`); las líneas de progreso y entregas de sala visibles para el modelo son registros `user/message` reales.

## Límites de seguridad

- **Solo costura oficial.** Inicio, mensaje y parada son adaptadores finos sobre `startContinuable` / `followup` / `interrupt`; parar solicita interrupción y nunca mata procesos.
- **`tool_filter` solo restringe.** Elimina herramientas de la vista del hijo — nunca concede nuevas; los nombres se validan contra `allowedChildTools`.
- **Traspasos con aprobación.** `room_transfer_task` pasa por la costura oficial de aprobación y cierra en fallo cuando ningún answerer lo concede.
- **Visible para el modelo ⟺ registrado.** Cada mensaje de sala entregado es un `user/message` duradero en el log del propio miembro; la línea de tiempo compartida se refleja como eventos `team-room/fact` solo-registro.
- **Sin programación, sin agentes entre máquinas.** Los hijos son sesiones continuables locales al proceso del despliegue.

## Entrada entre ecosistemas (P2)

Los runtimes de agentes externos — OpenAI Agents SDK, CrewAI y similares — pueden publicar en una sala de equipo mediante un **puente JSON-RPC 2.0 delimitado por saltos de línea sobre stdio** (conjunto mínimo de conexión directa; la compatibilidad completa con el protocolo ACP espera la costura upstream). Actívalo con `inbound.enabled` e `inbound.command`; el runtime emite una notificación JSON por línea donde `method` es el evento (`agent_started` abre una tarjeta en el tablero, `agent_message` publica en el bus, `agent_finished` completa la tarjeta). Los mensajes inválidos se descartan y se responde un error JSON-RPC; el arranque y la parada pasan por un disposer.

## Limitaciones conocidas

- Las salas de equipo requieren que se componga el dominio de almacenamiento; sin `@deepseek-ai/dsh-storage-domain`, el comando `/room` y las herramientas `room_*` se desactivan (las cinco herramientas `bg_*` siguen cargando).
- `provider` debe nombrar un proveedor con capacidad continuable (`prepareContinuable`); un proveedor ausente hace que `background_agent` falle hasta que aparezca.
- `maxBackgroundAgents` es un presupuesto compartido entre **todos** los hijos directos continuables de la sesión, incluidos los iniciados por la herramienta `subagent` integrada.
- Los hijos de un solo uso nunca se listan ni reciben mensajes — `bg_list` conserva solo filas continuables.
- Los hijos son locales al proceso: la costura de programación es dueña del "cuándo"; este plugin es dueño de dirigir una conversación en vivo.

## Desarrollo

```sh
pnpm install        # solo tooling; los paquetes del harness se resuelven contra un checkout hermano
pnpm run typecheck  # TS estricto, programas node + client
pnpm test           # vitest: tests unitarios + end-to-end (costura de subagente real, LLM guionado, panel jsdom)
pnpm run build      # lib/index.js (mitad node) + lib/client.js (bundle de cliente web)
pnpm run gen-aliases  # re-mapea las rutas de paquetes del harness tras mover el checkout
```

Una demo end-to-end sin clave impulsa una sesión padre real y un hijo de fondo a través de un LLM guionado determinista (sin API key; `dev/` está en gitignore — adapta las rutas a tu checkout):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "【父会话】驱动后台 agent 演示"
```

## Temas

`dsh`, `dsh-plugin`, `deepseek-harness`, `subagent`, `background-agent`, `background-agents`, `agent-dashboard`, `conversation-steering`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`

## Contribuidores

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor: el runtime de agentes de fondo sobre la costura oficial de subagentes, el hub de salas de equipo, el panel lateral de la interfaz web, las proyecciones de sesión, la documentación, CI/CD y releases.

## Familia de plugins DSH de PerryLink

Este proyecto es uno de los [33 complementos de DeepSeek Harness](https://github.com/PerryLink) mantenidos por [PerryLink](https://github.com/PerryLink). Si este te ayuda, probablemente los demás también:

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | Auto-revisión de segundo modelo en la cadena de aprobación, con cierre en fallo por defecto | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | Gobernanza de costes para DeepSeek Harness: presupuestos, carbono y latencia en un panel. | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Equivalente a /rewind de Claude Code: instantáneas, bifurcaciones de sesión, restauración de un solo uso | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | Migra sesiones, memoria, habilidades y CLAUDE.md de Claude Code a DSH | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | Control de escritorio nativo multiplataforma para DeepSeek Harness — Windows primero. | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | Historial de entrada estilo terminal para el compositor web: flechas, búsqueda Ctrl+R | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | Comprobaciones de calidad de datasets y verificación de citas (el puente numérico opcional consumido aquí) | |
| **[dsh-dsh-defend](https://github.com/PerryLink/dsh-dsh-defend)** | Defensa contra inyección de prompts, jailbreak y fuga de secretos para DeepSeek Harness. | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | Guardián de disciplina de ingeniería: interrogatorio de requisitos, puertas de pruebas, revisión adversaria | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | Enrutamiento unificado de generación de imágenes estáticas para DeepSeek Harness. | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | Diagnóstico de rendimiento de solo lectura para DeepSeek Harness. | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | Informes de investigación deterministas para fondos mutuos públicos chinos | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | Integración de PR/issues de GitHub para DSH, cada escritura controlada por aprobación | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | Orquestación de investigación sectorial que sella sus entregables mediante el `ctx.researchReport.assemble` de este plugin | |
| **[dsh-dsh-library](https://github.com/PerryLink/dsh-dsh-library)** | Base de conocimiento documental local para DeepSeek Harness. | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | Integración de modelos locales (Ollama) para DeepSeek Harness. | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | Diagnósticos, formato, autocompletado, acciones de código y renombrado LSP sobre servidores de lenguaje | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | Middleware de enmascaramiento de PII: anonimiza en el límite del modelo, restaura en la capa de visualización | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | Panel de tiempo de ejecución MCP de solo lectura: comando /mcp + pestaña Settings con estado, herramientas y errores | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | Memoria entre sesiones controlada por aprobación: costura ctx.memory + SQLite + herramienta de memoria | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | Exportador de observabilidad OpenTelemetry y Langfuse para DeepSeek Harness. | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Cambio de estilo en tiempo de ejecución equivalente a outputStyles de Claude Code | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | Reglas de permisos declarativas allow/deny/ask estilo Claude Code con auditoría | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | Base de conocimiento de desarrollo de plugins como habilidad de agente bajo demanda | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | Motor de informes de investigación verificables con evidencia direccionada por contenido | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | Puntuación de calidad multidimensional para plugins de DeepSeek Harness. | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | Fija sesiones en la barra lateral web con orden durable | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | Sincronización de sesiones entre dispositivos para DeepSeek Harness — un espejo git dedicado de tu almacén de sesiones. | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | Paquete de habilidades de auditoría de seguridad: escaneo de secretos, revisión de dependencias y cadena de suministro | |
| **[dsh-dsh-talk](https://github.com/PerryLink/dsh-dsh-talk)** | Bucle de sesión con voz para DeepSeek Harness: háblale y escucha su respuesta. | |
| **[dsh-dsh-test-drive](https://github.com/PerryLink/dsh-dsh-test-drive)** | Pruebas de instalación y humo aisladas para plugins de DeepSeek Harness. | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | Traducción de parámetros entre proveedores y reparación determinista de JSON para DeepSeek Harness. | |

### Instalar desde el mercado de DSH Desktop

Todos los plugins de PerryLink pueden explorarse en el mercado integrado de DSH Desktop: **Market → Sources → add source → pegar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ seleccionarlo**. La instalación sigue pasando por la verificación de identidad npm del mercado y tu confirmación.

## Licencia

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors
