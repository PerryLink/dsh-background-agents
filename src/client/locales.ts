/** `background-agents` namespace dictionaries. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'background-agents'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'trigger.label': '后台 agent',
  'trigger.aria': '查看后台 agent',
  'panel.title': '后台 agent',
  'panel.empty': '暂无后台 agent —— 用 background_agent 工具启动一个',
  'status.running': '运行中',
  'status.idle': '待命',
  'status.settled': '已结束',
  'status.archived': '已归档',
  'row.open': '打开会话',
  'row.stop': '停止',
  'row.message': '发消息',
  'row.messages': '{n} 条消息',
  'message.placeholder': '发给该 agent 的消息…',
  'message.send': '发送',
  'message.cancel': '取消',
  'time.now': '刚刚',
  'time.minutes': '{n} 分钟前',
  'time.hours': '{n} 小时前',
  'time.days': '{n} 天前',
  'time.months': '{n} 个月前',
  'time.years': '{n} 年前',
} as const

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<BackgroundAgentsKey, string> = {
  'trigger.label': 'Background agents',
  'trigger.aria': 'View background agents',
  'panel.title': 'Background agents',
  'panel.empty': 'No background agents — start one with the background_agent tool',
  'status.running': 'running',
  'status.idle': 'idle',
  'status.settled': 'settled',
  'status.archived': 'archived',
  'row.open': 'Open',
  'row.stop': 'Stop',
  'row.message': 'Message',
  'row.messages': '{n} messages',
  'message.placeholder': 'Message for this agent…',
  'message.send': 'Send',
  'message.cancel': 'Cancel',
  'time.now': 'now',
  'time.minutes': '{n}m ago',
  'time.hours': '{n}h ago',
  'time.days': '{n}d ago',
  'time.months': '{n}mo ago',
  'time.years': '{n}y ago',
}

/** Key domain of the `background-agents` namespace (zh is the source of truth). */
export type BackgroundAgentsKey = keyof typeof zh
