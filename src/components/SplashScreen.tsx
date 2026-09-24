import React, { useState, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  ArrowRight,
  Wrench,
  AlertTriangle,
  RefreshCw,
  Lock
} from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  isMaintenanceMode?: boolean;
  maintenanceMessage?: string;
  onOpenAdmin?: () => void;
  onRefreshStatus?: () => void;
  isCheckingStatus?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  isMaintenanceMode = false,
  maintenanceMessage,
  onOpenAdmin,
  onRefreshStatus,
  isCheckingStatus = false
}) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  const baseUrl = import.meta.env.BASE_URL;
  const bgImg = `${baseUrl}splash/splash-bg.jpg`;
  const cleanLogoImg = `${baseUrl}splash/splash-logo.jpg`;
  const logoFallback = `${baseUrl}logo.png`;

  const handleEnter = useCallback(() => {
    if (isMaintenanceMode) return;
    setFadingOut(true);
    setTimeout(onComplete, 350);
  }, [onComplete, isMaintenanceMode]);

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
        {/* Atmospheric gradient wash */}
        <div className={`absolute inset-0 transition-colors duration-500 pointer-events-none ${
          isMaintenanceMode 
            ? 'bg-gradient-to-t from-black/60 via-black/35 to-black/50' 
            : 'bg-gradient-to-t from-black/20 via-transparent to-black/10'
        }`} />
      </div>

      {/* 2. Floating Centered Splash & Onboarding Card */}
      <div className="relative z-10 max-w-[340px] sm:max-w-[360px] w-full mx-auto my-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        {/* Ambient warm orange aura glow (or amber maintenance aura) */}
        <div className={`absolute -inset-4 rounded-[40px] blur-2xl pointer-events-none animate-pulse ${
          isMaintenanceMode ? 'bg-amber-500/35' : 'bg-[#F37021]/30'
        }`} />

        {/* Card Body */}
        <div className={`relative w-full p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white/95 backdrop-blur-md border shadow-[0_16px_50px_rgba(243,112,33,0.28)] flex flex-col items-center text-center ${
          isMaintenanceMode ? 'border-amber-200/90 ring-2 ring-amber-500/20' : 'border-orange-100/90'
        }`}>
          {/* Maintenance Mode Badge when active */}
          {isMaintenanceMode && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-black uppercase tracking-wider mb-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
              </span>
              <Wrench className="w-3.5 h-3.5 text-[#F37021]" />
              <span>Maintenance Mode</span>
            </div>
          )}

          {/* Square Logo Box */}
          <div className="w-44 sm:w-48 aspect-square rounded-2xl bg-[#FFFDF8] border border-orange-100/80 p-4 sm:p-5 flex items-center justify-center mb-3 shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)]">
            <img
              src={cleanLogoImg}
              alt="Sampath Book Finder"
              className="w-full h-full object-contain drop-shadow-xs"
              onError={(e) => {
                e.currentTarget.src = logoFallback;
              }}
            />
          </div>

          {/* Subtitle description / Maintenance Mode Text */}
          {isMaintenanceMode ? (
            <div className="space-y-1.5 my-1">
              <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                Platform Under Maintenance
              </h2>
              <p className="text-xs sm:text-[13px] font-medium text-zinc-600 leading-relaxed text-center px-1">
                {maintenanceMessage || 'Sampath Book Finder is temporarily offline for scheduled system updates and stall inventory syncing. We will be back online shortly.'}
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-[13px] font-semibold text-zinc-700 leading-relaxed text-center px-1">
              Find any book in seconds across 150+ stalls at BMICH. Spot, share, and discover books together.
            </p>
          )}

          {/* Location & Date Pill Badges (Stacked vertically) */}
          <div className="flex flex-col items-center gap-1.5 mt-3 w-full">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF8F3] border border-orange-200/80 shadow-2xs text-[11px] font-bold text-zinc-800">
              <MapPin className="w-3.5 h-3.5 text-[#F37021]" />
              <span>BMICH, Colombo</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF8F3] border border-orange-200/80 shadow-2xs text-[11px] font-bold text-zinc-800">
              <Calendar className="w-3.5 h-3.5 text-[#F37021]" />
              <span>25 Sep – 04 Oct 2026</span>
            </div>
          </div>

          {/* Actions: Maintenance Notice + Refresh OR Regular Enter Community Hub Button */}
          {isMaintenanceMode ? (
            <div className="w-full mt-4 space-y-2.5">
              <div className="w-full p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 flex flex-col items-center gap-1 text-center shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-[#F37021] flex-shrink-0" />
                  <span>Public Access Temporarily Paused</span>
                </div>
                <p className="text-[11px] text-amber-800/90 font-medium leading-normal">
                  Our technical team is optimizing servers. Please check back in a few minutes.
                </p>
              </div>

              {onRefreshStatus && (
                <button
                  type="button"
                  onClick={onRefreshStatus}
                  disabled={isCheckingStatus}
                  id="check-maintenance-status-btn"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin text-[#F37021]' : 'text-zinc-300'}`} />
                  <span>{isCheckingStatus ? 'Checking Platform Status...' : 'Check Status / Refresh'}</span>
                </button>
              )}

              {onOpenAdmin && (
                <div className="pt-2 border-t border-zinc-100 w-full text-center">
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    id="maintenance-admin-link-btn"
                    className="text-[11px] font-semibold text-zinc-400 hover:text-[#F37021] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Staff / Administrator Access</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleEnter}
              id="enter-community-hub-btn"
              className="w-full mt-5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#F37021] via-[#EA580C] to-[#C2410C] hover:from-[#EA580C] hover:to-[#9A3412] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(243,112,33,0.38)] active:scale-95 transition-all cursor-pointer group"
            >
              <span>Enter Community Hub</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

