import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'pill' | 'topbar' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  // Close modals on Escape key and lock body scroll while modal is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowIOSGuide(false);
        setShowGenericGuide(false);
      }
    };

    if (showIOSGuide || showGenericGuide) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showIOSGuide, showGenericGuide]);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const buttonClass =
    variant === 'topbar'
      ? 'flex items-center gap-1 rounded-full bg-black/80 hover:bg-black text-white px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black border border-white/25 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0'
      : 'flex items-center gap-1.5 rounded-full bg-zinc-900 text-white hover:bg-black px-3 py-1.5 text-xs font-bold border border-orange-500/30 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer';

  // Render iOS Guide Modal using React Portal so it's outside header stacking context & backdrop-filter
  const renderIOSGuideModal = () => {
    if (!showIOSGuide || typeof document === 'undefined') return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={() => setShowIOSGuide(false)}
      >
        <div
          className="w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 my-auto relative text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F37021] to-[#EA580C] flex items-center justify-center text-white shadow-md shadow-orange-500/20 flex-shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900 leading-tight">Install on iPhone</h3>
                <p className="text-[11px] text-zinc-500">BMICH Fair Web App (PWA)</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5 text-xs text-zinc-700">
            <div className="flex items-start gap-2.5 p-3 bg-orange-50/80 rounded-2xl border border-orange-200/80">
              <div className="w-6 h-6 rounded-full bg-[#F37021] text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
                1
              </div>
              <div className="pt-0.5 leading-snug">
                Tap the <strong>Share button</strong> in your Safari toolbar at the bottom of the screen.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-orange-50/80 rounded-2xl border border-orange-200/80">
              <div className="w-6 h-6 rounded-full bg-[#F37021] text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
                2
              </div>
              <div className="pt-0.5 leading-snug">
                Scroll down and tap <strong>"Add to Home Screen"</strong>.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                ✓
              </div>
              <div className="pt-0.5 leading-snug text-emerald-950">
                Launch from your Home Screen for instant offline access and full-screen experience during the fair!
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowIOSGuide(false)}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] py-2.5 sm:py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            Got it!
          </button>
        </div>
      </div>,
      document.body
    );
  };

  // Render Generic Guide Modal using React Portal so it's outside header stacking context & backdrop-filter
  const renderGenericGuideModal = () => {
    if (!showGenericGuide || typeof document === 'undefined') return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={() => setShowGenericGuide(false)}
      >
        <div
          className="w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 my-auto relative text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F37021] to-[#EA580C] flex items-center justify-center text-white shadow-md shadow-orange-500/20 flex-shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900 leading-tight">Install Book Spotter</h3>
                <p className="text-[11px] text-zinc-500">BMICH Fair Web App (PWA)</p>
              </div>
            </div>
            <button
              onClick={() => setShowGenericGuide(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5 text-xs text-zinc-700">
            <div className="flex items-start gap-2.5 p-3 bg-orange-50/80 rounded-2xl border border-orange-200/80">
              <div className="w-6 h-6 rounded-full bg-[#F37021] text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
                1
              </div>
              <div className="pt-0.5 leading-snug">
                Tap your browser menu (<strong>⋮</strong> or <strong>Share</strong> button).
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-orange-50/80 rounded-2xl border border-orange-200/80">
              <div className="w-6 h-6 rounded-full bg-[#F37021] text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
                2
              </div>
              <div className="pt-0.5 leading-snug">
                Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                ✓
              </div>
              <div className="pt-0.5 leading-snug text-emerald-950">
                Instant fast access even with poor cellular reception inside the halls!
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowGenericGuide(false)}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] py-2.5 sm:py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            Got it!
          </button>
        </div>
      </div>,
      document.body
    );
  };

  // Chromium / Android / Desktop install prompt available
  if (isInstallable) {
    return (
      <button
        onClick={install}
        id="pwa-install-btn"
        className={buttonClass}
        title="Install BMICH Book Spotter app on your device"
      >
        <Download className="w-3 h-3 text-[#F37021]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          id="pwa-install-ios-btn"
          className={buttonClass}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3 h-3 text-[#F37021]" />
          <span>Install App</span>
        </button>

        {renderIOSGuideModal()}
      </>
    );
  }

  // If topbar variant and prompt not yet triggered, always show button with guided install modal
  if (variant === 'topbar') {
    return (
      <>
        <button
          onClick={() => setShowGenericGuide(true)}
          id="pwa-install-topbar-guide-btn"
          className={buttonClass}
          title="Install BMICH Book Spotter app"
        >
          <Download className="w-3 h-3 text-[#F37021]" />
          <span>Install App</span>
        </button>

        {renderGenericGuideModal()}
      </>
    );
  }

  return null;
};
