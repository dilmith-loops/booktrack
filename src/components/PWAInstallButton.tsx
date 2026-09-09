import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, X, Smartphone, CheckCircle } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'pill' | 'topbar' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const buttonClass =
    variant === 'topbar'
      ? 'flex items-center gap-1 rounded-full bg-black/80 hover:bg-black text-white px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black border border-white/25 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0'
      : 'flex items-center gap-1.5 rounded-full bg-zinc-900 text-white hover:bg-black px-3 py-1.5 text-xs font-bold border border-orange-500/30 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer';

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

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border-2 border-black animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F37021] flex items-center justify-center text-white">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-black">Install on iPhone</h3>
                    <p className="text-[11px] text-zinc-500">BMICH Book Spotter PWA</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-zinc-700">
                <div className="flex items-start gap-2.5 p-2.5 bg-orange-50/70 rounded-xl border border-orange-200">
                  <div className="w-6 h-6 rounded-full bg-[#F37021] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <div>
                    Tap the <strong>Share button</strong> in your Safari toolbar at the bottom of the screen.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-orange-50/70 rounded-xl border border-orange-200">
                  <div className="w-6 h-6 rounded-full bg-[#F37021] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <div>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-orange-50/70 rounded-xl border border-orange-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    Launch from your Home Screen for instant offline access and full-screen experience during the fair!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#F37021] py-2.5 text-xs font-black text-white hover:bg-black transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
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

        {showGenericGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border-2 border-black animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F37021] flex items-center justify-center text-white">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-black">Install Book Spotter</h3>
                    <p className="text-[11px] text-zinc-500">BMICH Fair Web App</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenericGuide(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-zinc-700">
                <div className="flex items-start gap-2.5 p-2.5 bg-orange-50/70 rounded-xl border border-orange-200">
                  <div className="w-6 h-6 rounded-full bg-[#F37021] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <div>
                    Tap your browser menu (<strong>⋮</strong> or <strong>Share</strong> button).
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-orange-50/70 rounded-xl border border-orange-200">
                  <div className="w-6 h-6 rounded-full bg-[#F37021] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <div>
                    Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-orange-50/70 rounded-xl border border-orange-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    Instant fast access even with poor cellular reception inside the halls!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowGenericGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#F37021] py-2.5 text-xs font-black text-white hover:bg-black transition-colors cursor-pointer"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
