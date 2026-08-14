# dsh-background-agents

> Agentes de segundo plano interativos e de sess茫o longa para o [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Inicie um agente filho dur谩vel que continua trabalhando enquanto voc锚 continua conversando 鈥?acompanhe o progresso, direcione-o com mensagens e pare-o, sem sair da sua sess茫o.

[English](./README.md) 路 [涓枃](./README.zh.md) 路 [Espa帽ol](./README.es.md) 路 [Portugu锚s](./README.pt.md) 路 [啶灌た啶ㄠ啶︵](./README.hi.md)

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-4d6bfe)](https://github.com/topics/dsh-plugin)
[![topic: dsh](https://img.shields.io/badge/topic-dsh-4d6bfe)](https://github.com/topics/dsh)

Os *jobs* em segundo plano do DSH s茫o execu莽玫es de ferramentas do tipo "dispare e esque莽a": d谩 para ler a sa铆da e mat谩-los, mas n茫o d谩 para conversar com eles. O `dsh-background-agents` eleva isso a **sess玫es completas de agente em segundo plano** sobre o seam oficial de subagentes 鈥?uma conversa filha continu谩vel que voc锚 pode enviar mensagens, corrigir e interromper a qualquer momento, enquanto uma linha de progresso injetada ap贸s cada turno mant茅m voc锚 (e o modelo) informados.

## O que voc锚 ganha

- **`background_agent`** 鈥?inicia um agente filho dur谩vel e continu谩vel a partir de qualquer sess茫o. Ele trabalha no pr贸prio contexto, devolve um id est谩vel na hora e mant茅m a conversa aberta para sempre. Escopo opcional por filho: `tool_filter` (remove ferramentas da vis茫o do filho 鈥?nunca concede novas), `persona` (uma persona dedicada de system-prompt) e `max_depth` (teto de profundidade de delega莽茫o); `childProvider`/`childModel` roteiam suas requisi莽玫es de modelo.
- **`bg_message`** 鈥?envie mais trabalho, corre莽玫es, ou acorde um agente assentado. Entrega pelo inbox FIFO oficial; a resposta do agente 茅 o pr贸ximo turno dele.
- **`bg_list`** 鈥?estado dos seus agentes: r贸tulo, modo, atividade (`running` / `idle` / `ready` / `settled` / `archived`), contagem de mensagens, 煤ltima atividade. Recupera filhos persistidos ap贸s rein铆cio. `recursive: true` lista a 谩rvore descendente inteira com `parentId`/`depth`.
- **`bg_result`** 鈥?l锚 o 煤ltimo texto de sa铆da do assistente de um filho mais sua atividade, al茅m do resumo do aviso de assentamento.
- **`bg_stop`** 鈥?solicita a interrup莽茫o do turno atual. Dispara e retorna: o desligamento oficial conclui o trabalho; o agente continua retom谩vel.
- **autoReport** 鈥?ap贸s cada turno do filho, uma linha de progresso limitada 茅 injetada na sua sess茫o (vis铆vel ao modelo, com origem do plugin). O resultado final chega pelo aviso oficial de assentamento. `reportDelivery: wakeup` faz cada linha abrir um turno do pai quando ele est谩 ocioso.
- **Arquivamento por inatividade** 鈥?agentes quietos al茅m de `idleTimeoutMinutes` s茫o arquivados com aviso e pedido de parada; `bg_message` os acorda de novo.
- **Proje莽茫o `backgroundAgents`** 鈥?uma unidade de proje莽茫o de sess茫o que dobra o log do pai em linhas de painel (id do agente, r贸tulo, atividade, resumo da 煤ltima mensagem, hora de cria莽茫o). Tudo se reconstr贸i a partir do log dur谩vel, sem banco de dados separado.
- **Painel Web UI** 鈥?uma entrada "Background agents" na barra lateral da Web GUI com estado ao vivo, salto de um clique para a sess茫o filha, um bot茫o de parada e um bot茫o de mensagem que enfileira um novo turno pelo RPC oficial `subagent.prompt`.

## In铆cio r谩pido

```sh
# a partir do checkout do harness ou de onde o CLI dsh estiver (web ou headless)
dsh plugin --profile <name> add "github:PerryLink/dsh-background-agents#v0.3.0"
```

O patch do bundle carrega a linha do plugin, ent茫o o `dsh plugin add` a comp玫e na pilha de camadas do perfil (`dsh.profile.bundles`). Prefira a fonte git com uma ref fixada: o repo versiona a sa铆da do build (`lib/`), ent茫o instala莽玫es git n茫o precisam de etapa de build nem de entrada `allowBuilds`. (O CI publica pushes de tag no npm quando o reposit贸rio configura um secret `NPM_TOKEN`; a partir da铆, `pnpm add dsh-background-agents` tamb茅m funciona.)

A linha que aterrissa no perfil (sobrescreva `config` por perfil no `cordis.patch.yml`):

```yaml
- insert:
    - id: background-agents
      name: dsh-background-agents
      config:
        provider: spawn        # o provedor ctx.subagents para filhos continu谩veis
```

O plugin precisa da espinha de subagentes j谩 montada (qualquer perfil sobre `@deepseek-ai/dsh-base` a tem: `dsh-subagent`, `dsh-subagent-spawn-in-process`, `dsh-session-projection`).

Depois, em qualquer sess茫o, pe莽a ao modelo ou chame as ferramentas diretamente:

```
background_agent "monitore o reposit贸rio em busca de falhas de teste e me mantenha informado" (label: test-watch)
bg_list
bg_message <agentId> "verifique agora tamb茅m os testes de snapshot"
bg_stop <agentId>
```

## Configura莽茫o

Todo par芒metro ajust谩vel 茅 um campo `Config` validado 鈥?mude no `cordis.yml`, nunca no c贸digo.

| Campo | Padr茫o | Significado |
|---|---|---|
| `provider` | *(obrigat贸rio)* | nome do provedor `ctx.subagents` para in铆cios continu谩veis (`spawn`) |
| `autoReport` | `true` | injeta uma linha de progresso no pai ap贸s cada turno do filho |
| `reportDelivery` | `quiet` | `quiet` anexa a linha 脿 pr贸xima requisi莽茫o de modelo do pai; `wakeup` abre um turno do pai quando ocioso (enfileira se ocupado) |
| `reportThrottleMs` | `15000` | intervalo m铆nimo entre duas inje莽玫es de progresso de um filho |
| `reportSummaryMaxChars` | `300` | teto r铆gido do texto da linha de progresso (com retic锚ncias) |
| `resultMaxChars` | `4000` | teto r铆gido do texto do `bg_result` (com retic锚ncias e bandeira `truncated`) |
| `maxBackgroundAgents` | `4` | teto r铆gido de agentes n茫o arquivados por sess茫o pai; o or莽amento 茅 compartilhado por **todos** os filhos diretos continu谩veis da sess茫o (incluindo os iniciados pela ferramenta `subagent` integrada) |
| `idleTimeoutMinutes` | `120` | janela de inatividade ap贸s a qual um filho quieto 茅 arquivado e notificado (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | per铆odo da varredura de arquivamento |
| `maxLabelChars` | `120` | teto do r贸tulo exibido (com retic锚ncias) |
| `childProvider` | *(herdar)* | rota de provedor para as requisi莽玫es de modelo do filho |
| `childModel` | *(herdar)* | id de modelo para as requisi莽玫es de modelo do filho |
| `maxChildDepth` | *(nenhum)* | teto de configura莽茫o para o argumento `max_depth` de um in铆cio |
| `allowedChildTools` | *(nenhum)* | lista branca de nomes para `tool_filter`; vazia/ausente = sem limite |

## Como funciona 鈥?e por que sobrevive a rein铆cios

Tudo passa pelo seam oficial de subagentes: `startContinuable`, `followup`, `interrupt`, `listChildren` 鈥?o plugin n茫o faz roteamento de ciclo de vida pr贸prio, nunca toca o `Agent` de outra sess茫o e nunca mata 谩rvores de processos (parar = *pedir interrup莽茫o*; o desligamento pertence ao gestor de continua莽茫o).

O plugin escreve cada fato por **um canal estruturado e um canal vis铆vel para o modelo**:

- **eventos de fato estruturados `background-agents/fact`** (v0.3.0+) 鈥?os fatos registrado / mensagem / parada / progresso / arquivado, anexados ao log do pai como registros apenas-de-log com o marcador `ignorable: true`; leitores que n茫o conhecem o tipo pulam os registros em vez de recusar o log, ent茫o builds do harness e vers玫es do plugin mais antigas continuam abrindo pais escritos por este;
- **metadados de reprodu莽茫o** de `tool/result` 鈥?os mesmos fatos em logs anteriores 脿 v0.3.0 (dobrados apenas enquanto uma linha n茫o tem proced锚ncia estruturada);
- **avisos `user/message` injetados** (vis铆veis para o modelo) com origem `{ kind: 'plugin', plugin: 'dsh-background-agents' }` 鈥?as linhas de progresso e os avisos de arquivamento (prefixo can么nico `[background-agent <id>] 鈥);
- o **aviso oficial `subagent-settled`** 鈥?o fato dur谩vel de "assentado" do filho.

A unidade de proje莽茫o `backgroundAgents` dobra o canal estruturado e mant茅m as dobras legacy para logs anteriores 脿 v0.3.0 (uma linha muda para proced锚ncia estruturada no seu primeiro fato, ent茫o um log de canal duplo nunca conta duas vezes). O painel e os fatos do `bg_list` se reconstroem a cada reabertura sem interpretar o texto leg铆vel dos avisos. Quando o cat谩logo em si n茫o est谩 dispon铆vel (faltam proje莽玫es ou o armazenamento de sess玫es), `bg_list` devolve um marcador expl铆cito **`unrecoverable`** 鈥?nunca fabrica uma lista vazia.

## Isto n茫o 茅 este plugin

| Projeto | O que faz | A fronteira |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Tarefas de codifica莽茫o agendadas em sess玫es novas | Decide **quando** as tarefas rodam (agendamento). Este plugin cuida da **condu莽茫o interativa** de uma conversa longa 鈥?sem seam de agendamento, sem cron. |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | Barra de status para *jobs* em segundo plano (progresso + sa铆da) | Ele **exibe** trabalhos no n铆vel de ferramenta. Este plugin cria e conduz **sess玫es de agente**; o painel 茅 uma parte, n茫o o produto. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Skill de painel multi-agente | Voltado a exibi莽茫o. As linhas deste plugin s茫o **acion谩veis**: pular para a sess茫o filha, enviar mensagens, parar 鈥?pelo plano de controle oficial. |

## Rela莽茫o com as ferramentas de subagente integradas

O n煤cleo do harness traz suas pr贸prias ferramentas de subagente (`subagent`, `send_message`, `interrupt_agent` e a ferramenta `report` do filho). As ferramentas `bg_*` deste plugin s茫o seu **complemento com escopo de sess茫o**; ambas podem ser montadas juntas:

| Ferramenta integrada | Este plugin | Diferen莽a |
|---|---|---|
| `subagent` (`backgroundMode: 'continuable'`) | `background_agent` | Mesmo seam `startContinuable`; este plugin adiciona valida莽茫o por filho de tool_filter/persona/max_depth e o teto por sess茫o |
| `send_message` | `bg_message` | Mesma sem芒ntica de entrega; `bg_message` se dirige aos agentes de fundo desta conversa e mant茅m os fatos de proje莽茫o |
| `interrupt_agent` | `bg_stop` | Mesma sem芒ntica de interrup莽茫o; `bg_stop` tamb茅m registra um fato estruturado de parada |
| ferramenta `report` do filho | autoReport | A integrada 茅 chamada pelo pr贸prio modelo filho; este plugin injeta progresso limitado ap贸s **cada turno do filho automaticamente** |

O que as ferramentas do n煤cleo n茫o t锚m: `bg_list`, `bg_result`, arquivamento por inatividade e a proje莽茫o de painel dobrada por pai.

Fora do escopo: disparo agendado (o seam de schedule existe), agentes remotos/entre m谩quinas e qualquer mudan莽a no contrato oficial de ativa莽茫o de subagentes.

## Desenvolvimento

```sh
pnpm install        # apenas ferramentas; pacotes do harness resolvem contra um checkout irm茫o
pnpm run typecheck  # TS estrito, programas node + client
pnpm test           # 69 testes unit谩rios e ponta a ponta (seam real de subagentes, LLM roteirizado, painel jsdom)
pnpm run build      # lib/index.js (metade node) + lib/client.js (bundle web)
pnpm run gen-aliases  # re-mapeia caminhos de pacotes do harness quando o checkout se move
```

Uma demo ponta a ponta sem chave move uma sess茫o pai real e um filho de fundo por um LLM roteirizado determinista (sem API key; `dev/` 茅 gitignorado 鈥?ajuste os caminhos ao seu checkout):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "銆愮埗浼氳瘽銆戦┍鍔ㄥ悗鍙?agent 婕旂ず"
```

## Licen莽a

Apache License 2.0 鈥?veja [LICENSE](./LICENSE). Avisos de terceiros: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
