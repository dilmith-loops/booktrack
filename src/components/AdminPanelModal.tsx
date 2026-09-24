import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Pin,
  Trash2,
  Plus,
  Megaphone,
  Building2,
  Users,
  User,
  BarChart3,
  Search,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  LogOut,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Stall, BookSpotting, UserProfile, Announcement } from '../types';
import { apiFetch } from '../utils/api';
import { SpotsDataTable } from './SpotsDataTable';
import { StallsDataTable } from './StallsDataTable';
import { UsersDataTable } from './UsersDataTable';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  spots: BookSpotting[];
  stalls: Stall[];
  announcements: Announcement[];
  registeredUsers?: UserProfile[];
  onDeleteSpot: (spotId: string) => void;
  onUpdateSpot?: (spotId: string, updatedFields: Partial<BookSpotting>) => void;
  onAddSpot?: (newSpot: BookSpotting) => void;
  onTogglePinSpot: (spotId: string) => void;
  onToggleAiVerified: (spotId: string) => void;
  onToggleArchiveSpot?: (spotId: string) => void;
  onUpdateSpotStatus: (spotId: string, status: BookSpotting['status']) => void;
  onAddStall: (stall: Stall) => void;
  onUpdateStall?: (stallId: string, updatedFields: Partial<Stall>) => void;
  onDeleteStall: (stallId: string) => void;
  onPublishAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onToggleUserCardholder?: (handle: string) => void;
}

type AdminTab = 'overview' | 'spots' | 'stalls' | 'announcements' | 'users';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  spots,
  stalls,
  announcements,
  registeredUsers = [],
  onDeleteSpot,
  onUpdateSpot,
  onAddSpot,
  onTogglePinSpot,
  onToggleAiVerified,
  onToggleArchiveSpot,
  onUpdateSpotStatus,
  onAddStall,
  onUpdateStall,
  onDeleteStall,
  onPublishAnnouncement,
  onDeleteAnnouncement,
  onToggleUserCardholder
}) => {
  const [adminToken, setAdminToken] = useState<string>(() => sessionStorage.getItem('sampath_admin_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!sessionStorage.getItem('sampath_admin_token'));
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Registered MySQL users state
  const [serverUsers, setServerUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const loadServerUsers = async (token?: string) => {
    const effectiveToken = token || adminToken || sessionStorage.getItem('sampath_admin_token');
    if (!effectiveToken) return;
    setIsLoadingUsers(true);
    try {
      const res = await apiFetch('/api/users', {
        headers: { 'X-Admin-Token': effectiveToken }
      });
      const data = await res.json();
      if (data.users) {
        setServerUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load registered users', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadServerUsers();
    }
  }, [isOpen, isAuthenticated, activeTab]);

  // New Stall Form
  const [newStallName, setNewStallName] = useState('');
  const [newStallHall, setNewStallHall] = useState('Hall A');
  const [newStallNumber, setNewStallNumber] = useState('');
  const [newStallCategory, setNewStallCategory] = useState('General Books & Fiction');
  const [newStallDiscount, setNewStallDiscount] = useState('15% Instant Off with Sampath Card');

  // Announcement Form
  const [annMessage, setAnnMessage] = useState('');
  const [annType, setAnnType] = useState<Announcement['type']>('discount');

  // Search Filters
  const [spotFilterSearch, setSpotFilterSearch] = useState('');
  const [stallFilterSearch, setStallFilterSearch] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!adminUsername.trim() || !adminPassword) {
      setAuthError('Please enter both administrative username and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Invalid administrator username or password.');
        return;
      }

      sessionStorage.setItem('sampath_admin_token', data.token);
      setAdminToken(data.token);
      setIsAuthenticated(true);
      setAdminPassword('');
      loadServerUsers(data.token);
    } catch {
      setAuthError('Network error. Failed to authenticate administrator.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutAdmin = () => {
    sessionStorage.removeItem('sampath_admin_token');
    setAdminToken('');
    setIsAuthenticated(false);
    setAdminPassword('');
    setAuthError('');
  };

  const handleCreateStall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStallName.trim() || !newStallNumber.trim()) return;

    const stall: Stall = {
      id: `stall-${Date.now()}`,
      name: newStallName.trim(),
      hall: newStallHall,
      stallNumber: newStallNumber.trim(),
      category: newStallCategory,
      specialDiscount: newStallDiscount.trim() || undefined
    };

    onAddStall(stall);
    setNewStallName('');
    setNewStallNumber('');
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annMessage.trim()) return;

    const ann: Announcement = {
      id: `ann-${Date.now()}`,
      message: annMessage.trim(),
      type: annType,
      createdAt: Date.now(),
      isActive: true,
      publishedBy: 'Fair Admin'
    };

    onPublishAnnouncement(ann);
    setAnnMessage('');
  };

  const filteredSpots = spots.filter(
    (s) =>
      s.bookName.toLowerCase().includes(spotFilterSearch.toLowerCase()) ||
      s.stallName.toLowerCase().includes(spotFilterSearch.toLowerCase()) ||
      s.finderName.toLowerCase().includes(spotFilterSearch.toLowerCase())
  );

  const filteredStalls = stalls.filter(
    (s) =>
      s.name.toLowerCase().includes(stallFilterSearch.toLowerCase()) ||
      s.stallNumber.toLowerCase().includes(stallFilterSearch.toLowerCase()) ||
      s.hall.toLowerCase().includes(stallFilterSearch.toLowerCase())
  );

  const displayUsers = serverUsers.length > 0 ? serverUsers : registeredUsers;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white min-h-screen w-full overflow-y-auto flex flex-col font-sans selection:bg-[#F37021] selection:text-white animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <header className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F37021] to-[#EA580C] text-white flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Sampath Book Finder Control Center
              </h1>
              <span className="text-[10px] bg-[#F37021]/20 text-[#F37021] font-black px-2 py-0.5 rounded-full border border-[#F37021]/30 uppercase tracking-wider">
                Official Admin
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium hidden sm:block">
              Colombo International Book Fair 2026 • Sponsored by Sampath Bank PLC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={handleLogoutAdmin}
              id="admin-logout-btn"
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-zinc-700"
              title="Admin Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Log Out</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F37021] hover:bg-[#EA580C] text-white text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public App</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      {!isAuthenticated ? (
        /* Full-Screen Lock Screen with Username & Password */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-md bg-zinc-900/95 border border-zinc-800 p-8 sm:p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#F37021] shadow-inner mx-auto">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Administrator Access Required</h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Please enter your administrator username and password to access post moderation, stall management, and user registry.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 pt-2 text-left">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Username (e.g. admin)"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter Admin Password"
                    className="w-full pl-10 pr-10 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                    autoFocus
                  />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
              </div>

              {authError && (
                <p className="text-xs font-bold text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                id="admin-login-submit-btn"
                className="w-full py-3.5 bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Authenticate as Administrator</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Full-Screen Dashboard Layout */
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
          {/* Dashboard Navigation Tabs Bar */}
          <div className="bg-zinc-900 p-2 rounded-2xl border border-zinc-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-[#F37021] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('spots')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'spots'
                  ? 'bg-[#F37021] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Feed & Post Moderation ({spots.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stalls')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'stalls'
                  ? 'bg-[#F37021] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>BMICH Stalls Directory ({stalls.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'announcements'
                  ? 'bg-[#F37021] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Broadcast Banners ({announcements.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-[#F37021] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Registered Spotters ({displayUsers.length})</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Total Spot Posts
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white">
                    {spots.filter((s) => s.postType !== 'request').length}
                  </div>
                  <span className="text-xs text-emerald-400 font-bold block">
                    Active Spotter Discoveries
                  </span>
                </div>

                <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Book Requests
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#F37021]/20 text-[#F37021] flex items-center justify-center">
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#F37021]">
                    {spots.filter((s) => s.postType === 'request').length}
                  </div>
                  <span className="text-xs text-orange-400 font-bold block">
                    Visitors Seeking Specific Books
                  </span>
                </div>

                <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      BMICH Stalls
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white">{stalls.length}</div>
                  <span className="text-xs text-zinc-400 font-bold block">
                    Registered Across Halls A - E
                  </span>
                </div>

                <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Sampath Discounts
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-purple-400">
                    {stalls.filter((s) => s.specialDiscount).length}
                  </div>
                  <span className="text-xs text-purple-400 font-bold block">
                    Participating Cardholder Offers
                  </span>
                </div>
              </div>

              {/* System Health Status */}
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Sampath AI Safety & Moderation Status</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-xs text-zinc-400 font-medium">Multilingual Profanity Filter</span>
                    <div className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Active & Operational</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-xs text-zinc-400 font-medium">Auto AI Spot Verification</span>
                    <div className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Verified Badges Active</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-xs text-zinc-400 font-medium">Image Multimodal Guardian</span>
                    <div className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Photo Scanning Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPOTS MODERATION */}
          {activeTab === 'spots' && (
            <SpotsDataTable
              spots={spots}
              stalls={stalls}
              onDeleteSpot={onDeleteSpot}
              onUpdateSpot={onUpdateSpot}
              onAddSpot={onAddSpot}
              onTogglePinSpot={onTogglePinSpot}
              onToggleAiVerified={onToggleAiVerified}
              onToggleArchiveSpot={onToggleArchiveSpot}
              onUpdateSpotStatus={onUpdateSpotStatus}
            />
          )}

          {/* TAB 3: STALLS MANAGEMENT */}
          {activeTab === 'stalls' && (
            <StallsDataTable
              stalls={stalls}
              spots={spots}
              onDeleteStall={onDeleteStall}
              onUpdateStall={onUpdateStall}
              onAddStall={onAddStall}
            />
          )}

          {/* TAB 4: BROADCAST ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateAnnouncement} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-md">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#F37021] flex items-center gap-2">
                  <Megaphone className="w-5 h-5" />
                  <span>Publish Live Announcement Banner</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <select
                    value={annType}
                    onChange={(e) => setAnnType(e.target.value as Announcement['type'])}
                    className="px-3.5 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white font-bold"
                  >
                    <option value="discount">Discount Alert 🎁</option>
                    <option value="urgent">Urgent Notice ⚡</option>
                    <option value="info">Fair Announcement 📢</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Announcement message (e.g. Flash 20% discount at Hall C!)..."
                    value={annMessage}
                    onChange={(e) => setAnnMessage(e.target.value)}
                    className="sm:col-span-3 px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#F37021] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Publish Live Banner</span>
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Active & Past Announcements ({announcements.length})
                </h4>

                <div className="space-y-2">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#F37021]/20 text-[#F37021] border border-[#F37021]/30">
                          {ann.type}
                        </span>
                        <span className="text-zinc-200 font-bold">{ann.message}</span>
                      </div>

                      <button
                        onClick={() => onDeleteAnnouncement(ann.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REGISTERED USERS (FROM MYSQL DATABASE) WITH FULL CRUD DATATABLE */}
          {activeTab === 'users' && (
            <UsersDataTable
              users={displayUsers}
              adminToken={adminToken}
              onRefresh={() => loadServerUsers()}
              onUserAdded={(user) => {
                setServerUsers((prev) => [user, ...prev.filter((u) => u.id !== user.id && u.handle !== user.handle)]);
              }}
              onUserUpdated={(user) => {
                setServerUsers((prev) =>
                  prev.map((u) => (u.id === user.id || u.handle === user.handle ? user : u))
                );
              }}
              onUserDeleted={(uid) => {
                setServerUsers((prev) => prev.filter((u) => u.id !== uid && u.handle !== uid));
              }}
              onToggleCardholder={(uid) => {
                if (onToggleUserCardholder) {
                  onToggleUserCardholder(String(uid));
                }
                setServerUsers((prev) =>
                  prev.map((u) => {
                    if (u.id === uid || u.handle === uid) {
                      return { ...u, isSampathCardholder: !u.isSampathCardholder };
                    }
                    return u;
                  })
                );
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
