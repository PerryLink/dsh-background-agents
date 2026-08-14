# dsh-background-agents

> Agentes en segundo plano interactivos y de sesión larga para [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Lanza un agente hijo duradero que sigue trabajando mientras tú sigues hablando: observa su progreso, dale instrucciones con mensajes y deténlo, todo sin salir de tu sesión.

[English](./README.md) · [中文](./README.zh.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [हिन्दी](./README.hi.md)

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-4d6bfe)](https://github.com/topics/dsh-plugin)
[![topic: dsh](https://img.shields.io/badge/topic-dsh-4d6bfe)](https://github.com/topics/dsh)

Los *jobs* en segundo plano de DSH son ejecuciones de herramientas de "lanzar y olvidar": puedes leer su salida y matarlos, pero no puedes hablar con ellos. `dsh-background-agents` los convierte en **sesiones completas de agente en segundo plano** sobre el seam oficial de subagentes: una conversación hija continuable a la que puedes enviar mensajes, corregir e interrumpir en cualquier momento, mientras una línea de progreso inyectada tras cada turno te mantiene (y mantiene al modelo) al tanto.

## Qué obtienes

- **`background_agent`** — inicia un agente hijo duradero y continuable desde cualquier sesión. Trabaja en su propio contexto, devuelve un id estable de inmediato y mantiene su conversación abierta para siempre. Alcance opcional por hijo: `tool_filter` (quita herramientas de la vista del hijo — nunca concede nuevas), `persona` (una persona dedicada de system-prompt) y `max_depth` (tope de profundidad de delegación); `childProvider`/`childModel` enrutan sus peticiones de modelo.
- **`bg_message`** — envíale más trabajo, correcciones, o despierta un agente asentado. Se entrega por el inbox FIFO oficial; la respuesta del agente es su siguiente turno.
- **`bg_list`** — estado de tus agentes: etiqueta, modo, actividad (`running` / `idle` / `ready` / `settled` / `archived`), número de mensajes, última actividad. Recupera hijos persistidos tras un reinicio. `recursive: true` lista todo el árbol descendiente con `parentId`/`depth`.
- **`bg_result`** — lee el último texto de salida del asistente de un hijo más su actividad, más allá del resumen del aviso de asentamiento.
- **`bg_stop`** — solicita la interrupción del turno actual. Lanza y retorna: el desmontaje oficial termina el trabajo; el agente sigue siendo reanudable.
- **autoReport** — tras cada turno del hijo, se inyecta una línea de progreso limitada en tu sesión (visible para el modelo, con fuente del plugin). Su resultado final llega mediante el aviso oficial de asentamiento. `reportDelivery: wakeup` hace que cada línea abra un turno del padre cuando este está ocioso.
- **Archivado por inactividad** — los agentes callados más allá de `idleTimeoutMinutes` se archivan con un aviso y una solicitud de parada; `bg_message` los despierta de nuevo.
- **Proyección `backgroundAgents`** — una unidad de proyección de sesión que pliega el log del padre en filas de panel (id, etiqueta, actividad, resumen del último mensaje, hora de creación). Todo se reconstruye desde el log durable, sin base de datos aparte.
- **Panel Web UI** — una entrada "Background agents" en la barra lateral de la Web GUI con estado en vivo, salto de un clic a la sesión hija, un botón de parada y un botón de mensaje que encola un nuevo turno por el RPC oficial `subagent.prompt`.

## Inicio rápido

```sh
# desde el checkout del harness o donde esté el CLI dsh (web o headless)
dsh plugin --profile <name> add "github:PerryLink/dsh-background-agents#v0.2.0"
```

El patch del bundle lleva la fila del plugin, así que `dsh plugin add` la compone en la pila de capas de tu perfil (`dsh.profile.bundles`). Prefiere la fuente git con una ref fijada: el repo versiona su salida de build (`lib/`), así que la instalación git no necesita paso de build ni entrada `allowBuilds`. (Cuando el paquete se publique en npm, `pnpm add dsh-background-agents` también funcionará.)

La fila que aterriza en tu perfil (sobrescribe `config` por perfil en `cordis.patch.yml`):

```yaml
- insert:
    - id: background-agents
      name: dsh-background-agents
      config:
        provider: spawn        # proveedor ctx.subagents para hijos continuables
```

El plugin necesita el esqueleto de subagentes ya montado (cualquier perfil sobre `@deepseek-ai/dsh-base` lo tiene: `dsh-subagent`, `dsh-subagent-spawn-in-process`, `dsh-session-projection`).

Luego, en cualquier sesión, pídeselo al modelo o llama a las herramientas directamente:

```
background_agent "vigila el reposo en busca de fallos de test y mantenme informado" (label: test-watch)
bg_list
bg_message <agentId> "revisa ahora también los tests de snapshot"
bg_stop <agentId>
```

## Configuración

Todo parámetro es un campo `Config` validado: cámbialo en `cordis.yml`, nunca en el código.

| Campo | Por defecto | Significado |
|---|---|---|
| `provider` | *(obligatorio)* | nombre del proveedor `ctx.subagents` para inicios continuables (`spawn`) |
| `autoReport` | `true` | inyecta una línea de progreso en el padre tras cada turno del hijo |
| `reportDelivery` | `quiet` | `quiet` añade la línea a la siguiente petición de modelo del padre; `wakeup` abre un turno del padre cuando está ocioso (encola si está ocupado) |
| `reportThrottleMs` | `15000` | intervalo mínimo entre dos inyecciones de progreso de un hijo |
| `reportSummaryMaxChars` | `300` | tope duro del texto de la línea de progreso (con puntos suspensivos) |
| `maxBackgroundAgents` | `4` | tope duro de agentes no archivados por sesión padre |
| `idleTimeoutMinutes` | `120` | ventana de inactividad tras la que un hijo callado se archiva y notifica (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | periodo del barrido de archivado |
| `maxLabelChars` | `120` | tope de la etiqueta visible (con puntos suspensivos) |
| `childProvider` | *(heredar)* | ruta de proveedor para las peticiones de modelo del hijo |
| `childModel` | *(heredar)* | id de modelo para las peticiones de modelo del hijo |
| `maxChildDepth` | *(ninguno)* | techo de configuración para el argumento `max_depth` de un inicio |
| `allowedChildTools` | *(ninguno)* | lista blanca de nombres para `tool_filter`; vacía/ausente = sin límite |

## Cómo funciona — y por qué sobrevive a los reinicios

Todo pasa por el seam oficial de subagentes: `startContinuable`, `followup`, `interrupt`, `listChildren` — el plugin no enruta ciclos de vida propios, nunca toca el `Agent` de otra sesión y nunca mata árboles de procesos (parar = *solicitar interrupción*; el desmontaje pertenece al gestor de continuación).

El plugin también escribe **solo por canales que el harness ya persiste**. El harness actual no tiene superficie de registro para eventos de sesión de plugins, así que en lugar de inventar eventos de log, sella:

- **metadatos de reproducción** de `tool/result` — los hechos de registro / mensaje / parada de cada llamada;
- **avisos `user/message` inyectados** con fuente `{ kind: 'plugin', plugin: 'dsh-background-agents' }` — las líneas de progreso y los avisos de archivado (prefijo canónico `[background-agent <id>] …`);
- el **aviso oficial `subagent-settled`** — el hecho durable de "asentado" del hijo.

La unidad de proyección `backgroundAgents` pliega exactamente esos tres canales de eventos conocidos desde el log del padre, de modo que el panel y los hechos de `bg_list` se reconstruyen en cada reapertura. Si el catálogo en sí no está disponible (faltan proyecciones o el almacén de sesiones), `bg_list` devuelve un marcador explícito **`unrecoverable`**: nunca fabrica una lista vacía.

## Esto no es este plugin

| Proyecto | Qué hace | La frontera |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Tareas de codificación programadas en sesiones nuevas | Decide **cuándo** corren las tareas (planificación). Este plugin se ocupa del **gobierno interactivo** de una conversación larga: sin seam de planificación, sin cron. |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | Barra de estado para *jobs* en segundo plano (progreso + salida) | **Muestra** trabajos a nivel de herramienta. Este plugin crea y gobierna **sesiones de agente**; su panel es una parte, no el producto. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Skill de panel multi-agente | Orientado a mostrar. Las filas de este plugin son **accionables**: saltar a la sesión hija, enviar mensajes, parar — por el plano de control oficial. |

Fuera de alcance: activación programada (el seam de schedule existe), agentes remotos/entre máquinas, y cualquier cambio al contrato oficial de activación de subagentes.

## Desarrollo

```sh
pnpm install        # solo herramientas; los paquetes del harness se resuelven contra un checkout hermano
pnpm run typecheck  # TS estricto, programas node + client
pnpm test           # 60 tests unitarios y de extremo a extremo (seam real de subagentes, LLM guionizado, panel jsdom)
pnpm run build      # lib/index.js (mitad node) + lib/client.js (bundle web)
pnpm run gen-aliases  # re-mapea rutas de paquetes del harness cuando el checkout se mueve
```

Una demo extremo a extremo sin clave mueve una sesión padre real y un hijo de fondo a través de un LLM guionizado determinista (sin API key; `dev/` está gitignorado — ajusta las rutas a tu checkout):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "【父会话】驱动后台 agent 演示"
```

## Licencia

Apache License 2.0 — véase [LICENSE](./LICENSE). Avisos de terceros: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
