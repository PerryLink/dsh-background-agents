/**
 * The human-facing `/room` command family: create, join, leave, list, send,
 * tasks, and the task board subcommands (add / assign / claim / done). The
 * command executes directly against the receiving session's agent — it never
 * goes through the model — and every write lands on the shared durable room
 * store. Because the human typed the command, command-side handoffs are
 * already user-authorized (the model-facing `room_transfer_task` tool is
 * what routes through the approval seam).
 *
 * @module dsh-background-agents/room/commands
 */
import type { Context } from '@deepseek-ai/cordis';
import { type RoomHub } from './hub.ts';
/**
 * Register the `/room` command when the harness composes the command
 * registry. The handler runs outside any model turn, so it performs the
 * mutations directly (the typing user is the authorizer). The command surface
 * is optional: without it the room_* tools still work from the model side.
 * @returns the exact command disposer, or undefined when no command registry
 *   is composed.
 */
export declare function registerRoomCommand(ctx: Context, hub: RoomHub): (() => void) | undefined;
//# sourceMappingURL=commands.d.ts.map