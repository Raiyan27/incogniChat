"use client";

import { Message } from "@/lib/realtime";
import { useState } from "react";

interface ReadReceiptsProps {
  message: Message;
  currentUsername: string;
  isLatestOwnMessage?: boolean;
}

export const ReadReceipts = ({
  message,
  currentUsername,
  isLatestOwnMessage = false,
}: ReadReceiptsProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const readBy = message.readBy || [];
  const otherReaders = readBy.filter((user) => user !== message.sender);

  // Only show read receipts for messages sent by current user
  if (message.sender !== currentUsername) {
    return null;
  }

  const hasBeenRead = otherReaders.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (hasBeenRead) {
      e.stopPropagation();
      setShowDetails(!showDetails);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (hasBeenRead) {
      e.stopPropagation();
      setShowDetails(!showDetails);
    }
  };

  return (
    <div
      className="inline-flex items-center gap-1 ml-1 relative cursor-pointer"
      onMouseEnter={() => hasBeenRead && setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
    >
      {/* Inline checkmark beside timestamp (inside bubble) */}
      {hasBeenRead ? (
        // Double checkmark for read
        <svg
          className="w-3.5 h-3.5 text-blue-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 13l4 4L23 7"
          />
        </svg>
      ) : (
        // Single checkmark for sent
        <svg
          className="w-3.5 h-3.5 text-blue-200/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}

      {/* Extended details - show when hovered/clicked */}
      {hasBeenRead && showDetails && (
        <div className="absolute right-0 bottom-full mb-1 z-50 bg-zinc-800/95 backdrop-blur-md border border-zinc-600/40 rounded-lg px-3 py-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 min-w-35 whitespace-nowrap">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-zinc-400 font-medium">
              Seen by {otherReaders.length}{" "}
              {otherReaders.length === 1 ? "person" : "people"}
            </span>

            <div className="flex flex-col gap-1.5">
              {otherReaders.slice(0, 5).map((reader, index) => (
                <div key={reader} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full bg-linear-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                    style={{ zIndex: 5 - index }}
                  >
                    {reader.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[11px] text-zinc-300">{reader}</span>
                </div>
              ))}
              {otherReaders.length > 5 && (
                <span className="text-[10px] text-zinc-500 mt-1">
                  +{otherReaders.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
