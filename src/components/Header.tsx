import React from "react";
import { Sparkles } from "lucide-react";

interface HeaderProps {
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl shrink-0 px-4 sm:px-8 py-4 mb-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand logo & title */}
        <div 
          onClick={onReset}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00e054] via-[#40bcf4] to-[#ff8000] flex items-center justify-center p-[1px] shadow-lg shadow-black/40 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0a0a0a] rounded-[7px] flex items-center justify-center">
              <span className="text-xs font-black tracking-tighter text-white">RP</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider uppercase text-white group-hover:text-[#00e054] transition-colors">
                Letterboxd Random Picker
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            </div>
            <p className="text-[11px] text-white/40 font-medium">Equal probability watchlist randomizer</p>
          </div>
        </div>

        {/* Status pill & nav metadata */}
        <div className="flex items-center gap-4 text-xs font-medium text-white/50">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-[#00e054] animate-pulse" />
            <span className="text-[#00e054] text-[10px] font-bold tracking-widest uppercase">API ACTIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
};

