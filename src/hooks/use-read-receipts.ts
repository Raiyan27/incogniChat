"use client";

import { useEffect, useRef } from "react";

interface UseReadReceiptsProps {
  messageId: string;
  sender: string;
  currentUsername: string;
  readBy?: string[];
  onMarkAsRead: (messageId: string) => void;
}

export const useReadReceipts = ({
  messageId,
  sender,
  currentUsername,
  readBy = [],
  onMarkAsRead,
}: UseReadReceiptsProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Don't mark own messages as read
    if (sender === currentUsername) return;

    // Already marked as read
    if (readBy.includes(currentUsername)) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Mark as read after a short delay to ensure user actually saw it
          setTimeout(() => {
            if (entry.isIntersecting) {
              onMarkAsRead(messageId);
            }
          }, 500);
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.5, // At least 50% of the message must be visible
      rootMargin: "0px",
    });

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [messageId, sender, currentUsername, readBy, onMarkAsRead]);

  return { elementRef };
};
