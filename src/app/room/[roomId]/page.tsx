"use client";

import { useUsername } from "@/hooks/use-username";
import { api } from "@/lib/client";
import { useRealtime } from "@/lib/realtime-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmojiPicker } from "@/components/emoji-picker";
import { MessageItem } from "@/components/message-item";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { TypingIndicatorList } from "@/components/typing-indicator";
import type { Message } from "@/lib/realtime";
import {
  encryptMessage,
  decryptMessage,
  storeSecret,
  getStoredSecret,
  removeSecret,
} from "@/lib/crypto";
import { EncryptionSetup } from "@/components/encryption-setup";
import { ConfirmModal } from "@/components/confirm-modal";
import { useViewport } from "@/hooks/use-viewport";
import { useKeyboardInputHandler } from "@/hooks/use-keyboard-input";

const formatTimeRemaining = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

// Component to handle async message decryption
const DecryptedMessage = ({
  message,
  username,
  roomId,
  encryptionSecret,
  isEncryptionEnabled,
  onReact,
  onMarkAsRead,
  isLatestOwnMessage,
  maxUsers,
}: {
  message: Message;
  username: string;
  roomId: string;
  encryptionSecret: string | null;
  isEncryptionEnabled: boolean;
  onReact: (emoji: string) => void;
  onMarkAsRead: (messageId: string) => void;
  isLatestOwnMessage: boolean;
  maxUsers: number;
}) => {
  const [displayText, setDisplayText] = useState(message.text);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    const decrypt = async () => {
      if (isEncryptionEnabled && encryptionSecret) {
        setIsDecrypting(true);
        try {
          const decrypted = await decryptMessage(
            message.text,
            roomId,
            encryptionSecret
          );
          setDisplayText(decrypted);
        } catch {
          setDisplayText("🔒 [Encrypted message - cannot decrypt]");
        } finally {
          setIsDecrypting(false);
        }
      } else {
        setDisplayText(message.text);
      }
    };

    decrypt();
  }, [message.text, roomId, encryptionSecret, isEncryptionEnabled]);

  return (
    <MessageItem
      message={{
        ...message,
        text: isDecrypting ? "⏳ Decrypting..." : displayText,
      }}
      username={username}
      onReact={onReact}
      onMarkAsRead={onMarkAsRead}
      isLatestOwnMessage={isLatestOwnMessage}
      maxUsers={maxUsers}
    />
  );
};

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const username = useUsername();
  const roomId = params.roomId as string;
  const [copyStatus, setCopyStatus] = useState("COPY");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Mobile viewport and keyboard handling
  const viewport = useViewport();
  const { handleInputFocus, handleInputBlur } = useKeyboardInputHandler();

  // Initialize encryption state from sessionStorage
  const [encryptionSecret, setEncryptionSecret] = useState<string | null>(() =>
    getStoredSecret(roomId)
  );
  const [showEncryptionSetup, setShowEncryptionSetup] = useState(
    () => !getStoredSecret(roomId)
  );
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(
    () => !!getStoredSecret(roomId)
  );
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { handleTyping, handleStopTyping } = useTypingIndicator({
    roomId,
    username,
  });

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await api.room.ttl.get({
        query: { roomId },
      });
      return res.data;
    },
  });

  const { data: roomInfo } = useQuery({
    queryKey: ["roomInfo", roomId],
    queryFn: async () => {
      const res = await api.room.info.get({
        query: { roomId },
      });
      return res.data;
    },
  });

  useEffect(() => {
    if (ttlData?.ttl !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeRemaining(ttlData.ttl);
    }
  }, [ttlData]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return;

    if (timeRemaining === 0) {
      router.push("/?destroyed=true");
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining, router]);

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await api.messages.get({ query: { roomId } });
      return res.data;
    },
  });

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await api.room.delete(null, { query: { roomId } });
      router.push("/?destroyed=true");
    },
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      let messageText = text;

      // Encrypt message if encryption is enabled
      if (isEncryptionEnabled && encryptionSecret) {
        try {
          messageText = await encryptMessage(text, roomId, encryptionSecret);
        } catch (error) {
          console.error("Failed to encrypt message:", error);
          // Still send unencrypted if encryption fails
        }
      }

      await api.messages.post(
        { sender: username, text: messageText },
        { query: { roomId } }
      );
      setInputMessage("");
      handleStopTyping();
    },
  });

  const { mutate: addReaction } = useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      await api.messages.react.post(
        { messageId, emoji, username },
        { query: { roomId } }
      );
    },
  });

  const { mutate: markAsRead } = useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      await api.read.post({ messageId, username }, { query: { roomId } });
    },
  });

  useRealtime({
    channels: [roomId],
    events: [
      "chat.message",
      "chat.destroy",
      "chat.reaction",
      "chat.typing",
      "chat.read",
    ],
    onData: ({ event, data }) => {
      if (
        event === "chat.message" ||
        event === "chat.reaction" ||
        event === "chat.read"
      ) {
        refetch();
      }
      if (event === "chat.destroy") {
        router.push("/?destroyed=true");
      }
      if (event === "chat.typing") {
        const typingData = data as { username: string; isTyping: boolean };
        setTypingUsers((prev) => {
          if (typingData.isTyping) {
            // Add user if not already in list
            return prev.includes(typingData.username)
              ? prev
              : [...prev, typingData.username];
          } else {
            // Remove user from list
            return prev.filter((u) => u !== typingData.username);
          }
        });
      }
    },
  });

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopyStatus("COPIED!");
    setTimeout(() => setCopyStatus("COPY"), 2000);
  };

  const enableEncryption = (secret: string) => {
    setEncryptionSecret(secret);
    storeSecret(roomId, secret);
    setIsEncryptionEnabled(true);
    setShowEncryptionSetup(false);
  };

  const disableEncryption = () => {
    removeSecret(roomId);
    setEncryptionSecret(null);
    setIsEncryptionEnabled(false);
  };

  // Auto-scroll to bottom when messages or typing users change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.messages.length, typingUsers.length]);

  // Update CSS variable for dynamic viewport height
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--viewport-height",
        `${viewport.height}px`
      );
    }
  }, [viewport.height]);

  // Check if room is still initializing
  const isInitializing = !roomInfo || !ttlData || !messages;

  if (isInitializing) {
    return (
      <main
        className="flex flex-col h-dvh max-h-dvh overflow-hidden relative z-10 bg-gradient-to-br from-black via-gray-900 to-black"
        style={{ height: "var(--viewport-height)" }}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            {/* Cyberpunk loading animation */}
            <div className="relative">
              <div className="w-16 h-16 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto"></div>
              <div
                className="absolute inset-0 w-16 h-16 border-2 border-cyan-400/20 border-b-cyan-400 rounded-full animate-spin mx-auto"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>

            {/* Loading text with cyberpunk styling */}
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-bold neon-text-yellow font-mono tracking-wider">
                INITIALIZING ROOM
              </h2>
              <p className="text-yellow-400/70 text-sm md:text-base font-mono">
                {"//"} CONNECTING_TO_MATRIX...
              </p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>

            {/* Corner accents */}
            <div className="absolute top-8 left-8 w-4 h-4 border-l-2 border-t-2 border-yellow-400/50"></div>
            <div className="absolute top-8 right-8 w-4 h-4 border-r-2 border-t-2 border-cyan-400/50"></div>
            <div className="absolute bottom-8 left-8 w-4 h-4 border-l-2 border-b-2 border-cyan-400/50"></div>
            <div className="absolute bottom-8 right-8 w-4 h-4 border-r-2 border-b-2 border-yellow-400/50"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex flex-col h-dvh max-h-dvh overflow-hidden relative z-10"
      style={{ height: "var(--viewport-height)" }}
    >
      <header className="cyber-panel border-b-2 border-yellow-500/40 p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 relative">
        {/* Corner accents - CP2077 style */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-yellow-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-400/50"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-yellow-400/50"></div>

        <div className="flex items-center justify-between gap-2 md:gap-4 flex-wrap w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs text-yellow-400/80 uppercase font-mono tracking-widest">
              {"//"} ROOM_ID
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold neon-text-yellow text-xs md:text-base truncate max-w-30 sm:max-w-none font-mono">
                {roomId}
              </span>
              <button
                onClick={copyLink}
                className="text-[9px] md:text-[10px] cyber-input hover:neon-border-yellow px-1.5 md:px-2 py-0.5 text-yellow-400 hover:text-yellow-300 transition-all whitespace-nowrap font-mono uppercase tracking-wide cursor-pointer"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-6 md:h-8 w-px bg-linear-to-b from-yellow-500/0 via-yellow-500/60 to-yellow-500/0" />
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs text-yellow-400/80 uppercase font-mono tracking-widest">
              {"//"} DESTRUCT_IN
            </span>
            <span
              className={`text-xs md:text-sm font-bold flex items-center gap-2 font-mono ${
                timeRemaining !== null && timeRemaining < 60
                  ? "neon-text-red animate-pulse"
                  : "neon-text-green"
              }`}
            >
              {timeRemaining !== null
                ? formatTimeRemaining(timeRemaining)
                : "--:--"}
            </span>
          </div>

          <div className="h-6 md:h-8 w-px bg-linear-to-b from-yellow-500/0 via-yellow-500/60 to-yellow-500/0" />
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs text-yellow-400/80 uppercase font-mono tracking-widest">
              {"//"} NODES
            </span>
            <span className="text-xs md:text-sm font-bold text-cyan-400 font-mono">
              {roomInfo?.connectedCount ?? "-"}/{roomInfo?.maxUsers ?? "-"}
            </span>
          </div>

          <div className="h-6 md:h-8 w-px bg-linear-to-b from-yellow-500/0 via-yellow-500/60 to-yellow-500/0" />

          {/* Encryption Status Indicator */}
          <button
            onClick={() => {
              if (isEncryptionEnabled) {
                setShowDisableConfirm(true);
              } else {
                setShowEncryptionSetup(true);
              }
            }}
            className="flex flex-col items-center group hover:scale-105 transition-transform cursor-pointer"
            title={
              isEncryptionEnabled
                ? "Encryption enabled - Click to disable"
                : "Encryption disabled - Click to enable"
            }
          >
            <span className="text-[10px] md:text-xs text-yellow-400/80 uppercase font-mono tracking-widest">
              {"//"} E2EE
            </span>
            <span
              className={`text-xs md:text-sm font-bold font-mono flex items-center gap-1 ${
                isEncryptionEnabled
                  ? "text-green-400 neon-text-green"
                  : "text-red-400/60"
              }`}
            >
              {isEncryptionEnabled ? "🔒 ON" : "🔓 OFF"}
            </span>
          </button>
        </div>

        <button
          onClick={() => destroyRoom()}
          className="text-[10px] md:text-xs cyber-button cyber-button-danger px-2.5 md:px-3 py-1 md:py-1.5 font-bold uppercase tracking-wider group flex items-center gap-1.5 cursor-pointer md:gap-2 disabled:opacity-50 md:w-auto justify-center ml-auto font-mono"
        >
          <span className="group-hover:animate-pulse ">⚠</span>
          TERMINATE
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin relative">
        {messages?.messages.length === 0 ? (
          <div className="space-y-4">
            <TypingIndicatorList
              typingUsers={typingUsers}
              currentUsername={username}
            />
          </div>
        ) : (
          <>
            {messages?.messages.map((msg, index) => {
              const isLatestOwnMessage =
                msg.sender === username &&
                index === messages.messages.length - 1;

              return (
                <DecryptedMessage
                  key={msg.id}
                  message={msg}
                  username={username}
                  roomId={roomId}
                  encryptionSecret={encryptionSecret}
                  isEncryptionEnabled={isEncryptionEnabled}
                  onReact={(emoji) => addReaction({ messageId: msg.id, emoji })}
                  onMarkAsRead={(messageId) => markAsRead({ messageId })}
                  isLatestOwnMessage={isLatestOwnMessage}
                  maxUsers={roomInfo?.maxUsers ?? 2}
                />
              );
            })}

            <TypingIndicatorList
              typingUsers={typingUsers}
              currentUsername={username}
            />

            <div ref={messagesEndRef} />
          </>
        )}
        {messages?.messages.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-yellow-400/50 text-sm font-mono">
              {"//"} AWAITING_INPUT...
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t-2 border-yellow-500/40 cyber-panel relative">
        {/* Corner accents */}
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-yellow-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        {/* Hexagonal accent */}
        <div className="absolute top-3 left-3 w-4 h-4 border border-yellow-400/20 rotate-45"></div>

        <div className="flex gap-2">
          <div className="flex-1 relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 neon-text-yellow font-mono text-sm pointer-events-none">
              {"//"}
            </span>
            <input
              ref={inputRef}
              autoFocus
              value={inputMessage}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputMessage.trim()) {
                  e.preventDefault();
                  sendMessage({ text: inputMessage });
                  // Scroll to bottom after sending
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }, 100);
                }
              }}
              onFocus={() => {
                // Scroll to bottom when keyboard opens
                handleInputFocus();
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                  });
                }, 300);
              }}
              onBlur={handleInputBlur}
              placeholder="TRANSMIT_MESSAGE..."
              onChange={(e) => {
                setInputMessage(e.target.value);
                handleTyping();
              }}
              type="text"
              inputMode="text"
              enterKeyHint="send"
              className="w-full cyber-input py-3 md:py-3 pl-10 pr-4 text-sm md:text-sm font-mono placeholder:text-yellow-900 placeholder:font-mono placeholder:uppercase min-h-11 touch-manipulation"
              /* Prevent zoom on iOS by using 16px font size on focus */
              style={{ fontSize: "16px" }}
            />
          </div>
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              setInputMessage((prev) => prev + emoji);
              inputRef.current?.focus();
            }}
            buttonClassName="cyber-button px-3 md:px-3 min-w-[44px] min-h-[44px] h-full cursor-pointer font-mono touch-manipulation flex items-center justify-center"
          />
          <button
            onClick={() => {
              sendMessage({ text: inputMessage });
              // Scroll to bottom after sending
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            disabled={!inputMessage.trim() || isPending}
            className="cyber-button px-4 md:px-6 min-w-11 min-h-11 text-sm font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-mono touch-manipulation"
          >
            SEND
          </button>
        </div>
      </div>

      {/* Encryption Setup Modal */}
      {showEncryptionSetup && (
        <EncryptionSetup
          onSetup={enableEncryption}
          onSkip={() => setShowEncryptionSetup(false)}
        />
      )}

      {/* Disable Encryption Confirmation Modal */}
      {showDisableConfirm && (
        <ConfirmModal
          title="DISABLE E2EE"
          message="Disable encryption? Messages will be sent in plain text."
          confirmText="DISABLE"
          cancelText="CANCEL"
          isDanger={true}
          onConfirm={() => {
            disableEncryption();
            setShowDisableConfirm(false);
          }}
          onCancel={() => setShowDisableConfirm(false)}
        />
      )}
    </main>
  );
};
export default Page;
