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
  RefreshCw,
  Power,
  Wrench
} from 'lucide-react';
import { Stall, BookSpotting, UserProfile, Announcement, ModerationSettings } from '../types';
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
  onToggleDisableUser?: (userId: string | number) => void;
  isMaintenanceMode?: boolean;
  maintenanceMessage?: string;
  onToggleMaintenanceMode?: (enabled: boolean, message?: string) => Promise<void> | void;
  onToggleHideStall?: (stallId: string) => void;
  onImportStalls?: (stalls: Stall[], mode: 'replace' | 'append') => Promise<void> | void;
  onRefreshStalls?: () => Promise<void> | void;
  moderationSettings?: ModerationSettings;
  onUpdateModerationSettings?: (settings: ModerationSettings) => Promise<void> | void;
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
  onToggleUserCardholder,
  onToggleDisableUser,
  isMaintenanceMode = false,
  maintenanceMessage = '',
  onToggleMaintenanceMode,
  onToggleHideStall,
  onImportStalls,
  onRefreshStalls,
  moderationSettings,
  onUpdateModerationSettings
}) => {
  const [adminToken, setAdminToken] = useState<string>(() => sessionStorage.getItem('sampath_admin_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!sessionStorage.getItem('sampath_admin_token'));
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Maintenance mode state
  const [maintenanceActive, setMaintenanceActive] = useState<boolean>(() => isMaintenanceMode);
  const [maintenanceNotice, setMaintenanceNotice] = useState<string>(
    () => maintenanceMessage || 'Sampath Book Finder is temporarily offline for scheduled system updates and stall inventory syncing. We will be back online shortly.'
  );
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [maintenanceSuccessMsg, setMaintenanceSuccessMsg] = useState('');

  React.useEffect(() => {
    setMaintenanceActive(isMaintenanceMode);
  }, [isMaintenanceMode]);

  React.useEffect(() => {
    if (maintenanceMessage) {
      setMaintenanceNotice(maintenanceMessage);
    }
  }, [maintenanceMessage]);

  const handleToggleMaintenance = async (nextState: boolean) => {
    setIsSavingMaintenance(true);
    setMaintenanceSuccessMsg('');
    try {
      setMaintenanceActive(nextState);
      if (onToggleMaintenanceMode) {
        await onToggleMaintenanceMode(nextState, maintenanceNotice);
      }
      setMaintenanceSuccessMsg(
        nextState
          ? 'Maintenance mode is now ENABLED. Public access restricted to splash screen.'
          : 'Maintenance mode is now DISABLED. Community hub is live.'
      );
      setTimeout(() => setMaintenanceSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to toggle maintenance mode', err);
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const handleSaveMaintenanceNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMaintenance(true);
    setMaintenanceSuccessMsg('');
    try {
      if (onToggleMaintenanceMode) {
        await onToggleMaintenanceMode(maintenanceActive, maintenanceNotice);
      }
      setMaintenanceSuccessMsg('Maintenance notice saved and updated.');
      setTimeout(() => setMaintenanceSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save maintenance notice', err);
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  // AI Moderation & Safety Settings State
  const [modSettings, setModSettings] = useState<ModerationSettings>(() => {
    return moderationSettings || {
      profanityFilter: true,
      aiSpotVerification: true,
      imageGuardian: true
    };
  });
  const [isSavingModeration, setIsSavingModeration] = useState(false);
  const [moderationFeedback, setModerationFeedback] = useState('');

  React.useEffect(() => {
    if (moderationSettings) {
      setModSettings(moderationSettings);
    }
  }, [moderationSettings]);

  const handleToggleModerationKey = async (key: keyof ModerationSettings, nextVal: boolean) => {
    setIsSavingModeration(true);
    setModerationFeedback('');
    const updated: ModerationSettings = {
      ...modSettings,
      [key]: nextVal
    };
    setModSettings(updated);

    try {
      if (onUpdateModerationSettings) {
        await onUpdateModerationSettings(updated);
      } else {
        const token = sessionStorage.getItem('sampath_admin_token') || adminToken || '';
        await apiFetch('/api/settings/moderation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': token
          },
          body: JSON.stringify(updated)
        });
      }
      const label = key === 'profanityFilter'
        ? 'Multilingual Profanity Filter'
        : key === 'aiSpotVerification'
        ? 'Auto AI Spot Verification'
        : 'Image Multimodal Guardian';
      setModerationFeedback(`${label} turned ${nextVal ? 'ON' : 'OFF'}.`);
      setTimeout(() => setModerationFeedback(''), 4000);
    } catch (err) {
      console.error('Failed to update moderation setting', err);
      setModerationFeedback('Failed to update setting. Please try again.');
    } finally {
      setIsSavingModeration(false);
    }
  };

  const isAllModerationActive = Boolean(
    modSettings.profanityFilter && modSettings.aiSpotVerification && modSettings.imageGuardian
  );

  const handleToggleAllModeration = async () => {
    const nextState = !isAllModerationActive;
    setIsSavingModeration(true);
    setModerationFeedback('');
    const updated: ModerationSettings = {
      profanityFilter: nextState,
      aiSpotVerification: nextState,
      imageGuardian: nextState
    };
    setModSettings(updated);

    try {
      if (onUpdateModerationSettings) {
        await onUpdateModerationSettings(updated);
      } else {
        const token = sessionStorage.getItem('sampath_admin_token') || adminToken || '';
        await apiFetch('/api/settings/moderation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': token
          },
          body: JSON.stringify(updated)
        });
      }
      setModerationFeedback(`All AI safety filters turned ${nextState ? 'ON' : 'OFF'}.`);
      setTimeout(() => setModerationFeedback(''), 4000);
    } catch (err) {
      console.error('Failed to update all moderation settings', err);
    } finally {
      setIsSavingModeration(false);
    }
  };

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
      if (onRefreshStalls) {
        onRefreshStalls();
      }
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
    <div className="fixed inset-0 z-[110] bg-zinc-950 text-white min-h-screen w-full overflow-y-auto flex flex-col font-sans selection:bg-[#F37021] selection:text-white animate-in fade-in duration-200">
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
              {maintenanceActive && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider animate-pulse">
                  <Wrench className="w-3 h-3 text-amber-400" />
                  <span>Maintenance Active</span>
                </span>
              )}
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

              {/* Maintenance Mode & Public Access Control Card */}
              <div
                className={`p-6 rounded-2xl border transition-all ${
                  maintenanceActive
                    ? 'bg-amber-950/25 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        maintenanceActive
                          ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-black text-white">
                          Public Maintenance Mode
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            maintenanceActive
                              ? 'bg-amber-500 text-zinc-950 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {maintenanceActive ? 'Maintenance Mode Enabled' : 'Normal Operation (Live)'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                        {maintenanceActive
                          ? 'When enabled, all public visitors see the Maintenance Onboarding/Splash screen with your custom notice. Entering the community hub is blocked until disabled.'
                          : 'The platform is open to all visitors. Community feed, book searches, and posting are fully accessible.'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      id="toggle-maintenance-btn"
                      disabled={isSavingMaintenance}
                      onClick={() => handleToggleMaintenance(!maintenanceActive)}
                      className={`px-5 py-3 rounded-xl font-black text-xs transition-all cursor-pointer shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-60 whitespace-nowrap ${
                        maintenanceActive
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40 ring-1 ring-amber-400/40'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      <span>{maintenanceActive ? 'Disable Maintenance (Go Live)' : 'Enable Maintenance Mode'}</span>
                    </button>
                  </div>
                </div>

                {/* Maintenance Notice Editor */}
                <form onSubmit={handleSaveMaintenanceNotice} className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-300">
                      Maintenance Screen Message (Live on Splash Screen)
                    </label>
                    {maintenanceSuccessMsg && (
                      <span className="text-xs font-bold text-emerald-400 animate-in fade-in">
                        {maintenanceSuccessMsg}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={maintenanceNotice}
                      onChange={(e) => setMaintenanceNotice(e.target.value)}
                      placeholder="e.g. Platform undergoing scheduled upgrades. Back shortly!"
                      className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                    />
                    <button
                      type="submit"
                      disabled={isSavingMaintenance}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors cursor-pointer border border-zinc-700 flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                    >
                      <span>Save Notice</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Changes take effect immediately on visitor devices and reload screens.
                  </p>
                </form>
              </div>

              {/* System AI Safety & Moderation Controls */}
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-800/80">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                      <CheckCircle2 className={`w-5 h-5 ${isAllModerationActive ? 'text-emerald-500' : 'text-amber-500'}`} />
                      <span>Sampath AI Safety & Moderation Status</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Turn ON or OFF automated profanity filters, photo scanning, and spot auto-verification in real time.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {moderationFeedback && (
                      <span className="text-xs font-bold text-emerald-400 animate-in fade-in mr-1">
                        {moderationFeedback}
                      </span>
                    )}
                    <button
                      type="button"
                      id="toggle-all-moderation-btn"
                      disabled={isSavingModeration}
                      onClick={handleToggleAllModeration}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors border border-zinc-700 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      {isAllModerationActive ? 'Disable All Filters' : 'Enable All Filters'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1: Multilingual Profanity Filter */}
                  <div
                    id="profanity-filter-card"
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      modSettings.profanityFilter
                        ? 'bg-zinc-950 border-emerald-950/60 ring-1 ring-emerald-500/20'
                        : 'bg-zinc-950/70 border-amber-950/40 ring-1 ring-amber-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs text-zinc-200 font-bold block">
                          Multilingual Profanity Filter
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          English, Sinhala, Singlish, Tamil, & Tanglish
                        </span>
                      </div>
                      <button
                        type="button"
                        id="toggle-profanity-switch"
                        role="switch"
                        aria-checked={modSettings.profanityFilter}
                        disabled={isSavingModeration}
                        onClick={() => handleToggleModerationKey('profanityFilter', !modSettings.profanityFilter)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#F37021] disabled:opacity-50 ${
                          modSettings.profanityFilter ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                        title={modSettings.profanityFilter ? 'Turn OFF Profanity Filter' : 'Turn ON Profanity Filter'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            modSettings.profanityFilter ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                      <div className={`text-xs font-black flex items-center gap-1.5 ${
                        modSettings.profanityFilter ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          modSettings.profanityFilter ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`} />
                        <span>{modSettings.profanityFilter ? 'Active & Operational' : 'Disabled (Bypassed)'}</span>
                      </div>
                      <button
                        type="button"
                        id="toggle-profanity-btn"
                        onClick={() => handleToggleModerationKey('profanityFilter', !modSettings.profanityFilter)}
                        disabled={isSavingModeration}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          modSettings.profanityFilter
                            ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30'
                            : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                        }`}
                      >
                        {modSettings.profanityFilter ? 'Turn OFF' : 'Turn ON'}
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Auto AI Spot Verification */}
                  <div
                    id="ai-verify-card"
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      modSettings.aiSpotVerification
                        ? 'bg-zinc-950 border-emerald-950/60 ring-1 ring-emerald-500/20'
                        : 'bg-zinc-950/70 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs text-zinc-200 font-bold block">
                          Auto AI Spot Verification
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          Auto-verified badges for sightings
                        </span>
                      </div>
                      <button
                        type="button"
                        id="toggle-ai-verify-switch"
                        role="switch"
                        aria-checked={modSettings.aiSpotVerification}
                        disabled={isSavingModeration}
                        onClick={() => handleToggleModerationKey('aiSpotVerification', !modSettings.aiSpotVerification)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#F37021] disabled:opacity-50 ${
                          modSettings.aiSpotVerification ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                        title={modSettings.aiSpotVerification ? 'Turn OFF Auto AI Verification' : 'Turn ON Auto AI Verification'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            modSettings.aiSpotVerification ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                      <div className={`text-xs font-black flex items-center gap-1.5 ${
                        modSettings.aiSpotVerification ? 'text-emerald-400' : 'text-zinc-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          modSettings.aiSpotVerification ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                        }`} />
                        <span>{modSettings.aiSpotVerification ? 'Verified Badges Active' : 'Auto-Badging Off'}</span>
                      </div>
                      <button
                        type="button"
                        id="toggle-ai-verify-btn"
                        onClick={() => handleToggleModerationKey('aiSpotVerification', !modSettings.aiSpotVerification)}
                        disabled={isSavingModeration}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          modSettings.aiSpotVerification
                            ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30'
                            : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                        }`}
                      >
                        {modSettings.aiSpotVerification ? 'Turn OFF' : 'Turn ON'}
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Image Multimodal Guardian */}
                  <div
                    id="image-guardian-card"
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      modSettings.imageGuardian
                        ? 'bg-zinc-950 border-emerald-950/60 ring-1 ring-emerald-500/20'
                        : 'bg-zinc-950/70 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs text-zinc-200 font-bold block">
                          Image Multimodal Guardian
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          Photo safety & policy inspection
                        </span>
                      </div>
                      <button
                        type="button"
                        id="toggle-image-guardian-switch"
                        role="switch"
                        aria-checked={modSettings.imageGuardian}
                        disabled={isSavingModeration}
                        onClick={() => handleToggleModerationKey('imageGuardian', !modSettings.imageGuardian)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#F37021] disabled:opacity-50 ${
                          modSettings.imageGuardian ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                        title={modSettings.imageGuardian ? 'Turn OFF Image Guardian' : 'Turn ON Image Guardian'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            modSettings.imageGuardian ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                      <div className={`text-xs font-black flex items-center gap-1.5 ${
                        modSettings.imageGuardian ? 'text-emerald-400' : 'text-zinc-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          modSettings.imageGuardian ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                        }`} />
                        <span>{modSettings.imageGuardian ? 'Photo Scanning Active' : 'Photo Shield Off'}</span>
                      </div>
                      <button
                        type="button"
                        id="toggle-image-guardian-btn"
                        onClick={() => handleToggleModerationKey('imageGuardian', !modSettings.imageGuardian)}
                        disabled={isSavingModeration}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          modSettings.imageGuardian
                            ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30'
                            : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                        }`}
                      >
                        {modSettings.imageGuardian ? 'Turn OFF' : 'Turn ON'}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500">
                  Note: Disabling the <strong>Multilingual Profanity Filter</strong> bypasses text moderation, allowing visitors to post without being blocked by word filters. Disabling <strong>Image Multimodal Guardian</strong> allows photo uploads without skin-tone or AI vision vetting.
                </p>
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
              onToggleHideStall={onToggleHideStall}
              onImportStalls={onImportStalls}
              onRefreshStalls={onRefreshStalls}
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
              onToggleDisable={(uid) => {
                if (onToggleDisableUser) {
                  onToggleDisableUser(uid);
                }
                setServerUsers((prev) =>
                  prev.map((u) => {
                    if (u.id === uid || u.handle === uid) {
                      return { ...u, isDisabled: !u.isDisabled };
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
