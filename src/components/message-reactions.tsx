"use client";

import type { Reaction } from "@/lib/realtime";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Theme } from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

const Picker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
});

interface MessageReactionsProps {
  reactions?: Reaction[];
  onReact: (emoji: string) => void;
  currentUsername: string;
  onLongPressReady?: (handler: () => void) => void;
  isOwnMessage?: boolean;
}

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "👍"];

export const MessageReactions = ({
  reactions = [],
  onReact,
  currentUsername,
  onLongPressReady,
  isOwnMessage = false,
}: MessageReactionsProps) => {
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [showHoverHint, setShowHoverHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const quickPickerRef = useRef<HTMLDivElement>(null);
  const fullPickerRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasReactions = reactions.length > 0;
  const shouldShowSpace = hasReactions || showHoverHint || showQuickPicker;

  // Expose the long press trigger to parent
  useEffect(() => {
    if (onLongPressReady) {
      onLongPressReady(() => setShowQuickPicker(true));
    }
  }, [onLongPressReady]);

  // Handle click outside for quick picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        quickPickerRef.current &&
        !quickPickerRef.current.contains(event.target as Node)
      ) {
        setShowQuickPicker(false);
      }
    };

    if (showQuickPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showQuickPicker]);

  // Handle click outside and mouse leave for full picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fullPickerRef.current &&
        !fullPickerRef.current.contains(event.target as Node)
      ) {
        setShowFullPicker(false);
      }
    };

    const handleMouseLeave = () => {
      leaveTimerRef.current = setTimeout(() => {
        setShowFullPicker(false);
      }, 2000);
    };

    const handleMouseEnter = () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
    };

    const pickerElement = fullPickerRef.current;

    if (showFullPicker && pickerElement) {
      document.addEventListener("mousedown", handleClickOutside);
      pickerElement.addEventListener("mouseleave", handleMouseLeave);
      pickerElement.addEventListener("mouseenter", handleMouseEnter);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (pickerElement) {
        pickerElement.removeEventListener("mouseleave", handleMouseLeave);
        pickerElement.removeEventListener("mouseenter", handleMouseEnter);
      }
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, [showFullPicker]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onReact(emojiData.emoji);
    setShowFullPicker(false);
    setShowQuickPicker(false);
  };

  const handleReactionButtonClick = () => {
    setShowQuickPicker(!showQuickPicker);
    setShowHoverHint(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-200 ${
        shouldShowSpace ? "mt-1" : "mt-0"
      } ${isOwnMessage ? "flex justify-end" : ""}`}
      onMouseEnter={() => !showQuickPicker && setShowHoverHint(true)}
      onMouseLeave={() => setShowHoverHint(false)}
    >
      <div
        className={`flex flex-wrap items-center gap-1.5 ${
          hasReactions ? "" : "h-5"
        } ${isOwnMessage ? "flex-row-reverse" : ""}`}
      >
        {/* Existing reactions */}
        {hasReactions &&
          reactions.map((reaction) => {
            const userReacted = reaction.users.includes(currentUsername);
            const count = reaction.users.length;
            const usersDisplay = reaction.users
              .map((user) =>
                user === currentUsername ? `${user} (you)` : user
              )
              .join(", ");

            return (
              <button
                key={reaction.emoji}
                onClick={() => onReact(reaction.emoji)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all shadow-sm ${
                  userReacted
                    ? "bg-blue-500/25 border border-blue-400/40 hover:bg-blue-500/35"
                    : "bg-zinc-800/70 border border-zinc-600/30 hover:bg-zinc-700/70"
                }`}
                title={usersDisplay}
              >
                <span className="text-sm">{reaction.emoji}</span>
                <span
                  className={`text-[11px] font-semibold ${
                    userReacted ? "text-blue-300" : "text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

        {/* Add reaction button - always in flow */}
        {!showQuickPicker && (
          <button
            onClick={handleReactionButtonClick}
            className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all touch-manipulation ${
              showHoverHint
                ? "border-zinc-500/50 bg-zinc-700/60 opacity-100 scale-100"
                : "border-zinc-700/30 bg-zinc-800/40 opacity-0 group-hover:opacity-70 scale-95"
            } hover:opacity-100 hover:border-zinc-500/50 hover:bg-zinc-700/60 hover:scale-100 active:scale-90`}
            title="Click to add reaction"
            aria-label="Add reaction"
          >
            <span className="text-sm">😊</span>
          </button>
        )}

        {/* Quick reaction bar - replaces button when active */}
        {showQuickPicker && (
          <div
            ref={quickPickerRef}
            className="flex items-center gap-0.5 bg-zinc-800/95 backdrop-blur-md border border-zinc-600/40 rounded-full px-2 py-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact(emoji);
                  setShowQuickPicker(false);
                }}
                className="hover:scale-125 hover:bg-zinc-700/50 rounded-full transition-all text-lg w-8 h-8 flex items-center justify-center touch-manipulation active:scale-110"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}

            <div className="w-px h-5 bg-zinc-600/50 mx-1" />

            <button
              onClick={() => {
                setShowFullPicker(!showFullPicker);
              }}
              className="hover:scale-110 hover:bg-zinc-700/50 rounded-full transition-all text-sm w-8 h-8 flex items-center justify-center touch-manipulation active:scale-105"
              title="More reactions"
            >
              ➕
            </button>
          </div>
        )}
      </div>

      {/* Full emoji picker - centered on viewport */}
      {showFullPicker && (
        <>
          <div onClick={() => setShowFullPicker(false)} />
          <div ref={fullPickerRef} className="absolute z-50 mt-2">
            <Picker
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              skinTonesDisabled
              searchDisabled={false}
              previewConfig={{
                showPreview: false,
              }}
              width={320}
              height={400}
            />
          </div>
        </>
      )}
    </div>
  );
};
