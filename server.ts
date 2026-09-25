import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { Stall, BookSpotting } from './src/types';
import { BMICH_STALLS } from './src/data/initialData';

// Prevent Node crash on transient Windows file lock errors during hot reload / file renames
process.on('uncaughtException', (err: any) => {
  if (err?.code === 'EBUSY' && err?.syscall === 'watch') {
    console.warn('[Watch Warning] Windows transient file lock ignored:', err.path || err.message);
    return;
  }
  console.error('Fatal Uncaught Exception:', err);
  process.exit(1);
});

// In-memory data store for community spots
let communitySpots: BookSpotting[] = [];

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

import { checkLocalProfanity } from './src/utils/moderationPatterns';

let moderationSettings = {
  profanityFilter: true,
  aiSpotVerification: true,
  imageGuardian: true,
  updatedAt: new Date().toISOString()
};

async function moderateContent(
  bookName: string,
  notes?: string,
  shelfLocationNote?: string,
  priceOrOffer?: string,
  finderName?: string,
  stallName?: string
): Promise<{ isClean: boolean; reason?: string; detectedType?: string }> {
  if (!moderationSettings.profanityFilter) {
    return { isClean: true };
  }

  const combinedText = [bookName, notes, shelfLocationNote, priceOrOffer, finderName, stallName]
    .filter(Boolean)
    .join(' ');

  // 1. Instant local pattern check (covers Sinhala script, Singlish, Tamil script, Tanglish, & English)
  const localCheck = checkLocalProfanity(combinedText);
  if (!localCheck.isClean) {
    return localCheck;
  }

  const ai = getAIClient();
  if (!ai) {
    // If no API key configured, pass local check
    return { isClean: true };
  }

  try {
    const prompt = `You are the Sampath Bank AI Community Peace & Safety Guardian for the BMICH Colombo Book Fair 2026.
Sampath Bank PLC is hosting this safe, inclusive community book-finding platform with ZERO-TOLERANCE for:
1. Profanity, vulgarity, obscenity, or foul language in ANY of these languages:
   - English (e.g. fuck, shit, bitch, cunt, dick, asshole, bastard, whore, etc.)
   - Sinhala script (සිංහල අසභ්‍ය වචන - e.g. පකයා, හුත්ත, කැරියා, වේසි, පොන්න, බල්ලා, etc.)
   - Singlish (Colloquial romanized Sinhala curse words/slurs - e.g. pakaya, hutto, hutte, kariya, wesi, wesige, ponnaya, hukapan, etc.)
   - Tamil script (தமிழ் அவதூறு வார்த்தைகள் - e.g. தேவிடியா, ஓத்தா, சுன்னி, மயிர், பொட்டை, etc.)
   - Tanglish (Colloquial romanized Tamil slang - e.g. thevidiya, otha, poolu, sunni, punda, etc.)
2. Racist slurs, ethnic hatred, casteist abuse, or derogatory stereotyping targeting ANY community (Sinhalese, Tamils, Muslims, Burghers, Veddas, foreign tourists).
3. Any message that can harm the peace of a community (incitement to violence, rioting, boycotts, threats, religious conflict, political extremism, harassment, or disruption of social harmony).
4. NONSENSICAL GIBBERISH & KEYBOARD MASHING BAN:
   - Only flag inputs that are genuine gibberish, random keyboard mashing (e.g. "sdsd", "asdfgh", "qwerty", "zxcvbn", "dfghjkl", "fjskdfgh", "blablabla", "zzzxxxccc", "sdfsdfsdf"), random consonant noise without vowels, or obvious spam loops.
   - If an input is genuine keyboard mash or senseless noise:
     * Set "isClean": false, "violationType": "profanity", and "reason": "Flagged as profanity: Input is nonsensical gibberish or keyboard mashing."

5. AUTHENTIC WORDS & LINGUISTIC BALANCE (CRITICAL: DO NOT FLAG REAL WORDS):
   - You MUST identify and ALLOW all actual words in Sinhala script, Singlish (Romanized Sinhala), English, and Tamil:
     * ACTUAL SINHALA WORDS & NOVELS (in Sinhala script or Romanized Singlish):
       Examples: "Kata Katha" / "Katakatha" (කටකතා - meaning folk stories, oral tales, folklore, traditional folklore storybooks), "Natat ayek suramathin" / "Natath Ayek Sura Mathin" (නැතත් අයෙක් සුරමතින් - famous poetic Sinhala novel and Swarnavahini teledrama, literally meaning "Even if someone is not intoxicated by liquor/pride"), "karumakkarayo" (කරුමක්කාරයෝ), "Muthu ahura" (මුතු අහුර), "Vanitha Wasana" (වනිතා වාසනා), "Gamperaliya" (ගම්පෙරළිය), "Madol Doova" (මඩොල් දූව), "Viragaya" (විරාගය), "Amba Yahaluwo" (අඹ යහළුවෝ), "Kaluwara Gedara" (කලුවර ගෙදර), "Baddegama" (බැද්දේගම), "Hathpana", "Magul Kama", "Senasuma", "Sandeshaya", "Guttilaya", "Kavya Shekharaya", "Kusajathakaya", "Potha", "Poth", "Lanka", "Colombo", etc. ARE 100% VALID AND MUST BE APPROVED (isClean: true).
       IMPORTANT NOTE ON "Kata Katha": In Sri Lankan literature and culture, "Kata Katha" (කටකතා) literally means "folk stories" / oral tales / folklore (stories passed down orally). NEVER reject or flag "Kata Katha" or "Katakatha" as rumours, gossip, or profanity. It is completely safe and valid.
       IMPORTANT NOTE ON "Natat ayek suramathin": In Sri Lankan literature and television, "Natat ayek suramathin" (නැතත් අයෙක් සුරමතින්) is a well-known novel and teledrama title. The phrase "suramathin" (සුරමතින් / intoxicated) is used metaphorically in poetry. NEVER flag this title or "suramathin" as substance/alcohol abuse or profanity. It is 100% safe and must be approved.
     * ACTUAL ENGLISH BOOKS & TITLES:
       Examples: "Paddlers Creek", "Atomic Habits", "Harry Potter", "The Great Gatsby", "To Kill a Mockingbird", "Rich Dad Poor Dad", "The Alchemist", textbooks, poetry, fiction, non-fiction, folk stories, fairy tales ARE 100% VALID AND MUST BE APPROVED (isClean: true).
     * AUTHENTIC AUTHORS & PUBLISHERS:
       Examples: "Gunadasa Amarasekera", "Martin Wickramasinghe", "Kumaratunga Munidasa", "Ediriweera Sarachchandra", "K. Jayatillake", "T.B. Ilangaratne", "Sybill Wettasinghe", "Mahagama Sekera", "Dayawansa Jayakody", "Sarasavi", "Godage", "M.D. Gunasena", "Lake House" ARE 100% VALID.
     * CONVERSATIONAL READING REQUESTS:
       Sinhala/Singlish words like "hoyanawa" (searching), "thiyenawa" (available), "thiyeda" (is it there?), "potha" (book), "poth" (books), "kiyawanna" (to read), "ganna" (to buy/take), "aluth" (new), "parana" (old), "machan" (friend), "katandara" / "kathandara" (stories) ARE NATURAL AND MUST BE APPROVED.
   - DO NOT be confused between authentic Sinhala/Singlish vocabulary and fake words.
   - ONLY reject inputs if they are clearly fake pseudo-words, keyboard smashing with no linguistic validity, or contain profane/abusive slurs.

LITERARY CONTEXT:
- Authentic book titles, author queries, stall questions, folklore/folk stories, and reading requests make sense and MUST be APPROVED as clean (isClean: true) if free of vulgarity, slurs, or communal provocation.

Analyze this book spot submission:
Book Title: "${bookName || ''}"
Notes / Edition: "${notes || ''}"
Shelf Location: "${shelfLocationNote || ''}"
Price / Offer: "${priceOrOffer || ''}"
Finder Name: "${finderName || ''}"
Stall Name: "${stallName || ''}"

Respond ONLY with valid JSON in this exact structure:
{
  "isClean": boolean,
  "reason": "Brief polite explanation in English stating what was violated if rejected, or empty string if approved",
  "violationType": "clean" | "profanity" | "racist_or_ethnic_slur" | "communal_peace_harm" | "harassment"
}`;

    let responseText = '';
    for (const modelName of ['gemini-3.6-flash', 'gemini-3.8-flash']) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} call failed, attempting fallback:`, err?.message || err);
      }
    }

    if (responseText) {
      const parsed = JSON.parse(responseText.trim() || '{}');
      if (typeof parsed.isClean === 'boolean') {
        // Special safety guard: Do NOT allow legitimate literary phrases like "Kata Katha" (folk stories)
        // or traditional Sri Lankan titles like "Natat ayek suramathin" to be falsely rejected under rumors/substance/communal rules
        const lowerCombined = combinedText.toLowerCase();
        const hasFolkStoryOrClassicTerm =
          lowerCombined.includes('kata katha') ||
          lowerCombined.includes('katakatha') ||
          lowerCombined.includes('කටකතා') ||
          lowerCombined.includes('කට කතා') ||
          lowerCombined.includes('folk stories') ||
          lowerCombined.includes('folk tales') ||
          lowerCombined.includes('folklore') ||
          lowerCombined.includes('natat ayek suramathin') ||
          lowerCombined.includes('natath ayek suramathin') ||
          lowerCombined.includes('natat ayek') ||
          lowerCombined.includes('natath ayek') ||
          lowerCombined.includes('suramathin') ||
          lowerCombined.includes('suramatin') ||
          lowerCombined.includes('sura mathin') ||
          lowerCombined.includes('නැතත් අයෙක් සුරමතින්') ||
          lowerCombined.includes('නැතත් අයෙක්') ||
          lowerCombined.includes('සුරමතින්') ||
          lowerCombined.includes('සුර මතින්');

        if (!parsed.isClean && hasFolkStoryOrClassicTerm) {
          // Verify that it truly has NO genuine profanity or slurs via strict local check
          const strictCheck = checkLocalProfanity(combinedText);
          if (strictCheck.isClean) {
            console.log('Approved legitimate literary or folk story term:', combinedText);
            return { isClean: true };
          }
        }

        return {
          isClean: parsed.isClean,
          reason: parsed.reason || (parsed.isClean ? undefined : 'Flagged by Sampath AI Safety Moderation: Inappropriate language detected.'),
          detectedType: parsed.violationType
        };
      }
    }
  } catch (err) {
    console.warn('Gemini text moderation call warning (falling back to safety heuristics):', err);
  }

  return { isClean: true };
}

// Multimodal AI Image Vetting for BMICH Colombo Book Fair
async function moderateImage(
  imageDataUrlOrUrl: string
): Promise<{ isClean: boolean; reason?: string; violationType?: string }> {
  if (!imageDataUrlOrUrl || typeof imageDataUrlOrUrl !== 'string') {
    return { isClean: true };
  }

  // Pre-approved safe preset BMICH book fair sample photos
  if (imageDataUrlOrUrl.startsWith('https://images.unsplash.com/')) {
    return { isClean: true };
  }

  const ai = getAIClient();
  if (!ai) {
    return { isClean: true };
  }

  // Extract base64 image data
  const match = imageDataUrlOrUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    if (imageDataUrlOrUrl.startsWith('http://') || imageDataUrlOrUrl.startsWith('https://')) {
      return { isClean: true };
    }
    return { isClean: false, reason: 'Unsupported image format.' };
  }

  const rawMime = match[1].toLowerCase();
  const mimeType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
  const base64Data = match[2];

  try {
    const prompt = `You are the Sampath Bank AI Image Safety Guardian for the official BMICH Colombo Book Fair 2026.
Analyze this uploaded photo to ensure it complies strictly with safe community standards for a family-friendly literary festival.

STRICT REJECTION CRITERIA (Reject if ANY are present):
1. Adult, NSFW, nudity, sexually suggestive, or vulgar poses.
2. Violence, weapons, firearms, knives, blood, gore, drugs, or alcohol.
3. Racist symbols, hate group flags (swastikas, hate emblems), offensive hand gestures (such as raising the middle finger, obscene hand signs), or graphics inciting ethnic/communal disharmony.
4. Trolling or malicious vandalism: completely irrelevant vulgar memes, obscene graffiti, or disturbing graphics.

ACCEPTABLE CONTENT (Approve):
Legitimate photos related to the book fair and reading:
- Books, book covers, open pages, magazines, comics, manga.
- Bookshelves, book stacks, stall aisles, BMICH exhibition halls.
- Bookshop signs, publisher stall banners, price tags, cash receipts.
- Readers legitimately browsing books without obscenity.

Respond ONLY with valid JSON in this exact structure:
{
  "isClean": boolean,
  "reason": "Polite explanation if rejected (e.g. 'Image contains offensive hand gesture' or 'Image contains inappropriate non-book content'), or empty string if approved",
  "category": "safe" | "profanity_or_gesture" | "hate_speech_or_racism" | "adult_content" | "violence" | "irrelevant_troll"
}`;

    let responseText = '';
    for (const modelName of ['gemini-3.6-flash', 'gemini-3.8-flash']) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType
                }
              }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Image moderation model ${modelName} call failed, attempting fallback:`, err?.message || err);
      }
    }

    if (responseText) {
      const parsed = JSON.parse(responseText.trim() || '{}');
      if (typeof parsed.isClean === 'boolean') {
        return {
          isClean: parsed.isClean,
          reason: parsed.reason || (parsed.isClean ? undefined : 'Flagged by Sampath AI Image Shield: Inappropriate image content.'),
          violationType: parsed.category
        };
      }
    }
  } catch (err) {
    console.warn('Gemini image moderation warning (falling back):', err);
  }

  return { isClean: true };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON payloads including up to 3 image data URLs
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      event: 'BMICH Book Fair 2026',
      sponsor: 'Sampath Bank PLC',
      dates: '25th Sep - 4th Oct 2026'
    });
  });

  // Maintenance mode state
  let maintenanceState = {
    enabled: false,
    message: 'Platform is currently undergoing scheduled maintenance. Please check back shortly.',
    updatedAt: new Date().toISOString()
  };

  app.get('/api/settings/maintenance', (req, res) => {
    res.json(maintenanceState);
  });

  app.post('/api/settings/maintenance', (req, res) => {
    const { enabled, message } = req.body;
    maintenanceState = {
      enabled: Boolean(enabled),
      message: typeof message === 'string' && message.trim() ? message.trim() : maintenanceState.message,
      updatedAt: new Date().toISOString()
    };
    res.json({
      success: true,
      ...maintenanceState
    });
  });

  // System Moderation & AI Safety Settings
  app.get('/api/settings/moderation', (req, res) => {
    res.json(moderationSettings);
  });

  app.post('/api/settings/moderation', (req, res) => {
    const { profanityFilter, aiSpotVerification, imageGuardian } = req.body;
    moderationSettings = {
      profanityFilter: profanityFilter !== undefined ? Boolean(profanityFilter) : moderationSettings.profanityFilter,
      aiSpotVerification: aiSpotVerification !== undefined ? Boolean(aiSpotVerification) : moderationSettings.aiSpotVerification,
      imageGuardian: imageGuardian !== undefined ? Boolean(imageGuardian) : moderationSettings.imageGuardian,
      updatedAt: new Date().toISOString()
    };
    res.json({
      success: true,
      settings: moderationSettings,
      message: 'AI safety & moderation settings updated successfully.'
    });
  });

  let stallsStore: Stall[] = [...BMICH_STALLS];

  // Get all stalls
  app.get('/api/stalls', (req, res) => {
    res.json({ stalls: stallsStore });
  });

  // Batch import stalls
  app.post('/api/stalls/import', (req, res) => {
    const { stalls, mode } = req.body;
    if (!Array.isArray(stalls)) {
      return res.status(422).json({ error: 'Invalid stalls payload' });
    }
    if (mode === 'replace') {
      stallsStore = stalls;
    } else {
      const existingIds = new Set(stallsStore.map(s => s.id));
      const toAdd = stalls.filter(s => !existingIds.has(s.id));
      stallsStore = [...stallsStore, ...toAdd];
    }
    stallsStore.sort((a, b) =>
      (a.stallNumber || '').localeCompare(b.stallNumber || '', undefined, {
        numeric: true,
        sensitivity: 'base'
      })
    );
    res.json({
      success: true,
      count: stallsStore.length,
      stalls: stallsStore
    });
  });

  // Toggle hide stall
  app.post('/api/stalls/:id/toggle-hide', (req, res) => {
    const { id } = req.params;
    const { isHidden } = req.body;
    const stall = stallsStore.find(s => s.id === id);
    if (!stall) {
      return res.status(404).json({ error: 'Stall not found' });
    }
    stall.isHidden = typeof isHidden === 'boolean' ? isHidden : !stall.isHidden;
    res.json({
      success: true,
      stall
    });
  });

  // Create stall
  app.post('/api/stalls', (req, res) => {
    const newStall: Stall = req.body;
    if (!newStall.id) {
      newStall.id = `stall-${Date.now()}`;
    }
    stallsStore.push(newStall);
    res.status(201).json({ success: true, stall: newStall });
  });

  // Update stall
  app.put('/api/stalls/:id', (req, res) => {
    const { id } = req.params;
    const idx = stallsStore.findIndex(s => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Stall not found' });
    }
    stallsStore[idx] = { ...stallsStore[idx], ...req.body };
    res.json({ success: true, stall: stallsStore[idx] });
  });

  // Delete stall
  app.delete('/api/stalls/:id', (req, res) => {
    const { id } = req.params;
    stallsStore = stallsStore.filter(s => s.id !== id);
    res.json({ success: true });
  });

  // Get community spots / chat feed
  app.get('/api/spots', (req, res) => {
    const sorted = [...communitySpots].sort((a, b) => b.timestamp - a.timestamp);
    res.json({ spots: sorted });
  });

  // Check if a book was already found
  app.post('/api/check-book', (req, res) => {
    const { bookName } = req.body;
    if (!bookName || typeof bookName !== 'string') {
      return res.json({ matches: [] });
    }

    const query = bookName.trim().toLowerCase();
    if (query.length < 2) {
      return res.json({ matches: [] });
    }

    // Find all spots where bookName contains the query or query contains bookName
    const matchingSpots = communitySpots.filter(spot => {
      const target = spot.bookName.toLowerCase();
      return target.includes(query) || query.includes(target);
    });

    // Group by stall
    const stallMap = new Map<string, typeof matchingSpots>();
    for (const spot of matchingSpots) {
      const key = `${spot.stallName} (${spot.hall})`;
      if (!stallMap.has(key)) {
        stallMap.set(key, []);
      }
      stallMap.get(key)!.push(spot);
    }

    const results = matchingSpots.map(s => ({
      id: s.id,
      bookName: s.bookName,
      stallName: s.stallName,
      hall: s.hall,
      stallNumber: s.stallNumber,
      priceOrOffer: s.priceOrOffer,
      images: s.images,
      shelfLocationNote: s.shelfLocationNote,
      timestamp: s.timestamp,
      status: s.status,
      finderHandle: s.finderHandle
    }));

    res.json({
      query,
      found: results.length > 0,
      count: results.length,
      stallsCount: stallMap.size,
      sightings: results
    });
  });

  // Standalone image vetting endpoint for real-time validation
  app.post('/api/moderate-image', async (req, res) => {
    try {
      const { image } = req.body;
      if (!moderationSettings.imageGuardian || !image) {
        return res.json({ isClean: true });
      }
      const result = await moderateImage(image);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ isClean: false, reason: 'Image moderation check failed.' });
    }
  });

  // Standalone text check endpoint for real-time validation
  app.post('/api/moderate-text', async (req, res) => {
    try {
      const { text, context } = req.body;
      if (!text) {
        return res.json({ isClean: true });
      }
      const result = await moderateContent(text, context);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ isClean: false, reason: 'Text moderation check failed.' });
    }
  });

  // Post a new book sighting or "looking for a book" request message
  app.post('/api/spots', async (req, res) => {
    try {
      const { 
        postType = 'spot',
        bookName, 
        author,
        preferredLanguage,
        stallId, 
        stallName, 
        hall, 
        stallNumber, 
        images, 
        finderName, 
        priceOrOffer, 
        shelfLocationNote,
        notes,
        isResolved,
        status,
        replyToRequestId,
        taggedRequesterName,
        taggedRequesterHandle
      } = req.body;

      // Validate book name
      if (!bookName || typeof bookName !== 'string' || bookName.trim().length < 2) {
        return res.status(400).json({ error: 'Book name is required.' });
      }

      // 1. Multilingual Content & Peace Moderation (English, Sinhala script, Singlish, Tamil script, Tanglish)
      const modResult = await moderateContent(
        bookName,
        notes,
        shelfLocationNote,
        priceOrOffer,
        finderName,
        stallName
      );
      if (!modResult.isClean) {
        return res.status(400).json({
          error: `AI Moderation: Message rejected. ${modResult.reason || 'Contains inappropriate, racist, or prohibited language.'} Sampath Bank community standards strictly prohibit profanity, racism, and communal discord.`,
          moderationBlocked: true,
          reason: modResult.reason,
          violationType: modResult.detectedType || 'profanity'
        });
      }

      const photoList: string[] = Array.isArray(images) ? images : [];
      if (photoList.length > 3) {
        return res.status(400).json({ error: 'A maximum of 3 pictures can be uploaded.' });
      }

      // 2. Multimodal AI Image Vetting for all uploaded photos
      for (let i = 0; i < photoList.length; i++) {
        const imgCheck = await moderateImage(photoList[i]);
        if (!imgCheck.isClean) {
          return res.status(400).json({
            error: `AI Image Moderation: Uploaded photo ${i + 1} was rejected. ${imgCheck.reason || 'Image content violates community guidelines.'} Only safe, appropriate photos of books and BMICH stalls are permitted.`,
            moderationBlocked: true,
            reason: imgCheck.reason,
            violationType: 'image_safety',
            imageIndex: i
          });
        }
      }

      // Handle "Looking for a book" request
      if (postType === 'request') {
        const newRequest: BookSpotting = {
          id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          postType: 'request',
          bookName: bookName.trim(),
          author: author?.trim() || undefined,
          preferredLanguage: preferredLanguage?.trim() || undefined,
          stallId: 'seeking',
          stallName: 'BMICH Fairgrounds',
          hall: 'Seeking in All Halls',
          stallNumber: 'Looking for Stall',
          images: photoList,
          finderName: finderName?.trim() || 'Book Fair Visitor',
          finderHandle: finderName?.trim() ? (finderName.startsWith('@') ? finderName : `@${finderName.replace(/\s+/g, '_').toLowerCase()}`) : '@booklover',
          timestamp: Date.now(),
          notes: notes?.trim() || undefined,
          status: (status as any) || (isResolved ? 'Found' : 'Looking for Book'),
          helpfulCount: 0,
          aiVerified: moderationSettings.aiSpotVerification,
          isResolved: Boolean(isResolved)
        };

        communitySpots.unshift(newRequest);

        return res.status(201).json({
          success: true,
          spot: newRequest,
          message: 'Looking for book request posted to group chat!'
        });
      }

      // Handle "Found a Book" / Sighting
      if (!stallName || typeof stallName !== 'string') {
        return res.status(400).json({ error: 'Stall name must be selected from the participating stalls dropdown.' });
      }

      // Check if this is a reply to an existing "Looking for" request
      let linkedRequesterName = taggedRequesterName;
      let linkedRequesterHandle = taggedRequesterHandle;

      if (replyToRequestId) {
        const targetRequest = communitySpots.find(s => s.id === replyToRequestId);
        if (targetRequest) {
          targetRequest.isResolved = true;
          targetRequest.status = 'Found';
          linkedRequesterName = targetRequest.finderName;
          linkedRequesterHandle = targetRequest.finderHandle;
        }
      }

      // Find stall metadata if known
      const matchedStall = stallsStore.find(s => s.name.toLowerCase() === stallName.toLowerCase() || s.id === stallId);

      const newSpot: BookSpotting = {
        id: `spot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        postType: 'spot',
        bookName: bookName.trim(),
        stallId: stallId || matchedStall?.id || 'other',
        stallName: stallName.trim(),
        hall: hall || matchedStall?.hall || 'BMICH Main Fairgrounds',
        stallNumber: stallNumber || matchedStall?.stallNumber || 'Fairground Stall',
        images: photoList,
        finderName: finderName?.trim() || 'Anonymous Fair Visitor',
        finderHandle: finderName?.trim() ? (finderName.startsWith('@') ? finderName : `@${finderName.replace(/\s+/g, '_').toLowerCase()}`) : '@bookspotter',
        timestamp: Date.now(),
        priceOrOffer: priceOrOffer?.trim() || undefined,
        shelfLocationNote: shelfLocationNote?.trim() || undefined,
        notes: notes?.trim() || undefined,
        status: 'In Stock',
        helpfulCount: 1,
        ratingAverage: 5.0,
        ratingCount: 1,
        aiVerified: moderationSettings.aiSpotVerification,
        sampathCardDiscount: matchedStall?.specialDiscount || 'Eligible for Sampath Cardholder fair offers',
        replyToRequestId: replyToRequestId || undefined,
        taggedRequesterName: linkedRequesterName || undefined,
        taggedRequesterHandle: linkedRequesterHandle || undefined
      };

      // If this spot resolves a request, link it
      if (replyToRequestId) {
        const targetReq = communitySpots.find(s => s.id === replyToRequestId);
        if (targetReq) {
          targetReq.resolvedBySpotId = newSpot.id;
        }
      }

      // Add to front of community spots
      communitySpots.unshift(newSpot);

      res.status(201).json({
        success: true,
        spot: newSpot,
        message: replyToRequestId 
          ? `Tagged ${linkedRequesterName || 'user'} with your found book location!`
          : 'Book spot published to community feed successfully!'
      });
    } catch (err: any) {
      console.error('Error posting spot:', err);
      res.status(500).json({ error: 'Failed to post book sighting. Please try again.' });
    }
  });

  // Rate a find (1 to 5 stars) by people who think this post helped them
  app.post('/api/spots/:id/rate', (req, res) => {
    const { id } = req.params;
    const { score } = req.body;

    const spot = communitySpots.find(s => s.id === id);
    if (!spot) {
      return res.status(404).json({ error: 'Spotting not found' });
    }

    const numScore = Math.max(1, Math.min(5, Number(score) || 5));
    const currentCount = spot.ratingCount || (spot.helpfulCount > 0 ? 1 : 0);
    const currentAvg = spot.ratingAverage || 5.0;

    const newCount = currentCount + 1;
    const newAverage = Number(((currentAvg * currentCount + numScore) / newCount).toFixed(1));

    spot.ratingCount = newCount;
    spot.ratingAverage = newAverage;
    spot.helpfulCount += 1;

    res.json({
      success: true,
      ratingAverage: spot.ratingAverage,
      ratingCount: spot.ratingCount,
      helpfulCount: spot.helpfulCount
    });
  });

  // Upvote / helpful
  app.post('/api/spots/:id/upvote', (req, res) => {
    const { id } = req.params;
    const spot = communitySpots.find(s => s.id === id);
    if (!spot) {
      return res.status(404).json({ error: 'Spotting not found' });
    }
    spot.helpfulCount += 1;
    res.json({ success: true, helpfulCount: spot.helpfulCount });
  });

  // Update status (e.g. 'Sold Out' or 'Few Copies Left')
  app.post('/api/spots/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const spot = communitySpots.find(s => s.id === id);
    if (!spot) {
      return res.status(404).json({ error: 'Spotting not found' });
    }
    if (['In Stock', 'Few Copies Left', 'Sold Out', 'Looking for Book', 'Found'].includes(status)) {
      spot.status = status;
      return res.json({ success: true, status: spot.status });
    }
    res.status(400).json({ error: 'Invalid status' });
  });

  // Serve public static assets directly
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));
  app.use('/bookfair', express.static(publicPath));

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('/bookfair', express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BMICH Book Fair Community App Server running on port ${PORT}`);
  });
}

startServer();
