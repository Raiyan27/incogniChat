"use client";

import { useUsername } from "@/hooks/use-username";
import { api } from "@/lib/client";
import { useRealtime } from "@/lib/realtime-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmojiPicker } from "@/components/emoji-picker";
import { MessageItem } from "@/components/message-item";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { TypingIndicatorList } from "@/components/typing-indicator";

const formatTimeRemaining = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const username = useUsername();
  const roomId = params.roomId as string;
  const [copyStatus, setCopyStatus] = useState("COPY");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { handleTyping, handleStopTyping } = useTypingIndicator({
    roomId,
    username,
  });

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await api.room.ttl.get({
        query: { roomId },
      });
      return res.data;
    },
  });

  useEffect(() => {
    if (ttlData?.ttl !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeRemaining(ttlData.ttl);
    }
  }, [ttlData]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return;

    if (timeRemaining === 0) {
      router.push("/?destroyed=true");
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining, router]);

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await api.messages.get({ query: { roomId } });
      return res.data;
    },
  });

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await api.room.delete(null, { query: { roomId } });
      router.push("/?destroyed=true");
    },
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await api.messages.post(
        { sender: username, text },
        { query: { roomId } }
      );
      setInputMessage("");
      handleStopTyping();
    },
  });

  const { mutate: addReaction } = useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      await api.messages.react.post(
        { messageId, emoji, username },
        { query: { roomId } }
      );
    },
  });

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy", "chat.reaction", "chat.typing"],
    onData: ({ event, data }) => {
      if (event === "chat.message" || event === "chat.reaction") {
        refetch();
      }
      if (event === "chat.destroy") {
        router.push("/?destroyed=true");
      }
      if (event === "chat.typing") {
        const typingData = data as { username: string; isTyping: boolean };
        setTypingUsers((prev) => {
          if (typingData.isTyping) {
            // Add user if not already in list
            return prev.includes(typingData.username)
              ? prev
              : [...prev, typingData.username];
          } else {
            // Remove user from list
            return prev.filter((u) => u !== typingData.username);
          }
        });
      }
    },
  });

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopyStatus("COPIED!");
    setTimeout(() => setCopyStatus("COPY"), 2000);
  };

  // Auto-scroll to bottom when messages or typing users change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.messages.length, typingUsers.length]);

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
      <header className="border-b border-zinc-800 p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between bg-zinc-900/30 gap-3 md:gap-0">
        <div className="flex items-center justify-between gap-2 md:gap-4 flex-wrap w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs text-zinc-500 uppercase">
              ROOM ID
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500 text-xs md:text-base truncate max-w-30 sm:max-w-none">
                {roomId}
              </span>
              <button
                onClick={copyLink}
                className="text-[9px] md:text-[10px] bg-zinc-800 hover:bg-zinc-700 px-1.5 md:px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-6 md:h-8 w-px bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs text-zinc-500 uppercase">
              Self-Destruct
            </span>
            <span
              className={`text-xs md:text-sm font-bold flex items-center gap-2 ${
                timeRemaining !== null && timeRemaining < 60
                  ? "text-red-500"
                  : "text-amber-500"
              }`}
            >
              {timeRemaining !== null
                ? formatTimeRemaining(timeRemaining)
                : "--:--"}
            </span>
          </div>
        </div>

        <button
          onClick={() => destroyRoom()}
          className="text-[10px] md:text-xs bg-zinc-800 hover:bg-red-600 px-2.5 md:px-3 py-1 md:py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flex items-center gap-1.5 md:gap-2 disabled:opacity-50  md:w-auto justify-center ml-auto"
        >
          <span className="group-hover:animate-pulse">💣</span>
          DESTROY NOW
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
        {messages?.messages.length === 0 ? (
          <div className="space-y-4">
            <TypingIndicatorList
              typingUsers={typingUsers}
              currentUsername={username}
            />
          </div>
        ) : (
          <>
            {messages?.messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                username={username}
                onReact={(emoji) => addReaction({ messageId: msg.id, emoji })}
              />
            ))}

            <TypingIndicatorList
              typingUsers={typingUsers}
              currentUsername={username}
            />

            <div ref={messagesEndRef} />
          </>
        )}
        {messages?.messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-sm font-mono">
              No messages yet, start the conversation
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
        <div className="flex gap-2">
          <div className="flex-1 relative group">
            <span className="absolute left-4 top-1/2 -translate-1/2 text-green-500 animate-pulse">
              {">"}
            </span>
            <input
              ref={inputRef}
              autoFocus
              value={inputMessage}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputMessage.trim()) {
                  sendMessage({ text: inputMessage });
                  inputRef.current?.focus();
                }
              }}
              placeholder="Type message..."
              onChange={(e) => {
                setInputMessage(e.target.value);
                handleTyping();
              }}
              type="text"
              className="w-full bg-black border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors placeholder:text-zinc-700 py-3 pl-8 pr-4 text-sm"
            />
          </div>
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              setInputMessage((prev) => prev + emoji);
              inputRef.current?.focus();
            }}
            buttonClassName="bg-zinc-800 px-3 h-full text-zinc-400 cursor-pointer"
          />
          <button
            onClick={() => {
              sendMessage({ text: inputMessage });
              inputRef.current?.focus();
            }}
            disabled={!inputMessage.trim() || isPending}
            className="bg-zinc-800 text-zinc-400 px-6 text-sm font-bold hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  );
};
export default Page;
