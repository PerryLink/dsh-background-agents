<div align="center">

# 👥 dsh-background-agents
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-background-agents` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Agentes de segundo plano interativos de sessão longa mais salas de equipe multiagente persistentes para o DeepSeek Harness — inicie um agente filho durável que continua trabalhando enquanto você continua conversando.**

*Conduza conversas em andamento e coordene uma equipe entre sessões; tudo sobrevive a reinícios por meio do próprio armazenamento do harness.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-background-agents)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-background-agents.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-background-agents/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-background-agents/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-background-agents?label=version)](https://github.com/PerryLink/dsh-background-agents/releases)
[![npm version](https://img.shields.io/npm/v/dsh-background-agents)](https://www.npmjs.com/package/dsh-background-agents)
[![npm downloads](https://img.shields.io/npm/dm/dsh-background-agents)](https://www.npmjs.com/package/dsh-background-agents)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-background-agents?metric=downloads&lang=pt)](https://dshfind.com/pt/plugins/PerryLink/dsh-background-agents?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---


<!-- star-cta -->
## ⭐ 如果它帮到了你

Este plugin faz parte da [família de plugins DSH](https://github.com/PerryLink) (mais de 40, todos Apache-2.0). Se for útil, **deixe uma estrela**: não desbloqueia nada, mas ajuda a próxima pessoa a encontrá-lo.

*English:* part of a 40+ plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.
## Compatibilidade

Hosts `0.1.2-alpha.2` e posteriores falham de forma fechada no vocabulário de eventos de sessão, então este plugin não grava mais ali seus eventos de fatos somente-registro (`background-agents/fact`, `team-room/fact`): os fatos seguem pelo canal de logger/painel e as projeções degradam para uma dobra vazia. As linhas rc anteriores (até `0.1.1-rc.2`) mantêm a disciplina do marcador ignorable. A metade cliente agora usa os pacotes de cliente atuais (`dsh-api-session-controller`, `dsh-client-web`) e o remoto subagent atual (`interruptByParent`, `prompt` com `requestId` cunhado pelo cliente; o antigo RPC `history` sumiu — os vistores de resultado leem a projeção `conversation` da sessão filha).
0.1.2-rc.1 (adaptado em 2026-09-04): o envelope de sessão mantém seu campo ignorable apenas para compatibilidade de leitura de logs armazenados - o Session.append ainda não consegue estampá-lo (o terceiro parâmetro é SurfaceIntent, apenas para tipos de eventos de superfície, nunca um pacote de opções), então o comportamento da porta de fatos não muda.
0.1.3-alpha.1 (adaptado em 2026-09-06): o pin de CI do harness passa para o checkout master (`d347e7039`) - o seam de handles (`open → read → close`) do serviço session-persistence. O runtime publicado 0.1.2-rc.1 é anterior a open(), então a leitura fria do bg_result detecta o seam e recorre a load() - mesmo comportamento nas duas linhas. Verificado em 2026-09-06 contra o checkout master dsh-v0.1.7-alpha.1 (cadeia completa de gates + smoke de instalação de perfil).
0.1.5-alpha.1 (adaptado em 2026-09-09): `SessionHandleReadResult` agora retorna `{ eventState, events }`, então a leitura fria do bg_result desestrutura `.events` do seam de handle (o fallback `load()` da linha publicada não muda). O pin de CI do harness passa para o commit público da tag `5dda764ed3aa` (o checkout local está 13 commits de infra à frente e inalcançável pela CI) e as sondas de compatibilidade instalam a linha alpha. Os peers são ampliados para `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` (regra prerelease-tuple: o primeiro braço sozinho não corresponde a `0.1.5-alpha.1`) e os devDeps fixam `0.1.5-alpha.1`. Verificado em 2026-09-09 contra `dsh-v0.1.7-alpha.1` (cadeia completa de gates). A afirmação anterior de `0.1.3-alpha.1` fica obsoleta: essa versão preliminar cai fora dos dois braços de peers.
0.1.5-rc.1 (adaptado em 2026-09-10): os pins de dependências passam para a linha publicada 0.1.5-rc.1; nenhuma mudança de seam afeta o comportamento deste plugin.
0.1.5-rc.2 (adaptado em 2026-09-11): os pins de dependências passam para a linha publicada 0.1.5-rc.2; nenhuma mudança de seam afeta o comportamento deste plugin.
0.1.6-alpha.2 (adaptado em 2026-09-18): o serviço de sessões do cliente removeu sua chamada de navegação para subagentes, então a ação agora informa que a navegação pertence ao cabeçalho da sessão (o assento de linhagem do `ui-subagent`) em vez de falhar em silêncio; o painel de salas deriva sua sessão atual da retenção da visão principal (`retainedBy.mainView`) porque `SessionListState.current` não existe mais. O listener de recuperação de `agent/created` retorna de forma síncrona sob seu próprio limite de 2 s, e um log de filho ilegível informa `unavailable` em vez de texto vazio. As métricas do dashboard alimentadas pelo canal de fatos do log de sessão continuam **indisponíveis** nesta linha (um fato não superficial ainda não pode receber a marca de omissão): as tabelas duráveis de salas e o valor de projeção do painel são o registro. Verificado em 2026-09-18 (ambos typechecks + a suíte completa); a metade visível no navegador **não** está verificada em máquina ainda.
0.1.7-alpha.1 (adaptado em 2026-09-22): o host concluiu sua migração para a atribuição de mensagens de propriedade do produtor — a fonte catch-all `{ kind: 'plugin', plugin }` foi retirada tanto do mapa de tipos quanto da admissão de linhas físicas —, então cada aviso que este plugin injeta agora carrega seu próprio `kind: 'dsh-background-agents'`, declarado por aumento de módulo; a projeção ainda lê avisos com `'plugin'` de logs antigos. Os resultados de ferramentas são mensagens V4 de primeira classe com `role: 'tool'` (`toolCallId`/`content`/`isError` no nível superior, sem bloco invólucro `{ type: 'tool-result' }`), e `listChildren` voltou a linhas `SubagentCatalogEntry` apenas de identidade — sem discriminante `kind`, sem diagnósticos e sem `activity` —, então cada ponto de chamada de listagem direta classifica por `mode === 'continuable'`. No cliente, `IconBranchOutline16` virou `IconBranchOutlineRegular` e `ISessions.refreshSubagents` virou `refreshProjections(sessionId)`. Verificado em 2026-09-22 (ambas as réguas de typecheck + a suíte completa + build + verificações de artefatos); a metade visível no navegador **não** está verificada em máquina ainda.

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-rc.2` (tag do GitHub, verificado em 2026-09-25; pins de desenvolvimento `0.1.7-rc.2`, peers `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`) |
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
| `observability` | `true` | Interruptor de observabilidade de custo/estado por agente: captura um fato `metrics` por turno filho (tokens, tempo de parede do turno, sinalizador de erro) e os agrega nos totais `metrics` de cada linha para o painel de custo; `false` desativa a captura (o painel mostra as métricas como indisponíveis) |
| `inbound.enabled` | `false` | Habilita a ponte de entrada JSON-RPC 2.0 sobre stdio para runtimes externos (OpenAI Agents SDK / CrewAI); desabilitado por padrão (fail-closed) |
| `inbound.command` | *(nenhum)* | Comando de lançamento do runtime externo; quando habilitado e presente, o plugin o gera e escuta notificações JSON-RPC delimitadas por quebras de linha. Ausente/não gerável = a ponte permanece inativa (registrado) |

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

- **eventos de fato estruturados `background-agents/fact`** — os fatos registrado / mensagem / parada / progresso / arquivado, anexados ao log do pai como registros somente-log com o marcador de envelope `ignorable: true`; leitores que não conhecem o tipo pulam os registros em vez de recusar o log. Hosts cujo `Session.append` é anterior ao marcador (todas as linhas rc publicadas até `0.1.0-rc.8` e `0.1.1-rc.2`, e a linha `0.1.2-rc` (que mantém o campo do envelope apenas para compatibilidade de leitura de logs armazenados e ainda não consegue estampá-lo), o descartam silenciosamente — a correção do marcador só existe no master — deixando sessões sem marcador irrecuperáveis em builds mais estritos) são detectados antes do primeiro append (pré-checagem da versão do peer e sondagem do envelope retornado) e os appends de fatos são pulados com um aviso único — o armazenamento durável, os avisos e as ferramentas continuam funcionando, e as projeções degradam para um fold vazio.
- **metadados de repetição `tool/result`** — os mesmos fatos em logs gravados antes do canal estruturado (dobrados apenas enquanto uma linha não tem procedência estruturada).
- **avisos `user/message` injetados** (visíveis ao modelo), fonte `{ kind: 'dsh-background-agents', form: 'notice' }` — as linhas de progresso com limite de frequência e os avisos de arquivamento (prefixo canônico `[background-agent <id>] …`).
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

## Entrada entre ecossistemas (P2)

Runtimes de agentes externos — OpenAI Agents SDK, CrewAI e similares — podem publicar em uma sala de equipe por uma **ponte JSON-RPC 2.0 delimitada por quebras de linha sobre stdio** (conjunto mínimo de conexão direta; a compatibilidade total com o protocolo ACP aguarda a costura upstream). Ative com `inbound.enabled` e `inbound.command`; o runtime emite uma notificação JSON por linha onde `method` é o evento (`agent_started` abre um cartão no quadro, `agent_message` publica no barramento, `agent_finished` conclui o cartão). Mensagens inválidas são descartadas e um erro JSON-RPC é respondido; início e parada passam por um disposer.

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

## Licença

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors


## PerryLink DSH Plugin Family

This project is one of the **45 DeepSeek Harness plugins** maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default | |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | DSH Desktop Market standard catalog source for the PerryLink family | |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` | |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers | |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit | |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Community certification registry with repro-checkable grades and badges | |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins | |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill | |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins | |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card | |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | Merged `0.1.3-alpha.1` → `0.1.5-rc.1` upgrade corridor card plus a zero-dependency seam scanner | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. | |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools | |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. | |
