# dsh-background-agents

> 为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供可交互的长会话后台 agent。启动一个持久化子 agent，它自己干活、你继续聊天——随时查看进度、发消息干预、请求停止，全程不离开当前会话。

[English](./README.md) · [中文](./README.zh.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [हिन्दी](./README.hi.md)

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-4d6bfe)](https://github.com/topics/dsh-plugin)
[![topic: dsh](https://img.shields.io/badge/topic-dsh-4d6bfe)](https://github.com/topics/dsh)

DSH 内置的后台 *jobs* 是"发后即忘"的工具执行：能读输出、能杀掉，但没法跟它对话。`dsh-background-agents` 把它升级为官 subagent seam 上的**完整后台 agent 会话**——一个可继续（continuable）的子会话，随时可发消息、可干预、可中断；它每完成一轮，就有一条节流过的进度摘要注入父会话，模型和人都看得见。

## 你得到什么

- **`background_agent`** —— 从任意会话启动一个持久化、可继续的子 agent。它在自己的上下文里干活，立即返回稳定 agent id，会话永久可续。
- **`bg_message`** —— 给它派新活、纠偏，或唤醒已结束的 agent。消息走官方 FIFO inbox，agent 的回应就是它的下一轮。
- **`bg_list`** —— 状态总览：label、模式、activity（`running` / `idle` / `ready` / `settled` / `archived`）、消息数、最近活跃时间。重启后能通过官方持久化子代理目录恢复。
- **`bg_stop`** —— 请求中断当前轮。发后即返：收尾交给官方控制面，agent 保持可唤醒。
- **autoReport** —— 每个子轮结束后，向父会话注入一行节流进度（模型可见、来源标记 `{ kind: 'plugin', plugin: 'dsh-background-agents' }`）；最终结果由官方 settled 通知送达。
- **空闲归档** —— 超过 `idleTimeoutMinutes` 无活动的 agent 自动归档并通知；`bg_message` 可以再唤醒它。
- **`backgroundAgents` 投影单元** —— 折叠父会话日志得到仪表盘行（agentId、label、activity、最后消息摘要、创建时间）。一切事实都能从持久化日志重建，无独立数据库。
- **Web UI 面板** —— Web GUI 侧栏新增"后台 agent"入口：实时状态、一键跳到子会话、停止按钮。

## 快速开始

```sh
# 在你的 DSH profile 目录（web 或 headless）
pnpm add dsh-background-agents
```

然后在 profile 的 `cordis.patch.yml` 里加一行（或让 `dsh plugin add dsh-background-agents` 代劳）：

```yaml
- insert:
    - id: background-agents
      name: dsh-background-agents
      config:
        provider: spawn        # 提供可继续子 agent 的 ctx.subagents 提供方
```

插件依赖 subagent 主干（基于 `@deepseek-ai/dsh-base` 的 profile 已内置：`dsh-subagent`、`dsh-subagent-spawn-in-process`、`dsh-session-projection`）。

之后在任意会话里直接说需求即可，或手动调用工具：

```
background_agent "监控仓库的测试失败并随时汇报" (label: test-watch)
bg_list
bg_message <agentId> "现在再查一下快照测试"
bg_stop <agentId>
```

## 配置

所有阈值与节流参数都是经校验的 `Config` 字段——在 `cordis.yml` 改，绝不硬编码。

| 字段 | 默认值 | 含义 |
|---|---|---|
| `provider` | *(必填)* | 启动可继续子 agent 的 `ctx.subagents` 提供方名（`spawn`） |
| `autoReport` | `true` | 每个子轮结束后向父会话注入一行进度 |
| `reportThrottleMs` | `15000` | 同一子 agent 两次进度注入的最小间隔 |
| `reportSummaryMaxChars` | `300` | 注入进度行文本的硬上限（显式省略号截断） |
| `maxBackgroundAgents` | `4` | 每个父会话非归档后台 agent 的硬上限 |
| `idleTimeoutMinutes` | `120` | 空闲窗口：超时后归档并通知 |
| `idleSweepIntervalMs` | `60000` | 归档巡检周期 |
| `maxLabelChars` | `120` | 展示标签上限（省略号截断） |

## 工作原理——以及为什么重启后能恢复

一切启动/消息/停止都走官方 subagent seam：`startContinuable`、`followup`、`interrupt`、`listChildren`——插件不做自己的生命周期路由，不碰别的会话的 `Agent`，不杀进程树（停止 = *请求中断*，收尾归 continuation manager）。

插件也只写 harness **已经持久化**的通道。当前 harness 没有插件会话事件的注册面，所以本插件不发明日志事件，而是落三处已知事件：

- `tool/result` 的 **replay metadata** —— 每次工具调用的注册/消息/停止事实；
- **注入的 `user/message` 通知**，来源 `{ kind: 'plugin', plugin: 'dsh-background-agents' }` —— 节流进度行与归档通知（规范前缀 `[background-agent <id>] …`）；
- 官方的 **`subagent-settled` 通知** —— 子 agent 的持久化"已结束"事实。

`backgroundAgents` 投影单元只折叠这三条已知事件通道，因此仪表盘与 `bg_list` 的事实能在父会话重开后完整重建。当目录本身不可用（缺投影注册表或会话存储）时，`bg_list` 返回显式的 **`unrecoverable`** 标记——绝不伪造空列表。

## 不是这个插件

| 项目 | 做什么 | 边界 |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | 在新 agent 会话中按计划跑编码任务 | 它管任务**何时**跑（定时调度）。本插件管一条长会话的**交互式驾驭**——不做调度、不做 cron。 |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | 后台 *jobs* 的状态条（进度 + 输出 tail） | 它**展示**工具级任务。本插件创建并驾驭 **agent 会话**；面板只是其中一面。 |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | 多 agent 仪表盘 skill | 偏展示。本插件的行是**可操作的**：跳子会话、发消息、停止——全走官方控制面。 |

不在范围内：定时触发（schedule seam 已有）；跨机/远程 agent；改动官方 subagent activation 契约。

## 开发

```sh
pnpm install        # 仅工具链；harness 包通过相邻 checkout 解析
pnpm run typecheck  # strict TS，node + client 双程序
pnpm test           # 48 个单元 + 端到端测试（真实 subagent seam + 脚本化 LLM）
pnpm run build      # lib/index.js（node 半）+ lib/client.js（Web client bundle）
pnpm run gen-aliases  # checkout 移动后重新映射 harness 包路径
```

测试覆盖全路径——启动、列、消息、停止——基于**真实** `SubagentRuntime` + 进程内 spawn 提供方 + 脚本化适配器；另有节流/上限/归档策略、投影折叠、以及经 `session-persistence-jsonl` 的崩溃恢复用例。

## 许可证

Apache License 2.0——见 [LICENSE](./LICENSE)。第三方声明：[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
