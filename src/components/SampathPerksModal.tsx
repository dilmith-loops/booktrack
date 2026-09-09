import React from 'react';
import { X, CreditCard, Sparkles, ShieldCheck, Gift, Check, Phone } from 'lucide-react';

interface SampathPerksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SampathPerksModal: React.FC<SampathPerksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border-3 border-black rounded-2xl w-full max-w-lg shadow-[8px_8px_0px_#000] my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-[#F37021] text-white p-4 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg border border-black shadow-xs flex-shrink-0">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Sampath Bank"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <div className="bg-black text-white text-[10px] font-black px-2 py-0.5 rounded inline-block uppercase tracking-wider mb-0.5">
                Official Book Fair Sponsor
              </div>
              <h3 className="text-sm sm:text-base font-black text-black">
                SAMPATH BANK PLC PRIVILEGES
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-sampath-perks-btn"
            className="w-8 h-8 rounded-lg bg-black text-white hover:bg-zinc-800 flex items-center justify-center border border-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 bg-orange-50 border-2 border-black rounded-xl shadow-[3px_3px_0px_#000]">
            <div className="flex items-center gap-2 text-black font-black text-sm mb-1">
              <CreditCard className="w-5 h-5 text-[#F37021]" />
              <span>Exclusive 10% to 25% Instant Savings</span>
            </div>
            <p className="text-xs text-zinc-700 font-medium">
              Enjoy direct discounts on books, stationery, and publications across Sarasavi, M.D. Gunasena, Vijitha Yapa, Expographic, and other participating BMICH stalls when paying with your Sampath Bank Credit or Debit Card.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-black uppercase tracking-wider">
              Special Fair Facilities by Sampath Bank:
            </h4>

            <div className="flex items-start gap-2.5 text-xs text-zinc-800 font-semibold p-2 bg-zinc-50 border border-zinc-300 rounded-lg">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Mobile ATMs & Cash Counters:</strong> Located at Sirimavo Bandaranaike Hall & Main Entrance for quick cash withdrawals without long queues.
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-zinc-800 font-semibold p-2 bg-zinc-50 border border-zinc-300 rounded-lg">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Sampath WePay:</strong> Contactless QR payments enabled at over 150 stalls throughout the fair.
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-zinc-800 font-semibold p-2 bg-zinc-50 border border-zinc-300 rounded-lg">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Youth & Student Account Stalls:</strong> Visit the Sampath Bank Youth Pavilion at BMICH Lobby to open accounts and receive free book vouchers!
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-zinc-800 font-semibold p-2 bg-zinc-50 border border-zinc-300 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-[#F37021] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Safe Digital Community:</strong> Proudly powering this AI-moderated book spotting platform to ensure a positive, profanity-free experience for everyone.
              </span>
            </div>
          </div>

          <div className="p-3 bg-black text-white rounded-xl text-center space-y-1">
            <p className="text-xs font-bold text-[#F37021]">Sampath Bank 24/7 Customer Care</p>
            <p className="text-sm font-extrabold flex items-center justify-center gap-1.5">
              <Phone className="w-4 h-4 text-[#F37021]" />
              011 2 30 30 50 • www.sampath.lk
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
