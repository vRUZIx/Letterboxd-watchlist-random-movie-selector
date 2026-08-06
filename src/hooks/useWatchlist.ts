import { useState, useCallback, useRef } from "react";
import { FetchStatus, WatchlistMovie } from "../types";

interface UseWatchlistReturn {
  username: string;
  status: FetchStatus;
  error: string | null;
  movies: WatchlistMovie[];
  totalMovies: number;
  totalPages: number;
  progress: { current: number; total: number; message: string };
  fetchWatchlist: (user: string) => Promise<WatchlistMovie[] | null>;
  enrichMoviesBatch: (movieSlugs: string[]) => Promise<void>;
  clearWatchlist: () => void;
}

export function useWatchlist(): UseWatchlistReturn {
  const [username, setUsername] = useState<string>("");
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [movies, setMovies] = useState<WatchlistMovie[]>([]);
  const [totalMovies, setTotalMovies] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });

  const sessionCacheRef = useRef<Map<string, WatchlistMovie[]>>(new Map());
  const enrichedCacheRef = useRef<Map<string, any>>(new Map());

  const fetchWatchlist = useCallback(async (user: string): Promise<WatchlistMovie[] | null> => {
    const cleanUser = user.trim().toLowerCase().replace(/^@/, "");
    if (!cleanUser) {
      setError("Please enter a valid Letterboxd username.");
      setStatus("error");
      return null;
    }

    setUsername(cleanUser);
    setError(null);

    // Check session cache
    if (sessionCacheRef.current.has(cleanUser)) {
      const cached = sessionCacheRef.current.get(cleanUser)!;
      setMovies(cached);
      setTotalMovies(cached.length);
      setStatus("ready");
      return cached;
    }

    setStatus("fetching_watchlist");
    setProgress({ current: 1, total: 1, message: `Accessing Letterboxd for @${cleanUser}...` });

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const errorMsg = data.error || `Failed to fetch watchlist for @${cleanUser}`;
        setError(errorMsg);
        setStatus("error");
        return null;
      }

      const fetchedMovies: WatchlistMovie[] = data.movies || [];

      if (fetchedMovies.length === 0) {
        setError(`User @${cleanUser}'s watchlist is empty.`);
        setStatus("error");
        return null;
      }

      setMovies(fetchedMovies);
      setTotalMovies(data.totalMovies || fetchedMovies.length);
      setTotalPages(data.totalPages || 1);
      sessionCacheRef.current.set(cleanUser, fetchedMovies);

      setStatus("ready");
      return fetchedMovies;
    } catch (err: any) {
      const msg = err?.message || "Network error while connecting to server.";
      setError(msg);
      setStatus("error");
      return null;
    }
  }, []);

  // Batch enrich movies details in background
  const enrichMoviesBatch = useCallback(async (movieSlugs: string[]) => {
    const unEnriched = movieSlugs.filter((slug) => !enrichedCacheRef.current.has(slug));
    if (unEnriched.length === 0) return;

    try {
      const res = await fetch("/api/enrich-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: unEnriched }),
      });

      if (!res.ok) return;
      const data = await res.json();
      const enrichedMap = data.enriched || {};

      for (const slug of Object.keys(enrichedMap)) {
        enrichedCacheRef.current.set(slug, enrichedMap[slug]);
      }

      // Update movies state with enriched metadata
      setMovies((prevMovies) =>
        prevMovies.map((m) => {
          if (enrichedMap[m.slug]) {
            return {
              ...m,
              enriched: enrichedMap[m.slug],
              posterUrl: enrichedMap[m.slug].posterUrl || m.posterUrl,
            };
          }
          return m;
        })
      );
    } catch (e) {
      console.warn("Failed background movie enrichment:", e);
    }
  }, []);

  const clearWatchlist = useCallback(() => {
    setUsername("");
    setMovies([]);
    setTotalMovies(0);
    setTotalPages(0);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    username,
    status,
    error,
    movies,
    totalMovies,
    totalPages,
    progress,
    fetchWatchlist,
    enrichMoviesBatch,
    clearWatchlist,
  };
}
