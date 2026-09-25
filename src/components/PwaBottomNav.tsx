import React from 'react';
import { MessageSquare, Search, Building2, CreditCard, PlusCircle, Sparkles } from 'lucide-react';

export type PwaTab = 'chat' | 'radar' | 'stalls' | 'perks';

interface PwaBottomNavProps {
  activeTab: PwaTab;
  onSelectTab: (tab: PwaTab) => void;
  unreadChatCount?: number;
  spotsCount?: number;
  onOpenPostModal: () => void;
}

export const PwaBottomNav: React.FC<PwaBottomNavProps> = ({
  activeTab,
  onSelectTab,
  unreadChatCount = 0,
  spotsCount,
  onOpenPostModal
}) => {
  // When actively viewing the chat feed tab, the unread badge is 0 (hidden).
  // On other tabs, it displays the count of unread/new spots since the user last checked the feed.
  const badgeCount = activeTab === 'chat' ? 0 : Math.max(0, unreadChatCount ?? 0);

  return (
    <nav
      id="pwa-bottom-navigation"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-zinc-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto px-2 h-14 sm:h-16 flex items-center justify-around">
        {/* Tab 1: Group Chat Feed */}
        <button
          onClick={() => onSelectTab('chat')}
          id="nav-tab-chat"
          className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            activeTab === 'chat' ? 'text-[#F37021]' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#F37021] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center border border-white animate-in zoom-in-75 duration-150">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">Chat Feed</span>
          {activeTab === 'chat' && (
            <span className="absolute bottom-1 w-5 h-0.5 bg-[#F37021] rounded-full" />
          )}
        </button>

        {/* Tab 2: Find a book */}
        <button
          onClick={() => onSelectTab('radar')}
          id="nav-tab-radar"
          className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            activeTab === 'radar' ? 'text-[#F37021]' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Search className="w-5 h-5" strokeWidth={activeTab === 'radar' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Find a book</span>
          {activeTab === 'radar' && (
            <span className="absolute bottom-1 w-5 h-0.5 bg-[#F37021] rounded-full" />
          )}
        </button>

        {/* Center Quick Action: Post (+ Photo) */}
        <div className="flex-1 flex justify-center -mt-3">
          <button
            onClick={onOpenPostModal}
            id="nav-center-post-btn"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#F37021] to-[#EA580C] text-white shadow-lg shadow-orange-500/30 flex items-center justify-center active:scale-90 transition-transform cursor-pointer border-2 border-white"
            title="Post Book Sighting"
          >
            <PlusCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Tab 3: Stalls Directory */}
        <button
          onClick={() => onSelectTab('stalls')}
          id="nav-tab-stalls"
          className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            activeTab === 'stalls' ? 'text-[#F37021]' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Building2 className="w-5 h-5" strokeWidth={activeTab === 'stalls' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-1 tracking-tight">BMICH Stalls</span>
          {activeTab === 'stalls' && (
            <span className="absolute bottom-1 w-5 h-0.5 bg-[#F37021] rounded-full" />
          )}
        </button>

        {/* Tab 4: Sampath Perks */}
        <button
          onClick={() => onSelectTab('perks')}
          id="nav-tab-perks"
          className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            activeTab === 'perks' ? 'text-[#F37021]' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <div className="relative">
            <CreditCard className="w-5 h-5" strokeWidth={activeTab === 'perks' ? 2.5 : 2} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">Promotions</span>
          {activeTab === 'perks' && (
            <span className="absolute bottom-1 w-5 h-0.5 bg-[#F37021] rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
