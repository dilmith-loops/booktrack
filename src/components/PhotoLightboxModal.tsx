import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  bookTitle: string;
  stallName: string;
  initialIndex?: number;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  bookTitle,
  stallName,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || images.length === 0) return null;

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
        {/* Top Info Bar */}
        <div className="w-full bg-white border-2 border-black rounded-t-xl p-3 flex items-center justify-between shadow-[4px_4px_0px_#000]">
          <div>
            <h4 className="text-sm sm:text-base font-black text-black">
              {bookTitle}
            </h4>
            <div className="text-xs font-bold text-[#F37021] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{stallName} Shelf View ({currentIndex + 1} of {images.length})</span>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-lightbox-btn"
            className="w-8 h-8 rounded-lg bg-black text-white hover:bg-zinc-800 flex items-center justify-center border border-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Image View */}
        <div className="relative w-full bg-black border-x-2 border-black flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-hidden">
          <img
            src={images[currentIndex]}
            alt={`${bookTitle} shelf`}
            className="w-full h-full max-h-[68vh] object-contain"
            referrerPolicy="no-referrer"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 w-10 h-10 rounded-full bg-white/90 text-black hover:bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] cursor-pointer"
                title="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 w-10 h-10 rounded-full bg-white/90 text-black hover:bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] cursor-pointer"
                title="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails strip */}
        {images.length > 1 && (
          <div className="w-full bg-white border-2 border-black rounded-b-xl p-2.5 flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000]">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-14 h-14 rounded border-2 overflow-hidden cursor-pointer transition-all ${
                  currentIndex === i ? 'border-[#F37021] scale-105 shadow-[2px_2px_0px_#F37021]' : 'border-black opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
