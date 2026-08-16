/** `teamRooms` namespace dictionaries (the settings page panel copy). */
/** Dictionary namespace owned by the room panel. */
export declare const ROOM_NS = "teamRooms";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    readonly nav: "团队房间";
    readonly title: "团队房间";
    readonly intro: "跨会话的持久多 agent 协作：成员注册、消息总线、共享任务板与时间线。状态存在本地存储层（SQLite/JSONL），DSH 重启后自动恢复。";
    readonly noSession: "暂无活动会话。打开一个会话后再管理团队房间。";
    readonly empty: "本会话尚未加入任何团队房间。创建一个房间，或粘贴其它会话分享的房间 id 加入。";
    readonly create: "创建房间";
    readonly createPlaceholder: "房间名称…";
    readonly createAction: "创建";
    readonly join: "加入房间";
    readonly joinPlaceholder: "房间 id…";
    readonly joinAction: "加入";
    readonly roomId: "房间 id";
    readonly copy: "复制";
    readonly copied: "已复制";
    readonly members: "成员";
    readonly owner: "房主";
    readonly member: "成员";
    readonly live: "在线";
    readonly offline: "离线";
    readonly tasks: "任务板";
    readonly tasksEmpty: "暂无任务 —— 用 /room task add 或 room_create_task 添加。";
    readonly taskAddPlaceholder: "新任务标题…";
    readonly taskAdd: "添加";
    readonly claim: "认领";
    readonly assign: "交接";
    readonly assignTo: "成员 id 或 me";
    readonly assignAction: "确定";
    readonly done: "完成";
    readonly unassigned: "未分配";
    readonly statusTodo: "待办";
    readonly statusInProgress: "进行中";
    readonly statusDone: "完成";
    readonly timeline: "时间线";
    readonly timelineEmpty: "暂无事件。";
    readonly timelineMessage: "{sender} 广播：{text}";
    readonly timelineDirected: "{sender} → {to}：{text}";
    readonly timelineMemberJoined: "{member} 加入了房间";
    readonly timelineMemberLeft: "{member} 离开了房间";
    readonly timelineTaskCreated: "创建任务「{title}」";
    readonly timelineTaskClaimed: "{member} 认领了任务";
    readonly timelineTaskAssigned: "任务交接给 {member}";
    readonly timelineTaskCompleted: "任务完成";
    readonly timelineRoomCreated: "{member} 创建了房间";
    readonly timelineUnknown: "事件 #{seq}";
    readonly message: "发消息";
    readonly messagePlaceholder: "广播给所有成员…";
    readonly send: "发送";
    readonly error: "操作失败";
    readonly busy: "处理中…";
    readonly leave: "离开房间";
};
/** English dictionary, key-identical to the Chinese source of truth. */
export declare const en: Record<TeamRoomsKey, string>;
/** The `teamRooms` namespace key union. */
export type TeamRoomsKey = keyof typeof zh;
//# sourceMappingURL=room-locales.d.ts.map