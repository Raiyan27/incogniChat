"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/client";

interface UseTypingIndicatorProps {
  roomId: string;
  username: string;
}

const TYPING_TIMEOUT = 3000; // Stop showing typing after 3 seconds of inactivity
const THROTTLE_DELAY = 1000; // Only send typing event once per second

export const useTypingIndicator = ({
  roomId,
  username,
}: UseTypingIndicatorProps) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  // Send typing status to server
  const sendTypingStatus = useCallback(
    async (typing: boolean) => {
      try {
        await api.typing.post(
          { username, isTyping: typing },
          { query: { roomId } }
        );
      } catch (error) {
        console.error("Failed to send typing status:", error);
      }
    },
    [roomId, username]
  );

  // Handle user typing
  const handleTyping = useCallback(() => {
    const now = Date.now();

    // Throttle: only send if enough time has passed
    if (now - lastTypingTimeRef.current < THROTTLE_DELAY) {
      // Still reset timeout even if we don't send
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingStatus(false);
      }, TYPING_TIMEOUT);

      return;
    }

    lastTypingTimeRef.current = now;

    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(false);
    }, TYPING_TIMEOUT);
  }, [isTyping, sendTypingStatus]);

  // Handle user stopped typing (e.g., sent message)
  const handleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTyping) {
      setIsTyping(false);
      sendTypingStatus(false);
    }
  }, [isTyping, sendTypingStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        sendTypingStatus(false);
      }
    };
  }, [isTyping, sendTypingStatus]);

  return {
    isTyping,
    handleTyping,
    handleStopTyping,
  };
};
