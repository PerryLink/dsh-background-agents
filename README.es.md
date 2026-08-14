# dsh-background-agents

> Agentes en segundo plano interactivos y de sesi贸n larga para [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Lanza un agente hijo duradero que sigue trabajando mientras t煤 sigues hablando: observa su progreso, dale instrucciones con mensajes y det茅nlo, todo sin salir de tu sesi贸n.

[English](./README.md) 路 [涓枃](./README.zh.md) 路 [Espa帽ol](./README.es.md) 路 [Portugu锚s](./README.pt.md) 路 [啶灌た啶ㄠ啶︵](./README.hi.md)

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-4d6bfe)](https://github.com/topics/dsh-plugin)
[![topic: dsh](https://img.shields.io/badge/topic-dsh-4d6bfe)](https://github.com/topics/dsh)

Los *jobs* en segundo plano de DSH son ejecuciones de herramientas de "lanzar y olvidar": puedes leer su salida y matarlos, pero no puedes hablar con ellos. `dsh-background-agents` los convierte en **sesiones completas de agente en segundo plano** sobre el seam oficial de subagentes: una conversaci贸n hija continuable a la que puedes enviar mensajes, corregir e interrumpir en cualquier momento, mientras una l铆nea de progreso inyectada tras cada turno te mantiene (y mantiene al modelo) al tanto.

## Qu茅 obtienes

- **`background_agent`** 鈥?inicia un agente hijo duradero y continuable desde cualquier sesi贸n. Trabaja en su propio contexto, devuelve un id estable de inmediato y mantiene su conversaci贸n abierta para siempre. Alcance opcional por hijo: `tool_filter` (quita herramientas de la vista del hijo 鈥?nunca concede nuevas), `persona` (una persona dedicada de system-prompt) y `max_depth` (tope de profundidad de delegaci贸n); `childProvider`/`childModel` enrutan sus peticiones de modelo.
- **`bg_message`** 鈥?env铆ale m谩s trabajo, correcciones, o despierta un agente asentado. Se entrega por el inbox FIFO oficial; la respuesta del agente es su siguiente turno.
- **`bg_list`** 鈥?estado de tus agentes: etiqueta, modo, actividad (`running` / `idle` / `ready` / `settled` / `archived`), n煤mero de mensajes, 煤ltima actividad. Recupera hijos persistidos tras un reinicio. `recursive: true` lista todo el 谩rbol descendiente con `parentId`/`depth`.
- **`bg_result`** 鈥?lee el 煤ltimo texto de salida del asistente de un hijo m谩s su actividad, m谩s all谩 del resumen del aviso de asentamiento.
- **`bg_stop`** 鈥?solicita la interrupci贸n del turno actual. Lanza y retorna: el desmontaje oficial termina el trabajo; el agente sigue siendo reanudable.
- **autoReport** 鈥?tras cada turno del hijo, se inyecta una l铆nea de progreso limitada en tu sesi贸n (visible para el modelo, con fuente del plugin). Su resultado final llega mediante el aviso oficial de asentamiento. `reportDelivery: wakeup` hace que cada l铆nea abra un turno del padre cuando este est谩 ocioso.
- **Archivado por inactividad** 鈥?los agentes callados m谩s all谩 de `idleTimeoutMinutes` se archivan con un aviso y una solicitud de parada; `bg_message` los despierta de nuevo.
- **Proyecci贸n `backgroundAgents`** 鈥?una unidad de proyecci贸n de sesi贸n que pliega el log del padre en filas de panel (id, etiqueta, actividad, resumen del 煤ltimo mensaje, hora de creaci贸n). Todo se reconstruye desde el log durable, sin base de datos aparte.
- **Panel Web UI** 鈥?una entrada "Background agents" en la barra lateral de la Web GUI con estado en vivo, salto de un clic a la sesi贸n hija, un bot贸n de parada y un bot贸n de mensaje que encola un nuevo turno por el RPC oficial `subagent.prompt`.

## Inicio r谩pido

```sh
# desde el checkout del harness o donde est茅 el CLI dsh (web o headless)
dsh plugin --profile <name> add "github:PerryLink/dsh-background-agents#v0.3.0"
```

El patch del bundle lleva la fila del plugin, as铆 que `dsh plugin add` la compone en la pila de capas de tu perfil (`dsh.profile.bundles`). Prefiere la fuente git con una ref fijada: el repo versiona su salida de build (`lib/`), as铆 que la instalaci贸n git no necesita paso de build ni entrada `allowBuilds`. (CI publica los tags en npm cuando el repositorio configura un secreto `NPM_TOKEN`; a partir de entonces, `pnpm add dsh-background-agents` tambi茅n funciona.)

La fila que aterriza en tu perfil (sobrescribe `config` por perfil en `cordis.patch.yml`):

```yaml
- insert:
    - id: background-agents
      name: dsh-background-agents
      config:
        provider: spawn        # proveedor ctx.subagents para hijos continuables
```

El plugin necesita el esqueleto de subagentes ya montado (cualquier perfil sobre `@deepseek-ai/dsh-base` lo tiene: `dsh-subagent`, `dsh-subagent-spawn-in-process`, `dsh-session-projection`).

Luego, en cualquier sesi贸n, p铆deselo al modelo o llama a las herramientas directamente:

```
background_agent "vigila el reposo en busca de fallos de test y mantenme informado" (label: test-watch)
bg_list
bg_message <agentId> "revisa ahora tambi茅n los tests de snapshot"
bg_stop <agentId>
```

## Configuraci贸n

Todo par谩metro es un campo `Config` validado: c谩mbialo en `cordis.yml`, nunca en el c贸digo.

| Campo | Por defecto | Significado |
|---|---|---|
| `provider` | *(obligatorio)* | nombre del proveedor `ctx.subagents` para inicios continuables (`spawn`) |
| `autoReport` | `true` | inyecta una l铆nea de progreso en el padre tras cada turno del hijo |
| `reportDelivery` | `quiet` | `quiet` a帽ade la l铆nea a la siguiente petici贸n de modelo del padre; `wakeup` abre un turno del padre cuando est谩 ocioso (encola si est谩 ocupado) |
| `reportThrottleMs` | `15000` | intervalo m铆nimo entre dos inyecciones de progreso de un hijo |
| `reportSummaryMaxChars` | `300` | tope duro del texto de la l铆nea de progreso (con puntos suspensivos) |
| `resultMaxChars` | `4000` | tope duro del texto de `bg_result` (con puntos suspensivos y bandera `truncated`) |
| `maxBackgroundAgents` | `4` | tope duro de agentes no archivados por sesi贸n padre; el presupuesto lo comparten **todos** los hijos directos continuables de la sesi贸n (incluidos los iniciados por la herramienta `subagent` integrada) |
| `idleTimeoutMinutes` | `120` | ventana de inactividad tras la que un hijo callado se archiva y notifica (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | periodo del barrido de archivado |
| `maxLabelChars` | `120` | tope de la etiqueta visible (con puntos suspensivos) |
| `childProvider` | *(heredar)* | ruta de proveedor para las peticiones de modelo del hijo |
| `childModel` | *(heredar)* | id de modelo para las peticiones de modelo del hijo |
| `maxChildDepth` | *(ninguno)* | techo de configuraci贸n para el argumento `max_depth` de un inicio |
| `allowedChildTools` | *(ninguno)* | lista blanca de nombres para `tool_filter`; vac铆a/ausente = sin l铆mite |

## C贸mo funciona 鈥?y por qu茅 sobrevive a los reinicios

Todo pasa por el seam oficial de subagentes: `startContinuable`, `followup`, `interrupt`, `listChildren` 鈥?el plugin no enruta ciclos de vida propios, nunca toca el `Agent` de otra sesi贸n y nunca mata 谩rboles de procesos (parar = *solicitar interrupci贸n*; el desmontaje pertenece al gestor de continuaci贸n).

El plugin escribe cada hecho por **un canal estructurado y un canal visible para el modelo**:

- **eventos de hecho estructurados `background-agents/fact`** (v0.3.0+) 鈥?los hechos registrado / mensaje / parada / progreso / archivado, a帽adidos al log del padre como registros solo-de-log con el marcador `ignorable: true`; los lectores que no conocen el tipo se saltan los registros en vez de rechazar el log, de modo que builds del harness y versiones del plugin m谩s antiguas siguen abriendo los padres escritos por este;
- **metadatos de reproducci贸n** de `tool/result` 鈥?los mismos hechos en logs anteriores a v0.3.0 (plegados solo mientras una fila no tiene procedencia estructurada);
- **avisos `user/message` inyectados** (visibles para el modelo) con fuente `{ kind: 'plugin', plugin: 'dsh-background-agents' }` 鈥?las l铆neas de progreso y los avisos de archivado (prefijo can贸nico `[background-agent <id>] 鈥);
- el **aviso oficial `subagent-settled`** 鈥?el hecho durable de "asentado" del hijo.

La unidad de proyecci贸n `backgroundAgents` pliega el canal estructurado y conserva los pliegues legacy para logs anteriores a v0.3.0 (una fila cambia a procedencia estructurada en su primer hecho, de modo que un log de doble canal nunca cuenta dos veces). El panel y los hechos de `bg_list` se reconstruyen en cada reapertura sin parsear el texto legible de los avisos. Si el cat谩logo en s铆 no est谩 disponible (faltan proyecciones o el almac茅n de sesiones), `bg_list` devuelve un marcador expl铆cito **`unrecoverable`**: nunca fabrica una lista vac铆a.

## Esto no es este plugin

| Proyecto | Qu茅 hace | La frontera |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Tareas de codificaci贸n programadas en sesiones nuevas | Decide **cu谩ndo** corren las tareas (planificaci贸n). Este plugin se ocupa del **gobierno interactivo** de una conversaci贸n larga: sin seam de planificaci贸n, sin cron. |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | Barra de estado para *jobs* en segundo plano (progreso + salida) | **Muestra** trabajos a nivel de herramienta. Este plugin crea y gobierna **sesiones de agente**; su panel es una parte, no el producto. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Skill de panel multi-agente | Orientado a mostrar. Las filas de este plugin son **accionables**: saltar a la sesi贸n hija, enviar mensajes, parar 鈥?por el plano de control oficial. |

## Relaci贸n con las herramientas de subagente integradas

El n煤cleo del harness trae sus propias herramientas de subagente (`subagent`, `send_message`, `interrupt_agent` y la herramienta `report` del hijo). Las herramientas `bg_*` de este plugin son su **compa帽铆a con alcance de sesi贸n**; ambas pueden montarse a la vez:

| Herramienta integrada | Este plugin | Diferencia |
|---|---|---|
| `subagent` (`backgroundMode: 'continuable'`) | `background_agent` | Mismo seam `startContinuable`; este plugin a帽ade validaci贸n por hijo de tool_filter/persona/max_depth y el tope por sesi贸n |
| `send_message` | `bg_message` | Misma sem谩ntica de entrega; `bg_message` se dirige a los agentes de fondo de esta conversaci贸n y mantiene los hechos de proyecci贸n |
| `interrupt_agent` | `bg_stop` | Misma sem谩ntica de interrupci贸n; `bg_stop` registra adem谩s un hecho estructurado de parada |
| herramienta `report` del hijo | autoReport | La integrada la llama el propio modelo hijo; este plugin inyecta progreso limitado tras **cada turno del hijo autom谩ticamente** |

Lo que las herramientas del n煤cleo no tienen: `bg_list`, `bg_result`, archivado por inactividad y la proyecci贸n de panel plegada por padre.

Fuera de alcance: activaci贸n programada (el seam de schedule existe), agentes remotos/entre m谩quinas, y cualquier cambio al contrato oficial de activaci贸n de subagentes.

## Desarrollo

```sh
pnpm install        # solo herramientas; los paquetes del harness se resuelven contra un checkout hermano
pnpm run typecheck  # TS estricto, programas node + client
pnpm test           # 69 tests unitarios y de extremo a extremo (seam real de subagentes, LLM guionizado, panel jsdom)
pnpm run build      # lib/index.js (mitad node) + lib/client.js (bundle web)
pnpm run gen-aliases  # re-mapea rutas de paquetes del harness cuando el checkout se mueve
```

Una demo extremo a extremo sin clave mueve una sesi贸n padre real y un hijo de fondo a trav茅s de un LLM guionizado determinista (sin API key; `dev/` est谩 gitignorado 鈥?ajusta las rutas a tu checkout):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "銆愮埗浼氳瘽銆戦┍鍔ㄥ悗鍙?agent 婕旂ず"
```

## Licencia

Apache License 2.0 鈥?v茅ase [LICENSE](./LICENSE). Avisos de terceros: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
