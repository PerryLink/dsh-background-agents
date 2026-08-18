<div align="center">

# 👥 dsh-background-agents

**为 DeepSeek Harness 提供可交互的长会话后台代理，以及持久化的多代理团队房间 —— 启动一个持久的子代理，它一边持续工作，你一边继续对话。**

*跨会话操控实时对话并协调一个团队；一切都通过 harness 自身的存储跨重启存活。*

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

## 兼容性

| 方面 | 状态 |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6`（peer 依赖 `>=0.1.0-rc.5 <0.2.0`） |
| Node | `^22.19.0 \|\| >=24.0.0` |
| 平台 | 全部（宿主工具；可选 Web 侧栏面板与团队房间，依赖存储域能力） |
| 模型 | 任意（子代理继承父代理的路由；`childProvider`/`childModel` 可覆盖） |

## 你能获得什么

`dsh-background-agents` 把 DSH 即发即弃的后台 *作业* 升级为两个协同的界面：

1. **五个操控工具** —— `background_agent` 在官方子代理接缝上启动一个持久的、可续聊的子代理（可选 `tool_filter` —— 只移除工具、绝不授予新工具；`persona`；`max_depth`；`childProvider`/`childModel` 路由）。`bg_message` 投递后续轮次；`bg_list` 报告状态（或用 `parentId`/`depth` 报告后代树）；`bg_result` 读取最新的结果文本（回退到推理内容时标记 `textSource: 'reasoning'`）；`bg_stop` 请求中断。
2. **进度与归档** —— `autoReport` 在每个子代理轮次之后注入一条节流的进度行；`reportDelivery: wakeup` 会在父会话空闲时启动一个父轮次。空闲清扫会把安静的代理归档，`bg_message` 再把它们唤醒（`autoArchive: false` 则改为让安静的监视者暂停驻留）。
3. **仪表盘投影 + Web 面板** —— `backgroundAgents` 会话投影把父日志折叠成行；侧栏面板显示实时状态、跳转、消息、停止与结果预览。一切都从持久日志重建 —— 无需独立数据库。
4. **团队房间（v0.5.0+）** —— `/room` 命令族加上八个 `room_*` 工具构建持久化的多代理房间：成员（各自是一个独立会话）、消息总线（定向/广播）、共享任务板与共享时间线 —— 存储在 `team_rooms` 存储域（SQLite 或 JSONL），并在 DSH 重启后恢复。跨成员的任务交接通过官方审批接缝进行路由。

## 快速开始

```sh
# 1. 将 bundle 安装到你的 profile
dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"

# 或从 npm 安装（已发布版本）
dsh plugin --profile web add dsh-background-agents

# 2. 重启并验证该行
dsh --profile web --dump-config | grep -A4 'id: background-agents'
```

bundle 补丁携带插件行；`provider` 为必填。该仓库提交了它的构建产物（`lib/`），因此 git 安装无需构建步骤。该插件需要子代理脊柱已挂载（任何基于 `@deepseek-ai/dsh-base` 构建的 profile 都具备）。团队房间在存储域被组合的地方挂载（`@deepseek-ai/dsh-storage-domain`）；五个 `bg_*` 工具没有它也能工作。

然后，在任意会话中，直接让模型去做 —— 或者直接调用这些工具：

```
background_agent "watch the repo for test failures and keep me posted" (label: test-watch)
bg_list
bg_message <agentId> "also check the snapshot tests now"
bg_stop <agentId>
```

## 安装与卸载

- **git 渠道**（最新 `main`）：`dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"` —— 已提交 `lib/`，无需 `prepare` 或 `allowBuilds` 步骤。
- **npm 渠道**（已发布版本）：`dsh plugin --profile web add dsh-background-agents`。
- **tarball 渠道**：在本仓库执行 `pnpm pack`，然后 `dsh plugin --profile web add ./dsh-background-agents-<version>.tgz`。
- **卸载**：`dsh plugin --profile web remove dsh-background-agents`（或从 profile 补丁中删除该行）。

## 配置

每个可调项都是经过校验的 Schemastery `Config` 字段 —— 在 cordis.yml 中修改，绝不在代码中修改。仅 `provider` 为必填。

| 键 | 默认值 | 含义 |
|---|---|---|
| `provider` | *(必填)* | 用于可续聊启动（`spawn`）的 `ctx.subagents` provider 名称 |
| `autoReport` | `true` | 每个子代理轮次后在父会话中注入一条进度行 |
| `reportDelivery` | `quiet` | `quiet` 将该行追加到下一次模型请求；`wakeup` 在父会话空闲时启动一个父轮次 |
| `reportThrottleMs` | `15000` | 同一子代理两次进度注入之间的最小间隔 |
| `reportSummaryMaxChars` | `300` | 注入进度行文本的硬上限（以省略号截断） |
| `resultMaxChars` | `4000` | `bg_result` 文本的硬上限（以省略号截断，标记 `truncated`） |
| `maxBackgroundAgents` | `4` | 每个父会话未归档后台代理的硬上限 |
| `autoArchive` | `true` | 空闲归档开关；为 `false` 时清扫器绝不归档安静的代理 |
| `idleTimeoutMinutes` | `120` | 安静的代理被归档前的空闲窗口（`>= 1`） |
| `idleSweepIntervalMs` | `60000` | 归档清扫周期 |
| `maxLabelChars` | `120` | 显示标签上限（以省略号截断） |
| `childProvider` | *(继承)* | 子代理模型请求的 provider 路由 |
| `childModel` | *(继承)* | 子代理模型请求的模型 id |
| `maxChildDepth` | *(无)* | 某次启动的 `max_depth` 参数的配置上限 |
| `allowedChildTools` | *(无)* | `tool_filter` 名称的允许列表；为空/缺失 = 无限制 |
| `maxRooms` | `16` | 整个 profile 内团队房间的硬上限 |
| `maxMembersPerRoom` | `8` | 每个房间成员的硬上限 |
| `maxRoomsPerMember` | `4` | 一个成员会话可加入的房间数上限 |
| `busRetention` | `200` | 每个房间保留的总线消息数 |
| `timelineRetention` | `500` | 每个房间保留的时间线事件数 |
| `taskRetention` | `50` | 每个房间保留的已完成任务数 |
| `maxMessageChars` | `4000` | 单条房间消息文本的硬上限（超限直接拒绝，绝不截断） |
| `injectRoomBrief` | `true` | 向成员会话注入简短房间简介（加入 + 恢复时） |
| `roomOpenTimeoutMs` | `15000` | `team_rooms` 存储域打开的最长等待时间；超时后所有房间操作以 `store-unavailable` 明确失败，而不是永久挂起 |
| `allowUnmarkedFacts` | `false` | 强制在丢弃 `ignorable` 标记的宿主上写入事实事件（危险：未标记事件会让会话在其他宿主上无法恢复）；默认自动探测并跳过 |

## 工具与界面

| 界面 | 类型 | 说明 |
|---|---|---|
| `background_agent` | 工具 | 启动一个持久的、可续聊的子代理（label、`tool_filter`、`persona`、`max_depth`） |
| `bg_message` | 工具 | 按 agent id 向子代理投递后续轮次 |
| `bg_list` | 工具 | 你的代理的状态（或用 `recursive: true` 查看后代树） |
| `bg_result` | 工具 | 读取子代理最新的助手输出文本 |
| `bg_stop` | 工具 | 请求中断当前轮次 |
| `/room` | 命令 | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` / `room_post` / `room_read` | 工具 | 消息总线：名册、发帖（广播/定向）、读取历史 |
| `room_list_tasks` / `room_create_task` / `room_claim_task` | 工具 | 共享任务板 |
| `room_transfer_task` / `room_complete_task` | 工具 | 交接（审批门控）与完成 |
| `backgroundAgents` 投影 | 会话投影 | 由父日志折叠出的仪表盘行 |
| `teamRoom` 投影 | 会话投影 | 由 `team-room/fact` 事件折叠出的共享时间线 |
| Web 侧栏面板 | 客户端 | 实时状态、跳转、消息、停止、结果预览 |

## 工作原理 —— 以及它为何能在重启后存活

一切都运行在官方子代理接缝之上：`startContinuable`、`followup`、`interrupt`、`listChildren` —— 该插件不执行任何自己的生命周期路由，从不接触另一个会话的 `Agent`，也从不杀死进程树（停止 = *请求中断*，清理工作属于延续管理器）。

该插件通过**一个结构化通道和一个模型可见通道**写入每一个事实：

- **`background-agents/fact` 结构化事实事件** —— 即注册 / 消息 / 停止 / 进度 / 已归档等事实，以仅日志记录的形式追加到父日志，并带上信封的 `ignorable: true` 标记；不认识该类型的读取器会跳过这些记录，而不是拒绝读取日志。`Session.append` 早于该标记的宿主（迄今发布的所有 rc 版本，至 `0.1.0-rc.7` —— 任何发布版都还未盖标记，未标记会话在更严格的构建上无法恢复）会在首次追加前被探测出来（peer 版本预检 + 返回信封探测），事实追加被跳过并发出一次性警告 —— 持久存储、通知与工具照常工作，投影降级为空事实折叠。
- **`tool/result` 回放元数据** —— 在结构化通道出现之前写入日志的相同事实（仅当某行没有结构化来源时才折叠）。
- **注入的 `user/message` 通知**（模型可见），来源为 `{ kind: 'plugin', plugin: 'dsh-background-agents' }` —— 即节流的进度行与归档通知（规范前缀 `[background-agent <id>] …`）。
- **官方的 `subagent-settled` 通知** —— 子代理持久化的 "settled"（已结束）事实。
- 团队房间遵循同样的纪律：每一条投递的房间消息都是成员自身日志中持久化的 `user/message`，共享时间线则以仅日志的 `team-room/fact` 事件镜像到 `team_rooms` 存储域。

`backgroundAgents` 投影折叠结构化通道并保留旧有的折叠结果；仪表盘值与 `bg_list` 事实在每次重新打开时重建，无需解析人类可读的通知文本。当目录本身不可用时，`bg_list` 会返回一个明确的 **`unrecoverable`** 标记 —— 它绝不凭空捏造一个空列表。

## 与内置子代理工具的关系

harness 核心自带它自己的子代理工具（`subagent`、`send_message`、`interrupt_agent`，以及子端的 `report` 工具）。本插件的 `bg_*` 工具是它们的**会话级同伴**；两者可以一起挂载：

| 内置工具 | 本插件 | 差异 |
|---|---|---|
| `subagent` (`backgroundMode: 'continuable'`) | `background_agent` | 相同的 `startContinuable` 接缝；本插件额外提供每个子代理的 tool_filter/persona/max_depth 校验以及每会话上限 |
| `send_message` | `bg_message` | 相同的投递语义；`bg_message` 面向本会话的后台代理，并维护投影事实 |
| `interrupt_agent` | `bg_stop` | 相同的中断语义；`bg_stop` 还会记录一条结构化的停止事实 |
| 子端 `report` 工具 | autoReport | 内置工具由子模型自己调用；本插件在**每个子代理轮次之后自动**注入节流的进度 |

核心工具缺少的是：`bg_list`、`bg_result`、空闲归档，以及按父会话折叠的面板投影。

不在范围内：定时触发（调度接缝已存在）、跨机器/远程代理，以及对官方子代理激活契约的任何改动。

## 这不是本插件

| 项目 | 它的作用 | 边界 |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | 在新代理会话中定时执行编码任务 | 它负责任务**何时**运行（调度）。本插件负责对单个长会话的**交互式操控** —— 没有调度接缝，没有 cron。 |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | 后台 *作业* 的状态栏（进度 + 输出尾部） | 它**显示**工具级的作业。本插件创建并操控**代理会话**；它的仪表盘只是其中的一个面板，而非产品本身。 |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | 多代理仪表盘技能 | 面向展示。本插件的行是**可操作的**：跳转进子会话、发送消息、停止 —— 全都通过官方控制平面。 |

## 权限与数据

- **权限**：workshop 清单声明 `session:append`、`subagent:spawn` 与 `tools:register`。
- **数据**：团队房间位于 `team_rooms` 存储域（SQLite 或 JSONL —— 零额外服务）；后台代理事实随父会话日志。无独立数据库，无网络。
- **会话日志**：`background-agents/fact` 与 `team-room/fact` 事件在支持标记的宿主上以信封的 `ignorable: true` 标记追加（早于该标记的宿主会被探测出来，事实追加被跳过 —— 见 `allowUnmarkedFacts`）；模型可见的进度行与房间投递是真实的 `user/message` 记录。

## 安全边界

- **仅使用官方接缝。** 启动、消息与停止都是对 `startContinuable` / `followup` / `interrupt` 的薄封装；停止是请求中断，绝不杀死进程。
- **`tool_filter` 只会限制。** 它从子代理的视野中移除工具 —— 绝不授予新工具；名称会按 `allowedChildTools` 进行校验。
- **审批门控的交接。** `room_transfer_task` 通过官方审批接缝路由，当没有 answerer 授权时以失败关闭。
- **模型可见 ⟺ 已落盘。** 每一条投递的房间消息都是成员自身日志中持久化的 `user/message`；共享时间线以仅日志的 `team-room/fact` 事件镜像。
- **无调度，无跨机器代理。** 子代理是该部署的进程内可续聊会话。

## 已知限制

- 团队房间需要存储域被组合；没有 `@deepseek-ai/dsh-storage-domain` 时，`/room` 命令与 `room_*` 工具会被禁用（五个 `bg_*` 工具仍可加载）。
- `provider` 必须指定一个具备可续聊能力的 provider（`prepareContinuable`）；缺失的 provider 会让 `background_agent` 一直失败，直到它出现。
- `maxBackgroundAgents` 是会话**每一个**可续聊直接子代理共享的预算，包括由内置 `subagent` 工具启动的那些。
- 一次性子代理绝不会被列出或接收消息 —— `bg_list` 只保留可续聊的行。
- 子代理是进程内的：调度接缝负责「何时」，本插件负责操控一场活跃的对话。

## 开发

```sh
pnpm install        # 仅工具链；harness 包针对同级 checkout 解析
pnpm run typecheck  # 严格 TS，node + client 程序
pnpm test           # vitest：单元 + 端到端测试（真实子代理接缝、脚本化 LLM、jsdom 面板）
pnpm run build      # lib/index.js（node 半侧）+ lib/client.js（web 客户端 bundle）
pnpm run gen-aliases  # checkout 移动后重新映射 harness 包路径
```

一个无需密钥的端到端演示通过确定性的脚本化 LLM 驱动一个真实的父会话和一个后台子代理（无需 API key；`dev/` 已被 gitignore —— 请根据你的 checkout 调整路径）：

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "【父会话】驱动后台 agent 演示"
```

## 主题

`dsh`, `dsh-plugin`, `deepseek-harness`, `subagent`, `background-agent`, `background-agents`, `agent-dashboard`, `conversation-steering`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`

## 贡献者

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：官方子代理接缝上的后台代理运行时、团队房间枢纽、Web UI 侧栏面板、会话投影、文档、CI/CD 与发布。

## PerryLink DSH 插件家族

本项目是由 [PerryLink](https://github.com/PerryLink) 维护的 DeepSeek Harness 插件之一。如果这个对你有帮助，其他的很可能也会：

| 插件 | 一句话简介 |
|---|---|
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | 只读 MCP 运行时面板：/mcp 命令 + 带状态、工具与错误的设置标签页 |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | 工程纪律守卫：需求盘问、测试关卡、对抗性审查 |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 持久的后台子代理，带 Web UI 侧栏、消息传递与中断 |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | 通过语言服务器提供 LSP 诊断、格式化、补全、代码操作与重命名 |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Claude Code outputStyles 等价的运行时样式切换 |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Claude Code /rewind 等价功能：快照、会话分叉、一次性恢复 |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code 风格的声明式 allow/deny/ask 权限规则，带审计 |
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | 在审批链上的第二模型自动审查，默认失败关闭 |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | 审批门控的跨会话记忆：ctx.memory 接缝 + SQLite + memory 工具 |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | 安全审计技能包：密钥扫描、依赖与供应链审查 |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | 在 Web 侧栏中固定会话，带持久化排序 |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Web 编写器的终端风格输入历史：方向键、Ctrl+R 搜索 |
| [dsh-github](https://github.com/PerryLink/dsh-github) | DSH 的 GitHub PR/issue 集成，每次写入都由审批门控 |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | 作为按需代理技能的插件开发知识库 |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | 将 Claude Code 会话、记忆、技能与 CLAUDE.md 迁移到 DSH |

## 许可证

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors
