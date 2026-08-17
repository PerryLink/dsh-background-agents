<div align="center">

# 👥 dsh-background-agents

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
| Harness | DeepSeek Harness `0.1.0-rc.6` (peers `>=0.1.0-rc.5 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| प्लेटफ़ॉर्म | सभी (होस्ट टूल; स्टोरेज-डोमेन क्षमता के ज़रिए वैकल्पिक वेब साइडबार पैनल और टीम रूम) |
| मॉडल | कोई भी (चाइल्ड पैरेंट का मार्ग लेते हैं; `childProvider`/`childModel` उसे बदलते हैं) |

## आपको क्या मिलता है

`dsh-background-agents` DSH के फायर-एंड-फॉरगेट बैकग्राउंड *जॉब* को दो समन्वित सतहों में बदल देता है:

1. **पाँच स्टीयरिंग टूल** — `background_agent` आधिकारिक उप-एजेंट सीम पर एक टिकाऊ, जारी रहने योग्य चाइल्ड शुरू करता है (वैकल्पिक `tool_filter`, `persona`, `max_depth`, मॉडल मार्ग); `bg_message` बाद का टर्न पहुँचाता है; `bg_list` स्थिति (या वंशज ट्री) बताता है; `bg_result` नवीनतम परिणाम पाठ पढ़ता है; `bg_stop` रुकावट का अनुरोध करता है।
2. **प्रगति और संग्रह** — `autoReport` हर चाइल्ड टर्न के बाद एक थ्रॉटल्ड प्रगति पंक्ति इंजेक्ट करता है; निष्क्रियता स्वीप शांत चाइल्ड को संग्रहीत करता है और `bg_message` उन्हें फिर जगा देता है।
3. **डैशबोर्ड प्रोजेक्शन + वेब पैनल** — `backgroundAgents` सत्र प्रोजेक्शन पैरेंट लॉग को पंक्तियों में मोड़ता है; एक साइडबार पैनल लाइव स्थिति, जंप, संदेश, रोक और परिणाम झलक दिखाता है।
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

बंडल पैच प्लगइन पंक्ति रखता है; `provider` अनिवार्य है। रेपो अपना बिल्ड आउटपुट (`lib/`) कमिट करता है, इसलिए git इंस्टॉल को बिल्ड चरण की आवश्यकता नहीं होती। टीम रूम वहीं माउंट होते हैं जहाँ स्टोरेज डोमेन (`@deepseek-ai/dsh-storage-domain`) बना हो; पाँच `bg_*` टूल इसके बिना भी काम करते हैं।

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

## उपकरण और सतहें

| सतह | प्रकार | नोट्स |
|---|---|---|
| `background_agent` | टूल | टिकाऊ, जारी रहने योग्य चाइल्ड शुरू करें (label, `tool_filter`, `persona`, `max_depth`) |
| `bg_message` | टूल | agent id से चाइल्ड को बाद का टर्न पहुँचाएँ |
| `bg_list` | टूल | आपके एजेंटों की स्थिति (या `recursive: true` से ट्री) |
| `bg_result` | टूल | चाइल्ड का नवीनतम असिस्टेंट आउटपुट पाठ लें |
| `bg_stop` | टूल | वर्तमान टर्न की रुकावट का अनुरोध करें |
| `/room` | कमांड | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` / `room_post` / `room_read` | टूल | संदेश बस: सूची, पोस्ट (प्रसारण/निर्देशित), इतिहास पढ़ें |
| `room_list_tasks` / `room_create_task` / `room_claim_task` | टूल | साझा टास्क बोर्ड |
| `room_transfer_task` / `room_complete_task` | टूल | हैंडऑफ़ (अनुमोदन-गेटेड) और पूर्णता |
| `backgroundAgents` प्रोजेक्शन | सत्र प्रोजेक्शन | पैरेंट लॉग से मोड़ी गई डैशबोर्ड पंक्तियाँ |
| `teamRoom` प्रोजेक्शन | सत्र प्रोजेक्शन | `team-room/fact` ईवेंट से मोड़ी गई साझा टाइमलाइन |
| वेब साइडबार पैनल | क्लाइंट | लाइव स्थिति, जंप, संदेश, रोक, परिणाम झलक |

## अनुमतियाँ और डेटा

- **अनुमतियाँ**: workshop मेनिफ़ेस्ट `session:append`, `subagent:spawn` और `tools:register` घोषित करता है।
- **डेटा**: टीम रूम `team_rooms` स्टोरेज डोमेन (SQLite या JSONL — कोई अतिरिक्त सेवा नहीं) में रहते हैं; बैकग्राउंड-एजेंट तथ्य पैरेंट सत्र लॉग में रहते हैं। कोई अलग डेटाबेस नहीं, कोई नेटवर्क नहीं।
- **सत्र लॉग**: `background-agents/fact` और `team-room/fact` ईवेंट लिफ़ाफ़े के `ignorable: true` मार्कर के साथ जोड़े जाते हैं; मॉडल-दृश्य प्रगति पंक्तियाँ और रूम डिलीवरी वास्तविक `user/message` रिकॉर्ड हैं।

## सुरक्षा सीमाएँ

- **केवल आधिकारिक सीम।** शुरुआत, संदेश और रोक `startContinuable` / `followup` / `interrupt` पर पतले एडाप्टर हैं; रोक रुकावट का अनुरोध करता है और कभी प्रक्रिया नहीं मारता।
- **`tool_filter` केवल सीमित करता है।** यह चाइल्ड की दृष्टि से टूल हटाता है — कभी नए नहीं देता; नाम `allowedChildTools` से सत्यापित होते हैं।
- **अनुमोदन-गेटेड हैंडऑफ़।** `room_transfer_task` आधिकारिक अनुमोदन सीम से गुजरता है और कोई answerer स्वीकृति न देने पर विफल-बंद होता है।
- **मॉडल-दृश्य ⟺ रिकॉर्डेड।** हर डिलीवर किया गया रूम संदेश सदस्य के अपने लॉग में एक टिकाऊ `user/message` है; साझा टाइमलाइन केवल-लॉग `team-room/fact` ईवेंट के रूप में प्रतिबिम्बित होती है।
- **कोई शेड्यूलिंग नहीं, कोई क्रॉस-मशीन एजेंट नहीं।** चाइल्ड डिप्लॉयमेंट के प्रोसेस-लोकल जारी सत्र हैं।

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

## विषय

`dsh`, `dsh-plugin`, `deepseek-harness`, `subagent`, `background-agent`, `background-agents`, `agent-dashboard`, `conversation-steering`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`

## योगदानकर्ता

- [@PerryLink](https://github.com/PerryLink) — निर्माता और अनुरक्षक: आधिकारिक उप-एजेंट सीम पर बैकग्राउंड-एजेंट रनटाइम, टीम-रूम हब, वेब साइडबार पैनल, सत्र प्रोजेक्शन, दस्तावेज़, CI/CD और रिलीज़।

## लाइसेंस

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors
