"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface ViewportInfo {
  height: number;
  width: number;
  isKeyboardOpen: boolean;
  isLandscape: boolean;
}

type VisualViewport = {
  height: number;
  width: number;
  addEventListener: (
    event: string,
    listener: EventListener,
    options?: { passive: boolean }
  ) => void;
  removeEventListener: (event: string, listener: EventListener) => void;
};

/**
 * Hook to track viewport dimensions and virtual keyboard state
 * Handles iOS Safari and Android Chrome differences
 * Debounces resize events to prevent jank
 */
export const useViewport = () => {
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>({
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    isKeyboardOpen: false,
    isLandscape:
      typeof window !== "undefined"
        ? window.innerHeight < window.innerWidth
        : false,
  });

  // Debounce timer
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateViewport = useCallback(() => {
    if (typeof window === "undefined") return;

    const height = window.innerHeight;
    const width = window.innerWidth;
    const isLandscape = height < width;

    // Detect keyboard: if visual viewport height is significantly less than window height
    // and user is in portrait mode, keyboard is likely open
    let isKeyboardOpen = false;
    if (typeof window !== "undefined" && "visualViewport" in window) {
      const visualViewport = window.visualViewport as VisualViewport | null;
      if (visualViewport && !isLandscape) {
        // Keyboard is open if visual height is less than 70% of window height
        isKeyboardOpen = visualViewport.height < height * 0.7;
      }
    }

    setViewportInfo({
      height,
      width,
      isKeyboardOpen,
      isLandscape,
    });
  }, []);

  const debouncedUpdateViewport = useCallback(() => {
    const timeoutId = resizeTimeoutRef.current;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      updateViewport();
    }, 100); // 100ms debounce
  }, [updateViewport]);

  useEffect(() => {
    // Update on mount
    setTimeout(() => updateViewport(), 0);

    // Listen to resize events (window resize, keyboard open/close)
    window.addEventListener("resize", debouncedUpdateViewport, {
      passive: true,
    });
    window.addEventListener("orientationchange", updateViewport, {
      passive: true,
    });

    // iOS Safari: listen to visual viewport changes
    if (typeof window !== "undefined" && "visualViewport" in window) {
      const visualViewport = window.visualViewport as VisualViewport | null;
      if (visualViewport) {
        visualViewport.addEventListener("resize", debouncedUpdateViewport, {
          passive: true,
        });
        visualViewport.addEventListener("scroll", debouncedUpdateViewport, {
          passive: true,
        });
      }
    }

    return () => {
      const timeoutId = resizeTimeoutRef.current;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      window.removeEventListener("resize", debouncedUpdateViewport);
      window.removeEventListener("orientationchange", updateViewport);

      if (typeof window !== "undefined" && "visualViewport" in window) {
        const visualViewport = window.visualViewport as VisualViewport | null;
        if (visualViewport) {
          visualViewport.removeEventListener("resize", debouncedUpdateViewport);
          visualViewport.removeEventListener("scroll", debouncedUpdateViewport);
        }
      }
    };
  }, [updateViewport, debouncedUpdateViewport]);

  return viewportInfo;
};
