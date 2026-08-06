import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";

const app = express();
const PORT = 3000;

app.use(express.json());

// Security response headers middleware
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// In-memory cache for enriched movie details
const movieCache = new Map<string, any>();

// Helper to fetch Letterboxd page with custom headers to prevent blocking
async function fetchLetterboxdPage(url: string): Promise<{ text: string; status: number }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  const text = await response.text();
  return { text, status: response.status };
}

// Upgrade Letterboxd poster URL resolution
function getHighResPoster(url: string | undefined): string {
  if (!url) return "";
  // Upgrade Letterboxd thumbnail size if matched
  return url
    .replace("-0-150-0-225-crop.jpg", "-0-500-0-750-crop.jpg")
    .replace("-0-70-0-105-crop.jpg", "-0-500-0-750-crop.jpg")
    .replace("-0-230-0-345-crop.jpg", "-0-500-0-750-crop.jpg");
}

// Parse single Letterboxd HTML watchlist page
function parseWatchlistPage(html: string) {
  const $ = cheerio.load(html);
  const movies: any[] = [];

  // Match poster containers across both legacy and modern Letterboxd DOM structures
  const posterElements = $(
    '[data-component-class="LazyPoster"], .poster-container, li.poster-container, div.film-poster, li.griditem, div.poster'
  );

  posterElements.each((_, elem) => {
    const $elem = $(elem);

    // Extract slug from data attributes or links
    const slug =
      $elem.attr("data-item-slug") ||
      $elem.attr("data-film-slug") ||
      $elem.find("[data-item-slug]").attr("data-item-slug") ||
      $elem.find("[data-film-slug]").attr("data-film-slug") ||
      $elem.find("div.film-poster").attr("data-film-slug") ||
      $elem.attr("data-target-link")?.replace(/^\/film\//, "").replace(/\/$/, "") ||
      $elem.find("a[href^='/film/']").attr("href")?.replace(/^\/film\//, "").replace(/\/$/, "");

    if (!slug) return;

    // Deduplicate within the same page
    if (movies.some((m) => m.slug === slug)) return;

    const fullName =
      $elem.attr("data-item-full-display-name") ||
      $elem.attr("data-item-name") ||
      $elem.attr("data-film-name") ||
      $elem.find("img").attr("alt") ||
      $elem.find(".frame-title").text() ||
      slug;

    let title = fullName.trim();
    let year: number | undefined;

    // Check for year in title e.g. "Movie Title (2024)"
    const yearMatchInTitle = title.match(/\((\d{4})\)$/);
    if (yearMatchInTitle) {
      year = parseInt(yearMatchInTitle[1], 10);
      title = title.replace(/\s*\(\d{4}\)$/, "").trim();
    }

    const yearAttr =
      $elem.attr("data-film-release-year") ||
      $elem.attr("data-year") ||
      $elem.find("[data-film-release-year]").attr("data-film-release-year");
    if (yearAttr && !year) {
      year = parseInt(yearAttr, 10);
    }

    // Fallback: extract year from slug if ending in -YYYY
    if (!year) {
      const slugYearMatch = slug.match(/-(\d{4})$/);
      if (slugYearMatch) {
        year = parseInt(slugYearMatch[1], 10);
      }
    }

    const $img = $elem.find("img");
    let rawPoster =
      $elem.attr("data-poster-url") ||
      $img.attr("src") ||
      $img.attr("data-src") ||
      $img.attr("data-original") ||
      "";

    if (rawPoster.includes("empty-poster") || rawPoster.startsWith("data:")) {
      rawPoster = $img.attr("data-src") || "";
    }

    const posterUrl = getHighResPoster(rawPoster);
    const letterboxdUrl = `https://letterboxd.com/film/${slug}/`;

    movies.push({
      id: `${slug}-${year || "0"}`,
      slug,
      title: title || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      year,
      posterUrl,
      letterboxdUrl,
    });
  });

  // Extract total pages count from pagination links
  let totalPages = 1;
  $("a[href*='/watchlist/page/']").each((_, elem) => {
    const href = $(elem).attr("href");
    if (href) {
      const match = href.match(/\/watchlist\/page\/(\d+)\//);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        if (pageNum > totalPages) {
          totalPages = pageNum;
        }
      }
    }
  });

  return { movies, totalPages };
}

// API Route: Fetch User Watchlist
app.post("/api/watchlist", async (req, res) => {
  try {
    const { username: rawUsername } = req.body;
    if (!rawUsername || typeof rawUsername !== "string") {
      return res.status(400).json({ error: "Username is required" });
    }

    // Clean username input (support URLs like letterboxd.com/username, @username, or username)
    const username = rawUsername
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?letterboxd\.com\//, "")
      .replace(/^@/, "")
      .replace(/\/.*$/, "");

    if (!username || !/^[a-zA-Z0-9._-]{1,50}$/.test(username)) {
      return res.status(400).json({ error: "Invalid username format" });
    }

    const firstPageUrl = `https://letterboxd.com/${encodeURIComponent(username)}/watchlist/page/1/`;
    const firstPage = await fetchLetterboxdPage(firstPageUrl);

    if (firstPage.status === 404) {
      return res.status(404).json({
        error: `Letterboxd user '${username}' was not found or has a private watchlist.`,
      });
    }

    if (firstPage.status !== 200) {
      return res.status(firstPage.status).json({
        error: `Failed to access Letterboxd for user '${username}'. (Status: ${firstPage.status})`,
      });
    }

    const { movies: firstPageMovies, totalPages } = parseWatchlistPage(firstPage.text);

    if (firstPageMovies.length === 0) {
      return res.json({
        username,
        totalMovies: 0,
        totalPages: 0,
        movies: [],
        message: `Watchlist for user '${username}' is empty or set to private.`,
      });
    }

    let allMovies = [...firstPageMovies];

    // Fetch subsequent pages if totalPages > 1
    if (totalPages > 1) {
      // Limit to max 35 pages (approx 980 movies) to keep response fast and reasonable
      const maxPagesToFetch = Math.min(totalPages, 35);
      const pagePromises: Promise<{ text: string; status: number }>[] = [];

      for (let p = 2; p <= maxPagesToFetch; p++) {
        const pageUrl = `https://letterboxd.com/${encodeURIComponent(username)}/watchlist/page/${p}/`;
        pagePromises.push(fetchLetterboxdPage(pageUrl));
      }

      const results = await Promise.all(pagePromises);
      for (const result of results) {
        if (result.status === 200) {
          const parsed = parseWatchlistPage(result.text);
          allMovies.push(...parsed.movies);
        }
      }
    }

    // Deduplicate movies by slug
    const uniqueMap = new Map<string, any>();
    for (const item of allMovies) {
      if (!uniqueMap.has(item.slug)) {
        uniqueMap.set(item.slug, item);
      }
    }
    const deduplicatedMovies = Array.from(uniqueMap.values());

    return res.json({
      username,
      totalMovies: deduplicatedMovies.length,
      totalPages,
      movies: deduplicatedMovies,
    });
  } catch (err: any) {
    console.error("Error fetching watchlist:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve watchlist" });
  }
});

// API Route: Enrich single or batch of movies
app.post("/api/enrich-batch", async (req, res) => {
  try {
    const { slugs } = req.body;
    if (!Array.isArray(slugs)) {
      return res.status(400).json({ error: "Slugs must be an array" });
    }

    const results: Record<string, any> = {};
    const unCachedSlugs: string[] = [];

    const validSlugRegex = /^[a-zA-Z0-9_-]+$/;
    for (const slug of slugs) {
      if (typeof slug === "string" && validSlugRegex.test(slug)) {
        if (movieCache.has(slug)) {
          results[slug] = movieCache.get(slug);
        } else {
          unCachedSlugs.push(slug);
        }
      }
    }

    // Limit batch to max 12 per request to prevent long timeouts
    const slugsToFetch = unCachedSlugs.slice(0, 12);

    const enrichPromises = slugsToFetch.map(async (slug) => {
      try {
        const url = `https://letterboxd.com/film/${slug}/`;
        const page = await fetchLetterboxdPage(url);
        if (page.status !== 200) return null;

        const $ = cheerio.load(page.text);

        // JSON-LD structured data with CDATA comment stripping
        let jsonLd: any = null;
        $('script[type="application/ld+json"]').each((_, elem) => {
          try {
            let raw = $(elem).html() || "";
            raw = raw.replace(/\/\* <!\[CDATA\[ \*\//g, "").replace(/\/\* \]\]> \*\//g, "").trim();
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed["@type"] === "Movie" || parsed["@type"]?.includes("Movie")) {
                jsonLd = parsed;
              }
            }
          } catch {}
        });

        const genres: string[] = [];
        if (jsonLd?.genre) {
          if (Array.isArray(jsonLd.genre)) {
            genres.push(...jsonLd.genre);
          } else if (typeof jsonLd.genre === "string") {
            genres.push(jsonLd.genre);
          }
        }

        // Fallback genres from HTML links
        if (genres.length === 0) {
          $('a[href^="/films/genre/"]').each((_, elem) => {
            const genreText = $(elem).text().trim();
            if (genreText && !genres.includes(genreText)) {
              genres.push(genreText);
            }
          });
        }

        // Directors
        const directors: string[] = [];
        if (jsonLd?.director) {
          const dirs = Array.isArray(jsonLd.director) ? jsonLd.director : [jsonLd.director];
          dirs.forEach((d: any) => {
            if (d?.name) directors.push(d.name);
          });
        }
        if (directors.length === 0) {
          $('a[href^="/director/"]').each((_, elem) => {
            const dName = $(elem).text().trim();
            if (dName && !directors.includes(dName)) directors.push(dName);
          });
        }

        // Rating
        let rating: number | undefined;
        if (jsonLd?.aggregateRating?.ratingValue) {
          const rawVal = parseFloat(jsonLd.aggregateRating.ratingValue);
          if (!isNaN(rawVal)) {
            // Letterboxd rating is out of 5. Convert to 10 scale (e.g. 4.2 -> 8.4)
            rating = parseFloat((rawVal * 2).toFixed(1));
          }
        } else {
          const twtData = $('meta[name="twitter:data2"]').attr("content");
          if (twtData) {
            const match = twtData.match(/([\d.]+)\s*out of 5/);
            if (match) rating = parseFloat((parseFloat(match[1]) * 2).toFixed(1));
          }
        }

        // Release year fallback
        let year: number | undefined;
        if (jsonLd?.dateCreated) {
          const yMatch = String(jsonLd.dateCreated).match(/^(\d{4})/);
          if (yMatch) year = parseInt(yMatch[1], 10);
        }
        if (!year) {
          const prodYear = $('meta[property="production:name-and-year"]').attr("content");
          if (prodYear) {
            const yMatch = prodYear.match(/\((\d{4})\)$/);
            if (yMatch) year = parseInt(yMatch[1], 10);
          }
        }

        // Languages & Countries from HTML
        const languages: string[] = [];
        $('a[href^="/films/language/"]').each((_, elem) => {
          const lang = $(elem).text().trim();
          if (lang && !languages.includes(lang)) languages.push(lang);
        });

        const countries: string[] = [];
        $('a[href^="/films/country/"]').each((_, elem) => {
          const c = $(elem).text().trim();
          if (c && !countries.includes(c)) countries.push(c);
        });

        // Runtime in minutes
        let runtime: number | undefined;
        const textFooter = $(".text-footer, .text-slugging, p.text-link, #tab-details").text();
        const runtimeMatch = textFooter.match(/(\d+)\s*mins\b/i) || page.text.match(/(\d+)\s*mins\b/i);
        if (runtimeMatch) {
          runtime = parseInt(runtimeMatch[1], 10);
        }

        // Overview
        let overview = $('meta[name="description"]').attr("content") || jsonLd?.description || "";
        overview = overview.replace(/^Directed by [^.]+\.\s*/i, "").trim();

        // Backdrop / Image
        const posterUrl =
          jsonLd?.image ||
          $('meta[property="og:image"]').attr("content") ||
          $('meta[name="twitter:image"]').attr("content") ||
          getHighResPoster($(".film-poster img").attr("src"));

        const isAnimation = genres.some((g) => g.toLowerCase() === "animation");
        const isDocumentary = genres.some((g) => g.toLowerCase() === "documentary");

        const enrichedData = {
          slug,
          year,
          genres,
          runtime,
          rating,
          languages,
          countries,
          directors,
          overview,
          posterUrl,
          isAnimation,
          isDocumentary,
        };

        movieCache.set(slug, enrichedData);
        return { slug, enrichedData };
      } catch (err) {
        return null;
      }
    });

    const enrichedResults = await Promise.all(enrichPromises);
    for (const item of enrichedResults) {
      if (item) {
        results[item.slug] = item.enrichedData;
      }
    }

    return res.json({ enriched: results });
  } catch (err: any) {
    console.error("Error enriching movies:", err);
    return res.status(500).json({ error: err.message || "Failed to enrich movies" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
