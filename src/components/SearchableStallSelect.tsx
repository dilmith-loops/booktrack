import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Building2, Check, MapPin, Sparkles } from 'lucide-react';
import { Stall } from '../types';

interface SearchableStallSelectProps {
  stalls: Stall[];
  selectedStallId: string;
  onSelectStallId: (stallId: string) => void;
  onSelectOtherWithCustomName?: (name: string) => void;
  placeholder?: string;
  error?: boolean;
}

export const SearchableStallSelect: React.FC<SearchableStallSelectProps> = ({
  stalls,
  selectedStallId,
  onSelectStallId,
  onSelectOtherWithCustomName,
  placeholder = '-- Choose participating book stall --',
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHallFilter, setSelectedHallFilter] = useState('All');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find currently selected stall object
  const selectedStall = useMemo(() => {
    if (!selectedStallId || selectedStallId === 'other') return null;
    return stalls.find((s) => s.id === selectedStallId) || null;
  }, [stalls, selectedStallId]);

  // Extract unique halls for quick-filter tabs
  const availableHalls = useMemo(() => {
    const halls = new Set<string>();
    stalls.forEach((s) => {
      if (s.hall) halls.add(s.hall.trim());
    });
    return ['All', ...Array.from(halls).sort()];
  }, [stalls]);

  // Filter stalls by search term and hall filter
  const filteredStalls = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return stalls.filter((s) => {
      if (s.isHidden) return false;

      // Hall filter
      if (selectedHallFilter !== 'All' && s.hall.trim() !== selectedHallFilter) {
        return false;
      }

      // Search query filter (matches name, hall, stallNumber, or discount)
      if (!term) return true;
      const nameMatch = s.name.toLowerCase().includes(term);
      const hallMatch = s.hall.toLowerCase().includes(term);
      const numberMatch = s.stallNumber.toLowerCase().includes(term);
      const discountMatch = s.specialDiscount?.toLowerCase().includes(term);

      return nameMatch || hallMatch || numberMatch || discountMatch;
    });
  }, [stalls, searchTerm, selectedHallFilter]);

  // Auto focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setHighlightedIndex(0);
    } else {
      setSearchTerm('');
      setSelectedHallFilter('All');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredStalls.length)); // +1 for "other" option
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredStalls.length) {
        handleSelect(filteredStalls[highlightedIndex].id);
      } else if (highlightedIndex === filteredStalls.length) {
        handleSelectOther(searchTerm.trim() || undefined);
      } else if (filteredStalls.length === 0 && searchTerm.trim()) {
        handleSelectOther(searchTerm.trim());
      }
    }
  };

  const handleSelect = (id: string) => {
    onSelectStallId(id);
    setIsOpen(false);
  };

  const handleSelectOther = (customName?: string) => {
    onSelectStallId('other');
    if (customName && onSelectOtherWithCustomName) {
      onSelectOtherWithCustomName(customName);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectStallId('');
  };

  // Auto scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={containerRef} className="relative w-full text-left" onKeyDown={handleKeyDown}>
      {/* Hidden input for form / accessibility */}
      <input type="hidden" id="post-stall-select" name="stallId" value={selectedStallId} />

      {/* 1. Main Trigger Button (Select2 Style) */}
      <button
        type="button"
        id="post-stall-select-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full min-h-[44px] px-3.5 py-2.5 bg-zinc-50 border rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer text-left ${
          isOpen
            ? 'bg-white ring-2 ring-[#F37021] border-[#F37021] shadow-xs'
            : error
            ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
            : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-100/50'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedStall ? (
            <div className="flex items-center gap-1.5 flex-wrap min-w-0 truncate">
              <span className="text-zinc-900 font-bold truncate">{selectedStall.name}</span>
              <span className="bg-zinc-200/80 text-zinc-700 text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0">
                {selectedStall.hall} • {selectedStall.stallNumber}
              </span>
              {selectedStall.specialDiscount && (
                <span className="bg-orange-100 text-[#C84F0E] text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0">
                  {selectedStall.specialDiscount}
                </span>
              )}
            </div>
          ) : selectedStallId === 'other' ? (
            <span className="text-[#EA580C] font-black">+ Other BMICH Fairground Stall (Custom)</span>
          ) : (
            <span className="text-zinc-900 font-bold truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selectedStallId && (
            <span
              onClick={handleClear}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/70 transition-colors"
              title="Clear selection"
              role="button"
              tabIndex={-1}
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#F37021]' : ''}`}
          />
        </div>
      </button>

      {/* 2. Select2 Searchable Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-zinc-200/95 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2.5 bg-zinc-50/90 border-b border-zinc-200/80 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                id="stall-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type stall name, hall (e.g. Hall A), or number..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#F37021] focus:border-[#F37021] shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Hall Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {availableHalls.map((hall) => (
                <button
                  key={hall}
                  type="button"
                  onClick={() => setSelectedHallFilter(hall)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedHallFilter === hall
                      ? 'bg-[#F37021] text-white shadow-2xs'
                      : 'bg-zinc-200/70 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {hall}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            role="listbox"
            id="stall-search-results"
            className="max-h-60 overflow-y-auto divide-y divide-zinc-100 p-1"
          >
            {filteredStalls.length === 0 ? (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-zinc-500 font-medium">
                  No stalls found matching "<strong className="text-zinc-800">{searchTerm}</strong>"
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectOther(searchTerm.trim())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#EA580C] text-xs font-black border border-orange-200 transition-colors cursor-pointer"
                >
                  <span>Use "{searchTerm.trim()}" as custom stall</span>
                </button>
              </div>
            ) : (
              filteredStalls.map((s, idx) => {
                const isSelected = selectedStallId === s.id;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={s.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(s.id)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-orange-50/90 text-orange-950 font-bold border border-orange-200/60'
                        : isHighlighted
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="mt-0.5 text-zinc-400">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-[#F37021]' : 'text-zinc-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 truncate">{s.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-zinc-500 font-semibold">
                            {s.hall} • Stall {s.stallNumber}
                          </span>
                          {s.specialDiscount && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#C84F0E] bg-orange-100/80 px-1.5 py-0.2 rounded">
                              <Sparkles className="w-2.5 h-2.5 text-[#F37021]" />
                              {s.specialDiscount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#F37021] flex-shrink-0 font-bold" />
                    )}
                  </div>
                );
              })
            )}

            {/* Always-accessible "+ Other BMICH Fairground Stall" Option */}
            <div
              role="option"
              aria-selected={selectedStallId === 'other'}
              onClick={() => handleSelectOther()}
              onMouseEnter={() => setHighlightedIndex(filteredStalls.length)}
              className={`p-2.5 mt-1 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between border-t border-dashed border-zinc-200 ${
                selectedStallId === 'other'
                  ? 'bg-orange-50 text-orange-950 font-bold'
                  : highlightedIndex === filteredStalls.length
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-[#EA580C] hover:bg-orange-50/50 font-bold'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-orange-100 text-[#EA580C] flex items-center justify-center font-black text-xs">
                  +
                </span>
                <span>Other BMICH Fairground Stall...</span>
                <span className="text-[10px] text-zinc-400 font-normal">(Not in official list)</span>
              </div>
              {selectedStallId === 'other' && <Check className="w-4 h-4 text-[#EA580C]" />}
            </div>
          </div>

          {/* Results Footer Count */}
          <div className="px-3 py-1.5 bg-zinc-50 border-t border-zinc-200/80 flex items-center justify-between text-[10px] text-zinc-500">
            <span>
              {filteredStalls.length} {filteredStalls.length === 1 ? 'stall' : 'stalls'} available
            </span>
            <span className="text-zinc-400">Press Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
};
