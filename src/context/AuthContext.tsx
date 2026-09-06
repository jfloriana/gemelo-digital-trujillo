import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { supabase } from '../lib/supabase';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  institution: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  registeredUsers: User[];
  permissions: UserPermissions;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  loginWithDemo: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
}

// Mapeo DB -> User app
const mapProfileToUser = (p: any): User => ({
  id: p.id,
  name: p.name,
  email: p.email,
  role: p.role as UserRole,
  institution: p.institution,
  avatar: p.avatar_url || undefined,
  createdAt: p.created_at,
  lastLogin: p.last_login || undefined,
  token: undefined,
});

// Demo fallback si Supabase no está configurado (sin env) — genérico sin nombres personales
const DEMO_FALLBACK_USERS: User[] = [
  { id: 'user-investigador-01', name: 'Demo Investigador UNT', email: 'investigador.demo@unt.edu.pe', role: 'investigador', institution: 'Universidad Nacional de Trujillo - Demo', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'user-planificador-02', name: 'Demo Planificador Urbano', email: 'mcruz@munitrujillo.gob.pe', role: 'planificador', institution: 'Municipalidad Provincial de Trujillo - Demo' },
  { id: 'user-analista-03', name: 'Demo Analista Ambiental', email: 'cmendoza@oefa.gob.pe', role: 'analista', institution: 'OEFA / SENAMHI - Demo' },
  { id: 'user-admin-iot-04', name: 'Demo Administrador IoT', email: 'rsanchez.iot@trujillo.gob.pe', role: 'admin_iot', institution: 'Red de Sensores IoT - Demo' },
  { id: 'user-ciudadano-05', name: 'Demo Ciudadano', email: 'lucia.torres.trujillo@gmail.com', role: 'ciudadano', institution: 'Comité Ambiental Ciudadano - Demo' },
];

// Mapa demoId -> email para login rápido (acepta id legado o email) — tu correo personal solo en Supabase, no como demo
const DEMO_EMAIL_BY_ID: Record<string, string> = {
  'user-investigador-01': 'investigador.demo@unt.edu.pe',
  'user-planificador-02': 'mfernandez@munitrujillo.gob.pe',
  'user-analista-03': 'cmendoza@oefa.gob.pe',
  'user-admin-iot-04': 'rsanchez.iot@trujillo.gob.pe',
  'user-ciudadano-05': 'lucia.torres.trujillo@gmail.com',
  'user-1': 'investigador.demo@unt.edu.pe',
  'user-2': 'mfernandez@munitrujillo.gob.pe',
  'user-3': 'cmendoza@oefa.gob.pe',
  'user-4': 'lucia.torres.trujillo@gmail.com',
};

export const INITIAL_DEMO_USERS: User[] = DEMO_FALLBACK_USERS;

export const getRolePermissions = (role?: UserRole): UserPermissions => {
  switch (role) {
    case 'investigador':
      return { canSimulateMl: true, canInjectIoT: true, canExportReports: true, canModifyZones: true, canManageUsers: true };
    case 'planificador':
      return { canSimulateMl: true, canInjectIoT: false, canExportReports: true, canModifyZones: true, canManageUsers: false };
    case 'analista':
      return { canSimulateMl: true, canInjectIoT: true, canExportReports: true, canModifyZones: false, canManageUsers: false };
    case 'admin_iot':
      return { canSimulateMl: false, canInjectIoT: true, canExportReports: true, canModifyZones: false, canManageUsers: true };
    case 'ciudadano':
    default:
      return { canSimulateMl: false, canInjectIoT: false, canExportReports: true, canModifyZones: false, canManageUsers: false };
  }
};

const getDemoPermissions = (): UserPermissions => ({
  canSimulateMl: false,
  canInjectIoT: false,
  canExportReports: false,
  canModifyZones: false,
  canManageUsers: false,
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState<boolean>(() => localStorage.getItem('trujillo_is_demo') === 'true');

  const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && !String(import.meta.env.VITE_SUPABASE_URL).includes('placeholder'));

  // Carga perfil por id
  const fetchProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return mapProfileToUser(data);
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    if (data) setRegisteredUsers(data.map(mapProfileToUser));
  };

  // Inicial: sesión existente + listener
  useEffect(() => {
    if (!hasSupabase) {
      // Fallback localStorage legacy
      const saved = localStorage.getItem('trujillo_digital_twin_active_user');
      if (saved) {
        try { setUser(JSON.parse(saved)); } catch {}
      }
      const db = localStorage.getItem('trujillo_digital_twin_users_db');
      if (db) {
        try { setRegisteredUsers(JSON.parse(db)); } catch { setRegisteredUsers(DEMO_FALLBACK_USERS); }
      } else {
        setRegisteredUsers(DEMO_FALLBACK_USERS);
      }
      setLoading(false);
      return;
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // si el email no está confirmado, no dejar pasar (excepto demo)
        if (!session.user.email_confirmed_at && !localStorage.getItem('trujillo_is_demo')) {
          await supabase.auth.signOut();
          setUser(null);
        } else {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setUser(profile);
            await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', session.user.id);
          }
        }
      }
      await fetchAllProfiles();
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (!session.user.email_confirmed_at && !localStorage.getItem('trujillo_is_demo')) {
          await supabase.auth.signOut();
          setUser(null);
          return;
        }
        const profile = await fetchProfile(session.user.id);
        if (profile) setUser(profile);
        await fetchAllProfiles();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('trujillo_is_demo');
        setIsDemo(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) setUser(profile);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [hasSupabase]);

  // Mantener lista actualizada cada 30s si hay sesión
  useEffect(() => {
    if (!hasSupabase || !user) return;
    const id = setInterval(fetchAllProfiles, 30000);
    return () => clearInterval(id);
  }, [hasSupabase, user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!hasSupabase) {
      const normalized = email.trim().toLowerCase();
      const found = registeredUsers.find(u => u.email.toLowerCase() === normalized);
      if (!found) return { success: false, error: 'No se encontró usuario con este correo.' };
      if (password === 'trujillo2026' || password === 'admin123') {
        setUser(found);
        localStorage.setItem('trujillo_digital_twin_active_user', JSON.stringify(found));
        localStorage.removeItem('trujillo_is_demo');
        setIsDemo(false);
        return { success: true };
      }
      return { success: false, error: 'Modo sin Supabase: usa trujillo2026' };
    }
    // Verifica Brevo primero (email_verified en profiles)
    const normalized = email.trim().toLowerCase();
    const { data: prof } = await supabase.from('profiles').select('email_verified').eq('email', normalized).single();
    if (prof && (prof as any).email_verified === false) {
      return { success: false, error: 'Debes verificar tu correo. Revisa tu bandeja y haz clic en “Verificar mi correo”. ¿No lo ves? usa Reenviar verificación.' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { success: false, error: 'Debes verificar tu correo. Revisa tu bandeja y haz clic en “Verificar mi correo”. ¿No lo ves? usa Reenviar verificación.' };
      }
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Credenciales inválidas. Verifica correo y contraseña.' };
      }
      return { success: false, error: error.message };
    }
    if (data.user) {
      const { data: prof2 } = await supabase.from('profiles').select('email_verified').eq('id', data.user.id).single();
      if (prof2 && (prof2 as any).email_verified === false) {
        await supabase.auth.signOut();
        return { success: false, error: 'Debes verificar tu correo antes de ingresar. Revisa tu bandeja y haz clic en “Verificar mi correo”.' };
      }
    }
    localStorage.removeItem('trujillo_is_demo');
    setIsDemo(false);
    return { success: true };
  };

  const sendVerificationViaBrevo = async (email: string, name: string) => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/verify` : undefined;
    // Brevo 100% — sin Supabase, token propio + BCC a Joel
    const r = await fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, redirect_to: redirectTo }),
    });
    if (!r.ok) {
      const txt = await r.text().then(t=>t.slice(0,800));
      console.warn('Brevo /api/send-verification fallo', txt);
      throw new Error(txt);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    if (!hasSupabase) {
      const normalized = data.email.trim().toLowerCase();
      if (registeredUsers.some(u => u.email.toLowerCase() === normalized)) {
        return { success: false, error: 'Ya existe cuenta con este correo.' };
      }
      const newUser: User = { id: `user-${Date.now()}`, name: data.name.trim(), email: normalized, role: data.role, institution: data.institution.trim() || 'Comunidad Digital Trujillo' };
      const updated = [...registeredUsers, newUser];
      setRegisteredUsers(updated);
      setUser(newUser);
      localStorage.setItem('trujillo_digital_twin_users_db', JSON.stringify(updated));
      localStorage.setItem('trujillo_digital_twin_active_user', JSON.stringify(newUser));
      return { success: true };
    }
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: { name: data.name.trim(), role: data.role, institution: data.institution.trim() || 'Comunidad Digital Trujillo' },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/verify` : undefined,
      }
    });
    if (error) {
      if (error.message.includes('already registered')) return { success: false, error: 'Ya existe cuenta con este correo.' };
      return { success: false, error: error.message };
    }
    // Brevo 100% — envía verificación con diseño profesional (no depende de Supabase SMTP)
    await sendVerificationViaBrevo(data.email.trim(), data.name.trim());
    return { success: true };
  };

  const resendVerification = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!hasSupabase) return { success: false, error: 'Supabase no configurado' };
    try {
      await sendVerificationViaBrevo(email.trim(), email.split('@')[0]);
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg };
    }
  };

  const loginWithDemo = async (userId: string) => {
    const email = DEMO_EMAIL_BY_ID[userId] || userId;
    localStorage.setItem('trujillo_is_demo', 'true');
    setIsDemo(true);
    if (!hasSupabase) {
      const found = registeredUsers.find(u => u.id === userId) || DEMO_FALLBACK_USERS.find(u => u.id === userId);
      if (found) {
        setUser(found);
        localStorage.setItem('trujillo_digital_twin_active_user', JSON.stringify(found));
      }
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: 'trujillo2026' });
    if (error) {
      console.warn('loginWithDemo fallo', error.message);
      if (error.message.includes('Invalid login credentials')) {
        await supabase.auth.signUp({ email, password: 'trujillo2026', options: { data: { name: email.split('@')[0], role: 'ciudadano', institution: 'Demo' } } });
      }
    }
  };

  const logout = async () => {
    localStorage.removeItem('trujillo_is_demo');
    setIsDemo(false);
    if (!hasSupabase) {
      setUser(null);
      localStorage.removeItem('trujillo_digital_twin_active_user');
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const switchRole = async (newRole: UserRole) => {
    if (!user) return;
    if (!hasSupabase) {
      const updated: User = { ...user, role: newRole };
      setUser(updated);
      setRegisteredUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      localStorage.setItem('trujillo_digital_twin_active_user', JSON.stringify(updated));
      return;
    }
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    if (!error) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      await fetchAllProfiles();
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    if (!hasSupabase) {
      const updated = { ...user, ...data };
      setUser(updated);
      setRegisteredUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      localStorage.setItem('trujillo_digital_twin_active_user', JSON.stringify(updated));
      return;
    }
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.institution !== undefined) payload.institution = data.institution;
    if (data.avatar !== undefined) payload.avatar_url = data.avatar;
    if (Object.keys(payload).length) {
      await supabase.from('profiles').update(payload).eq('id', user.id);
      setUser({ ...user, ...data });
      await fetchAllProfiles();
    }
  };

  const deleteUser = async (userId: string) => {
    if (!hasSupabase) {
      if (user?.id === userId) {
        setUser(null);
        localStorage.removeItem('trujillo_digital_twin_active_user');
      }
      const filtered = registeredUsers.filter(u => u.id !== userId);
      setRegisteredUsers(filtered);
      localStorage.setItem('trujillo_digital_twin_users_db', JSON.stringify(filtered));
      return;
    }
    await supabase.from('profiles').delete().eq('id', userId);
    if (user?.id === userId) {
      await supabase.auth.signOut();
      setUser(null);
    }
    await fetchAllProfiles();
  };

  const permissions = isDemo ? getDemoPermissions() : getRolePermissions(user?.role);

  if (loading) {
    return (
      <AuthContext.Provider value={{ user: null, isAuthenticated: false, isDemo: false, registeredUsers: [], permissions, login, register, loginWithDemo, logout, switchRole, updateProfile, deleteUser, resendVerification }}>
        <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500 text-sm">Cargando sesión…</div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isDemo, registeredUsers, permissions, login, register, loginWithDemo, logout, switchRole, updateProfile, deleteUser, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
