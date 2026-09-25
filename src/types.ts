export interface Stall {
  id: string;
  name: string;
  hall: string;
  stallNumber: string;
  specialDiscount?: string;
  category: string;
  isHidden?: boolean;
}

export interface BookSpotting {
  id: string;
  postType?: 'spot' | 'request'; // 'spot' (default) = book found at stall; 'request' = user looking for a book
  bookName: string;
  author?: string;
  preferredLanguage?: string;
  stallId: string;
  stallName: string;
  hall: string;
  stallNumber: string;
  images: string[]; // max 3 pictures of where the book was found
  finderName: string;
  finderHandle: string;
  timestamp: number;
  timeAgo?: string;
  priceOrOffer?: string;
  shelfLocationNote?: string;
  notes?: string; // extra details for request or spot
  status: 'In Stock' | 'Few Copies Left' | 'Sold Out' | 'Looking for Book' | 'Found';
  helpfulCount: number;
  hasUserUpvoted?: boolean;
  aiVerified: boolean;
  sampathCardDiscount?: string;

  // Tagging / Reply to Request
  replyToRequestId?: string; // ID of the request this find is replying to
  taggedRequesterName?: string; // e.g. "Kavindu"
  taggedRequesterHandle?: string; // e.g. "@kavindu_s"
  isResolved?: boolean; // if a request has been answered
  resolvedBySpotId?: string;

  // Rating for how helpful the find was (1 - 5 stars)
  ratingAverage?: number;
  ratingCount?: number;
  userRating?: number; // rating submitted by current user (1 to 5)
  // Moderation & Admin Flags
  isPinned?: boolean;
  isFlagged?: boolean;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export interface ModerationResult {
  isClean: boolean;
  rejectionReason?: string;
  detectedCategories?: string[];
  sanitizedBookName?: string;
}

export interface BookMatch {
  bookName: string;
  sightingsCount: number;
  stalls: {
    stallName: string;
    hall: string;
    stallNumber: string;
    priceOrOffer?: string;
    images: string[];
    timeAgo?: string;
    status: string;
  }[];
}

export type PwaTab = 'chat' | 'radar' | 'stalls' | 'perks';

export interface UserProfile {
  id?: number | string;
  name: string;
  phone: string;
  email: string;
  handle: string;
  isSampathCardholder: boolean;
  registeredAt: number;
  isAdmin?: boolean;
  ipAddress?: string;
  isDisabled?: boolean;
}

export interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'discount' | 'urgent';
  createdAt: number;
  isActive: boolean;
  publishedBy?: string;
  title?: string;
  timestamp?: number;
}

export interface AppNotification {
  id: string;
  type: 'reply' | 'mention' | 'announcement' | 'system' | 'match';
  title: string;
  message: string;
  bookName?: string;
  senderName: string;
  senderHandle?: string;
  spotId?: string;
  targetRequestId?: string;
  timestamp: number;
  timeAgo?: string;
  stallName?: string;
  hall?: string;
  isRead?: boolean;
}

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  updatedAt?: string;
}


