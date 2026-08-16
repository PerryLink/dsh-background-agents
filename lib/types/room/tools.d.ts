/**
 * The eight room tools the model calls inside a member session:
 * `room_list_rooms`, `room_post`, `room_read`, `room_list_tasks`,
 * `room_create_task`, `room_claim_task`, `room_transfer_task`,
 * `room_complete_task`. Every tool authorizes against the calling session's
 * membership; the cross-member handoff (`room_transfer_task`) routes through
 * the official approval seam and fails closed when no answerer grants it.
 *
 * @module dsh-background-agents/room/tools
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { CallId } from '@deepseek-ai/dsh-llm';
import { type RoomHub } from './hub.ts';
/** The approval seam face the tools ask through (optional in the composition). */
export interface ApprovalLike {
    request(req: {
        readonly agent: Agent;
        readonly toolName: string;
        readonly callId?: CallId;
        readonly reason?: string;
        readonly signal?: AbortSignal;
    }): Promise<'allowed-once' | 'rejected' | 'cancelled' | 'unavailable'>;
}
/**
 * Register the eight room tools.
 * @param ctx - context carrying tools and the optional approval service.
 * @param hub - the room service owning the durable state.
 */
export declare function registerRoomTools(ctx: Context, hub: RoomHub): void;
//# sourceMappingURL=tools.d.ts.map