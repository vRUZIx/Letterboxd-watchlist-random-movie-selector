import { useState, useCallback, useMemo } from "react";
import { WatchlistMovie } from "../types";

interface UseRandomPickerReturn {
  selectedMovie: WatchlistMovie | null;
  pickedIds: Set<string>;
  remainingCount: number;
  totalPoolCount: number;
  poolExhausted: boolean;
  pickRandomMovie: (candidateMovies: WatchlistMovie[]) => WatchlistMovie | null;
  resetPickedHistory: () => void;
  selectSpecificMovie: (movie: WatchlistMovie) => void;
}

export function useRandomPicker(): UseRandomPickerReturn {
  const [selectedMovie, setSelectedMovie] = useState<WatchlistMovie | null>(null);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [poolExhausted, setPoolExhausted] = useState<boolean>(false);
  const [lastPoolSize, setLastPoolSize] = useState<number>(0);

  const pickRandomMovie = useCallback((candidateMovies: WatchlistMovie[]): WatchlistMovie | null => {
    if (!candidateMovies || candidateMovies.length === 0) {
      setSelectedMovie(null);
      return null;
    }

    setLastPoolSize(candidateMovies.length);

    // Find movies not yet picked
    let unpicked = candidateMovies.filter((m) => !pickedIds.has(m.id));
    let wasReset = false;

    // If all movies in filtered candidate list have been shown, reset history
    if (unpicked.length === 0) {
      unpicked = candidateMovies;
      wasReset = true;
      setPoolExhausted(true);
    } else {
      setPoolExhausted(false);
    }

    // Truly random selection with equal probability: Math.floor(Math.random() * unpicked.length)
    const randomIndex = Math.floor(Math.random() * unpicked.length);
    const chosen = unpicked[randomIndex];

    setSelectedMovie(chosen);

    setPickedIds((prev) => {
      const next = wasReset ? new Set<string>() : new Set(prev);
      next.add(chosen.id);
      return next;
    });

    return chosen;
  }, [pickedIds]);

  const resetPickedHistory = useCallback(() => {
    setPickedIds(new Set());
    setPoolExhausted(false);
  }, []);

  const selectSpecificMovie = useCallback((movie: WatchlistMovie) => {
    setSelectedMovie(movie);
    setPickedIds((prev) => {
      const next = new Set(prev);
      next.add(movie.id);
      return next;
    });
  }, []);

  const remainingCount = useMemo(() => {
    if (lastPoolSize === 0) return 0;
    const remaining = lastPoolSize - pickedIds.size;
    return remaining > 0 ? remaining : 0;
  }, [lastPoolSize, pickedIds]);

  return {
    selectedMovie,
    pickedIds,
    remainingCount,
    totalPoolCount: lastPoolSize,
    poolExhausted,
    pickRandomMovie,
    resetPickedHistory,
    selectSpecificMovie,
  };
}
