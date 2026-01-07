"use client";

interface TypingIndicatorProps {
  username?: string;
  className?: string;
}

export const TypingIndicator = ({
  username,
  className = "",
}: TypingIndicatorProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {username && (
        <span className="text-xs text-zinc-500 font-medium">{username}</span>
      )}
      <div className="flex items-center gap-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-typing-bounce animation-delay-0" />
          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-typing-bounce animation-delay-150" />
          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-typing-bounce animation-delay-300" />
        </div>
      </div>
    </div>
  );
};

interface TypingIndicatorListProps {
  typingUsers: string[];
  currentUsername: string;
  className?: string;
}

export const TypingIndicatorList = ({
  typingUsers,
  currentUsername,
  className = "",
}: TypingIndicatorListProps) => {
  // Filter out current user
  const otherUsers = typingUsers.filter((user) => user !== currentUsername);

  if (otherUsers.length === 0) return null;

  return (
    <div className={`transition-all duration-200 ${className}`}>
      {otherUsers.map((user) => (
        <TypingIndicator key={user} username={user} />
      ))}
    </div>
  );
};
