# 🎬 Letterboxd Watchlist Random Picker

A modern, fast, and secure web application to randomly select movies from any public Letterboxd watchlist with custom filters and equal-probability picking logic.

---

## ✨ Features

- **🎲 Equal Probability Picker**: Fairly select movies from any public Letterboxd watchlist.
- **🎯 Custom Filters**: Filter watchlists by:
  - Release year & decade
  - Genres (Action, Sci-Fi, Drama, etc.)
  - Runtime duration (min / max minutes)
  - Letterboxd ratings & user scores
  - Primary languages & production countries
  - Animation & Documentary toggles
- **⚡ Background Metadata Enrichment**: Automatically fetches high-resolution posters, directors, genres, and metadata in non-blocking background batches.
- **🔒 Hardened Security**: Built-in SSRF protection, strict regex input validation, and HTTP security response headers.
- **🎨 Sleek Modern UI**: Premium dark aesthetics, responsive grid, glassmorphism, and micro-animations.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion, Lucide React
- **Backend**: Node.js, Express, Cheerio (Web Scraper)
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/letterboxd-random-picker.git
   cd letterboxd-random-picker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:3000`

---

## 📦 Scripts

- `npm run dev` — Start the local development server with Express & Vite HMR.
- `npm run build` — Build the production Vite client and bundle the Express server.
- `npm run start` — Run the bundled production server (`dist/server.cjs`).
- `npm run lint` — Run TypeScript type checking.
- `npm run clean` — Cross-platform deletion of build artifacts.

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

This project includes a pre-configured [`vercel.json`](vercel.json) file for fullstack serverless deployment.

1. Push your code to GitHub.
2. Import the repository on [Vercel](https://vercel.com/new).
3. Vercel will automatically detect `vercel.json` and deploy both the Vite frontend and Express API endpoints.

---

## 📄 License

Distributed under the MIT License.

*Disclaimer: This application is an independent open-source tool and is not affiliated with or endorsed by Letterboxd Limited.*