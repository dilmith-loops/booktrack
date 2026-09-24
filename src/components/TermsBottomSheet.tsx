import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Lock,
  CheckCircle2,
  Building2,
  CreditCard,
  Scale,
  Users,
  Eye,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface TermsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const TermsBottomSheet: React.FC<TermsBottomSheetProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Lock body scroll when bottom sheet is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col justify-end items-center bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      {/* Bottom Sheet Modal Container */}
      <div
        className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-t-[36px] shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[85vh] border-t border-orange-100 animate-in slide-in-from-bottom duration-300 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Handle Bar */}
        <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 hover:bg-zinc-400 transition-colors" />
        </div>

        {/* Top Header with Logos & Close Button */}
        <div className="px-5 sm:px-6 pt-2 pb-3.5 border-b border-zinc-100 flex items-center justify-between gap-3 bg-gradient-to-b from-orange-50/40 to-white">
          {/* Dual Brand Logos */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-orange-200/80 shadow-2xs">
              <img
                src={`${baseUrl}header-logo.png`}
                alt="Sampath Bank"
                className="h-5 sm:h-6 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = `${baseUrl}logo.png`;
                }}
              />
              <div className="h-4 w-[1px] bg-zinc-200" aria-hidden="true" />
              <img
                src={`${baseUrl}book-finder-logo.png`}
                alt="Book Finder"
                className="h-5 sm:h-6 w-auto object-contain"
              />
            </div>
            <div className="hidden xs:block text-left">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#EA580C]">
                Official Fair Guide
              </div>
              <div className="text-[11px] font-bold text-zinc-500">
                BMICH 2026
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            id="close-terms-sheet-btn"
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Segmented Tab Switcher */}
        <div className="px-5 sm:px-6 pt-3 pb-2.5 bg-white border-b border-zinc-100">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2
                id="legal-modal-title"
                className="text-base sm:text-lg font-black text-zinc-900 tracking-tight"
              >
                {activeTab === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium">
                Colombo International Book Fair 2026 • Powered by Sampath Bank PLC
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200 flex-shrink-0">
              v1.2 • Sep 2026
            </span>
          </div>

          {/* Tab Selector Buttons */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100/90 rounded-xl text-xs font-black">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              id="tab-terms-of-use"
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Use</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              id="tab-privacy-policy"
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-[13px] text-zinc-700 leading-relaxed scrollbar-thin">
          {activeTab === 'terms' ? (
            /* ================= TERMS OF USE ================= */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200 text-orange-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-xs text-[#EA580C]">
                  <Scale className="w-4 h-4" />
                  <span>Welcome to Sampath Book Finder</span>
                </div>
                <p className="text-[11px] leading-normal text-zinc-700">
                  By accessing, creating an account on, or interacting with Sampath Book Finder, you agree to comply with and be bound by the terms outlined below.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-1.5">
                <h3 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  Purpose of the Platform
                </h3>
                <p className="text-zinc-600 text-xs pl-7">
                  Sampath Book Finder is an interactive community application dedicated exclusively to visitors, readers, and exhibitors at the <strong>Colombo International Book Fair 2026</strong> (BMICH, Colombo). It enables community members to discover book stalls, share shelf spottings, locate publisher halls, and benefit from Sampath Bank partner promotions.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-1.5">
                <h3 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  Community Spotting & Content Guidelines
                </h3>
                <div className="text-zinc-600 text-xs pl-7 space-y-1.5">
                  <p>When sharing a book sighting or creating a book request, you agree that:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>All book titles, prices, and stall numbers submitted are accurate and shared in good faith.</li>
                    <li>Photos uploaded represent genuine book covers, shelves, or fair displays. Do not photograph attendee faces without express consent.</li>
                    <li>No commercial advertisements, unauthorized promotions, defamatory remarks, hate speech, or inappropriate material may be posted.</li>
                    <li>Community posts may be reviewed and unlisted by moderators if found misleading or fraudulent.</li>
                  </ul>
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-1.5">
                <h3 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  Sampath Bank Cardholder Privileges
                </h3>
                <div className="text-zinc-600 text-xs pl-7 space-y-1.5">
                  <p>
                    Special discounts and offers displayed for Sampath Bank Credit and Debit cardholders are provided in collaboration with participating fair publishers.
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    Offers are subject to individual merchant stock availability and merchant payment terminal operation. Sampath Bank PLC and the app organizers are not responsible for merchant inventory changes.
                  </p>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-1.5">
                <h3 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                  Account Moderation & Suspensions
                </h3>
                <p className="text-zinc-600 text-xs pl-7">
                  To protect our fair community, administrators reserve the absolute right to suspend, disable, or terminate accounts found posting fraudulent spots, scraping user directories, or harassing attendees. Disabled accounts are logged out automatically and restricted from community features.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-1.5">
                <h3 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center font-bold">5</span>
                  Intellectual Property & Trademarks
                </h3>
                <p className="text-zinc-600 text-xs pl-7">
                  The Sampath Bank name, orange branding, logos, and the Book Finder insignia are registered trademarks and property of <strong>Sampath Bank PLC</strong> and the Colombo International Book Fair. All book cover images and publisher names belong to their respective publishers and copyright owners.
                </p>
              </div>
            </div>
          ) : (
            /* ================= PRIVACY POLICY ================= */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-xs text-emerald-800">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Your Privacy at Colombo International Book Fair</span>
                </div>
                <p className="text-[11px] leading-normal text-zinc-700">
                  Sampath Book Finder respects your privacy and is dedicated to handling your personal details with transparency, security, and integrity.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-1.5">
                <h3 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  What Information We Collect
                </h3>
                <div className="text-zinc-600 text-xs pl-7 space-y-1">
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Account Profile:</strong> Your full name, chosen handle (`@username`), email address, and mobile phone number for verification and sign-in.</li>
                    <li><strong>User-Generated Content:</strong> Books you have spotted or requested, uploaded book shelf photos, and helpful upvotes.</li>
                    <li><strong>Cardholder Status:</strong> An optional indicator whether you hold a Sampath Bank card, used strictly to highlight relevant fair discounts.</li>
                    <li><strong>Usage Analytics:</strong> Anonymous telemetry and page navigation via Google Analytics 4 (GA4) to optimize stall routing and server performance during the fair.</li>
                  </ul>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-1.5">
                <h3 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  How Your Data Is Used
                </h3>
                <div className="text-zinc-600 text-xs pl-7 space-y-1">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>To verify community posts and attribute sightings to your fair handle.</li>
                    <li>To deliver instant notifications when a book on your wishlist is spotted.</li>
                    <li>To safeguard the community from malicious activity, bots, and spam.</li>
                    <li>We <strong>never sell, lease, or distribute</strong> your personal contact details to external marketing agencies.</li>
                  </ul>
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-1.5">
                <h3 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  Public vs. Private Information
                </h3>
                <div className="text-zinc-600 text-xs pl-7 space-y-1.5">
                  <p>
                    <strong>Publicly Visible:</strong> Your display name, handle (`@username`), and your spotted books feed are visible to fellow fair-goers.
                  </p>
                  <p>
                    <strong>Private & Confidential:</strong> Your email address, phone number, and account password hashes are kept strictly private and never published.
                  </p>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-1.5">
                <h3 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                  Data Storage & Your Rights
                </h3>
                <div className="text-zinc-600 text-xs pl-7 space-y-1.5">
                  <p>
                    You can review, modify, or update your registered name, email, and phone number at any time via the <strong>Edit Profile</strong> dialog.
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    If you wish to delete your account or retract your submissions, please reach out to an administrator or the on-site Sampath Bank Book Fair Help Desk at BMICH.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 sm:p-5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>Sampath Bank PLC • BMICH Fair 2026</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            id="acknowledge-terms-btn"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-black shadow-sm hover:shadow transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span>I Understand</span>
          </button>
        </div>
      </div>
    </div>
  );
};
