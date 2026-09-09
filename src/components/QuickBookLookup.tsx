import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles, X, Image as ImageIcon, ChevronRight, CheckCircle2, BookOpen } from 'lucide-react';
import { BookSpotting } from '../types';

interface QuickBookLookupProps {
  spots: BookSpotting[];
  onSelectSpot: (spot: BookSpotting) => void;
  onOpenNewSpotWithTitle: (bookTitle: string) => void;
}

export const QuickBookLookup: React.FC<QuickBookLookupProps> = ({
  spots,
  onSelectSpot,
  onOpenNewSpotWithTitle
}) => {
  const [query, setQuery] = useState('');
  const [matchingSpots, setMatchingSpots] = useState<BookSpotting[]>([]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      setMatchingSpots([]);
      return;
    }

    const filtered = spots.filter(
      spot =>
        spot.bookName.toLowerCase().includes(q) ||
        spot.stallName.toLowerCase().includes(q) ||
        spot.hall.toLowerCase().includes(q) ||
        (spot.author && spot.author.toLowerCase().includes(q))
    );
    setMatchingSpots(filtered);
  }, [query, spots]);

  const trendingSearches = [
    'Atomic Habits',
    'Madol Doova',
    'Midnight Library',
    'Gamperaliya',
    'Manga',
    'Past Papers'
  ];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/90 shadow-sm hover:shadow-md transition-shadow relative">
      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F37021] animate-pulse" />
          <h2 className="text-sm sm:text-base font-black tracking-tight text-zinc-900">
            LOOKING FOR A SPECIFIC BOOK?
          </h2>
        </div>
        <span className="text-[11px] bg-orange-50 text-[#EA580C] font-extrabold px-2.5 py-0.5 rounded-full border border-orange-200/80">
          Instant Stall Radar
        </span>
      </div>

      {/* Input box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
          <Search className="h-4 sm:h-5 w-4 sm:w-5 text-[#F37021]" />
        </div>
        <input
          type="text"
          id="book-lookup-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search book title or author (e.g. 'Atomic Habits', 'Madol Doova', 'Harry Potter')..."
          className="w-full pl-10 sm:pl-11 pr-10 py-3 bg-zinc-50 hover:bg-zinc-100/70 focus:bg-white text-zinc-900 placeholder-zinc-400 font-semibold text-xs sm:text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#F37021] focus:border-transparent transition-all shadow-inner"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            id="clear-search-btn"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Instant Results Panel when typing */}
      {query.trim().length >= 2 && (
        <div className="mt-3 bg-orange-50/70 border border-orange-200 rounded-xl p-3 sm:p-3.5 animate-in fade-in">
          {matchingSpots.length > 0 ? (
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-zinc-800 mb-2.5 pb-2 border-b border-orange-200/70">
                <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Found at {matchingSpots.length} stall{matchingSpots.length > 1 ? 's' : ''}!
                </span>
                <span className="text-zinc-500 text-[11px] font-medium hidden sm:inline">
                  Tap to view shelf photos & aisle
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {matchingSpots.map((spot) => (
                  <div
                    key={spot.id}
                    onClick={() => onSelectSpot(spot)}
                    className="p-2.5 sm:p-3 bg-white hover:bg-orange-50/90 border border-zinc-200 hover:border-orange-300 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 shadow-sm hover:shadow"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {spot.images.length > 0 ? (
                        <div className="relative w-12 h-12 rounded-lg border border-zinc-200 overflow-hidden flex-shrink-0 bg-zinc-100">
                          <img
                            src={spot.images[0]}
                            alt={spot.bookName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-0 right-0 bg-black/80 text-white text-[9px] px-1 font-black rounded-tl">
                            {spot.images.length}P
                          </span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-orange-200 bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-5 h-5 text-[#F37021]" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-zinc-900 truncate">
                          {spot.bookName}
                        </div>
                        <div className="text-xs font-bold text-[#EA580C] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{spot.stallName}</span>
                          <span className="text-zinc-700 font-semibold flex-shrink-0">({spot.hall} • {spot.stallNumber})</span>
                        </div>
                        {spot.priceOrOffer && (
                          <div className="text-[11px] text-zinc-600 font-medium mt-0.5 truncate">
                            {spot.priceOrOffer}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-[#EA580C] flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-zinc-800">
                No sightings recorded yet for <span className="text-zinc-950 font-black underline">"{query}"</span>
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xs mx-auto">
                Are you at BMICH right now and found this book? Help fellow fair-goers by sharing it!
              </p>
              <button
                onClick={() => onOpenNewSpotWithTitle(query)}
                id="post-first-spot-btn"
                className="mt-3 px-3.5 py-1.5 bg-gradient-to-r from-[#F37021] to-[#EA580C] text-white hover:from-[#EA580C] hover:to-[#C2410C] font-black text-xs rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Post "{query}" Sighting Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Popular shortcuts */}
      {query.trim().length === 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-zinc-400">Trending at Fair:</span>
          {trendingSearches.map((title) => (
            <button
              key={title}
              onClick={() => setQuery(title)}
              className="text-[11px] font-bold px-2.5 py-1 bg-zinc-100 hover:bg-[#F37021] hover:text-white text-zinc-700 rounded-full transition-colors cursor-pointer"
            >
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
