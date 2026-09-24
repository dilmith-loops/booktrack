import { useState, useEffect, useMemo, useCallback } from 'react';
import { BookSpotting, UserProfile, AppNotification, Announcement } from '../types';

export function formatNotificationTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 0) return 'Just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useNotifications(
  spots: BookSpotting[],
  userProfile: UserProfile | null,
  announcements: Announcement[] = []
) {
  // Set of read notification IDs persisted in localStorage
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sampath_read_notifications');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Persist read IDs
  const persistReadIds = (newSet: Set<string>) => {
    try {
      localStorage.setItem('sampath_read_notifications', JSON.stringify(Array.from(newSet)));
    } catch {}
  };

  // Derive notifications from spots, announcements, and user profile
  const realNotifications = useMemo(() => {
    const list: AppNotification[] = [];

    // Track user's own spots from localStorage or matching profile
    const mySpotIds = new Set<string>();
    const myRequestedBookNames = new Set<string>();

    try {
      const savedMySpots = localStorage.getItem('sampath_my_posted_spots');
      if (savedMySpots) {
        const arr = JSON.parse(savedMySpots);
        if (Array.isArray(arr)) {
          arr.forEach(id => mySpotIds.add(id));
        }
      }
    } catch {}

    const userName = (userProfile?.name || '').trim();
    const userHandle = (userProfile?.handle || '').trim();
    const cleanUserHandle = userHandle.replace(/^@/, '').toLowerCase();
    const userFirstName = userName.split(' ')[0]?.toLowerCase() || '';

    // Collect all posts authored by current user & user's requested book titles
    spots.forEach(s => {
      const sFinderName = (s.finderName || '').toLowerCase();
      const sFinderHandle = (s.finderHandle || '').replace(/^@/, '').toLowerCase();

      const isMine =
        mySpotIds.has(s.id) ||
        (userName !== '' && sFinderName === userName.toLowerCase()) ||
        (cleanUserHandle !== '' && sFinderHandle === cleanUserHandle);

      if (isMine) {
        mySpotIds.add(s.id);
        if (s.postType === 'request' && s.bookName) {
          myRequestedBookNames.add(s.bookName.trim().toLowerCase());
        }
      }
    });

    // 1. Official Welcome & Fair Guide Notification (Always active for registered users)
    if (userProfile) {
      list.push({
        id: 'notif-system-welcome',
        type: 'system',
        title: 'Welcome to Sampath Book Finder! 📚',
        message: 'Locate 150+ stalls at BMICH, find book discounts with Sampath Cards, and ask fellow fair visitors for any book you need.',
        bookName: 'BMICH Fair Guide 2026',
        senderName: 'Sampath Bank',
        senderHandle: '@sampath_official',
        timestamp: 1727200000000, // Opening day timestamp
        timeAgo: 'Fair Guide'
      });
    }

    // 2. Broadcast Announcements from Fair Organizers / Admin
    if (Array.isArray(announcements)) {
      announcements.forEach(ann => {
        if (!ann.isActive && !ann.message) return;
        list.push({
          id: `notif-ann-${ann.id}`,
          type: 'announcement',
          title: `📢 Fair Announcement: ${ann.title || 'Official Broadcast'}`,
          message: ann.message,
          senderName: 'BMICH Organizing Committee',
          senderHandle: '@cibf_official',
          timestamp: ann.timestamp || Date.now(),
          timeAgo: formatNotificationTime(ann.timestamp || Date.now())
        });
      });
    }

    // 3. Scan spots for direct replies, book matches, and mentions
    spots.forEach(spot => {
      const spotFinderName = (spot.finderName || '').toLowerCase();
      const spotFinderHandle = (spot.finderHandle || '').replace(/^@/, '').toLowerCase();

      // Don't notify user about their own actions
      const isAuthor =
        mySpotIds.has(spot.id) ||
        (userName !== '' && spotFinderName === userName.toLowerCase()) ||
        (cleanUserHandle !== '' && spotFinderHandle === cleanUserHandle);

      if (isAuthor) return;

      const spotBookLower = (spot.bookName || '').trim().toLowerCase();

      // Case A: Explicit Reply to a Request
      const isReplyToMySpot = Boolean(spot.replyToRequestId && mySpotIds.has(spot.replyToRequestId));
      const isReplyToMyHandle = Boolean(
        cleanUserHandle &&
        spot.taggedRequesterHandle &&
        spot.taggedRequesterHandle.replace(/^@/, '').toLowerCase() === cleanUserHandle
      );
      const isReplyToMyName = Boolean(
        userName &&
        spot.taggedRequesterName &&
        spot.taggedRequesterName.toLowerCase() === userName.toLowerCase()
      );

      if (isReplyToMySpot || isReplyToMyHandle || isReplyToMyName) {
        const targetReq = spots.find(s => s.id === spot.replyToRequestId);
        const requestedBookName = targetReq?.bookName || spot.bookName;

        list.push({
          id: `notif-reply-${spot.id}`,
          type: 'reply',
          title: `${spot.finderName || 'A reader'} replied to your book request`,
          message:
            spot.shelfLocationNote ||
            spot.notes ||
            `Found "${spot.bookName}" at ${spot.stallName} (${spot.hall})`,
          bookName: requestedBookName,
          senderName: spot.finderName || 'Fair Reader',
          senderHandle: spot.finderHandle,
          spotId: spot.id,
          targetRequestId: spot.replyToRequestId,
          timestamp: spot.timestamp,
          timeAgo: formatNotificationTime(spot.timestamp),
          stallName: spot.stallName,
          hall: spot.hall
        });
        return; // Handled as reply, skip mention/match
      }

      // Case B: Sighting Alert matching a book the user requested
      if (spot.postType !== 'request' && spotBookLower && myRequestedBookNames.has(spotBookLower)) {
        list.push({
          id: `notif-match-${spot.id}`,
          type: 'match',
          title: `Sighting Alert: "${spot.bookName}"`,
          message: `Spotted at ${spot.stallName} (${spot.hall} • ${spot.stallNumber}). Check shelf location in chat feed!`,
          bookName: spot.bookName,
          senderName: spot.finderName || 'Fair Spotter',
          senderHandle: spot.finderHandle,
          spotId: spot.id,
          timestamp: spot.timestamp,
          timeAgo: formatNotificationTime(spot.timestamp),
          stallName: spot.stallName,
          hall: spot.hall
        });
        return;
      }

      // Case C: Check for Mention in chat notes or shelf location
      const textToSearch = `${spot.notes || ''} ${spot.shelfLocationNote || ''} ${spot.bookName || ''}`;
      let hasMention = false;

      if (cleanUserHandle && cleanUserHandle.length >= 2) {
        const handleRegex = new RegExp(`@${cleanUserHandle}\\b`, 'i');
        if (handleRegex.test(textToSearch)) {
          hasMention = true;
        }
      }

      if (!hasMention && userFirstName && userFirstName.length >= 3) {
        const nameRegex = new RegExp(`@${userFirstName}\\b`, 'i');
        if (nameRegex.test(textToSearch)) {
          hasMention = true;
        }
      }

      if (hasMention) {
        list.push({
          id: `notif-mention-${spot.id}`,
          type: 'mention',
          title: `${spot.finderName || 'Someone'} tagged you in chat`,
          message: spot.notes || spot.shelfLocationNote || `Mentioned you regarding "${spot.bookName}"`,
          bookName: spot.bookName,
          senderName: spot.finderName || 'Fair Visitor',
          senderHandle: spot.finderHandle,
          spotId: spot.id,
          timestamp: spot.timestamp,
          timeAgo: formatNotificationTime(spot.timestamp),
          stallName: spot.stallName,
          hall: spot.hall
        });
      }
    });

    return list;
  }, [spots, userProfile, announcements]);

  // Deduplicate and sort notifications
  const allNotifications = useMemo(() => {
    const seen = new Set<string>();
    const unique: AppNotification[] = [];
    for (const item of realNotifications) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push({
          ...item,
          timeAgo: item.timeAgo || formatNotificationTime(item.timestamp),
          isRead: readIds.has(item.id)
        });
      }
    }
    return unique.sort((a, b) => b.timestamp - a.timestamp);
  }, [realNotifications, readIds]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter(n => !n.isRead).length;
  }, [allNotifications]);

  const markAsRead = useCallback((notificationId: string) => {
    setReadIds(prev => {
      const next = new Set<string>(prev);
      next.add(notificationId);
      persistReadIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set<string>(prev);
      allNotifications.forEach(n => next.add(n.id));
      persistReadIds(next);
      return next;
    });
  }, [allNotifications]);

  return {
    notifications: allNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}
