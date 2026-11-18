import React, { useState } from 'react';
import { Copy, Check, Sparkles, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  roomCode?: string;
  isConnected: boolean;
  participantCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ roomCode, isConnected, participantCount }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="relative z-10 w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-[rgba(226,185,122,0.15)] bg-[#1A0509]/80 backdrop-blur-md">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8C1D2A] to-[#E2B97A] p-[1px] flex items-center justify-center shadow-lg shadow-[#8C1D2A]/20">
          <div className="w-full h-full rounded-full bg-[#1A0509] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#E2B97A]" />
          </div>
        </div>
        <div>
          <span className="font-script text-2xl sm:text-3xl text-[#E2B97A] leading-none block">
            Tanış Ol
          </span>
          <span className="text-[10px] tracking-widest text-[#CDB9A3] uppercase block -mt-1">
            AI Müzakirə
          </span>
        </div>
      </div>

      {/* Center/Right Status */}
      <div className="flex items-center gap-3">
        {roomCode && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4A1219]/80 border border-[rgba(226,185,122,0.3)] text-xs font-mono text-[#F5E8D6] hover:border-[#E2B97A] transition-all cursor-pointer group"
            title="Kodu kopyala"
          >
            <span className="text-[#CDB9A3]">Otaq:</span>
            <span className="font-bold text-[#E2B97A] tracking-wider">{roomCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#CDB9A3] group-hover:text-[#E2B97A]" />
            )}
          </button>
        )}

        {/* Connection status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2B0A11] border border-[rgba(226,185,122,0.15)] text-[11px] text-[#CDB9A3]">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Canlı</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="hidden sm:inline">Qoşulur...</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
