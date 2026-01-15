"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useUsername } from "@/hooks/use-username";
import { Suspense, useEffect, useState } from "react";

const Page = () => {
  return (
    <Suspense>
      <Lobby />
    </Suspense>
  );
};

const Lobby = () => {
  const username = useUsername();
  const router = useRouter();

  const searchParams = useSearchParams();
  const [wasDestroyed] = useState(searchParams.get("destroyed"));
  const [error] = useState(searchParams.get("error"));
  const [maxUsers, setMaxUsers] = useState(5);

  useEffect(() => {
    if (searchParams.toString()) {
      router.replace("/");
    }
  }, [searchParams, router]);

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await api.room.create.post({ maxUsers });

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }

      return res;
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {wasDestroyed && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">
              The chat room has been destroyed.
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              All chat messages have been deleted.
            </p>
          </div>
        )}
        {error === "room_not_found" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">Room not found.</p>
            <p className="text-zinc-500 text-xs mt-1">
              Room may have expired or does not exist.
            </p>
          </div>
        )}
        {error === "room_full" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM FULL</p>
            <p className="text-zinc-500 text-xs mt-1">
              Room is at maximum capacity. Please try another room.
            </p>
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-amber-600">
            {"> "}welcome to incogniChat
          </h1>
          <p className="text-zinc-600">
            Create a secure, self-destructing chat room
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-90/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center text-zinc-500">
                Your Identity
              </label>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-400 font-mono">
                  {username}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-zinc-500">
                Max Participants
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(Number(e.target.value))}
                  className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 touch-manipulation"
                />
                <span className="min-w-12 text-center bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-amber-500 font-mono font-bold">
                  {maxUsers}
                </span>
              </div>
              <p className="text-zinc-600 text-xs">
                {maxUsers === 2
                  ? "Private 1-on-1 chat"
                  : `Up to ${maxUsers} people can join`}
              </p>
            </div>

            <button
              onClick={() => createRoom()}
              className="w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50 touch-manipulation active:scale-[0.98]"
            >
              Create Secure Room
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
export default Page;
