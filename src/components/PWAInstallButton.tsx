import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=lk.sampath.sampathvishwa&pcampaignid=web_share';
const APP_STORE_URL =
  'https://apps.apple.com/np/app/sampath-vishwa-retail/id6478132816';

export const getVishwaAppStoreUrl = (): string => {
  if (typeof window === 'undefined') return PLAY_STORE_URL;
  const ua = window.navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  return isIOS ? APP_STORE_URL : PLAY_STORE_URL;
};

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'pill' | 'topbar' }> = ({
  variant = 'topbar'
}) => {
  const [storeUrl, setStoreUrl] = useState(PLAY_STORE_URL);

  useEffect(() => {
    setStoreUrl(getVishwaAppStoreUrl());
  }, []);

  const buttonClass =
    variant === 'topbar'
      ? 'flex items-center gap-1 rounded-full bg-black/80 hover:bg-black text-white px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black border border-white/25 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0'
      : 'flex items-center gap-1.5 rounded-full bg-zinc-900 text-white hover:bg-black px-3 py-1.5 text-xs font-bold border border-orange-500/30 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer';

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const targetUrl = getVishwaAppStoreUrl();
    e.currentTarget.href = targetUrl;
  };

  return (
    <a
      href={storeUrl}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      id="pwa-install-btn"
      className={buttonClass}
      title="Download Sampath Vishwa App"
    >
      <Download className="w-3 h-3 text-[#F37021]" />
      <span>Install Vishwa App</span>
    </a>
  );
};
