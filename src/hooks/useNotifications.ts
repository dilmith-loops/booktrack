import { useState, useEffect, useMemo, useCallback } from 'react';
import { BookSpotting, UserProfile, AppNotification } from '../types';

export function formatNotificationTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useNotifications(spots: BookSpotting[], userProfile: UserProfile | null) {
  // Set of read notification IDs persisted in localStorage
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sampath_read_notifications');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Simulated notifications for demo & testing
  const [simulatedNotifications, setSimulatedNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('sampath_simulated_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist read IDs
  const persistReadIds = (newSet: Set<string>) => {
    try {
      localStorage.setItem('sampath_read_notifications', JSON.stringify(Array.from(newSet)));
    } catch {}
  };

  // Derive notifications from actual spots and user profile
  const realNotifications = useMemo(() => {
    const list: AppNotification[] = [];

    // Track user's own spots from localStorage or matching profile
    let mySpotIds = new Set<string>();
    try {
      const savedMySpots = localStorage.getItem('sampath_my_posted_spots');
      if (savedMySpots) {
        const arr = JSON.parse(savedMySpots);
        if (Array.isArray(arr)) {
          arr.forEach(id => mySpotIds.add(id));
        }
      }
    } catch {}

    const userName = userProfile?.name?.trim() || '';
    const userHandle = userProfile?.handle?.trim() || '';
    const cleanUserHandle = userHandle.replace(/^@/, '').toLowerCase();
    const userFirstName = userName.split(' ')[0]?.toLowerCase() || '';

    // Collect all posts authored by current user
    spots.forEach(s => {
      const isMine =
        mySpotIds.has(s.id) ||
        (userName && s.finderName.toLowerCase() === userName.toLowerCase()) ||
        (cleanUserHandle && s.finderHandle?.toLowerCase().replace(/^@/, '') === cleanUserHandle);
      if (isMine) {
        mySpotIds.add(s.id);
      }
    });

    // Scan spots for replies and mentions
    spots.forEach(spot => {
      // Don't notify user about their own actions
      const isAuthor =
        mySpotIds.has(spot.id) ||
        (userName && spot.finderName.toLowerCase() === userName.toLowerCase()) ||
        (cleanUserHandle && spot.finderHandle?.toLowerCase().replace(/^@/, '') === cleanUserHandle);

      if (isAuthor) return;

      // 1. Check for Reply
      const isReplyToMySpot = spot.replyToRequestId && mySpotIds.has(spot.replyToRequestId);
      const isReplyToMyHandle =
        cleanUserHandle &&
        spot.taggedRequesterHandle &&
        spot.taggedRequesterHandle.toLowerCase().replace(/^@/, '') === cleanUserHandle;
      const isReplyToMyName =
        userName &&
        spot.taggedRequesterName &&
        spot.taggedRequesterName.toLowerCase() === userName.toLowerCase();

      if (isReplyToMySpot || isReplyToMyHandle || isReplyToMyName) {
        const targetReq = spots.find(s => s.id === spot.replyToRequestId);
        const requestedBookName = targetReq?.bookName || spot.bookName;

        list.push({
          id: `notif-reply-${spot.id}`,
          type: 'reply',
          title: `${spot.finderName} replied to your request`,
          message:
            spot.shelfLocationNote ||
            spot.notes ||
            `Found "${spot.bookName}" at ${spot.stallName} (${spot.hall})`,
          bookName: requestedBookName,
          senderName: spot.finderName,
          senderHandle: spot.finderHandle,
          spotId: spot.id,
          targetRequestId: spot.replyToRequestId,
          timestamp: spot.timestamp,
          timeAgo: formatNotificationTime(spot.timestamp),
          stallName: spot.stallName,
          hall: spot.hall
        });
        return; // Don't double count as mention
      }

      // 2. Check for Mention in chat notes or shelf location
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
          title: `${spot.finderName} mentioned you in chat`,
          message: spot.notes || spot.shelfLocationNote || `Mentioned you regarding "${spot.bookName}"`,
          bookName: spot.bookName,
          senderName: spot.finderName,
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
  }, [spots, userProfile]);

  // Combine real notifications and simulated notifications
  const allNotifications = useMemo(() => {
    const combined = [...simulatedNotifications, ...realNotifications];
    // Deduplicate by ID
    const seen = new Set<string>();
    const unique: AppNotification[] = [];
    for (const item of combined) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push({
          ...item,
          timeAgo: formatNotificationTime(item.timestamp),
          isRead: readIds.has(item.id)
        });
      }
    }
    // Sort descending by timestamp
    return unique.sort((a, b) => b.timestamp - a.timestamp);
  }, [realNotifications, simulatedNotifications, readIds]);

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

  // Simulate a reply or mention for quick demo & testing
  const simulateNotification = useCallback(
    (type: 'reply' | 'mention') => {
      const senderNames = ['Tanya Perera', 'Sachintha De Silva', 'Nipuni Perera', 'Kasun Bandara'];
      const senderHandles = ['@tanya_pages', '@sachin_reads', '@nipuni_reads', '@kasun_b'];
      const sampleStalls = [
        { name: 'Vijitha Yapa Bookshop', hall: 'Hall A' },
        { name: 'Sarasavi Bookshop', hall: 'Hall B' },
        { name: 'Expographic Books', hall: 'Hall C' }
      ];

      const idx = Math.floor(Math.random() * senderNames.length);
      const stall = sampleStalls[idx % sampleStalls.length];
      const now = Date.now();
      const userHandle = userProfile?.handle || '@you';
      const userName = userProfile?.name || 'Fellow Reader';

      const newNotif: AppNotification =
        type === 'reply'
          ? {
              id: `sim-reply-${now}`,
              type: 'reply',
              title: `${senderNames[idx]} replied to your book request`,
              message: `Spotted copies on the front rack! Marked with special fair discount at ${stall.name} (${stall.hall}).`,
              bookName: 'Madol Doova (English Translation)',
              senderName: senderNames[idx],
              senderHandle: senderHandles[idx],
              spotId: 'req-2',
              targetRequestId: 'req-2',
              timestamp: now,
              stallName: stall.name,
              hall: stall.hall,
              isRead: false
            }
          : {
              id: `sim-mention-${now}`,
              type: 'mention',
              title: `${senderNames[idx]} mentioned you in chat`,
              message: `Hey ${userHandle}, they just restocked the fiction section at ${stall.name}! Check it out before it sells out.`,
              bookName: 'Harry Potter and the Order of the Phoenix',
              senderName: senderNames[idx],
              senderHandle: senderHandles[idx],
              spotId: 'spot-hp-reply',
              timestamp: now,
              stallName: stall.name,
              hall: stall.hall,
              isRead: false
            };

      setSimulatedNotifications(prev => {
        const next = [newNotif, ...prev];
        try {
          localStorage.setItem('sampath_simulated_notifications', JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [userProfile]
  );

  const clearSimulatedNotifications = useCallback(() => {
    setSimulatedNotifications([]);
    try {
      localStorage.removeItem('sampath_simulated_notifications');
    } catch {}
  }, []);

  return {
    notifications: allNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    simulateNotification,
    clearSimulatedNotifications
  };
}
