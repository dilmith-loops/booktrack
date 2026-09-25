import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Sparkles, Tag, Calendar, ExternalLink } from 'lucide-react';

interface PromotionItem {
  id: string;
  tag: string;
  title: string;
  sinhalaTitle: string;
  description: string;
  image: string;
  validity: string;
}

const PROMOTIONS: PromotionItem[] = [
  {
    id: 'gpay-cashback',
    tag: '25% CASHBACK',
    title: '25% Cashback with Google Pay',
    sinhalaTitle: 'G Pay මඟින් ගෙවීම් කරන ඔබට 25%ක Cashback එකක්',
    description: 'Pay via Google Pay using your Sampath Visa or Mastercard at the Colombo International Book Fair 2026 and enjoy 25% instant cashback.',
    image: `${import.meta.env.BASE_URL}promotions/promo-gpay-cashback.jpg`,
    validity: 'Valid during Fair 2026'
  },
  {
    id: 'zero-interest',
    tag: '0% INTEREST',
    title: '0% Interest 3-Month Extended Plan',
    sinhalaTitle: 'මාස 03ක් 0% පොලී දීර්ඝ කළ ගෙවීම් සැලසුමක්',
    description: 'Convert your book purchases into a 3-month 0% interest payment plan with your Sampath Card. No extra burden for big book hauls.',
    image: `${import.meta.env.BASE_URL}promotions/promo-zero-interest.jpg`,
    validity: '2026 Sep 25 - Oct 04'
  }
];

export const PromotionsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-advance slides every 5 seconds when not paused/lightbox open
  useEffect(() => {
    if (isPaused || isLightboxOpen) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMOTIONS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, isLightboxOpen]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + PROMOTIONS.length) % PROMOTIONS.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % PROMOTIONS.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped left -> next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentPromo = PROMOTIONS[currentIndex];

  return (
    <div className="space-y-3">
      {/* Carousel Card Container */}
      <div 
        className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Carousel Header Bar */}
        <div className="px-3.5 pt-3 pb-2 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F37021] animate-pulse" />
            <h4 className="text-xs font-black text-zinc-900 tracking-tight uppercase">
              Exclusive Fair Promotions
            </h4>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 bg-zinc-200/80 px-2 py-0.5 rounded-full">
            <span>{currentIndex + 1}</span>
            <span>/</span>
            <span>{PROMOTIONS.length}</span>
          </div>
        </div>

        {/* Slide Viewport */}
        <div 
          className="relative w-full overflow-hidden bg-zinc-900 cursor-pointer select-none group"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsLightboxOpen(true)}
        >
          {/* Main Flyer Image */}
          <div className="relative aspect-[4/5] sm:aspect-[16/11] max-h-[460px] w-full flex items-center justify-center bg-black/95">
            <img
              src={currentPromo.image}
              alt={currentPromo.title}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
              loading="eager"
            />

            {/* Top Overlay Badge */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
              <span className="bg-[#F37021] text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {currentPromo.tag}
              </span>
            </div>

            {/* Tap to Zoom Hint */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className="bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 shadow-md transition-colors"
                title="Tap to expand flyer"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Expand</span>
              </button>
            </div>

            {/* Bottom Gradient Overlay with Brief Details */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8 text-white z-10 pointer-events-none">
              <div className="flex items-center gap-1 text-[11px] text-orange-300 font-semibold mb-0.5">
                <Calendar className="w-3 h-3" />
                <span>{currentPromo.validity}</span>
              </div>
              <h5 className="text-sm font-black text-white leading-tight drop-shadow-xs">
                {currentPromo.title}
              </h5>
              <p className="text-[11px] text-zinc-200 line-clamp-1 mt-0.5 font-medium">
                {currentPromo.sinhalaTitle}
              </p>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous promotion"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs z-20 transition-all opacity-85 hover:opacity-100 shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next promotion"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs z-20 transition-all opacity-85 hover:opacity-100 shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel Footer & Dots Navigation */}
        <div className="p-3 bg-white flex items-center justify-between border-t border-zinc-100">
          {/* Indicators */}
          <div className="flex items-center gap-1.5">
            {PROMOTIONS.map((promo, idx) => (
              <button
                key={promo.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 bg-[#F37021]'
                    : 'w-2 bg-zinc-300 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="text-xs font-bold text-[#F37021] hover:text-[#EA580C] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View Full Details</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Instant Savings Stall Notice */}
      <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 font-black text-xs text-zinc-900">
          <Sparkles className="w-4 h-4 text-[#F37021]" />
          <span>10% to 25% Instant Savings</span>
        </div>
        <p className="text-xs text-zinc-600 font-medium leading-relaxed">
          Pay with your Sampath Bank Visa, Mastercard, or Ultra Rewards card at Sarasavi, M.D. Gunasena, Vijitha Yapa, Expographic, and 100+ participating BMICH book stalls.
        </p>
      </div>

      {/* Lightbox Modal for Full Screen Image Inspection */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[95vh] flex flex-col items-center bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="w-full bg-zinc-900 p-3 sm:p-4 flex items-center justify-between border-b border-zinc-800 text-white">
              <div>
                <div className="text-[10px] font-black text-orange-400 uppercase tracking-wider">
                  {currentPromo.tag} • {currentIndex + 1} of {PROMOTIONS.length}
                </div>
                <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                  {currentPromo.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flyer Image Container */}
            <div className="relative w-full flex-1 min-h-[320px] max-h-[70vh] flex items-center justify-center bg-black p-2 overflow-auto">
              <img
                src={currentPromo.image}
                alt={currentPromo.title}
                className="max-w-full max-h-[68vh] object-contain rounded-lg shadow-lg"
              />

              {/* Prev / Next Modal Buttons */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous flyer"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-zinc-700 shadow-lg cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next flyer"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-zinc-700 shadow-lg cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Bottom Info */}
            <div className="w-full p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800 text-white space-y-1">
              <p className="text-xs text-zinc-300 font-medium">
                {currentPromo.description}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-orange-400">
                  {currentPromo.validity}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Hotline: 1332 • www.sampath.lk
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
