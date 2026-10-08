import { z } from "zod";
import { TIME_CONTROL_IDS, type TimeControlId } from "../constants";

const square = z.string().regex(/^[a-h][1-8]$/, "Invalid square");

export const moveInputSchema = z.object({
  from: square,
  to: square,
  promotion: z.enum(["q", "r", "b", "n"]).optional(),
});

export const makeMoveSchema = z.object({
  gameId: z.string().min(1),
  move: moveInputSchema,
});

export const gameIdSchema = z.object({
  gameId: z.string().min(1),
});

export const joinQueueSchema = z.object({
  timeControl: z.enum(TIME_CONTROL_IDS as [TimeControlId, ...TimeControlId[]]),
});

export type MakeMovePayload = z.infer<typeof makeMoveSchema>;
export type GameIdPayload = z.infer<typeof gameIdSchema>;
export type JoinQueuePayload = z.infer<typeof joinQueueSchema>;
