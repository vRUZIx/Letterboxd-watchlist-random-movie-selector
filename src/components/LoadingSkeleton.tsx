import React from "react";
import { Film } from "lucide-react";

interface LoadingSkeletonProps {
  username?: string;
  message?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  username = "",
  message = "Retrieving watchlist movies from Letterboxd...",
}) => {
  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto my-8 px-4 text-center">
      <div className="rounded-3xl bg-[#0a0a0a] border border-white/10 p-6 shadow-2xl space-y-4">
        {/* Animated film poster placeholder */}
        <div className="relative w-full aspect-[2/3] rounded-2xl bg-[#050505] overflow-hidden flex flex-col items-center justify-center p-6 border border-white/5 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-white/5 to-black animate-pulse" />
          <Film className="w-14 h-14 text-[#00e054] animate-bounce mb-4 z-10" />
          <div className="h-4 w-3/4 bg-white/10 rounded-full animate-pulse z-10" />
          <div className="h-3 w-1/2 bg-white/5 rounded-full animate-pulse mt-2 z-10" />
        </div>

        {/* Status text */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-white">
            {username ? `Loading @${username}'s watchlist...` : "Loading..."}
          </p>
          <p className="text-xs text-white/50">{message}</p>

          {/* Progress loader bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-[#00e054] rounded-full animate-pulse" style={{ width: "70%" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

