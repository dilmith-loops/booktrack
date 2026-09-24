import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  MapPin,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Calendar,
  Compass
} from 'lucide-react';
import { G_PAY_IMAGE } from '../assets/gPayImage';

interface SplashScreenProps {
  onComplete: () => void;
}

// 3 distinct splash steps:
// Step 0: First Logo (Official App)
// Step 1: Book Scene Atmosphere (2nd image clean for 1.8s -> loads 3rd image parts in middle with small glow -> moves to next page)
// Step 2: Interactive Fair Radar Ready (Enter Community Hub)
const STEP_DURATIONS = [2600, 4800, 0]; // step 2 has interactive radar loader

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepProgress, setStepProgress] = useState<number>(0); // 0 to 100 for active step
  const [radarProgress, setRadarProgress] = useState<number>(0);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [step1ShowParts, setStep1ShowParts] = useState<boolean>(false);

  const stepRef = useRef(currentStep);
  stepRef.current = currentStep;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const baseUrl = import.meta.env.BASE_URL;
  const logoImg = `${baseUrl}splash/splash-logo.jpg`;
  const bgImg = `${baseUrl}splash/splash-bg.jpg`;
  const posterImg = `${baseUrl}splash/splash-poster.jpg`;
  const cleanLogoImg = `${baseUrl}splash/logo-clean.png`;

  // Preload splash assets for instant, seamless transitions
  useEffect(() => {
    [logoImg, bgImg, posterImg, cleanLogoImg].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [baseUrl, logoImg, bgImg, posterImg, cleanLogoImg]);

  const handleEnter = useCallback(() => {
    setFadingOut(true);
    setTimeout(onComplete, 350);
  }, [onComplete]);

  // Handle Step 1 internal reveal of 3rd image parts after 1.8s
  useEffect(() => {
    if (currentStep === 1) {
      setStep1ShowParts(false);
      const timer = setTimeout(() => {
        setStep1ShowParts(true);
      }, 1700);
      return () => clearTimeout(timer);
    } else {
      setStep1ShowParts(false);
    }
  }, [currentStep]);

  // Story Timer / Progression for Steps 0, 1
  useEffect(() => {
    if (currentStep >= 2) return;

    setStepProgress(0);
    const duration = STEP_DURATIONS[currentStep];
    const intervalTime = 40;
    const stepIncrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (isPausedRef.current) return;

      setStepProgress((prev) => {
        const next = prev + stepIncrement;
        if (next >= 100) {
          clearInterval(timer);
          setCurrentStep((s) => Math.min(s + 1, 2));
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentStep]);

  // Radar loading timer for Step 2 (Interactive Splash)
  useEffect(() => {
    if (currentStep !== 2) return;

    const timer = setInterval(() => {
      setRadarProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 25;
      });
    }, 250);

    return () => clearInterval(timer);
  }, [currentStep]);

  const goToNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep((prev) => prev + 1);
      setStepProgress(0);
    } else {
      handleEnter();
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setStepProgress(0);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between select-none overflow-hidden transition-all duration-500 ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      } ${
        currentStep === 0
          ? 'bg-[#FCF8EF]'
          : currentStep === 1
          ? 'bg-[#FEFAF7]'
          : 'bg-white'
      }`}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* 1. TOP STORY PROGRESS BARS & CONTROLS */}
      <div className="w-full max-w-md mx-auto px-5 pt-3 z-30 flex flex-col gap-2.5">
        {/* Segmented Story Bars (3 Steps) */}
        <div className="flex items-center gap-1.5 w-full">
          {[0, 1, 2].map((stepIdx) => {
            let fillPct = 0;
            if (currentStep > stepIdx) fillPct = 100;
            else if (currentStep === stepIdx) {
              fillPct = stepIdx === 2 ? radarProgress : stepProgress;
            }

            return (
              <button
                key={stepIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentStep(stepIdx);
                  setStepProgress(0);
                }}
                className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden cursor-pointer transition-transform hover:scale-y-125 focus:outline-none"
                title={`Go to slide ${stepIdx + 1}`}
              >
                <div
                  className="h-full bg-gradient-to-r from-[#FF7A1A] to-[#F37021] rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${fillPct}%` }}
                />
              </button>
            );
          })}
        </div>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-orange-200/60 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-[#F37021] animate-ping" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#EA580C]">
              {currentStep === 0
                ? 'Official App'
                : currentStep === 1
                ? 'BMICH Atmosphere'
                : 'Fair Radar Ready'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEnter();
              }}
              id="skip-splash-btn"
              className="text-xs font-bold text-zinc-600 hover:text-zinc-900 px-3 py-1 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-zinc-200 shadow-xs transition-all cursor-pointer"
            >
              Skip Intro →
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (CHANGES PER STEP) */}
      <div className="relative w-full max-w-md flex-1 flex flex-col items-center justify-center overflow-hidden my-auto">
        {/* Tap areas for mobile story-like left/right navigation */}
        <div
          className="absolute inset-y-0 left-0 w-1/4 z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevStep();
          }}
          aria-label="Previous slide"
        />
        <div
          className="absolute inset-y-0 right-0 w-1/4 z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            goToNextStep();
          }}
          aria-label="Next slide"
        />

        {/* STEP 0: FIRST LOGO */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
            currentStep === 0
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {/* Subtle warm amber radial glow */}
          <div className="absolute w-80 h-80 bg-[#F37021]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* Centered Standalone Logo */}
          <div className="relative max-w-[320px] w-full aspect-square flex items-center justify-center">
            <img
              src={logoImg}
              alt="Sampath Book Finder Logo"
              className="w-full h-full object-contain rounded-3xl drop-shadow-sm transition-transform duration-700 ease-out hover:scale-102"
            />
          </div>
        </div>

        {/* STEP 1: 2ND ONE (ATMOSPHERIC BOOK SCENE + ANIMATED 3RD IMAGE PARTS WITH GLOW) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
            currentStep === 1
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-105 pointer-events-none'
          }`}
        >
          {/* Full bleed atmospheric photo with gentle Ken Burns zoom */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={bgImg}
              alt="Cozy books atmosphere at BMICH"
              className="w-full h-full object-cover object-center transition-transform duration-[4800ms] ease-out scale-105"
            />
            {/* Soft gradient wash */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/15 pointer-events-none" />
          </div>

          {/* Animated 3rd Image Parts in the Middle with Small Glow */}
          <div
            className={`relative z-10 max-w-[320px] w-full px-5 py-6 my-auto flex flex-col items-center text-center transition-all duration-700 ease-out ${
              step1ShowParts
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-90 translate-y-6 pointer-events-none'
            }`}
          >
            {/* Ambient warm orange aura glow */}
            <div className="absolute -inset-4 bg-[#F37021]/30 rounded-3xl blur-2xl pointer-events-none animate-pulse" />

            {/* Floating Glass Card with subtle border and small glow */}
            <div className="relative w-full p-5 sm:p-6 rounded-3xl bg-white/92 backdrop-blur-md border border-orange-200/90 shadow-[0_12px_40px_rgba(243,112,33,0.28)] flex flex-col items-center">
              {/* Clean Sampath Book Finder Logo */}
              <div className="w-40 sm:w-48 h-auto flex items-center justify-center">
                <img
                  src={cleanLogoImg}
                  alt="Sampath Book Finder"
                  className="w-full h-auto object-contain drop-shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = logoImg;
                  }}
                />
              </div>

              {/* Subtitle description */}
              <p className="mt-3 text-xs sm:text-[13px] font-semibold text-zinc-700 leading-relaxed text-center">
                Find any book in seconds across 150+ stalls at BMICH. Spot, share, and discover books together.
              </p>

              {/* Location & Date Pill Badges */}
              <div className="flex items-center justify-center gap-2 mt-4 w-full flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50/90 border border-orange-200/80 shadow-2xs text-[11px] font-bold text-zinc-800">
                  <MapPin className="w-3.5 h-3.5 text-[#F37021]" />
                  <span>BMICH, Colombo</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50/90 border border-orange-200/80 shadow-2xs text-[11px] font-bold text-zinc-800">
                  <Calendar className="w-3.5 h-3.5 text-[#F37021]" />
                  <span>25 Sep – 04 Oct 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: INTERACTIVE SPLASH SCREEN (FAIR RADAR READY) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-between p-6 transition-all duration-700 overflow-y-auto ${
            currentStep === 2
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {/* Ambient background glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F37021]/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#EA580C]/10 rounded-full blur-[90px] pointer-events-none" />

          {/* Center Hero Logo & Event Content */}
          <div className="max-w-md w-full flex flex-col items-center text-center z-10 my-auto pt-2">
            {/* Animated Brand Emblem */}
            <div className="relative mb-5">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-3 shadow-[0_10px_40px_rgba(243,112,33,0.22)] flex items-center justify-center border-2 border-orange-200">
                <img
                  src={cleanLogoImg}
                  alt="Sampath Book Finder Emblem"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = logoImg;
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
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
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
            <div className="mt-4 sm:mt-5 flex items-center justify-center">
              <img
                src={G_PAY_IMAGE}
                alt="G-Pay"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xs"
              />
            </div>
          </div>

          {/* Bottom Loading Progress & Continue */}
          <div className="w-full max-w-md z-10 pb-4 mt-auto">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-500 mb-2">
              <span>{radarProgress >= 100 ? 'BMICH Fair Radar Ready' : 'Loading BMICH Fair Radar...'}</span>
              <span className="text-[#F37021] font-black">{radarProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF7A1A] to-[#F37021] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${radarProgress}%` }}
              />
            </div>

            <button
              onClick={handleEnter}
              id="enter-app-splash-btn"
              className="mt-4 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(243,112,33,0.35)] transition-all cursor-pointer active:scale-98"
            >
              <span>Enter Community Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SLIDE CONTROLS / DOTS BAR (Visible on steps 0-1) */}
      {currentStep < 2 && (
        <div className="w-full max-w-md mx-auto px-6 pb-4 z-30 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevStep();
            }}
            disabled={currentStep === 0}
            className={`p-2 rounded-full border transition-all ${
              currentStep === 0
                ? 'opacity-0 pointer-events-none'
                : 'bg-white/80 hover:bg-white text-zinc-700 border-zinc-200 shadow-xs cursor-pointer'
            }`}
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-orange-200/50 shadow-xs">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentStep(idx);
                }}
                className={`transition-all rounded-full ${
                  currentStep === idx
                    ? 'w-5 h-2 bg-[#F37021]'
                    : 'w-2 h-2 bg-zinc-300 hover:bg-zinc-400'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToNextStep();
            }}
            className="p-2 rounded-full bg-white/80 hover:bg-white text-zinc-700 border border-zinc-200 shadow-xs cursor-pointer transition-all hover:scale-105"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
