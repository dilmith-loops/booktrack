import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl bg-zinc-900/95 backdrop-blur-md border border-amber-500/40 px-3.5 py-2 text-xs font-semibold text-white shadow-2xl animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span>Offline Mode — Using cached BMICH fair stalls & posts.</span>
    </div>
  );
};
