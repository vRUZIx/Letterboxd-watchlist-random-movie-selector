import React, { useState, useMemo, useEffect } from "react";
import { useWatchlist } from "./hooks/useWatchlist";
import { useRandomPicker } from "./hooks/useRandomPicker";
import { Header } from "./components/Header";
import { UsernameInput } from "./components/UsernameInput";
import { MovieCard } from "./components/MovieCard";
import { FilterPanel } from "./components/FilterPanel";
import { PickControls } from "./components/PickControls";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ErrorAlert } from "./components/ErrorAlert";
import { WatchlistGrid } from "./components/WatchlistGrid";
import { FilterOptions, WatchlistMovie } from "./types";
import { filterWatchlistMovies } from "./lib/utils";

const INITIAL_FILTERS: FilterOptions = {
  yearFrom: null,
  yearTo: null,
  decade: null,
  selectedGenres: [],
  minRuntime: null,
  maxRuntime: null,
  selectedLanguages: [],
  selectedCountries: [],
  animationOnly: false,
  documentaryOnly: false,
  hideDocumentaries: false,
  hideShorts: false,
  minRating: null,
  maxRating: null,
  searchQuery: "",
};

export default function App() {
  const {
    username,
    status,
    error,
    movies,
    totalMovies,
    fetchWatchlist,
    enrichMoviesBatch,
    clearWatchlist,
  } = useWatchlist();

  const {
    selectedMovie,
    remainingCount,
    totalPoolCount,
    poolExhausted,
    pickRandomMovie,
    resetPickedHistory,
    selectSpecificMovie,
  } = useRandomPicker();

  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);

  // Filtered movies memoization
  const filteredMovies = useMemo(() => {
    return filterWatchlistMovies(movies, filters);
  }, [movies, filters]);

  // Handle initial fetch of watchlist
  const handleFetch = async (user: string) => {
    resetPickedHistory();
    setFilters(INITIAL_FILTERS);
    const fetched = await fetchWatchlist(user);
    if (fetched && fetched.length > 0) {
      // Pick initial random movie right away
      pickRandomMovie(fetched);
      // Trigger background enrichment for first batch of 12 movies
      const slugs = fetched.slice(0, 15).map((m) => m.slug);
      enrichMoviesBatch(slugs);
    }
  };

  // When filters change or when background enrichment updates movies, batch enrich visible filtered movies
  useEffect(() => {
    if (filteredMovies.length > 0 && status === "ready") {
      const unEnrichedSlugs = filteredMovies
        .filter((m) => !m.enriched)
        .slice(0, 12)
        .map((m) => m.slug);
      if (unEnrichedSlugs.length > 0) {
        enrichMoviesBatch(unEnrichedSlugs);
      }
    }
  }, [filteredMovies, status, enrichMoviesBatch]);

  // Re-pick if active selected movie is filtered out
  useEffect(() => {
    if (selectedMovie && filteredMovies.length > 0) {
      const stillMatches = filteredMovies.some((m) => m.id === selectedMovie.id);
      if (!stillMatches) {
        pickRandomMovie(filteredMovies);
      }
    }
  }, [filteredMovies, selectedMovie, pickRandomMovie]);

  // Handle "Pick Another" button
  const handlePickAnother = () => {
    pickRandomMovie(filteredMovies);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    resetPickedHistory();
    if (movies.length > 0) {
      pickRandomMovie(movies);
    }
  };

  const isLoading = status === "fetching_watchlist";

  return (
    <div className="min-h-screen bg-[#050505] text-[#ededed] font-sans selection:bg-[#00e054] selection:text-black relative overflow-x-hidden flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#00e054]/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[300px] bg-[#40bcf4]/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <main className="pb-16">
        <Header onReset={clearWatchlist} />

        <UsernameInput
          initialUsername={username}
          onFetch={handleFetch}
          isLoading={isLoading}
        />

        {/* Loading State */}
        {isLoading && <LoadingSkeleton username={username} />}

        {/* Error State */}
        {status === "error" && error && (
          <ErrorAlert error={error} onRetry={() => username && handleFetch(username)} />
        )}

        {/* Success / Ready State */}
        {status === "ready" && (
          <div className="mt-6 animate-in fade-in duration-500">
            {/* Filter drawer / bar */}
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              totalMovies={totalMovies}
              filteredCount={filteredMovies.length}
            />

            {/* Selected Movie Display or No Matches Notice */}
            {filteredMovies.length > 0 && selectedMovie ? (
              <>
                <MovieCard movie={selectedMovie} />

                <PickControls
                  onPickAnother={handlePickAnother}
                  onResetHistory={resetPickedHistory}
                  remainingCount={remainingCount}
                  totalPoolCount={filteredMovies.length}
                  poolExhausted={poolExhausted}
                  isDisabled={filteredMovies.length === 0}
                />

                <WatchlistGrid
                  movies={filteredMovies}
                  selectedMovieId={selectedMovie.id}
                  onSelectMovie={selectSpecificMovie}
                />
              </>
            ) : (
              <div className="w-full max-w-md mx-auto my-12 px-4 text-center">
                <div className="rounded-3xl bg-[#0a0a0a] border border-white/10 p-8 shadow-2xl backdrop-blur-2xl">
                  <p className="text-lg font-bold text-white mb-2">No movies match your active filters</p>
                  <p className="text-sm text-white/50 mb-4">
                    Try broadening your release year, runtime, or genre constraints.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 rounded-xl bg-[#00e054] hover:bg-[#00e054]/90 text-black font-bold text-xs transition-all shadow-lg"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-white/30">
        <div className="max-w-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Letterboxd Randomizer. Not affiliated with Letterboxd Limited.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e054]" />
            <span>Equal Probability Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );

}
