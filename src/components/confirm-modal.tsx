"use client";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export const ConfirmModal = ({
  title,
  message,
  confirmText = "CONFIRM",
  cancelText = "CANCEL",
  onConfirm,
  onCancel,
  isDanger = false,
}: ConfirmModalProps) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="cyber-panel max-w-md w-full p-6 relative border-2 border-yellow-500/60 shadow-[0_0_30px_rgba(252,238,10,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner accents - CP2077 style */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-yellow-400"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-yellow-400"></div>

        {/* Hexagonal accent */}
        <div className="absolute top-4 right-4 w-6 h-6 border border-yellow-400/30 rotate-45"></div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{isDanger ? "⚠" : "⚡"}</span>
          <h2 className="text-lg font-bold neon-text-yellow uppercase tracking-wide font-mono">
            {title}
          </h2>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-sm text-cyan-100/80 font-mono leading-relaxed">
            <span className="text-yellow-400/80 mr-2">{"//"}</span>
            {message}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="cyber-button px-4 py-2 text-sm font-bold uppercase tracking-wider font-mono hover:scale-105 transition-transform"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`${
              isDanger ? "cyber-button-danger" : "cyber-button-primary"
            } px-4 py-2 text-sm font-bold uppercase tracking-wider font-mono hover:scale-105 transition-transform`}
          >
            {confirmText}
          </button>
        </div>

        {/* Scanline effect */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-yellow-500/5 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};
