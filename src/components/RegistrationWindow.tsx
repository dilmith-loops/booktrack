import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  CreditCard
} from 'lucide-react';
import { UserProfile } from '../types';

interface RegistrationWindowProps {
  isOpen: boolean;
  onClose?: () => void;
  onRegister: (profile: UserProfile) => void;
  onProfileUpdate?: (profile: UserProfile) => void;
  onLogout?: () => void;
  onStartTour?: () => void;
  currentProfile?: UserProfile | null;
  allowDismiss?: boolean;
}

type AuthTab = 'login' | 'register' | 'forgot_password';
type LoginMethod = 'password' | 'otp';

export const RegistrationWindow: React.FC<RegistrationWindowProps> = ({
  isOpen,
  onClose,
  onRegister,
  onProfileUpdate,
  onLogout,
  onStartTour,
  currentProfile,
  allowDismiss = false
}) => {
  // If user is already logged in, show their profile view by default
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');

  // Registration Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedDemoOtp, setGeneratedDemoOtp] = useState<string | null>(null);

  // Forgot Password Form
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [isForgotOtpSent, setIsForgotOtpSent] = useState(false);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Profile States (for already signed-in users)
  const [editName, setEditName] = useState(currentProfile?.name || '');
  const [editEmail, setEditEmail] = useState(currentProfile?.email || '');
  const [editPhone, setEditPhone] = useState(currentProfile?.phone || '');
  const [editCardholder, setEditCardholder] = useState(!!currentProfile?.isSampathCardholder);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showChangePasswordFields, setShowChangePasswordFields] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Sync edit states when currentProfile changes or window opens
  React.useEffect(() => {
    if (currentProfile) {
      setEditName(currentProfile.name || '');
      setEditEmail(currentProfile.email || '');
      setEditPhone(currentProfile.phone || '');
      setEditCardholder(!!currentProfile.isSampathCardholder);
      setEditNewPassword('');
      setShowChangePasswordFields(false);
      setEditSuccessMsg(null);
      setEditErrorMsg(null);
    }
  }, [currentProfile, isOpen]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMsg(null);
    setEditSuccessMsg(null);

    if (!editName.trim() || editName.trim().length < 2) {
      setEditErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@') || !editEmail.includes('.')) {
      setEditErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!editPhone.trim() || editPhone.replace(/\D/g, '').length < 9) {
      setEditErrorMsg('Please enter a valid mobile number (minimum 9 digits).');
      return;
    }
    if (editNewPassword && editNewPassword.length < 6) {
      setEditErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentProfile?.id,
          handle: currentProfile?.handle,
          currentEmail: currentProfile?.email,
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          isSampathCardholder: editCardholder,
          newPassword: editNewPassword || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile details.');
      }

      const updatedProfile: UserProfile = data.user;
      localStorage.setItem('sampath_bookfair_user', JSON.stringify(updatedProfile));
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      } else {
        onRegister(updatedProfile);
      }
      setEditSuccessMsg('Your profile details have been saved successfully!');
      setEditNewPassword('');
      setShowChangePasswordFields(false);
    } catch (err: any) {
      setEditErrorMsg(err.message || 'Error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const resetForms = () => {
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setLoginIdentifier('');
    setLoginPassword('');
    setLoginOtp('');
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setIsOtpSent(false);
    setIsForgotOtpSent(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCloseModal = () => {
    resetForms();
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  // Clear messages when switching tabs
  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsOtpSent(false);
    setIsForgotOtpSent(false);
  };

  // 1. REGISTER SUBMISSION
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || regName.trim().length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@') || !regEmail.includes('.')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (!regPhone.trim() || regPhone.replace(/\D/g, '').length < 9) {
      setErrorMsg('Please enter a valid mobile number (e.g. 077 123 4567).');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword,
          isSampathCardholder: false
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      const profile: UserProfile = data.user;
      localStorage.setItem('sampath_bookfair_user', JSON.stringify(profile));
      onRegister(profile);
      setSuccessMsg(data.message || 'Account created successfully!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating account.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. LOGIN SUBMISSION (PASSWORD)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your email or mobile phone number.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      const profile: UserProfile = data.user;
      localStorage.setItem('sampath_bookfair_user', JSON.stringify(profile));
      onRegister(profile);
      setSuccessMsg(data.message || 'Welcome back!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email, phone, or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. OTP REQUEST (LOGIN)
  const handleRequestOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your registered email or phone to receive an OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP code.');
      }

      setIsOtpSent(true);
      if (data.otp) {
        setGeneratedDemoOtp(data.otp);
        setLoginOtp(data.otp);
      }
      setSuccessMsg(`Verification code generated: ${data.otp || ''}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. OTP VERIFY (LOGIN)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginOtp.trim()) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          otp: loginOtp.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired OTP code.');
      }

      const profile: UserProfile = data.user;
      localStorage.setItem('sampath_bookfair_user', JSON.stringify(profile));
      onRegister(profile);
      setSuccessMsg('Logged in successfully!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. FORGOT PASSWORD - REQUEST OTP
  const handleForgotRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMsg('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset code.');
      }

      setIsForgotOtpSent(true);
      if (data.otp) {
        setForgotOtp(data.otp);
      }
      setSuccessMsg(`Reset code sent! Use code: ${data.otp || ''}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error requesting reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. FORGOT PASSWORD - CONFIRM RESET
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotOtp.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      const profile: UserProfile = data.user;
      localStorage.setItem('sampath_bookfair_user', JSON.stringify(profile));
      onRegister(profile);
      setSuccessMsg('Password updated! You are now logged in.');
      setTimeout(() => {
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // User Logout
  const handleLogout = () => {
    localStorage.removeItem('sampath_bookfair_user');
    if (onLogout) {
      onLogout();
    }
    setLoginIdentifier('');
    setLoginPassword('');
    setActiveTab('login');
    setSuccessMsg('Logged out successfully.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-auto">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#F37021] via-[#EA580C] to-[#C2410C] p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex items-center justify-between relative z-10 mb-3">
            <div className="bg-white p-1.5 px-2.5 rounded-xl shadow-xs border border-white/20 flex items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Sampath Bank"
                className="h-7 w-auto object-contain"
              />
            </div>

            {allowDismiss && (
              <button
                onClick={handleCloseModal}
                id="close-auth-modal-btn"
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative z-10">
            <h2 className="text-base sm:text-lg font-black text-white leading-tight">
              {currentProfile ? 'My Spotter Profile' : 'Sampath Book Finder'}
            </h2>
            <p className="text-xs text-orange-100 font-medium mt-0.5">
              {currentProfile ? 'View & edit your account details' : 'Colombo International Book Fair 2026'}
            </p>
          </div>
        </div>

        {/* If user is logged in, show User Profile Details To Be Edited */}
        {currentProfile ? (
          <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Spotter Identity Badge */}
            <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#F37021] to-[#EA580C] text-white font-black text-xl flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
                {currentProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-black text-zinc-900 text-sm leading-tight">{currentProfile.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Spotter
                  </span>
                </div>
                <div className="text-xs font-bold text-[#EA580C] mt-0.5">{currentProfile.handle}</div>
              </div>
            </div>

            {/* Success & Error Banners */}
            {editSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}
            {editErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            {/* Editable Profile Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Full Name</span>
                  <span className="text-[10px] text-zinc-400 font-semibold">Editable</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#F37021]/30 focus:border-[#F37021] text-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-zinc-400 font-semibold">Account & OTP recovery</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#F37021]/30 focus:border-[#F37021] text-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Mobile Phone Number</span>
                  <span className="text-[10px] text-zinc-400 font-semibold">Editable</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. 077 123 4567"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#F37021]/30 focus:border-[#F37021] text-zinc-900 transition-all"
                  />
                </div>
              </div>

              {/* Sampath Cardholder Perks Toggle */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="edit-cardholder-checkbox"
                  checked={editCardholder}
                  onChange={(e) => setEditCardholder(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-300 text-[#F37021] focus:ring-[#F37021] cursor-pointer"
                />
                <label htmlFor="edit-cardholder-checkbox" className="text-xs cursor-pointer select-none">
                  <span className="font-black text-zinc-900 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#F37021]" />
                    Sampath Bank Cardholder
                  </span>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Check this to highlight up to 30% instant discounts at partner BMICH book fair stalls.
                  </p>
                </label>
              </div>

              {/* Collapsible Change Password Section */}
              <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordFields(!showChangePasswordFields)}
                  className="w-full flex items-center justify-between text-xs font-bold text-zinc-700 hover:text-zinc-900 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                    Change Account Password
                  </span>
                  <span className="text-[10px] text-[#EA580C] font-black">
                    {showChangePasswordFields ? 'Hide' : '+ Update'}
                  </span>
                </button>

                {showChangePasswordFields && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editNewPassword}
                        onChange={(e) => setEditNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 chars)"
                        className="w-full pl-9 pr-10 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#F37021]/30 focus:border-[#F37021] text-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-medium">Leave blank if you don't wish to change your password.</p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={isSavingProfile}
                id="save-profile-btn"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-black text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Profile Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </form>

            {/* Feature Tour & Sign Out */}
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  if (onStartTour) onStartTour();
                }}
                id="profile-start-tour-btn"
                className="w-full py-2 px-3 bg-zinc-100 hover:bg-orange-50 hover:text-[#EA580C] text-zinc-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F37021]" />
                <span>Explore App Features & Tips</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                id="profile-logout-btn"
                className="w-full py-2 px-3 text-zinc-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out / Switch Account</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher (Login vs Register for Guests) */}
            <div className="grid grid-cols-2 border-b border-zinc-200 bg-zinc-50 text-xs font-black">
              <button
                onClick={() => handleTabChange('login')}
                className={`py-3 text-center transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'border-[#F37021] text-[#F37021] bg-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Recurring User (Log In)</span>
              </button>

              <button
                onClick={() => handleTabChange('register')}
                className={`py-3 text-center transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'border-[#F37021] text-[#F37021] bg-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>New Spotter (Register)</span>
              </button>
            </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: LOGIN (RECURRING USERS) */}
        {activeTab === 'login' && (
          <div className="p-5 space-y-4">
            {/* Login Method Sub-Toggle */}
            <div className="flex items-center justify-between text-xs bg-zinc-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                  loginMethod === 'password'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                  loginMethod === 'otp'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                One-Time OTP Login
              </button>
            </div>

            {/* Sub-form 1: Password Login */}
            {loginMethod === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Email or Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. nimal@example.com or 077 123 4567"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-700">Password</label>
                    <button
                      type="button"
                      onClick={() => handleTabChange('forgot_password')}
                      className="text-[11px] font-bold text-[#F37021] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#F37021] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>Log In to Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Sub-form 2: OTP Login */
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Email or Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. nimal@example.com or 0771234567"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                    />
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isLoading}
                      className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {isOtpSent ? 'Resend' : 'Send Code'}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    We'll generate an instant verification code to your email/phone.
                  </p>
                </div>

                {isOtpSent && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      6-Digit Verification Code (OTP)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="e.g. 123456"
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold tracking-widest text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                      />
                    </div>
                  </div>
                )}

                {isOtpSent && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#F37021] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Log In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </form>
            )}

            <div className="pt-2 text-center text-xs text-zinc-500 font-medium">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className="text-[#F37021] font-bold hover:underline cursor-pointer"
              >
                Register as New Spotter
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER (NEW VISITOR) */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="p-5 space-y-3.5">
            {/* 1. Full Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Perera, Tanya Silva"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>
            </div>

            {/* 2. Email Address (For Forgot Password & OTP) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700">Email Address *</label>
                <span className="text-[10px] text-zinc-400 font-medium">
                  Used for OTP & Password Recovery
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>
            </div>

            {/* 3. Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 077 123 4567 or +94 77 123 4567"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
              </div>
            </div>

            {/* 4. Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700">Password *</label>
                <span className="text-[10px] text-zinc-400">Min. 6 characters</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Create a secure password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Register Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#F37021] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Enter Fair</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs text-zinc-500 font-medium">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="text-[#F37021] font-bold hover:underline cursor-pointer"
              >
                Log In to Account
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {activeTab === 'forgot_password' && (
          <div className="p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-[#F37021] flex items-center justify-center mx-auto">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-zinc-900">Reset Your Password</h3>
              <p className="text-xs text-zinc-500 font-medium">
                Enter your registered email address to receive a verification code and set a new password.
              </p>
            </div>

            {!isForgotOtpSent ? (
              <form onSubmit={handleForgotRequestOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Reset Code</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold tracking-widest text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#F37021] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Set New Password & Log In</span>
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                &larr; Back to Log In
              </button>
            </div>
          </div>
        )}
      </>
    )}
  </div>
</div>
  );
};
