<div align="center">

# 👥 dsh-background-agents

**为 DeepSeek Harness 提供可交互的长会话后台代理，以及持久化的多代理团队房间 —— 启动一个持久的子代理，它一边工作，你一边继续对话。**

*在会话之间操控活跃对话、协调一个团队；一切都通过 Harness 自身的存储跨重启存活。*

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
| 模型 | 任意（子代理默认继承父代理路由；`childProvider`/`childModel` 可覆盖） |

## 你能获得什么

`dsh-background-agents` 把 DSH 即发即弃的后台 *任务* 升级为两个协作面：

1. **五个操控工具** —— `background_agent` 在官方子代理接缝上启动一个持久的、可续聊的子代理（可选 `tool_filter`、`persona`、`max_depth`、模型路由）；`bg_message` 投递后续轮次；`bg_list` 报告状态（或后代树）；`bg_result` 读取最新结果文本；`bg_stop` 请求中断。
2. **进度与归档** —— `autoReport` 在每个子代理轮次后注入一条节流的进度行；空闲清扫会把安静的代理归档，`bg_message` 再把它们唤醒。
3. **仪表盘投影 + Web 面板** —— `backgroundAgents` 会话投影把父日志折叠成行；侧栏面板显示实时状态、跳转、消息、停止与结果预览。
4. **团队房间（v0.5.0+）** —— `/room` 命令族加八个 `room_*` 工具构建持久化多代理房间：成员（各自是独立会话）、消息总线（定向/广播）、共享任务板与共享时间线 —— 存储在 `team_rooms` 存储域（SQLite 或 JSONL），跨 DSH 重启恢复。跨成员任务交接走官方审批接缝。

## 快速开始

```sh
# 1. 将 bundle 安装到你的 profile
dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"

# 或从 npm 安装（已发布版本）
dsh plugin --profile web add dsh-background-agents

# 2. 重启并验证该行
dsh --profile web --dump-config | grep -A4 'id: background-agents'
```

bundle 补丁携带插件行；`provider` 为必填。该仓库提交了构建产物（`lib/`），所以 git 安装无需构建步骤。团队房间在存储域（`@deepseek-ai/dsh-storage-domain`）被组合的地方挂载；五个 `bg_*` 工具没有它也照常工作。

## 安装与卸载

- **git 渠道**（最新 `main`）：`dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"` —— 已提交 `lib/`，无需 `prepare` 或 `allowBuilds`。
- **npm 渠道**（已发布版本）：`dsh plugin --profile web add dsh-background-agents`。
- **tarball 渠道**：在本仓库执行 `pnpm pack`，然后 `dsh plugin --profile web add ./dsh-background-agents-<version>.tgz`。
- **卸载**：`dsh plugin --profile web remove dsh-background-agents`（或从 profile 补丁中删除该行）。

## 配置

每个可调项都是经过校验的 Schemastery `Config` 字段 —— 在 cordis.yml 中修改，绝不在代码里写死。仅 `provider` 为必填。

| 键 | 默认值 | 含义 |
|---|---|---|
| `provider` | *(必填)* | 用于可续聊启动的 `ctx.subagents` provider 名称（`spawn`） |
| `autoReport` | `true` | 每个子代理轮次后在父会话中注入一条进度行 |
| `reportDelivery` | `quiet` | `quiet` 把该行追加到下一次模型请求；`wakeup` 在父会话空闲时启动父轮次 |
| `reportThrottleMs` | `15000` | 同一子代理两次进度注入之间的最小间隔 |
| `reportSummaryMaxChars` | `300` | 注入进度行文本的硬上限（截断省略） |
| `resultMaxChars` | `4000` | `bg_result` 文本的硬上限（截断省略，标记 `truncated`） |
| `maxBackgroundAgents` | `4` | 每个父会话未归档后台代理的硬上限 |
| `autoArchive` | `true` | 空闲归档开关；为 `false` 时清扫器绝不归档安静的代理 |
| `idleTimeoutMinutes` | `120` | 安静的代理被归档前的空闲窗口（`>= 1`） |
| `idleSweepIntervalMs` | `60000` | 归档清扫周期 |
| `maxLabelChars` | `120` | 显示标签上限（截断省略） |
| `childProvider` | *(继承)* | 子代理模型请求的 provider 路由 |
| `childModel` | *(继承)* | 子代理模型请求的模型 id |
| `maxChildDepth` | *(无)* | 启动时 `max_depth` 参数的配置上限 |
| `allowedChildTools` | *(无)* | `tool_filter` 名称的允许列表；空/缺失 = 无限制 |
| `maxRooms` | `16` | 整个 profile 内团队房间的硬上限 |
| `maxMembersPerRoom` | `8` | 每个房间成员的硬上限 |
| `maxRoomsPerMember` | `4` | 一个成员会话可加入的房间数上限 |
| `busRetention` | `200` | 每个房间保留的消息总线条数 |
| `timelineRetention` | `500` | 每个房间保留的时间线事件条数 |
| `taskRetention` | `50` | 每个房间保留的已完成任务条数 |
| `maxMessageChars` | `4000` | 单条房间消息文本的硬上限（超限拒绝，绝不截断） |
| `injectRoomBrief` | `true` | 向成员会话注入简短房间简介（加入 + 恢复） |

## 工具与界面

| 界面 | 类型 | 说明 |
|---|---|---|
| `background_agent` | 工具 | 启动持久的可续聊子代理（label、`tool_filter`、`persona`、`max_depth`） |
| `bg_message` | 工具 | 按 agent id 向子代理投递后续轮次 |
| `bg_list` | 工具 | 你的代理状态（或 `recursive: true` 的后代树） |
| `bg_result` | 工具 | 读取子代理最新的助手输出文本 |
| `bg_stop` | 工具 | 请求中断当前轮次 |
| `/room` | 命令 | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` / `room_post` / `room_read` | 工具 | 消息总线：名单、发帖（广播/定向）、读取历史 |
| `room_list_tasks` / `room_create_task` / `room_claim_task` | 工具 | 共享任务板 |
| `room_transfer_task` / `room_complete_task` | 工具 | 交接（审批门控）与完成 |
| `backgroundAgents` 投影 | 会话投影 | 由父日志折叠出的仪表盘行 |
| `teamRoom` 投影 | 会话投影 | 由 `team-room/fact` 事件折叠出的共享时间线 |
| Web 侧栏面板 | 客户端 | 实时状态、跳转、消息、停止、结果预览 |

## 权限与数据

- **权限**：workshop 清单声明 `session:append`、`subagent:spawn` 与 `tools:register`。
- **数据**：团队房间位于 `team_rooms` 存储域（SQLite 或 JSONL —— 无需额外服务）；后台代理事实随父会话日志。无独立数据库、无网络。
- **会话日志**：`background-agents/fact` 与 `team-room/fact` 事件以信封 `ignorable: true` 标记追加；模型可见的进度行与房间投递是真实的 `user/message` 记录。

## 安全边界

- **只用官方接缝。** 启动、消息、停止是对 `startContinuable` / `followup` / `interrupt` 的薄封装；停止是请求中断，绝不杀进程。
- **`tool_filter` 只能收窄。** 它从子代理视野中移除工具 —— 绝不授予新工具；名称会按 `allowedChildTools` 校验。
- **审批门控交接。** `room_transfer_task` 走官方审批接缝，没有 answerer 授权时失败关闭。
- **模型可见 ⟺ 落盘。** 每条投递的房间消息都是成员自身日志中持久的 `user/message`；共享时间线镜像为仅日志的 `team-room/fact` 事件。
- **无调度、无跨机代理。** 子代理是本次部署的进程内可续聊会话。

## 已知限制

- 团队房间需要组合存储域；没有 `@deepseek-ai/dsh-storage-domain` 时，`/room` 命令与 `room_*` 工具被禁用（五个 `bg_*` 工具仍可加载）。
- `provider` 必须指向支持可续聊的 provider（`prepareContinuable`）；缺失的 provider 会让 `background_agent` 一直失败，直到它出现。
- `maxBackgroundAgents` 是会话所有可续聊直接子代理共享的预算，包括内置 `subagent` 工具启动的那些。
- 一次性子代理绝不会被列出或发消息 —— `bg_list` 只保留可续聊行。
- 子代理是进程内的：调度接缝负责「何时」，本插件负责操控一次活跃对话。

## 开发

```sh
pnpm install        # 仅工具链；harness 包针对同级 checkout 解析
pnpm run typecheck  # 严格 TS，node + client 程序
pnpm test           # vitest：单元 + 端到端测试（真实子代理接缝、脚本化 LLM、jsdom 面板）
pnpm run build      # lib/index.js（node 半侧）+ lib/client.js（web 客户端包）
pnpm run gen-aliases  # checkout 移动后重新映射 harness 包路径
```

## 主题

`dsh`、`dsh-plugin`、`deepseek-harness`、`subagent`、`background-agent`、`background-agents`、`agent-dashboard`、`conversation-steering`、`team-rooms`、`multi-agent`、`message-bus`、`task-board`、`collaboration`

## 贡献者

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：官方子代理接缝上的后台代理运行时、团队房间枢纽、Web 侧栏面板、会话投影、文档、CI/CD 与发布。

## 许可证

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors
