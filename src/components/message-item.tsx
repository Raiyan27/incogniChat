"use client";

import { useRef } from "react";
import { MessageReactions } from "./message-reactions";
import { ReadReceipts } from "./read-receipts";
import { useReadReceipts } from "@/hooks/use-read-receipts";
import type { Message } from "@/lib/realtime";

// Color themes for different users in group chats - cyberpunk neon style
const USER_COLORS = [
  {
    bg: "from-purple-500/80 via-purple-600/80 to-fuchsia-600/80",
    border: "border-purple-400/50",
    glow: "shadow-[0_0_10px_rgba(168,85,247,0.4)]",
    text: "text-purple-200/80",
  },
  {
    bg: "from-emerald-500/80 via-emerald-600/80 to-teal-600/80",
    border: "border-emerald-400/50",
    glow: "shadow-[0_0_10px_rgba(16,185,129,0.4)]",
    text: "text-emerald-200/80",
  },
  {
    bg: "from-orange-500/80 via-orange-600/80 to-red-600/80",
    border: "border-orange-400/50",
    glow: "shadow-[0_0_10px_rgba(251,146,60,0.4)]",
    text: "text-orange-200/80",
  },
  {
    bg: "from-pink-500/80 via-pink-600/80 to-rose-600/80",
    border: "border-pink-400/50",
    glow: "shadow-[0_0_10px_rgba(236,72,153,0.4)]",
    text: "text-pink-200/80",
  },
  {
    bg: "from-cyan-400/80 via-cyan-500/80 to-blue-600/80",
    border: "border-cyan-400/50",
    glow: "shadow-[0_0_10px_rgba(34,211,238,0.4)]",
    text: "text-cyan-200/80",
  },
  {
    bg: "from-amber-500/80 via-yellow-600/80 to-orange-600/80",
    border: "border-amber-400/50",
    glow: "shadow-[0_0_10px_rgba(245,158,11,0.4)]",
    text: "text-amber-200/80",
  },
  {
    bg: "from-rose-500/80 via-rose-600/80 to-pink-600/80",
    border: "border-rose-400/50",
    glow: "shadow-[0_0_10px_rgba(244,63,94,0.4)]",
    text: "text-rose-200/80",
  },
  {
    bg: "from-indigo-500/80 via-indigo-600/80 to-purple-600/80",
    border: "border-indigo-400/50",
    glow: "shadow-[0_0_10px_rgba(99,102,241,0.4)]",
    text: "text-indigo-200/80",
  },
  {
    bg: "from-teal-500/80 via-teal-600/80 to-cyan-600/80",
    border: "border-teal-400/50",
    glow: "shadow-[0_0_10px_rgba(20,184,166,0.4)]",
    text: "text-teal-200/80",
  },
];

// Generate consistent color index from username
const getUserColorIndex = (username: string): number => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % USER_COLORS.length;
};

interface MessageItemProps {
  message: Message;
  username: string;
  onReact: (emoji: string) => void;
  onMarkAsRead: (messageId: string) => void;
  isLatestOwnMessage?: boolean;
  maxUsers?: number;
}

export const MessageItem = ({
  message,
  username,
  onReact,
  onMarkAsRead,
  isLatestOwnMessage = false,
  maxUsers = 2,
}: MessageItemProps) => {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerReactionPickerRef = useRef<(() => void) | null>(null);
  const isOwnMessage = message.sender === username;

  const { elementRef } = useReadReceipts({
    messageId: message.id,
    sender: message.sender,
    currentUsername: username,
    readBy: message.readBy,
    onMarkAsRead,
  });

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      if (triggerReactionPickerRef.current) {
        triggerReactionPickerRef.current();
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Determine bubble color for other users in group chats
  const isGroupChat = maxUsers > 2;
  const otherUserColor =
    isGroupChat && !isOwnMessage
      ? USER_COLORS[getUserColorIndex(message.sender)]
      : null;

  // Get bubble classes based on context
  const getBubbleClasses = () => {
    if (isOwnMessage) {
      return "bg-gradient-to-br from-yellow-500/15 via-yellow-600/10 to-amber-600/15 border-2 border-yellow-400/60 shadow-[0_0_20px_rgba(252,238,10,0.25)] text-yellow-50 backdrop-blur-sm";
    }
    if (otherUserColor) {
      return `bg-gradient-to-br ${otherUserColor.bg} border-2 ${otherUserColor.border} ${otherUserColor.glow} text-white backdrop-blur-sm`;
    }
    return "bg-black/50 border-2 border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.2)] text-cyan-100 backdrop-blur-sm";
  };

  const getTimestampColor = () => {
    if (isOwnMessage) return "text-yellow-300/80";
    if (otherUserColor) return otherUserColor.text;
    return "text-cyan-400/70";
  };

  return (
    <div
      className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
      ref={elementRef}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] lg:max-w-125 group ${
          isOwnMessage ? "items-end" : "items-start"
        } flex flex-col`}
      >
        {/* Sender name and time - only show for others' messages */}
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-[11px] font-semibold text-yellow-400 font-mono">
              {"//"} {message.sender}
            </span>
            <span className="text-[10px] text-cyan-400/60 font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-lg shadow-lg transition-all duration-200 ${getBubbleClasses()} ${
            isOwnMessage
              ? "clip-path-[polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]"
              : ""
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
        >
          <p className="text-[15px] leading-relaxed wrap-break-word break-all whitespace-pre-wrap select-text overflow-wrap-anywhere font-mono">
            {message.text}
          </p>

          {/* Timestamp for own messages - inside bubble */}
          {isOwnMessage && (
            <div
              className={`text-[10px] ${getTimestampColor()} mt-1 flex items-center justify-end gap-0.5 font-mono`}
            >
              <span>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <ReadReceipts
                message={message}
                currentUsername={username}
                isLatestOwnMessage={isLatestOwnMessage}
              />
            </div>
          )}
        </div>

        {/* Reactions */}
        <div className={`${isOwnMessage ? "self-end" : "self-start"}`}>
          <MessageReactions
            reactions={message.reactions}
            onReact={onReact}
            currentUsername={username}
            onLongPressReady={(handler) => {
              triggerReactionPickerRef.current = handler;
            }}
            isOwnMessage={isOwnMessage}
          />
        </div>
      </div>
    </div>
  );
};
