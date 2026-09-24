import React, { useState, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  const baseUrl = import.meta.env.BASE_URL;
  const bgImg = `${baseUrl}splash/splash-bg.jpg`;
  const cleanLogoImg = `${baseUrl}splash/splash-logo.jpg`;
  const logoFallback = `${baseUrl}logo.png`;

  const handleEnter = useCallback(() => {
    setFadingOut(true);
    setTimeout(onComplete, 350);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 select-none overflow-hidden transition-all duration-500 bg-[#09090B] ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Full Bleed Background Photographic Scene */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={bgImg}
          alt="BMICH Book Fair Atmosphere"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Soft atmospheric gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
      </div>

      {/* 2. Floating Centered Splash & Onboarding Card */}
      <div className="relative z-10 max-w-[340px] sm:max-w-[360px] w-full mx-auto my-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        {/* Ambient warm orange aura glow */}
        <div className="absolute -inset-4 bg-[#F37021]/30 rounded-[40px] blur-2xl pointer-events-none animate-pulse" />

        {/* Card Body */}
        <div className="relative w-full p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white/95 backdrop-blur-md border border-orange-100/90 shadow-[0_16px_50px_rgba(243,112,33,0.28)] flex flex-col items-center text-center">
          {/* Square Logo Box */}
          <div className="w-44 sm:w-48 aspect-square rounded-2xl bg-[#FFFDF8] border border-orange-100/80 p-4 sm:p-5 flex items-center justify-center mb-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)]">
            <img
              src={cleanLogoImg}
              alt="Sampath Book Finder"
              className="w-full h-full object-contain drop-shadow-xs"
              onError={(e) => {
                e.currentTarget.src = logoFallback;
              }}
            />
          </div>

          {/* Subtitle description */}
          <p className="text-xs sm:text-[13px] font-semibold text-zinc-700 leading-relaxed text-center px-1">
            Find any book in seconds across 150+ stalls at BMICH. Spot, share, and discover books together.
          </p>

          {/* Location & Date Pill Badges (Stacked vertically) */}
          <div className="flex flex-col items-center gap-2 mt-4 w-full">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFF8F3] border border-orange-200/80 shadow-2xs text-[11px] font-bold text-zinc-800">
              <MapPin className="w-3.5 h-3.5 text-[#F37021]" />
              <span>BMICH, Colombo</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFF8F3] border border-orange-200/80 shadow-2xs text-[11px] font-bold text-zinc-800">
              <Calendar className="w-3.5 h-3.5 text-[#F37021]" />
              <span>25 Sep – 04 Oct 2026</span>
            </div>
          </div>

          {/* Enter Community Hub Button */}
          <button
            onClick={handleEnter}
            id="enter-community-hub-btn"
            className="w-full mt-5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#F37021] via-[#EA580C] to-[#C2410C] hover:from-[#EA580C] hover:to-[#9A3412] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(243,112,33,0.38)] active:scale-95 transition-all cursor-pointer group"
          >
            <span>Enter Community Hub</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
