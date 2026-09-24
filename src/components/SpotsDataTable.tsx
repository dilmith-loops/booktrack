import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Pin,
  ShieldCheck,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  BookOpen,
  MapPin,
  User,
  Tag,
  Star,
  ThumbsUp,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  Clock,
  Layers,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { BookSpotting, Stall } from '../types';
import { apiFetch } from '../utils/api';

interface SpotsDataTableProps {
  spots: BookSpotting[];
  stalls: Stall[];
  onDeleteSpot: (spotId: string) => void;
  onUpdateSpot?: (spotId: string, updatedFields: Partial<BookSpotting>) => void;
  onAddSpot?: (newSpot: BookSpotting) => void;
  onTogglePinSpot: (spotId: string) => void;
  onToggleAiVerified: (spotId: string) => void;
  onToggleArchiveSpot?: (spotId: string) => void;
  onUpdateSpotStatus: (spotId: string, status: BookSpotting['status']) => void;
}

type SortField = 'timestamp' | 'bookName' | 'stallName' | 'helpfulCount' | 'status';
type SortOrder = 'asc' | 'desc';

export const SpotsDataTable: React.FC<SpotsDataTableProps> = ({
  spots,
  stalls,
  onDeleteSpot,
  onUpdateSpot,
  onAddSpot,
  onTogglePinSpot,
  onToggleAiVerified,
  onToggleArchiveSpot,
  onUpdateSpotStatus
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'spot' | 'request'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [filterArchived, setFilterArchived] = useState<'active' | 'archived' | 'all'>('active');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // CRUD Modals State
  const [viewingSpot, setViewingSpot] = useState<BookSpotting | null>(null);
  const [editingSpot, setEditingSpot] = useState<BookSpotting | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    postType: 'spot' as 'spot' | 'request',
    bookName: '',
    author: '',
    stallName: stalls[0]?.name || 'Sarasavi Bookshop',
    stallId: stalls[0]?.id || 'sarasavi-a',
    hall: stalls[0]?.hall || 'Hall A',
    stallNumber: stalls[0]?.stallNumber || 'A12 - A18',
    priceOrOffer: '',
    shelfLocationNote: '',
    notes: '',
    finderName: 'Admin Spotter',
    finderHandle: '@admin_spotter',
    status: 'In Stock' as BookSpotting['status'],
    aiVerified: true
  });

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Filtered & Sorted spots
  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      // Type filter
      if (filterType !== 'all') {
        const spotType = spot.postType || 'spot';
        if (spotType !== filterType) return false;
      }

      // Status filter
      if (filterStatus !== 'all' && spot.status !== filterStatus) {
        return false;
      }

      // Verified filter
      if (filterVerified === 'verified' && !spot.aiVerified) return false;
      if (filterVerified === 'unverified' && spot.aiVerified) return false;

      // Archived filter
      if (filterArchived === 'active' && spot.isArchived) return false;
      if (filterArchived === 'archived' && !spot.isArchived) return false;

      // Text search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = spot.bookName.toLowerCase().includes(q);
        const matchAuthor = spot.author?.toLowerCase().includes(q);
        const matchStall = spot.stallName.toLowerCase().includes(q);
        const matchHall = spot.hall.toLowerCase().includes(q);
        const matchFinder = spot.finderName.toLowerCase().includes(q) || spot.finderHandle.toLowerCase().includes(q);
        const matchPrice = spot.priceOrOffer?.toLowerCase().includes(q);
        const matchNotes = spot.notes?.toLowerCase().includes(q);

        if (!matchTitle && !matchAuthor && !matchStall && !matchHall && !matchFinder && !matchPrice && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [spots, filterType, filterStatus, filterVerified, searchQuery]);

  const sortedSpots = useMemo(() => {
    const list = [...filteredSpots];
    list.sort((a, b) => {
      // Pinned spots always stay on top unless specific sort requested
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'timestamp') {
        valA = a.timestamp || 0;
        valB = b.timestamp || 0;
      } else if (sortField === 'bookName' || sortField === 'stallName' || sortField === 'status') {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredSpots, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = sortedSpots.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedSpots = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSpots.slice(start, start + itemsPerPage);
  }, [sortedSpots, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Selection handlers
  const handleSelectAllCurrentPage = () => {
    const next = new Set(selectedIds);
    const allSelected = paginatedSpots.every((s) => next.has(s.id));
    if (allSelected) {
      paginatedSpots.forEach((s) => next.delete(s.id));
    } else {
      paginatedSpots.forEach((s) => next.add(s.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    selectedIds.forEach((id) => {
      onDeleteSpot(id);
    });
    showToast(`Deleted ${selectedIds.size} posts successfully.`);
    setSelectedIds(new Set());
    setIsBulkDeleteConfirm(false);
  };

  const handleBulkStatusChange = (status: BookSpotting['status']) => {
    selectedIds.forEach((id) => {
      onUpdateSpotStatus(id, status);
    });
    showToast(`Updated status for ${selectedIds.size} posts.`);
    setSelectedIds(new Set());
  };

  // Create Spot
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.bookName.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        postType: createForm.postType,
        bookName: createForm.bookName.trim(),
        author: createForm.author.trim() || undefined,
        stallId: createForm.postType === 'request' ? 'seeking' : createForm.stallId,
        stallName: createForm.postType === 'request' ? 'BMICH Fairgrounds' : createForm.stallName,
        hall: createForm.postType === 'request' ? 'Seeking in All Halls' : createForm.hall,
        stallNumber: createForm.postType === 'request' ? 'Looking for Stall' : createForm.stallNumber,
        priceOrOffer: createForm.priceOrOffer.trim() || undefined,
        shelfLocationNote: createForm.shelfLocationNote.trim() || undefined,
        notes: createForm.notes.trim() || undefined,
        finderName: createForm.finderName.trim() || 'Admin',
        finderHandle: createForm.finderHandle.trim() || '@admin'
      };

      const res = await apiFetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.spot) {
        if (onAddSpot) onAddSpot(data.spot);
        showToast('New post created and published to database successfully!');
        setIsCreateModalOpen(false);
        // reset form
        setCreateForm({
          postType: 'spot',
          bookName: '',
          author: '',
          stallName: stalls[0]?.name || 'Sarasavi Bookshop',
          stallId: stalls[0]?.id || 'sarasavi-a',
          hall: stalls[0]?.hall || 'Hall A',
          stallNumber: stalls[0]?.stallNumber || 'A12 - A18',
          priceOrOffer: '',
          shelfLocationNote: '',
          notes: '',
          finderName: 'Admin Spotter',
          finderHandle: '@admin_spotter',
          status: 'In Stock',
          aiVerified: true
        });
      } else {
        alert(data.error || 'Failed to create post');
      }
    } catch (err: any) {
      alert('Error creating post: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Spot
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpot) return;

    setIsSubmitting(true);
    try {
      if (onUpdateSpot) {
        onUpdateSpot(editingSpot.id, {
          bookName: editingSpot.bookName,
          author: editingSpot.author,
          stallName: editingSpot.stallName,
          hall: editingSpot.hall,
          stallNumber: editingSpot.stallNumber,
          priceOrOffer: editingSpot.priceOrOffer,
          shelfLocationNote: editingSpot.shelfLocationNote,
          notes: editingSpot.notes,
          finderName: editingSpot.finderName,
          finderHandle: editingSpot.finderHandle,
          status: editingSpot.status,
          aiVerified: editingSpot.aiVerified,
          isPinned: editingSpot.isPinned,
          helpfulCount: editingSpot.helpfulCount
        });
      }
      showToast('Post updated successfully in database!');
      setEditingSpot(null);
    } catch (err: any) {
      alert('Error updating post: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    'In Stock': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Few Copies Left': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Sold Out': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Looking for Book': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Found': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Controls & Filter Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title, author, stall, hall, or spotter handle..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021] placeholder:text-zinc-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Actions & Add Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-[#F37021] hover:bg-[#E05F13] text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sighting / Request</span>
            </button>
          </div>
        </div>

        {/* Filter Pills and Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-500 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* Type Filter */}
            <div className="inline-flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800">
              <button
                onClick={() => {
                  setFilterType('all');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  filterType === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({spots.length})
              </button>
              <button
                onClick={() => {
                  setFilterType('spot');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  filterType === 'spot' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Spots ({spots.filter((s) => s.postType !== 'request').length})
              </button>
              <button
                onClick={() => {
                  setFilterType('request');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  filterType === 'request' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Requests ({spots.filter((s) => s.postType === 'request').length})
              </button>
            </div>

            {/* Status Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#F37021]"
            >
              <option value="all">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Few Copies Left">Few Copies Left</option>
              <option value="Sold Out">Sold Out</option>
              <option value="Looking for Book">Looking for Book</option>
              <option value="Found">Found</option>
            </select>

            {/* AI Verified Filter */}
            <select
              value={filterVerified}
              onChange={(e) => {
                setFilterVerified(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#F37021]"
            >
              <option value="all">All Verification</option>
              <option value="verified">AI Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>

            {/* Archival Status Filter */}
            <select
              value={filterArchived}
              onChange={(e) => {
                setFilterArchived(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#F37021]"
            >
              <option value="active">Active Only ({spots.filter((s) => !s.isArchived).length})</option>
              <option value="archived">Archived ({spots.filter((s) => s.isArchived).length}) 📦</option>
              <option value="all">All Posts ({spots.length})</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-zinc-400 font-semibold">
            <span>
              Per Page:
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] font-bold text-white focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </span>
            <span>
              Showing <strong className="text-white">{sortedSpots.length ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> -{' '}
              <strong className="text-white">{Math.min(currentPage * itemsPerPage, sortedSpots.length)}</strong> of{' '}
              <strong className="text-white">{sortedSpots.length}</strong>
            </span>
          </div>
        </div>

        {/* Bulk Action Bar (when selected) */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-zinc-950 border border-[#F37021]/50 rounded-xl text-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="font-black text-[#F37021] bg-[#F37021]/20 px-2.5 py-1 rounded-md">
                {selectedIds.size} Selected
              </span>
              <span className="text-zinc-400 font-medium">Bulk Actions:</span>
              <button
                onClick={() => handleBulkStatusChange('In Stock')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded font-bold transition-colors cursor-pointer"
              >
                Mark In Stock
              </button>
              <button
                onClick={() => handleBulkStatusChange('Sold Out')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded font-bold transition-colors cursor-pointer"
              >
                Mark Sold Out
              </button>
              {onToggleArchiveSpot && (
                <button
                  onClick={() => {
                    selectedIds.forEach((id) => onToggleArchiveSpot(id));
                    setSelectedIds(new Set());
                    showToast(`Updated archive status for ${selectedIds.size} posts`);
                  }}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-white border border-amber-500/40 text-amber-300 rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Toggle Archive</span>
                </button>
              )}
              <button
                onClick={() => setIsBulkDeleteConfirm(true)}
                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-zinc-400 hover:text-white font-bold cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main DataTable Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950/80 text-zinc-400 font-black uppercase tracking-wider border-b border-zinc-800 select-none">
                <th className="p-3.5 w-10 text-center">
                  <button
                    onClick={handleSelectAllCurrentPage}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Select / Deselect all on current page"
                  >
                    {paginatedSpots.length > 0 && paginatedSpots.every((s) => selectedIds.has(s.id)) ? (
                      <CheckSquare className="w-4 h-4 text-[#F37021]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                <th
                  onClick={() => handleSort('bookName')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Book Title & Details</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('stallName')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Stall & Hall</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                <th className="p-3.5">Spotter</th>

                <th className="p-3.5">Price & Offers</th>

                <th
                  onClick={() => handleSort('status')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                <th className="p-3.5 text-center">AI Shield</th>

                <th
                  onClick={() => handleSort('helpfulCount')}
                  className="p-3.5 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Upvotes</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('timestamp')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date / Time</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {paginatedSpots.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-500 font-bold">
                    No book spots found matching your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedSpots.map((spot) => {
                  const isSelected = selectedIds.has(spot.id);
                  return (
                    <tr
                      key={spot.id}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        spot.isPinned ? 'bg-[#F37021]/5' : ''
                      } ${isSelected ? 'bg-zinc-800/60' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelectRow(spot.id)}
                          className="text-zinc-500 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#F37021]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Book Title & Type */}
                      <td className="p-3.5 max-w-[280px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {spot.isPinned && (
                              <span className="text-[10px] bg-[#F37021] text-white font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Pin className="w-2.5 h-2.5" /> PINNED
                              </span>
                            )}
                            {spot.isArchived && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                                <Archive className="w-2.5 h-2.5" /> ARCHIVED
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                spot.postType === 'request'
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {spot.postType === 'request' ? 'Request' : 'Found Spot'}
                            </span>
                          </div>

                          <div
                            onClick={() => setViewingSpot(spot)}
                            className="font-bold text-white hover:text-[#F37021] cursor-pointer line-clamp-2 transition-colors"
                          >
                            {spot.bookName}
                          </div>

                          {spot.author && (
                            <div className="text-[11px] text-zinc-400 font-medium">By {spot.author}</div>
                          )}
                        </div>
                      </td>

                      {/* Stall & Hall */}
                      <td className="p-3.5 max-w-[200px]">
                        <div className="font-bold text-zinc-200 line-clamp-1">{spot.stallName}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#F37021]" />
                          <span>
                            {spot.hall} &bull; {spot.stallNumber}
                          </span>
                        </div>
                        {spot.shelfLocationNote && (
                          <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                            Loc: {spot.shelfLocationNote}
                          </div>
                        )}
                      </td>

                      {/* Spotter */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="text-zinc-200 font-bold">{spot.finderName}</div>
                        <div className="text-[11px] text-[#F37021] font-medium">{spot.finderHandle}</div>
                      </td>

                      {/* Price / Perks */}
                      <td className="p-3.5 whitespace-nowrap">
                        {spot.priceOrOffer ? (
                          <div className="font-bold text-emerald-400">{spot.priceOrOffer}</div>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                        {spot.sampathCardDiscount && (
                          <div className="text-[10px] text-purple-400 font-medium truncate max-w-[140px]">
                            {spot.sampathCardDiscount}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <select
                          value={spot.status}
                          onChange={(e) => onUpdateSpotStatus(spot.id, e.target.value as any)}
                          className={`text-[11px] font-black px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            statusColors[spot.status] || 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <option value="In Stock">In Stock</option>
                          <option value="Few Copies Left">Few Copies Left</option>
                          <option value="Sold Out">Sold Out</option>
                          <option value="Looking for Book">Looking for Book</option>
                          <option value="Found">Found</option>
                        </select>
                      </td>

                      {/* AI Verified */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onToggleAiVerified(spot.id)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            spot.aiVerified
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                          title={spot.aiVerified ? 'Click to unverify' : 'Click to verify with AI badge'}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Upvotes / Rating */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{spot.helpfulCount}</span>
                        </div>
                        {spot.ratingAverage && (
                          <div className="text-[10px] text-amber-400 font-medium flex items-center justify-center gap-0.5 mt-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            <span>{spot.ratingAverage.toFixed(1)}</span>
                          </div>
                        )}
                      </td>

                      {/* Date / Time */}
                      <td className="p-3.5 whitespace-nowrap text-zinc-400 text-[11px]">
                        <div>{new Date(spot.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                        <div className="text-zinc-500 text-[10px]">
                          {new Date(spot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View button */}
                          <button
                            onClick={() => setViewingSpot(spot)}
                            className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => setEditingSpot(spot)}
                            className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[#F37021] hover:bg-[#F37021] hover:text-white transition-colors cursor-pointer"
                            title="Edit Spot"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Pin button */}
                          <button
                            onClick={() => onTogglePinSpot(spot.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              spot.isPinned
                                ? 'bg-[#F37021] text-white border-[#F37021]'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                            }`}
                            title={spot.isPinned ? 'Unpin post' : 'Pin post'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          {/* Archive / Restore button */}
                          {onToggleArchiveSpot && (
                            <button
                              onClick={() => onToggleArchiveSpot(spot.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                spot.isArchived
                                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-zinc-700'
                              }`}
                              title={spot.isArchived ? 'Restore post from archive' : 'Archive post (hide from feed)'}
                            >
                              {spot.isArchived ? (
                                <ArchiveRestore className="w-3.5 h-3.5" />
                              ) : (
                                <Archive className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={() => setDeleteConfirmId(spot.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-zinc-400 font-medium">
            Page <strong className="text-white">{currentPage}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong> ({totalItems} total posts)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                    currentPage === pageNum
                      ? 'bg-[#F37021] text-white font-black shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW DETAILS MODAL (READ)                                       */}
      {/* ========================================================================= */}
      {viewingSpot && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-md ${
                    viewingSpot.postType === 'request'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {viewingSpot.postType === 'request' ? 'Visitor Book Request' : 'Verified Book Sighting'}
                </span>
                {viewingSpot.isPinned && (
                  <span className="text-xs bg-[#F37021] text-white font-black px-2 py-0.5 rounded flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewingSpot(null)}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-white">{viewingSpot.bookName}</h3>
                {viewingSpot.author && (
                  <div className="text-sm font-semibold text-zinc-400 mt-1">Author: {viewingSpot.author}</div>
                )}
              </div>

              {/* Photo Gallery if images exist */}
              {viewingSpot.images && viewingSpot.images.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Attached Spotter Photos ({viewingSpot.images.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {viewingSpot.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-video rounded-xl overflow-hidden border border-zinc-800 block bg-zinc-950"
                      >
                        <img src={img} alt="Shelf photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                          View Full Photo
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 font-bold block uppercase">Stall Location</span>
                  <div className="font-bold text-white text-sm">{viewingSpot.stallName}</div>
                  <div className="text-zinc-400">{viewingSpot.hall} &bull; {viewingSpot.stallNumber}</div>
                </div>

                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 font-bold block uppercase">Spotter Information</span>
                  <div className="font-bold text-white text-sm">{viewingSpot.finderName}</div>
                  <div className="text-[#F37021] font-semibold">{viewingSpot.finderHandle}</div>
                </div>

                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 font-bold block uppercase">Price & Discount</span>
                  <div className="font-bold text-emerald-400 text-sm">{viewingSpot.priceOrOffer || 'Standard Fair Price'}</div>
                  <div className="text-purple-400">{viewingSpot.sampathCardDiscount || 'Standard Sampath card offers'}</div>
                </div>

                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 font-bold block uppercase">Community Status</span>
                  <span className={`inline-block text-xs font-black px-2 py-0.5 rounded ${statusColors[viewingSpot.status]}`}>
                    {viewingSpot.status}
                  </span>
                  <div className="text-zinc-400 mt-1">Upvotes: {viewingSpot.helpfulCount} &bull; Rating: {viewingSpot.ratingAverage || 5.0}★</div>
                </div>
              </div>

              {viewingSpot.shelfLocationNote && (
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-1 text-xs">
                  <span className="text-zinc-500 font-bold block uppercase">Shelf Placement Note</span>
                  <p className="text-zinc-300 font-medium">{viewingSpot.shelfLocationNote}</p>
                </div>
              )}

              {viewingSpot.notes && (
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-1 text-xs">
                  <span className="text-zinc-500 font-bold block uppercase">Additional Notes</span>
                  <p className="text-zinc-300 font-medium">{viewingSpot.notes}</p>
                </div>
              )}

              <div className="text-[11px] text-zinc-500 font-medium">
                Post ID: <code className="text-zinc-400 font-mono">{viewingSpot.id}</code> &bull; Posted:{' '}
                {new Date(viewingSpot.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  const s = viewingSpot;
                  setViewingSpot(null);
                  setEditingSpot(s);
                }}
                className="px-4 py-2 bg-[#F37021] hover:bg-[#E05F13] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Post</span>
              </button>
              <button
                onClick={() => setViewingSpot(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT SPOT MODAL (UPDATE)                                         */}
      {/* ========================================================================= */}
      {editingSpot && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <form
            onSubmit={handleEditSubmit}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#F37021]" />
                <h3 className="text-base font-black text-white">Edit Book Post (ID: {editingSpot.id})</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSpot(null)}
                className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Book Title *</label>
                <input
                  type="text"
                  value={editingSpot.bookName}
                  onChange={(e) => setEditingSpot({ ...editingSpot, bookName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Author (Optional)</label>
                <input
                  type="text"
                  value={editingSpot.author || ''}
                  onChange={(e) => setEditingSpot({ ...editingSpot, author: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Stall Name *</label>
                  <input
                    type="text"
                    value={editingSpot.stallName}
                    onChange={(e) => setEditingSpot({ ...editingSpot, stallName: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Hall Location *</label>
                  <input
                    type="text"
                    value={editingSpot.hall}
                    onChange={(e) => setEditingSpot({ ...editingSpot, hall: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Stall Number</label>
                  <input
                    type="text"
                    value={editingSpot.stallNumber}
                    onChange={(e) => setEditingSpot({ ...editingSpot, stallNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Status</label>
                  <select
                    value={editingSpot.status}
                    onChange={(e) => setEditingSpot({ ...editingSpot, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Few Copies Left">Few Copies Left</option>
                    <option value="Sold Out">Sold Out</option>
                    <option value="Looking for Book">Looking for Book</option>
                    <option value="Found">Found</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Price / Offer</label>
                <input
                  type="text"
                  value={editingSpot.priceOrOffer || ''}
                  onChange={(e) => setEditingSpot({ ...editingSpot, priceOrOffer: e.target.value })}
                  placeholder="e.g. Rs. 2,400 (20% off with Sampath Card)"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Shelf Location Note</label>
                <input
                  type="text"
                  value={editingSpot.shelfLocationNote || ''}
                  onChange={(e) => setEditingSpot({ ...editingSpot, shelfLocationNote: e.target.value })}
                  placeholder="e.g. Front table shelf 3, next to fiction"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={editingSpot.notes || ''}
                  onChange={(e) => setEditingSpot({ ...editingSpot, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 text-zinc-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSpot.aiVerified}
                    onChange={(e) => setEditingSpot({ ...editingSpot, aiVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-[#F37021] focus:ring-0"
                  />
                  <span>AI Shield Verified</span>
                </label>

                <label className="flex items-center gap-2 text-zinc-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingSpot.isPinned}
                    onChange={(e) => setEditingSpot({ ...editingSpot, isPinned: e.target.checked })}
                    className="w-4 h-4 rounded text-[#F37021] focus:ring-0"
                  />
                  <span>Pin to Top of Feed</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingSpot(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#F37021] hover:bg-[#E05F13] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW SPOT MODAL (CREATE)                                   */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#F37021]" />
                <h3 className="text-base font-black text-white">Create New Post in Database</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Selector Tabs */}
            <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setCreateForm({ ...createForm, postType: 'spot' })}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                  createForm.postType === 'spot' ? 'bg-[#F37021] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Found Book Sighting
              </button>
              <button
                type="button"
                onClick={() => setCreateForm({ ...createForm, postType: 'request' })}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                  createForm.postType === 'request' ? 'bg-orange-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Looking for a Book Request
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Book Title *</label>
                <input
                  type="text"
                  value={createForm.bookName}
                  onChange={(e) => setCreateForm({ ...createForm, bookName: e.target.value })}
                  placeholder="e.g. Madol Doova or Atomic Habits"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Author Name (Optional)</label>
                <input
                  type="text"
                  value={createForm.author}
                  onChange={(e) => setCreateForm({ ...createForm, author: e.target.value })}
                  placeholder="e.g. Martin Wickramasinghe"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              {createForm.postType === 'spot' && (
                <>
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Select BMICH Stall *</label>
                    <select
                      value={createForm.stallId}
                      onChange={(e) => {
                        const matched = stalls.find((s) => s.id === e.target.value);
                        setCreateForm({
                          ...createForm,
                          stallId: e.target.value,
                          stallName: matched?.name || createForm.stallName,
                          hall: matched?.hall || createForm.hall,
                          stallNumber: matched?.stallNumber || createForm.stallNumber
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                    >
                      {stalls.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.hall} - {s.stallNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 font-bold mb-1">Hall Location</label>
                      <input
                        type="text"
                        value={createForm.hall}
                        onChange={(e) => setCreateForm({ ...createForm, hall: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-bold mb-1">Stall Number</label>
                      <input
                        type="text"
                        value={createForm.stallNumber}
                        onChange={(e) => setCreateForm({ ...createForm, stallNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Price / Special Offer</label>
                    <input
                      type="text"
                      value={createForm.priceOrOffer}
                      onChange={(e) => setCreateForm({ ...createForm, priceOrOffer: e.target.value })}
                      placeholder="e.g. Rs. 1,200 (15% off with Sampath Card)"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Shelf Location Note</label>
                    <input
                      type="text"
                      value={createForm.shelfLocationNote}
                      onChange={(e) => setCreateForm({ ...createForm, shelfLocationNote: e.target.value })}
                      placeholder="e.g. Shelf 2 next to main entrance"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Notes / Request Details</label>
                <textarea
                  rows={2}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Additional details about edition, cover design, or condition..."
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Finder / Requester Name</label>
                  <input
                    type="text"
                    value={createForm.finderName}
                    onChange={(e) => setCreateForm({ ...createForm, finderName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Finder Handle</label>
                  <input
                    type="text"
                    value={createForm.finderHandle}
                    onChange={(e) => setCreateForm({ ...createForm, finderHandle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#F37021] hover:bg-[#E05F13] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Creating...' : 'Create & Publish'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION (DELETE)                                     */}
      {/* ========================================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">Delete This Spotting?</h4>
              <p className="text-xs text-zinc-400 mt-1">
                This will permanently delete this book post from the MySQL database and community feed.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSpot(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('Spot deleted permanently from database.');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm */}
      {isBulkDeleteConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">Delete {selectedIds.size} Selected Posts?</h4>
              <p className="text-xs text-zinc-400 mt-1">
                This action cannot be undone and will permanently remove them from the database.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsBulkDeleteConfirm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
