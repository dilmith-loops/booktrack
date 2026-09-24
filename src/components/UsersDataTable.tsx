import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Users,
  User,
  Mail,
  Phone,
  CreditCard,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Lock,
  EyeOff,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import { UserProfile } from '../types';
import { apiFetch } from '../utils/api';

interface UsersDataTableProps {
  users: UserProfile[];
  adminToken?: string;
  onRefresh?: () => void;
  onUserAdded?: (user: UserProfile) => void;
  onUserUpdated?: (user: UserProfile) => void;
  onUserDeleted?: (userId: string | number) => void;
  onToggleCardholder?: (userId: string | number) => void;
}

type SortField = 'name' | 'handle' | 'email' | 'registeredAt' | 'isSampathCardholder';
type SortOrder = 'asc' | 'desc';

export const UsersDataTable: React.FC<UsersDataTableProps> = ({
  users,
  adminToken = '',
  onRefresh,
  onUserAdded,
  onUserUpdated,
  onUserDeleted,
  onToggleCardholder
}) => {
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCardholder, setFilterCardholder] = useState<'all' | 'cardholder' | 'standard'>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('registeredAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Modal States
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);
  const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false);

  // Form States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Form
  const [createForm, setCreateForm] = useState({
    name: '',
    handle: '',
    email: '',
    phone: '',
    password: '',
    isSampathCardholder: false
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edit Form
  const [editForm, setEditForm] = useState({
    name: '',
    handle: '',
    email: '',
    phone: '',
    password: '',
    isSampathCardholder: false
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getEffectiveToken = () => {
    return adminToken || sessionStorage.getItem('sampath_admin_token') || '';
  };

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q));

      const matchesCardholder =
        filterCardholder === 'all' ||
        (filterCardholder === 'cardholder' && u.isSampathCardholder) ||
        (filterCardholder === 'standard' && !u.isSampathCardholder);

      return matchesSearch && matchesCardholder;
    });
  }, [users, searchQuery, filterCardholder]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'registeredAt') {
        valA = Number(a.registeredAt || 0);
        valB = Number(b.registeredAt || 0);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortOrder]);

  // Pagination Math
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(start, start + itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Bulk Selection
  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedIds.has(u.id || u.handle));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      paginatedUsers.forEach((u) => next.add(u.id || u.handle));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // CREATE USER (CRUD - C)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!createForm.name.trim() || createForm.name.trim().length < 2) {
      setFormError('Please enter full name (minimum 2 characters).');
      return;
    }
    if (!createForm.email.trim() || !createForm.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!createForm.phone.trim() || createForm.phone.replace(/\D/g, '').length < 9) {
      setFormError('Please enter a valid phone number (minimum 9 digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getEffectiveToken();
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          handle: createForm.handle.trim() || undefined,
          email: createForm.email.trim(),
          phone: createForm.phone.trim(),
          password: createForm.password || 'SampathUser@2026',
          isSampathCardholder: createForm.isSampathCardholder
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create spotter account.');
      }

      if (onUserAdded) {
        onUserAdded(data.user);
      }
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        handle: '',
        email: '',
        phone: '',
        password: '',
        isSampathCardholder: false
      });
      showToast(`Spotter "${data.user.name}" registered successfully in MySQL!`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Error creating spotter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // EDIT USER (CRUD - U)
  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      handle: user.handle,
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      isSampathCardholder: !!user.isSampathCardholder
    });
    setFormError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);

    if (!editForm.name.trim() || editForm.name.trim().length < 2) {
      setFormError('Full name is required (minimum 2 characters).');
      return;
    }
    if (!editForm.email.trim() || !editForm.email.includes('@')) {
      setFormError('Valid email address is required.');
      return;
    }
    if (!editForm.phone.trim() || editForm.phone.replace(/\D/g, '').length < 9) {
      setFormError('Valid phone number is required (min 9 digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getEffectiveToken();
      const identifier = editingUser.id || editingUser.handle;
      const res = await apiFetch(`/api/users/${identifier}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          handle: editForm.handle.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          password: editForm.password || undefined,
          isSampathCardholder: editForm.isSampathCardholder
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user profile.');
      }

      if (onUserUpdated) {
        onUserUpdated(data.user);
      }
      setEditingUser(null);
      showToast(`User "${data.user.name}" updated successfully!`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Error updating user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE USER (CRUD - D)
  const handleDeleteUser = async (user: UserProfile) => {
    setIsSubmitting(true);
    try {
      const token = getEffectiveToken();
      const identifier = user.id || user.handle;
      const res = await apiFetch(`/api/users/${identifier}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': token
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user.');
      }

      if (onUserDeleted) {
        onUserDeleted(identifier);
      }
      setDeleteConfirmUser(null);
      showToast(data.message || `User "${user.name}" deleted.`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // BULK DELETE
  const handleBulkDelete = async () => {
    setIsSubmitting(true);
    const token = getEffectiveToken();
    let successCount = 0;

    for (const id of Array.from(selectedIds)) {
      try {
        const res = await apiFetch(`/api/users/${id}`, {
          method: 'DELETE',
          headers: { 'X-Admin-Token': token }
        });
        if (res.ok) {
          successCount++;
          if (onUserDeleted) onUserDeleted(id);
        }
      } catch (e) {
        console.error('Failed to delete user id', id, e);
      }
    }

    setIsSubmitting(false);
    setIsBulkDeleteConfirm(false);
    setSelectedIds(new Set());
    showToast(`Bulk Deleted ${successCount} users from MySQL.`);
    if (onRefresh) onRefresh();
  };

  // TOGGLE CARDHOLDER
  const handleToggleCardholderStatus = async (user: UserProfile) => {
    const token = getEffectiveToken();
    const identifier = user.id || user.handle;

    try {
      const res = await apiFetch(`/api/users/${identifier}/toggle-cardholder`, {
        method: 'POST',
        headers: { 'X-Admin-Token': token }
      });

      const data = await res.json();
      if (res.ok && data.user) {
        if (onUserUpdated) onUserUpdated(data.user);
        showToast(`Cardholder status updated for ${data.user.name}.`);
        if (onRefresh) onRefresh();
      } else {
        // Fallback local toggle
        if (onToggleCardholder) onToggleCardholder(identifier);
      }
    } catch {
      if (onToggleCardholder) onToggleCardholder(identifier);
    }
  };

  // EXPORT CSV
  const exportToCSV = () => {
    if (sortedUsers.length === 0) {
      showToast('No users to export.');
      return;
    }

    const headers = ['ID', 'Name', 'Handle', 'Email', 'Phone', 'Sampath Cardholder', 'Registration IP', 'Registered Date'];
    const rows = sortedUsers.map((u) => [
      `"${u.id || ''}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.handle}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      u.isSampathCardholder ? 'Yes' : 'No',
      `"${u.ipAddress || ''}"`,
      `"${new Date(u.registeredAt || Date.now()).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sampath_bookfair_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported users registry to CSV.');
  };

  const cardholderCount = users.filter((u) => u.isSampathCardholder).length;
  const standardCount = users.length - cardholderCount;
  const cardholderPercentage = users.length > 0 ? Math.round((cardholderCount / users.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#F37021] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Registered Spotters</span>
            <div className="text-2xl font-black text-white mt-1">{users.length}</div>
            <span className="text-[10px] text-zinc-500">Live Accounts in MySQL</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F37021]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Sampath Cardholders</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{cardholderCount}</div>
            <span className="text-[10px] text-emerald-500 font-bold">{cardholderPercentage}% of fair community</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Standard Spotters</span>
            <div className="text-2xl font-black text-zinc-300 mt-1">{standardCount}</div>
            <span className="text-[10px] text-zinc-500">Regular fair visitors</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, handle, email, phone..."
              className="w-full pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={filterCardholder}
              onChange={(e: any) => {
                setFilterCardholder(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
            >
              <option value="all">All Cardholder Types</option>
              <option value="cardholder">Sampath Cardholders Only</option>
              <option value="standard">Standard Spotters Only</option>
            </select>
          </div>
        </div>

        {/* Buttons & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setIsBulkDeleteConfirm(true)}
              className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold border border-red-500/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border border-zinc-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer transition-colors"
              title="Refresh from MySQL"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
            id="admin-add-user-btn"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Spotter</span>
          </button>
        </div>
      </div>

      {/* Main DataTable */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-black border-b border-zinc-800 tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="cursor-pointer text-zinc-400 hover:text-white">
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#F37021]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Spotter Name & Handle</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>

                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('email')}>
                  <div className="flex items-center gap-1">
                    <span>Contact Info</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>

                <th
                  className="p-3.5 cursor-pointer hover:text-white"
                  onClick={() => handleSort('isSampathCardholder')}
                >
                  <div className="flex items-center gap-1">
                    <span>Cardholder Status</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>

                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('registeredAt')}>
                  <div className="flex items-center gap-1">
                    <span>Joined Date</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>

                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60 font-medium text-zinc-300">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="font-bold text-sm">No registered spotters found.</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {searchQuery ? 'Try clearing your search query.' : 'Click "+ Add Spotter" to create a new user.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const uid = user.id || user.handle;
                  const isSelected = selectedIds.has(uid);
                  const initial = user.name.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={String(uid)}
                      className={`hover:bg-zinc-800/40 transition-colors ${isSelected ? 'bg-orange-500/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleSelectOne(uid)}
                          className="cursor-pointer text-zinc-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#F37021]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & Handle */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F37021] to-[#EA580C] text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs leading-tight">{user.name}</div>
                            <div className="text-[11px] font-mono text-[#EA580C] mt-0.5">{user.handle}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-3.5">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Mail className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{user.email || '—'}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Phone className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cardholder Badge & Quick Toggle */}
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleCardholderStatus(user)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 cursor-pointer transition-all border ${
                            user.isSampathCardholder
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                          }`}
                          title="Click to toggle Sampath Cardholder status"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>{user.isSampathCardholder ? 'Sampath Cardholder' : 'Standard'}</span>
                        </button>
                      </td>

                      {/* Joined Date & IP */}
                      <td className="p-3.5 text-zinc-400 text-[11px]">
                        <div>{user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : 'Active Spotter'}</div>
                        {user.ipAddress ? (
                          <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5" title={`Registration IP: ${user.ipAddress}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 inline-block"></span>
                            <span>{user.ipAddress}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingUser(user)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors"
                            title="View Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-orange-500/20 text-zinc-300 hover:text-[#F37021] cursor-pointer transition-colors"
                            title="Edit User Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmUser(user)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 cursor-pointer transition-colors"
                            title="Delete User"
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

        {/* Pagination Bar */}
        <div className="p-3.5 bg-zinc-950/80 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries (Showing {sortedUsers.length} total)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-white flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-3 py-1 font-bold text-white bg-zinc-800 rounded-lg">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-white flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#F37021] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Add New Community Spotter</h3>
                  <p className="text-[11px] text-zinc-400">Registers user account directly in MySQL</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Kasun Silva"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Handle (Optional - auto-generated if blank)
                </label>
                <input
                  type="text"
                  value={createForm.handle}
                  onChange={(e) => setCreateForm({ ...createForm, handle: e.target.value })}
                  placeholder="@kasun_silva"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-mono text-[#F37021] focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="kasun@example.com"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="077 123 4567"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Defaults to SampathUser@2026"
                    className="w-full pl-3 pr-9 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                  >
                    {showCreatePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="create-cardholder"
                  checked={createForm.isSampathCardholder}
                  onChange={(e) => setCreateForm({ ...createForm, isSampathCardholder: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 text-[#F37021] focus:ring-[#F37021] cursor-pointer"
                />
                <label htmlFor="create-cardholder" className="text-xs font-bold text-zinc-200 cursor-pointer select-none">
                  Sampath Bank Cardholder (Enables 30% discount badge)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#F37021] hover:bg-[#EA580C] text-white text-xs font-black flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save New Spotter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#F37021] flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Edit Spotter Profile</h3>
                  <p className="text-[11px] text-zinc-400">Updating MySQL user record</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-zinc-400 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Handle *</label>
                <input
                  type="text"
                  required
                  value={editForm.handle}
                  onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-mono text-[#F37021] focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Change Password (Leave blank to keep existing)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full pl-3 pr-9 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="edit-cardholder"
                  checked={editForm.isSampathCardholder}
                  onChange={(e) => setEditForm({ ...editForm, isSampathCardholder: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 text-[#F37021] focus:ring-[#F37021] cursor-pointer"
                />
                <label htmlFor="edit-cardholder" className="text-xs font-bold text-zinc-200 cursor-pointer select-none">
                  Sampath Bank Cardholder (Enables 30% discount badge)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#F37021] hover:bg-[#EA580C] text-white text-xs font-black flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F37021] to-[#EA580C] text-white font-black text-lg flex items-center justify-center shadow-md">
                  {viewingUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{viewingUser.name}</h3>
                  <div className="text-xs font-mono text-[#F37021]">{viewingUser.handle}</div>
                </div>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-zinc-400 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-bold">Email Address:</span>
                <span className="text-zinc-200 font-semibold">{viewingUser.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-bold">Mobile Phone:</span>
                <span className="text-zinc-200 font-semibold">{viewingUser.phone || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-bold">Sampath Cardholder:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    viewingUser.isSampathCardholder
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {viewingUser.isSampathCardholder ? 'Yes (30% Discount Perks Active)' : 'No (Standard)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-bold">Registration Date:</span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  {viewingUser.registeredAt ? new Date(viewingUser.registeredAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-bold">Registration IP:</span>
                <span className="text-zinc-300 font-mono text-[11px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {viewingUser.ipAddress || '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const u = viewingUser;
                  setViewingUser(null);
                  handleOpenEdit(u);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 rounded-xl bg-[#F37021] text-white text-xs font-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Delete Spotter Account?</h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">"{deleteConfirmUser.name}"</strong> (
                {deleteConfirmUser.handle})? This action will permanently remove their credentials and account from MySQL.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Bulk Delete {selectedIds.size} Users?</h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Are you sure you want to permanently delete all <strong className="text-white">{selectedIds.size}</strong>{' '}
                selected community spotter accounts from MySQL?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleBulkDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
