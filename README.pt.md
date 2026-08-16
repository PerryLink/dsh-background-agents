# dsh-background-agents

> Agentes de segundo plano interativos e de sessão longa para o [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Inicie um agente filho durável que continua trabalhando enquanto você continua conversando — acompanhe o progresso, direcione-o com mensagens e pare-o, sem sair da sua sessão.

[English](./README.md) · [中文](./README.zh.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [हिन्दी](./README.hi.md)

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-4d6bfe)](https://github.com/topics/dsh-plugin)
[![topic: dsh](https://img.shields.io/badge/topic-dsh-4d6bfe)](https://github.com/topics/dsh)
[![npm version](https://img.shields.io/npm/v/dsh-background-agents)](https://www.npmjs.com/package/dsh-background-agents)
[![npm downloads](https://img.shields.io/npm/dm/dsh-background-agents)](https://www.npmjs.com/package/dsh-background-agents)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-background-agents/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-background-agents/actions)

Os *jobs* em segundo plano do DSH são execuções de ferramentas do tipo "dispare e esqueça": dá para ler a saída e matá-los, mas não dá para conversar com eles. O `dsh-background-agents` eleva isso a **sessões completas de agente em segundo plano** sobre o seam oficial de subagentes — uma conversa filha continuável que você pode enviar mensagens, corrigir e interromper a qualquer momento, enquanto uma linha de progresso injetada após cada turno mantém você (e o modelo) informados.

## O que você ganha

- **`background_agent`** — inicia um agente filho durável e continuável a partir de qualquer sessão. Ele trabalha no próprio contexto, devolve um id estável na hora e mantém a conversa aberta para sempre. Escopo opcional por filho: `tool_filter` (remove ferramentas da visão do filho — nunca concede novas), `persona` (uma persona dedicada de system-prompt) e `max_depth` (teto de profundidade de delegação); `childProvider`/`childModel` roteiam suas requisições de modelo.
- **`bg_message`** — envie mais trabalho, correções, ou acorde um agente assentado. Entrega pelo inbox FIFO oficial; a resposta do agente é o próximo turno dele.
- **`bg_list`** — estado dos seus agentes: rótulo, modo, atividade (`running` / `idle` / `ready` / `settled` / `archived`), contagem de mensagens, última atividade. Recupera filhos persistidos após reinício. `recursive: true` lista a árvore descendente inteira com `parentId`/`depth`.
- **`bg_result`** — lê o último texto de saída do assistente de um filho mais seu rótulo e atividade, além do resumo do aviso de assentamento. A mensagem final sem texto de um modelo pensante recorre aos seus blocos de raciocínio, marcados `textSource: 'reasoning'`.
- **`bg_stop`** — solicita a interrupção do turno atual. Dispara e retorna: o desligamento oficial conclui o trabalho; o agente continua retomável.
- **autoReport** — após cada turno do filho, uma linha de progresso limitada é injetada na sua sessão (visível ao modelo, com origem do plugin). O resultado final chega pelo aviso oficial de assentamento. `reportDelivery: wakeup` faz cada linha abrir um turno do pai quando ele está ocioso.
- **Arquivamento por inatividade** — agentes quietos além de `idleTimeoutMinutes` são arquivados com aviso e pedido de parada; `bg_message` os acorda de novo. Com `autoArchive: false`, agentes observadores quietos ficam estacionados em vez de arquivados.
- **Projeção `backgroundAgents`** — uma unidade de projeção de sessão que dobra o log do pai em linhas de painel (id do agente, rótulo, atividade, resumo da última mensagem, hora de criação). Tudo se reconstrói a partir do log durável, sem banco de dados separado.
- **Painel Web UI** — uma entrada "Background agents" na barra lateral da Web GUI com estado ao vivo, salto de um clique para a sessão filha, um botão de parada, um botão de mensagem que enfileira um novo turno pelo RPC oficial `subagent.prompt`, e um botão de resultado que espia o texto final do assistente do filho pelo RPC de leitura `subagent.history`. Os títulos da sessão pai desambiguam as linhas quando vários pais projetam agentes.

## Início rápido

```sh
# a partir do checkout do harness ou de onde o CLI dsh estiver (web ou headless)
dsh plugin --profile <name> add "github:PerryLink/dsh-background-agents#v0.4.0"
```

O patch do bundle carrega a linha do plugin, então o `dsh plugin add` a compõe na pilha de camadas do perfil (`dsh.profile.bundles`). Prefira a fonte git com uma ref fixada: o repo versiona a saída do build (`lib/`), então instalações git não precisam de etapa de build nem de entrada `allowBuilds`. O pacote também está publicado no npm: `pnpm add dsh-background-agents` funciona da mesma forma (o CI publica cada push de tag).

A linha que aterrissa no perfil (sobrescreva `config` por perfil no `cordis.patch.yml`):

```yaml
- insert:
    - id: background-agents
      name: dsh-background-agents
      config:
        provider: spawn        # o provedor ctx.subagents para filhos continuáveis
```

O plugin precisa da espinha de subagentes já montada (qualquer perfil sobre `@deepseek-ai/dsh-base` a tem: `dsh-subagent`, `dsh-subagent-spawn-in-process`, `dsh-session-projection`).

Depois, em qualquer sessão, peça ao modelo ou chame as ferramentas diretamente:

```
background_agent "monitore o repositório em busca de falhas de teste e me mantenha informado" (label: test-watch)
bg_list
bg_message <agentId> "verifique agora também os testes de snapshot"
bg_stop <agentId>
```

## Configuração

Todo parâmetro ajustável é um campo `Config` validado — mude no `cordis.yml`, nunca no código.

| Campo | Padrão | Significado |
|---|---|---|
| `provider` | *(obrigatório)* | nome do provedor `ctx.subagents` para inícios continuáveis (`spawn`) |
| `autoReport` | `true` | injeta uma linha de progresso no pai após cada turno do filho |
| `reportDelivery` | `quiet` | `quiet` anexa a linha à próxima requisição de modelo do pai; `wakeup` abre um turno do pai quando ocioso (enfileira se ocupado) |
| `reportThrottleMs` | `15000` | intervalo mínimo entre duas injeções de progresso de um filho |
| `reportSummaryMaxChars` | `300` | teto rígido do texto da linha de progresso (com reticências) |
| `resultMaxChars` | `4000` | teto rígido do texto do `bg_result` (com reticências e bandeira `truncated`) |
| `maxBackgroundAgents` | `4` | teto rígido de agentes não arquivados por sessão pai; o orçamento é compartilhado por **todos** os filhos diretos continuáveis da sessão (incluindo os iniciados pela ferramenta `subagent` integrada) |
| `autoArchive` | `true` | interruptor do arquivamento por inatividade: em `false` a varredura nunca arquiva filhos quietos (a janela de inatividade só alimenta a recuperação de entradas de cache obsoletas) |
| `idleTimeoutMinutes` | `120` | janela de inatividade após a qual um filho quieto é arquivado e notificado (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | período da varredura de arquivamento |
| `maxLabelChars` | `120` | teto do rótulo exibido (com reticências) |
| `childProvider` | *(herdar)* | rota de provedor para as requisições de modelo do filho |
| `childModel` | *(herdar)* | id de modelo para as requisições de modelo do filho |
| `maxChildDepth` | *(nenhum)* | teto de configuração para o argumento `max_depth` de um início |
| `allowedChildTools` | *(nenhum)* | lista branca de nomes para `tool_filter`; vazia/ausente = sem limite |

## Como funciona — e por que sobrevive a reinícios

Tudo passa pelo seam oficial de subagentes: `startContinuable`, `followup`, `interrupt`, `listChildren` — o plugin não faz roteamento de ciclo de vida próprio, nunca toca o `Agent` de outra sessão e nunca mata árvores de processos (parar = *pedir interrupção*; o desligamento pertence ao gestor de continuação).

O plugin escreve cada fato por **um canal estruturado e um canal visível para o modelo**:

- **eventos de fato estruturados `background-agents/fact`** (v0.3.0+) — os fatos registrado / mensagem / parada / progresso / arquivado, anexados ao log do pai como registros apenas-de-log com o marcador `ignorable: true`; leitores que não conhecem o tipo pulam os registros em vez de recusar o log, então builds do harness e versões do plugin mais antigas continuam abrindo pais escritos por este;
- **metadados de reprodução** de `tool/result` — os mesmos fatos em logs anteriores à v0.3.0 (dobrados apenas enquanto uma linha não tem procedência estruturada);
- **avisos `user/message` injetados** (visíveis para o modelo) com origem `{ kind: 'plugin', plugin: 'dsh-background-agents' }` — as linhas de progresso e os avisos de arquivamento (prefixo canônico `[background-agent <id>] …`);
- o **aviso oficial `subagent-settled`** — o fato durável de "assentado" do filho.

A unidade de projeção `backgroundAgents` dobra o canal estruturado e mantém as dobras legacy para logs anteriores à v0.3.0 (uma linha muda para procedência estruturada no seu primeiro fato, então um log de canal duplo nunca conta duas vezes). O painel e os fatos do `bg_list` se reconstroem a cada reabertura sem interpretar o texto legível dos avisos. Quando o catálogo em si não está disponível (faltam projeções ou o armazenamento de sessões), `bg_list` devolve um marcador explícito **`unrecoverable`** — nunca fabrica uma lista vazia.

## Isto não é este plugin

| Projeto | O que faz | A fronteira |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Tarefas de codificação agendadas em sessões novas | Decide **quando** as tarefas rodam (agendamento). Este plugin cuida da **condução interativa** de uma conversa longa — sem seam de agendamento, sem cron. |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | Barra de status para *jobs* em segundo plano (progresso + saída) | Ele **exibe** trabalhos no nível de ferramenta. Este plugin cria e conduz **sessões de agente**; o painel é uma parte, não o produto. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Skill de painel multi-agente | Voltado a exibição. As linhas deste plugin são **acionáveis**: pular para a sessão filha, enviar mensagens, parar — pelo plano de controle oficial. |

## Relação com as ferramentas de subagente integradas

O núcleo do harness traz suas próprias ferramentas de subagente (`subagent`, `send_message`, `interrupt_agent` e a ferramenta `report` do filho). As ferramentas `bg_*` deste plugin são seu **complemento com escopo de sessão**; ambas podem ser montadas juntas:

| Ferramenta integrada | Este plugin | Diferença |
|---|---|---|
| `subagent` (`backgroundMode: 'continuable'`) | `background_agent` | Mesmo seam `startContinuable`; este plugin adiciona validação por filho de tool_filter/persona/max_depth e o teto por sessão |
| `send_message` | `bg_message` | Mesma semântica de entrega; `bg_message` se dirige aos agentes de fundo desta conversa e mantém os fatos de projeção |
| `interrupt_agent` | `bg_stop` | Mesma semântica de interrupção; `bg_stop` também registra um fato estruturado de parada |
| ferramenta `report` do filho | autoReport | A integrada é chamada pelo próprio modelo filho; este plugin injeta progresso limitado após **cada turno do filho automaticamente** |

O que as ferramentas do núcleo não têm: `bg_list`, `bg_result`, arquivamento por inatividade e a projeção de painel dobrada por pai.

Fora do escopo: disparo agendado (o seam de schedule existe), agentes remotos/entre máquinas e qualquer mudança no contrato oficial de ativação de subagentes.

## Desenvolvimento

```sh
pnpm install        # apenas ferramentas; pacotes do harness resolvem contra um checkout irmão
pnpm run typecheck  # TS estrito, programas node + client
pnpm test           # 83 testes unitários e ponta a ponta (seam real de subagentes, LLM roteirizado, painel jsdom)
pnpm run build      # lib/index.js (metade node) + lib/client.js (bundle web)
pnpm run gen-aliases  # re-mapeia caminhos de pacotes do harness quando o checkout se move
```

Uma demo ponta a ponta sem chave move uma sessão pai real e um filho de fundo por um LLM roteirizado determinista (sem API key; `dev/` é gitignorado — ajuste os caminhos ao seu checkout):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "【父会话】驱动后台 agent 演示"
```

## 👥 Contribuidores

Obrigado a todos que contribuíram com o `dsh-background-agents`:

- [PerryLink](https://github.com/PerryLink) — autor e mantenedor: o runtime de agentes em segundo plano sobre o seam oficial de subagentes, o painel lateral da Web UI, a projeção de sessão, documentação, CI/CD e releases.

Quer ajudar? Consulte os [templates de issues](.github/ISSUE_TEMPLATE/) e a [política de segurança](SECURITY.md) — PRs são bem-vindos em inglês ou chinês.

## Licença

Apache License 2.0 — veja [LICENSE](./LICENSE). Avisos de terceiros: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
