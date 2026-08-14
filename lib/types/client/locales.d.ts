/** `background-agents` namespace dictionaries. */
/** Dictionary namespace owned by this plugin. */
export declare const NS = "background-agents";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    readonly 'trigger.label': "后台 agent";
    readonly 'trigger.aria': "查看后台 agent";
    readonly 'panel.title': "后台 agent";
    readonly 'panel.empty': "暂无后台 agent —— 用 background_agent 工具启动一个";
    readonly 'status.running': "运行中";
    readonly 'status.idle': "待命";
    readonly 'status.settled': "已结束";
    readonly 'status.archived': "已归档";
    readonly 'row.open': "打开会话";
    readonly 'row.stop': "停止";
    readonly 'row.message': "发消息";
    readonly 'row.messages': "{n} 条消息";
    readonly 'message.placeholder': "发给该 agent 的消息…";
    readonly 'message.send': "发送";
    readonly 'message.cancel': "取消";
    readonly 'time.now': "刚刚";
    readonly 'time.minutes': "{n} 分钟前";
    readonly 'time.hours': "{n} 小时前";
    readonly 'time.days': "{n} 天前";
    readonly 'time.months': "{n} 个月前";
    readonly 'time.years': "{n} 年前";
};
/** English dictionary, key-identical to the Chinese source of truth. */
export declare const en: Record<BackgroundAgentsKey, string>;
/** Key domain of the `background-agents` namespace (zh is the source of truth). */
export type BackgroundAgentsKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map