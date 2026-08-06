import React from "react";
import { Dices, RotateCcw, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface PickControlsProps {
  onPickAnother: () => void;
  onResetHistory: () => void;
  remainingCount: number;
  totalPoolCount: number;
  poolExhausted: boolean;
  isDisabled: boolean;
}

export const PickControls: React.FC<PickControlsProps> = ({
  onPickAnother,
  onResetHistory,
  remainingCount,
  totalPoolCount,
  poolExhausted,
  isDisabled,
}) => {
  return (
    <div className="w-full max-w-sm mx-auto my-6 px-4 flex flex-col items-center justify-center space-y-3">
      {poolExhausted && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-1 rounded-full bg-[#ff8000]/20 border border-[#ff8000]/40 text-[#ff8000] text-xs font-semibold flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#ff8000]" />
          <span>All candidates shown! Pool automatically reset.</span>
        </motion.div>
      )}

      {/* Primary Pick Another Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isDisabled}
        onClick={onPickAnother}
        className="w-full py-4 px-6 rounded-2xl bg-[#00e054] hover:bg-[#00e054]/90 text-black font-black text-base tracking-wide shadow-2xl shadow-[#00e054]/20 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <Dices className="w-5 h-5" />
        <span>Pick Another Movie</span>
      </motion.button>

      {/* Pool Remaining Readout & Reset Pool Button */}
      {totalPoolCount > 0 && (
        <div className="flex items-center justify-between w-full px-2 text-xs font-medium text-white/40">
          <span>
            Unseen pool: <strong className="text-[#00e054] font-bold">{remainingCount}</strong> / {totalPoolCount}
          </span>
          <button
            onClick={onResetHistory}
            className="text-white/40 hover:text-white transition-colors flex items-center gap-1"
            title="Reset seen history"
          >
            <RotateCcw className="w-3 h-3" /> Reset History
          </button>
        </div>
      )}
    </div>
  );
};

