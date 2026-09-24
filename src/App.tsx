import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CommunityFeed } from './components/CommunityFeed';
import { QuickBookLookup } from './components/QuickBookLookup';
import { PwaBottomNav, PwaTab } from './components/PwaBottomNav';
import { PostBookSpotModal } from './components/PostBookSpotModal';
import { PhotoLightboxModal } from './components/PhotoLightboxModal';
import { SplashScreen } from './components/SplashScreen';
import { RegistrationWindow } from './components/RegistrationWindow';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AdminPanelModal } from './components/AdminPanelModal';
import { FeatureDemoTour } from './components/FeatureDemoTour';
import { Stall, BookSpotting, UserProfile, Announcement } from './types';
import { BMICH_STALLS, INITIAL_SPOTTINGS } from './data/initialData';
import { apiFetch } from './utils/api';
import { Search, MapPin, Building2, CreditCard, Check, Sparkles, Phone, ShieldCheck, Tag, Megaphone, Bell, X } from 'lucide-react';

export default function App() {
  const [stalls, setStalls] = useState<Stall[]>(BMICH_STALLS);
  const [spots, setSpots] = useState<BookSpotting[]>(INITIAL_SPOTTINGS);
  const [selectedHallFilter, setSelectedHallFilter] = useState('All Halls');
  const [activeTab, setActiveTab] = useState<PwaTab>('chat');
  const [showFeatureTour, setShowFeatureTour] = useState(false);

  const checkIsAdminRoute = () => {
    return (
      window.location.pathname.toLowerCase().includes('admin') ||
      window.location.hash.toLowerCase().includes('admin') ||
      window.location.search.toLowerCase().includes('admin')
    );
  };

  // Admin Modal & Announcements State
  const [showAdminModal, setShowAdminModal] = useState(() => checkIsAdminRoute());
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 'ann-1',
      message: '🎉 Sampath Bank Cardholders get 15% instant discount at Sarasavi & Expographic stalls!',
      type: 'discount',
      createdAt: Date.now(),
      isActive: true,
      publishedBy: 'Sampath Bank Team'
    }
  ]);

  // Registered spotters list (local storage)
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('sampath_bookfair_user');
      return saved ? [JSON.parse(saved)] : [];
    } catch {
      return [];
    }
  });

  // Stalls Directory sub-tab search
  const [stallSearch, setStallSearch] = useState('');
  const [stallHallFilter, setStallHallFilter] = useState('All');

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('sampath_bookfair_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Flow State: Splash Screen -> Registration Window
  const [showSplash, setShowSplash] = useState<boolean>(() => !checkIsAdminRoute());
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    if (checkIsAdminRoute()) {
      setShowSplash(false);
      setShowAdminModal(true);
    }

    const handleLocationChange = () => {
      if (checkIsAdminRoute()) {
        setShowSplash(false);
        setShowAdminModal(true);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Post modal & Lightbox
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [initialBookForModal, setInitialBookForModal] = useState('');

  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    images: string[];
    bookTitle: string;
    stallName: string;
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    bookTitle: '',
    stallName: '',
    initialIndex: 0
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [stallsRes, spotsRes] = await Promise.all([
          apiFetch('/api/stalls'),
          apiFetch('/api/spots?include_archived=true')
        ]);
        if (stallsRes.ok) {
          const sData = await stallsRes.json();
          if (sData.stalls && sData.stalls.length > 0) {
            setStalls(sData.stalls);
          }
        }
        if (spotsRes.ok) {
          const pData = await spotsRes.json();
          if (pData.spots && pData.spots.length > 0) {
            setSpots(pData.spots);
          }
        }
      } catch (err) {
        console.warn('Using offline dataset fallback:', err);
      }
    }
    loadData();
  }, []);

  const handleSpotAdded = (newSpot: BookSpotting) => {
    setSpots((prev) => [newSpot, ...prev]);
    setActiveTab('chat');
  };

  const handleUpvoteSpot = async (spotId: string) => {
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === spotId) {
          const hasUpvoted = s.hasUserUpvoted;
          return {
            ...s,
            helpfulCount: hasUpvoted ? s.helpfulCount - 1 : s.helpfulCount + 1,
            hasUserUpvoted: !hasUpvoted
          };
        }
        return s;
      })
    );

    try {
      await apiFetch(`/api/spots/${spotId}/upvote`, { method: 'POST' });
    } catch (err) {
      console.error('Error upvoting spot:', err);
    }
  };

  const handleUpdateStatus = async (
    spotId: string,
    status: 'In Stock' | 'Few Copies Left' | 'Sold Out' | 'Looking for Book' | 'Found'
  ) => {
    setSpots((prev) =>
      prev.map((s) => (s.id === spotId ? { ...s, status } : s))
    );

    try {
      await apiFetch(`/api/spots/${spotId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleRateSpot = async (spotId: string, score: number) => {
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === spotId) {
          const currentCount = s.ratingCount || (s.helpfulCount > 0 ? 1 : 0);
          const currentAvg = s.ratingAverage || 5.0;
          const newCount = currentCount + 1;
          const newAvg = Number(((currentAvg * currentCount + score) / newCount).toFixed(1));
          return {
            ...s,
            ratingCount: newCount,
            ratingAverage: newAvg,
            helpfulCount: s.helpfulCount + 1,
            userRating: score
          };
        }
        return s;
      })
    );

    try {
      await apiFetch(`/api/spots/${spotId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });
    } catch (err) {
      console.error('Error rating spot:', err);
    }
  };

  const handleOpenNewSpotWithTitle = (title: string) => {
    setInitialBookForModal(title);
    setIsPostModalOpen(true);
  };

  const openLightbox = (
    images: string[],
    bookTitle: string,
    stallName: string,
    initialIndex = 0
  ) => {
    setLightboxState({
      isOpen: true,
      images,
      bookTitle,
      stallName,
      initialIndex
    });
  };

  // Admin Moderation & CRUD Action Handlers
  const getAdminHeaders = () => {
    const token = sessionStorage.getItem('sampath_admin_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Admin-Token': token } : {})
    };
  };

  const handleDeleteSpot = async (spotId: string, userHandle?: string) => {
    setSpots((prev) => prev.filter((s) => s.id !== spotId));
    try {
      await apiFetch(`/api/spots/${spotId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          userHandle: userHandle || userProfile?.handle
        })
      });
    } catch (err) {
      console.error('Error deleting spot from database:', err);
    }
  };

  const handleArchiveSpot = async (spotId: string, userHandle?: string) => {
    const handle = userHandle || userProfile?.handle || 'user';
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId
          ? {
              ...s,
              isArchived: true,
              archivedAt: new Date().toISOString(),
              archivedBy: handle
            }
          : s
      )
    );
    try {
      await apiFetch(`/api/spots/${spotId}/archive`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ userHandle: handle })
      });
    } catch (err) {
      console.error('Error archiving spot:', err);
    }
  };

  const handleUnarchiveSpot = async (spotId: string) => {
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId
          ? {
              ...s,
              isArchived: false,
              archivedAt: undefined,
              archivedBy: undefined
            }
          : s
      )
    );
    try {
      await apiFetch(`/api/spots/${spotId}/unarchive`, {
        method: 'POST',
        headers: getAdminHeaders()
      });
    } catch (err) {
      console.error('Error unarchiving spot:', err);
    }
  };

  const handleToggleArchiveSpot = async (spotId: string, userHandle?: string) => {
    const target = spots.find((s) => s.id === spotId);
    if (target?.isArchived) {
      await handleUnarchiveSpot(spotId);
    } else {
      await handleArchiveSpot(spotId, userHandle);
    }
  };

  const handleTogglePinSpot = async (spotId: string) => {
    setSpots((prev) =>
      prev.map((s) => (s.id === spotId ? { ...s, isPinned: !s.isPinned } : s))
    );
    try {
      await apiFetch(`/api/spots/${spotId}/pin`, {
        method: 'POST',
        headers: getAdminHeaders()
      });
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const handleToggleAiVerified = async (spotId: string) => {
    setSpots((prev) =>
      prev.map((s) => (s.id === spotId ? { ...s, aiVerified: !s.aiVerified } : s))
    );
    try {
      await apiFetch(`/api/spots/${spotId}/ai-verify`, {
        method: 'POST',
        headers: getAdminHeaders()
      });
    } catch (err) {
      console.error('Error toggling AI verified:', err);
    }
  };

  const handleUpdateSpot = async (spotId: string, updatedFields: Partial<BookSpotting>) => {
    setSpots((prev) =>
      prev.map((s) => (s.id === spotId ? { ...s, ...updatedFields } : s))
    );
    try {
      const res = await apiFetch(`/api/spots/${spotId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) {
        console.error('Failed to update spot on server');
      }
    } catch (err) {
      console.error('Error updating spot in database:', err);
    }
  };

  const handleAddSpot = (newSpot: BookSpotting) => {
    setSpots((prev) => [newSpot, ...prev]);
  };

  const handleAddStall = async (newStall: Stall) => {
    setStalls((prev) => [newStall, ...prev]);
    try {
      await apiFetch('/api/stalls', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(newStall)
      });
    } catch (err) {
      console.error('Error creating stall in database:', err);
    }
  };

  const handleUpdateStall = async (stallId: string, updatedFields: Partial<Stall>) => {
    setStalls((prev) =>
      prev.map((s) => (s.id === stallId ? { ...s, ...updatedFields } : s))
    );
    try {
      await apiFetch(`/api/stalls/${stallId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(updatedFields)
      });
    } catch (err) {
      console.error('Error updating stall in database:', err);
    }
  };

  const handleDeleteStall = async (stallId: string) => {
    setStalls((prev) => prev.filter((s) => s.id !== stallId));
    try {
      await apiFetch(`/api/stalls/${stallId}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
    } catch (err) {
      console.error('Error deleting stall from database:', err);
    }
  };

  const handlePublishAnnouncement = (announcement: Announcement) => {
    setAnnouncements((prev) => [announcement, ...prev]);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleToggleUserCardholder = (handle: string) => {
    setRegisteredUsers((prev) =>
      prev.map((u) =>
        u.handle === handle
          ? { ...u, isSampathCardholder: !u.isSampathCardholder }
          : u
      )
    );
    if (userProfile && userProfile.handle === handle) {
      const updated = {
        ...userProfile,
        isSampathCardholder: !userProfile.isSampathCardholder
      };
      setUserProfile(updated);
      localStorage.setItem('sampath_bookfair_user', JSON.stringify(updated));
    }
  };

  // Filtered stalls for Stalls tab
  const filteredStalls = stalls.filter((s) => {
    const matchesHall =
      stallHallFilter === 'All' ||
      s.hall.toLowerCase().includes(stallHallFilter.toLowerCase());
    const matchesSearch =
      !stallSearch ||
      s.name.toLowerCase().includes(stallSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(stallSearch.toLowerCase()) ||
      s.stallNumber.toLowerCase().includes(stallSearch.toLowerCase());
    return matchesHall && matchesSearch;
  });

  const activeAnnouncement = announcements.find((a) => a.isActive);

  return (
    <div className="min-h-screen bg-[#18181B] flex justify-center selection:bg-[#F37021] selection:text-white">
      {/* Mobile PWA Shell container: Fits phones natively */}
      <div className="w-full max-w-md min-h-screen bg-white flex flex-col shadow-2xl relative">
        {/* 1. Splash Screen on Launch */}
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

        {/* 2. Registration & Login Authentication Modal */}
        <RegistrationWindow
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          onRegister={(profile) => {
            setUserProfile(profile);
            setShowRegistration(false);
            setRegisteredUsers((prev) => [...prev.filter(u => u.handle !== profile.handle), profile]);
          }}
          onProfileUpdate={(profile) => {
            setUserProfile(profile);
            setRegisteredUsers((prev) => [...prev.filter(u => u.handle !== profile.handle), profile]);
          }}
          onLogout={() => {
            setUserProfile(null);
            setShowRegistration(false);
          }}
          onStartTour={() => setShowFeatureTour(true)}
          currentProfile={userProfile}
          allowDismiss={true}
        />

        {/* 3. Admin Control Center Modal */}
        <AdminPanelModal
          isOpen={showAdminModal}
          onClose={() => {
            setShowAdminModal(false);
            if (checkIsAdminRoute()) {
              const basePath = window.location.pathname.startsWith('/booktrack') ? '/booktrack/' : '/';
              window.history.pushState({}, '', basePath);
            }
          }}
          spots={spots}
          stalls={stalls}
          announcements={announcements}
          registeredUsers={registeredUsers}
          onDeleteSpot={handleDeleteSpot}
          onUpdateSpot={handleUpdateSpot}
          onAddSpot={handleAddSpot}
          onTogglePinSpot={handleTogglePinSpot}
          onToggleAiVerified={handleToggleAiVerified}
          onToggleArchiveSpot={handleToggleArchiveSpot}
          onUpdateSpotStatus={handleUpdateStatus}
          onAddStall={handleAddStall}
          onUpdateStall={handleUpdateStall}
          onDeleteStall={handleDeleteStall}
          onPublishAnnouncement={handlePublishAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          onToggleUserCardholder={handleToggleUserCardholder}
        />

        {/* 4. Interactive Feature Demo Tour */}
        <FeatureDemoTour
          isOpen={showFeatureTour}
          onClose={() => setShowFeatureTour(false)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        {/* Offline Status Bar */}
        <OfflineIndicator />

        {/* Live Broadcast Announcement Banner */}
        {activeAnnouncement && (
          <div className="bg-[#F37021] text-white px-3 py-2 text-xs font-bold flex items-center justify-between shadow-xs border-b border-orange-600 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Megaphone className="w-4 h-4 text-orange-200 flex-shrink-0 animate-pulse" />
              <span className="truncate">{activeAnnouncement.message}</span>
            </div>
            <button
              onClick={() => handleDeleteAnnouncement(activeAnnouncement.id)}
              className="text-orange-200 hover:text-white font-black text-xs cursor-pointer flex-shrink-0"
              title="Dismiss Alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Streamlined Mobile PWA Top App Bar */}
        <Header
          spotsCount={spots.length}
          stallsCount={stalls.length}
          userProfile={userProfile}
          onOpenProfile={() => setShowRegistration(true)}
          onReplaySplash={() => setShowSplash(true)}
        />

        {/* Main PWA View Switching */}
        <main className="flex-1 flex flex-col pb-16">
          {/* TAB 1: WhatsApp-Style Group Chat Feed */}
          {activeTab === 'chat' && (
            <CommunityFeed
              spots={spots.filter((s) => !s.isArchived)}
              selectedHallFilter={selectedHallFilter}
              onSelectHallFilter={setSelectedHallFilter}
              onOpenNewSpotModal={(title?: string) => {
                setInitialBookForModal(title || '');
                setIsPostModalOpen(true);
              }}
              onUpvoteSpot={handleUpvoteSpot}
              onRateSpot={handleRateSpot}
              onUpdateStatus={handleUpdateStatus}
              onViewPhotoLightbox={openLightbox}
              userProfile={userProfile}
              stalls={stalls}
              onQuickSpotSubmit={handleSpotAdded}
              onArchiveSpot={handleArchiveSpot}
              onDeleteSpot={handleDeleteSpot}
            />
          )}

          {/* TAB 2: Dedicated Book Radar */}
          {activeTab === 'radar' && (
            <div className="p-3.5 sm:p-4 space-y-4 bg-zinc-50 flex-1">
              <QuickBookLookup
                spots={spots}
                onSelectSpot={(spot) => {
                  if (spot.images.length > 0) {
                    openLightbox(spot.images, spot.bookName, spot.stallName, 0);
                  }
                }}
                onOpenNewSpotWithTitle={handleOpenNewSpotWithTitle}
              />
            </div>
          )}

          {/* TAB 3: BMICH Stalls Guide */}
          {activeTab === 'stalls' && (
            <div className="p-3.5 sm:p-4 space-y-3 bg-zinc-50 flex-1">
              <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#F37021]" />
                    <h2 className="text-sm font-black text-zinc-900">BMICH Stalls Directory</h2>
                  </div>
                  <span className="text-[11px] bg-orange-50 text-[#EA580C] font-bold px-2 py-0.5 rounded-full">
                    {filteredStalls.length} Stalls
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={stallSearch}
                    onChange={(e) => setStallSearch(e.target.value)}
                    placeholder="Search publisher or stall number..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#F37021]"
                  />
                </div>

                {/* Hall Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {['All', 'Hall A', 'Hall B', 'Hall C', 'Hall D', 'Hall E', 'Sirimavo Hall'].map((hall) => (
                    <button
                      key={hall}
                      onClick={() => setStallHallFilter(hall)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                        stallHallFilter === hall
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {hall}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stalls List */}
              <div className="space-y-2">
                {filteredStalls.map((stall) => (
                  <div
                    key={stall.id}
                    className="p-3 bg-white border border-zinc-200 rounded-xl shadow-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-zinc-900 truncate">
                        {stall.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#F37021] flex-shrink-0" />
                        <span>{stall.hall}</span>
                        <span>•</span>
                        <span className="font-bold text-zinc-800">{stall.stallNumber}</span>
                      </div>
                      <span className="inline-block mt-1 text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded font-medium">
                        {stall.category}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setInitialBookForModal('');
                        setIsPostModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#EA580C] text-[10px] font-black rounded-lg border border-orange-200 flex-shrink-0 cursor-pointer"
                    >
                      + Spot Book
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Sampath Cardholder Privileges */}
          {activeTab === 'perks' && (
            <div className="p-3.5 sm:p-4 space-y-3.5 bg-zinc-50 flex-1">
              <div className="bg-gradient-to-r from-[#F37021] via-[#EA580C] to-[#C2410C] text-white p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-200">
                  <CreditCard className="w-4 h-4" />
                  <span>Official Fair Sponsor</span>
                </div>
                <h3 className="text-base font-black text-white leading-tight">
                  Sampath Bank Cardholder Privileges
                </h3>
                <p className="text-xs text-orange-100 font-medium">
                  Enjoy instant discounts and on-site banking services at the Colombo International Book Fair 2026.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 font-black text-xs text-zinc-900">
                  <Sparkles className="w-4 h-4 text-[#F37021]" />
                  <span>10% to 25% Instant Savings</span>
                </div>
                <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                  Pay with your Sampath Bank Visa, Mastercard, or Ultra Rewards card at Sarasavi, M.D. Gunasena, Vijitha Yapa, Expographic, and 100+ participating BMICH book stalls.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs space-y-2.5">
                <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                  Fairground Services:
                </h4>

                <div className="flex items-start gap-2 text-xs text-zinc-700 p-2 bg-zinc-50 rounded-xl">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Mobile ATMs & Cash Booths:</strong> Located at Sirimavo Bandaranaike Hall & Main Entrance for fast cash withdrawals.
                  </span>
                </div>

                <div className="flex items-start gap-2 text-xs text-zinc-700 p-2 bg-zinc-50 rounded-xl">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Instant Card Activation:</strong> Visit the Sampath Pavilion at Hall A foyer for on-the-spot card assistance.
                  </span>
                </div>

                <div className="flex items-start gap-2 text-xs text-zinc-700 p-2 bg-zinc-50 rounded-xl">
                  <Phone className="w-4 h-4 text-[#F37021] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>24/7 Fair Hotline:</strong> Call 011 2 300 604 for cardholder assistance.
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 4. Native PWA Mobile Bottom Navigation Bar */}
        <PwaBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          spotsCount={spots.length}
          onOpenPostModal={() => {
            setInitialBookForModal('');
            setIsPostModalOpen(true);
          }}
        />

        {/* Modals */}
        <PostBookSpotModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          stalls={stalls}
          existingSpots={spots}
          initialBookTitle={initialBookForModal}
          userProfile={userProfile}
          onSpotAdded={handleSpotAdded}
        />

        <PhotoLightboxModal
          isOpen={lightboxState.isOpen}
          onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
          images={lightboxState.images}
          bookTitle={lightboxState.bookTitle}
          stallName={lightboxState.stallName}
          initialIndex={lightboxState.initialIndex}
        />
      </div>
    </div>
  );
}
