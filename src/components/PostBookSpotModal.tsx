import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, ShieldAlert, Sparkles, AlertTriangle, CheckCircle, Trash2, MapPin, Info, User, ChevronDown, HelpCircle, Building2, ShieldCheck, Loader2 } from 'lucide-react';
import { Stall, BookSpotting, UserProfile } from '../types';
import { fileToDataUrl } from '../utils/imageUtils';
import { PRESET_STALL_PHOTOS } from '../data/initialData';
import { checkLocalProfanity } from '../utils/moderationPatterns';
import { analyzeImageClientSafety } from '../utils/imageSafetyFilter';

interface PostBookSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  stalls: Stall[];
  existingSpots: BookSpotting[];
  initialBookTitle?: string;
  userProfile?: UserProfile | null;
  onSpotAdded: (newSpot: BookSpotting) => void;
}

export const PostBookSpotModal: React.FC<PostBookSpotModalProps> = ({
  isOpen,
  onClose,
  stalls,
  existingSpots,
  initialBookTitle = '',
  userProfile,
  onSpotAdded
}) => {
  const [modalMode, setModalMode] = useState<'spot' | 'request'>('spot');
  const [bookName, setBookName] = useState(initialBookTitle);
  const [authorName, setAuthorName] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [selectedStallId, setSelectedStallId] = useState('');
  const [customStallName, setCustomStallName] = useState('');
  const [customHall, setCustomHall] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [finderName, setFinderName] = useState(userProfile?.name || '');
  const [priceOrOffer, setPriceOrOffer] = useState('');
  const [shelfLocationNote, setShelfLocationNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVettingImage, setIsVettingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiBlockedReason, setAiBlockedReason] = useState<string | null>(null);
  const [alreadyFoundMatches, setAlreadyFoundMatches] = useState<BookSpotting[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setBookName('');
    setAuthorName('');
    setRequestNotes('');
    setSelectedStallId('');
    setCustomStallName('');
    setCustomHall('');
    setImages([]);
    setPriceOrOffer('');
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

  // Sync initialBookTitle & userProfile on open
  useEffect(() => {
    if (isOpen) {
      if (initialBookTitle) {
        setBookName(initialBookTitle);
      }
      if (userProfile?.name && !finderName) {
        setFinderName(userProfile.name);
      }
    }
  }, [isOpen, initialBookTitle, userProfile]);

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
  const notesViolation = modalMode === 'request' ? checkLocalProfanity(requestNotes) : { isClean: true };
  const locationViolation = modalMode === 'spot' ? checkLocalProfanity(shelfLocationNote) : { isClean: true };
  const otherFieldsViolation = checkLocalProfanity(`${priceOrOffer} ${finderName} ${customStallName}`);

  const localViolation = !bookNameViolation.isClean
    ? bookNameViolation
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
          const modRes = await fetch('/api/moderate-image', {
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

  const addPresetPhoto = (url: string) => {
    if (images.length >= 3) {
      setErrorMsg('Maximum 3 photos reached.');
      return;
    }
    setImages(prev => [...prev, url].slice(0, 3));
    setErrorMsg(null);
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
      const effectiveFinder = finderName.trim() || userProfile?.name || 'Fair Visitor';

      if (modalMode === 'request') {
        const payload = {
          postType: 'request',
          bookName: bookName.trim(),
          finderName: effectiveFinder,
          notes: requestNotes.trim() || undefined
        };

        const res = await fetch('/api/spots', {
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
        priceOrOffer: priceOrOffer.trim() || undefined,
        shelfLocationNote: shelfLocationNote.trim() || undefined
      };

      const res = await fetch('/api/spots', {
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

        {/* Community Peace & Safety Notice */}
        <div className="px-4 sm:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] font-bold text-zinc-500 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-1.5 text-[#075E54]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0" />
            <span>Sampath AI Shield: Multilingual Safety & Profanity Filter Active</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap text-[9px] font-bold">
            <span className="bg-zinc-200/80 text-zinc-700 px-1.5 py-0.5 rounded">English</span>
            <span className="bg-zinc-200/80 text-zinc-700 px-1.5 py-0.5 rounded">සිංහල (Sinhala)</span>
            <span className="bg-zinc-200/80 text-zinc-700 px-1.5 py-0.5 rounded">Singlish</span>
            <span className="bg-zinc-200/80 text-zinc-700 px-1.5 py-0.5 rounded">தமிழ் (Tamil)</span>
            <span className="bg-zinc-200/80 text-zinc-700 px-1.5 py-0.5 rounded">Tanglish</span>
          </div>
        </div>

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

          {/* 1. Book Name Input */}
          <div>
            <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Book Name *</span>
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
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1">
                  Details / Edition Notes (Optional)
                </label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => {
                    setRequestNotes(e.target.value);
                    if (aiBlockedReason) setAiBlockedReason(null);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g. Looking for Bloomsbury paperback edition, Sinhala translation, or children's illustrated version..."
                  rows={3}
                  className={`w-full px-3 py-2 bg-zinc-50 border rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:bg-white transition-all ${
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

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
                <p className="font-bold">How this appears on the group chat:</p>
                <p className="mt-1 italic text-zinc-700">
                  "{finderName || 'You'} is looking for {bookName || 'Harry Potter - Order of the Phoenix'}"
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Other visitors browsing BMICH stalls can tap "I Found This!" to tag you with the exact stall and shelf photo.
                </p>
              </div>
            </div>
          ) : (
            /* SPOTTED A BOOK FIELDS */
            <>
              {/* 2. Participating Stalls Dropdown */}
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

              {/* 3. Shelf Location Note */}
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Shelf / Aisle Location</span>
                  <span className="text-[10px] text-zinc-400 font-bold">Helps readers find it</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#F37021] absolute left-3 top-2.5" />
                  <input
                    type="text"
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

              {/* 4. Photos: Max 3 pictures inside the stall */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1">
                    <span>Shelf Photos</span>
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

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Quick Presets for Demo */}
                {images.length < 3 && (
                  <div className="mt-2 pt-2 border-t border-zinc-200">
                    <p className="text-[10px] font-bold text-zinc-500 mb-1.5">
                      Or pick sample BMICH fair photo:
                    </p>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {PRESET_STALL_PHOTOS.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => addPresetPhoto(preset.url)}
                          className="flex-shrink-0 px-2 py-1 bg-zinc-100 hover:bg-orange-100 text-zinc-700 hover:text-[#EA580C] rounded-lg text-[10px] font-semibold border border-zinc-200 transition-colors cursor-pointer"
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Price or Offer */}
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1">
                  Price / Fair Deal (Optional)
                </label>
                <input
                  type="text"
                  value={priceOrOffer}
                  onChange={(e) => setPriceOrOffer(e.target.value)}
                  placeholder="e.g. Rs. 1,800 (20% off with Sampath Card)"
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021] focus:bg-white"
                />
              </div>
            </>
          )}

          {/* Finder Name / Handle */}
          <div>
            <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Your Name / Handle</span>
              <span className="text-[10px] text-zinc-400 font-bold">Community Display</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                placeholder="e.g. Kasun or @kasun_reads"
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021] focus:bg-white"
              />
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