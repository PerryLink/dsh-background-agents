/**
 * RoomHub: the host-side service behind team rooms. It opens the
 * `team_rooms` storage domain, owns every room mutation (membership, the
 * message bus, the task board, the timeline), and drives delivery:
 *
 * - every write queues on ONE hub chain (the domain's single write chain is
 *   the ordering authority — concurrent posters cannot interleave a
 *   read-modify-write, and bus seqs mint strictly in commit order);
 * - model-visible delivery goes through the official inbox
 *   (`agent.followup` wakes live members; offline members receive their
 *   backlog through `agent.inject` when their session next starts), so every
 *   model-visible room message is a durable `user/message` event in the
 *   member's own session log — model-visible ⟺ recorded;
 * - the shared timeline mirrors into every member's log as log-only
 *   `team-room/fact` events (ignorable), so the `teamRoom` projection
 *   reconstructs the room view from each member's own durable log;
 * - per-member delivery is at-least-once and ordered: a crash between bus
 *   commit and delivery re-delivers on catch-up (the cursor only advances
 *   after delivery), and per-member chains serialize delivery order.
 *
 * @module dsh-background-agents/room/hub
 */
import { Context, Service } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { SessionId, type Session } from '@deepseek-ai/dsh-session';
import { type BusMessage, type RoomMember, type RoomRecord, type TaskRecord, type TimelineEvent } from './schema.js';
import type { FactAppender } from '../facts.js';
/** Tunables the room feature honors; every threshold is a validated Config field. */
export interface RoomConfig {
    /** Hard cap on rooms across the profile. */
    readonly maxRooms: number;
    /** Hard cap on members per room. */
    readonly maxMembersPerRoom: number;
    /** Hard cap on rooms one member session may join. */
    readonly maxRoomsPerMember: number;
    /** Bus entries kept per room (the message retention window). */
    readonly busRetention: number;
    /** Timeline entries kept per room. */
    readonly timelineRetention: number;
    /** Completed tasks kept per room (older `done` rows are pruned). */
    readonly taskRetention: number;
    /** Hard cap on one bus message's text (rejected above, never truncated). */
    readonly maxMessageChars: number;
    /** Inject the short room brief into member sessions (join + resume). */
    readonly injectRoomBrief: boolean;
    /**
     * How long the `team_rooms` storage-domain open may take before every
     * room operation fails loud (`store-unavailable`) instead of hanging
     * forever (a stuck storage provider used to leave `/room` commands
     * without a `command/done`).
     */
    readonly roomOpenTimeoutMs: number;
}
/** A domain-level rejection with a stable code; tools and commands render it. */
export declare class RoomError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
/** Read face of the live agent registry (kept narrow for tests). */
export interface LiveAgents {
    get(id: SessionId): Agent | undefined;
}
/** Read face of the live session store (kept narrow for tests). */
export interface LiveSessions {
    get(id: SessionId): Session | undefined;
}
/** Bus record the hub mints from a committed post. */
export interface PostedMessage {
    readonly roomId: string;
    readonly seq: number;
    readonly senderSessionId: string;
    readonly toSessionId?: string;
    readonly text: string;
    readonly createdAt: number;
}
/**
 * The team-room service. Constructed in apply() with the validated room
 * policy once the storage domain is available; {@link open} opens the
 * `team_rooms` storage domain and the owning fiber closes it.
 */
export declare class RoomHub extends Service {
    private readonly config;
    private readonly agents;
    private readonly sessions;
    private readonly facts;
    private rooms?;
    private bus?;
    private tasks?;
    private timeline?;
    /** One write chain: every mutation (create/join/post/task) queues here. */
    private tail;
    /** Per-room delivery chains: posts to one room serialize delivery order. */
    private readonly roomChains;
    /** Per-member delivery chains: live delivery and catch-up never interleave. */
    private readonly memberChains;
    /** Resolves once the storage domain is open (or failed); gates every operation. */
    private readonly ready;
    private readyResolve;
    private initError;
    constructor(ctx: Context, config: RoomConfig, agents: LiveAgents, sessions: LiveSessions, facts: FactAppender);
    /**
     * Open the `team_rooms` storage domain and load its four tables. Called
     * once by the mount site after the storage domain becomes available; every
     * hub operation gates on this resolution. A failed open fails every
     * operation loud through {@link requireRooms} instead of hanging — and a
     * STUCK open (a storage provider whose open promise never settles) is cut
     * off by the `roomOpenTimeoutMs` timer so `/room` commands still settle
     * with a `store-unavailable` error instead of never emitting
     * `command/done`.
     */
    open(): Promise<void>;
    /** One room record, or undefined. */
    room(roomId: string): Promise<RoomRecord | undefined>;
    /** Every room one session is a member of, in creation order. */
    roomsOfMember(sessionId: SessionId): Promise<RoomRecord[]>;
    /** All rooms (used by the command surface for the roster). */
    allRooms(): Promise<RoomRecord[]>;
    /** Bus messages of one room with seq > since, in seq order. */
    busMessages(roomId: string, since?: number): Promise<BusMessage[]>;
    /** The task board of one room, creation order. */
    tasksOf(roomId: string): Promise<TaskRecord[]>;
    /** The timeline of one room with seq > since, in seq order. */
    timelineOf(roomId: string, since?: number): Promise<TimelineEvent[]>;
    /** The member slot of one session in one room, or undefined. */
    memberOf(room: RoomRecord, sessionId: SessionId): RoomMember | undefined;
    /**
     * Create one room; the creator becomes its owner member. Enforces the
     * profile-wide `maxRooms` cap inside the write chain.
     */
    createRoom(sessionId: SessionId, name: string, now?: number): Promise<RoomRecord>;
    /**
     * Register one session as a member of an existing room (cross-session
     * membership). Enforces the per-room and per-member caps inside the chain.
     */
    joinRoom(sessionId: SessionId, roomId: string, now?: number): Promise<RoomRecord>;
    /** Remove one member. The owner leaving deletes the room. */
    leaveRoom(sessionId: SessionId, roomId: string, now?: number): Promise<RoomRecord | undefined>;
    /** Owner-only room deletion. */
    deleteRoom(sessionId: SessionId, roomId: string): Promise<void>;
    /**
     * Post one message onto the bus: broadcast, or directed when `toSessionId`
     * names a member. Runs on the per-room delivery chain so per-member
     * delivery order always equals bus seq order, and commits the store write
     * before any delivery (cursors advance only after delivery — at-least-once).
     */
    postMessage(input: {
        readonly roomId: string;
        readonly senderSessionId: SessionId;
        readonly text: string;
        readonly toSessionId?: SessionId;
    }, now?: number): Promise<PostedMessage>;
    /** Create a task on the board (assignee optional; default unassigned). */
    createTask(input: {
        readonly roomId: string;
        readonly bySessionId: SessionId;
        readonly title: string;
        readonly description?: string;
        readonly assigneeSessionId?: SessionId;
    }, now?: number): Promise<TaskRecord>;
    /** Claim a task for the calling member (in-progress + assignee). */
    claimTask(input: {
        readonly roomId: string;
        readonly bySessionId: SessionId;
        readonly taskId: string;
    }, now?: number): Promise<TaskRecord>;
    /**
     * Hand a task to another member. Callers outside a tool (the /room command)
     * are the user themselves; the room_transfer_task TOOL gates this same
     * mutation behind the approval service.
     */
    assignTask(input: {
        readonly roomId: string;
        readonly bySessionId: SessionId;
        readonly taskId: string;
        readonly toSessionId: SessionId;
    }, now?: number): Promise<TaskRecord>;
    /** Complete a task (done). Only the assignee or the owner may complete it. */
    completeTask(input: {
        readonly roomId: string;
        readonly bySessionId: SessionId;
        readonly taskId: string;
    }, now?: number): Promise<TaskRecord>;
    /**
     * Deliver everything a member missed while offline: the log-only facts
     * (shared timeline) and the model-visible bus backlog, both in store order.
     * Runs on the member's delivery chain so a live post cannot interleave.
     * Idempotent: cursors make a second call a no-op.
     */
    catchUp(sessionId: SessionId): Promise<void>;
    /**
     * The member brief: a SHORT injected paragraph that starts with the
     * one-line role statement (Minimal-persona style) and names the room id,
     * the member count, and the collaboration tools. Injected on join and on
     * every session start (resume included), as a durable user message — the
     * member's model sees exactly what the member's log records.
     */
    injectBrief(sessionId: SessionId, room: RoomRecord): void;
    /** Build the minimal brief paragraph for one room. */
    briefText(room: RoomRecord): string;
    /**
     * Queue one mutation on the single write chain; rejections are contained.
     * The previous tail is captured SYNCHRONOUSLY: reading `this.tail` after
     * `ready` resolves would see the just-assigned tail (a promise that settles
     * with this very result) and deadlock the whole write chain — the exact
     * hang that left `/room create` without a `command/done`.
     */
    private enqueue;
    /** Serialize work per room (delivery order = bus order). */
    private onRoomChain;
    /** Serialize delivery per member (live delivery vs catch-up). */
    private onMemberChain;
    /** One task-board mutation shared by claim/assign/complete. */
    private mutateTask;
    /** Append the room-joined snapshot fact to one session's live log. */
    private appendFactTo;
    /** Append one fact to every LIVE member session (offline members catch up). */
    private broadcastFact;
    /** Deliver one posted message's fact + model-visible copy, per member. */
    private deliverPosted;
    /** Advance delivery cursors for the members that just received the post. */
    private advanceCursors;
    /** Advance the fact cursor for every member whose session is live now. */
    private advanceFactsForLive;
    /** One model-visible delivery: a durable user message with a room header. */
    private roomUserMessage;
    /** The room-joined snapshot fact. */
    private joinFact;
    /** Rebuild the fact one timeline event corresponds to (catch-up replay). */
    private factFromTimeline;
    private taskCreatedFact;
    private taskMutationFact;
    private timelineEvent;
    /** Retention pruning: bus, timeline, and completed tasks. */
    private pruneRoom;
    /** Delete every bus/task/timeline row of a deleted room. */
    private purgeRoom;
    private requireRoom;
    private requireRooms;
    private requireBus;
    private requireTasks;
    private requireTimeline;
}
//# sourceMappingURL=hub.d.ts.map