"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * Hook to ensure input field stays visible above virtual keyboard
 * Automatically scrolls input into view when focused
 */
export const useKeyboardInputHandler = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputFocus = useCallback(() => {
    // Delay to ensure keyboard is fully open
    setTimeout(() => {
      if (inputRef.current) {
        // Get input position
        const inputRect = inputRef.current.getBoundingClientRect();

        // If input is below viewport, scroll it up
        if (inputRect.bottom > window.innerHeight) {
          inputRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }, 300);
  }, []);

  const handleInputBlur = useCallback(() => {
    // Optional: perform cleanup or adjust layout when keyboard closes
    // Force a layout recalculation to ensure smooth transition
    void document.documentElement.offsetHeight;
  }, []);

  return {
    inputRef,
    handleInputFocus,
    handleInputBlur,
  };
};
