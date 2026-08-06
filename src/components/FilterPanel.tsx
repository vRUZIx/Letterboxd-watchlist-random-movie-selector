import React, { useState } from "react";
import { SlidersHorizontal, X, RotateCcw, Check, ChevronDown, ChevronUp, Search, Film, Clock, Calendar } from "lucide-react";
import { FilterOptions } from "../types";
import { GENRE_LIST, DECADE_LIST } from "../lib/utils";

interface FilterPanelProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  onReset: () => void;
  totalMovies: number;
  filteredCount: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  onReset,
  totalMovies,
  filteredCount,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Calculate active filters count
  const activeCount =
    (filters.yearFrom ? 1 : 0) +
    (filters.yearTo ? 1 : 0) +
    (filters.decade ? 1 : 0) +
    filters.selectedGenres.length +
    (filters.minRuntime ? 1 : 0) +
    (filters.maxRuntime ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.animationOnly ? 1 : 0) +
    (filters.documentaryOnly ? 1 : 0) +
    (filters.hideDocumentaries ? 1 : 0) +
    (filters.hideShorts ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  const toggleGenre = (genre: string) => {
    const exists = filters.selectedGenres.includes(genre);
    const updated = exists
      ? filters.selectedGenres.filter((g) => g !== genre)
      : [...filters.selectedGenres, genre];
    onChange({ ...filters, selectedGenres: updated });
  };

  const handleDecadeClick = (decade: string) => {
    const nextDecade = filters.decade === decade ? null : decade;
    onChange({ ...filters, decade: nextDecade });
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 my-4">
      {/* Bar trigger / Quick summary */}
      <div className="flex items-center justify-between gap-3 bg-[#0a0a0a] border border-white/10 rounded-2xl p-3 shadow-2xl backdrop-blur-xl">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs uppercase tracking-wider transition-all border border-white/10"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#00e054]" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#00e054] text-black text-[10px] font-black">
              {activeCount}
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 ml-1 text-white/40" /> : <ChevronDown className="w-4 h-4 ml-1 text-white/40" />}
        </button>

        <div className="text-xs font-medium text-white/50 flex items-center gap-2">
          <span className="text-white font-bold">{filteredCount}</span>
          <span>/ {totalMovies} movies</span>
          {filteredCount === 0 && (
            <span className="text-rose-400 text-xs font-bold">(0 matches)</span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Expanded Filter Drawer */}
      {isOpen && (
        <div className="mt-3 bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* 1. Search filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#00e054]" /> Search Watchlist
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
                placeholder="Title or release year..."
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00e054]"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => onChange({ ...filters, searchQuery: "" })}
                  className="absolute right-3 top-2.5 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Decades */}
          <div>
            <label className="block text-[10px] font-extrabold text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#40bcf4]" /> Decade
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DECADE_LIST.map((dec) => {
                const isSelected = filters.decade === dec;
                return (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => handleDecadeClick(dec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-[#40bcf4] text-black font-extrabold shadow-md shadow-[#40bcf4]/20"
                        : "bg-[#050505] border border-white/10 text-white/60 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {dec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Year Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Release From</label>
              <input
                type="number"
                placeholder="e.g. 1990"
                value={filters.yearFrom ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    yearFrom: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00e054]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Release To</label>
              <input
                type="number"
                placeholder="e.g. 2024"
                value={filters.yearTo ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    yearTo: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00e054]"
              />
            </div>
          </div>

          {/* 4. Genres */}
          <div>
            <label className="block text-[10px] font-extrabold text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-amber-400" /> Genres
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {GENRE_LIST.map((genre) => {
                const isSelected = filters.selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                      isSelected
                        ? "bg-[#00e054] text-black font-bold shadow-md shadow-[#00e054]/20"
                        : "bg-[#050505] border border-white/10 text-white/60 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Quick Toggles */}
          <div>
            <label className="block text-[10px] font-extrabold text-white/40 uppercase tracking-[0.2em] mb-2">
              Format Constraints
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onChange({ ...filters, animationOnly: !filters.animationOnly })}
                className={`p-2 rounded-xl border font-semibold text-center transition-all ${
                  filters.animationOnly
                    ? "bg-purple-500/20 border-purple-500 text-purple-300"
                    : "bg-[#050505] border-white/10 text-white/60 hover:text-white"
                }`}
              >
                Animation Only
              </button>

              <button
                type="button"
                onClick={() => onChange({ ...filters, documentaryOnly: !filters.documentaryOnly })}
                className={`p-2 rounded-xl border font-semibold text-center transition-all ${
                  filters.documentaryOnly
                    ? "bg-[#40bcf4]/20 border-[#40bcf4] text-[#40bcf4]"
                    : "bg-[#050505] border-white/10 text-white/60 hover:text-white"
                }`}
              >
                Doc Only
              </button>

              <button
                type="button"
                onClick={() => onChange({ ...filters, hideDocumentaries: !filters.hideDocumentaries })}
                className={`p-2 rounded-xl border font-semibold text-center transition-all ${
                  filters.hideDocumentaries
                    ? "bg-rose-500/20 border-rose-500 text-rose-300"
                    : "bg-[#050505] border-white/10 text-white/60 hover:text-white"
                }`}
              >
                Hide Docs
              </button>

              <button
                type="button"
                onClick={() => onChange({ ...filters, hideShorts: !filters.hideShorts })}
                className={`p-2 rounded-xl border font-semibold text-center transition-all ${
                  filters.hideShorts
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "bg-[#050505] border-white/10 text-white/60 hover:text-white"
                }`}
              >
                Hide Shorts (&lt;40m)
              </button>
            </div>
          </div>

          {/* 6. Runtime Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#00e054]" /> Min Runtime (mins)
              </label>
              <input
                type="number"
                placeholder="e.g. 90"
                value={filters.minRuntime ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    minRuntime: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00e054]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#00e054]" /> Max Runtime (mins)
              </label>
              <input
                type="number"
                placeholder="e.g. 150"
                value={filters.maxRuntime ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    maxRuntime: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00e054]"
              />
            </div>
          </div>

          {/* Footer Reset & Apply buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-white/40 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear All
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-xs shadow-lg"
            >
              Apply Filters ({filteredCount})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

