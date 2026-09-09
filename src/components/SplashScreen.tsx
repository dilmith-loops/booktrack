import React, { useEffect, useState } from 'react';
import { Sparkles, MapPin, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';
import { G_PAY_IMAGE } from '../assets/gPayImage';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 25;
      });
    }, 250);

    return () => clearInterval(timer);
  }, []);

  const handleEnter = () => {
    setFadingOut(true);
    setTimeout(onComplete, 350);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-white text-zinc-900 flex flex-col items-center justify-between p-6 transition-opacity duration-500 overflow-hidden ${
        fadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F37021]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#EA580C]/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Brand Bar */}
      <div className="w-full max-w-md flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F37021] animate-ping" />
          <span className="text-[11px] font-black uppercase tracking-wider text-[#EA580C]">
            Official Community App
          </span>
        </div>
        <button
          onClick={handleEnter}
          id="skip-splash-btn"
          className="text-xs font-bold text-zinc-500 hover:text-zinc-900 px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-all cursor-pointer"
        >
          Skip Intro →
        </button>
      </div>

      {/* Center Hero Logo & Event Content */}
      <div className="max-w-md w-full flex flex-col items-center text-center z-10 my-auto">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-3.5 shadow-[0_10px_40px_rgba(243,112,33,0.22)] flex items-center justify-center animate-in zoom-in-50 duration-700 border-2 border-orange-200">
            <img
              src={`${import.meta.env.BASE_URL}logo-icon.png`}
              alt="Sampath Bank Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('logo%20icon.png')) {
                  target.src = `${import.meta.env.BASE_URL}logo%20icon.png`;
                }
              }}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#F37021] text-white font-black text-[10px] px-2 py-0.5 rounded-full border-2 border-white shadow-md">
            BMICH '26
          </div>
        </div>

        {/* Sponsor Banner */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 mb-3 shadow-xs">
          <span className="text-xs font-extrabold tracking-wide text-zinc-700">
            Proudly Sponsored by <strong className="text-[#EA580C]">Sampath Bank PLC</strong>
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 leading-tight">
          SAMPATH <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F37021] via-[#EA580C] to-[#C2410C]">
            BOOK FINDER
          </span>
        </h1>

        <p className="mt-2 text-xs font-bold text-[#EA580C] uppercase tracking-wider">
          Colombo Book Fair 2026 • BMICH
        </p>

        <p className="mt-2 text-sm text-zinc-600 max-w-xs font-medium leading-relaxed">
          Find any book in seconds across 150+ stalls at BMICH. Spot, share, and discover books together.
        </p>

        {/* Event Dates & Location Badges */}
        <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-700 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-[#F37021]" />
            <span>BMICH, Colombo</span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-orange-50 border border-orange-200 text-xs font-bold text-[#EA580C] shadow-xs">
            25 Sep – 04 Oct 2026
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Protected</span>
          </div>
        </div>

        {/* G-Pay Image */}
        <div className="mt-5 sm:mt-6 flex items-center justify-center">
          <img
            src={G_PAY_IMAGE}
            alt="G-Pay"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xs"
          />
        </div>
      </div>

      {/* Bottom Loading Progress & Continue */}
      <div className="w-full max-w-md z-10 pb-4">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-500 mb-2">
          <span>{progress >= 100 ? 'BMICH Fair Radar Ready' : 'Loading BMICH Fair Radar...'}</span>
          <span className="text-[#F37021] font-black">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF7A1A] to-[#F37021] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={handleEnter}
          id="enter-app-splash-btn"
          className="mt-5 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(243,112,33,0.35)] transition-all cursor-pointer active:scale-98"
        >
          <span>Enter Community Hub</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
