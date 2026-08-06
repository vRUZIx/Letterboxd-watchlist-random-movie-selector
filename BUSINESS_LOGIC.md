# 🧠 Business Logic & System Architecture

This document explains the business goals, system architecture, core algorithms, data flow, and technical implementation details of the **Letterboxd Watchlist Random Picker**.

---

## 🎯 1. Business Purpose & Problem Statement

### Problem
Movie enthusiasts on Letterboxd often add hundreds or thousands of films to their personal watchlists. When it comes time to choose what to watch, users suffer from **decision paralysis** due to overwhelming options. Furthermore, standard Letterboxd sorting options (by release date, popularity, or rating) introduce bias toward specific subset of movies.

### Solution
The **Letterboxd Watchlist Random Picker** provides an **Equal-Probability Random Selection Engine** that:
1. Instantly ingests any public Letterboxd user watchlist.
2. Applies strict, multi-dimensional user filters (genre, decade, runtime, rating, country, language).
3. Guarantees fair, unbiased uniform random selection from the remaining filtered pool.
4. Enriches film details with rich metadata (directors, rating, runtime, high-res posters) in non-blocking background batches.

---

## 🏗️ 2. System Architecture & Data Flow

```
┌─────────────────────────┐               ┌──────────────────────────┐               ┌────────────────────────┐
│   React 19 Frontend     │               │   Express API Backend    │               │     Letterboxd.com     │
│   (Vite SPA + State)    │               │  (Node.js + Cheerio)     │               │    (HTML / JSON-LD)    │
└───────────┬─────────────┘               └────────────┬─────────────┘               └───────────┬────────────┘
            │                                          │                                         │
            │  1. POST /api/watchlist {username}       │                                         │
            ├─────────────────────────────────────────►│  2. HTTP GET watchlist pages          │
            │                                          ├────────────────────────────────────────►│
            │                                          │  3. Return raw HTML watchlist           │
            │                                          │◄────────────────────────────────────────┤
            │  4. JSON Watchlist Array [{slug, title}] │                                         │
            │◄─────────────────────────────────────────┤                                         │
            │                                          │                                         │
            │  5. POST /api/enrich-batch {slugs}       │                                         │
            ├─────────────────────────────────────────►│  6. HTTP GET film detail pages        │
            │                                          ├────────────────────────────────────────►│
            │                                          │  7. Return raw film HTML / JSON-LD      │
            │                                          │◄────────────────────────────────────────┤
            │  8. JSON Enriched Metadata               │                                         │
            │◄─────────────────────────────────────────┤                                         │
```

---

## ⚙️ 3. Core Business Workflows & Algorithms

### Workflow A: Watchlist Scraping & Pagination Parsing (`/api/watchlist`)

1. **Input Normalization & Validation**:
   - Raw input string is cleaned (`rawUsername.trim().toLowerCase()`).
   - Handles full URLs (`https://letterboxd.com/username`), handles `@username`, or plain usernames.
   - Enforces strict regex validation (`/^[a-zA-Z0-9._-]{1,50}$/`) to prevent injection & invalid requests.

2. **First Page & Pagination Detection**:
   - Queries `https://letterboxd.com/{username}/watchlist/page/1/` with realistic browser User-Agent headers.
   - Parses poster elements using Cheerio (`[data-component-class="LazyPoster"], .poster-container, div.film-poster`).
   - Extracts `slug`, `fullName`, `releaseYear`, and poster image URLs.
   - Scans pagination links (`a[href*='/watchlist/page/']`) to determine `totalPages`.

3. **Concurrent Sub-Page Batching**:
   - If `totalPages > 1`, constructs page URLs up to max 35 pages (~980 movies).
   - Executes concurrent requests using `Promise.all()` to minimize total wait time.
   - Merges and deduplicates movies by unique `slug` string in a `Map<string, Movie>`.

---

### Workflow B: Equal-Probability Random Picker Engine (`useRandomPicker.ts`)

1. **Pool Initialization**:
   - Maintains an array of currently available movie IDs based on active filters.

2. **Uniform Random Index Selection**:
   - Uses pseudo-random uniform selection:
     $$\text{Index} = \lfloor \text{Math.random()} \times \text{RemainingPool.length} \rfloor$$
   - Guarantees every matching movie in the watchlist has an exact equal probability ($P = \frac{1}{N}$) of being selected.

3. **History & Exhaustion Tracking**:
   - Pushes selected movie ID to `pickedHistory` set so it is not picked again in the current session until the pool is exhausted.
   - Automatically detects when remaining pool is exhausted and prompts the user to reset or re-shuffle.

---

### Workflow C: Background Metadata Enrichment (`/api/enrich-batch`)

1. **On-Demand Lazy Enrichment**:
   - To keep initial response fast, watchlist fetching only retrieves basic fields (`title`, `year`, `slug`, `posterUrl`).
   - As movies are displayed or filtered, frontend triggers background batch enrichment for un-enriched items (max 12 per request).

2. **Structured JSON-LD & HTML Extraction**:
   - Fetches film page `https://letterboxd.com/film/{slug}/`.
   - Extracts JSON-LD schema (`<script type="application/ld+json">`):
     - `aggregateRating.ratingValue` -> Converted from 5-star scale to 10-point scale ($R_{10} = \text{Round}(R_5 \times 2, 1)$).
     - `genre`, `director`, `dateCreated`, `image`, `description`.
   - Fallback HTML parsing with Cheerio for runtime (`mins`), languages, production countries, and genre links.

3. **In-Memory Server Cache (`movieCache`)**:
   - Stores enriched movie objects in a Node.js server `Map<string, EnrichedMovie>`.
   - Subsequent requests for the same movie slug return instantly from memory cache.

---

### Workflow D: Client-Side Multi-Dimensional Filtering (`filterWatchlistMovies`)

Applies pure, functional filter criteria sequentially in client memory:

| Filter | Condition / Business Rule |
| :--- | :--- |
| **Search Query** | Case-insensitive substring match on title, director, or slug |
| **Release Year Range** | `movie.year >= yearFrom && movie.year <= yearTo` |
| **Decade** | `Math.floor(movie.year / 10) * 10 === decade` |
| **Runtime Duration** | `movie.runtime >= minRuntime && movie.runtime <= maxRuntime` |
| **Genres** | Matching selected genre array (AND / OR evaluation) |
| **Rating Score** | `movie.rating >= minRating && movie.rating <= maxRating` |
| **Animation / Doc Flags** | Includes/excludes based on `isAnimation` or `isDocumentary` flags |

---

## 🔒 4. Security & Hardening Architecture

1. **SSRF & Path Traversal Prevention**:
   - Movie slugs in `/api/enrich-batch` are strictly validated with `/^[a-zA-Z0-9_-]+$/`.
   - Prevents external URL injection or directory traversal requests via backend scraper.

2. **Rate & Concurrency Caps**:
   - Maximum 35 watchlist pages per user request (~980 movies).
   - Maximum 12 film enrichment requests per batch call.

3. **HTTP Response Security Headers**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 💻 5. Component Breakdown

| Component / Hook | Purpose |
| :--- | :--- |
| `useWatchlist.ts` | Handles watchlist fetching state, progress, and background batch enrichment |
| `useRandomPicker.ts` | Manages random selection algorithm, remaining pool count, and pick history |
| `UsernameInput.tsx` | Sanitized input form for submitting Letterboxd username/URL |
| `MovieCard.tsx` | Displays active selected movie with high-res poster, rating, runtime, and directors |
| `FilterPanel.tsx` | Drawer interface for year, decade, runtime, genre, rating, and language filters |
| `WatchlistGrid.tsx` | Grid visualization of all filtered movies in the current pool |
