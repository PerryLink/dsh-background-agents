<div align="center">

# 👥 dsh-background-agents

**Agentes de segundo plano interativos de sessão longa mais salas de equipe multiagente persistentes para o DeepSeek Harness — inicie um agente filho durável que continua trabalhando enquanto você continua conversando.**

*Conduza conversas em andamento e coordene uma equipe entre sessões; tudo sobrevive a reinícios por meio do próprio armazenamento do harness.*

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

## Compatibilidade

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.1-rc.2` (peers `>=0.1.0-rc.8 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Todas (ferramentas de host; painel lateral web e salas de equipe opcionais via capacidade de domínio de armazenamento) |
| Modelo | Qualquer (os filhos herdam a rota do pai; `childProvider`/`childModel` sobrescrevem) |

## O que você recebe

O `dsh-background-agents` transforma os *jobs* de segundo plano do DSH (dispare-e-esqueça) em duas superfícies coordenadas:

1. **Cinco ferramentas de direção** — `background_agent` inicia um filho durável e continuável na costura oficial de subagentes (`tool_filter` opcional — remove ferramentas, nunca concede novas; `persona`; `max_depth`; rota `childProvider`/`childModel`). `bg_message` entrega um turno posterior; `bg_list` informa o status (ou a árvore de descendentes com `parentId`/`depth`); `bg_result` lê o último texto de resultado (o fallback de raciocínio é marcado `textSource: 'reasoning'`); `bg_stop` solicita a interrupção.
2. **Progresso e arquivamento** — `autoReport` injeta uma linha de progresso com limite de frequência após cada turno do filho; `reportDelivery: wakeup` inicia um turno do pai quando ocioso. A varredura de inatividade arquiva filhos silenciosos e `bg_message` os acorda de novo (`autoArchive: false` estaciona os observadores silenciosos em vez disso).
3. **Projeção de painel + painel web** — a projeção de sessão `backgroundAgents` dobra o log do pai em linhas; um painel lateral mostra status em tempo real, salto, mensagem, parada e prévia do resultado. Tudo se reconstrói a partir do log durável — sem banco de dados separado.
4. **Salas de equipe (v0.5.0+)** — a família de comandos `/room` mais oito ferramentas `room_*` constroem salas multiagente persistentes: membros (cada um uma sessão independente), um barramento de mensagens (dirigido/difusão), um quadro de tarefas compartilhado e uma linha do tempo compartilhada — armazenados no domínio de armazenamento `team_rooms` (SQLite ou JSONL) e recuperados após reinícios do DSH. Transferências de tarefa entre membros passam pela costura oficial de aprovação.

## Início rápido

```sh
# 1. instale o bundle no seu perfil
dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"

# ou pelo npm (versões publicadas)
dsh plugin --profile web add dsh-background-agents

# 2. reinicie e verifique a linha
dsh --profile web --dump-config | grep -A4 'id: background-agents'
```

O patch do bundle carrega a linha do plugin; `provider` é obrigatório. O repo commita a saída do build (`lib/`), então a instalação por git não precisa de etapa de build. O plugin precisa da espinha dorsal de subagentes já montada (qualquer perfil construído sobre `@deepseek-ai/dsh-base` a tem). As salas de equipe montam onde o domínio de armazenamento estiver composto (`@deepseek-ai/dsh-storage-domain`); as cinco ferramentas `bg_*` funcionam sem ele.

Depois, em qualquer sessão, basta pedir ao modelo — ou chamar as ferramentas diretamente:

```
background_agent "watch the repo for test failures and keep me posted" (label: test-watch)
bg_list
bg_message <agentId> "also check the snapshot tests now"
bg_stop <agentId>
```

## Instalar e desinstalar

- **Canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"` — `lib/` commitado, sem etapa de `prepare` nem `allowBuilds`.
- **Canal npm** (versões publicadas): `dsh plugin --profile web add dsh-background-agents`.
- **Canal tarball**: `pnpm pack` neste repo e depois `dsh plugin --profile web add ./dsh-background-agents-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-background-agents` (ou remova a linha do patch de perfil).

## Configuração

Cada ajuste é um campo Schemastery `Config` validado — altere no cordis.yml, nunca no código. Apenas `provider` é obrigatório.

| Chave | Padrão | Significado |
|---|---|---|
| `provider` | *(obrigatório)* | Nome do provedor `ctx.subagents` para inícios continuáveis (`spawn`) |
| `autoReport` | `true` | Injeta uma linha de progresso no pai após cada turno do filho |
| `reportDelivery` | `quiet` | `quiet` anexa a linha à próxima requisição do modelo; `wakeup` inicia um turno do pai quando ocioso |
| `reportThrottleMs` | `15000` | Intervalo mínimo entre duas injeções de progresso de um filho |
| `reportSummaryMaxChars` | `300` | Limite rígido do texto da linha de progresso (com reticências) |
| `resultMaxChars` | `4000` | Limite rígido do texto de `bg_result` (com reticências, marcado `truncated`) |
| `maxBackgroundAgents` | `4` | Limite rígido de agentes de segundo plano não arquivados por sessão pai |
| `autoArchive` | `true` | Alternância de arquivamento por inatividade; em `false`, a varredura nunca arquiva filhos silenciosos |
| `idleTimeoutMinutes` | `120` | Janela de inatividade após a qual um filho silencioso é arquivado (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | Período da varredura de arquivamento |
| `maxLabelChars` | `120` | Limite do rótulo de exibição (com reticências) |
| `childProvider` | *(herdado)* | Rota de provedor para requisições do modelo do filho |
| `childModel` | *(herdado)* | Id do modelo para requisições do filho |
| `maxChildDepth` | *(nenhum)* | Teto de configuração para o argumento `max_depth` de um início |
| `allowedChildTools` | *(nenhuma)* | Lista de permissões de nomes de `tool_filter`; vazia/ausente = sem limite |
| `maxRooms` | `16` | Limite rígido de salas de equipe no perfil |
| `maxMembersPerRoom` | `8` | Limite rígido de membros por sala |
| `maxRoomsPerMember` | `4` | Limite rígido de salas às quais uma sessão membro pode se juntar |
| `busRetention` | `200` | Mensagens de barramento mantidas por sala |
| `timelineRetention` | `500` | Eventos de linha do tempo mantidos por sala |
| `taskRetention` | `50` | Tarefas concluídas mantidas por sala |
| `maxMessageChars` | `4000` | Limite rígido do texto de uma mensagem de sala (rejeição acima, nunca truncado) |
| `injectRoomBrief` | `true` | Injeta o resumo breve da sala nas sessões membro (ao entrar + ao retomar) |
| `roomOpenTimeoutMs` | `15000` | Quanto tempo a abertura do domínio de armazenamento `team_rooms` pode demorar antes de cada operação falhar claramente (`store-unavailable`) em vez de travar |
| `allowUnmarkedFacts` | `false` | Força eventos de fato em hosts que descartam o marcador `ignorable` (perigoso: fatos sem marcador tornam sessões irrecuperáveis em outros hosts); o padrão é detectar e pular |

## Ferramentas e superfícies

| Superfície | Tipo | Notas |
|---|---|---|
| `background_agent` | ferramenta | Inicia um filho durável e continuável (label, `tool_filter`, `persona`, `max_depth`) |
| `bg_message` | ferramenta | Entrega um turno posterior a um filho por agent id |
| `bg_list` | ferramenta | Status dos seus agentes (ou a árvore de descendentes com `recursive: true`) |
| `bg_result` | ferramenta | Recupera o último texto de saída do assistente do filho |
| `bg_stop` | ferramenta | Solicita a interrupção do turno atual |
| `/room` | comando | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` / `room_post` / `room_read` | ferramentas | Barramento de mensagens: lista, publicação (difusão/dirigida), leitura do histórico |
| `room_list_tasks` / `room_create_task` / `room_claim_task` | ferramentas | Quadro de tarefas compartilhado |
| `room_transfer_task` / `room_complete_task` | ferramentas | Transferência (com aprovação) e conclusão |
| Projeção `backgroundAgents` | projeção de sessão | Linhas do painel dobradas a partir do log do pai |
| Projeção `teamRoom` | projeção de sessão | Linha do tempo compartilhada dobrada a partir de eventos `team-room/fact` |
| Painel lateral web | cliente | Status em tempo real, salto, mensagem, parada, prévia do resultado |

## Como funciona — e por que sobrevive a reinícios

Tudo se apoia na costura oficial de subagentes: `startContinuable`, `followup`, `interrupt`, `listChildren` — o plugin não faz nenhum roteamento de ciclo de vida próprio, nunca toca o `Agent` de outra sessão e nunca mata uma árvore de processos (parar = *solicitar interrupção*; o desmonte pertence ao gerenciador de continuação).

O plugin grava cada fato por meio de **um canal estruturado e um canal visível ao modelo**:

- **eventos de fato estruturados `background-agents/fact`** — os fatos registrado / mensagem / parada / progresso / arquivado, anexados ao log do pai como registros somente-log com o marcador de envelope `ignorable: true`; leitores que não conhecem o tipo pulam os registros em vez de recusar o log. Hosts cujo `Session.append` é anterior ao marcador (todas as linhas rc publicadas até `0.1.0-rc.8` e `0.1.1-rc.2` o descartam silenciosamente — a correção do marcador só existe no master — deixando sessões sem marcador irrecuperáveis em builds mais estritos) são detectados antes do primeiro append (pré-checagem da versão do peer e sondagem do envelope retornado) e os appends de fatos são pulados com um aviso único — o armazenamento durável, os avisos e as ferramentas continuam funcionando, e as projeções degradam para um fold vazio.
- **metadados de repetição `tool/result`** — os mesmos fatos em logs gravados antes do canal estruturado (dobrados apenas enquanto uma linha não tem procedência estruturada).
- **avisos `user/message` injetados** (visíveis ao modelo), fonte `{ kind: 'plugin', plugin: 'dsh-background-agents' }` — as linhas de progresso com limite de frequência e os avisos de arquivamento (prefixo canônico `[background-agent <id>] …`).
- o **aviso oficial `subagent-settled`** — o fato durável "settled" do filho.
- As salas de equipe espelham a mesma disciplina: cada mensagem de sala entregue é um `user/message` durável no log do próprio membro, e a linha do tempo compartilhada se espelha como eventos `team-room/fact` somente-log no domínio de armazenamento `team_rooms`.

A projeção `backgroundAgents` dobra o canal estruturado e mantém as dobras herdadas; o valor do painel e os fatos de `bg_list` se reconstroem a cada reabertura sem analisar o texto legível dos avisos. Quando o próprio catálogo não está disponível, `bg_list` retorna um marcador explícito **`unrecoverable`** — ele nunca fabrica uma lista vazia.

## Como isso se relaciona com as ferramentas de subagente integradas

O núcleo do harness inclui suas próprias ferramentas de subagente (`subagent`, `send_message`, `interrupt_agent` e a ferramenta `report` do lado do filho). As ferramentas `bg_*` deste plugin são suas **companheiras com escopo de sessão**; ambas podem ser montadas juntas:

| Ferramenta integrada | Este plugin | Diferença |
|---|---|---|
| `subagent` (`backgroundMode: 'continuable'`) | `background_agent` | A mesma costura `startContinuable`; este plugin adiciona validação de tool_filter/persona/max_depth por filho e o limite por sessão |
| `send_message` | `bg_message` | A mesma semântica de entrega; `bg_message` se dirige aos agentes de segundo plano desta conversa e mantém os fatos da projeção |
| `interrupt_agent` | `bg_stop` | A mesma semântica de interrupção; `bg_stop` também registra um fato de parada estruturado |
| ferramenta `report` do filho | autoReport | A integrada é chamada pelo próprio modelo do filho; este plugin injeta progresso com limite de frequência **após cada turno do filho automaticamente** |

O que falta às ferramentas do núcleo: `bg_list`, `bg_result`, arquivamento por inatividade e a projeção de painel dobrada por pai.

Fora de escopo: acionamento programado (a costura de agendamento existe), agentes remotos/entre máquinas e qualquer mudança no contrato oficial de ativação de subagentes.

## Não é este plugin

| Projeto | O que ele faz | A fronteira |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Tarefas de codificação programadas em sessões de agente novas | Ele é dono de **quando** as tarefas rodam (agendamento). Este plugin é dono da **direção interativa** de uma conversa de longa duração — sem costura de agendador, sem cron. |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | Barra de status para *jobs* de segundo plano (progresso + cauda da saída) | Ele **exibe** jobs a nível de ferramenta. Este plugin cria e dirige **sessões de agente**; seu painel é um painel disso, não o produto. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Habilidade de painel multiagente | Orientado à exibição. As linhas deste plugin são **acionáveis**: saltar para a sessão do filho, enviar mensagens, parar — através do plano de controle oficial. |

## Permissões e dados

- **Permissões**: o manifesto do workshop declara `session:append`, `subagent:spawn` e `tools:register`.
- **Dados**: as salas de equipe vivem no domínio de armazenamento `team_rooms` (SQLite ou JSONL — zero serviços extras); os fatos dos agentes de segundo plano viajam no log de sessão do pai. Sem banco de dados separado, sem rede.
- **Log de sessão**: os eventos `background-agents/fact` e `team-room/fact` são anexados com o marcador de envelope `ignorable: true` em hosts que o respeitam (hosts anteriores ao marcador são detectados e os appends são pulados — veja `allowUnmarkedFacts`); as linhas de progresso e entregas de sala visíveis ao modelo são registros `user/message` reais.

## Limites de segurança

- **Somente costura oficial.** Início, mensagem e parada são adaptadores finos sobre `startContinuable` / `followup` / `interrupt`; parar solicita interrupção e nunca mata processos.
- **`tool_filter` apenas restringe.** Remove ferramentas da visão do filho — nunca concede novas; os nomes são validados contra `allowedChildTools`.
- **Transferências com aprovação.** `room_transfer_task` passa pela costura oficial de aprovação e fecha em falha quando nenhum answerer a concede.
- **Visível ao modelo ⟺ registrado.** Cada mensagem de sala entregue é um `user/message` durável no log do próprio membro; a linha do tempo compartilhada se espelha como eventos `team-room/fact` somente-log.
- **Sem agendamento, sem agentes entre máquinas.** Os filhos são sessões continuáveis locais ao processo do deployment.

## Limitações conhecidas

- As salas de equipe exigem que o domínio de armazenamento seja composto; sem `@deepseek-ai/dsh-storage-domain`, o comando `/room` e as ferramentas `room_*` são desativados (as cinco ferramentas `bg_*` ainda carregam).
- `provider` deve nomear um provedor com capacidade continuável (`prepareContinuable`); um provedor ausente faz `background_agent` falhar até ele aparecer.
- `maxBackgroundAgents` é um orçamento compartilhado entre **todos** os filhos diretos continuáveis da sessão, incluindo os iniciados pela ferramenta `subagent` integrada.
- Filhos de uso único nunca são listados nem recebem mensagens — `bg_list` mantém apenas linhas continuáveis.
- Os filhos são locais ao processo: a costura de agendamento é dona do "quando"; este plugin é dono de dirigir uma conversa em andamento.

## Desenvolvimento

```sh
pnpm install        # somente tooling; os pacotes do harness resolvem contra um checkout irmão
pnpm run typecheck  # TS estrito, programas node + client
pnpm test           # vitest: testes unitários + end-to-end (costura de subagente real, LLM roteirizado, painel jsdom)
pnpm run build      # lib/index.js (metade node) + lib/client.js (bundle de cliente web)
pnpm run gen-aliases  # re-mapeia os caminhos dos pacotes do harness após mover o checkout
```

Uma demo end-to-end sem chave dirige uma sessão pai real e um filho de segundo plano por meio de um LLM roteirizado determinístico (sem API key; `dev/` está no gitignore — adapte os caminhos ao seu checkout):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "【父会话】驱动后台 agent 演示"
```

## Tópicos

`dsh`, `dsh-plugin`, `deepseek-harness`, `subagent`, `background-agent`, `background-agents`, `agent-dashboard`, `conversation-steering`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`

## Contribuidores

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: o runtime de agentes de segundo plano sobre a costura oficial de subagentes, o hub de salas de equipe, o painel lateral da interface web, as projeções de sessão, a documentação, CI/CD e releases.

## Família de Plugins DSH PerryLink

Este projeto é um dos plugins do DeepSeek Harness mantidos por [PerryLink](https://github.com/PerryLink). Se este ajuda você, é provável que os outros também ajudem:

| Plugin | Resumo em uma linha |
|---|---|
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | Painel de runtime MCP somente leitura: comando /mcp + aba de ajustes com status, ferramentas e erros |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | Guarda de disciplina de engenharia: sabatina de requisitos, portões de teste, revisão adversária |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Agentes filhos de segundo plano duráveis com uma barra lateral de interface web, mensagens e interrupção |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | Diagnósticos, formatação, conclusão, ações de código e renomeação LSP sobre servidores de linguagem |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Troca de estilo em runtime equivalente a outputStyles do Claude Code |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Equivalente a /rewind do Claude Code: snapshots, bifurcações de sessão, restauração de uso único |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Regras de permissão declarativas allow/deny/ask no estilo do Claude Code com auditoria |
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | Revisão automática de segundo modelo na cadeia de aprovação, com falha fechada por padrão |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | Memória entre sessões com aprovação: costura ctx.memory + SQLite + ferramenta memory |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | Pacote de habilidades de auditoria de segurança: varredura de segredos, revisão de dependências e cadeia de suprimentos |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | Fixa sessões na barra lateral web com ordenação durável |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Histórico de entrada estilo terminal para o compositor web: setas, busca Ctrl+R |
| [dsh-github](https://github.com/PerryLink/dsh-github) | Integração de PR/issues do GitHub para o DSH, toda escrita com aprovação |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | Base de conhecimento de desenvolvimento de plugins como uma habilidade de agente sob demanda |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | Migra sessões, memória, habilidades e CLAUDE.md do Claude Code para o DSH |

## Licença

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors
