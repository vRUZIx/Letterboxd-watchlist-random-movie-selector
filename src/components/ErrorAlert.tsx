import React from "react";
import { AlertTriangle, RefreshCw, UserX, Film } from "lucide-react";

interface ErrorAlertProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onRetry }) => {
  const isPrivateOrNotFound =
    error.toLowerCase().includes("not found") || error.toLowerCase().includes("private");
  const isEmpty = error.toLowerCase().includes("empty");

  return (
    <div className="w-full max-w-md mx-auto my-8 px-4">
      <div className="rounded-3xl bg-[#0a0a0a] border border-rose-500/20 p-6 shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          {isPrivateOrNotFound ? (
            <UserX className="w-6 h-6" />
          ) : isEmpty ? (
            <Film className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Watchlist Fetch Error</h3>
          <p className="mt-1 text-sm text-white/70 leading-relaxed">{error}</p>
        </div>

        <div className="text-xs text-white/50 bg-[#050505] p-3 rounded-xl border border-white/10 text-left space-y-1">
          <p className="font-semibold text-white/80">Troubleshooting hints:</p>
          <ul className="list-disc list-inside space-y-0.5 text-white/50">
            <li>Check if the Letterboxd profile is set to <strong>Public</strong>.</li>
            <li>Verify the username spelling.</li>
            <li>Verify the watchlist has at least one movie.</li>
          </ul>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/10"
          >
            <RefreshCw className="w-4 h-4 text-[#00e054]" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
};

