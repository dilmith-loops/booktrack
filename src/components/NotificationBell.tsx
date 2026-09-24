import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  X,
  MessageSquareQuote,
  AtSign,
  CheckCheck,
  User,
  ArrowRight,
  BookOpen,
  MapPin,
  Megaphone,
  Sparkles
} from 'lucide-react';
import { AppNotification, UserProfile } from '../types';

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotification: (spotId?: string) => void;
  onOpenProfile: () => void;
  userProfile: UserProfile | null;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
  onOpenProfile,
  userProfile
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'reply' | 'mention' | 'updates'>('all');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'reply') return n.type === 'reply' || n.type === 'match';
    if (filter === 'mention') return n.type === 'mention';
    if (filter === 'updates') return n.type === 'announcement' || n.type === 'system';
    return true;
  });

  const replyCount = notifications.filter(n => n.type === 'reply' || n.type === 'match').length;
  const mentionCount = notifications.filter(n => n.type === 'mention').length;
  const updatesCount = notifications.filter(n => n.type === 'announcement' || n.type === 'system').length;

  const handleItemClick = (n: AppNotification) => {
    onMarkAsRead(n.id);
    setIsOpen(false);
    onSelectNotification(n.spotId);
  };

  const renderDropdown = () => {
    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-start justify-center sm:justify-end p-2 sm:p-4 pt-16 sm:pt-20">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        />

        {/* Modal Card */}
        <div
          ref={modalRef}
          className="relative z-10 w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200/90 overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-orange-50 via-white to-amber-50/40 border-b border-zinc-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F37021] to-[#EA580C] text-white flex items-center justify-center shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-zinc-900 leading-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-[#EA580C] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Fair alerts, replies & book spottings</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  id="mark-all-notifications-read-btn"
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-800 bg-orange-100/70 hover:bg-orange-100 px-2 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                id="close-notifications-btn"
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter('all')}
              id="notif-filter-all"
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-200/80 border border-zinc-200/60'
              }`}
            >
              <span>All</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setFilter('reply')}
              id="notif-filter-reply"
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'reply'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-200/80 border border-zinc-200/60'
              }`}
            >
              <MessageSquareQuote className="w-3 h-3 text-orange-400" />
              <span>Replies & Spottings</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === 'reply' ? 'bg-orange-700 text-white' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {replyCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('mention')}
              id="notif-filter-mention"
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'mention'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-200/80 border border-zinc-200/60'
              }`}
            >
              <AtSign className="w-3 h-3 text-blue-400" />
              <span>Mentions</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === 'mention' ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {mentionCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('updates')}
              id="notif-filter-updates"
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'updates'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-200/80 border border-zinc-200/60'
              }`}
            >
              <Megaphone className="w-3 h-3 text-purple-400" />
              <span>Announcements</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === 'updates' ? 'bg-purple-900 text-white' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {updatesCount}
              </span>
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100/90 p-2 sm:p-3 space-y-2">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F37021] flex items-center justify-center mx-auto shadow-xs">
                  <Bell className="w-6 h-6 opacity-60" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-zinc-800">
                    {filter === 'all'
                      ? 'No notifications yet'
                      : filter === 'reply'
                      ? 'No replies or book matches yet'
                      : filter === 'mention'
                      ? 'No mentions yet'
                      : 'No announcements yet'}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                    {userProfile
                      ? `When fellow fair visitors reply to your book requests or tag ${userProfile.handle || '@' + userProfile.name} in chat, they will show up here.`
                      : 'Set up your profile to get notified when others spot your requested books or tag you.'}
                  </p>
                </div>

                {!userProfile && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenProfile();
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#F37021] hover:bg-[#EA580C] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Set Up Profile</span>
                  </button>
                )}
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const isReply = n.type === 'reply';
                const isMatch = n.type === 'match';
                const isMention = n.type === 'mention';
                const isAnnouncement = n.type === 'announcement';
                const isSystem = n.type === 'system';

                let iconNode = <Bell className="w-4 h-4" />;
                let iconBg = 'bg-gradient-to-tr from-[#EA580C] to-[#F37021]';
                let tagLabel = 'Update';
                let tagClass = 'bg-zinc-100 text-zinc-800';

                if (isReply) {
                  iconNode = <MessageSquareQuote className="w-4 h-4" />;
                  iconBg = 'bg-gradient-to-tr from-[#EA580C] to-[#F37021]';
                  tagLabel = 'Reply';
                  tagClass = 'bg-orange-100 text-orange-800';
                } else if (isMatch) {
                  iconNode = <BookOpen className="w-4 h-4" />;
                  iconBg = 'bg-gradient-to-tr from-emerald-600 to-teal-600';
                  tagLabel = 'Book Spotted';
                  tagClass = 'bg-emerald-100 text-emerald-800';
                } else if (isMention) {
                  iconNode = <AtSign className="w-4 h-4" />;
                  iconBg = 'bg-gradient-to-tr from-blue-600 to-indigo-600';
                  tagLabel = 'Mention';
                  tagClass = 'bg-blue-100 text-blue-800';
                } else if (isAnnouncement) {
                  iconNode = <Megaphone className="w-4 h-4" />;
                  iconBg = 'bg-gradient-to-tr from-purple-600 to-amber-600';
                  tagLabel = 'Fair Alert';
                  tagClass = 'bg-purple-100 text-purple-900';
                } else if (isSystem) {
                  iconNode = <Sparkles className="w-4 h-4" />;
                  iconBg = 'bg-gradient-to-tr from-amber-500 to-orange-500';
                  tagLabel = 'Official';
                  tagClass = 'bg-amber-100 text-amber-900';
                }

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    id={`notif-item-${n.id}`}
                    className={`p-3 rounded-2xl transition-all cursor-pointer border ${
                      n.isRead
                        ? 'bg-white hover:bg-zinc-50/80 border-transparent'
                        : 'bg-orange-50/50 hover:bg-orange-50 border-orange-200/60 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-xs ${iconBg}`}
                      >
                        {iconNode}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${tagClass}`}
                            >
                              {tagLabel}
                            </span>
                            <span className="text-xs font-bold text-zinc-900 truncate">
                              {n.senderName}
                            </span>
                            {n.senderHandle && (
                              <span className="text-[10px] text-zinc-400">
                                {n.senderHandle}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {n.timeAgo}
                            </span>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#EA580C] flex-shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Title header */}
                        <div className="mt-0.5 text-xs font-black text-zinc-800">
                          {n.title}
                        </div>

                        {/* Book reference tag */}
                        {n.bookName && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-800 bg-white/90 px-2 py-0.5 rounded-lg border border-zinc-200/70 inline-flex max-w-full">
                            <BookOpen className="w-3 h-3 text-[#F37021] flex-shrink-0" />
                            <span className="truncate">{n.bookName}</span>
                          </div>
                        )}

                        {/* Location badge if available */}
                        {n.stallName && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-600">
                            <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">
                              {n.stallName} {n.hall ? `(${n.hall})` : ''}
                            </span>
                          </div>
                        )}

                        {/* Message Preview */}
                        <p className="mt-1 text-xs text-zinc-600 line-clamp-2 leading-relaxed bg-zinc-50/80 p-1.5 rounded-lg border border-zinc-100">
                          {n.message}
                        </p>

                        {/* Bottom action hint */}
                        {n.spotId && (
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-orange-600 font-bold">
                            <span className="inline-flex items-center gap-1 hover:underline">
                              View spot in Chat Feed
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Helpful footer hint */}
          <div className="px-3.5 py-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="truncate">Tag fellow readers using @handle in chat</span>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="header-notification-bell-btn"
        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs border ${
          unreadCount > 0
            ? 'bg-orange-50 hover:bg-orange-100 text-[#EA580C] border-orange-200'
            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border-zinc-200/80'
        }`}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-75">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {renderDropdown()}
    </>
  );
};
