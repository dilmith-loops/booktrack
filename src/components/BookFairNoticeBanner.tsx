import React from 'react';
import { 
  Megaphone, 
  Sparkles, 
  Bell, 
  Tag, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Info,
  ExternalLink
} from 'lucide-react';
import { BookFairNoticeBanner as NoticeBannerType, NoticeBannerTheme, PwaTab } from '../types';

interface BookFairNoticeBannerProps {
  notice: NoticeBannerType;
  onDismiss?: () => void;
  onNavigateTab?: (tab: PwaTab) => void;
  isPreview?: boolean;
  className?: string;
}

export const BookFairNoticeBanner: React.FC<BookFairNoticeBannerProps> = ({
  notice,
  onDismiss,
  onNavigateTab,
  isPreview = false,
  className = ''
}) => {
  if (!notice.enabled && !isPreview) {
    return null;
  }

  const theme = notice.theme || 'orange';

  // Theme styling definitions
  const themeStyles: Record<NoticeBannerTheme, {
    container: string;
    badge: string;
    iconColor: string;
    textColor: string;
    btnColor: string;
    closeColor: string;
    glow: string;
  }> = {
    orange: {
      container: 'bg-gradient-to-r from-[#F37021] via-[#EA580C] to-[#C2410C] text-white border-b border-orange-600/60',
      badge: 'bg-black/25 text-white border border-white/30',
      iconColor: 'text-amber-200',
      textColor: 'text-white',
      btnColor: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-xs',
      closeColor: 'text-orange-200 hover:text-white hover:bg-black/20',
      glow: 'shadow-[0_2px_12px_rgba(243,112,33,0.3)]'
    },
    amber: {
      container: 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-white border-b border-amber-700/60',
      badge: 'bg-black/30 text-white border border-white/30',
      iconColor: 'text-yellow-100',
      textColor: 'text-white',
      btnColor: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-xs',
      closeColor: 'text-amber-100 hover:text-white hover:bg-black/20',
      glow: 'shadow-[0_2px_12px_rgba(217,119,6,0.3)]'
    },
    emerald: {
      container: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-b border-emerald-700/60',
      badge: 'bg-black/25 text-white border border-white/30',
      iconColor: 'text-emerald-200',
      textColor: 'text-white',
      btnColor: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-xs',
      closeColor: 'text-emerald-200 hover:text-white hover:bg-black/20',
      glow: 'shadow-[0_2px_12px_rgba(16,185,129,0.3)]'
    },
    indigo: {
      container: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white border-b border-indigo-700/60',
      badge: 'bg-black/25 text-white border border-white/30',
      iconColor: 'text-indigo-200',
      textColor: 'text-white',
      btnColor: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-xs',
      closeColor: 'text-indigo-200 hover:text-white hover:bg-black/20',
      glow: 'shadow-[0_2px_12px_rgba(99,102,241,0.3)]'
    },
    rose: {
      container: 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white border-b border-rose-700/60',
      badge: 'bg-black/30 text-white border border-white/30',
      iconColor: 'text-rose-200',
      textColor: 'text-white',
      btnColor: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-xs',
      closeColor: 'text-rose-200 hover:text-white hover:bg-black/20',
      glow: 'shadow-[0_2px_12px_rgba(244,63,94,0.3)]'
    },
    dark: {
      container: 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 border-b border-[#F37021]/40',
      badge: 'bg-[#F37021] text-white border border-[#F37021]/80 font-black',
      iconColor: 'text-[#F37021]',
      textColor: 'text-zinc-100',
      btnColor: 'bg-[#F37021]/20 hover:bg-[#F37021]/30 text-orange-300 border border-[#F37021]/40 shadow-xs',
      closeColor: 'text-zinc-400 hover:text-white hover:bg-zinc-800',
      glow: 'shadow-[0_2px_12px_rgba(0,0,0,0.5)]'
    }
  };

  const currentTheme = themeStyles[theme] || themeStyles.orange;

  // Select appropriate icon
  const renderIcon = () => {
    switch (theme) {
      case 'rose':
        return <AlertCircle className={`w-3.5 h-3.5 ${currentTheme.iconColor} flex-shrink-0 animate-pulse`} />;
      case 'emerald':
        return <Tag className={`w-3.5 h-3.5 ${currentTheme.iconColor} flex-shrink-0`} />;
      case 'amber':
        return <Bell className={`w-3.5 h-3.5 ${currentTheme.iconColor} flex-shrink-0 animate-bounce duration-1000`} />;
      case 'indigo':
        return <Info className={`w-3.5 h-3.5 ${currentTheme.iconColor} flex-shrink-0`} />;
      default:
        return <Megaphone className={`w-3.5 h-3.5 ${currentTheme.iconColor} flex-shrink-0 animate-pulse`} />;
    }
  };

  // Handle action click
  const handleActionClick = () => {
    if (!notice.linkUrl) return;

    const validTabs: PwaTab[] = ['chat', 'radar', 'stalls', 'perks'];
    if (validTabs.includes(notice.linkUrl as PwaTab) && onNavigateTab) {
      onNavigateTab(notice.linkUrl as PwaTab);
    } else if (notice.linkUrl.startsWith('http://') || notice.linkUrl.startsWith('https://')) {
      window.open(notice.linkUrl, '_blank', 'noopener,noreferrer');
    } else if (onNavigateTab && notice.linkUrl.toLowerCase().includes('stall')) {
      onNavigateTab('stalls');
    } else if (onNavigateTab && notice.linkUrl.toLowerCase().includes('perk')) {
      onNavigateTab('perks');
    } else if (onNavigateTab && notice.linkUrl.toLowerCase().includes('radar')) {
      onNavigateTab('radar');
    }
  };

  const isBadgeVisible = notice.showBadge !== false && !!notice.badgeText && notice.badgeText.trim().length > 0;
  const badgeText = notice.badgeText ? notice.badgeText.trim() : '';
  const isTicker = notice.isTicker ?? true;
  const isClosable = notice.isClosable ?? true;
  const hasCloseButton = isClosable && !isPreview && Boolean(onDismiss);

  // Static Banner layout: Beautifully centered in the banner
  if (!isTicker) {
    return (
      <div
        role="alert"
        aria-label="Book Fair Notice"
        className={`w-full py-1.5 px-3 text-xs relative flex items-center justify-center overflow-hidden transition-all duration-300 ${currentTheme.container} ${currentTheme.glow} ${className}`}
      >
        {/* Centered Notice Group: Icon + Badge (if shown) + Text + Action Button */}
        <div className={`flex items-center justify-center text-center gap-2 max-w-full overflow-hidden ${hasCloseButton ? 'px-7' : 'px-2'}`}>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {renderIcon()}
            {isBadgeVisible && (
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${currentTheme.badge} select-none flex-shrink-0`}>
                {badgeText}
              </span>
            )}
          </div>

          <span className="truncate text-[11px] sm:text-xs font-bold leading-normal text-center" title={notice.message}>
            {notice.message}
          </span>

          {notice.linkText && (
            <button
              type="button"
              onClick={handleActionClick}
              className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0 ${currentTheme.btnColor}`}
              title={notice.linkText}
            >
              <span>{notice.linkText}</span>
              {notice.linkUrl && (notice.linkUrl.startsWith('http') ? (
                <ExternalLink className="w-2.5 h-2.5 opacity-80" />
              ) : (
                <ChevronRight className="w-2.5 h-2.5" />
              ))}
            </button>
          )}
        </div>

        {/* Absolute Right: Dismiss Button */}
        {hasCloseButton && (
          <button
            type="button"
            onClick={onDismiss}
            className={`absolute right-2 sm:right-3 p-0.5 rounded-md transition-colors cursor-pointer flex-shrink-0 ${currentTheme.closeColor}`}
            title="Dismiss notice"
            aria-label="Dismiss notice banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Marquee Ticker layout: Left pinned Icon/Badge, scrolling marquee track, right Action & Dismiss
  return (
    <div
      role="alert"
      aria-label="Book Fair Notice"
      className={`w-full py-1.5 px-2.5 sm:px-3 text-xs flex items-center justify-between gap-2 overflow-hidden transition-all duration-300 ${currentTheme.container} ${currentTheme.glow} ${className}`}
    >
      {/* Left: Icon & Badge */}
      <div className="flex items-center gap-1.5 flex-shrink-0 z-10">
        {renderIcon()}
        {isBadgeVisible && (
          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${currentTheme.badge} select-none`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Middle: Notice Content (Marquee) */}
      <div className="flex-1 min-w-0 overflow-hidden relative mx-1">
        <div className="notice-ticker-wrapper overflow-hidden relative w-full flex items-center">
          <div className="notice-ticker-content flex items-center gap-8 whitespace-nowrap text-[11px] sm:text-xs font-bold animate-notice-marquee hover:[animation-play-state:paused] cursor-default">
            <span>{notice.message}</span>
            <span className="opacity-50 select-none">•</span>
            <span>{notice.message}</span>
            <span className="opacity-50 select-none">•</span>
            <span>{notice.message}</span>
          </div>
        </div>
      </div>

      {/* Right: Action Button & Dismiss Button */}
      <div className="flex items-center gap-1.5 flex-shrink-0 z-10">
        {notice.linkText && (
          <button
            type="button"
            onClick={handleActionClick}
            className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap ${currentTheme.btnColor}`}
            title={notice.linkText}
          >
            <span>{notice.linkText}</span>
            {notice.linkUrl && (notice.linkUrl.startsWith('http') ? (
              <ExternalLink className="w-2.5 h-2.5 opacity-80" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5" />
            ))}
          </button>
        )}

        {hasCloseButton && (
          <button
            type="button"
            onClick={onDismiss}
            className={`p-0.5 rounded-md transition-colors cursor-pointer flex-shrink-0 ${currentTheme.closeColor}`}
            title="Dismiss notice"
            aria-label="Dismiss notice banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
