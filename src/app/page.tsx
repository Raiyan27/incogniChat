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
      <div className="w-full max-w-md space-y-8 relative z-10">
        {wasDestroyed && (
          <div className="cyber-panel p-4 text-center border-2 neon-border-magenta animate-pulse">
            <p className="neon-text-magenta text-sm font-bold uppercase tracking-wider">
              ⚠ ROOM TERMINATED ⚠
            </p>
            <p className="text-cyan-400/70 text-xs mt-1 font-mono">
              &gt; All data purged from memory
            </p>
          </div>
        )}
        {error === "room_not_found" && (
          <div className="cyber-panel p-4 text-center border-2 neon-border-magenta">
            <p className="neon-text-magenta text-sm font-bold uppercase tracking-wider">
              ⚠ 404: ROOM NOT FOUND
            </p>
            <p className="text-cyan-400/70 text-xs mt-1 font-mono">
              &gt; Room expired or invalid coordinates
            </p>
          </div>
        )}
        {error === "room_full" && (
          <div className="cyber-panel p-4 text-center border-2 neon-border-magenta">
            <p className="neon-text-magenta text-sm font-bold uppercase tracking-wider">
              ⚠ CAPACITY EXCEEDED
            </p>
            <p className="text-cyan-400/70 text-xs mt-1 font-mono">
              &gt; Maximum neural connections reached
            </p>
          </div>
        )}

        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold neon-text-yellow uppercase tracking-widest font-mono relative inline-block">
            <span className="inline-block text-cyan-400">[\/\/</span>{" "}
            incogniChat{" "}
            <span className="inline-block text-cyan-400">\/\/]</span>
          </h1>
          <p className="text-yellow-400/80 font-mono text-sm tracking-widest uppercase">
            [ ENCRYPTED • EPHEMERAL • UNTRACEABLE ]
          </p>
          <p className="text-cyan-400/60 text-xs font-mono">
            &gt;&gt; ESTABLISHING SECURE CONNECTION...
          </p>
        </div>

        <div className="cyber-panel p-6 backdrop-blur-md border-2 relative overflow-hidden">
          {/* Corner accents - CP2077 style */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-yellow-400"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-yellow-400"></div>

          {/* Hexagonal accent top right */}
          <div className="absolute top-3 right-3 w-6 h-6 border-2 border-yellow-400/30 rotate-45"></div>

          <div className="space-y-5 relative z-10">
            <div className="space-y-2">
              <label className="flex items-center text-yellow-400 font-mono text-xs uppercase tracking-widest">
                <span className="text-cyan-400 mr-2">{"//"}</span> NEURAL_ID
              </label>

              <div className="flex items-center gap-3">
                <div className="flex-1 cyber-input p-3 text-sm font-mono">
                  {username}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-yellow-400 font-mono text-xs uppercase tracking-widest">
                <span className="text-cyan-400 mr-2">{"//"}</span>{" "}
                NETWORK_CAPACITY
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(Number(e.target.value))}
                  className="flex-1 h-3 md:h-2 bg-black/70 border border-yellow-500/40 appearance-none cursor-pointer accent-yellow-400 touch-manipulation"
                  style={{
                    background: `linear-gradient(to right, rgba(252, 238, 10, 0.4) 0%, rgba(252, 238, 10, 0.4) ${
                      ((maxUsers - 2) / 8) * 100
                    }%, rgba(0, 0, 0, 0.7) ${
                      ((maxUsers - 2) / 8) * 100
                    }%, rgba(0, 0, 0, 0.7) 100%)`,
                  }}
                />
                <span className="min-w-12 text-center cyber-input px-3 py-2 text-sm neon-text-yellow font-bold">
                  {maxUsers}
                </span>
              </div>
              <div className="text-cyan-400/60 text-xs font-mono">
                {maxUsers === 2 ? (
                  <div>
                    <span className="text-yellow-400 mr-2">{"//"}</span>
                    P2P_SECURE_LINK
                  </div>
                ) : (
                  <div>
                    <span className="text-yellow-400 mr-2">{"//"}</span>
                    MAX_NODES: {maxUsers}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => createRoom()}
              className="w-full cyber-button p-4 md:p-3 text-sm font-bold uppercase tracking-widest mt-2 cursor-pointer disabled:opacity-50 touch-manipulation active:scale-[0.98] transition-transform min-h-12 font-mono"
            >
              <span className="relative z-10">
                {"//"} INITIALIZE_CONNECTION
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
export default Page;
