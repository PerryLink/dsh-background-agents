# dsh-background-agents

> 涓?[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 鎻愪緵鍙氦浜掔殑闀夸細璇濆悗鍙?agent銆傚惎鍔ㄤ竴涓寔涔呭寲瀛?agent锛屽畠鑷繁骞叉椿銆佷綘缁х画鑱婂ぉ鈥斺€旈殢鏃舵煡鐪嬭繘搴︺€佸彂娑堟伅骞查銆佽姹傚仠姝紝鍏ㄧ▼涓嶇寮€褰撳墠浼氳瘽銆?
[English](./README.md) 路 [涓枃](./README.zh.md) 路 [Espa帽ol](./README.es.md) 路 [Portugu锚s](./README.pt.md) 路 [啶灌た啶ㄠ啶︵](./README.hi.md)

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-4d6bfe)](https://github.com/topics/dsh-plugin)
[![topic: dsh](https://img.shields.io/badge/topic-dsh-4d6bfe)](https://github.com/topics/dsh)

DSH 鍐呯疆鐨勫悗鍙?*jobs* 鏄?鍙戝悗鍗冲繕"鐨勫伐鍏锋墽琛岋細鑳借杈撳嚭銆佽兘鏉€鎺夛紝浣嗘病娉曡窡瀹冨璇濄€俙dsh-background-agents` 鎶婂畠鍗囩骇涓哄畼 subagent seam 涓婄殑**瀹屾暣鍚庡彴 agent 浼氳瘽**鈥斺€斾竴涓彲缁х画锛坈ontinuable锛夌殑瀛愪細璇濓紝闅忔椂鍙彂娑堟伅銆佸彲骞查銆佸彲涓柇锛涘畠姣忓畬鎴愪竴杞紝灏辨湁涓€鏉¤妭娴佽繃鐨勮繘搴︽憳瑕佹敞鍏ョ埗浼氳瘽锛屾ā鍨嬪拰浜洪兘鐪嬪緱瑙併€?
## 浣犲緱鍒颁粈涔?
- **`background_agent`** 鈥斺€?浠庝换鎰忎細璇濆惎鍔ㄤ竴涓寔涔呭寲銆佸彲缁х画鐨勫瓙 agent銆傚畠鍦ㄨ嚜宸辩殑涓婁笅鏂囬噷骞叉椿锛岀珛鍗宠繑鍥炵ǔ瀹?agent id锛屼細璇濇案涔呭彲缁€傚彲閫夐€愬瓙 scoping锛歚tool_filter`锛堜粠瀛?agent 瑙嗛噹绉婚櫎宸ュ叿鈥斺€斿彧鏀朵笉鎵╋級銆乣persona`锛堜笓灞炵郴缁熸彁绀鸿瘝浜烘牸锛夈€乣max_depth`锛堝啀濮旀淳娣卞害涓婇檺锛夛紱`childProvider`/`childModel` 閰嶇疆鍏舵ā鍨嬭矾鐢便€?- **`bg_message`** 鈥斺€?缁欏畠娲炬柊娲汇€佺籂鍋忥紝鎴栧敜閱掑凡缁撴潫鐨?agent銆傛秷鎭蛋瀹樻柟 FIFO inbox锛宎gent 鐨勫洖搴斿氨鏄畠鐨勪笅涓€杞€?- **`bg_list`** 鈥斺€?鐘舵€佹€昏锛歭abel銆佹ā寮忋€乤ctivity锛坄running` / `idle` / `ready` / `settled` / `archived`锛夈€佹秷鎭暟銆佹渶杩戞椿璺冩椂闂淬€傞噸鍚悗鑳介€氳繃瀹樻柟鎸佷箙鍖栧瓙浠ｇ悊鐩綍鎭㈠銆俙recursive: true` 鍒楀嚭鏁存５鍚庝唬鏍戯紙甯?`parentId`/`depth`锛夈€?- **`bg_result`** 鈥斺€?鍙栧洖瀛?agent 鏈€杩戜竴娆?assistant 杈撳嚭鍏ㄦ枃 + 褰撳墠 activity锛堟瘮 settled 閫氱煡鎽樿鏇村叏锛夈€?- **`bg_stop`** 鈥斺€?璇锋眰涓柇褰撳墠杞€傚彂鍚庡嵆杩旓細鏀跺熬浜ょ粰瀹樻柟鎺у埗闈紝agent 淇濇寔鍙敜閱掋€?- **autoReport** 鈥斺€?姣忎釜瀛愯疆缁撴潫鍚庯紝鍚戠埗浼氳瘽娉ㄥ叆涓€琛岃妭娴佽繘搴︼紙妯″瀷鍙銆佹潵婧愭爣璁?`{ kind: 'plugin', plugin: 'dsh-background-agents' }`锛夛紱鏈€缁堢粨鏋滅敱瀹樻柟 settled 閫氱煡閫佽揪銆俙reportDelivery: wakeup` 璁╂瘡琛岃繘搴﹀湪鐖?agent 绌洪棽鏃剁洿鎺ュ紑鍚竴涓埗鍥炲悎銆?- **绌洪棽褰掓。** 鈥斺€?瓒呰繃 `idleTimeoutMinutes` 鏃犳椿鍔ㄧ殑 agent 鑷姩褰掓。骞堕€氱煡锛沗bg_message` 鍙互鍐嶅敜閱掑畠銆?- **`backgroundAgents` 鎶曞奖鍗曞厓** 鈥斺€?鎶樺彔鐖朵細璇濇棩蹇楀緱鍒颁华琛ㄧ洏琛岋紙agentId銆乴abel銆乤ctivity銆佹渶鍚庢秷鎭憳瑕併€佸垱寤烘椂闂达級銆備竴鍒囦簨瀹為兘鑳戒粠鎸佷箙鍖栨棩蹇楅噸寤猴紝鏃犵嫭绔嬫暟鎹簱銆?- **Web UI 闈㈡澘** 鈥斺€?Web GUI 渚ф爮鏂板"鍚庡彴 agent"鍏ュ彛锛氬疄鏃剁姸鎬併€佷竴閿烦鍒板瓙浼氳瘽銆佸仠姝㈡寜閽紝浠ュ強缁忓畼鏂?`subagent.prompt` RPC 鍙戞秷鎭帓闃熸柊鍥炲悎鐨勬寜閽€?
## 蹇€熷紑濮?
```sh
# 鍦?harness checkout 鎴栦换鎰?dsh CLI 鍙敤澶勶紙web 鎴?headless锛?dsh plugin --profile <name> add "github:PerryLink/dsh-background-agents#v0.3.0"
```

bundle patch 鑷甫鎻掍欢琛岋紝`dsh plugin add` 浼氭妸瀹冪粍鍚堣繘 profile 鐨勫眰鏍堬紙`dsh.profile.bundles`锛夈€傚缓璁娇鐢?pin 浜?ref 鐨?git 婧愶細鏈粨搴撳凡鎻愪氦鏋勫缓浜х墿锛坄lib/`锛夛紝git 瀹夎鏃犻渶鏋勫缓姝ラ銆佹棤闇€ `allowBuilds`銆傦紙tag 鎺ㄩ€佸悗 CI 浼氬湪浠撳簱閰嶇疆浜?`NPM_TOKEN` 鏃惰嚜鍔ㄥ彂甯冨埌 npm锛屽眾鏃?`pnpm add dsh-background-agents` 鍚屾牱鍙敤銆傦級

钀借繘 profile 鐨勬彃浠惰锛堟寜 profile 鍦?`cordis.patch.yml` 閲岃鐩?`config`锛夛細

```yaml
- insert:
    - id: background-agents
      name: dsh-background-agents
      config:
        provider: spawn        # 鎻愪緵鍙户缁瓙 agent 鐨?ctx.subagents 鎻愪緵鏂?```

鎻掍欢渚濊禆 subagent 涓诲共锛堝熀浜?`@deepseek-ai/dsh-base` 鐨?profile 宸插唴缃細`dsh-subagent`銆乣dsh-subagent-spawn-in-process`銆乣dsh-session-projection`锛夈€?
涔嬪悗鍦ㄤ换鎰忎細璇濋噷鐩存帴璇撮渶姹傚嵆鍙紝鎴栨墜鍔ㄨ皟鐢ㄥ伐鍏凤細

```
background_agent "鐩戞帶浠撳簱鐨勬祴璇曞け璐ュ苟闅忔椂姹囨姤" (label: test-watch)
bg_list
bg_message <agentId> "鐜板湪鍐嶆煡涓€涓嬪揩鐓ф祴璇?
bg_stop <agentId>
```

## 閰嶇疆

鎵€鏈夐槇鍊间笌鑺傛祦鍙傛暟閮芥槸缁忔牎楠岀殑 `Config` 瀛楁鈥斺€斿湪 `cordis.yml` 鏀癸紝缁濅笉纭紪鐮併€?
| 瀛楁 | 榛樿鍊?| 鍚箟 |
|---|---|---|
| `provider` | *(蹇呭～)* | 鍚姩鍙户缁瓙 agent 鐨?`ctx.subagents` 鎻愪緵鏂瑰悕锛坄spawn`锛?|
| `autoReport` | `true` | 姣忎釜瀛愯疆缁撴潫鍚庡悜鐖朵細璇濇敞鍏ヤ竴琛岃繘搴?|
| `reportDelivery` | `quiet` | `quiet` 鎶婅繘搴﹁杩藉姞鍒扮埗 agent 涓嬩竴鏉℃ā鍨嬭姹傦紱`wakeup` 鍦ㄧ埗 agent 绌洪棽鏃剁洿鎺ュ紑鍚埗鍥炲悎锛堝繖纰屾椂鍏ラ槦锛?|
| `reportThrottleMs` | `15000` | 鍚屼竴瀛?agent 涓ゆ杩涘害娉ㄥ叆鐨勬渶灏忛棿闅?|
| `reportSummaryMaxChars` | `300` | 娉ㄥ叆杩涘害琛屾枃鏈殑纭笂闄愶紙鏄惧紡鐪佺暐鍙锋埅鏂級 |
| `resultMaxChars` | `4000` | `bg_result` 杩斿洖鏂囨湰鐨勭‖涓婇檺锛堢渷鐣ュ彿鎴柇骞剁疆 `truncated` 鏍囧織锛?|
| `maxBackgroundAgents` | `4` | 姣忎釜鐖朵細璇濋潪褰掓。鍚庡彴 agent 鐨勭‖涓婇檺锛涢绠椾负璇ヤ細璇?*鍏ㄩ儴** continuable 鐩村睘瀛愪唬鐞嗗叡浜紙鍚唴缃?`subagent` 宸ュ叿鍚姩鐨勶級 |
| `idleTimeoutMinutes` | `120` | 绌洪棽绐楀彛锛氳秴鏃跺悗褰掓。骞堕€氱煡锛坄>= 1`锛?|
| `idleSweepIntervalMs` | `60000` | 褰掓。宸℃鍛ㄦ湡 |
| `maxLabelChars` | `120` | 灞曠ず鏍囩涓婇檺锛堢渷鐣ュ彿鎴柇锛?|
| `childProvider` | *(缁ф壙)* | 瀛?agent 妯″瀷璇锋眰鐨勬彁渚涙柟璺敱 |
| `childModel` | *(缁ф壙)* | 瀛?agent 妯″瀷璇锋眰鐨勬ā鍨?id |
| `maxChildDepth` | *(鏃?* | 鍚姩鍙傛暟 `max_depth` 鐨勯厤缃ぉ鑺辨澘 |
| `allowedChildTools` | *(鏃?* | `tool_filter` 鍙偣鍚嶅伐鍏风櫧鍚嶅崟锛涚┖/缂虹渷 = 涓嶉檺鍒?|

## 宸ヤ綔鍘熺悊鈥斺€斾互鍙婁负浠€涔堥噸鍚悗鑳芥仮澶?
涓€鍒囧惎鍔?娑堟伅/鍋滄閮借蛋瀹樻柟 subagent seam锛歚startContinuable`銆乣followup`銆乣interrupt`銆乣listChildren`鈥斺€旀彃浠朵笉鍋氳嚜宸辩殑鐢熷懡鍛ㄦ湡璺敱锛屼笉纰板埆鐨勪細璇濈殑 `Agent`锛屼笉鏉€杩涚▼鏍戯紙鍋滄 = *璇锋眰涓柇*锛屾敹灏惧綊 continuation manager锛夈€?
鎻掍欢鍐欑殑姣忎竴鏉′簨瀹炶蛋**涓€鏉＄粨鏋勫寲閫氶亾 + 涓€鏉℃ā鍨嬪彲瑙侀€氶亾**锛?
- **`background-agents/fact` 缁撴瀯鍖栦簨瀹炰簨浠?*锛坴0.3.0 璧凤級鈥斺€斾互 log-only銆乣ignorable: true` 钀借繘鐖朵細璇濇棩蹇楃殑娉ㄥ唽/娑堟伅/鍋滄/杩涘害/褰掓。浜嬪疄锛涗笉浜嗚В璇ョ被鍨嬬殑璇诲彇鏂逛細璺宠繃璁板綍鑰岄潪鎷掔粷鍔犺浇锛屾棫 harness 鏋勫缓涓庢棫鐗堟彃浠朵粛鑳芥墦寮€鏂版棩蹇楋紱
- `tool/result` 鐨?**replay metadata** 鈥斺€?v0.3.0 鍓嶆棩蹇楃殑鍚屼竴鎵逛簨瀹烇紙鎶曞奖浠呭湪琛屽皻鏃犵粨鏋勫寲鏉ユ簮鏃舵姌鍙狅級锛?- **娉ㄥ叆鐨?`user/message` 閫氱煡**锛堟ā鍨嬪彲瑙侊級锛屾潵婧?`{ kind: 'plugin', plugin: 'dsh-background-agents' }` 鈥斺€?鑺傛祦杩涘害琛屼笌褰掓。閫氱煡锛堣鑼冨墠缂€ `[background-agent <id>] 鈥锛夛紱
- 瀹樻柟鐨?**`subagent-settled` 閫氱煡** 鈥斺€?瀛?agent 鐨勬寔涔呭寲"宸茬粨鏉?浜嬪疄銆?
`backgroundAgents` 鎶曞奖鍗曞厓鎶樺彔缁撴瀯鍖栭€氶亾銆佸苟涓烘棫鏃ュ織淇濈暀 legacy 鎶樺彔锛堣棣栨鏀跺埌缁撴瀯鍖栦簨瀹炲悗鍒囨崲鍒颁簨浠舵潵婧愶紝鍙岄€氶亾骞跺啓鐨勬棩蹇楁案涓嶅弻璁★級銆傚洜姝や华琛ㄧ洏涓?`bg_list` 鐨勪簨瀹炶兘鍦ㄧ埗浼氳瘽閲嶅紑鍚庡畬鏁撮噸寤猴紝涓斾簨瀹炰笉鍐嶄緷璧栬В鏋愪汉绫诲彲璇婚€氱煡鏂囨湰銆傚綋鐩綍鏈韩涓嶅彲鐢紙缂烘姇褰辨敞鍐岃〃鎴栦細璇濆瓨鍌級鏃讹紝`bg_list` 杩斿洖鏄惧紡鐨?**`unrecoverable`** 鏍囪鈥斺€旂粷涓嶄吉閫犵┖鍒楄〃銆?
## 涓嶆槸杩欎釜鎻掍欢

| 椤圭洰 | 鍋氫粈涔?| 杈圭晫 |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | 鍦ㄦ柊 agent 浼氳瘽涓寜璁″垝璺戠紪鐮佷换鍔?| 瀹冪浠诲姟**浣曟椂**璺戯紙瀹氭椂璋冨害锛夈€傛湰鎻掍欢绠′竴鏉￠暱浼氳瘽鐨?*浜や簰寮忛┚椹?*鈥斺€斾笉鍋氳皟搴︺€佷笉鍋?cron銆?|
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | 鍚庡彴 *jobs* 鐨勭姸鎬佹潯锛堣繘搴?+ 杈撳嚭 tail锛?| 瀹?*灞曠ず**宸ュ叿绾т换鍔°€傛湰鎻掍欢鍒涘缓骞堕┚椹?**agent 浼氳瘽**锛涢潰鏉垮彧鏄叾涓竴闈€?|
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | 澶?agent 浠〃鐩?skill | 鍋忓睍绀恒€傛湰鎻掍欢鐨勮鏄?*鍙搷浣滅殑**锛氳烦瀛愪細璇濄€佸彂娑堟伅銆佸仠姝⑩€斺€斿叏璧板畼鏂规帶鍒堕潰銆?|

## 涓庡唴缃?subagent 宸ュ叿鐨勫叧绯?
harness 鏍稿績鑷甫涓€缁?subagent 宸ュ叿锛坄subagent`銆乣send_message`銆乣interrupt_agent` 涓庡瓙浠ｇ悊 `report` 宸ュ叿锛夈€傛湰鎻掍欢鐨?`bg_*` 宸ュ叿鏄畠浠殑**浼氳瘽浣滅敤鍩熻ˉ鍏?*锛屽彲鍏卞瓨锛?
| 鍐呯疆宸ュ叿 | 鏈彃浠跺搴?| 宸紓 |
|---|---|---|
| `subagent`锛坄backgroundMode: 'continuable'`锛?| `background_agent` | 鍚屾牱璧?`startContinuable`锛涙湰鎻掍欢鍙﹀姞閫愬瓙 tool_filter/persona/max_depth 鏍￠獙涓庢瘡浼氳瘽 cap |
| `send_message` | `bg_message` | 鐩稿悓鎶曢€掕涔夛紱`bg_message` 闈㈠悜"鏈細璇濈殑 background agent"骞剁淮鎶ゆ姇褰变簨瀹?|
| `interrupt_agent` | `bg_stop` | 鐩稿悓涓柇璇箟锛沗bg_stop` 鍙﹁惤缁撴瀯鍖?stop 浜嬪疄 |
| 瀛愪唬鐞?`report` 宸ュ叿 | autoReport | 鍐呯疆鐗堢敱瀛愭ā鍨嬩富鍔ㄨ皟鐢紱鏈彃浠?*姣忎釜瀛愯疆鑷姩**娉ㄥ叆鑺傛祦杩涘害 |

鏍稿績宸ュ叿娌℃湁鐨勶細`bg_list`銆乣bg_result`銆佺┖闂插綊妗ｃ€佹寜鐖朵細璇濇姌鍙犵殑闈㈡澘鎶曞奖銆?
涓嶅湪鑼冨洿鍐咃細瀹氭椂瑙﹀彂锛坰chedule seam 宸叉湁锛夛紱璺ㄦ満/杩滅▼ agent锛涙敼鍔ㄥ畼鏂?subagent activation 濂戠害銆?
## 寮€鍙?
```sh
pnpm install        # 浠呭伐鍏烽摼锛沨arness 鍖呴€氳繃鐩搁偦 checkout 瑙ｆ瀽
pnpm run typecheck  # strict TS锛宯ode + client 鍙岀▼搴?pnpm test           # 69 涓崟鍏?+ 绔埌绔祴璇曪紙鐪熷疄 subagent seam + 鑴氭湰鍖?LLM + jsdom 闈㈡澘锛?pnpm run build      # lib/index.js锛坣ode 鍗婏級+ lib/client.js锛圵eb client bundle锛?pnpm run gen-aliases  # checkout 绉诲姩鍚庨噸鏂版槧灏?harness 鍖呰矾寰?```

鍏?key 鐨勭鍒扮婕旂ず锛氱敤纭畾鎬ц剼鏈寲 LLM 椹卞姩鐪熷疄鐖朵細璇?+ 鍚庡彴瀛?agent锛堟棤闇€ API key锛沗dev/` 涓嶅叆搴撯€斺€旀寜浣犵殑 checkout 璋冩暣璺緞锛夛細

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "銆愮埗浼氳瘽銆戦┍鍔ㄥ悗鍙?agent 婕旂ず"
```

娴嬭瘯瑕嗙洊鍏ㄨ矾寰勨€斺€斿惎鍔ㄣ€佸垪銆佹秷鎭€佸仠姝⑩€斺€斿熀浜?*鐪熷疄** `SubagentRuntime` + 杩涚▼鍐?spawn 鎻愪緵鏂?+ 鑴氭湰鍖栭€傞厤鍣紱鍙︽湁鑺傛祦/涓婇檺/褰掓。绛栫暐銆佹姇褰辨姌鍙犮€佷互鍙婄粡 `session-persistence-jsonl` 鐨勫穿婧冩仮澶嶇敤渚嬨€?
## 璁稿彲璇?
Apache License 2.0鈥斺€旇 [LICENSE](./LICENSE)銆傜涓夋柟澹版槑锛歔THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)銆?