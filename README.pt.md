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
| Harness | DeepSeek Harness `0.1.0-rc.6` (peers `>=0.1.0-rc.5 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Todas (ferramentas de host; painel lateral web e salas de equipe opcionais via capacidade de domínio de armazenamento) |
| Modelo | Qualquer (os filhos herdam a rota do pai; `childProvider`/`childModel` sobrescrevem) |

## O que você recebe

O `dsh-background-agents` transforma os *jobs* de segundo plano do DSH (dispare-e-esqueça) em duas superfícies coordenadas:

1. **Cinco ferramentas de direção** — `background_agent` inicia um filho durável e continuável na costura oficial de subagentes (`tool_filter`, `persona`, `max_depth` e rota de modelo opcionais); `bg_message` entrega um turno posterior; `bg_list` informa o status (ou a árvore de descendentes); `bg_result` lê o último texto de resultado; `bg_stop` solicita a interrupção.
2. **Progresso e arquivamento** — `autoReport` injeta uma linha de progresso com limite de frequência após cada turno do filho; a varredura de inatividade arquiva filhos silenciosos e `bg_message` os acorda de novo.
3. **Projeção de painel + painel web** — a projeção de sessão `backgroundAgents` dobra o log do pai em linhas; um painel lateral mostra status em tempo real, salto, mensagem, parada e prévia do resultado.
4. **Salas de equipe (v0.5.0+)** — a família de comandos `/room` mais oito ferramentas `room_*` constroem salas multiagente persistentes: membros (cada um uma sessão independente), um barramento de mensagens (dirigido/difusão), um quadro de tarefas compartilhado e uma linha do tempo compartilhada — armazenados no domínio `team_rooms` (SQLite ou JSONL) e recuperados após reinícios do DSH. Transferências de tarefa entre membros passam pela costura oficial de aprovação.

## Início rápido

```sh
# 1. instale o bundle no seu perfil
dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"

# ou pelo npm (versões publicadas)
dsh plugin --profile web add dsh-background-agents

# 2. reinicie e verifique a linha
dsh --profile web --dump-config | grep -A4 'id: background-agents'
```

O patch do bundle carrega a linha do plugin; `provider` é obrigatório. O repo commita a saída do build (`lib/`), então a instalação por git não precisa de etapa de build. As salas de equipe montam onde o domínio de armazenamento estiver composto (`@deepseek-ai/dsh-storage-domain`); as cinco ferramentas `bg_*` funcionam sem ele.

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

## Ferramentas e superfícies

| Superfície | Tipo | Notas |
|---|---|---|
| `background_agent` | ferramenta | Inicia um filho durável e continuável (label, `tool_filter`, `persona`, `max_depth`) |
| `bg_message` | ferramenta | Entrega um turno posterior a um filho por agent id |
| `bg_list` | ferramenta | Status dos seus agentes (ou a árvore com `recursive: true`) |
| `bg_result` | ferramenta | Recupera o último texto de saída do assistente do filho |
| `bg_stop` | ferramenta | Solicita a interrupção do turno atual |
| `/room` | comando | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` / `room_post` / `room_read` | ferramentas | Barramento de mensagens: lista, publicação (difusão/dirigida), leitura do histórico |
| `room_list_tasks` / `room_create_task` / `room_claim_task` | ferramentas | Quadro de tarefas compartilhado |
| `room_transfer_task` / `room_complete_task` | ferramentas | Transferência (com aprovação) e conclusão |
| Projeção `backgroundAgents` | projeção de sessão | Linhas do painel dobradas a partir do log do pai |
| Projeção `teamRoom` | projeção de sessão | Linha do tempo compartilhada dobrada a partir de eventos `team-room/fact` |
| Painel lateral web | cliente | Status em tempo real, salto, mensagem, parada, prévia do resultado |

## Permissões e dados

- **Permissões**: o manifesto do workshop declara `session:append`, `subagent:spawn` e `tools:register`.
- **Dados**: as salas de equipe vivem no domínio de armazenamento `team_rooms` (SQLite ou JSONL — sem serviços extras); os fatos dos agentes de segundo plano viajam no log de sessão do pai. Sem banco de dados separado, sem rede.
- **Log de sessão**: os eventos `background-agents/fact` e `team-room/fact` são anexados com o marcador de envelope `ignorable: true`; as linhas de progresso e entregas de sala visíveis ao modelo são registros `user/message` reais.

## Limites de segurança

- **Somente costura oficial.** Início, mensagem e parada são adaptadores finos sobre `startContinuable` / `followup` / `interrupt`; parar solicita interrupção e nunca mata processos.
- **`tool_filter` apenas restringe.** Remove ferramentas da visão do filho — nunca concede novas; os nomes são validados contra `allowedChildTools`.
- **Transferências com aprovação.** `room_transfer_task` passa pela costura oficial de aprovação e fecha em falha se nenhum answerer a conceder.
- **Visível ao modelo ⟺ registrado.** Cada mensagem de sala entregue é um `user/message` durável no log do próprio membro; a linha do tempo compartilhada se espelha como eventos `team-room/fact` somente-log.
- **Sem agendamento, sem agentes entre máquinas.** Os filhos são sessões continuáveis locais ao processo do deployment.

## Limitações conhecidas

- As salas de equipe exigem que o domínio de armazenamento seja composto; sem `@deepseek-ai/dsh-storage-domain`, o comando `/room` e as ferramentas `room_*` são desativados (as cinco `bg_*` ainda carregam).
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

## Tópicos

`dsh`, `dsh-plugin`, `deepseek-harness`, `subagent`, `background-agent`, `background-agents`, `agent-dashboard`, `conversation-steering`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`

## Contribuidores

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: o runtime de agentes de segundo plano sobre a costura oficial de subagentes, o hub de salas de equipe, o painel lateral web, as projeções de sessão, a documentação, CI/CD e releases.

## Licença

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors
