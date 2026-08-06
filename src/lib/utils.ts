import { FilterOptions, WatchlistMovie } from "../types";

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatRuntime(mins?: number): string {
  if (!mins) return "N/A";
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function getDecadeFromYear(year?: number): string | null {
  if (!year) return null;
  const decadeStart = Math.floor(year / 10) * 10;
  if (decadeStart < 1970) return "pre-1970s";
  return `${decadeStart}s`;
}

export function filterWatchlistMovies(
  movies: WatchlistMovie[],
  filters: FilterOptions
): WatchlistMovie[] {
  return movies.filter((movie) => {
    // 1. Search Query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const titleMatch = movie.title.toLowerCase().includes(q);
      const yearMatch = movie.year?.toString().includes(q);
      if (!titleMatch && !yearMatch) return false;
    }

    // 2. Year From / To
    if (filters.yearFrom !== null && movie.year) {
      if (movie.year < filters.yearFrom) return false;
    }
    if (filters.yearTo !== null && movie.year) {
      if (movie.year > filters.yearTo) return false;
    }

    // 3. Decade Filter
    if (filters.decade) {
      if (!movie.year) return false;
      const dec = getDecadeFromYear(movie.year);
      if (filters.decade === "pre-1970s") {
        if (movie.year >= 1970) return false;
      } else if (dec !== filters.decade) {
        return false;
      }
    }

    const enriched = movie.enriched;

    // Quick genre toggles: Animation only, Documentary only, Hide documentaries
    if (filters.animationOnly) {
      if (!enriched || !enriched.isAnimation) return false;
    }

    if (filters.documentaryOnly) {
      if (!enriched || !enriched.isDocumentary) return false;
    }

    if (filters.hideDocumentaries) {
      if (enriched && enriched.isDocumentary) return false;
    }

    // Hide Shorts (< 40 min)
    if (filters.hideShorts) {
      if (enriched?.runtime && enriched.runtime < 40) return false;
    }

    // 4. Selected Genres (must contain ALL or ANY selected genre)
    if (filters.selectedGenres.length > 0) {
      if (!enriched || !enriched.genres || enriched.genres.length === 0) return false;
      const movieGenreSet = new Set(enriched.genres.map((g) => g.toLowerCase()));
      const match = filters.selectedGenres.some((sg) => movieGenreSet.has(sg.toLowerCase()));
      if (!match) return false;
    }

    // 5. Runtime (Min & Max)
    if (filters.minRuntime !== null) {
      if (enriched?.runtime && enriched.runtime < filters.minRuntime) return false;
    }
    if (filters.maxRuntime !== null) {
      if (enriched?.runtime && enriched.runtime > filters.maxRuntime) return false;
    }

    // 6. Languages
    if (filters.selectedLanguages.length > 0) {
      if (!enriched || !enriched.languages || enriched.languages.length === 0) return false;
      const langSet = new Set(enriched.languages.map((l) => l.toLowerCase()));
      const match = filters.selectedLanguages.some((sl) => langSet.has(sl.toLowerCase()));
      if (!match) return false;
    }

    // 7. Countries
    if (filters.selectedCountries.length > 0) {
      if (!enriched || !enriched.countries || enriched.countries.length === 0) return false;
      const countrySet = new Set(enriched.countries.map((c) => c.toLowerCase()));
      const match = filters.selectedCountries.some((sc) => countrySet.has(sc.toLowerCase()));
      if (!match) return false;
    }

    // 8. Rating Range
    if (filters.minRating !== null) {
      if (enriched?.rating !== undefined && enriched.rating < filters.minRating) return false;
    }
    if (filters.maxRating !== null) {
      if (enriched?.rating !== undefined && enriched.rating > filters.maxRating) return false;
    }

    return true;
  });
}

export const GENRE_LIST = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
];

export const DECADE_LIST = [
  "2020s",
  "2010s",
  "2000s",
  "1990s",
  "1980s",
  "1970s",
  "pre-1970s",
];

export const POPULAR_USERNAMES = ["ruzi", "davidehrlich", "edgarwright", "kino"];
