import { redis } from "@/lib/redis";
import Elysia from "elysia";

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

class RoomFullError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoomFullError";
  }
}

export const authMiddleware = new Elysia({
  name: "auth",
})
  .error({ AuthError, RoomFullError })
  .onError(({ code, set }) => {
    if (code === "AuthError") {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    if (code === "RoomFullError") {
      set.status = 403;
      return { error: "Room is full" };
    }
  })
  .derive({ as: "scoped" }, async ({ query, cookie }) => {
    const roomId = query.roomId;
    const token = cookie["x-auth-token"].value as string | undefined;

    if (!roomId || !token) {
      throw new AuthError("Missing roomId or token");
    }

    const meta = await redis.hgetall<{
      connected: string[];
      maxUsers?: number;
    }>(`meta:${roomId}`);
    const connected = meta?.connected || [];
    const maxUsers = meta?.maxUsers || 5;

    // Check if user is already connected
    if (!connected.includes(token)) {
      // Check if room is full before allowing new connection
      if (connected.length >= maxUsers) {
        throw new RoomFullError("Room is at maximum capacity");
      }
      throw new AuthError("Invalid token for room");
    }

    return { auth: { roomId, token, connected, maxUsers } };
  });
