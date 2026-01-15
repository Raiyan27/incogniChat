"use client";

import { useRef } from "react";
import { MessageReactions } from "./message-reactions";
import { ReadReceipts } from "./read-receipts";
import { useReadReceipts } from "@/hooks/use-read-receipts";
import type { Message } from "@/lib/realtime";

interface MessageItemProps {
  message: Message;
  username: string;
  onReact: (emoji: string) => void;
  onMarkAsRead: (messageId: string) => void;
  isLatestOwnMessage?: boolean;
}

export const MessageItem = ({
  message,
  username,
  onReact,
  onMarkAsRead,
  isLatestOwnMessage = false,
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

  return (
    <div
      className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
      ref={elementRef}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] lg:max-w-[500px] group ${
          isOwnMessage ? "items-end" : "items-start"
        } flex flex-col`}
      >
        {/* Sender name and time - only show for others' messages */}
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-[11px] font-semibold text-zinc-400">
              {message.sender}
            </span>
            <span className="text-[10px] text-zinc-600">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-200 ${
            isOwnMessage
              ? "bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
              : "bg-zinc-800/80 text-zinc-100 rounded-bl-md border border-zinc-700/30"
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
        >
          <p className="text-[15px] leading-relaxed wrap-break-word break-all whitespace-pre-wrap select-text overflow-wrap-anywhere">
            {message.text}
          </p>

          {/* Timestamp for own messages - inside bubble */}
          {isOwnMessage && (
            <div className="text-[10px] text-blue-200/70 mt-1 flex items-center justify-end gap-0.5">
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
