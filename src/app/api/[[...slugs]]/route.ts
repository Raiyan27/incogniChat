import { redis } from "@/lib/redis";
import { Elysia } from "elysia";
import { nanoid } from "nanoid";
import { authMiddleware } from "./auth";
import z from "zod";
import { Message, realtime } from "@/lib/realtime";

const ROOM_TTL_SECONDS = 60 * 20; // 20 mins

const rooms = new Elysia({ prefix: "/room" })
  .post("/create", async () => {
    const roomId = nanoid();
    await redis.hset(`meta:${roomId}`, {
      connected: [],
      createdAt: Date.now(),
    });

    await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS);

    return { roomId };
  })
  .use(authMiddleware)
  .get(
    "/ttl",
    async ({ auth }) => {
      const ttl = await redis.ttl(`meta:${auth.roomId}`);
      return { ttl: ttl > 0 ? ttl : 0 };
    },
    { query: z.object({ roomId: z.string() }) }
  )
  .delete(
    "/",
    async ({ auth }) => {
      await realtime
        .channel(auth.roomId)
        .emit("chat.destroy", { isDestroyed: true });
      await Promise.all([
        redis.del(auth.roomId),
        redis.del(`meta:${auth.roomId}`),
        redis.del(`messages:${auth.roomId}`),
      ]);
    },
    {
      query: z.object({ roomId: z.string() }),
    }
  );

const messages = new Elysia({ prefix: "messages" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, auth }) => {
      const { sender, text } = body;
      const { roomId } = auth;

      const roomExists = redis.exists(`meta:${roomId}`);

      if (!roomExists) {
        throw new Error("Room does not exist");
      }

      const message: Message = {
        id: nanoid(),
        sender,
        text,
        timestamp: Date.now(),
        roomId,
        reactions: [],
        readBy: [],
      };

      await redis.rpush(`messages:${roomId}`, {
        ...message,
        token: auth.token,
      });
      await realtime.channel(roomId).emit("chat.message", message);

      const remaining = await redis.ttl(`meta:${roomId}`);

      await Promise.all([
        redis.expire(`messages:${roomId}`, remaining),
        redis.expire(`history:${roomId}`, remaining),
        redis.expire(roomId, remaining),
      ]);
    },
    {
      query: z.object({
        roomId: z.string(),
      }),
      body: z.object({
        sender: z.string().max(100),
        text: z.string().max(1000),
      }),
    }
  )
  .get(
    "/",
    async ({ auth }) => {
      const messages = await redis.lrange<Message>(
        `messages:${auth.roomId}`,
        0,
        -1
      );

      return {
        messages: messages.map((m) => ({
          ...m,
          token: m.token === auth.token ? auth.token : undefined,
        })),
      };
    },
    {
      query: z.object({
        roomId: z.string(),
      }),
    }
  )
  .post(
    "/react",
    async ({ body, auth }) => {
      const { messageId, emoji, username } = body;
      const { roomId } = auth;

      const messages = await redis.lrange<Message>(`messages:${roomId}`, 0, -1);

      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) {
        throw new Error("Message not found");
      }

      const message = messages[messageIndex];
      const reactions = message.reactions || [];

      const existingReaction = reactions.find((r) => r.emoji === emoji);

      if (existingReaction) {
        if (existingReaction.users.includes(username)) {
          existingReaction.users = existingReaction.users.filter(
            (u) => u !== username
          );
          if (existingReaction.users.length === 0) {
            message.reactions = reactions.filter((r) => r.emoji !== emoji);
          }
        } else {
          existingReaction.users.push(username);
        }
      } else {
        reactions.push({ emoji, users: [username] });
        message.reactions = reactions;
      }

      await redis.lset(`messages:${roomId}`, messageIndex, message);
      await realtime.channel(roomId).emit("chat.reaction", {
        messageId,
        emoji,
        username,
      });

      return { success: true };
    },
    {
      query: z.object({
        roomId: z.string(),
      }),
      body: z.object({
        messageId: z.string(),
        emoji: z.string(),
        username: z.string(),
      }),
    }
  );

const typing = new Elysia({ prefix: "/typing" }).use(authMiddleware).post(
  "/",
  async ({ body, auth }) => {
    const { username, isTyping } = body;
    const { roomId } = auth;

    await realtime.channel(roomId).emit("chat.typing", {
      username,
      isTyping,
    });

    return { success: true };
  },
  {
    query: z.object({
      roomId: z.string(),
    }),
    body: z.object({
      username: z.string(),
      isTyping: z.boolean(),
    }),
  }
);

const read = new Elysia({ prefix: "/read" }).use(authMiddleware).post(
  "/",
  async ({ body, auth }) => {
    const { messageId, username } = body;
    const { roomId } = auth;

    const messages = await redis.lrange<Message>(`messages:${roomId}`, 0, -1);

    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) {
      throw new Error("Message not found");
    }

    const message = messages[messageIndex];
    const readBy = message.readBy || [];

    if (!readBy.includes(username)) {
      readBy.push(username);
      message.readBy = readBy;

      await redis.lset(`messages:${roomId}`, messageIndex, message);
      await realtime.channel(roomId).emit("chat.read", {
        messageId,
        username,
      });
    }

    return { success: true };
  },
  {
    query: z.object({
      roomId: z.string(),
    }),
    body: z.object({
      messageId: z.string(),
      username: z.string(),
    }),
  }
);

const app = new Elysia({ prefix: "/api" })
  .use(rooms)
  .use(messages)
  .use(typing)
  .use(read);

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;
export type App = typeof app;
