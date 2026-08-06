export interface WatchlistMovie {
  id: string;
  slug: string;
  title: string;
  year?: number;
  posterUrl: string;
  letterboxdUrl: string;
  // Enriched data optional initially
  enriched?: MovieEnriched;
}

export interface MovieEnriched {
  slug: string;
  genres: string[];
  runtime?: number; // in minutes
  rating?: number; // 0 to 10 scale
  languages: string[];
  countries: string[];
  directors: string[];
  overview?: string;
  backdropUrl?: string;
  posterUrl?: string;
  tagline?: string;
  isAnimation: boolean;
  isDocumentary: boolean;
}

export interface FilterOptions {
  yearFrom: number | null;
  yearTo: number | null;
  decade: string | null;
  selectedGenres: string[];
  minRuntime: number | null;
  maxRuntime: number | null;
  selectedLanguages: string[];
  selectedCountries: string[];
  animationOnly: boolean;
  documentaryOnly: boolean;
  hideDocumentaries: boolean;
  hideShorts: boolean;
  minRating: number | null;
  maxRating: number | null;
  searchQuery: string;
}

export interface FetchWatchlistResponse {
  username: string;
  totalMovies: number;
  totalPages: number;
  movies: WatchlistMovie[];
  error?: string;
}

export type FetchStatus = 'idle' | 'fetching_watchlist' | 'enriching' | 'ready' | 'error';
