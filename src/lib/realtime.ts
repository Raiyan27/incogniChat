import { InferRealtimeEvents, Realtime } from "@upstash/realtime";
import z from "zod";
import { redis } from "./redis";

const reaction = z.object({
  emoji: z.string(),
  users: z.array(z.string()),
});

const message = z.object({
  id: z.string(),
  sender: z.string(),
  text: z.string(),
  timestamp: z.number(),
  roomId: z.string(),
  token: z.string().optional(),
  reactions: z.array(reaction).optional(),
});

const schema = {
  chat: {
    message,
    destroy: z.object({
      isDestroyed: z.literal(true),
    }),
    reaction: z.object({
      messageId: z.string(),
      emoji: z.string(),
      username: z.string(),
    }),
  },
};

export const realtime = new Realtime({ schema, redis });
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;
export type Message = z.infer<typeof message>;
export type Reaction = z.infer<typeof reaction>;
