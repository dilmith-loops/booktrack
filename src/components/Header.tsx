import React from 'react';
import { User } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserProfile } from '../types';

interface HeaderProps {
  spotsCount: number;
  stallsCount: number;
  userProfile: UserProfile | null;
  onOpenProfile: () => void;
  onReplaySplash?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  spotsCount,
  userProfile,
  onOpenProfile,
  onReplaySplash
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 shadow-xs">
      {/* Top micro sponsor accent banner with Install App Button */}
      <div className="bg-gradient-to-r from-[#F37021] via-[#EA580C] to-[#C2410C] text-white px-3 py-1 flex items-center justify-between">
        {/* Sponsor details in two rows */}
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-white">
            SAMPATH BANK PLC
          </span>
          <span className="text-[9px] text-orange-100/90 font-semibold tracking-wide">
            Official Sponsor
          </span>
        </div>

        {/* Install App button */}
        <div className="flex items-center">
          <PWAInstallButton variant="topbar" />
        </div>
      </div>

      {/* Main App Bar - Only Logo and User Icon */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-3 max-w-2xl mx-auto h-16 sm:h-20">
        {/* Left: Only Logo */}
        <button
          onClick={onReplaySplash}
          id="header-logo-btn"
          className="flex items-center h-full cursor-pointer transition-opacity hover:opacity-85 focus:outline-none"
          title="Sampath Book Finder"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Sampath Bank"
            className="h-10 sm:h-14 w-auto object-contain"
          />
        </button>

        {/* Right: User Icon */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">

          <button
            onClick={onOpenProfile}
            id="user-profile-header-btn"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F37021] text-white flex items-center justify-center font-black text-sm shadow-xs hover:bg-[#EA580C] transition-all cursor-pointer flex-shrink-0"
            title={userProfile?.name ? `${userProfile.name} - Profile & Settings` : 'Sign In or Register'}
          >
            {userProfile?.name ? (
              userProfile.name.charAt(0).toUpperCase()
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
