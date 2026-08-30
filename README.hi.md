<div align="center">

# 👥 dsh-background-agents
- **1024 स्टोर चैनल**: एक बार `npm i -g dsh1024`, फिर `dsh1024 plugin --profile web add dsh-background-agents` ([deepseek1024.com](https://deepseek1024.com) इंस्टॉल रैंकिंग में गिना जाता है)।

**DeepSeek Harness के लिए इंटरैक्टिव लंबी-सत्र वाले बैकग्राउंड एजेंट और लगातार बने रहने वाले मल्टी-एजेंट टीम रूम — एक टिकाऊ चाइल्ड एजेंट शुरू करें जो काम करता रहे जबकि आप बातचीत जारी रखें।**

*सत्रों के बीच सक्रिय बातचीत चलाएँ और एक टीम का समन्वय करें; सब कुछ harness के अपने स्टोरेज से रीस्टार्ट के बाद भी बना रहता है।*

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

## अनुकूलता

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `0.1.1-rc.2` (peers `>=0.1.0-rc.8 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| प्लेटफ़ॉर्म | सभी (होस्ट टूल; स्टोरेज-डोमेन क्षमता के ज़रिए वैकल्पिक वेब साइडबार पैनल और टीम रूम) |
| मॉडल | कोई भी (चाइल्ड पैरेंट का मार्ग लेते हैं; `childProvider`/`childModel` उसे बदलते हैं) |

## आपको क्या मिलता है

`dsh-background-agents` DSH के फायर-एंड-फॉरगेट बैकग्राउंड *जॉब* को दो समन्वित सतहों में बदल देता है:

1. **पाँच स्टीयरिंग टूल** — `background_agent` आधिकारिक उप-एजेंट सीम पर एक टिकाऊ, जारी रहने योग्य चाइल्ड शुरू करता है (वैकल्पिक `tool_filter` — टूल हटाता है, कभी नए नहीं देता; `persona`; `max_depth`; `childProvider`/`childModel` मार्ग)। `bg_message` बाद का टर्न पहुँचाता है; `bg_list` स्थिति बताता है (या `parentId`/`depth` के साथ वंशज ट्री); `bg_result` नवीनतम परिणाम पाठ पढ़ता है (रीज़निंग फ़ॉलबैक को `textSource: 'reasoning'` चिह्नित किया जाता है); `bg_stop` रुकावट का अनुरोध करता है।
2. **प्रगति और संग्रह** — `autoReport` हर चाइल्ड टर्न के बाद एक थ्रॉटल्ड प्रगति पंक्ति इंजेक्ट करता है; `reportDelivery: wakeup` पैरेंट के निष्क्रिय होने पर पैरेंट टर्न शुरू करता है। निष्क्रियता स्वीप शांत चाइल्ड को संग्रहीत करता है और `bg_message` उन्हें फिर जगा देता है (`autoArchive: false` की स्थिति में शांत वॉचर को पार्क कर देता है)।
3. **डैशबोर्ड प्रोजेक्शन + वेब पैनल** — `backgroundAgents` सत्र प्रोजेक्शन पैरेंट लॉग को पंक्तियों में मोड़ता है; एक साइडबार पैनल लाइव स्थिति, जंप, संदेश, रोक और परिणाम झलक दिखाता है। सब कुछ टिकाऊ लॉग से फिर से बनता है — कोई अलग डेटाबेस नहीं।
4. **टीम रूम (v0.5.0+)** — `/room` कमांड परिवार और आठ `room_*` टूल लगातार मल्टी-एजेंट रूम बनाते हैं: सदस्य (हर एक स्वतंत्र सत्र), एक संदेश बस (निर्देशित/प्रसारण), एक साझा टास्क बोर्ड और एक साझा टाइमलाइन — `team_rooms` स्टोरेज डोमेन (SQLite या JSONL) में संग्रहीत और DSH रीस्टार्ट के बाद पुनर्प्राप्त। क्रॉस-सदस्य टास्क हैंडऑफ़ आधिकारिक अनुमोदन सीम से गुजरते हैं।

## त्वरित शुरुआत

```sh
# 1. अपने प्रोफ़ाइल में बंडल इंस्टॉल करें
dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"

# या npm से (प्रकाशित रिलीज़)
dsh plugin --profile web add dsh-background-agents

# 2. पुनः प्रारंभ करें और पंक्ति सत्यापित करें
dsh --profile web --dump-config | grep -A4 'id: background-agents'
```

बंडल पैच प्लगइन पंक्ति रखता है; `provider` अनिवार्य है। रेपो अपना बिल्ड आउटपुट (`lib/`) कमिट करता है, इसलिए git इंस्टॉल को बिल्ड चरण की आवश्यकता नहीं होती। प्लगइन को उप-एजेंट स्पाइन पहले से माउंट होना चाहिए (`@deepseek-ai/dsh-base` पर बना कोई भी प्रोफ़ाइल इसे रखता है)। टीम रूम वहीं माउंट होते हैं जहाँ स्टोरेज डोमेन (`@deepseek-ai/dsh-storage-domain`) बना हो; पाँच `bg_*` टूल इसके बिना भी काम करते हैं।

फिर, किसी भी सत्र में, बस मॉडल से कहें — या टूल सीधे कॉल करें:

```
background_agent "watch the repo for test failures and keep me posted" (label: test-watch)
bg_list
bg_message <agentId> "also check the snapshot tests now"
bg_stop <agentId>
```

## इंस्टॉल और अनइंस्टॉल

- **git चैनल** (नवीनतम `main`): `dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"` — `lib/` कमिटेड, कोई `prepare` या `allowBuilds` चरण नहीं।
- **npm चैनल** (प्रकाशित रिलीज़): `dsh plugin --profile web add dsh-background-agents`।
- **tarball चैनल**: इस रेपो में `pnpm pack`, फिर `dsh plugin --profile web add ./dsh-background-agents-<version>.tgz`।
- **अनइंस्टॉल**: `dsh plugin --profile web remove dsh-background-agents` (या प्रोफ़ाइल पैच से पंक्ति हटाएँ)।

## कॉन्फ़िगरेशन

हर ट्यूनेबल एक सत्यापित Schemastery `Config` फ़ील्ड है — इसे cordis.yml में बदलें, कोड में कभी नहीं। केवल `provider` अनिवार्य है।

| कुंजी | डिफ़ॉल्ट | अर्थ |
|---|---|---|
| `provider` | *(अनिवार्य)* | जारी रहने योग्य शुरुआत के लिए `ctx.subagents` प्रदाता नाम (`spawn`) |
| `autoReport` | `true` | हर चाइल्ड टर्न के बाद पैरेंट में एक प्रगति पंक्ति इंजेक्ट करें |
| `reportDelivery` | `quiet` | `quiet` पंक्ति को अगले मॉडल अनुरोध में जोड़ता है; `wakeup` पैरेंट निष्क्रिय होने पर पैरेंट टर्न शुरू करता है |
| `reportThrottleMs` | `15000` | एक चाइल्ड की दो प्रगति इंजेक्शनों के बीच न्यूनतम अंतर |
| `reportSummaryMaxChars` | `300` | इंजेक्ट की गई प्रगति पंक्ति के पाठ की कठोर सीमा (दीर्घवृत्त) |
| `resultMaxChars` | `4000` | `bg_result` पाठ की कठोर सीमा (दीर्घवृत्त, `truncated` चिह्नित) |
| `maxBackgroundAgents` | `4` | प्रति पैरेंट सत्र गैर-संग्रहीत बैकग्राउंड एजेंटों की कठोर सीमा |
| `autoArchive` | `true` | निष्क्रिय-संग्रह टॉगल; `false` पर स्वीप कभी शांत चाइल्ड संग्रहीत नहीं करता |
| `idleTimeoutMinutes` | `120` | वह निष्क्रियता विंडो जिसके बाद शांत चाइल्ड संग्रहीत होता है (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | संग्रह स्वीप अवधि |
| `maxLabelChars` | `120` | प्रदर्शन-लेबल सीमा (दीर्घवृत्त) |
| `childProvider` | *(विरासत)* | चाइल्ड मॉडल अनुरोधों का प्रदाता मार्ग |
| `childModel` | *(विरासत)* | चाइल्ड मॉडल अनुरोधों का मॉडल id |
| `maxChildDepth` | *(कोई नहीं)* | किसी शुरुआत के `max_depth` तर्क की कॉन्फ़िग सीमा |
| `allowedChildTools` | *(कोई नहीं)* | `tool_filter` नामों की अनुमति-सूची; खाली/अनुपस्थित = कोई सीमा नहीं |
| `maxRooms` | `16` | प्रोफ़ाइल में टीम रूम की कठोर सीमा |
| `maxMembersPerRoom` | `8` | प्रति रूम सदस्यों की कठोर सीमा |
| `maxRoomsPerMember` | `4` | एक सदस्य सत्र कितने रूम जॉइन कर सकता है इसकी कठोर सीमा |
| `busRetention` | `200` | प्रति रूम रखे गए बस संदेश |
| `timelineRetention` | `500` | प्रति रूम रखे गए टाइमलाइन ईवेंट |
| `taskRetention` | `50` | प्रति रूम रखे गए पूर्ण कार्य |
| `maxMessageChars` | `4000` | एक रूम संदेश के पाठ की कठोर सीमा (ऊपर अस्वीकार, कभी काटा नहीं) |
| `injectRoomBrief` | `true` | सदस्य सत्रों में संक्षिप्त रूम परिचय इंजेक्ट करें (जॉइन + रिज़्यूम) |
| `roomOpenTimeoutMs` | `15000` | `team_rooms` स्टोरेज डोमेन खुलने की अधिकतम प्रतीक्षा; समय समाप्ति पर हर रूम ऑपरेशन लटकने के बजाय `store-unavailable` से स्पष्ट विफल होता है |
| `allowUnmarkedFacts` | `false` | `ignorable` मार्कर छोड़ने वाले होस्ट पर तथ्य ईवेंट बलपूर्वक लिखें (खतरनाक: बिना मार्कर वाले तथ्य अन्य होस्ट पर सत्र अप्राप्य बनाते हैं); डिफ़ॉल्ट पहचान-और-छोड़ है |
| `observability` | `true` | प्रति-एजेंट लागत/स्थिति निरीक्षण स्विच: प्रत्येक चाइल्ड टर्न पर एक `metrics` तथ्य (टोकन, टर्न वॉल टाइम, त्रुटि फ़्लैग) कैप्चर करें और लागत पैनल के लिए हर पंक्ति के `metrics` योग में जोड़ें; `false` कैप्चर बंद कर देता है (पैनल मेट्रिक्स को अनुपलब्ध दिखाता है) |
| `inbound.enabled` | `false` | बाहरी एजेंट रनटाइम (OpenAI Agents SDK / CrewAI) के लिए stdio JSON-RPC इनबाउंड ब्रिज सक्षम करें; डिफ़ॉल्ट रूप से अक्षम (fail-closed) |
| `inbound.command` | *(कोई नहीं)* | बाहरी रनटाइम लॉन्च कमांड; सक्षम और मौजूद होने पर प्लगइन उसे spawn करता है और न्यूलाइन-डिलिमिटेड JSON-RPC सूचनाएँ सुनता है। अनुपस्थित/अस्पॉनेबल = ब्रिज निष्क्रिय रहता है (लॉग किया गया) |

## उपकरण और सतहें

| सतह | प्रकार | नोट्स |
|---|---|---|
| `background_agent` | टूल | टिकाऊ, जारी रहने योग्य चाइल्ड शुरू करें (label, `tool_filter`, `persona`, `max_depth`) |
| `bg_message` | टूल | agent id से चाइल्ड को बाद का टर्न पहुँचाएँ |
| `bg_list` | टूल | आपके एजेंटों की स्थिति (या `recursive: true` से वंशज ट्री) |
| `bg_result` | टूल | चाइल्ड का नवीनतम असिस्टेंट आउटपुट पाठ लें |
| `bg_stop` | टूल | वर्तमान टर्न की रुकावट का अनुरोध करें |
| `/room` | कमांड | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` / `room_post` / `room_read` | टूल | संदेश बस: सूची, पोस्ट (प्रसारण/निर्देशित), इतिहास पढ़ें |
| `room_list_tasks` / `room_create_task` / `room_claim_task` | टूल | साझा टास्क बोर्ड |
| `room_transfer_task` / `room_complete_task` | टूल | हैंडऑफ़ (अनुमोदन-गेटेड) और पूर्णता |
| `backgroundAgents` प्रोजेक्शन | सत्र प्रोजेक्शन | पैरेंट लॉग से मोड़ी गई डैशबोर्ड पंक्तियाँ |
| `teamRoom` प्रोजेक्शन | सत्र प्रोजेक्शन | `team-room/fact` ईवेंट से मोड़ी गई साझा टाइमलाइन |
| वेब साइडबार पैनल | क्लाइंट | लाइव स्थिति, जंप, संदेश, रोक, परिणाम झलक |

## यह कैसे काम करता है — और रीस्टार्ट के बाद क्यों बचा रहता है

सब कुछ आधिकारिक उप-एजेंट सीम पर चलता है: `startContinuable`, `followup`, `interrupt`, `listChildren` — प्लगइन अपना कोई लाइफ़साइकल रूटिंग नहीं करता, कभी किसी दूसरे सत्र के `Agent` को नहीं छूता, और कभी किसी प्रोसेस ट्री को नहीं मारता (रोक = *रुकावट का अनुरोध*; टियरडाउन कंटिन्यूएशन मैनेजर का काम है)।

प्लगइन हर तथ्य को **एक संरचित चैनल और एक मॉडल-दृश्य चैनल** के ज़रिए लिखता है:

- **`background-agents/fact` संरचित तथ्य ईवेंट** — पंजीकृत / संदेश / रोक / प्रगति / संग्रहीत तथ्य, पैरेंट लॉग में केवल-लॉग रिकॉर्ड के रूप में जोड़े जाते हैं और लिफ़ाफ़े का `ignorable: true` मार्कर रखते हैं; जो पाठक उस प्रकार को नहीं जानते वे लॉग को अस्वीकार करने के बजाय रिकॉर्ड छोड़ देते हैं। जिन होस्ट का `Session.append` मार्कर से पुराना है (`0.1.0-rc.8` तक की हर रिलीज़ rc लाइन और `0.1.1-rc` लाइन rc.2 तक उसे चुपचाप छोड़ देती है — मार्कर सुधार केवल master पर है — जिससे बिना मार्कर वाले सत्र सख्त बिल्ड पर अप्राप्य हो जाते हैं) उन्हें पहले append से पहले ही पहचान लिया जाता है (peer संस्करण पूर्व-जाँच + लौटे लिफ़ाफ़े की जाँच) और तथ्य append एक बार की चेतावनी के साथ छोड़ दिए जाते हैं — टिकाऊ स्टोर, सूचनाएँ और उपकरण चालू रहते हैं, प्रोजेक्शन खाली फोल्ड में डिग्रेड होते हैं।
- **`tool/result` रीप्ले मेटाडेटा** — संरचित चैनल से पहले लिखे गए लॉग में वही तथ्य (केवल तभी मोड़े जाते हैं जब किसी पंक्ति के पास कोई संरचित प्रोवेनेंस न हो)।
- **इंजेक्ट किए गए `user/message` नोटिस** (मॉडल-दृश्य), स्रोत `{ kind: 'plugin', plugin: 'dsh-background-agents' }` — थ्रॉटल्ड प्रगति पंक्तियाँ और संग्रह नोटिस (कैनोनिकल उपसर्ग `[background-agent <id>] …`)।
- **आधिकारिक `subagent-settled` नोटिस** — चाइल्ड का टिकाऊ "settled" तथ्य।
- टीम रूम वही अनुशासन दर्शाते हैं: हर डिलीवर किया गया रूम संदेश सदस्य के अपने लॉग में एक टिकाऊ `user/message` होता है, और साझा टाइमलाइन `team_rooms` स्टोरेज डोमेन में केवल-लॉग `team-room/fact` ईवेंट के रूप में प्रतिबिम्बित होती है।

`backgroundAgents` प्रोजेक्शन संरचित चैनल को मोड़ता है और पुराने फ़ोल्ड को बनाए रखता है; डैशबोर्ड मान और `bg_list` तथ्य हर बार खोलने पर मानव-पठनीय नोटिस पाठ को पार्स किए बिना फिर से बनते हैं। जब कैटलॉग स्वयं उपलब्ध न हो, तो `bg_list` एक स्पष्ट **`unrecoverable`** मार्कर लौटाता है — यह कभी खाली सूची नहीं गढ़ता।

## बिल्ट-इन उप-एजेंट टूल से इसका संबंध

harness कोर अपने स्वयं के उप-एजेंट टूल रखता है (`subagent`, `send_message`, `interrupt_agent` और चाइल्ड-साइड `report` टूल)। इस प्लगइन के `bg_*` टूल उनके **सत्र-स्कोप्ड साथी** हैं; दोनों को एक साथ माउंट किया जा सकता है:

| बिल्ट-इन टूल | यह प्लगइन | अंतर |
|---|---|---|
| `subagent` (`backgroundMode: 'continuable'`) | `background_agent` | वही `startContinuable` सीम; यह प्लगइन प्रति-चाइल्ड tool_filter/persona/max_depth सत्यापन और प्रति-सत्र सीमा जोड़ता है |
| `send_message` | `bg_message` | वही डिलीवरी सिमेंटिक्स; `bg_message` इस वार्तालाप के बैकग्राउंड एजेंटों को संबोधित करता है और प्रोजेक्शन तथ्य बनाए रखता है |
| `interrupt_agent` | `bg_stop` | वही रुकावट सिमेंटिक्स; `bg_stop` एक संरचित रोक तथ्य भी रिकॉर्ड करता है |
| चाइल्ड-साइड `report` टूल | autoReport | बिल्ट-इन को चाइल्ड मॉडल स्वयं कॉल करता है; यह प्लगइन **हर चाइल्ड टर्न के बाद स्वचालित रूप से** थ्रॉटल्ड प्रगति इंजेक्ट करता है |

कोर टूल में जो नहीं है: `bg_list`, `bg_result`, निष्क्रिय संग्रह, और प्रति-पैरेंट मोड़ा गया पैनल प्रोजेक्शन।

दायरे में नहीं: शेड्यूल्ड ट्रिगरिंग (शेड्यूल सीम मौजूद है), क्रॉस-मशीन/रिमोट एजेंट, और आधिकारिक उप-एजेंट एक्टिवेशन कॉन्ट्रैक्ट में कोई बदलाव।

## यह प्लगइन नहीं है

| प्रोजेक्ट | यह क्या करता है | सीमा |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | नए एजेंट सत्रों में शेड्यूल्ड कोडिंग कार्य | यह **कब** कार्य चलते हैं इसका मालिक है (शेड्यूलिंग)। यह प्लगइन एक लंबी वार्तालाप की **इंटरैक्टिव स्टीयरिंग** का मालिक है — कोई शेड्यूलर सीम नहीं, कोई cron नहीं। |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | बैकग्राउंड *जॉब* के लिए स्टेटस बार (प्रगति + आउटपुट टेल) | यह टूल-स्तर के जॉब **दिखाता** है। यह प्लगइन **एजेंट सत्र** बनाता और चलाता है; इसका डैशबोर्ड उसका एक पैनल है, उत्पाद नहीं। |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | मल्टी-एजेंट डैशबोर्ड स्किल | प्रदर्शन-उन्मुख। इस प्लगइन की पंक्तियाँ **कार्रवाई योग्य** हैं: चाइल्ड सत्र में जाएँ, संदेश भेजें, रोकें — आधिकारिक कंट्रोल प्लेन के ज़रिए। |

## अनुमतियाँ और डेटा

- **अनुमतियाँ**: workshop मेनिफ़ेस्ट `session:append`, `subagent:spawn` और `tools:register` घोषित करता है।
- **डेटा**: टीम रूम `team_rooms` स्टोरेज डोमेन (SQLite या JSONL — कोई अतिरिक्त सेवा नहीं) में रहते हैं; बैकग्राउंड-एजेंट तथ्य पैरेंट सत्र लॉग में रहते हैं। कोई अलग डेटाबेस नहीं, कोई नेटवर्क नहीं।
- **सत्र लॉग**: मार्कर का सम्मान करने वाले होस्ट पर `background-agents/fact` और `team-room/fact` ईवेंट लिफ़ाफ़े के `ignorable: true` मार्कर के साथ जोड़े जाते हैं (मार्कर से पहले के होस्ट पहचाने जाते हैं और append छोड़ दिए जाते हैं — देखें `allowUnmarkedFacts`); मॉडल-दृश्य प्रगति पंक्तियाँ और रूम डिलीवरी वास्तविक `user/message` रिकॉर्ड हैं।

## सुरक्षा सीमाएँ

- **केवल आधिकारिक सीम।** शुरुआत, संदेश और रोक `startContinuable` / `followup` / `interrupt` पर पतले एडाप्टर हैं; रोक रुकावट का अनुरोध करता है और कभी प्रक्रिया नहीं मारता।
- **`tool_filter` केवल सीमित करता है।** यह चाइल्ड की दृष्टि से टूल हटाता है — कभी नए नहीं देता; नाम `allowedChildTools` से सत्यापित होते हैं।
- **अनुमोदन-गेटेड हैंडऑफ़।** `room_transfer_task` आधिकारिक अनुमोदन सीम से गुजरता है और कोई answerer स्वीकृति न देने पर विफल-बंद होता है।
- **मॉडल-दृश्य ⟺ रिकॉर्डेड।** हर डिलीवर किया गया रूम संदेश सदस्य के अपने लॉग में एक टिकाऊ `user/message` है; साझा टाइमलाइन केवल-लॉग `team-room/fact` ईवेंट के रूप में प्रतिबिम्बित होती है।
- **कोई शेड्यूलिंग नहीं, कोई क्रॉस-मशीन एजेंट नहीं।** चाइल्ड डिप्लॉयमेंट के प्रोसेस-लोकल जारी सत्र हैं।

## क्रॉस-इकोसिस्टम इनबाउंड (P2)

बाहरी एजेंट रनटाइम — OpenAI Agents SDK, CrewAI और समान — एक **stdio पर न्यूलाइन-डिलिमिटेड JSON-RPC 2.0 ब्रिज** के ज़रिए टीम रूम में प्रकाशित कर सकते हैं (डायरेक्ट-कनेक्ट न्यूनतम सेट; पूर्ण ACP प्रोटोकॉल संगतता upstream सीम की प्रतीक्षा करती है)। `inbound.enabled` और `inbound.command` से सक्षम करें; रनटाइम प्रति पंक्ति एक JSON सूचना भेजता है जहाँ `method` ईवेंट है (`agent_started` बोर्ड पर कार्ड खोलता है, `agent_message` बस पर पोस्ट करता है, `agent_finished` कार्ड पूरा करता है)। अमान्य संदेश छोड़ दिए जाते हैं और JSON-RPC त्रुटि लौटाई जाती है; शुरुआत और रोक disposer से होती है।

## ज्ञात सीमाएँ

- टीम रूम को स्टोरेज डोमेन बने होने की आवश्यकता है; `@deepseek-ai/dsh-storage-domain` के बिना `/room` कमांड और `room_*` टूल अक्षम रहते हैं (पाँच `bg_*` टूल फिर भी लोड होते हैं)।
- `provider` को जारी-क्षम प्रदाता (`prepareContinuable`) नाम देना होगा; अनुपस्थित प्रदाता से `background_agent` तब तक विफल रहता है जब तक वह न आ जाए।
- `maxBackgroundAgents` सत्र के **हर** जारी प्रत्यक्ष चाइल्ड का साझा बजट है, जिसमें बिल्ट-इन `subagent` टूल से शुरू किए गए भी शामिल हैं।
- एक-बार के चाइल्ड कभी सूचीबद्ध या संदेशित नहीं होते — `bg_list` केवल जारी पंक्तियाँ रखता है।
- चाइल्ड प्रोसेस-लोकल होते हैं: शेड्यूल सीम "कब" का मालिक है, यह प्लगइन एक सक्रिय बातचीत चलाने का मालिक है।

## विकास

```sh
pnpm install        # केवल tooling; harness पैकेज किसी सह-चेकआउट के विरुद्ध हल होते हैं
pnpm run typecheck  # सख्त TS, node + client प्रोग्राम
pnpm test           # vitest: यूनिट + एंड-टू-एंड परीक्षण (वास्तविक उप-एजेंट सीम, स्क्रिप्टेड LLM, jsdom पैनल)
pnpm run build      # lib/index.js (node आधा) + lib/client.js (वेब क्लाइंट बंडल)
pnpm run gen-aliases  # चेकआउट हिलने के बाद harness पैकेज पथ फिर मैप करें
```

एक बिना-कुंजी एंड-टू-एंड डेमो एक वास्तविक पैरेंट सत्र और एक बैकग्राउंड चाइल्ड को एक नियतात्मक स्क्रिप्टेड LLM के ज़रिए चलाता है (कोई API key नहीं; `dev/` gitignore में है — पथों को अपने checkout के अनुसार बदलें):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "【父会话】驱动后台 agent 演示"
```

## विषय

`dsh`, `dsh-plugin`, `deepseek-harness`, `subagent`, `background-agent`, `background-agents`, `agent-dashboard`, `conversation-steering`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`

## योगदानकर्ता

- [@PerryLink](https://github.com/PerryLink) — निर्माता और अनुरक्षक: आधिकारिक उप-एजेंट सीम पर बैकग्राउंड-एजेंट रनटाइम, टीम-रूम हब, वेब UI साइडबार पैनल, सत्र प्रोजेक्शन, दस्तावेज़, CI/CD और रिलीज़।

## PerryLink DSH प्लगइन परिवार

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) द्वारा अनुरक्षित [33 DeepSeek Harness प्लगइनों](https://github.com/PerryLink) में से एक है। अगर यह आपकी मदद करता है, तो बाकी भी करेंगे:

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | अनुमोदन श्रृंखला पर द्वितीय-मॉडल स्वतः-समीक्षा, डिफ़ॉल्ट रूप से विफल-बंद | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | DeepSeek Harness के लिए लागत प्रशासन: बजट, कार्बन और विलंबता एक पैनल में। | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Claude Code /rewind-समतुल्य: स्नैपशॉट, सत्र फ़ॉर्क, एक-बार पुनर्स्थापना | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | Claude Code सत्र, मेमोरी, कौशल और CLAUDE.md को DSH में स्थानांतरित करें | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | DeepSeek Harness के लिए क्रॉस-प्लेटफ़ॉर्म नेटिव डेस्कटॉप नियंत्रण — Windows पहले। | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | वेब कंपोज़र के लिए टर्मिनल-शैली इनपुट इतिहास: तीर, Ctrl+R खोज | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | डेटासेट गुणवत्ता जाँच व उद्धरण सत्यापन (यहाँ उपभोग किया गया वैकल्पिक संख्या-सेतु) | |
| **[dsh-dsh-defend](https://github.com/PerryLink/dsh-dsh-defend)** | DeepSeek Harness के लिए प्रॉम्प्ट-इंजेक्शन, जेलब्रेक और सीक्रेट-लीक रक्षा। | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | इंजीनियरिंग-अनुशासन रक्षक: आवश्यकताओं की पूछताछ, परीक्षण द्वार, प्रतिद्वंद्वी समीक्षा | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | DeepSeek Harness के लिए एकीकृत स्थैतिक-छवि निर्माण रूटिंग। | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | DeepSeek Harness के लिए रीड-ओनली प्रदर्शन डायग्नोस्टिक्स। | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | चीनी सार्वजनिक म्यूचुअल फंड के लिए नियतात्मक अनुसंधान रिपोर्ट | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | DSH के लिए GitHub PR/issues एकीकरण, हर लेखन अनुमोदन-द्वारित | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | उद्योग-अनुसंधान ऑर्केस्ट्रेशन जो इस प्लगिन के `ctx.researchReport.assemble` से डिलीवरेबल सील करता है | |
| **[dsh-dsh-library](https://github.com/PerryLink/dsh-dsh-library)** | DeepSeek Harness के लिए स्थानीय दस्तावेज़ ज्ञानकोश। | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | DeepSeek Harness के लिए स्थानीय-मॉडल (Ollama) एकीकरण। | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | भाषा सर्वरों पर LSP निदान, फ़ॉर्मेटिंग, पूर्णता, कोड क्रियाएँ और नाम बदलना | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | PII मास्किंग मिडलवेयर: मॉडल सीमा पर अनाम करें, डिस्प्ले लेयर पर पुनर्स्थापित करें | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | केवल-पढ़ने वाला MCP रनटाइम पैनल: /mcp कमांड + स्थिति, टूल और त्रुटियों वाला Settings टैब | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | अनुमोदन-द्वारित क्रॉस-सत्र मेमोरी: ctx.memory सीम + SQLite + मेमोरी टूल | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | DeepSeek Harness के लिए OpenTelemetry और Langfuse अवलोकनीयता निर्यातक। | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Claude Code outputStyles-समतुल्य रनटाइम शैली बदलाव | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | ऑडिट के साथ Claude Code-शैली घोषणात्मक allow/deny/ask अनुमति नियम | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | माँग पर एजेंट कौशल के रूप में प्लगइन-विकास ज्ञान आधार | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | सामग्री-पता साक्ष्य और सीलबंद संस्करणों वाला सत्यापन-योग्य अनुसंधान-रिपोर्ट इंजन | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | DeepSeek Harness प्लगिनों की बहु-आयामी गुणवत्ता स्कोरिंग। | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | टिकाऊ क्रम के साथ वेब साइडबार में सत्र पिन करें | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | DeepSeek Harness के लिए क्रॉस-डिवाइस सत्र सिंक — आपके सत्र स्टोर का एक समर्पित git मिरर। | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | सुरक्षा-ऑडिट कौशल पैक: गुप्त स्कैन, निर्भरता और आपूर्ति-श्रृंखला समीक्षा | |
| **[dsh-dsh-talk](https://github.com/PerryLink/dsh-dsh-talk)** | DeepSeek Harness के लिए आवाज़-प्रथम सत्र लूप: बोलें और उत्तर सुनें। | |
| **[dsh-dsh-test-drive](https://github.com/PerryLink/dsh-dsh-test-drive)** | DeepSeek Harness प्लगिनों के लिए पृथक इंस्टॉल-एंड-स्मोक टेस्ट ड्राइव। | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | DeepSeek Harness के लिए वेंडर पैरामीटर अनुवाद और नियतात्मक JSON मरम्मत। | |

## लाइसेंस

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors
