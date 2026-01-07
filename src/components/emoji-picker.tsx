"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { Theme } from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

// Dynamically import the emoji picker to avoid SSR issues
const Picker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="w-8 h-8 animate-pulse bg-zinc-800 rounded" />,
});

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  buttonClassName?: string;
  pickerPosition?: "top" | "bottom";
}

export const EmojiPicker = ({
  onEmojiSelect,
  buttonClassName = "",
  pickerPosition = "top",
}: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close picker on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`text-xl hover:bg-zinc-700 transition-transform ${buttonClassName}`}
        aria-label="Open emoji picker"
      >
        😊
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 ${
            pickerPosition === "top" ? "bottom-12" : "top-12"
          } right-0`}
        >
          <Picker
            onEmojiClick={handleEmojiClick}
            theme={Theme.DARK}
            skinTonesDisabled
            searchDisabled={false}
            previewConfig={{
              showPreview: true,
            }}
            width={400}
            height={400}
          />
        </div>
      )}
    </div>
  );
};
