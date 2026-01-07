"use client";

import { useRef } from "react";
import { MessageReactions } from "./message-reactions";
import type { Message } from "@/lib/realtime";

interface MessageItemProps {
  message: Message;
  username: string;
  onReact: (emoji: string) => void;
}

export const MessageItem = ({
  message,
  username,
  onReact,
}: MessageItemProps) => {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerReactionPickerRef = useRef<(() => void) | null>(null);

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

  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[80%] group">
        <div className="flex items-baseline gap-3 mb-1">
          <span
            className={`text-xs font-bold ${
              message.sender === username ? "text-green-500" : "text-blue-500"
            }`}
          >
            {message.sender === username ? "You" : message.sender}
          </span>

          <span className="text-[10px] text-zinc-600">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>

        <p
          className="text-sm text-zinc-300 leading-relaxed break-all select-text"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
        >
          {message.text}
        </p>

        <MessageReactions
          reactions={message.reactions}
          onReact={onReact}
          currentUsername={username}
          onLongPressReady={(handler) => {
            triggerReactionPickerRef.current = handler;
          }}
        />
      </div>
    </div>
  );
};
