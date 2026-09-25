import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const PROMOTIONS = [
  {
    id: 'gpay-cashback',
    title: 'Sampath Bank 25% Cashback Google Pay',
    image: `${import.meta.env.BASE_URL}promotions/promo-gpay-cashback.jpg`
  },
  {
    id: 'zero-interest',
    title: 'Sampath Cards 0% Interest 3 Months Plan',
    image: `${import.meta.env.BASE_URL}promotions/promo-zero-interest.jpg`
  }
];

export const PromotionsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-advance slides every 5 seconds when not paused or lightbox open
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
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentPromo = PROMOTIONS[currentIndex];

  return (
    <div className="w-full">
      {/* Carousel Container */}
      <div 
        className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slide Viewport */}
        <div 
          className="relative w-full overflow-hidden bg-black/5 cursor-pointer select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsLightboxOpen(true)}
        >
          {/* Main Flyer Image (Natural 4:5 Aspect Ratio) */}
          <div className="relative aspect-[4/5] w-full flex items-center justify-center bg-black/95">
            <img
              src={currentPromo.image}
              alt={currentPromo.title}
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous promotion"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs z-10 transition-all opacity-85 hover:opacity-100 shadow-md cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next promotion"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs z-10 transition-all opacity-85 hover:opacity-100 shadow-md cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel Footer: Centered Indicator Dots */}
        <div className="py-2.5 px-4 bg-white flex items-center justify-center">
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
        </div>
      </div>

      {/* Lightbox Modal for Full Screen Inspection (Clean without text) */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[92vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-12 right-0 sm:right-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Flyer Image */}
            <div className="relative w-full flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={currentPromo.image}
                alt={currentPromo.title}
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
              />

              {/* Prev / Next Modal Arrows */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous flyer"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-zinc-700 shadow-lg cursor-pointer z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next flyer"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-zinc-700 shadow-lg cursor-pointer z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
