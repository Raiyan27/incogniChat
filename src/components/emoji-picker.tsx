"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside both the button container and the picker
      const isOutsideButton =
        pickerRef.current && !pickerRef.current.contains(target);
      const isOutsidePicker = !(target as Element).closest?.(
        ".EmojiPickerReact"
      );

      if (isOutsideButton && isOutsidePicker) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid immediate close when opening
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
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
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`text-xl hover:bg-zinc-700 transition-transform ${buttonClassName}`}
        aria-label="Open emoji picker"
      >
        😊
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`fixed z-50 ${
              pickerPosition === "top" ? "bottom-23" : "top-12"
            }  right-10`}
            onClick={(e) => e.stopPropagation()}
          >
            <Picker
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              skinTonesDisabled
              searchDisabled={false}
              previewConfig={{
                showPreview: true,
              }}
              height={400}
              width={
                typeof window !== "undefined"
                  ? window.innerWidth >= 768
                    ? 400
                    : window.innerWidth >= 412
                    ? 300
                    : 300
                  : 300
              }
            />
          </div>,
          document.body
        )}
    </div>
  );
};
