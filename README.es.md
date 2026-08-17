<div align="center">

# 👥 dsh-background-agents

**Agentes de fondo interactivos de sesión larga más salas de equipo multiagente persistentes para DeepSeek Harness — lanza un agente hijo duradero que sigue trabajando mientras tú sigues hablando.**

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

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` (peers `>=0.1.0-rc.5 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Todas (herramientas de host; panel lateral web y salas de equipo opcionales vía la capacidad de dominio de almacenamiento) |
| Modelo | Cualquiera (los hijos heredan la ruta del padre; `childProvider`/`childModel` la reemplazan) |

## Qué obtienes

`dsh-background-agents` convierte los *jobs* de fondo de DSH (dispara y olvida) en dos superficies coordinadas:

1. **Cinco herramientas de dirección** — `background_agent` inicia un hijo duradero y continuable en la costura oficial de subagentes (`tool_filter`, `persona`, `max_depth` y ruta de modelo opcionales); `bg_message` entrega un turno posterior; `bg_list` informa el estado (o el árbol de descendientes); `bg_result` lee el último texto de resultado; `bg_stop` solicita la interrupción.
2. **Progreso y archivado** — `autoReport` inyecta una línea de progreso con límite de frecuencia tras cada turno del hijo; el barrido de inactividad archiva los hijos callados y `bg_message` los vuelve a despertar.
3. **Proyección de panel + panel web** — la proyección de sesión `backgroundAgents` pliega el log del padre en filas; un panel lateral muestra estado en vivo, salto, mensaje, parada y vista previa del resultado.
4. **Salas de equipo (v0.5.0+)** — la familia de comandos `/room` más ocho herramientas `room_*` construyen salas multiagente persistentes: miembros (cada uno una sesión independiente), un bus de mensajes (dirigido/difusión), un tablero de tareas compartido y una línea de tiempo compartida — almacenados en el dominio `team_rooms` (SQLite o JSONL) y recuperados tras reinicios de DSH. Los traspasos de tareas entre miembros pasan por la costura oficial de aprobación.

## Inicio rápido

```sh
# 1. instala el bundle en tu perfil
dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"

# o desde npm (versiones publicadas)
dsh plugin --profile web add dsh-background-agents

# 2. reinicia y verifica la fila
dsh --profile web --dump-config | grep -A4 'id: background-agents'
```

El parche del bundle lleva la fila del plugin; `provider` es obligatorio. El repo publica su salida de build (`lib/`), así que la instalación por git no necesita paso de build. Las salas de equipo se montan donde se componga el dominio de almacenamiento (`@deepseek-ai/dsh-storage-domain`); las cinco herramientas `bg_*` funcionan sin él.

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

## Herramientas y superficies

| Superficie | Tipo | Notas |
|---|---|---|
| `background_agent` | herramienta | Inicia un hijo duradero y continuable (label, `tool_filter`, `persona`, `max_depth`) |
| `bg_message` | herramienta | Entrega un turno posterior a un hijo por agent id |
| `bg_list` | herramienta | Estado de tus agentes (o el árbol con `recursive: true`) |
| `bg_result` | herramienta | Recupera el último texto de salida del asistente del hijo |
| `bg_stop` | herramienta | Solicita la interrupción del turno actual |
| `/room` | comando | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` / `room_post` / `room_read` | herramientas | Bus de mensajes: lista, publicación (difusión/dirigida), lectura de historial |
| `room_list_tasks` / `room_create_task` / `room_claim_task` | herramientas | Tablero de tareas compartido |
| `room_transfer_task` / `room_complete_task` | herramientas | Traspaso (con aprobación) y finalización |
| Proyección `backgroundAgents` | proyección de sesión | Filas del panel plegadas desde el log del padre |
| Proyección `teamRoom` | proyección de sesión | Línea de tiempo compartida plegada desde eventos `team-room/fact` |
| Panel lateral web | cliente | Estado en vivo, salto, mensaje, parada, vista previa del resultado |

## Permisos y datos

- **Permisos**: el manifiesto del workshop declara `session:append`, `subagent:spawn` y `tools:register`.
- **Datos**: las salas de equipo viven en el dominio de almacenamiento `team_rooms` (SQLite o JSONL — sin servicios extra); los hechos de agentes de fondo viajan en el log de sesión del padre. Sin base de datos separada, sin red.
- **Registro de sesión**: los eventos `background-agents/fact` y `team-room/fact` se añaden con el marcador de sobre `ignorable: true`; las líneas de progreso y entregas de sala visibles para el modelo son registros `user/message` reales.

## Límites de seguridad

- **Solo costura oficial.** Inicio, mensaje y parada son adaptadores finos sobre `startContinuable` / `followup` / `interrupt`; parar solicita interrupción y nunca mata procesos.
- **`tool_filter` solo restringe.** Elimina herramientas de la vista del hijo — nunca concede nuevas; los nombres se validan contra `allowedChildTools`.
- **Traspasos con aprobación.** `room_transfer_task` pasa por la costura oficial de aprobación y cierra en fallo si ningún answerer lo concede.
- **Visible para el modelo ⟺ registrado.** Cada mensaje de sala entregado es un `user/message` duradero en el log del propio miembro; la línea de tiempo compartida se refleja como eventos `team-room/fact` solo-registro.
- **Sin programación, sin agentes entre máquinas.** Los hijos son sesiones continuables locales al proceso del despliegue.

## Limitaciones conocidas

- Las salas de equipo requieren que se componga el dominio de almacenamiento; sin `@deepseek-ai/dsh-storage-domain`, el comando `/room` y las herramientas `room_*` se desactivan (las cinco `bg_*` siguen cargando).
- `provider` debe nombrar un proveedor con capacidad continuable (`prepareContinuable`); un proveedor ausente hace que `background_agent` falle hasta que aparezca.
- `maxBackgroundAgents` es un presupuesto compartido entre **todos** los hijos directos continuables de la sesión, incluidos los que inició la herramienta `subagent` integrada.
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

## Temas

`dsh`, `dsh-plugin`, `deepseek-harness`, `subagent`, `background-agent`, `background-agents`, `agent-dashboard`, `conversation-steering`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`

## Contribuidores

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor: el runtime de agentes de fondo sobre la costura oficial de subagentes, el hub de salas de equipo, el panel lateral web, las proyecciones de sesión, la documentación, CI/CD y releases.

## Licencia

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors
