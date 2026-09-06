import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
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
    logout, 
    switchRole 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'demo' | 'profile'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('joelandersonarevalo@gmail.com');
  const [loginPassword, setLoginPassword] = useState<string>('trujillo2026');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Register form state
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('investigador');
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
        setLoginError(res.error || 'Error al iniciar sesión.');
      }
    } catch (err) {
      setLoginError('Error de red o procesamiento criptográfico.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    if (regPassword !== regConfirmPassword) {
      setRegisterError('Las contraseñas no coinciden.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        institution: regInstitution
      });
      if (res.success) {
        setRegisterSuccess(true);
        setTimeout(() => {
          setRegisterSuccess(false);
          onClose();
        }, 1200);
      } else {
        setRegisterError(res.error || 'Error al registrar la cuenta.');
      }
    } catch (err) {
      setRegisterError('Error al crear la cuenta con cifrado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-1">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Control de Acceso y Gestión de Usuarios</h3>
          <p className="text-xs text-slate-500">
            Seguridad criptográfica (SHA-256 + Salt) y Control de Acceso Basado en Roles (RBAC).
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
                  <span className="font-bold text-slate-900">{user.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <span className="text-slate-600 text-[11px] block mt-0.5 line-clamp-1">{user.institution}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-xs text-rose-700 hover:text-rose-800 font-semibold px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-200 flex items-center gap-1"
              title="Cerrar sesión activa"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registrarse
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'demo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perfiles Rápidos
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'profile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Permisos
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
              <label className="text-xs text-slate-700 font-semibold block">Correo Electrónico Institucional</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="investigador@unitru.edu.pe"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold block">Contraseña</label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
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
              {isSubmitting ? 'Verificando Hash...' : 'Ingresar al Gemelo Digital'}
            </button>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Contraseñas protegidas mediante digestión SHA-256 con salt dinámico de 128 bits.</span>
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
                <span>¡Cuenta registrada y autenticada con éxito! Redirigiendo...</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold block">Nombre y Apellidos</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Joel Arevalo"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold block">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="investigador@trujillo.edu.pe"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold block">Rol en el Sistema</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs cursor-pointer"
                >
                  <option value="investigador">Investigador / Tesista Líder</option>
                  <option value="planificador">Planificador Urbano (MPT)</option>
                  <option value="analista">Analista Ambiental (OEFA/SENAMHI)</option>
                  <option value="admin_iot">Administrador de Red IoT</option>
                  <option value="ciudadano">Ciudadano / Observador</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold block">Institución / Organización</label>
                <input
                  type="text"
                  placeholder="Ej. Municipalidad Provincial de Trujillo"
                  value={regInstitution}
                  onChange={(e) => setRegInstitution(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold block">Contraseña (Mín. 6 car.)</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold block">Confirmar Contraseña</label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-900/10 mt-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Registrando Criptográficamente...' : 'Crear Cuenta y Guardar en Gemelo Digital'}
            </button>
          </form>
        )}

        {/* TAB 3: DEMO ROLES QUICK SELECTOR */}
        {activeTab === 'demo' && (
          <div className="space-y-2.5">
            <span className="text-xs text-slate-600 block font-semibold">
              Cambia instantáneamente entre roles para evaluar funcionalidades y permisos:
            </span>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {registeredUsers.map(u => {
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
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{u.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase">
                          {u.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">{u.institution}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{u.email}</span>
                    </div>
                    {isCurrent ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded-lg">
                        Activar
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
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Matriz de Permisos Activos
                </span>
                <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                  {user.role}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  permissions.canSimulateMl ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <span>Simulación ML & NbS</span>
                  {permissions.canSimulateMl ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4" />}
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  permissions.canInjectIoT ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <span>Inyección Telemetría IoT</span>
                  {permissions.canInjectIoT ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4" />}
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  permissions.canExportReports ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <span>Exportación Multiformato</span>
                  {permissions.canExportReports ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4" />}
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  permissions.canManageUsers ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <span>Administración de Roles</span>
                  {permissions.canManageUsers ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Quick Switch Role */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-700 font-semibold block">Cambiar Rol en Tiempo Real:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {(['investigador', 'planificador', 'analista', 'admin_iot', 'ciudadano'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-semibold capitalize transition-all ${
                      user.role === r 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
