"use client";

import { useState } from "react";
import { generateSecret, isValidSecret } from "@/lib/crypto";

interface EncryptionSetupProps {
  onSetup: (secret: string) => void;
  onSkip: () => void;
}

export const EncryptionSetup = ({ onSetup, onSkip }: EncryptionSetupProps) => {
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copyStatus, setCopyStatus] = useState("COPY");

  const handleGenerate = () => {
    const newSecret = generateSecret();
    setSecret(newSecret);
    setShowSecret(true);
  };

  const handleCopy = async () => {
    if (secret) {
      try {
        await navigator.clipboard.writeText(secret);
        setCopyStatus("COPIED!");
        setTimeout(() => setCopyStatus("COPY"), 2000);
      } catch {
        setCopyStatus("FAILED");
        setTimeout(() => setCopyStatus("COPY"), 2000);
      }
    }
  };

  const handleSubmit = () => {
    if (isValidSecret(secret)) {
      onSetup(secret);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="cyber-panel max-w-md w-full p-6 border-2 relative overflow-hidden">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-yellow-400"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-yellow-400"></div>

        <div className="space-y-4 relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold neon-text-yellow uppercase tracking-widest font-mono">
              🔐 E2EE SETUP
            </h2>
            <p className="text-cyan-400/80 text-sm font-mono">
              {"//"} END-TO-END ENCRYPTION
            </p>
          </div>

          <div className="space-y-3 bg-black/40 p-4 border border-yellow-400/30">
            <p className="text-yellow-400/70 text-xs font-mono leading-relaxed">
              Enable client-side encryption for maximum privacy. Messages are
              encrypted before leaving your device using AES-256-GCM.
            </p>
            <ul className="space-y-1 text-cyan-400/60 text-xs font-mono">
              <li>• Keys derived from room ID + secret</li>
              <li>• Server cannot read your messages</li>
              <li>• Share secret with participants</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-yellow-400 font-mono text-xs uppercase tracking-widest">
              <span className="text-cyan-400 mr-2">{"//"}</span> ENCRYPTION_KEY
            </label>
            <div className="flex gap-2">
              <input
                type={showSecret ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Generate or enter secret key..."
                className="flex-1 min-w-0 cyber-input p-3 text-sm font-mono placeholder:text-yellow-900 placeholder:font-mono"
              />
              <button
                onClick={handleCopy}
                disabled={!secret}
                className="cyber-button px-3 text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                title="Copy key"
              >
                {copyStatus === "COPIED!" ? "✓" : "📋"}
              </button>
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="cyber-button px-3 text-xs font-mono shrink-0 cursor-pointer"
                title={showSecret ? "Hide" : "Show"}
              >
                {showSecret ? "👁️" : "🔒"}
              </button>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full cyber-button p-4 md:p-3 min-h-12 text-sm font-bold uppercase tracking-widest font-mono touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
          >
            <span className="relative z-10">{"//"} GENERATE_RANDOM_KEY</span>
          </button>

          {secret && isValidSecret(secret) && (
            <div className="bg-green-500/10 border border-green-500/30 p-3 text-center">
              <p className="text-green-400 text-xs font-mono">
                ✓ Valid encryption key
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!isValidSecret(secret)}
              className="flex-1 cyber-button p-4 md:p-3 min-h-12 text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed font-mono touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
            >
              ENABLE E2EE
            </button>
            <button
              onClick={onSkip}
              className="flex-1 bg-black/50 border-2 border-cyan-400/30 p-4 md:p-3 min-h-12 text-sm font-bold uppercase tracking-widest text-cyan-400/60 hover:text-cyan-400 transition-colors font-mono touch-manipulation active:scale-[0.98] cursor-pointer"
            >
              SKIP
            </button>
          </div>

          <p className="text-cyan-400/40 text-[10px] font-mono text-center">
            ⚠ Save this key! You&apos;ll need it to decrypt messages.
          </p>
        </div>
      </div>
    </div>
  );
};
