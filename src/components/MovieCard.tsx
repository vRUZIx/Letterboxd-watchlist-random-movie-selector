import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Film, Star, Clock, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { WatchlistMovie } from "../types";
import { formatRuntime } from "../lib/utils";

interface MovieCardProps {
  movie: WatchlistMovie;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const enriched = movie.enriched;

  return (
    <motion.div
      key={movie.id}
      initial={{ opacity: 0, scale: 0.94, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm sm:max-w-md mx-auto"
    >
      <div className="relative group rounded-3xl bg-[#0a0a0a] border border-white/10 p-5 shadow-2xl backdrop-blur-2xl overflow-hidden hover:border-white/20 transition-all duration-300">
        {/* Glow backdrop effect */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#40bcf4]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#00e054]/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Poster Container */}
        <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-[#050505] border border-white/5 shadow-2xl group-hover:shadow-black transition-all">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
              <Film className="w-12 h-12 text-white/20 animate-bounce" />
            </div>
          )}

          {movie.posterUrl && !imageError ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-all duration-700 ${
                imageLoaded ? "opacity-95 scale-100" : "opacity-0 scale-105"
              }`}
            />
          ) : (
            <div className="w-full h-full bg-[#080808] flex flex-col items-center justify-center p-6 text-center">
              <Film className="w-16 h-16 text-white/20 mb-3" />
              <p className="text-white font-bold text-lg">{movie.title}</p>
              {movie.year && <p className="text-white/40 text-sm">{movie.year}</p>}
            </div>
          )}

          {/* Letterboxd Rating Badge Overlay */}
          {enriched?.rating && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#ff8000] text-black font-black text-xs tracking-wider uppercase shadow-lg">
              ★ {enriched.rating}
            </div>
          )}
        </div>

        {/* Title & Core Details */}
        <div className="mt-5 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none drop-shadow-md">
            {movie.title}
          </h2>

          <div className="mt-2.5 flex items-center justify-center flex-wrap gap-2 text-xs font-medium text-white/50">
            {movie.year && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-white font-semibold border border-white/10 text-[11px]">
                <Calendar className="w-3 h-3 text-[#00e054]" />
                {movie.year}
              </span>
            )}

            {enriched?.runtime && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-white font-semibold border border-white/10 text-[11px]">
                <Clock className="w-3 h-3 text-[#40bcf4]" />
                {formatRuntime(enriched.runtime)}
              </span>
            )}
          </div>

          {/* Genres pills if enriched */}
          {enriched?.genres && enriched.genres.length > 0 && (
            <div className="mt-3 flex items-center justify-center flex-wrap gap-1.5">
              {enriched.genres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 border border-white/10 text-white/80"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Directors / Overview toggle */}
          {enriched && (enriched.directors?.length > 0 || enriched.overview) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-3 inline-flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
            >
              <span>{showDetails ? "Hide overview" : "More details"}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <AnimatePresence>
            {showDetails && enriched && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 text-left bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white/80 space-y-2 overflow-hidden"
              >
                {enriched.directors && enriched.directors.length > 0 && (
                  <p>
                    <span className="text-white/40 font-semibold">Director: </span>
                    <span className="text-white font-medium">{enriched.directors.join(", ")}</span>
                  </p>
                )}
                {enriched.countries && enriched.countries.length > 0 && (
                  <p>
                    <span className="text-white/40 font-semibold">Country: </span>
                    <span className="text-white/80">{enriched.countries.join(", ")}</span>
                  </p>
                )}
                {enriched.overview && (
                  <p className="text-white/60 leading-relaxed italic border-t border-white/10 pt-2">
                    "{enriched.overview}"
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Direct Letterboxd Link */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center">
            <a
              href={movie.letterboxdUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all border border-white/10"
            >
              <span>Open in Letterboxd</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/40" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

