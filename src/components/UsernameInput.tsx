import React, { useState } from "react";
import { Dices, User, X } from "lucide-react";

interface UsernameInputProps {
  initialUsername?: string;
  onFetch: (username: string) => void;
  isLoading: boolean;
}

export const UsernameInput: React.FC<UsernameInputProps> = ({
  initialUsername = "",
  onFetch,
  isLoading,
}) => {
  const [username, setUsername] = useState<string>(initialUsername);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onFetch(username.trim());
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center rounded-2xl bg-[#0a0a0a]/90 border border-white/10 p-2 shadow-2xl backdrop-blur-xl transition-all group-focus-within:border-[#00e054]/60 group-focus-within:ring-1 group-focus-within:ring-[#00e054]/30">
          <div className="pl-3.5 pr-2 text-white/40">
            <User className="w-5 h-5 text-[#00e054]" />
          </div>

          <span className="text-white/40 font-mono text-sm select-none mr-1 hidden sm:inline">
            letterboxd.com/
          </span>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
            className="w-full bg-transparent py-2.5 px-2 text-white font-medium placeholder-white/30 focus:outline-none text-base"
          />

          {username && !isLoading && (
            <button
              type="button"
              onClick={() => setUsername("")}
              className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors mr-1"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="ml-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-sm tracking-tight shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Dices className="w-4 h-4" />
                <span>Get Watchlist</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

