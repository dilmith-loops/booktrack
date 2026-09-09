import { Stall, BookSpotting } from '../types';

export const BMICH_STALLS: Stall[] = [
  {
    id: 'sarasavi-a',
    name: 'Sarasavi Bookshop',
    hall: 'Hall A',
    stallNumber: 'A12 - A18',
    specialDiscount: '20% off with Sampath Credit Cards',
    category: 'General & International Fiction, Translations'
  },
  {
    id: 'gunasena-b',
    name: 'M.D. Gunasena',
    hall: 'Hall B',
    stallNumber: 'B01 - B10',
    specialDiscount: '15% off with Sampath Debit Cards',
    category: 'Children, Sinhala Classics, Educational'
  },
  {
    id: 'vijitha-yapa-a',
    name: 'Vijitha Yapa Bookshop',
    hall: 'Hall A',
    stallNumber: 'A01 - A06',
    specialDiscount: 'Up to 25% on selected imports',
    category: 'Best-sellers, Non-fiction, History'
  },
  {
    id: 'expographic-c',
    name: 'Expographic Books',
    hall: 'Hall C',
    stallNumber: 'C15 - C20',
    specialDiscount: 'Sampath 20% off on Academic & Self-help',
    category: 'Academic, Self Development, Sci-Fi'
  },
  {
    id: 'grantha-s',
    name: 'Grantha.lk',
    hall: 'Sirimavo Hall',
    stallNumber: 'S05 - S08',
    specialDiscount: 'Buy 2 Get 1 Free offers',
    category: 'Sinhala Contemporary, Translations, Graphic Novels'
  },
  {
    id: 'lakehouse-b',
    name: 'Lake House Bookshop',
    hall: 'Hall B',
    stallNumber: 'B14 - B18',
    specialDiscount: '15% instant discount on all titles',
    category: 'Sri Lankan Heritage, Dictionaries, Literature'
  },
  {
    id: 'godage-d',
    name: 'Godage International',
    hall: 'Hall D',
    stallNumber: 'D01 - D08',
    specialDiscount: 'Special fair discounts + Sampath cashback',
    category: 'Sinhala Literature, Drama, Poetry, History'
  },
  {
    id: 'samayawardhana-c',
    name: 'Samayawardhana Publishers',
    hall: 'Hall C',
    stallNumber: 'C04 - C08',
    specialDiscount: 'Special school discounts',
    category: 'Novels, Translations, Religious books'
  },
  {
    id: 'makeen-a',
    name: 'Makeen Books',
    hall: 'Hall A',
    stallNumber: 'A22 - A26',
    specialDiscount: '15% off on Young Adult & Manga',
    category: 'Manga, Young Adult, Fantasy, Imports'
  },
  {
    id: 'dayawansa-d',
    name: 'Dayawansa Jayakody & Co',
    hall: 'Hall D',
    stallNumber: 'D12 - D15',
    specialDiscount: '10% flat discount on all publications',
    category: 'Sinhala Fiction, Cultural studies'
  },
  {
    id: 'sadeepa-b',
    name: 'Sadeepa Bookshop',
    hall: 'Hall B',
    stallNumber: 'B22 - B25',
    specialDiscount: 'Sampath 15% instant voucher',
    category: 'Stationery, Academic & General'
  },
  {
    id: 'jumpbooks-c',
    name: 'Jumpbooks.lk',
    hall: 'Hall C',
    stallNumber: 'C30 - C32',
    specialDiscount: 'Special discount bundles for Gen Z & youth',
    category: 'Thrillers, Romance, English Paperbacks'
  },
  {
    id: 'jeya-a',
    name: 'Jeya Book Centre',
    hall: 'Hall A',
    stallNumber: 'A30 - A34',
    specialDiscount: 'Sampath cardholders 20% discount',
    category: 'Medical, Engineering, International paperbacks'
  },
  {
    id: 'masterguide-e',
    name: 'Masterguide Publications',
    hall: 'Hall E',
    stallNumber: 'E10 - E14',
    specialDiscount: 'Examination guides special price',
    category: 'O/L & A/L Exam Guides, Past Papers'
  },
  {
    id: 'buddhist-cultural-e',
    name: 'Buddhist Cultural Centre',
    hall: 'Hall E',
    stallNumber: 'E01 - E04',
    specialDiscount: '15% off on Dhamma publications',
    category: 'Philosophy, Buddhism, Meditation'
  }
];

// Sample initial sightings and book requests with realistic book fair data
export const INITIAL_SPOTTINGS: BookSpotting[] = [
  {
    id: 'req-2',
    postType: 'request',
    bookName: 'Madol Doova (English Translation)',
    author: 'Martin Wickramasinghe',
    stallId: 'seeking',
    stallName: 'BMICH Fairgrounds',
    hall: 'Seeking in All Halls',
    stallNumber: 'Not located yet',
    images: [],
    finderName: 'Nipuni Perera',
    finderHandle: '@nipuni_reads',
    timestamp: Date.now() - 5 * 60 * 1000,
    notes: 'Looking for the English translation for a foreign friend visiting BMICH! Has anyone seen it?',
    status: 'Looking for Book',
    helpfulCount: 3,
    aiVerified: true,
    isResolved: false
  },
  {
    id: 'spot-hp-reply',
    postType: 'spot',
    bookName: 'Harry Potter and the Order of the Phoenix',
    author: 'J.K. Rowling',
    stallId: 'vijitha-yapa-a',
    stallName: 'Vijitha Yapa Bookshop',
    hall: 'Hall A',
    stallNumber: 'A18 - A24',
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
    ],
    finderName: 'Tanya Perera',
    finderHandle: '@tanya_pages',
    timestamp: Date.now() - 10 * 60 * 1000,
    replyToRequestId: 'req-1',
    taggedRequesterName: 'Kavindu Senanayake',
    taggedRequesterHandle: '@kavindu_s',
    priceOrOffer: 'Rs. 3,200 (15% off with Sampath Card)',
    shelfLocationNote: 'Found on Aisle 3 fiction shelf! 4 copies left near cashier counter.',
    status: 'Few Copies Left',
    helpfulCount: 28,
    ratingAverage: 4.9,
    ratingCount: 24,
    aiVerified: true,
    sampathCardDiscount: '15% instant discount with Sampath Card'
  },
  {
    id: 'req-1',
    postType: 'request',
    bookName: 'Harry Potter - Order of the Phoenix',
    author: 'J.K. Rowling',
    stallId: 'seeking',
    stallName: 'BMICH Fairgrounds',
    hall: 'Hall A',
    stallNumber: 'Found by @tanya_pages',
    images: [],
    finderName: 'Kavindu Senanayake',
    finderHandle: '@kavindu_s',
    timestamp: Date.now() - 18 * 60 * 1000,
    notes: 'Looking for Bloomsbury paperback edition with the blue cover.',
    status: 'Found',
    helpfulCount: 8,
    aiVerified: true,
    isResolved: true,
    resolvedBySpotId: 'spot-hp-reply'
  },
  {
    id: 'spot-1',
    postType: 'spot',
    bookName: 'Atomic Habits by James Clear',
    author: 'James Clear',
    stallId: 'expographic-c',
    stallName: 'Expographic Books',
    hall: 'Hall C',
    stallNumber: 'C15 - C20',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80'
    ],
    finderName: 'Nethmi & Dilshan',
    finderHandle: '@bookspotted_lk',
    timestamp: Date.now() - 25 * 60 * 1000,
    priceOrOffer: 'Rs. 2,400 (Rs. 1,920 with Sampath Card)',
    shelfLocationNote: 'Front counter display on shelf 2, next to psychology aisle. Stacks available!',
    status: 'In Stock',
    helpfulCount: 38,
    ratingAverage: 4.8,
    ratingCount: 31,
    aiVerified: true,
    sampathCardDiscount: '20% off with Sampath Card'
  },
  {
    id: 'spot-2',
    postType: 'spot',
    bookName: 'Madol Doova (මඩොල් දූව) by Martin Wickramasinghe',
    author: 'Martin Wickramasinghe',
    stallId: 'gunasena-b',
    stallName: 'M.D. Gunasena',
    hall: 'Hall B',
    stallNumber: 'B01 - B10',
    images: [
      'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'
    ],
    finderName: 'Kasun Bandara',
    finderHandle: '@kasun_reads',
    timestamp: Date.now() - 40 * 60 * 1000,
    priceOrOffer: 'Rs. 650 hardcover edition',
    shelfLocationNote: 'Right side entrance, Sri Lankan classics wooden shelf row 3.',
    status: 'In Stock',
    helpfulCount: 24,
    ratingAverage: 5.0,
    ratingCount: 19,
    aiVerified: true,
    sampathCardDiscount: '15% instant debit card discount'
  },
  {
    id: 'spot-3',
    bookName: 'The Midnight Library by Matt Haig',
    author: 'Matt Haig',
    stallId: 'vijitha-yapa-a',
    stallName: 'Vijitha Yapa Bookshop',
    hall: 'Hall A',
    stallNumber: 'A01 - A06',
    images: [
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507842229451-9f232615e324?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80'
    ],
    finderName: 'Tanya Perera',
    finderHandle: '@tanya_pages',
    timestamp: Date.now() - 50 * 60 * 1000,
    priceOrOffer: 'Rs. 2,150 (Special festival price)',
    shelfLocationNote: 'Middle table bento showcase under International Fiction banner.',
    status: 'Few Copies Left',
    helpfulCount: 19,
    aiVerified: true,
    sampathCardDiscount: 'Up to 25% off on selected titles'
  },
  {
    id: 'spot-4',
    bookName: 'Gamperaliya (ගම්පෙරළිය) by Martin Wickramasinghe',
    author: 'Martin Wickramasinghe',
    stallId: 'godage-d',
    stallName: 'Godage International',
    hall: 'Hall D',
    stallNumber: 'D01 - D08',
    images: [
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=800&q=80'
    ],
    finderName: 'Akeel Mohamed',
    finderHandle: '@akeel_lit',
    timestamp: Date.now() - 95 * 60 * 1000,
    priceOrOffer: 'Rs. 850 with commemorative bookmark',
    shelfLocationNote: 'Hall D center aisle, shelf D4 marked "Sahithya Sooriyo".',
    status: 'In Stock',
    helpfulCount: 15,
    aiVerified: true,
    sampathCardDiscount: 'Sampath Bank reward points eligible'
  },
  {
    id: 'spot-5',
    bookName: 'Atomic Habits by James Clear',
    author: 'James Clear',
    stallId: 'sarasavi-a',
    stallName: 'Sarasavi Bookshop',
    hall: 'Hall A',
    stallNumber: 'A12 - A18',
    images: [
      'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80'
    ],
    finderName: 'Dinithi Senanayake',
    finderHandle: '@dini_reads',
    timestamp: Date.now() - 140 * 60 * 1000,
    priceOrOffer: 'Rs. 2,350 (20% off with Sampath Card)',
    shelfLocationNote: 'Section A14 right next to the new arrivals revolving tower.',
    status: 'In Stock',
    helpfulCount: 42,
    aiVerified: true,
    sampathCardDiscount: '20% off with Sampath Card'
  }
];

export const PRESET_STALL_PHOTOS = [
  {
    name: 'Book Shelf Row (Clear View)',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Stall Front Display',
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Discount Table Section',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Paperback Shelf Section',
    url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Classics Corner',
    url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80'
  }
];
