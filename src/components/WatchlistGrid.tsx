import React, { useState } from "react";
import { Grid, Film, Check } from "lucide-react";
import { WatchlistMovie } from "../types";

interface WatchlistGridProps {
  movies: WatchlistMovie[];
  selectedMovieId?: string;
  onSelectMovie: (movie: WatchlistMovie) => void;
}

export const WatchlistGrid: React.FC<WatchlistGridProps> = ({
  movies,
  selectedMovieId,
  onSelectMovie,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (movies.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 my-6">
      <div className="text-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-white/70 hover:text-white hover:border-white/20 text-xs font-semibold uppercase tracking-wider transition-all shadow-md backdrop-blur-md"
        >
          <Grid className="w-3.5 h-3.5 text-[#00e054]" />
          <span>{isOpen ? "Hide Watchlist Grid" : `Browse All Filtered Movies (${movies.length})`}</span>
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl animate-in fade-in duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-2">
            {movies.map((m) => {
              const isSelected = m.id === selectedMovieId;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMovie(m)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 bg-[#050505] ${
                    isSelected
                      ? "border-[#00e054] ring-2 ring-[#00e054]/40 shadow-lg shadow-[#00e054]/20"
                      : "border-white/10 hover:border-white/25 hover:scale-[1.02]"
                  }`}
                >
                  <div className="aspect-[2/3] w-full relative bg-[#080808]">
                    {m.posterUrl ? (
                      <img
                        src={m.posterUrl}
                        alt={m.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-white/30 text-xs">
                        <Film className="w-6 h-6 mb-1" />
                        <span>{m.title}</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#00e054] text-black flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="p-2 text-center bg-[#0a0a0a]">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-[#00e054] transition-colors">
                      {m.title}
                    </p>
                    {m.year && <p className="text-[10px] text-white/40">{m.year}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

