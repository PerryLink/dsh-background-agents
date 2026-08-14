# dsh-background-agents 优化提升方案

> 本文档按版本记录路线图与执行状态:v1 方案的 P0/P1 随 v0.1.1(`da31785`)与 v0.2.0 落地,v2 方案随 v0.3.0 落地,当前执行中的是 v3 方案(v0.4.0)。每条优化都标注:证据 → 具体改法 → 验收 → 风险 → 工作量(S≤半天 / M 1-2 天 / L 2-4 天)→ 优先级。

---

## 0. v3 方案(v0.4.0)——当前执行

> 基于 v0.3.0 发布后的复查:本地 harness checkout 头 `e862f6f0ce6a`(subagent 包自 pin 起无变更,seam 稳定);基线 typecheck ✅、69/69 测试 ✅、npm 0.3.0 已发布、main 干净。

### D-1 `autoArchive` 配置开关 【S】

- **证据**:`idleTimeoutMinutes` 的 schema 下限是 1,归档行为**无法关闭**;长驻观察类 agent(如 repo 监控)在 2h 默认窗口后被归档,用户只能把阈值调到巨大数字来变相禁用。
- **改法**:Config 增 `autoArchive: boolean`(默认 `true`);`sweepIdle` 在关闭时跳过归档分支(仅保留死缓存条目清理);README 配置表同步。
- **验收**:lifecycle.spec——`autoArchive: false` 时超时子 agent 不产生 archived 事实/通知;`true` 时行为不变。
- **风险**:无。

### D-2 `bg_result` 完善:推理块回退 + label 【S】

- **证据**:`sessionLastText` 只连接 text 块;思考模型的末条 assistant 消息若只有 reasoning 块(无 text),`bg_result` 返回空文本并称"尚无输出"——事实是模型确实输出了。另 `bg_result` 不回 label,父模型拿到 agentId 后还得查 `bg_list` 才能对上号。
- **改法**:`sessionLastText` 增 `allowReasoning` 选项(仅 `bg_result` 开启):text 块为空时回退连接 reasoning 块,并置可选 `textSource: 'reasoning'`;`bg_result` 输出增可选 `label`(来自投影事实);autoReport 的进度行**不**回退(reasoning 不注入父上下文)。
- **验收**:tools.spec——纯 reasoning 末消息返回回退文本 + `textSource: 'reasoning'` + `label`;有 text 时不带 `textSource`。
- **风险**:无。

### D-3 空白输入校验 【S】

- **证据**:`background_agent` 的 `task` 与 `bg_message` 的 `message` 均为纯 string schema,空白串会被当真投递(空任务开一个空转 agent)。
- **改法**:两个工具在执行前 trim 校验,空白即报错(错误信息点名工具与参数)。
- **验收**:tools.spec——空白 task/message 各自 isError。
- **风险**:无。

### D-4 面板增强:结果查看 + 父会话标题 + a11y 焦点 【M】

- **证据**:settled 子 agent 的完整结果目前只能离开面板(跳会话或让模型调 `bg_result`);面板聚合所有父会话,行内无父归属信息;面板是 role=dialog 但打开时不聚焦。
- **改法**:
  1. 行内 "Result" 按钮:经官方 `subagents.history` RPC(只读 transcript,不激活 Agent)拉取末条 assistant 文本,纯函数 `extractResultText` 解析(可测),面板内展开显示(行高上限,close 按钮)。
  2. 快照含多个父会话时,行内显示父会话标题小字(单父会话不显示,避免噪音)。
  3. 面板打开时聚焦容器(tabIndex=-1),关闭时焦点归还触发按钮。
- **验收**:presenter.spec(history 事件 → 文本抽取)、action.spec(Result 按钮三态:加载/成功/错误;多父标题;焦点)。
- **风险**:低——只读 RPC,无生命周期副作用。

### D-5 工程守护:startGates 清理 + 巡检周期下限 【S】

- **证据**:`startGates` 的键是父会话 id,尾门 resolve 后永不删除——长驻 fiber 每服务过一个父会话泄漏一个槽位;`idleSweepIntervalMs` 无 min,0 值会造出 1ms 热循环。
- **改法**:finally 中尾门自比较后删除;`idleSweepIntervalMs` schema 加 `.min(1)`。
- **验收**:tools.spec 并发 cap 测试仍过;typecheck;schema 约束测试。
- **风险**:无。

### D-6 harness pin 复核 + CI publish 幂等 【S】

- **证据**:pin `8c690c7cf885` 落后本地 checkout 6 个提交,其中 `a0df6ac` 修复的正是插件所用的 log-only append 面;CI publish job 对已发布版本重复推送 tag 会红(EPUBLISHCONFLICT)。
- **改法**:
  1. pin 复核:本地 checkout 领先的提交(`e1611e9`…`e862f6f`)**未推送到 GitHub 上游**(`git ls-remote` 不可解析),而 `8c690c7cf885` 可解析且为远程可达的最新高程;pin 保持 `8c690c7cf885` 不变——CI 可复现优先于追新。
  2. publish job 先查 `npm view dsh-background-agents@<version> version`,已存在则优雅跳过。
- **风险**:低——subagent 包自 pin 起无变更,基线语义稳定。

### D-7 文档五语言同步 【S】

- **改法**:README(.md/.zh/.es/.pt/.hi)同步 `autoArchive` 配置行、`bg_result` 新字段、面板新按钮、tag 指向 v0.4.0、测试数;ARCHITECTURE.md 补生命周期/UI 小节;本文件记录执行状态。
- **验收**:五份 README 的配置表行数一致。

### 执行日志

- [x] D-1 `autoArchive` 开关 + sweep 分支 + lifecycle.spec（关闭时不归档、死条目仍回收）
- [x] D-2 `sessionLastText` reasoning 回退（仅 bg_result 开启）+ `bg_result` label/textSource + tools.spec（纯 reasoning 末消息回退）
- [x] D-3 空白 task/message 校验 + tools.spec
- [x] D-4 面板 Result 按钮（`subagent.history` 只读 RPC + `extractResultText` 纯函数）、多父会话标题消歧、对话框焦点往返 + presenter.spec/action.spec
- [x] D-5 startGates 尾门回收 + `idleSweepIntervalMs` schema min(1)
- [x] D-6 harness pin 复核(远程可达性校验:`8c690c7cf885` 保持)+ CI publish job 幂等(已发布版本优雅跳过)
- [x] D-7 五语言 README + ARCHITECTURE.md 同步
- [x] 收尾:版本 0.4.0、重建 `lib/`、全量 typecheck/test(83/83)、commit `26a97ca`、tag `v0.4.0` 推送、npm 0.4.0 发布(`latest`)、CI 双 job 全绿(publish 幂等跳过已发布版本)

---

## 1. v2 方案(v0.3.0)——已完成

> v2 方案基于对仓库源码、测试、构建配置、README 与 harness 本体接缝(`packages/subagent/*`、`packages/core/session`、`packages/session/session-projection`)的逐项核实。

## 0-v2. 验证基线（v2 记录）

| 项 | 结果 |
|---|---|
| harness 开发基准 | checkout `8c690c7cf885`（dsh-* `0.1.0-rc.5`，cordis `4.0.1`，schemastery `3.18.1`） |
| `pnpm run typecheck` | ✅ 通过（node + client 双程序） |
| `pnpm test` | ✅ 60/60 通过 |
| 发布通道 | git 主推（`lib/` 入库，免构建安装）；npm 由 CI 在 tag 推送时发布（需 `NPM_TOKEN` secret） |
| 测试与 typecheck 依赖 | harness checkout 的 built `lib/`（`vitest.aliases.mjs` + `tsconfig.paths.json`，由 `gen-aliases` 生成） |

**已核实的 seam 事实（v2 新增）：**

1. `Session.append(type, data, { ignorable: true })` 已开放：log-only 插件自有事件可写入会话日志；读取路径对 `ignorable: true` 的未知类型事件**跳过而非拒绝**（`packages/core/session/src/index.ts` L587-647、`packages/session/session-persistence/src/coordinator.ts` L1063）；`SessionEventType = keyof SessionEventMap` 可声明合并（`types.ts` L336）。harness 自带真实后端 round-trip 测试（`coordinator-contract.ts` L1388）。
2. session-projection 把每个已提交事件驱动到每个 unit（`session-projection/src/index.ts` L181）；compaction 只重写 surface，log-only 事件原样保留。
3. harness 核心已内置重叠能力：`tool-subagent`（`backgroundMode: 'continuable'`）、`tool-subagent-control`（`send_message`/`interrupt_agent`）、`tool-subagent-report`（子代理 `report` 工具 + `reportDelivery`）、`ctx.subagents.reportFrom`、`registerContinuableSetup`、官方 `subagent`/`subagentTiming` 投影。
4. `Agent.followup` 语义：idle 时立刻开回合，busy 时入 FIFO inbox（`reportDelivery: wakeup` 的投递通道）。
5. 客户端 wire RPC：`subagent.list` / `subagent.history` / `subagent.prompt` / `subagent.interrupt`；`subagent.prompt` 负载 `{ parentSessionId, childSessionId, mode:'continuable', content, clientTimeZone }`。

---

## 1-v2. 总路线图与执行状态（v2 记录）

| 版本 | 内容 | 状态 |
|---|---|---|
| **v0.2.0（已发布）** | 阶段 0：透传 toolFilter/persona/max_depth + childModel/childProvider、bg_result、reportDelivery、bg_list 递归、面板发消息、jsdom 面板测试 | ✅ 完成 |
| **v0.3.0** | 阶段 A（工程守护）+ 阶段 B（插件自有 ignorable 事件通道）+ 阶段 C（产品增强） | ✅ 完成 |

### 执行日志

- [x] 0-1 重建 `lib/` 并随 v0.2.0 提交（git 安装免构建的前提）
- [x] 0-2 package.json → `0.2.0` + `packageManager` 字段；tag `v0.2.0` 并推送（README 指向该 tag）
- [x] 0-3 `OPTIMIZATION_PLAN.md` 重写为 v2 并记录执行状态；`ARCHITECTURE.md` 补 v0.2.0 事实
- [x] A-1 cap 竞态：`background_agent` per-parent 互斥（count+start 同链）＋并发测试（`maxBackgroundAgents:1` 双并发恰一成功）
- [x] A-2 CI：`.github/workflows/ci.yml` + `HARNESS_COMMIT` pin（`8c690c7cf885`）+ `gen-aliases` 支持 `DSH_HARNESS_ROOT`
- [x] A-3 `scripts/pack-smoke.mjs`：pack → 离线产物门 →（有 harness 时）干净 profile 安装 + dump-config 断言
- [x] A-4 暗色主题 fallback：`light-dark()`/`color-mix` 替换硬编码色
- [x] A-5 停止按钮语义：`disabled = busy || archived`（与 `bg_stop` no-op 语义对齐），action.spec 覆盖四态
- [x] A-6 面板词典 es/pt/hi：**不可实施**——harness 客户端 `LOCALE_IDS = ['zh','en']`（`packages/client/locale/src/locale-settings.ts`），第三方词典永不可选中；已回退并在 `locales.ts` 注明 seam 约束，五语言 README 保留
- [x] A-7 npm 发布 workflow（tag 推送触发，`NPM_TOKEN` 缺失则跳过）
- [x] B-1 `background-agents/fact` 插件自有 ignorable 事件（`src/events.ts` 声明合并进 `@deepseek-ai/dsh-session/types` + 四工具/lifecycle 双写）
- [x] B-2 投影双通道折叠：事件事实优先，legacy 通道兼容旧日志（entry 级 `source` 判别，`stateVersion` → 2）
- [x] B-3 投影字段扩展 `archivedAt`/`stopRequestedAt`；`ARCHITECTURE.md` 重写硬约束章节
- [x] C-1 `bg_result` 文本上限 `resultMaxChars`（默认 4000，`truncated` 标志）
- [x] C-2 cap 语义文档化：非归档 continuable 子共享会话级预算（含核心工具创建的）
- [x] C-3 provider 加载期校验：已注册但缺 `prepareContinuable` → 加载期响亮失败
- [x] C-4 五语言 README 增「与内置 subagent 工具的关系」定位表
- [x] 收尾 版本 → `0.3.0`、重建 `lib/`、全量测试/typecheck、tag `v0.3.0` 并推送

---

## 2-v2. 阶段 A 详细方案（v0.3.0 工程守护）

### A-1 cap 竞态修复 【S】

- **证据**：`background_agent` `isConcurrencySafe: () => true` + check-then-act（count 与 startContinuable 之间无原子性），并发 start 可双双越过 `maxBackgroundAgents`。
- **改法**：`tools.ts` 增加 per-parent 互斥：`Map<SessionId, Promise<unknown>>`，count+cap 检查+startContinuable 包进同一条 promise 链，前序完成后 resolve 自身；dispose 无需清理（键为 SessionId，数量受 cap 约束）。
- **验收**：`maxBackgroundAgents: 1` 时 `Promise.allSettled([start, start])` → 恰一个成功、另一个 isError 报 cap。
- **风险**：无。

### A-2 CI + harness commit pin 【M】

- **证据**：无任何 CI；测试/typecheck 依赖兄弟 checkout 的 built lib；`gen-aliases.mjs` 硬编码三级相对路径。
- **改法**：
  1. `gen-aliases.mjs` 支持 `DSH_HARNESS_ROOT` 环境变量覆盖（默认保持相对路径）。
  2. 仓库新增 `HARNESS_COMMIT` 文件（`8c690c7cf885`）。
  3. `.github/workflows/ci.yml`（ubuntu-latest，node 24，corepack pnpm 11）：clone harness @pin → `pnpm install` + `pnpm run build`（cache 按 commit）→ plugin `gen-aliases` → `typecheck` → `test` → `build && git diff --exit-code lib/`（构建漂移门）→ `pack-smoke`。
- **风险**：中——harness 全量 build 首次 ~10min+，靠缓存压到 <2min；pin 旧了是显式升级操作（正确行为）。

### A-3 pack-smoke 【M】

- **改法**：`scripts/pack-smoke.mjs`：build+pack → 离线阶段断言产物文件存在 →（`DSH_HARNESS_ROOT` 存在时）临时 `DSH_HOME` profile 安装 tgz + `--dump-config` 断言 `background-agents` 行存在、无 FAILED。挂进 CI。
- **验收**：CI 中一次命令完成"从 pack 到 load"全链路。

### A-4 暗色主题 fallback 【S】

- **改法**：`.panel` 背景 `var(--color-bg-elevated, light-dark(#ffffff, #1e1e1e))`；四个状态徽标与 `.error` 前景色改 `light-dark(浅色值, 深色值)`。
- **验收**：浅/深色下人工过一遍（dev web）。
- **风险**：无。

### A-5 停止按钮语义统一 【S】

- **改法**：`BackgroundAgentsAction.tsx` `disabled={busy || row.status !== 'running'}` → `disabled={busy || row.status === 'archived'}`，与 `bg_stop` 已 settle 也接受的语义对齐；`action.spec.tsx` 相应断言。
- **风险**：无。

### A-6 面板词典 es/pt/hi 【不可实施，已记录】

- **证据**：harness 客户端 locale 注册表只随附 `LOCALE_IDS = ['zh', 'en']`（`packages/client/locale/src/locale-settings.ts`），`register()` 类型签名要求 `Record<LocaleId, ...>`；注册第三方语言永不进入可选集合。
- **改法**：不注册死词典；`locales.ts` 注明 seam 约束，五语言 README（文档面）保留。
- **验收**：类型检查通过；无死代码。
- **风险**：无。

### A-7 npm 发布 workflow 【S】

- **改法**：ci.yml 加 `publish` job（`needs: test`，`startsWith(github.ref, 'refs/tags/v')` 触发，`NPM_TOKEN` secret 存在才发布，否则跳过）；README 维持"git 主推"表述。
- **风险**：低；发布本身需仓库 owner 配置 `NPM_TOKEN`。

---

## 3-v2. 阶段 B 详细方案（v0.3.0 架构升级）

### B-1 插件自有 ignorable 事件

- **证据**：基线事实 1——harness 已开放 `append(type, data, { ignorable: true })`；`known-event-types.ts` 注明"插件事件注册面推迟到有真实消费者为止"，本插件即该消费者。
- **改法**：
  1. 新 `src/events.ts`：`FACT_EVENT = 'background-agents/fact'`，payload `{ agentId, kind: 'registered'|'message'|'stop'|'progress'|'archived', label?, messageCount?, text? }`；`declare module '@deepseek-ai/dsh-session'` 合并进 `SessionEventMap`。
  2. 四个工具在写现有通道的同时向父会话 `append(FACT_EVENT, fact, { ignorable: true })`（registered/message/stop）；`lifecycle.ts` 在 progress/archived 时同样双写。
  3. 模型可见的 progress/archived notice 仍走 `user/message` inject/followup——**事实通道与展示文本解耦**，notice 文案从此可自由演进。
- **收益**：结构化、robust、第三方可消费；旧 harness 构建读新日志优雅跳过（ignorable）；旧版插件投影对未知类型走 default 忽略，优雅降级。

### B-2 投影双通道折叠

- **改法**：`projection.ts`：`stateVersion: 1 → 2`；新增 `FACT_EVENT` 分支；内部 entry 增 `source: 'legacy' | 'event'` 判别（不进 wire schema）：事件事实总是折叠并置 `event`，此后该 entry 的**本插件** legacy 通道（tool/result meta、notice 文本解析）跳过——append 有序保证无双计；官方 `subagent-settled` notice **不受 source 判别影响**（它是 inactive 的唯一通道，事件时代仍折叠）。
- **验收**（projection.spec）：legacy-only 日志、event-only 日志、混合日志（messageCount 无双计、source 翻转）、旧 checkpoint refold（stateVersion）。

### B-3 投影字段扩展与架构文档

- **改法**：wire schema 增可选 `archivedAt`/`stopRequestedAt`；`ARCHITECTURE.md` 重写"one hard constraint"章节为双通道设计。

---

## 4-v2. 阶段 C 详细方案（v0.3.0 产品增强）

### C-1 `bg_result` 文本上限 【S】

- **证据**：settled 子代理的最终输出可能极长，`bg_result` 全文回灌父上下文无上限。
- **改法**：Config 新增 `resultMaxChars`（默认 4000，`natural().min(1)`）；超限截断 + `…`，schema 增可选 `truncated: true`；README 配置表同步。
- **验收**：tools.spec：超限返回截断文本 + `truncated`；未超限无该字段。

### C-2 cap 语义文档化 【S】

- **改法**：README 配置表 `maxBackgroundAgents` 行注明"预算为该会话全部非归档 continuable 子代理共享（含内置 subagent 工具创建的）"。

### C-3 provider 加载期校验 【S】

- **证据**：misconfiguration-fails-loud 约定；当前 provider 拼错或缺 continuable 能力要到第一次 start 才报错。
- **改法**：`apply()` 时若 `ctx.subagents.getProvider(config.provider)` 已存在但缺 `prepareContinuable` → 抛错；不存在则 info 日志（provider 可能后装，与 tool-subagent 同模式）。
- **验收**：新测试：provider 存在但不可 continuable → 插件加载期抛错。

### C-4 与内置工具定位表 【S】

- **改法**：五语言 README 增「与内置 subagent 工具的关系」表：`subagent`/`send_message`/`interrupt_agent`/`report` vs `bg_*` 的差异与共存建议。

---

## 5-v2. 明确不可实施 / 不做（附原因）

| 项 | 结论 | 原因 |
|---|---|---|
| `bg_clear` 清空排队消息 | ❌ 不可实施 | `SubagentRuntime` 无 inbox 枚举/清理 API；`interrupt` 只中断当前回合且 keepInbox。 |
| `maxTokens` 透传 | ⏸ 暂缓 | descriptor 不持久化，冷恢复丢语义；等 harness 补持久化再开。 |
| 定时唤醒/调度 | ⏸ 边界决定 | 官方 schedule seam 存在但 README 已划界给 dsh-automation。 |
| 跨机器 agent | ❌ | 与官方 subagent 激活契约冲突，明确 out of scope。 |
| 面板树形渲染 | ⏸ 可选 | 全局面板聚合所有父会话，树渲染边际价值低。 |
| 面板词典 es/pt/hi | ❌ 不可实施 | harness 客户端 `LOCALE_IDS = ['zh','en']`，第三方语言永不可选中；待 harness 扩展后再开。 |

## 6-v2. 决策记录（v2）

1. **阶段 B 纳入路线图**：✅ 已确认（用户拍板）。
2. **npm 发布**：CI 门控发布（tag 推送 + `NPM_TOKEN`），git 安装维持主通道；本仓库只提交 workflow，实际发布由 owner 配置 token 后自动发生。
3. **cap 计数口径**：维持"所有非归档 continuable 直属子共享预算"，README 明示（C-2）。
4. **版本节奏**：A+B+C 合并为一次 v0.3.0 发布；因 `tools.ts`/`tools.spec.ts` 同时承载 A 与 C 的改动、无法按文件干净拆分，实际落地为单一提交（比计划的"两个提交"更诚实）。
