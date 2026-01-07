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
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export const MessageReactions = ({
  reactions = [],
  onReact,
  currentUsername,
  onLongPressReady,
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
      }`}
      onMouseEnter={() => !showQuickPicker && setShowHoverHint(true)}
      onMouseLeave={() => setShowHoverHint(false)}
    >
      <div
        className={`flex flex-wrap items-center gap-1 ${
          hasReactions ? "" : "h-4.5"
        }`}
      >
        {/* Existing reactions */}
        {hasReactions &&
          reactions.map((reaction) => {
            const userReacted = reaction.users.includes(currentUsername);
            const count = reaction.users.length;

            return (
              <button
                key={reaction.emoji}
                onClick={() => onReact(reaction.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ${
                  userReacted
                    ? "bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30"
                    : "bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700/50"
                }`}
                title={reaction.users.join(", ")}
              >
                <span className="text-xs">{reaction.emoji}</span>
                <span
                  className={`text-[10px] font-bold ${
                    userReacted ? "text-blue-400" : "text-zinc-500"
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
            className={`flex items-center justify-center w-7 h-6 rounded border transition-all touch-manipulation ${
              showHoverHint
                ? "border-zinc-600 bg-zinc-800/50 opacity-100"
                : "border-zinc-800 bg-zinc-900/30 opacity-0 group-hover:opacity-60"
            } hover:opacity-100 hover:border-zinc-600 hover:bg-zinc-800/50 active:scale-95`}
            title="Click to add reaction"
            aria-label="Add reaction"
          >
            <span className="text-xs">😊</span>
          </button>
        )}

        {/* Quick reaction bar - replaces button when active */}
        {showQuickPicker && (
          <div
            ref={quickPickerRef}
            className="flex items-center gap-1 bg-zinc-800/95 backdrop-blur-sm border border-zinc-700/50 rounded-full px-2 py-1 shadow-xl animate-in fade-in zoom-in-95 duration-150"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact(emoji);
                  setShowQuickPicker(false);
                }}
                className="hover:scale-125 transition-transform text-base min-w-7 min-h-7 flex items-center justify-center touch-manipulation active:scale-110"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}

            <div className="w-px h-4 bg-zinc-700 mx-1" />

            <button
              onClick={() => {
                setShowFullPicker(!showFullPicker);
              }}
              className="hover:scale-110 transition-transform text-sm px-1 min-w-7 min-h-7 flex items-center justify-center touch-manipulation active:scale-105"
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
          <div ref={fullPickerRef} className="">
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
