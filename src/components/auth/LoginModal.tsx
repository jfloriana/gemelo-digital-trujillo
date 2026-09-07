import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import {
  X, 
  Lock, 
  User as UserIcon, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  LogIn,
  KeyRound,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  Shield,
  Activity,
  Trees,
  Sliders,
  LogOut,
  Info
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    registeredUsers, 
    permissions, 
    login, 
    register, 
    loginWithDemo,
    logout
  } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'demo' | 'profile'>('login');
  
  // Login form state — vacío al entrar
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Register form state
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regInstitution, setRegInstitution] = useState<string>('Universidad Nacional de Trujillo');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (res.success) {
        onClose();
      } else {
        setLoginError(res.error || t('login.error.loginFailed'));
      }
    } catch (err) {
      setLoginError(t('login.error.network'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    if (regPassword !== regConfirmPassword) {
      setRegisterError(t('login.error.passwordMismatch'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        institution: regInstitution
      });
      if (res.success) {
        setRegisterSuccess(true);
        setTimeout(() => {
          setRegisterSuccess(false);
          onClose();
        }, 1200);
      } else {
        setRegisterError(res.error || t('login.error.registerFailed'));
      }
    } catch (err) {
      setRegisterError(t('login.error.registerCrypto'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full p-6 text-slate-900 dark:text-white shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-1">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('login.header.title')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('login.header.subtitle')}
          </p>
        </div>

        {/* Active User Card */}
        {user && (
          <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] block mt-0.5 line-clamp-1">{user.institution}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-xs text-rose-700 hover:text-rose-800 font-semibold px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-200 flex items-center gap-1"
              title={t('login.activeUser.logoutTitle')}
            >
              <LogOut className="w-3.5 h-3.5" />
              {t('login.activeUser.logout')}
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'login' ? 'bg-white dark:bg-slate-800 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('login.tabs.login')}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'register' ? 'bg-white dark:bg-slate-800 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('login.tabs.register')}
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'demo' ? 'bg-white dark:bg-slate-800 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('login.tabs.demo')}
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'profile' ? 'bg-white dark:bg-slate-800 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('login.tabs.profile')}
            </button>
          )}
        </div>

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('login.field.emailInst')}</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="investigador@unitru.edu.pe"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('login.field.password')}</label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-900/10 mt-3 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? t('login.btn.verifying') : t('login.btn.submit')}
            </button>

            <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('login.hint.hash')}</span>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {registerError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            {registerSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('login.success.registered')}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('login.field.name')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('login.placeholder.name')}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('login.field.email')}</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="investigador@trujillo.edu.pe"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('login.field.institution')}</label>
                <input
                  type="text"
                  placeholder={t('login.placeholder.institution')}
                  value={regInstitution}
                  onChange={(e) => setRegInstitution(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('login.field.password6')}</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('login.field.confirmPassword')}</label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-900/10 mt-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? t('login.btn.registering') : t('login.btn.register')}
            </button>
          </form>
        )}

        {/* TAB 3: DEMO ROLES QUICK SELECTOR */}
        {activeTab === 'demo' && (
          <div className="space-y-2.5">
            <span className="text-xs text-slate-600 dark:text-slate-400 block font-semibold">
              {t('login.demo.intro')}
            </span>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {registeredUsers.filter(u => u.email.toLowerCase() !== 'joelandersonarevalo@gmail.com').map(u => {
                const isCurrent = user?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      loginWithDemo(u.id);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500/30 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{u.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase">
                          {u.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{u.institution}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{u.email}</span>
                    </div>
                    {isCurrent ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded-lg">
                        {t('login.demo.activate')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: PERMISSIONS & ROLE MATRIX */}
        {activeTab === 'profile' && user && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  {t('login.perms.title')}
                </span>
                <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                  {user.role}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  permissions.canSimulateMl ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <span>{t('login.perms.ml')}</span>
                  {permissions.canSimulateMl ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4" />}
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  permissions.canInjectIoT ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <span>{t('login.perms.iot')}</span>
                  {permissions.canInjectIoT ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4" />}
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  permissions.canExportReports ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <span>{t('login.perms.export')}</span>
                  {permissions.canExportReports ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4" />}
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  permissions.canManageUsers ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <span>{t('login.perms.roles')}</span>
                  {permissions.canManageUsers ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
