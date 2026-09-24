import React, { useState } from 'react';
import { X, MapPin, Search, Tag, Sparkles, Building2 } from 'lucide-react';
import { Stall } from '../types';

interface StallDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stalls: Stall[];
  onSelectStallForSpot: (stall: Stall) => void;
}

export const StallDirectoryModal: React.FC<StallDirectoryModalProps> = ({
  isOpen,
  onClose,
  stalls,
  onSelectStallForSpot
}) => {
  const [search, setSearch] = useState('');
  const [selectedHall, setSelectedHall] = useState('All');

  if (!isOpen) return null;

  const halls = ['All', 'Hall A', 'Hall B', 'Hall C', 'Hall D', 'Hall E', 'Sirimavo Hall'];

  const filtered = stalls.filter((s) => {
    if (s.isHidden) return false;
    const matchesHall = selectedHall === 'All' || s.hall.toLowerCase().includes(selectedHall.toLowerCase());
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.stallNumber.toLowerCase().includes(search.toLowerCase());
    return matchesHall && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border-3 border-black rounded-2xl w-full max-w-2xl shadow-[8px_8px_0px_#000] my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-[#F37021] text-white p-3.5 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-black" />
            <h3 className="text-sm sm:text-base font-black text-black">
              BMICH STALL & PUBLISHER DIRECTORY (2026)
            </h3>
          </div>
          <button
            onClick={onClose}
            id="close-stall-dir-btn"
            className="w-8 h-8 rounded-lg bg-black text-white hover:bg-zinc-800 flex items-center justify-center border border-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-zinc-200 bg-orange-50/50 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#F37021] absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search publisher or category (e.g. Sarasavi, Manga, Classics)..."
              className="w-full pl-9 pr-3 py-2 bg-white border-2 border-black rounded-lg text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#F37021]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {halls.map((hall) => (
              <button
                key={hall}
                onClick={() => setSelectedHall(hall)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border border-black cursor-pointer transition-colors ${
                  selectedHall === hall ? 'bg-black text-[#F37021]' : 'bg-white text-black hover:bg-orange-100'
                }`}
              >
                {hall}
              </button>
            ))}
          </div>
        </div>

        {/* Stalls List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 font-bold text-xs">
              No stalls found matching your search.
            </div>
          ) : (
            filtered.map((stall) => (
              <div
                key={stall.id}
                className="p-3 bg-white hover:bg-orange-50 border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-black">{stall.name}</span>
                    <span className="bg-[#F37021] text-white text-[10px] font-extrabold px-2 py-0.5 rounded border border-black">
                      {stall.hall} • {stall.stallNumber}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 font-medium mt-0.5">
                    {stall.category}
                  </p>
                  {stall.specialDiscount && (
                    <div className="text-[11px] text-[#C84F0E] font-extrabold flex items-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3 text-[#F37021]" />
                      <span>{stall.specialDiscount}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    onSelectStallForSpot(stall);
                    onClose();
                  }}
                  className="self-start sm:self-auto px-3 py-1.5 bg-black hover:bg-[#F37021] text-white text-xs font-bold rounded-lg border border-black cursor-pointer transition-colors whitespace-nowrap"
                >
                  Spot Book Here →
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
