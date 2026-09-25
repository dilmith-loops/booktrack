import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { 
  MapPin, 
  CheckCheck, 
  Image as ImageIcon, 
  Heart, 
  Building2, 
  Lock, 
  Star, 
  CornerDownRight, 
  HelpCircle, 
  Award, 
  Archive, 
  Trash2,
  Info,
  Loader2
} from 'lucide-react';
import { BookSpotting, Stall, UserProfile } from '../types';

interface CommunityFeedProps {
  spots: BookSpotting[];
  selectedHallFilter: string;
  onSelectHallFilter: (hall: string) => void;
  onOpenNewSpotModal: (initialTitle?: string, replyToSpot?: BookSpotting) => void;
  onUpvoteSpot: (spotId: string) => void;
  onRateSpot?: (spotId: string, score: number) => void;
  onUpdateStatus: (spotId: string, status: 'In Stock' | 'Few Copies Left' | 'Sold Out' | 'Looking for Book' | 'Found') => void;
  onViewPhotoLightbox: (images: string[], bookTitle: string, stallName: string, initialIndex?: number) => void;
  userProfile?: UserProfile | null;
  stalls?: Stall[];
  onQuickSpotSubmit?: (spot: BookSpotting) => void;
  onArchiveSpot?: (spotId: string, userHandle?: string) => void;
  onDeleteSpot?: (spotId: string, userHandle?: string) => void;
  highlightedSpotId?: string | null;
  chatRefreshKey?: number;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  spots,
  selectedHallFilter,
  onOpenNewSpotModal,
  onUpvoteSpot,
  onRateSpot,
  onUpdateStatus,
  onViewPhotoLightbox,
  userProfile,
  stalls = [],
  onQuickSpotSubmit,
  onArchiveSpot,
  onDeleteSpot,
  highlightedSpotId,
  chatRefreshKey
}) => {
  // Track local user ratings { [spotId]: score }
  const [userRatings, setUserRatings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('sampath_user_ratings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sender color palette for WhatsApp-style group chat
  const senderColors = [
    'text-emerald-700',
    'text-blue-700',
    'text-orange-600',
    'text-purple-700',
    'text-rose-700',
    'text-amber-700',
    'text-teal-700',
  ];

  const getSenderColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % senderColors.length;
    return senderColors[index];
  };

  const INITIAL_PAGE_SIZE = 10;
  const BATCH_SIZE = 10;

  // Track initial loading state to display loading animation until first 10 messages load
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Lazy loading state for chat messages: load latest 10 messages initially, then in batches
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_PAGE_SIZE);
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);
  const isLoadingOlderRef = useRef<boolean>(false);

  // References for preserving exact scroll position when prepending older messages
  const topAnchorSpotIdRef = useRef<string | null>(null);
  const topAnchorOffsetRef = useRef<number | null>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolledRef = useRef<boolean>(false);
  const previousSpotsLengthRef = useRef<number>(spots.length);

  // Order chat stream chronologically: earlier messages on top, newest at bottom (WhatsApp style)
  const chatSpots = useMemo(() => {
    return [...spots].sort((a, b) => a.timestamp - b.timestamp);
  }, [spots]);

  const totalCount = chatSpots.length;
  const startIndex = Math.max(0, totalCount - visibleCount);
  const visibleSpots = useMemo(() => {
    return chatSpots.slice(startIndex);
  }, [chatSpots, startIndex]);

  const hasMoreOlder = startIndex > 0;
  const olderCount = startIndex;

  // Helper to reliably scroll to the last message at the bottom
  const scrollToLastMessage = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior
    });
  }, []);

  // Show loading animation in the chat until the first 10 messages are loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  // When first 10 messages finish loading, point immediately to the last message at the bottom
  useEffect(() => {
    if (isInitialLoading) return;

    if (!highlightedSpotId && !hasInitialScrolledRef.current) {
      scrollToLastMessage('auto');
      const t1 = setTimeout(() => {
        scrollToLastMessage('auto');
      }, 100);
      const t2 = setTimeout(() => {
        hasInitialScrolledRef.current = true;
      }, 350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isInitialLoading, highlightedSpotId, scrollToLastMessage]);

  // Automatically refresh chat feed with the latest 10 messages and show the last message
  // when the user adds a post by themselves or deletes/archives their own post
  useEffect(() => {
    if (!chatRefreshKey) return;

    // Reset pagination to latest 10 messages
    setVisibleCount(INITIAL_PAGE_SIZE);
    previousSpotsLengthRef.current = spots.length;
    setIsInitialLoading(true);

    const timer = setTimeout(() => {
      setIsInitialLoading(false);
      requestAnimationFrame(() => {
        scrollToLastMessage('smooth');
      });
      const t1 = setTimeout(() => {
        scrollToLastMessage('smooth');
      }, 80);
      const t2 = setTimeout(() => {
        scrollToLastMessage('auto');
      }, 250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, 380);

    return () => clearTimeout(timer);
  }, [chatRefreshKey, scrollToLastMessage, spots.length]);

  // When background/server polling brings new messages (and not during refresh or initial load)
  useEffect(() => {
    if (isInitialLoading) return;
    if (highlightedSpotId) return;

    if (spots.length > previousSpotsLengthRef.current) {
      const addedCount = spots.length - previousSpotsLengthRef.current;
      setVisibleCount(prev => prev + addedCount);

      const isNearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 350;
      if (isNearBottom) {
        scrollToLastMessage('smooth');
      }
    }
    previousSpotsLengthRef.current = spots.length;
  }, [spots.length, isInitialLoading, highlightedSpotId, scrollToLastMessage]);

  // Scroll to highlighted spot when notification is clicked, expanding visible window if needed
  useEffect(() => {
    if (!highlightedSpotId || isInitialLoading) return;

    const spotIndex = chatSpots.findIndex(s => s.id === highlightedSpotId);
    if (spotIndex !== -1) {
      const neededCount = chatSpots.length - spotIndex;
      if (neededCount > visibleCount) {
        setVisibleCount(neededCount + 2);
      }
    }

    const timer = setTimeout(() => {
      const el = document.getElementById(`chat-spot-${highlightedSpotId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [highlightedSpotId, chatSpots, visibleCount, isInitialLoading]);

  // Seamlessly load more older messages while preserving exact scroll anchor
  const loadMoreOlder = useCallback(() => {
    if (isLoadingOlderRef.current || !hasMoreOlder) return;

    // Capture the top-most visible spot element's bounding rect before prepending
    const currentFirstSpot = visibleSpots[0];
    if (currentFirstSpot) {
      const el = document.getElementById(`chat-spot-${currentFirstSpot.id}`);
      if (el) {
        topAnchorSpotIdRef.current = currentFirstSpot.id;
        topAnchorOffsetRef.current = el.getBoundingClientRect().top;
      }
    }

    isLoadingOlderRef.current = true;
    setIsLoadingOlder(true);

    setTimeout(() => {
      setVisibleCount(prev => Math.min(totalCount, prev + BATCH_SIZE));
      setTimeout(() => {
        isLoadingOlderRef.current = false;
        setIsLoadingOlder(false);
      }, 150);
    }, 350);
  }, [hasMoreOlder, visibleSpots, totalCount]);

  // Instantly adjust scroll position after older messages are prepended to ensure ZERO visual shift
  useLayoutEffect(() => {
    if (topAnchorSpotIdRef.current && topAnchorOffsetRef.current !== null) {
      const el = document.getElementById(`chat-spot-${topAnchorSpotIdRef.current}`);
      if (el) {
        const currentTop = el.getBoundingClientRect().top;
        const delta = currentTop - topAnchorOffsetRef.current;
        if (Math.abs(delta) > 0.5) {
          window.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
        }
      }
      topAnchorSpotIdRef.current = null;
      topAnchorOffsetRef.current = null;
    }
  }, [visibleSpots]);

  // Top sentinel observer: triggers loading older messages as user scrolls up
  useEffect(() => {
    if (isInitialLoading) return;
    const sentinel = topSentinelRef.current;
    if (!sentinel || !hasMoreOlder) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoadingOlderRef.current && hasInitialScrolledRef.current) {
          loadMoreOlder();
        }
      },
      {
        root: null,
        rootMargin: '250px 0px 0px 0px',
        threshold: 0.05
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreOlder, loadMoreOlder, isInitialLoading]);

  // Window scroll fallback listener when user scrolls near the top
  useEffect(() => {
    if (isInitialLoading || !hasMoreOlder) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (hasInitialScrolledRef.current && window.scrollY < 250 && !isLoadingOlderRef.current) {
            loadMoreOlder();
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMoreOlder, loadMoreOlder, isInitialLoading]);

  const formatChatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // User initiates a reply to a "looking for a book" request -> open post modal pre-filled
  const handleStartReply = (requestSpot: BookSpotting) => {
    onOpenNewSpotModal(requestSpot.bookName, requestSpot);
  };

  // Handle rating a find
  const handleRateFind = (spotId: string, score: number) => {
    setUserRatings(prev => {
      const next = { ...prev, [spotId]: score };
      try {
        localStorage.setItem('sampath_user_ratings', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (onRateSpot) {
      onRateSpot(spotId, score);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#EFEAE2] min-h-[calc(100vh-120px)] pb-6 sm:pb-8 relative">
      {/* Messages Stream with WhatsApp Wallpaper Texture */}
      <div
        className="flex-1 px-3 py-3 space-y-3"
        style={{
          backgroundImage: `radial-gradient(#d1c7b7 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      >
        {/* WhatsApp End-to-End Style System Bubble */}
        <div className="flex justify-center my-1">
          <div className="bg-[#FCF5EB] border border-[#E8DEC8] text-[#54656F] px-3.5 py-1 rounded-xl text-[10px] font-medium shadow-xs max-w-xs text-center flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#00A884] flex-shrink-0" />
            <span>
              All messages verified by Sampath AI Shield. Post sightings or create "Looking for a book" requests.
            </span>
          </div>
        </div>

        {/* Date Divider Pill */}
        <div className="flex justify-center my-1">
          <span className="bg-white/90 backdrop-blur-xs text-zinc-600 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-xs">
            BMICH Fair • September 25 – October 4, 2026
          </span>
        </div>

        {/* Top Sentinel & Earlier Messages Loader */}
        <div ref={topSentinelRef} className="h-1 w-full pointer-events-none" aria-hidden="true" />

        {/* Loading earlier messages indicator or button */}
        {!isInitialLoading && hasMoreOlder && (
          <div className="flex flex-col items-center justify-center py-2 animate-in fade-in duration-200">
            <button
              type="button"
              id="load-earlier-messages-btn"
              onClick={loadMoreOlder}
              disabled={isLoadingOlder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/90 shadow-2xs text-[10px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-70"
              title="Scroll up or tap to load previous messages"
            >
              {isLoadingOlder ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F37021]" />
                  <span>Loading earlier messages...</span>
                </>
              ) : (
                <>
                  <span className="text-[#F37021] font-black">↑</span>
                  <span>Load earlier messages ({olderCount} more)</span>
                </>
              )}
            </button>
          </div>
        )}

        {!isInitialLoading && !hasMoreOlder && totalCount > INITIAL_PAGE_SIZE && (
          <div className="flex justify-center my-2 animate-in fade-in">
            <span className="bg-[#E7E2D8] text-zinc-600 text-[9px] font-bold px-3 py-0.5 rounded-full shadow-2xs">
              Beginning of chat history • All {totalCount} messages loaded
            </span>
          </div>
        )}

        {/* Chat Messages List / Loading Skeleton */}
        {isInitialLoading ? (
          <div className="space-y-4 py-3 animate-in fade-in duration-200">
            <div className="flex justify-center my-1">
              <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md border border-[#E8DEC8] text-[#54656F] px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F37021]" />
                <span>Loading latest messages...</span>
              </div>
            </div>

            {/* Chat Skeleton Bubbles with WhatsApp style Pulse */}
            <div className="space-y-3 pt-1">
              {/* Skeleton 1: Incoming Left */}
              <div className="flex flex-col items-start animate-pulse">
                <div className="w-[85%] sm:w-[75%] rounded-2xl rounded-tl-xs p-3 bg-white/90 border border-zinc-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-black/5">
                    <div className="h-3 w-28 bg-zinc-200 rounded-full" />
                    <div className="h-2.5 w-12 bg-zinc-200 rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 bg-zinc-200 rounded-md" />
                  <div className="h-12 bg-zinc-100 rounded-xl border border-zinc-200/60 p-2 space-y-1.5">
                    <div className="h-3 w-1/2 bg-zinc-200 rounded" />
                    <div className="h-2.5 w-2/3 bg-zinc-200 rounded" />
                  </div>
                  <div className="flex justify-end pt-0.5">
                    <div className="h-2.5 w-10 bg-zinc-200 rounded" />
                  </div>
                </div>
              </div>

              {/* Skeleton 2: Outgoing Right */}
              <div className="flex flex-col items-end animate-pulse">
                <div className="w-[78%] sm:w-[68%] rounded-2xl rounded-tr-xs p-3 bg-[#E7FFDB]/90 border border-[#CDEEB7] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-black/5">
                    <div className="h-3 w-16 bg-emerald-200/80 rounded-full" />
                    <div className="h-2.5 w-10 bg-emerald-200/80 rounded-full" />
                  </div>
                  <div className="h-4 w-4/5 bg-emerald-200/90 rounded-md" />
                  <div className="h-9 bg-white/70 rounded-xl border border-emerald-200/60 p-2 space-y-1">
                    <div className="h-2.5 w-3/5 bg-emerald-200/70 rounded" />
                  </div>
                  <div className="flex justify-end pt-0.5">
                    <div className="h-2.5 w-12 bg-emerald-200/80 rounded" />
                  </div>
                </div>
              </div>

              {/* Skeleton 3: Incoming Left with Book Inquiry Request */}
              <div className="flex flex-col items-start animate-pulse">
                <div className="w-[88%] sm:w-[78%] rounded-2xl rounded-tl-xs p-3 bg-[#FEF9E7]/90 border border-amber-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-black/5">
                    <div className="h-3 w-24 bg-amber-200/80 rounded-full" />
                    <div className="h-2.5 w-16 bg-amber-200/80 rounded-full" />
                  </div>
                  <div className="h-4 w-4/5 bg-amber-200/90 rounded-md" />
                  <div className="h-10 bg-amber-100/60 rounded-xl border border-amber-200/60 p-2 space-y-1">
                    <div className="h-2.5 w-2/3 bg-amber-200/80 rounded" />
                  </div>
                  <div className="flex justify-end pt-0.5">
                    <div className="h-2.5 w-10 bg-amber-200/80 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : visibleSpots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center text-zinc-400 mb-2">
              <Building2 className="w-5 h-5 text-[#F37021]" />
            </div>
            <p className="text-xs font-black text-zinc-700">No messages yet</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Be the first to post a book sighting or ask for a book!
            </p>
          </div>
        ) : (
          visibleSpots.map((spot) => {
            const isUserSelf = userProfile && (
              spot.finderHandle === userProfile.handle ||
              spot.finderName.toLowerCase() === userProfile.name.toLowerCase()
            );

            const isRequest = spot.postType === 'request';
            const userRating = userRatings[spot.id] || spot.userRating;
            const isHighlighted = highlightedSpotId === spot.id;

            return (
              <div
                key={spot.id}
                id={`chat-spot-${spot.id}`}
                className={`flex flex-col ${isUserSelf ? 'items-end' : 'items-start'} animate-in fade-in duration-150 transition-all ${
                  isHighlighted ? 'ring-4 ring-[#F37021] rounded-3xl p-1 bg-orange-100/60 shadow-lg' : ''
                }`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-[95%] sm:max-w-[85%] rounded-2xl p-2.5 sm:p-3 shadow-xs border transition-shadow ${
                    isRequest
                      ? 'bg-[#FEF9E7] border-amber-300 rounded-tl-xs'
                      : isUserSelf
                      ? 'bg-[#E7FFDB] border-[#CDEEB7] rounded-tr-xs'
                      : 'bg-white border-zinc-200/80 rounded-tl-xs'
                  }`}
                >
                  {/* Quoted Request Header (If this is a reply tagging a requester) */}
                  {spot.replyToRequestId && (
                    <div className="mb-2 p-2 bg-[#E9F5E9] border-l-4 border-emerald-600 rounded-r-lg text-xs">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                        <CornerDownRight className="w-3 h-3 text-emerald-700" />
                        <span>Replying to request by <strong>{spot.taggedRequesterName || 'Community Member'}</strong></span>
                      </div>
                      <div className="text-[11px] text-zinc-800 font-semibold truncate mt-0.5">
                        Seeking: "{spot.bookName}"
                      </div>
                    </div>
                  )}

                    {/* Sender Header */}
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-black/5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[11px] font-black truncate ${isUserSelf ? 'text-[#075E54]' : getSenderColor(spot.finderName)}`}>
                          {isUserSelf ? 'You' : spot.finderName}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-medium">
                          {spot.finderHandle}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isRequest && (
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-1 ${
                            spot.status === 'Found' || spot.isResolved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-200/80 text-amber-900 animate-pulse'
                          }`}>
                            <HelpCircle className="w-2.5 h-2.5" />
                            {spot.status === 'Found' || spot.isResolved ? 'Sighted / Found' : 'Looking for Book'}
                          </span>
                        )}

                        {isUserSelf && (
                          <div className="flex items-center gap-1 ml-1 border-l border-black/10 pl-1.5">
                            {onArchiveSpot && (
                              <button
                                onClick={() => {
                                  if (confirm(`Archive your post "${spot.bookName}"? It will be hidden from the community feed.`)) {
                                    onArchiveSpot(spot.id, userProfile?.handle);
                                  }
                                }}
                                className="text-amber-700 hover:text-amber-900 p-0.5 hover:bg-amber-200/50 rounded transition-colors cursor-pointer"
                                title="Archive my post"
                              >
                                <Archive className="w-3 h-3" />
                              </button>
                            )}
                            {onDeleteSpot && (
                              <button
                                onClick={() => {
                                  if (confirm(`Permanently delete your post "${spot.bookName}"?`)) {
                                    onDeleteSpot(spot.id, userProfile?.handle);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 p-0.5 hover:bg-red-200/50 rounded transition-colors cursor-pointer"
                                title="Delete my post"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                  {/* CASE 1: LOOKING FOR A BOOK REQUEST */}
                  {isRequest ? (
                    <div className="space-y-2">
                      {/* Main Exact Format Requested: "XX is looking for Harry Potter - order of the pheonix" */}
                      <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-2.5">
                        <div className="text-[10px] font-bold text-amber-900 flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">🔍</span>
                            <span className="uppercase tracking-wider font-black text-[9px]">BOOK INQUIRY</span>
                          </div>
                          {spot.status === 'Found' || spot.isResolved ? (
                            <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              ✓ FOUND
                            </span>
                          ) : (
                            <span className="bg-amber-200/90 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                              SEEKING
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-zinc-900 leading-snug">
                          <span className="text-[#075E54] font-black">{spot.finderName}</span> is looking for{' '}
                          <span className="text-[#EA580C] underline decoration-[#EA580C]/40 underline-offset-2">
                            {spot.bookName}
                          </span>
                        </div>
                        {spot.author && (
                          <p className="text-[11px] text-zinc-700 font-semibold mt-0.5">
                            Author: <span className="font-normal text-zinc-600">{spot.author}</span>
                          </p>
                        )}
                        {spot.preferredLanguage && (
                          <p className="text-[10px] text-zinc-600 font-semibold mt-0.5">
                            Language: <span className="font-bold text-amber-950">{spot.preferredLanguage}</span>
                          </p>
                        )}
                        {spot.notes && (
                          <div className="text-[11px] text-zinc-700 italic bg-white/70 p-1.5 rounded-md mt-1.5 border border-amber-200/60">
                            "{spot.notes}"
                          </div>
                        )}

                        {/* Request Reference Cover Photos */}
                        {spot.images && spot.images.length > 0 && (
                          <div className="mt-2 pt-1 border-t border-amber-200/50">
                            <div className="text-[9px] font-bold text-amber-900 mb-1 flex items-center justify-between">
                              <span>Reference / Cover Photo ({spot.images.length})</span>
                              <span className="text-[8px] text-zinc-400">Tap to inspect</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                              {spot.images.map((imgUrl, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => onViewPhotoLightbox(spot.images, spot.bookName, spot.finderName, idx)}
                                  className="relative aspect-square rounded-md overflow-hidden bg-zinc-200 cursor-pointer hover:opacity-95 transition-opacity border border-amber-200"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`${spot.bookName} ref ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reply Action Button: Direct prompt to reply with found book */}
                      <div className="pt-0.5 flex items-center justify-between gap-2">
                        <span className="text-[9px] text-zinc-500 font-medium">
                          {spot.status === 'Found' || spot.isResolved
                            ? '✓ Sighting has been tagged below'
                            : 'Have you seen this book at BMICH?'}
                        </span>

                        <button
                          onClick={() => handleStartReply(spot)}
                          id={`reply-request-btn-${spot.id}`}
                          className="px-2.5 py-1 bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-[10px] font-black rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Building2 className="w-3 h-3" />
                          <span>I Found This!</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CASE 2: FOUND BOOK SIGHTING */
                    <>
                      {/* Tag Notice if replying to someone */}
                      {spot.taggedRequesterName && (
                        <div className="mb-1 text-[11px] font-black text-[#075E54] flex items-center gap-1">
                          <span>📍</span>
                          <span>
                            Hey <span className="underline">{spot.taggedRequesterHandle || spot.taggedRequesterName}</span>, I found your book!
                          </span>
                        </div>
                      )}

                      {/* 1. Book Name */}
                      <div className="mb-1.5">
                        <div className="text-[9px] font-black uppercase tracking-wider text-[#F37021] flex items-center gap-1">
                          <span>📖 BOOK SIGHTING</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-black text-zinc-900 leading-snug">
                          {spot.bookName}
                        </h4>
                        {spot.author && (
                          <p className="text-[10px] text-zinc-500 font-medium">
                            by {spot.author}
                          </p>
                        )}
                      </div>

                      {/* 2. Stall Location Card */}
                      <div className="bg-[#F8F9FA] rounded-xl p-2 border border-zinc-200/80 mb-2 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 font-black text-[11px] text-zinc-900 truncate">
                            <Building2 className="w-3.5 h-3.5 text-[#F37021] flex-shrink-0" />
                            <span className="truncate">{spot.stallName}</span>
                          </div>
                          <span className="bg-[#075E54] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full flex-shrink-0">
                            {spot.hall} • {spot.stallNumber}
                          </span>
                        </div>

                        {spot.shelfLocationNote && (
                          <div className="text-[10px] text-zinc-700 font-medium flex items-start gap-1 pt-0.5">
                            <MapPin className="w-3 h-3 text-[#F37021] flex-shrink-0 mt-0.5" />
                            <span>{spot.shelfLocationNote}</span>
                          </div>
                        )}

                        {spot.notes && (
                          <div className="text-[10px] text-zinc-700 font-medium flex items-start gap-1.5 pt-1 mt-1 border-t border-zinc-200/60">
                            <Info className="w-3 h-3 text-[#F37021] flex-shrink-0 mt-0.5" />
                            <div className="leading-snug">
                              <span className="font-bold text-zinc-800">Note: </span>
                              <span className="italic text-zinc-600">"{spot.notes}"</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Photos (Max 3 pictures inside stall) */}
                      {spot.images && spot.images.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[9px] font-bold text-zinc-500 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-zinc-700">
                              <ImageIcon className="w-3 h-3 text-[#F37021]" />
                              Shelf Location Photos ({spot.images.length}/3)
                            </span>
                            <span className="text-[8px] text-zinc-400">Tap to inspect</span>
                          </div>

                          <div className={`grid gap-1 rounded-xl overflow-hidden ${
                            spot.images.length === 1
                              ? 'grid-cols-1'
                              : spot.images.length === 2
                              ? 'grid-cols-2'
                              : 'grid-cols-3'
                          }`}>
                            {spot.images.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => onViewPhotoLightbox(spot.images, spot.bookName, spot.stallName, idx)}
                                className="relative aspect-4/3 rounded-lg overflow-hidden bg-zinc-200 cursor-pointer hover:opacity-95 transition-opacity"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`${spot.bookName} shelf photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-black px-1 py-0.2 rounded">
                                  {idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. RATING FEATURE: People who think this post helped them rate the find */}
                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2 my-1.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] font-black text-amber-950">
                            <Award className="w-3 h-3 text-[#F37021]" />
                            <span>Did this find help you?</span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-black text-zinc-700">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{spot.ratingAverage || 5.0}</span>
                            <span className="text-[9px] text-zinc-500 font-normal">
                              ({spot.ratingCount || 1} {spot.ratingCount === 1 ? 'rating' : 'ratings'})
                            </span>
                          </div>
                        </div>

                        {/* Interactive 5-Star Rating Buttons */}
                        <div className="flex items-center justify-between pt-0.5">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((starVal) => {
                              const isSelected = (userRating || 0) >= starVal;
                              return (
                                <button
                                  key={starVal}
                                  type="button"
                                  onClick={() => handleRateFind(spot.id, starVal)}
                                  className="p-1 hover:scale-125 transition-transform cursor-pointer"
                                  title={`Rate ${starVal} star${starVal > 1 ? 's' : ''}`}
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 ${
                                      isSelected
                                        ? 'fill-amber-400 text-amber-500'
                                        : 'text-zinc-300 hover:text-amber-400'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>

                          {userRating ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full">
                              You rated {userRating}★ • Thanks!
                            </span>
                          ) : (
                            <span className="text-[8px] text-zinc-500 font-medium">
                              Tap stars to rate
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Bubble Bottom: Status pill, reactions & timestamp */}
                  <div className="pt-1 flex items-center justify-between gap-2 text-xs">


                    {/* WhatsApp style Reactions & Time */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => onUpvoteSpot(spot.id)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          spot.hasUserUpvoted
                            ? 'bg-orange-100 text-[#EA580C]'
                            : 'hover:bg-black/5 text-zinc-500'
                        }`}
                        title="Helpful find"
                      >
                        <Heart className={`w-3 h-3 ${spot.hasUserUpvoted ? 'fill-current text-rose-500' : ''}`} />
                        <span>{spot.helpfulCount}</span>
                      </button>

                      <span className="text-[9px] text-zinc-400 font-medium">
                        {formatChatTime(spot.timestamp)}
                      </span>
                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
