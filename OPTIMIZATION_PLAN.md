# dsh-background-agents 优化提升方案

> 基于 2026-08 对仓库源码、测试、构建配置、README 与 harness 本体接缝（`packages/subagent/subagent/src/*`、`packages/core/{tools,agent}`、`packages/client/*`）的逐项核实。
> 每条优化都标注：证据 → 具体改法 → 验收 → 风险 → 工作量（S≤半天 / M 1-2 天 / L 2-4 天）→ 优先级（P0 发布修复 / P1 能力 / P2 工程深化+打磨）。
> 状态：本方案仅存档，尚未执行。

## 0. 验证基线（2026-08-14 实测）

| 项 | 结果 |
|---|---|
| `pnpm run typecheck` | ✅ 通过（node + client 双程序） |
| `pnpm test` | ✅ 48/48 通过（1.72s） |
| git 状态 | ✅ 干净，单提交 `5f09009` 已推送 |
| `lib/` 入库 | ✅ 已提交（git 安装免构建） |
| npm 发布 | ❌ 404 未发布（README 却写 `pnpm add`） |
| harness 开发基准 | checkout `8c690c7cf885`（dsh-* 均为 `0.1.0-rc.5`，cordis `4.0.1`，schemastery `3.18.1`） |
| `repository`/`homepage`/`bugs` 字段 | ❌ 缺失 |
| CI / lint / 覆盖率 | ❌ 无 |

**已核实的 seam 事实（本方案的设计依据）：**

1. `ContinuableStartSpec.request` 支持 `prompt/parent/agentOptions/maxDepth/toolFilter/persona`，continuable 路径**真实生效**：`maxDepth` 校验于 `continuation.ts` L408-410；`agentOptions.provider/model` 快照进持久化 descriptor（L413-422）；`persona`/`toolFilter` 在子 agent 创建窗口应用（L445、`child-agent.ts` L171-174），冷恢复时从 descriptor 重放（L919-923）。
2. `ToolRestriction = { allow?: string[], deny?: string[] }`，descriptor 校验要求 allow/deny **至少声明一个**；未知名在 restrict 时响亮报错（`packages/core/tools/src/index.ts` L680-685）。
3. `AgentOptions = { provider?, model?, maxTokens? }`；其中 **`maxTokens` 不持久化**（descriptor 只存 provider/model）——冷恢复会丢，方案不暴露它。
4. `SubagentRuntime` 提供 `listDescendants(rootSessionId, signal)`（`index.ts` L358），返回带 `parentId`/`depth` 的条目。
5. `Agent.followup(userMessage)` 官方语义：idle 时立刻开回合，busy 时入 FIFO inbox（`interrupt` 文档：waking send resumes the parked queue）——`reportDelivery: wakeup` 的投递通道。
6. Web 面板现有 wire RPC：`subagent.list` / `subagent.history` / **`subagent.prompt`** / `subagent.interrupt`（`packages/client/connection/src/client/fixture.ts` L2510-2523）；`subagent.prompt` 负载形状见 `packages/client/runtime/tests/session.client.spec.ts` L464-469：`{ parentSessionId, childSessionId, mode:'continuable', content, clientTimeZone }`——**面板加"发消息"按钮的官方通道**。
7. Schemastery `natural()` = `number().step(1).min(0)`，可继续链 `.min(1)`（`vendor/schemastery/src/index.ts` L529）。
8. 客户端 session-list 快照携带 `projectionValues`，投影值变化会触发 store 重发快照（`packages/client/runtime/src/client/sessions/manager.ts` L1026-1050）——面板数据新鲜度由宿主保障。

---

## 1. 总路线图

| 版本 | 内容 | 目标 |
|---|---|---|
| **v0.1.1（P0，发布修复）** | 工程 #1/#2/#4/#5/#7 + 打磨 #1/#5 + peer 消费冒烟脚本 | 让"照 README 安装"真的能装上、跑起来 |
| **v0.2.0（P1，能力）** | 产品 #1（透传 toolFilter/persona/max_depth + childModel/childProvider）、#2（bg_result）、#3（reportDelivery）、#4（bg_list recursive）、#5（面板发消息） | 把官方接缝吃满，产品能力上一个台阶 |
| **v0.3.0（P2，工程+打磨）** | 工程 #3（CI）、#6（cap 竞态）、#8（jsdom）、#9（发布脚本）；打磨 #2/#3/#4 | 交付质量可被守护 |

---

## 2. P0 详细方案（v0.1.1）

### E-1 发布通道与包元数据 【S，最高优先】

- **证据**：npm 404；README 五语言 quick start 均写 `pnpm add dsh-background-agents`（装不上）。
- **改法**：
  1. `package.json` 增加：
     ```json
     "repository": { "type": "git", "url": "https://github.com/PerryLink/dsh-background-agents.git" },
     "homepage": "https://github.com/PerryLink/dsh-background-agents#readme",
     "bugs": { "url": "https://github.com/PerryLink/dsh-background-agents/issues" }
     ```
  2. 五个 README（`README.md` / `.zh` / `.es` / `.pt` / `.hi`）quick start 改为已验证可行的 git 安装：
     ```sh
     dsh plugin --profile <name> add "github:PerryLink/dsh-background-agents#5f09009"
     ```
     （`lib/` 已入库 → 免构建、免 allowBuilds；pin commit 是安全习惯）并注明"npm 发布后可用 `pnpm add`"。
  3. `cordis.patch.yml` 的注释里补一句安装命令。
- **验收**：干净 profile 按 README 命令装完，`dsh --profile <name> --dump-config` 出现 `background-agents` 行，`--help` 无 FAILED。
- **风险**：无。**待确认决策**：是否发布 npm（需要 npm 账号/token；本会话只有 GitHub token）。

### E-2 运行时 peerDependencies 契约 【S】

- **证据**：`peerDependencies` 仅 `@deepseek-ai/cordis`；运行时值导入还有 `schemastery`、`dsh-tools`、`dsh-llm`、`dsh-session`、`dsh-subagent`（`src/index.ts`/`tools.ts`/`lifecycle.ts`），全靠宿主 profile 的 pnpm 闭包解析。
- **改法**：`package.json`：
  ```json
  "peerDependencies": {
    "@deepseek-ai/cordis": "^4.0.1",
    "@deepseek-ai/schemastery": ">=3.18.1",
    "@deepseek-ai/dsh-tools": ">=0.1.0-rc.5 <0.2.0",
    "@deepseek-ai/dsh-llm": ">=0.1.0-rc.5 <0.2.0",
    "@deepseek-ai/dsh-session": ">=0.1.0-rc.5 <0.2.0",
    "@deepseek-ai/dsh-subagent": ">=0.1.0-rc.5 <0.2.0"
  }
  ```
  （client 半的 `dsh-client-*`/react 由 shell 冻结模块表提供，已在 `dsh.client.inject` 声明，不动。）
- **验收**：新增 `scripts/pack-smoke.mjs`（见 E-9 雏形，P0 先做"装入 profile + dump-config"部分）：`pnpm pack` → 干净 profile `dsh.plugin add ./tgz` → dump-config 有行且无 peer 告警。
- **风险**：低。插件自身 dev 工作区 `pnpm install` 会从 npm 自动补装这些 peer（rc.6 副本），但 tsconfig/vitest alias 仍指向兄弟 checkout，不产生身份分裂——若想避免，可为每个 peer 配 `peerDependenciesMeta: { optional: true }`（**决策点**）。

### E-3 默认值单源 【S】

- **证据**：`src/index.ts` L75-84 手工 `??` 与 Schemastery `.default()` 双份（L55-64），漂移风险。
- **改法**：
  ```ts
  export const DEFAULTS = {
    autoReport: true, reportThrottleMs: 15_000, reportSummaryMaxChars: 300,
    maxBackgroundAgents: 4, idleTimeoutMinutes: 120, idleSweepIntervalMs: 60_000, maxLabelChars: 120,
  } as const
  export const Config: Schema<Config> = Schema.object({
    provider: Schema.string().required(),
    autoReport: Schema.boolean().default(DEFAULTS.autoReport),
    ...
  })
  // apply(): const policy: Required<Config> = { provider: config.provider, ...DEFAULTS, ...config }
  ```
- **验收**：现有 48 测试全绿；新增一条"direct apply 与 schema 默认值一致"断言（可选，`DEFAULTS` 展开即结构保证）。
- **风险**：无。

### E-4 构建产物一致性门 【S，随 CI 落地】

- **证据**：`lib/` 入库是 git 安装免构建的前提，但没有任何东西防止"改了 src 忘了 build"。
- **改法**（二选一，**决策点**）：
  - **A（推荐，保持现状）**：CI 加一步 `pnpm run build && git diff --exit-code lib/`，构建漂移即红。
  - B（转官方 prepare 方案）：写自包含 `scripts/prepare.mjs`（专用 tsdown 转译，参考 omdsh-dev/plugin-template），删除入库的 `lib/`，README 要求用户 `allowBuilds`。**不推荐**：给安装增加信任成本，且当前免构建 git 安装是卖点。
- **验收**：CI 红绿符合预期。
- **风险**：低。

### E-5 配置校验补洞 【S】

- **证据**：`idleTimeoutMinutes: 0` 被接受，语义变成"任何非运行态子 agent 下轮 sweep 立即归档"，未声明也未测。
- **改法**：`Schema.natural().min(1).default(120)`（`natural()` 已 `min(0)`，可继续链）；README 配置表补 `≥1` 说明；`tools.spec` 或新 `config.spec` 验证 0 被拒。
- **验收**：新增测试：`{ idleTimeoutMinutes: 0 }` 加载期响亮失败。
- **风险**：无。

### P-1 README 可复现性补全 【S】

- **改法**：README Development 节补无 key 演示命令（现只藏在 `dev/cordis.yml` 注释里）：
  ```powershell
  $env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
  pnpm dsh --profile headless --patch dev/cordis.yml "【父会话】驱动后台 agent 演示"
  ```
  并注明 `dev/` 不入库。
- **验收**：按文档可复现 `dev/demo-run.log` 同款输出。
- **风险**：无。

---

## 3. P1 详细方案（v0.2.0）

### P-1 透传 start-time 能力（toolFilter / persona / max_depth / childModel / childProvider）【M，最高价值】

- **证据**：见基线事实 1-3。continuable 路径已全量生效并持久化（仅 `maxTokens` 例外）。
- **改法**：
  1. `src/index.ts` Config 新增：
     - `childModel?: string`、`childProvider?: string`（默认继承父 agent；config 级，不做 per-call 覆盖——**首版只做 config 级**，降低模型可滥用面）；
     - `maxChildDepth?: number`（config 天花板，`Schema.natural().default(undefined)`）；
     - `allowedChildTools?: string[]`（可选白名单：为空 = 不限制 tool_filter 可点名的工具）。
  2. `src/tools.ts` `background_agent` 参数新增：
     ```ts
     tool_filter: { type: 'object', properties: {
       allow: { type: 'array', items: { type: 'string' } },
       deny:  { type: 'array', items: { type: 'string' } },
     } },
     persona: { type: 'string' },
     max_depth: { type: 'number' },
     ```
     execute 内校验：`tool_filter` 至少声明 allow 或 deny（对齐 descriptor 校验）；`max_depth` 为非负安全整数且 ≤ config 天花板；`allowedChildTools` 存在时校验点名工具 ∈ 白名单 ∪（`ctx.tools.schemas()` 全局可见集）；`agentOptions` 按 config 组装（`childProvider`/`childModel` 任一存在才传）。
  3. `startContinuable` 调用：
     ```ts
     request: {
       prompt: [...], parent,
       ...(toolFilter !== undefined ? { toolFilter } : {}),
       ...(persona !== undefined ? { persona } : {}),
       ...(maxDepth !== undefined ? { maxDepth } : {}),
       ...(childAgentOptions !== undefined ? { agentOptions: childAgentOptions } : {}),
     }
     ```
  4. 工具 description 与五语言 README 同步（模型可见文本即行为）。
- **验收**（新增 tools.spec 用例）：
  - `tool_filter` 缺 allow/deny → isError；
  - 点名 `allowedChildTools` 之外 → isError 且报出白名单；
  - `max_depth` 超过天花板 → isError；
  - spy `ctx.subagents.startContinuable`：收到完整 request（toolFilter/persona/maxDepth/agentOptions 均透传）；
  - config `childModel` 生效：descriptor 里出现 `agentProvider/agentModel`（集成测试可断言子 session 首条 descriptor 事件）。
- **风险**：低。权限面不变（startContinuable 是官方鉴权）；`allowedChildTools` 是纯收紧。

### P-2 `bg_result` 结果回取工具（第五个工具）【S】

- **证据**：`finalAssistantOutput` 已在本仓库使用（`lifecycle.ts` L141）；settled 通知只有摘要，模型无法拿全文。
- **改法**：新工具 `bg_result(agent_id)` → `{ agentId, activity, text }`（`text` = 子会话最后一条非空 assistant 消息文本；`activity` 复用 `activityOf`）。只读，无新持久化事实；未知 id 报错。
- **验收**：tools.spec：settle 后 `bg_result` 返回最后文本；未知 id isError。
- **风险**：无。

### P-3 `reportDelivery: 'quiet' | 'wakeup'` 投递策略【M】

- **证据**：基线事实 5（`Agent.followup` 语义）；当前 `reportProgress` 永远 `parent.inject`（`lifecycle.ts` L179）。
- **改法**：
  1. Config 新增 `reportDelivery: Schema.union(['quiet','wakeup']).default('quiet')`；`LifecycleConfig` 同步。
  2. `reportProgress`：`wakeup` 时用 `parent.followup(createUserMessage(...))` 替代 `parent.inject(...)`；notice 文本与 `parseNotice` 格式不变（投影折叠逻辑零改动）。
  3. README 说明：wakeup 适合"父 agent 空转等子 agent"的编排（进度一到父立刻接着干活）；默认 quiet 保持现状。
- **验收**：lifecycle.spec 新增：wakeup 模式调 `followup`（fake parent 增加 followup spy）、quiet 模式仍调 `inject`；集成测试（可选）验证 wakeup 下父回合被触发。
- **风险**：低；wakeup + 高频子回合会显著增加父上下文消耗——README 里写清配合 `reportThrottleMs` 使用。

### P-4 `bg_list` 递归树（`recursive: true`）【M】

- **证据**：`listDescendants` 存在（基线事实 4），返回 `SubagentDescendantListEntry`（含 diagnostics）。
- **改法**：
  1. `bg_list` 参数新增 `recursive?: boolean`（默认 false）。
  2. `recursive=true` 走 `ctx.subagents.listDescendants(parent.id, signal)`；`BgListAgent` 增加可选 `parentId`/`depth`（output.schema 同步，向后兼容）；投影 facts 只对直属子可用，后代行用 entry.label + live activity（文档写明）。
  3. diagnostics 沿用现有 `BgListDiagnostic`（descendant 条目自带 reason）。
- **验收**：tools.spec：子 agent 再起孙 agent（scripted 两段）后 `recursive: true` 列出 2 行且 `depth` 正确、`recursive: false` 仍 1 行。
- **风险**：低（只读列举）。面板树形渲染 → P2 可选（全局面板已聚合所有父会话，树渲染边际价值低，先不做）。

### P-5 Web 面板"发消息"按钮【M】

- **证据**：官方 wire RPC `subagent.prompt`（基线事实 6），与官方 subagent 目录同权限。
- **改法**：
  1. `src/client/index.ts` 的 `BackgroundAgentsInjected` 增加 `sendMessage(parentSessionId, childSessionId, text)` → `api.subagents.prompt({ parentSessionId, childSessionId, mode:'continuable', content:[{type:'text', text}], clientTimeZone })`。
  2. `BackgroundAgentsAction.tsx`：每行加"发消息"按钮（小弹层/内联输入框），busy 态复用 `busyId`；对 `settled`/`idle`/`archived` 均可发（唤醒语义），`running` 时提示"将排队"。
  3. `locales.ts` 补键：`row.message`、`message.title`、`message.placeholder` 等；presenter 不变。
- **验收**：jsdom 测试（P2 的 E-8 落地后）：输入 → 调 `sendMessage` → 成功后清空输入、失败显示 error；fake api 断言 payload 形状。
- **风险**：低。**注意**：实现时以 `ConnectionHandle` 真实类型为准（fixture 只是形状证据）。

---

## 4. P2 详细方案（v0.3.0）

### E-6 CI + harness commit pin 【L】

- **改法**：
  1. `scripts/gen-aliases.mjs` 支持 `DSH_HARNESS_ROOT` 环境变量覆盖（默认保持现有相对路径），并在 `README.md` 记录。
  2. 仓库新增 `HARNESS_COMMIT` 文件（内容 `8c690c7cf885`）或 README 表格注明"开发基准 harness commit"。
  3. `.github/workflows/ci.yml`（ubuntu-latest，node 24，corepack pnpm）：
     - clone deepseek-ai/deepseek-harness @ pin 到临时目录 → `pnpm install` + `pnpm run build`（actions/cache 按 commit 缓存）；
     - plugin：`DSH_HARNESS_ROOT=<harness> pnpm run gen-aliases`（CI 工作区可重写生成物，不做漂移门）→ `pnpm run typecheck` → `pnpm test`；
     - `pnpm run build && git diff --exit-code lib/`（E-4 的 A 方案）；
     - `node scripts/pack-smoke.mjs`（E-9）。
- **风险**：中——harness 全量 build 首次 ~10min+，靠缓存压到 <2min；harness master 移动时 pin 会旧，版本升级是显式操作（正确行为）。

### E-7 cap 竞态修复 【S】

- **证据**：`background_agent` `isConcurrencySafe: () => true` + check-then-act（`tools.ts` L174-188）。
- **改法**：`tools.ts` 增加 per-parent 互斥：`const startGates = new Map<string, Promise<unknown>>()`，execute 内 `count+startContinuable` 包进同一条 promise 链（前序完成后 resolve 自身），dispose 无需清理（Map 只增，键为 SessionId，数量有 cap 上限）。
- **验收**：tools.spec：`maxBackgroundAgents: 1` 时 `Promise.allSettled([start, start])` → 恰一个成功、另一个 isError 报 cap。
- **风险**：无。

### E-8 面板组件 jsdom 测试 【S】

- **改法**：devDeps 加 `jsdom`；新增 `tests/action.spec.tsx`（`// @vitest-environment jsdom`）：打开/关闭、Escape 关闭、outside pointerdown 关闭、非 running 行停止按钮禁用、发消息按钮（若 P-5 已落地）调注入函数、错误显示。用 `react-dom/client` 直接 render，不引 testing-library（最小依赖）。
- **验收**：覆盖 `BackgroundAgentsAction.tsx` 主要交互分支。
- **风险**：低。

### E-9 发布烟测脚本 【M】

- **改法**：`scripts/pack-smoke.mjs`：
  1. `pnpm run build` → `pnpm pack`；
  2. 临时目录建 profile（`dsh.profile.bundles: ['@deepseek-ai/dsh-base','@deepseek-ai/dsh-headless']`）→ `dsh plugin add <tgz>`（或 `pnpm add <tgz>` + 手写 patch 行）；
  3. `dsh --profile smoke --dump-config` 断言 `background-agents` 行存在、无 FAILED；
  4. 可选深验证：`--patch dev/cordis.yml` 跑 scripted-llm 全流程（无 key）。
  挂进 CI 与 `npm run release` 脚本。
- **风险**：中（依赖宿主 dsh CLI 与网络装 dsh-base），CI 里用缓存。
- **验收**：一次命令完成"从 pack 到 load"全链路。

### 打磨 D-1 暗色主题 fallback 【S】

- **改法**：`BackgroundAgentsAction.module.css` 硬编码 fallback 换中性/`light-dark()`：`.panel` 背景 `var(--color-bg-elevated, light-dark(#ffffff, #1e1e1e))`；四个状态徽标色改用 `color-mix` 于 `currentColor` 或引入 `--color-*` token；`.error` 同理。
- **验收**：浅/深色下人工过一遍（dev web 或截图对比）。
- **风险**：无。

### 打磨 D-2 停止按钮语义统一 【S】

- **改法**：`BackgroundAgentsAction.tsx` L82 `disabled={busy || row.status !== 'running'}` → `disabled={busy || row.status === 'archived'}`；与 `bg_stop` 工具"已 settle 也接受（no-op）"对齐；`locales` 无需改。
- **验收**：presenter/action 测试相应断言。
- **风险**：无。

### 打磨 D-3 面板词典补 es/pt/hi 【S】

- **改法**：`locales.ts` 增加 `es`/`pt`/`hi` 三个字典（键与 zh 一致），`ctx.locale.register(NS, { zh, en, es, pt, hi })`。
- **验收**：类型检查键齐（`Record<BackgroundAgentsKey, string>` 已强制）。
- **风险**：无。

### 明确不可实施 / 不做（附原因）

| 项 | 结论 | 原因 |
|---|---|---|
| 面板显示 `bg_list` diagnostics | ❌ 不可实施 | 面板只读投影值；diagnostics 是 tool/result 内容，无持久通道。**除非** harness 开放插件会话事件注册面（`KNOWN_SESSION_EVENT_TYPES` 只读，见 ARCHITECTURE.md）。模型侧已有文本提示，不改。 |
| `maxTokens` 透传 | ⏸ 暂缓 | descriptor 不持久化，冷恢复丢语义；等 harness 补持久化再开。 |
| `bg_clear` 清空排队消息 | ❌ 不可实施 | seam 无 inbox 枚举/清理 API；`interrupt` 只中断当前回合且 keepInbox。 |
| 定时唤醒/调度 | ⏸ 边界决定 | 官方 schedule seam 存在但 README 已正确划界给 dsh-automation；维持现状。 |
| 跨机器 agent | ❌ | 与官方 subagent 激活契约冲突，明确 out of scope。 |

---

## 5. 执行顺序与决策点

**执行顺序**：E-1+E-2+E-3+E-5+P-1（一个 PR，v0.1.1）→ P-1 系列（v0.2.0）→ E-6~E-9 + D-1~D-3（v0.3.0）。每个非平凡 PR 同步更新 ARCHITECTURE.md 与五语言 README，并补 Agent Note（若在 harness 仓库内开发则遵循其约定；本仓库按 PR 描述 + 测试即可）。

**需要你拍板的 4 个决策**：
1. **npm 发布与否**：本会话只有 GitHub token；发布 npm 需另给 token。不发布则 README 主推 git 安装（本方案默认）。
2. **E-4 方案**：A（lib 入库 + CI 漂移门，默认）还是 B（prepare 脚本 + 删除 lib）。
3. **E-2 peer 是否 `optional: true`**：默认非 optional（更严格）；若在意插件 dev 工作区会从 npm 拉 rc.6 副本，改 optional。
4. **P-1 的 model/provider 覆盖**：首版只做 config 级（默认），还是同时开放 per-call 工具参数（需 `allowModelOverride` 开关）。
