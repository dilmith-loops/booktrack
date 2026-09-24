import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, ShieldAlert, Sparkles, AlertTriangle, CheckCircle, Trash2, MapPin, Info, User, ChevronDown, HelpCircle, Building2, ShieldCheck, Loader2 } from 'lucide-react';
import { Stall, BookSpotting, UserProfile } from '../types';
import { fileToDataUrl } from '../utils/imageUtils';
import { checkLocalProfanity } from '../utils/moderationPatterns';
import { analyzeImageClientSafety } from '../utils/imageSafetyFilter';
import { apiFetch } from '../utils/api';

interface PostBookSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  stalls: Stall[];
  existingSpots: BookSpotting[];
  initialBookTitle?: string;
  replyToSpot?: BookSpotting | null;
  userProfile?: UserProfile | null;
  onSpotAdded: (newSpot: BookSpotting) => void;
}

export const PostBookSpotModal: React.FC<PostBookSpotModalProps> = ({
  isOpen,
  onClose,
  stalls,
  existingSpots,
  initialBookTitle = '',
  replyToSpot,
  userProfile,
  onSpotAdded
}) => {
  const [modalMode, setModalMode] = useState<'spot' | 'request'>('spot');
  const [bookName, setBookName] = useState(initialBookTitle);
  const [authorName, setAuthorName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [isFound, setIsFound] = useState(false);
  const [spotNotes, setSpotNotes] = useState('');
  const [selectedStallId, setSelectedStallId] = useState('');
  const [customStallName, setCustomStallName] = useState('');
  const [customHall, setCustomHall] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [shelfLocationNote, setShelfLocationNote] = useState('');

  // Always attribute to the logged-in user
  const getLoggedInUser = (): UserProfile | null => {
    if (userProfile?.name) return userProfile;
    try {
      const saved = localStorage.getItem('sampath_bookfair_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const loggedInUser = getLoggedInUser();
  const effectiveFinder = loggedInUser?.name?.trim() || loggedInUser?.handle?.trim() || 'Fair Visitor';
  const effectiveHandle = loggedInUser?.handle?.trim() || undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVettingImage, setIsVettingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiBlockedReason, setAiBlockedReason] = useState<string | null>(null);
  const [alreadyFoundMatches, setAlreadyFoundMatches] = useState<BookSpotting[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setBookName('');
    setAuthorName('');
    setPreferredLanguage('');
    setRequestNotes('');
    setIsFound(false);
    setSpotNotes('');
    setSelectedStallId('');
    setCustomStallName('');
    setCustomHall('');
    setImages([]);
    setShelfLocationNote('');
    setErrorMsg(null);
    setAiBlockedReason(null);
    setAlreadyFoundMatches([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Sync initialBookTitle on open
  useEffect(() => {
    if (isOpen && initialBookTitle) {
      setBookName(initialBookTitle);
    }
  }, [isOpen, initialBookTitle]);

  // Check if book was already found
  useEffect(() => {
    const q = bookName.trim().toLowerCase();
    if (q.length < 2) {
      setAlreadyFoundMatches([]);
      return;
    }

    const matches = existingSpots.filter(s =>
      s.postType !== 'request' &&
      (s.bookName.toLowerCase().includes(q) || q.includes(s.bookName.toLowerCase()))
    );
    setAlreadyFoundMatches(matches);
  }, [bookName, existingSpots]);

  // Real-time multilingual profanity check across English, Sinhala, Singlish, Tamil, & Tanglish
  const bookNameViolation = checkLocalProfanity(bookName);
  const authorViolation = modalMode === 'request' ? checkLocalProfanity(authorName) : { isClean: true };
  const notesViolation = modalMode === 'request'
    ? checkLocalProfanity(requestNotes)
    : checkLocalProfanity(spotNotes);
  const locationViolation = modalMode === 'spot' ? checkLocalProfanity(shelfLocationNote) : { isClean: true };
  const otherFieldsViolation = checkLocalProfanity(customStallName);

  const localViolation = !bookNameViolation.isClean
    ? bookNameViolation
    : !authorViolation.isClean
    ? authorViolation
    : !notesViolation.isClean
    ? notesViolation
    : !locationViolation.isClean
    ? locationViolation
    : otherFieldsViolation;

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg('Maximum 3 photos allowed.');
      return;
    }

    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);
    setErrorMsg(null);
    setAiBlockedReason(null);
    setIsVettingImage(true);

    try {
      const accepted: string[] = [];
      for (const file of filesToProcess) {
        const dataUrl = await fileToDataUrl(file);

        // 1. Instant Client-Side Safety Shield (Canvas Skin-Tone & Nudity Inspection)
        const clientCheck = await analyzeImageClientSafety(dataUrl);
        if (!clientCheck.isClean) {
          setAiBlockedReason(
            `Sampath AI Safety Shield: Photo blocked. ${clientCheck.reason || 'Excessive skin exposure or policy-violating imagery detected. Only photos of books, covers, or bookstore stalls are permitted.'}`
          );
          continue;
        }

        // 2. Server-side AI Vision & Local GD validation
        try {
          const modRes = await apiFetch('/api/moderate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl })
          });
          const modData = await modRes.json();
          if (!modData.isClean) {
            setAiBlockedReason(
              `Sampath AI Image Shield: Photo blocked. ${modData.reason || 'Image violates safe community guidelines (excessive skin exposure, swimwear, or policy-violating content detected).'}`
            );
            continue;
          }
        } catch (err) {
          console.warn('Image moderation API warning:', err);
        }

        accepted.push(dataUrl);
      }

      if (accepted.length > 0) {
        setImages(prev => [...prev, ...accepted].slice(0, 3));
      }
    } catch (err) {
      setErrorMsg('Could not process selected image. Please try another.');
    } finally {
      setIsVettingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  const removePhoto = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAiBlockedReason(null);

    // Instant local violation check
    if (!localViolation.isClean) {
      setAiBlockedReason(localViolation.reason || 'Flagged by Sampath AI Moderation: Prohibited language detected.');
      return;
    }

    // Strict format validations
    if (!bookName.trim()) {
      setErrorMsg('Book name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (modalMode === 'request') {
        const payload = {
          postType: 'request',
          bookName: bookName.trim(),
          author: authorName.trim() || undefined,
          preferredLanguage: preferredLanguage || undefined,
          finderName: effectiveFinder,
          finderHandle: effectiveHandle,
          notes: requestNotes.trim() || undefined,
          status: isFound ? 'Found' : 'Looking for Book',
          isResolved: isFound,
          images
        };

        const res = await apiFetch('/api/spots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.moderationBlocked) {
            setAiBlockedReason(data.reason || 'Flagged by Sampath AI Moderation: Inappropriate language detected.');
          } else {
            setErrorMsg(data.error || 'Failed to post request.');
          }
          setIsSubmitting(false);
          return;
        }

        onSpotAdded(data.spot);
        handleClose();
        return;
      }

      // Sighting flow
      if (!selectedStallId) {
        setErrorMsg('Please select a stall from the participating stalls dropdown.');
        setIsSubmitting(false);
        return;
      }

      let stallName = '';
      let hall = '';
      let stallNumber = '';

      if (selectedStallId === 'other') {
        if (!customStallName.trim()) {
          setErrorMsg('Please specify the stall name.');
          setIsSubmitting(false);
          return;
        }
        stallName = customStallName.trim();
        hall = customHall.trim() || 'BMICH Grounds';
        stallNumber = 'Fairground Stall';
      } else {
        const stallObj = stalls.find(s => s.id === selectedStallId);
        if (!stallObj) {
          setErrorMsg('Selected stall is invalid.');
          setIsSubmitting(false);
          return;
        }
        stallName = stallObj.name;
        hall = stallObj.hall;
        stallNumber = stallObj.stallNumber;
      }

      if (images.length > 3) {
        setErrorMsg('Maximum of 3 pictures allowed.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        postType: 'spot',
        bookName: bookName.trim(),
        stallId: selectedStallId,
        stallName,
        hall,
        stallNumber,
        images,
        finderName: effectiveFinder,
        finderHandle: effectiveHandle,
        shelfLocationNote: shelfLocationNote.trim() || undefined,
        notes: spotNotes.trim() || undefined,
        replyToRequestId: replyToSpot?.id || undefined,
        taggedRequesterName: replyToSpot?.finderName || undefined,
        taggedRequesterHandle: replyToSpot?.finderHandle || undefined
      };

      const res = await apiFetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.moderationBlocked) {
          setAiBlockedReason(data.reason || 'Flagged by Sampath AI Moderation: Prohibited content detected.');
        } else {
          setErrorMsg(data.error || 'Failed to publish spot.');
        }
        setIsSubmitting(false);
        return;
      }

      onSpotAdded(data.spot);
      handleClose();
    } catch (err: any) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStall = stalls.find(s => s.id === selectedStallId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] my-auto overflow-hidden">
        {/* Modal Top Sponsor Header */}
        <div className="bg-gradient-to-r from-[#F37021] via-[#EA580C] to-[#C2410C] text-white p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Big Logo */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center flex-shrink-0 border border-white/40">
              <img
                src={`${import.meta.env.BASE_URL}logo-icon.png`}
                alt="Sampath Bank"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('logo%20icon.png')) {
                    target.src = `${import.meta.env.BASE_URL}logo%20icon.png`;
                  }
                }}
              />
            </div>
            {/* Only Title Text */}
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
              {modalMode === 'request' ? 'Ask Community: Looking for a Book' : 'Share Book Sighting at BMICH'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            id="close-post-modal-btn"
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher: Spotted vs Looking For */}
        <div className="bg-zinc-100 p-2 flex gap-2 border-b border-zinc-200">
          <button
            type="button"
            onClick={() => {
              setModalMode('spot');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              modalMode === 'spot'
                ? 'bg-white text-[#F37021] shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>I Spotted a Book</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setModalMode('request');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              modalMode === 'request'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>I'm Looking for a Book</span>
          </button>
        </div>

        {/* Reply Context Banner */}
        {replyToSpot && modalMode === 'spot' && (
          <div className="bg-orange-50 border-b border-orange-200/90 px-4 py-2.5 flex items-center justify-between text-xs text-orange-950">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                @
              </span>
              <span>
                Replying to <strong>{replyToSpot.finderName}</strong>'s request for "<strong>{replyToSpot.bookName}</strong>"
              </span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Live Prohibited Language Alert if user types abusive or nonsensical words */}
          {!localViolation.isClean && (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs text-rose-950 animate-in fade-in">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="font-black text-rose-950">Profanity / Prohibited Language Detected:</strong>
                  {localViolation.detectedLanguage && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-200 text-rose-900 border border-rose-300">
                      {localViolation.detectedLanguage}
                    </span>
                  )}
                  {localViolation.matchedWord && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-100 text-rose-800 border border-rose-200">
                      "{localViolation.matchedWord}"
                    </span>
                  )}
                </div>
                <p className="font-medium text-rose-900">{localViolation.reason}</p>
                <p className="text-[10px] text-rose-700">
                  Sampath Bank PLC community standards strictly forbid profanity, vulgarity, racist slurs, and communal disharmony across English, Sinhala (සිංහල), Singlish, Tamil (தமிழ்), and Tanglish.
                </p>
              </div>
            </div>
          )}

          {/* AI Profanity Moderation Warning Banner if blocked */}
          {aiBlockedReason && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-xs text-rose-900 animate-in shake">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-black text-rose-950">AI Moderation Rejection:</strong>
                <p className="mt-0.5">{aiBlockedReason}</p>
                <p className="mt-1 text-[11px] text-rose-700 font-medium">
                  Sampath Bank strictly enforces a safe, profanity-free community standard for the Colombo Book Fair. Please remove offensive language or inappropriate images and resubmit.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Book Input */}
          <div>
            <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Book *</span>
              <span className="text-[10px] text-zinc-400 font-bold">Mandatory</span>
            </label>
            <input
              type="text"
              id="post-book-name-input"
              value={bookName}
              onChange={(e) => {
                setBookName(e.target.value);
                if (aiBlockedReason) setAiBlockedReason(null);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={
                modalMode === 'request'
                  ? 'e.g. Harry Potter, Gamperaliya'
                  : 'e.g. Karumakkarayo, Muthu ahura, Atomic Habits'
              }
              required
              className={`w-full px-3.5 py-2.5 bg-zinc-50 border rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:bg-white transition-all shadow-inner ${
                !bookNameViolation.isClean
                  ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                  : 'border-zinc-300 focus:ring-2 focus:ring-[#F37021]'
              }`}
            />
            {/* Inline warning for Book Name */}
            {!bookNameViolation.isClean && (
              <div className="mt-1.5 text-[11px] font-bold text-rose-700 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg animate-in fade-in">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                <span>
                  [{bookNameViolation.detectedLanguage || 'Profanity'}] {bookNameViolation.reason}
                </span>
              </div>
            )}
          </div>

          {/* "Already Found" Notification Banner if matching spots exist */}
          {alreadyFoundMatches.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300/80 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 mb-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Good news! This book was already spotted at BMICH:</span>
              </div>
              <div className="space-y-1.5">
                {alreadyFoundMatches.slice(0, 2).map((match) => (
                  <div key={match.id} className="text-xs bg-white p-2 rounded-xl border border-amber-200 flex items-center justify-between shadow-xs">
                    <span className="font-bold text-zinc-900">
                      📍 {match.stallName} ({match.hall} • {match.stallNumber})
                    </span>
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {match.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOOKING FOR A BOOK FIELDS */}
          {modalMode === 'request' ? (
            <div className="space-y-3.5">
              {/* 2. Author Name (If Known) */}
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Author Name (If Known)</span>
                  <span className="text-[10px] text-zinc-400 font-bold">Optional</span>
                </label>
                <input
                  type="text"
                  id="post-request-author-input"
                  value={authorName}
                  onChange={(e) => {
                    setAuthorName(e.target.value);
                    if (aiBlockedReason) setAiBlockedReason(null);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g. Martin Wickramasinghe, J.K. Rowling, James Clear"
                  className={`w-full px-3.5 py-2.5 bg-zinc-50 border rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:bg-white transition-all ${
                    !authorViolation.isClean
                      ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                      : 'border-zinc-300 focus:ring-2 focus:ring-amber-500'
                  }`}
                />
                {!authorViolation.isClean && (
                  <div className="mt-1.5 text-[11px] font-bold text-rose-700 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg animate-in fade-in">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                    <span>
                      [{authorViolation.detectedLanguage || 'Profanity'}] {authorViolation.reason}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Preferred Language */}
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Preferred Language</span>
                  <span className="text-[10px] text-zinc-400 font-bold">Optional</span>
                </label>
                <div className="relative">
                  <select
                    id="post-preferred-language-select"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    aria-label="Preferred Language"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white appearance-none cursor-pointer"
                  >
                    <option value="">-- Any Language / No Preference --</option>
                    <option value="English">English</option>
                    <option value="Sinhala (සිංහල)">Sinhala (සිංහල)</option>
                    <option value="Tamil (தமிழ்)">Tamil (தமிழ்)</option>
                    <option value="Sinhala Translation (පරිවර්තන)">Sinhala Translation (පරිවර්තන)</option>
                    <option value="Tamil Translation">Tamil Translation</option>
                    <option value="Bilingual / Other">Bilingual / Other</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* 4. Notes */}
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Notes</span>
                  <span className="text-[10px] text-zinc-400 font-bold">Details / Edition</span>
                </label>
                <textarea
                  id="post-request-notes-input"
                  value={requestNotes}
                  onChange={(e) => {
                    setRequestNotes(e.target.value);
                    if (aiBlockedReason) setAiBlockedReason(null);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g. Looking for Bloomsbury paperback edition, Sinhala translation, or children's illustrated version..."
                  rows={2}
                  className={`w-full px-3.5 py-2 bg-zinc-50 border rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:bg-white transition-all ${
                    !notesViolation.isClean
                      ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                      : 'border-zinc-300 focus:ring-2 focus:ring-amber-500'
                  }`}
                />
                {!notesViolation.isClean && (
                  <div className="mt-1.5 text-[11px] font-bold text-rose-700 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg animate-in fade-in">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                    <span>
                      [{notesViolation.detectedLanguage || 'Profanity'}] {notesViolation.reason}
                    </span>
                  </div>
                )}
              </div>

              {/* 5. Found? */}
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Found?</span>
                  <span className="text-[10px] text-zinc-400 font-bold">Status</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFound(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !isFound
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <span>🔍 Still Looking (No)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFound(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isFound
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <span>✓ Already Found (Yes)</span>
                  </button>
                </div>
              </div>

              {/* 6. Upload Photo (AI image detection included) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1">
                    <span>Upload Photo</span>
                    <span className="text-[10px] text-zinc-500 font-normal">({images.length}/3 pictures max)</span>
                  </label>
                  <span className="text-[10px] text-[#075E54] font-black flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>AI Vetted</span>
                  </span>
                </div>

                {/* Vetting in progress indicator */}
                {isVettingImage && (
                  <div className="p-2.5 mb-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-800">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <span>Sampath AI Vision inspecting reference photo for community safety...</span>
                  </div>
                )}

                {/* Upload Previews */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-300 bg-zinc-100 group shadow-xs">
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/80 backdrop-blur-xs text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-500/30">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                        <span>AI Verified Clean</span>
                      </span>
                    </div>
                  ))}

                  {images.length < 3 && (
                    <button
                      type="button"
                      disabled={isVettingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 hover:border-amber-500 bg-zinc-50 hover:bg-amber-50/40 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer text-zinc-600 hover:text-amber-700 disabled:opacity-50"
                    >
                      <Camera className="w-6 h-6 mb-1 text-amber-600" />
                      <span className="text-[10px] font-black">+ Upload</span>
                      <span className="text-[8px] text-zinc-400">Cover Ref (AI Vetted)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* How this appears on the group chat */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
                <p className="font-bold">How this appears on the group chat:</p>
                <p className="mt-1 italic text-zinc-700">
                  "{effectiveFinder || 'You'} is looking for {bookName || 'Harry Potter'}{authorName ? ` by ${authorName}` : ''}{preferredLanguage ? ` [${preferredLanguage}]` : ''}"
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Other visitors browsing BMICH stalls can tap "I Found This!" to tag you with the exact stall and shelf photo.
                </p>
              </div>
            </div>
          ) : (
            /* SPOTTED A BOOK FIELDS */
            <>
              {/* 2. Location */}
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Location</span>
                  <span className="text-[10px] text-zinc-400 font-bold">Shelf / Aisle Location</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#F37021] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    id="post-location-input"
                    value={shelfLocationNote}
                    onChange={(e) => {
                      setShelfLocationNote(e.target.value);
                      if (aiBlockedReason) setAiBlockedReason(null);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="e.g. Right wall, Fiction section row 3, under bestseller banner"
                    className={`w-full pl-9 pr-3 py-2 bg-zinc-50 border rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:bg-white ${
                      !locationViolation.isClean
                        ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                        : 'border-zinc-300 focus:ring-2 focus:ring-[#F37021]'
                    }`}
                  />
                </div>
                {!locationViolation.isClean && (
                  <div className="mt-1.5 text-[11px] font-bold text-rose-700 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg animate-in fade-in">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                    <span>
                      [{locationViolation.detectedLanguage || 'Profanity'}] {locationViolation.reason}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. BMICH Stall (from dropdown) */}
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>BMICH Stall * (From Dropdown)</span>
                  <span className="text-[10px] text-[#075E54] font-black">Official Partner</span>
                </label>
                <div className="relative">
                  <select
                    id="post-stall-select"
                    value={selectedStallId}
                    onChange={(e) => setSelectedStallId(e.target.value)}
                    required
                    aria-label="BMICH Stall"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021] focus:bg-white appearance-none cursor-pointer"
                  >
                    <option value="">-- Choose participating book stall --</option>
                    {stalls.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.hall} • {s.stallNumber}) {s.specialDiscount ? `[${s.specialDiscount}]` : ''}
                      </option>
                    ))}
                    <option value="other">+ Other BMICH Fairground Stall...</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                </div>

                {selectedStall?.specialDiscount && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-black text-[#C84F0E] bg-orange-50 p-2 rounded-lg border border-orange-200">
                    <Sparkles className="w-3.5 h-3.5 text-[#F37021] flex-shrink-0" />
                    <span>Sampath Card Discount: {selectedStall.specialDiscount}</span>
                  </div>
                )}
              </div>

              {/* Custom Stall Name if "other" is selected */}
              {selectedStallId === 'other' && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">
                      Stall Name *
                    </label>
                    <input
                      type="text"
                      value={customStallName}
                      onChange={(e) => setCustomStallName(e.target.value)}
                      placeholder="e.g. Samayawardhana"
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">
                      Hall / Area
                    </label>
                    <input
                      type="text"
                      value={customHall}
                      onChange={(e) => setCustomHall(e.target.value)}
                      placeholder="e.g. Hall E or Foyer"
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 4. Notes for Those Looking for This Book */}
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Notes for Those Looking for This Book</span>
                  <span className="text-[10px] text-zinc-400 font-bold">Helpful Tips</span>
                </label>
                <textarea
                  id="post-spot-notes-input"
                  value={spotNotes}
                  onChange={(e) => {
                    setSpotNotes(e.target.value);
                    if (aiBlockedReason) setAiBlockedReason(null);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g. 4 copies left on top shelf, priced at Rs. 1,450, 20% discount with Sampath Bank cards..."
                  rows={2}
                  className={`w-full px-3.5 py-2 bg-zinc-50 border rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:bg-white transition-all ${
                    !notesViolation.isClean
                      ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                      : 'border-zinc-300 focus:ring-2 focus:ring-[#F37021]'
                  }`}
                />
                {!notesViolation.isClean && (
                  <div className="mt-1.5 text-[11px] font-bold text-rose-700 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg animate-in fade-in">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                    <span>
                      [{notesViolation.detectedLanguage || 'Profanity'}] {notesViolation.reason}
                    </span>
                  </div>
                )}
              </div>

              {/* 5. Upload Photo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1">
                    <span>Upload Photo</span>
                    <span className="text-[10px] text-zinc-500 font-normal">({images.length}/3 pictures max)</span>
                  </label>
                  <span className="text-[10px] text-[#075E54] font-black flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>AI Vetted</span>
                  </span>
                </div>

                {/* Vetting in progress indicator */}
                {isVettingImage && (
                  <div className="p-2.5 mb-2 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2 text-xs font-bold text-[#EA580C]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#F37021]" />
                    <span>Sampath AI Vision inspecting uploaded photo for community safety...</span>
                  </div>
                )}

                {/* Upload Previews */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-300 bg-zinc-100 group shadow-xs">
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/80 backdrop-blur-xs text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-500/30">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                        <span>AI Verified Clean</span>
                      </span>
                    </div>
                  ))}

                  {images.length < 3 && (
                    <button
                      type="button"
                      disabled={isVettingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 hover:border-[#F37021] bg-zinc-50 hover:bg-orange-50/40 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer text-zinc-600 hover:text-[#EA580C] disabled:opacity-50"
                    >
                      <Camera className="w-6 h-6 mb-1 text-[#F37021]" />
                      <span className="text-[10px] font-black">+ Upload</span>
                      <span className="text-[8px] text-zinc-400">Max 3 (AI Vetted)</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Hidden shared file input for image uploads in both tabs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Active Spotter Attribution (Always logged-in user) */}
          <div className="flex items-center gap-2.5 p-3 bg-orange-50/80 border border-orange-200/80 rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F37021] to-[#EA580C] text-white flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
              {(effectiveFinder || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Posting To Community As</div>
              <div className="text-xs font-black text-zinc-900 truncate">
                {effectiveFinder}{' '}
                {effectiveHandle && (
                  <span className="font-mono text-[11px] font-bold text-[#F37021]">
                    ({effectiveHandle})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-black text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !localViolation.isClean || isVettingImage}
              id="submit-spot-btn"
              className={`px-5 py-2.5 text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 transition-all ${
                !localViolation.isClean
                  ? 'bg-zinc-400 hover:bg-zinc-400 cursor-not-allowed'
                  : modalMode === 'request'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700'
                  : 'bg-gradient-to-r from-[#F37021] to-[#EA580C]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sampath AI Verifying...</span>
                </>
              ) : !localViolation.isClean ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-white" />
                  <span>Profanity Detected ({localViolation.detectedLanguage || 'Blocked'})</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {modalMode === 'request' ? 'Post Book Request' : 'Publish Book Sighting'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};