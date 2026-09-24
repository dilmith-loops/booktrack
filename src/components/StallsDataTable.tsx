import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  Tag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Square,
  Gift,
  BookOpen,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Percent,
  EyeOff,
  Upload
} from 'lucide-react';
import { Stall, BookSpotting } from '../types';
import { ImportStallsModal } from './ImportStallsModal';

interface StallsDataTableProps {
  stalls: Stall[];
  spots?: BookSpotting[];
  onDeleteStall: (stallId: string) => void;
  onUpdateStall?: (stallId: string, updatedFields: Partial<Stall>) => void;
  onAddStall?: (newStall: Stall) => void;
  onToggleHideStall?: (stallId: string) => void;
  onImportStalls?: (stalls: Stall[], mode: 'replace' | 'append') => Promise<void> | void;
}

type SortField = 'name' | 'hall' | 'stallNumber' | 'category' | 'spotsCount';
type SortOrder = 'asc' | 'desc';

export const StallsDataTable: React.FC<StallsDataTableProps> = ({
  stalls,
  spots = [],
  onDeleteStall,
  onUpdateStall,
  onAddStall,
  onToggleHideStall,
  onImportStalls
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHall, setFilterHall] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDiscount, setFilterDiscount] = useState<'all' | 'with_discount' | 'without_discount'>('all');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'visible' | 'hidden'>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Row Selection for Bulk Operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal States
  const [viewingStall, setViewingStall] = useState<Stall | null>(null);
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    hall: 'Hall A',
    stallNumber: '',
    category: 'General Books & Fiction',
    specialDiscount: '15% Instant Off with Sampath Card'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Map of spots count per stall
  const spotsPerStall = useMemo(() => {
    const map = new Map<string, BookSpotting[]>();
    for (const spot of spots) {
      const list = map.get(spot.stallId) || [];
      list.push(spot);
      map.set(spot.stallId, list);
    }
    return map;
  }, [spots]);

  // Unique halls list
  const hallsList = useMemo(() => {
    const set = new Set<string>();
    stalls.forEach((s) => {
      if (s.hall) set.add(s.hall);
    });
    return Array.from(set).sort();
  }, [stalls]);

  // Unique categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    stalls.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [stalls]);

  // Filtered Stalls
  const filteredStalls = useMemo(() => {
    return stalls.filter((stall) => {
      // Hall filter
      if (filterHall !== 'all' && stall.hall !== filterHall) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'all' && stall.category !== filterCategory) {
        return false;
      }

      // Discount filter
      if (filterDiscount === 'with_discount' && !stall.specialDiscount) {
        return false;
      }
      if (filterDiscount === 'without_discount' && stall.specialDiscount) {
        return false;
      }

      // Visibility filter
      if (filterVisibility === 'visible' && stall.isHidden) {
        return false;
      }
      if (filterVisibility === 'hidden' && !stall.isHidden) {
        return false;
      }

      // Text search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = stall.name.toLowerCase().includes(q);
        const matchHall = stall.hall.toLowerCase().includes(q);
        const matchNum = stall.stallNumber.toLowerCase().includes(q);
        const matchCat = stall.category?.toLowerCase().includes(q);
        const matchDisc = stall.specialDiscount?.toLowerCase().includes(q);

        if (!matchName && !matchHall && !matchNum && !matchCat && !matchDisc) {
          return false;
        }
      }

      return true;
    });
  }, [stalls, filterHall, filterCategory, filterDiscount, filterVisibility, searchQuery]);

  const hiddenCount = useMemo(() => stalls.filter((s) => s.isHidden).length, [stalls]);
  const visibleCount = stalls.length - hiddenCount;

  // Sorted Stalls
  const sortedStalls = useMemo(() => {
    const list = [...filteredStalls];
    list.sort((a, b) => {
      let valA: any = a[sortField as keyof Stall];
      let valB: any = b[sortField as keyof Stall];

      if (sortField === 'spotsCount') {
        valA = (spotsPerStall.get(a.id) || []).length;
        valB = (spotsPerStall.get(b.id) || []).length;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredStalls, sortField, sortOrder, spotsPerStall]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedStalls.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedStalls = sortedStalls.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Selection handlers
  const handleSelectAllOnPage = () => {
    const pageIds = paginatedStalls.map((s) => s.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // CRUD Handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.stallNumber.trim()) {
      alert('Please fill in Publisher/Stall Name and Stall Number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newId = `stall-${Date.now()}`;
      const newStall: Stall = {
        id: newId,
        name: createForm.name.trim(),
        hall: createForm.hall.trim(),
        stallNumber: createForm.stallNumber.trim(),
        category: createForm.category.trim() || 'General Books & Fiction',
        specialDiscount: createForm.specialDiscount.trim() || undefined
      };

      if (onAddStall) {
        await onAddStall(newStall);
      }

      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        hall: 'Hall A',
        stallNumber: '',
        category: 'General Books & Fiction',
        specialDiscount: '15% Instant Off with Sampath Card'
      });
      showToast(`Registered stall "${newStall.name}" successfully!`);
    } catch (err) {
      console.error('Failed to create stall:', err);
      showToast('Error registering stall. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStall) return;

    setIsSubmitting(true);
    try {
      const updatedFields: Partial<Stall> = {
        name: editingStall.name.trim(),
        hall: editingStall.hall.trim(),
        stallNumber: editingStall.stallNumber.trim(),
        category: editingStall.category.trim(),
        specialDiscount: editingStall.specialDiscount?.trim() || undefined
      };

      if (onUpdateStall) {
        await onUpdateStall(editingStall.id, updatedFields);
      }

      setEditingStall(null);
      showToast(`Updated stall "${editingStall.name}" successfully!`);
    } catch (err) {
      console.error('Failed to update stall:', err);
      showToast('Error saving changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmId) return;
    try {
      await onDeleteStall(deleteConfirmId);
      selectedIds.delete(deleteConfirmId);
      setSelectedIds(new Set(selectedIds));
      setDeleteConfirmId(null);
      if (viewingStall?.id === deleteConfirmId) {
        setViewingStall(null);
      }
      showToast('Fair stall deleted successfully.');
    } catch (err) {
      console.error('Failed to delete stall:', err);
      showToast('Error deleting stall.');
    }
  };

  const handleBulkDeleteConfirmed = async () => {
    try {
      for (const id of Array.from(selectedIds)) {
        await onDeleteStall(id);
      }
      const count = selectedIds.size;
      setSelectedIds(new Set());
      setIsBulkDeleteConfirm(false);
      showToast(`Successfully deleted ${count} stalls.`);
    } catch (err) {
      console.error('Failed to bulk delete stalls:', err);
      showToast('Error during bulk deletion.');
    }
  };

  const getHallBadgeColor = (hall: string) => {
    if (hall.includes('A')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (hall.includes('B')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (hall.includes('C')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (hall.includes('D')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (hall.includes('E')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (hall.includes('Sirimavo')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#F37021] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Header & Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-sm">
        {/* Top bar: Search & Register Button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by publisher name, hall, stall number, or special offer..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {onImportStalls && (
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                id="open-import-stalls-btn"
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4 text-[#F37021]" />
                <span>Import Stalls (CSV)</span>
              </button>
            )}

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-[#F37021] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Register Fair Stall</span>
            </button>
          </div>
        </div>

        {/* Filter Pills / Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold mr-1">
              <Filter className="w-3.5 h-3.5 text-[#F37021]" />
              <span>Filters:</span>
            </div>

            {/* Hall Filter */}
            <select
              value={filterHall}
              onChange={(e) => {
                setFilterHall(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#F37021] cursor-pointer"
            >
              <option value="all">All Halls ({stalls.length})</option>
              {hallsList.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#F37021] cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Discount Filter */}
            <select
              value={filterDiscount}
              onChange={(e) => {
                setFilterDiscount(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#F37021] cursor-pointer"
            >
              <option value="all">All Discounts</option>
              <option value="with_discount">Sampath Offers Only 🎁</option>
              <option value="without_discount">No Special Offer</option>
            </select>

            {/* Visibility Filter */}
            <select
              value={filterVisibility}
              onChange={(e) => {
                setFilterVisibility(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#F37021] cursor-pointer"
            >
              <option value="all">All Visibility ({stalls.length})</option>
              <option value="visible">Visible in App ({visibleCount})</option>
              <option value="hidden">Hidden from App ({hiddenCount})</option>
            </select>

            {/* Reset Filters button if active */}
            {(searchQuery || filterHall !== 'all' || filterCategory !== 'all' || filterDiscount !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterHall('all');
                  setFilterCategory('all');
                  setFilterDiscount('all');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-zinc-400">
            <span>
              Showing <strong className="text-white">{filteredStalls.length}</strong> of {stalls.length} stalls
            </span>

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs font-bold text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#F37021] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar (When Rows Selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-[#F37021]/15 border border-[#F37021]/40 rounded-xl px-4 py-3 flex items-center justify-between text-xs font-bold text-orange-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="bg-[#F37021] text-white px-2 py-0.5 rounded-full text-[11px] font-black">
              {selectedIds.size}
            </span>
            <span>stalls selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onUpdateStall) {
                  for (const id of selectedIds) {
                    onUpdateStall(id, { isHidden: true });
                  }
                  showToast(`${selectedIds.size} stalls hidden from public app.`);
                  setSelectedIds(new Set());
                }
              }}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Hide selected stalls from public view"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide Selected</span>
            </button>
            <button
              onClick={() => {
                if (onUpdateStall) {
                  for (const id of selectedIds) {
                    onUpdateStall(id, { isHidden: false });
                  }
                  showToast(`${selectedIds.size} stalls made visible in public app.`);
                  setSelectedIds(new Set());
                }
              }}
              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 hover:text-black text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Show selected stalls in public view"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Show Selected</span>
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setIsBulkDeleteConfirm(true)}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500 hover:text-white text-red-300 border border-red-500/40 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* DataTable Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300 border-collapse">
            {/* Table Header */}
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider text-[10px] font-black border-b border-zinc-800 select-none">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button
                    onClick={handleSelectAllOnPage}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                    title="Select all on current page"
                  >
                    {paginatedStalls.length > 0 &&
                    paginatedStalls.every((s) => selectedIds.has(s.id)) ? (
                      <CheckSquare className="w-4 h-4 text-[#F37021]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                <th
                  onClick={() => handleSort('name')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Publisher / Stall Name</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('hall')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Hall Location</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('stallNumber')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Stall Number</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('category')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category / Genre</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  </div>
                </th>

                <th className="p-3.5">
                  <div className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-[#F37021]" />
                    <span>Special Fair Offer / Sampath Perk</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('spotsCount')}
                  className="p-3.5 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Sightings</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  </div>
                </th>

                <th className="p-3.5 text-right w-28">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {paginatedStalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Building2 className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
                      <p className="font-bold text-sm">No fair stalls found</p>
                      <p className="text-xs text-zinc-600">
                        Try modifying your search or filters, or register a new stall.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStalls.map((stall) => {
                  const isSelected = selectedIds.has(stall.id);
                  const stallSpots = spotsPerStall.get(stall.id) || [];

                  return (
                    <tr
                      key={stall.id}
                      className={`hover:bg-zinc-800/40 transition-colors group ${
                        isSelected ? 'bg-[#F37021]/5' : ''
                      }`}
                    >
                      {/* Select Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelectOne(stall.id)}
                          className="text-zinc-500 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#F37021]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & ID */}
                      <td className="p-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-zinc-300 group-hover:border-[#F37021]/50 group-hover:text-[#F37021] transition-colors">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="font-black text-white text-xs hover:text-[#F37021] transition-colors cursor-pointer"
                                onClick={() => setViewingStall(stall)}
                              >
                                {stall.name}
                              </span>
                              {stall.isHidden && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  <EyeOff className="w-2.5 h-2.5" />
                                  <span>Hidden</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              ID: {stall.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Hall Badge */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getHallBadgeColor(
                            stall.hall
                          )}`}
                        >
                          {stall.hall}
                        </span>
                      </td>

                      {/* Stall Number */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono font-bold text-zinc-200 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800 w-fit">
                          <MapPin className="w-3 h-3 text-[#F37021]" />
                          <span>{stall.stallNumber}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 max-w-[200px]">
                        <span className="text-zinc-300 text-xs truncate block" title={stall.category}>
                          {stall.category || 'General Books'}
                        </span>
                      </td>

                      {/* Special Discount */}
                      <td className="p-3.5 max-w-[260px]">
                        {stall.specialDiscount ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                            <Gift className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span className="truncate" title={stall.specialDiscount}>
                              {stall.specialDiscount}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[11px] italic">
                            Standard Fair Pricing
                          </span>
                        )}
                      </td>

                      {/* Sightings / Spots Count */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full text-[10px] font-black border ${
                            stallSpots.length > 0
                              ? 'bg-[#F37021]/20 text-[#F37021] border-[#F37021]/30 cursor-pointer hover:bg-[#F37021] hover:text-white transition-colors'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}
                          onClick={() => {
                            if (stallSpots.length > 0) {
                              setViewingStall(stall);
                            }
                          }}
                          title={`${stallSpots.length} community spots recorded for this stall`}
                        >
                          {stallSpots.length}
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Show / Hide Stall */}
                          {onToggleHideStall && (
                            <button
                              onClick={() => onToggleHideStall(stall.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                stall.isHidden
                                  ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                              }`}
                              title={
                                stall.isHidden
                                  ? 'Currently Hidden from Public App (Click to Show)'
                                  : 'Currently Visible in Public App (Click to Hide)'
                              }
                            >
                              {stall.isHidden ? (
                                <EyeOff className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Eye className="w-4 h-4 text-zinc-400" />
                              )}
                            </button>
                          )}

                          {/* View Stall Details */}
                          <button
                            onClick={() => setViewingStall(stall)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="View Full Stall Details"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingStall({ ...stall })}
                            className="p-1.5 text-zinc-400 hover:text-[#F37021] hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Stall"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmId(stall.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Stall"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        <div className="p-4 bg-zinc-950/70 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-zinc-400">
          <div>
            Showing {sortedStalls.length === 0 ? 0 : startIndex + 1} to{' '}
            {Math.min(startIndex + itemsPerPage, sortedStalls.length)} of {sortedStalls.length} entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono text-xs">
              {validCurrentPage} / {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. CREATE STALL MODAL */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2 text-[#F37021] font-black text-sm uppercase tracking-wider">
                <Building2 className="w-5 h-5" />
                <span>Register New BMICH Fair Stall</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Publisher / Stall Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarasavi Bookshop, Vijitha Yapa, Godage..."
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Hall Location *
                  </label>
                  <select
                    value={createForm.hall}
                    onChange={(e) => setCreateForm({ ...createForm, hall: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021] cursor-pointer"
                  >
                    <option value="Hall A">Hall A</option>
                    <option value="Hall B">Hall B</option>
                    <option value="Hall C">Hall C</option>
                    <option value="Hall D">Hall D</option>
                    <option value="Hall E">Hall E</option>
                    <option value="Sirimavo Hall">Sirimavo Hall</option>
                    <option value="Outdoor Fairgrounds">Outdoor Fairgrounds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Stall Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A12 - A18, B04, S08"
                    value={createForm.stallNumber}
                    onChange={(e) => setCreateForm({ ...createForm, stallNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Category / Focus Genre
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sinhala Literature, Academic, Manga, Children's"
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Sampath Cardholder Special Offer / Fair Discount
                </label>
                <div className="relative">
                  <Gift className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. 15% instant discount with Sampath Card"
                    value={createForm.specialDiscount}
                    onChange={(e) => setCreateForm({ ...createForm, specialDiscount: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Optional. Highlighted to cardholders in the mobile app and fair directory.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#F37021] hover:bg-[#EA580C] text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Register Fair Stall</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. VIEW STALL DETAILS MODAL */}
      {/* ========================================================= */}
      {viewingStall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#F37021]" />
                <h3 className="text-sm font-black text-white">Stall Profile & Sightings</h3>
              </div>
              <button
                onClick={() => setViewingStall(null)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Header card */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-white">{viewingStall.name}</h2>
                    <span className="text-xs text-zinc-400 font-medium">
                      {viewingStall.category || 'General Books & Fiction'}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${getHallBadgeColor(
                      viewingStall.hall
                    )}`}
                  >
                    {viewingStall.hall}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2 text-xs font-mono text-zinc-300">
                  <span className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                    <MapPin className="w-3.5 h-3.5 text-[#F37021]" />
                    <span>Stall: <strong>{viewingStall.stallNumber}</strong></span>
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    ID: {viewingStall.id}
                  </span>
                </div>
              </div>

              {/* Special discount banner */}
              {viewingStall.specialDiscount && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400">
                  <Gift className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      Fair Exclusive Offer
                    </div>
                    <div className="text-xs font-bold text-white">
                      {viewingStall.specialDiscount}
                    </div>
                  </div>
                </div>
              )}

              {/* Community sightings at this stall */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#F37021]" />
                    <span>Books Spotted at This Stall ({(spotsPerStall.get(viewingStall.id) || []).length})</span>
                  </h4>
                </div>

                {(!spotsPerStall.get(viewingStall.id) || spotsPerStall.get(viewingStall.id)!.length === 0) ? (
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
                    No community book sightings recorded yet for this stall.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {spotsPerStall.get(viewingStall.id)!.map((sp) => (
                      <div
                        key={sp.id}
                        className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{sp.bookName}</div>
                          <div className="text-[10px] text-zinc-400">
                            By {sp.finderName} ({sp.finderHandle}) • {sp.priceOrOffer || 'Standard Price'}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            sp.status === 'In Stock'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {sp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmId(viewingStall.id);
                  }}
                  className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500 hover:text-white text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Stall</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const st = { ...viewingStall };
                      setViewingStall(null);
                      setEditingStall(st);
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#F37021]" />
                    <span>Edit Stall</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingStall(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. EDIT STALL MODAL */}
      {/* ========================================================= */}
      {editingStall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2 text-[#F37021] font-black text-sm uppercase tracking-wider">
                <Edit2 className="w-5 h-5" />
                <span>Edit Fair Stall</span>
              </div>
              <button
                onClick={() => setEditingStall(null)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Publisher / Stall Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingStall.name}
                  onChange={(e) => setEditingStall({ ...editingStall, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Hall Location *
                  </label>
                  <select
                    value={editingStall.hall}
                    onChange={(e) => setEditingStall({ ...editingStall, hall: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021] cursor-pointer"
                  >
                    <option value="Hall A">Hall A</option>
                    <option value="Hall B">Hall B</option>
                    <option value="Hall C">Hall C</option>
                    <option value="Hall D">Hall D</option>
                    <option value="Hall E">Hall E</option>
                    <option value="Sirimavo Hall">Sirimavo Hall</option>
                    <option value="Outdoor Fairgrounds">Outdoor Fairgrounds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Stall Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStall.stallNumber}
                    onChange={(e) => setEditingStall({ ...editingStall, stallNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Category / Focus Genre
                </label>
                <input
                  type="text"
                  value={editingStall.category || ''}
                  onChange={(e) => setEditingStall({ ...editingStall, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Sampath Cardholder Special Offer / Fair Discount
                </label>
                <div className="relative">
                  <Gift className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. 15% instant discount with Sampath Card"
                    value={editingStall.specialDiscount || ''}
                    onChange={(e) => setEditingStall({ ...editingStall, specialDiscount: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStall(null)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#F37021] hover:bg-[#EA580C] text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Stall Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-white">Remove Fair Stall?</h3>
              <p className="text-xs text-zinc-400">
                Are you sure you want to remove this stall from the BMICH fair directory? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md shadow-red-600/30 transition-colors cursor-pointer"
              >
                Yes, Delete Stall
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. BULK DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {isBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-white">
                Delete {selectedIds.size} Selected Stalls?
              </h3>
              <p className="text-xs text-zinc-400">
                This will permanently delete all {selectedIds.size} chosen stalls from the directory.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteConfirmed}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md shadow-red-600/30 transition-colors cursor-pointer"
              >
                Delete {selectedIds.size} Stalls
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {onImportStalls && (
        <ImportStallsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportStalls={async (importedStalls, mode) => {
            await onImportStalls(importedStalls, mode);
            showToast(`Successfully imported ${importedStalls.length} stalls!`);
          }}
          existingStallsCount={stalls.length}
        />
      )}
    </div>
  );
};
