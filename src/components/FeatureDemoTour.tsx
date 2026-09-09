import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Search,
  Building2,
  CreditCard,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X
} from 'lucide-react';
import { PwaTab } from '../types';

interface FeatureDemoTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: PwaTab) => void;
}

interface TourStep {
  title: string;
  tab: PwaTab;
  badge: string;
  description: string;
  details: string[];
  icon: React.ReactNode;
  accentColor: string;
}

export const FeatureDemoTour: React.FC<FeatureDemoTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      title: 'Real-Time Book Sighting Feed',
      tab: 'chat',
      badge: 'Live Crowd Spotting',
      description:
        'See what books fellow fair visitors are discovering right now across BMICH stalls.',
      details: [
        'Live photos of books on stall shelves with real pricing & discounts',
        'Stall numbers (Hall A, B, C, D, E & Sirimavo Hall) and exact shelf directions',
        'Upvote helpful spots or rate availability to keep everyone updated'
      ],
      icon: <BookOpen className="w-6 h-6 text-[#F37021]" />,
      accentColor: 'from-[#F37021] to-[#EA580C]'
    },
    {
      title: 'Find Any Book or Request Help',
      tab: 'radar',
      badge: 'Find a Book',
      description:
        'Instant multi-stall book search with community request matchmaking.',
      details: [
        'Search for English, Sinhala, or Tamil titles across all 150+ stalls',
        'Cannot find your book? Post a book request and community spotters will find it for you',
        'Protected by Sampath AI Safety & Multilingual profanity filters'
      ],
      icon: <Search className="w-6 h-6 text-amber-500" />,
      accentColor: 'from-amber-500 to-amber-700'
    },
    {
      title: 'Interactive Stalls Directory',
      tab: 'stalls',
      badge: 'BMICH Fair Stalls',
      description:
        'Complete interactive directory of all publishers and bookstores at the fair.',
      details: [
        'Filter by Hall (Hall A, B, C, D, E & Sirimavo Hall)',
        'Check specific stall numbers (e.g. Sarasavi C10, Godage D01)',
        'Direct contact details, categories, and publisher announcements'
      ],
      icon: <Building2 className="w-6 h-6 text-sky-500" />,
      accentColor: 'from-sky-500 to-sky-700'
    },
    {
      title: 'Exclusive Sampath Bank Perks',
      tab: 'perks',
      badge: 'Promotions',
      description:
        'Save more with special cardholder discounts and Colombo Book Fair promotions.',
      details: [
        'Instant 15% discount for Sampath Bank Debit and Credit cardholders',
        'Special stall combo bundles & publisher book fair coupons',
        'Real-time announcements from the fair organizing committee'
      ],
      icon: <CreditCard className="w-6 h-6 text-emerald-500" />,
      accentColor: 'from-emerald-500 to-emerald-700'
    },
    {
      title: 'Spot a Book & Earn Spotter Rank',
      tab: 'chat',
      badge: 'Community Contributor',
      description:
        'Tap the orange (+) button at the bottom of the screen anytime to share a discovery.',
      details: [
        'Snap or upload a photo of any book you see at a stall',
        'Tag the stall and shelf note so others can walk right up to it',
        'Help answer open book requests from fairgoers and earn spotter badges'
      ],
      icon: <PlusCircle className="w-6 h-6 text-[#F37021]" />,
      accentColor: 'from-[#F37021] to-[#C2410C]'
    }
  ];

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onNavigateTab(steps[nextIndex].tab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onNavigateTab(steps[prevIndex].tab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-lg shadow-[0_25px_70px_rgba(0,0,0,0.4)] overflow-hidden my-auto">
        {/* Top Header */}
        <div className={`p-4 sm:p-5 bg-gradient-to-r ${currentStep.accentColor} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-black uppercase tracking-wider text-white">
                <span>Sampath Book Finder</span>
                <span>•</span>
                <span>Feature Tour</span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                {currentStep.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-feature-demo-btn"
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center flex-shrink-0 shadow-xs">
              {currentStep.icon}
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-orange-50 text-[#EA580C] border border-orange-200 mb-1.5">
                {currentStep.badge}
              </div>
              <p className="text-sm font-bold text-zinc-900 leading-snug">
                {currentStep.description}
              </p>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 space-y-2.5">
            <div className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
              Key Capabilities
            </div>
            {currentStep.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 font-medium leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{detail}</span>
              </div>
            ))}
          </div>

          {/* Step Dots & Progress */}
          <div className="pt-2 flex items-center justify-between border-t border-zinc-200">
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'w-6 bg-[#F37021]'
                      : 'w-2 bg-zinc-300'
                  }`}
                />
              ))}
              <span className="text-[11px] font-bold text-zinc-500 ml-2">
                {currentStepIndex + 1} of {steps.length}
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  id="tour-prev-btn"
                  className="px-3.5 py-2 rounded-xl text-xs font-black text-zinc-600 bg-zinc-100 hover:bg-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                id="tour-next-btn"
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <span>{currentStepIndex === steps.length - 1 ? 'Start Spotting!' : 'Next Feature'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
