import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n, LANG_LABELS, Lang } from '../../context/I18nContext';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Trees, 
  Activity, 
  Cpu, 
  Building2, 
  Award, 
  Compass, 
  ChevronRight,
  ChevronDown,
  Fingerprint,
  ArrowRight,
  Flame,
  Wind,
  Check,
  Moon,
  Sun,
  Globe
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register, loginWithDemo, registeredUsers, resendVerification } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [langOpen, setLangOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'demo'>('login');

  // Login form state — vacío al entrar (sin datos precargados)
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
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setLoginError(res.error || t('auth.err.invalidCreds'));
      }
    } catch (err) {
      setLoginError(t('auth.err.authCrypto'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    if (!regName.trim()) {
      setRegisterError(t('auth.err.nameRequired'));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegisterError(t('auth.err.passwordMismatch'));
      return;
    }
    if (regPassword.length < 6) {
      setRegisterError(t('auth.err.passwordShort'));
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
      } else {
        setRegisterError(res.error || t('auth.err.registerFailed'));
      }
    } catch (err) {
      setRegisterError(t('auth.err.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const demoAccounts = [
    {
      id: 'user-planificador-02',
      name: 'Demo Planificador Urbano',
      email: 'mcruz@munitrujillo.gob.pe',
      role: 'Planificador Urbano MPT',
      badge: 'Gestión Municipal',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      desc: 'Modelado de intervenciones NbS, presupuestos en Soles (PEN) y políticas públicas.'
    },
    {
      id: 'user-analista-03',
      name: 'Demo Analista Ambiental',
      email: 'cmendoza@oefa.gob.pe',
      role: 'Analista Ambiental OEFA / SENAMHI',
      badge: 'Fiscalización',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      desc: 'Monitoreo de umbrales ECA-Aire, validación estadística y análisis de dispersión.'
    },
    {
      id: 'user-admin-iot-04',
      name: 'Demo Administrador IoT',
      email: 'rsanchez.iot@trujillo.gob.pe',
      role: 'Administrador de Red IoT',
      badge: 'Infraestructura',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      desc: 'Calibración 2-Etapas (Zhivkov/Cowell), telemetría MQTT y topología de nodos.'
    },
    {
      id: 'user-ciudadano-05',
      name: 'Demo Ciudadano',
      email: 'lucia.torres.trujillo@gmail.com',
      role: 'Ciudadano / Veedor Ambiental',
      badge: 'Consulta Pública',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      desc: 'Visualización del Gemelo Digital 3D, mapas de calor, calidad de aire y alertas.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative">
      {/* Background Graphic Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      {/* Top Navbar — z-40 para que el selector idioma quede por encima del card */}
      <header className="bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700 px-6 py-3.5 relative z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">GEMELO DIGITAL TRUJILLO</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md uppercase">
                  Microescala & NbS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Plataforma de Investigación Científica & Simulación Urbana 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium mr-2">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Universidad Nacional de Trujillo
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Seguridad RBAC + SHA-256
              </span>
            </div>
            <button onClick={toggleTheme} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center" title={theme==='dark'?'Modo claro':'Modo oscuro'}>
              {theme==='dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <div className="relative">
              <button onClick={()=>setLangOpen(!langOpen)} className="h-9 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" /><span>{LANG_LABELS[lang]}</span><ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langOpen?'rotate-180':''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-[60]">
                  {(Object.keys(LANG_LABELS) as Lang[]).map(l=>(
                    <button key={l} onClick={()=>{setLang(l); setLangOpen(false);}} className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 ${lang===l?'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300':'text-slate-700 dark:text-slate-200'}`}>
                      <span>{l==='es'?'Español':l==='en'?'English':l==='zh'?'中文':l==='de'?'Deutsch':l==='fr'?'Français':'Português'}</span><span className="text-[11px] font-mono text-slate-400">{LANG_LABELS[l]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 py-8 lg:py-12 relative z-10 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          
          {/* Left Column: Thesis & Scientific Context */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('auth.badge')}</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {t('auth.title')}
              </h1>

              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t('auth.subtitle')}
              </p>
            </div>

            {/* Scientific Highlights Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700 p-3.5 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  {t('auth.cardCalibTitle')}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('auth.cardCalibDesc')}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700 p-3.5 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  {t('auth.cardMLTitle')}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('auth.cardMLDesc')}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700 p-3.5 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <Trees className="w-4 h-4 text-teal-600" />
                  {t('auth.cardNbSTitle')}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('auth.cardNbSDesc')}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700 p-3.5 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  {t('auth.cardPolicyTitle')}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('auth.cardPolicyDesc')}
                </p>
              </div>
            </div>

            {/* Author Credit — ambos tesistas separados para crédito individual */}
            <div className="space-y-2.5 pt-3">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">JF</div>
                <div>
                  <strong className="text-slate-900 dark:text-white block leading-tight">Ing. Joel Anderson Florian Arévalo</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tesista — Investigador Principal (UNT)</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 dark:border-teal-800 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">JG</div>
                <div>
                  <strong className="text-slate-900 dark:text-white block leading-tight">Ing. Jason Anderson Galvéz Luna</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tesista — Co-Investigador (UNT)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card Gate */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-xl relative">
              
              {/* Tab Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold mb-6">
                <button
                  onClick={() => { setActiveTab('login'); setLoginError(null); }}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'login' 
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {t('auth.tabs.login')}
                </button>
                <button
                  onClick={() => { setActiveTab('register'); setRegisterError(null); }}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'register' 
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {t('auth.tabs.register')}
                </button>
                <button
                  onClick={() => setActiveTab('demo')}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'demo' 
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {t('auth.tabs.demo')}
                </button>
              </div>

              {/* TAB 1: LOGIN FORM */}
              {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('auth.login.title')}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('auth.login.desc')}
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl space-y-2">
                      <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /><span>{loginError}</span></div>
                      {loginError.toLowerCase().includes('verificar') && (
                        <button type="button" onClick={async()=>{ const r=await resendVerification(loginEmail); setLoginError(r.success ? t('auth.resend.loginSuccess') : r.error || t('auth.resend.error')); }} className="text-xs font-bold text-emerald-700 underline">{t('auth.resend.button')}</button>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
                      {t('auth.login.email')}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="investigador@unitru.edu.pe"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 pl-9 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('auth.login.password')}</label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 pl-9 pr-10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>{t('auth.login.verifying')}</span>
                    ) : (
                      <>
                        <span>{t('auth.login.submit')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{t('auth.login.noCreds')}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('demo')}
                      className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      {t('auth.login.demoLink')}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: REGISTER FORM */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('auth.register.title')}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('auth.register.desc')}
                    </p>
                  </div>

                  {registerError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{registerError}</span>
                    </div>
                  )}

                  {registerSuccess && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> {t('auth.register.checkEmail')}</div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">{t('auth.register.checkEmailDesc')}</p>
                      <button onClick={async()=>{ const r=await resendVerification(regEmail); setResendStatus(r.success ? t('auth.resend.registerSuccess') : r.error || t('auth.resend.error')); }} className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-800">{t('auth.resend.button')}</button>
                      {resendStatus && <p className="text-xs text-slate-600 dark:text-slate-400">{resendStatus}</p>}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('auth.register.name')}</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ej. Ing. Juan Pérez"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('auth.register.email')}</label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="jperez@unt.edu.pe"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('auth.register.institution')}</label>
                    <input
                      type="text"
                      required
                      value={regInstitution}
                      onChange={(e) => setRegInstitution(e.target.value)}
                      placeholder="UNT / MPT / OEFA"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('auth.register.password')}</label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 6 caracteres"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('auth.register.confirm')}</label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repetir contraseña"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t('auth.register.submit')}</span>
                  </button>
                </form>
              )}

              {/* TAB 3: DEMO ROLES (1-CLICK INSTANT ACCESS) */}
              {activeTab === 'demo' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('auth.demo.title')}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('auth.demo.desc')}
                    </p>
                  </div>

                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {demoAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => loginWithDemo(account.id)}
                        className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50/70 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-300 transition-all group flex items-start justify-between gap-2 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-950">
                              {account.name}
                            </strong>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${account.badgeColor}`}>
                              {account.badge}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block">
                            {account.role}
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {account.desc}
                          </p>
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 group-hover:bg-emerald-600 group-hover:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 transition-all shrink-0 mt-1">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Banner */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t("auth.footer")}</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-700 py-4 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <strong>Gemelo Digital Trujillo</strong> | Tesis de Posgrado en Ciencias Ambientales e Informática
          </div>
          <div className="flex items-center gap-4">
            <span>Trujillo, La Libertad, Perú</span>
            <span>Versión 2026.3.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
