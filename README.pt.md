# dsh-background-agents

> Agentes de segundo plano interativos e de sessão longa para o [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Inicie um agente filho durável que continua trabalhando enquanto você continua conversando — acompanhe o progresso, direcione-o com mensagens e pare-o, sem sair da sua sessão.

[English](./README.md) · [中文](./README.zh.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [हिन्दी](./README.hi.md)

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-4d6bfe)](https://github.com/topics/dsh-plugin)
[![topic: dsh](https://img.shields.io/badge/topic-dsh-4d6bfe)](https://github.com/topics/dsh)

Os *jobs* em segundo plano do DSH são execuções de ferramentas do tipo "dispare e esqueça": dá para ler a saída e matá-los, mas não dá para conversar com eles. O `dsh-background-agents` eleva isso a **sessões completas de agente em segundo plano** sobre o seam oficial de subagentes — uma conversa filha continuável que você pode enviar mensagens, corrigir e interromper a qualquer momento, enquanto uma linha de progresso injetada após cada turno mantém você (e o modelo) informados.

## O que você ganha

- **`background_agent`** — inicia um agente filho durável e continuável a partir de qualquer sessão. Ele trabalha no próprio contexto, devolve um id estável na hora e mantém a conversa aberta para sempre. Escopo opcional por filho: `tool_filter` (remove ferramentas da visão do filho — nunca concede novas), `persona` (uma persona dedicada de system-prompt) e `max_depth` (teto de profundidade de delegação); `childProvider`/`childModel` roteiam suas requisições de modelo.
- **`bg_message`** — envie mais trabalho, correções, ou acorde um agente assentado. Entrega pelo inbox FIFO oficial; a resposta do agente é o próximo turno dele.
- **`bg_list`** — estado dos seus agentes: rótulo, modo, atividade (`running` / `idle` / `ready` / `settled` / `archived`), contagem de mensagens, última atividade. Recupera filhos persistidos após reinício. `recursive: true` lista a árvore descendente inteira com `parentId`/`depth`.
- **`bg_result`** — lê o último texto de saída do assistente de um filho mais sua atividade, além do resumo do aviso de assentamento.
- **`bg_stop`** — solicita a interrupção do turno atual. Dispara e retorna: o desligamento oficial conclui o trabalho; o agente continua retomável.
- **autoReport** — após cada turno do filho, uma linha de progresso limitada é injetada na sua sessão (visível ao modelo, com origem do plugin). O resultado final chega pelo aviso oficial de assentamento. `reportDelivery: wakeup` faz cada linha abrir um turno do pai quando ele está ocioso.
- **Arquivamento por inatividade** — agentes quietos além de `idleTimeoutMinutes` são arquivados com aviso e pedido de parada; `bg_message` os acorda de novo.
- **Projeção `backgroundAgents`** — uma unidade de projeção de sessão que dobra o log do pai em linhas de painel (id do agente, rótulo, atividade, resumo da última mensagem, hora de criação). Tudo se reconstrói a partir do log durável, sem banco de dados separado.
- **Painel Web UI** — uma entrada "Background agents" na barra lateral da Web GUI com estado ao vivo, salto de um clique para a sessão filha, um botão de parada e um botão de mensagem que enfileira um novo turno pelo RPC oficial `subagent.prompt`.

## Início rápido

```sh
# a partir do checkout do harness ou de onde o CLI dsh estiver (web ou headless)
dsh plugin --profile <name> add "github:PerryLink/dsh-background-agents#v0.2.0"
```

O patch do bundle carrega a linha do plugin, então o `dsh plugin add` a compõe na pilha de camadas do perfil (`dsh.profile.bundles`). Prefira a fonte git com uma ref fixada: o repo versiona a saída do build (`lib/`), então instalações git não precisam de etapa de build nem de entrada `allowBuilds`. (Quando o pacote for publicado no npm, `pnpm add dsh-background-agents` também funcionará.)

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
| `maxBackgroundAgents` | `4` | teto rígido de agentes não arquivados por sessão pai |
| `idleTimeoutMinutes` | `120` | janela de inatividade após a qual um filho quieto é arquivado e notificado (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | período da varredura de arquivamento |
| `maxLabelChars` | `120` | teto do rótulo exibido (com reticências) |
| `childProvider` | *(herdar)* | rota de provedor para as requisições de modelo do filho |
| `childModel` | *(herdar)* | id de modelo para as requisições de modelo do filho |
| `maxChildDepth` | *(nenhum)* | teto de configuração para o argumento `max_depth` de um início |
| `allowedChildTools` | *(nenhum)* | lista branca de nomes para `tool_filter`; vazia/ausente = sem limite |

## Como funciona — e por que sobrevive a reinícios

Tudo passa pelo seam oficial de subagentes: `startContinuable`, `followup`, `interrupt`, `listChildren` — o plugin não faz roteamento de ciclo de vida próprio, nunca toca o `Agent` de outra sessão e nunca mata árvores de processos (parar = *pedir interrupção*; o desligamento pertence ao gestor de continuação).

O plugin também escreve **apenas por canais que o harness já persiste**. O harness atual não tem superfície de registro para eventos de sessão de plugins, então, em vez de inventar eventos de log, ele carimba:

- **metadados de reprodução** de `tool/result` — os fatos de registro / mensagem / parada de cada chamada;
- **avisos `user/message` injetados** com origem `{ kind: 'plugin', plugin: 'dsh-background-agents' }` — as linhas de progresso e os avisos de arquivamento (prefixo canônico `[background-agent <id>] …`);
- o **aviso oficial `subagent-settled`** — o fato durável de "assentado" do filho.

A unidade de projeção `backgroundAgents` dobra exatamente esses três canais de eventos conhecidos a partir do log do pai, então o painel e os fatos do `bg_list` se reconstroem a cada reabertura. Quando o catálogo em si não está disponível (faltam projeções ou o armazenamento de sessões), `bg_list` devolve um marcador explícito **`unrecoverable`** — nunca fabrica uma lista vazia.

## Isto não é este plugin

| Projeto | O que faz | A fronteira |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Tarefas de codificação agendadas em sessões novas | Decide **quando** as tarefas rodam (agendamento). Este plugin cuida da **condução interativa** de uma conversa longa — sem seam de agendamento, sem cron. |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | Barra de status para *jobs* em segundo plano (progresso + saída) | Ele **exibe** trabalhos no nível de ferramenta. Este plugin cria e conduz **sessões de agente**; o painel é uma parte, não o produto. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Skill de painel multi-agente | Voltado a exibição. As linhas deste plugin são **acionáveis**: pular para a sessão filha, enviar mensagens, parar — pelo plano de controle oficial. |

Fora do escopo: disparo agendado (o seam de schedule existe), agentes remotos/entre máquinas e qualquer mudança no contrato oficial de ativação de subagentes.

## Desenvolvimento

```sh
pnpm install        # apenas ferramentas; pacotes do harness resolvem contra um checkout irmão
pnpm run typecheck  # TS estrito, programas node + client
pnpm test           # 60 testes unitários e ponta a ponta (seam real de subagentes, LLM roteirizado, painel jsdom)
pnpm run build      # lib/index.js (metade node) + lib/client.js (bundle web)
pnpm run gen-aliases  # re-mapeia caminhos de pacotes do harness quando o checkout se move
```

Uma demo ponta a ponta sem chave move uma sessão pai real e um filho de fundo por um LLM roteirizado determinista (sem API key; `dev/` é gitignorado — ajuste os caminhos ao seu checkout):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "【父会话】驱动后台 agent 演示"
```

## Licença

Apache License 2.0 — veja [LICENSE](./LICENSE). Avisos de terceiros: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
