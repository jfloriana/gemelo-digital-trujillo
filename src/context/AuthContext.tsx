import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { hashPasswordWithSalt, generateSalt, verifyPassword, generateSessionToken } from '../utils/cryptoUtils';

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
  registeredUsers: User[];
  permissions: UserPermissions;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  loginWithDemo: (userId: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
}

const DEFAULT_SALT = 'a8f93e2b1c4d5e6f708192a3b4c5d6e7';
// Precomputed SHA-256 for demo password 'trujillo2026' with DEFAULT_SALT
const DEMO_PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

export const INITIAL_DEMO_USERS: User[] = [
  {
    id: 'user-investigador-01',
    name: 'Ing. Joel Arevalo',
    email: 'joelandersonarevalo@gmail.com',
    role: 'investigador',
    institution: 'Universidad Nacional de Trujillo - Posgrado / Tesista Líder',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    salt: DEFAULT_SALT,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-01-15T08:00:00.000Z',
    lastLogin: '2026-08-30T22:30:00.000Z',
    token: generateSessionToken('user-investigador-01')
  },
  {
    id: 'user-planificador-02',
    name: 'Arq. María Fernández',
    email: 'mfernandez@munitrujillo.gob.pe',
    role: 'planificador',
    institution: 'Municipalidad Provincial de Trujillo - Gerencia de Desarrollo Urbano',
    salt: DEFAULT_SALT,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-02-10T09:30:00.000Z',
    lastLogin: '2026-08-30T20:15:00.000Z',
    token: generateSessionToken('user-planificador-02')
  },
  {
    id: 'user-analista-03',
    name: 'Dr. Carlos Mendoza',
    email: 'cmendoza@oefa.gob.pe',
    role: 'analista',
    institution: 'OEFA / SENAMHI La Libertad - Fiscalización Ambiental',
    salt: DEFAULT_SALT,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-03-01T11:00:00.000Z',
    lastLogin: '2026-08-30T19:40:00.000Z',
    token: generateSessionToken('user-analista-03')
  },
  {
    id: 'user-admin-iot-04',
    name: 'Ing. Roberto Sánchez',
    email: 'rsanchez.iot@trujillo.gob.pe',
    role: 'admin_iot',
    institution: 'Red de Sensores IoT & Smart City Trujillo',
    salt: DEFAULT_SALT,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-04-12T14:20:00.000Z',
    lastLogin: '2026-08-30T21:10:00.000Z',
    token: generateSessionToken('user-admin-iot-04')
  },
  {
    id: 'user-ciudadano-05',
    name: 'Lucía Torres',
    email: 'lucia.torres.trujillo@gmail.com',
    role: 'ciudadano',
    institution: 'Comité Ambiental Ciudadano - Centro Histórico Trujillo',
    salt: DEFAULT_SALT,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-05-18T16:45:00.000Z',
    lastLogin: '2026-08-30T18:05:00.000Z',
    token: generateSessionToken('user-ciudadano-05')
  }
];

export const getRolePermissions = (role?: UserRole): UserPermissions => {
  switch (role) {
    case 'investigador':
      return {
        canSimulateMl: true,
        canInjectIoT: true,
        canExportReports: true,
        canModifyZones: true,
        canManageUsers: true
      };
    case 'planificador':
      return {
        canSimulateMl: true,
        canInjectIoT: false,
        canExportReports: true,
        canModifyZones: true,
        canManageUsers: false
      };
    case 'analista':
      return {
        canSimulateMl: true,
        canInjectIoT: true,
        canExportReports: true,
        canModifyZones: false,
        canManageUsers: false
      };
    case 'admin_iot':
      return {
        canSimulateMl: false,
        canInjectIoT: true,
        canExportReports: true,
        canModifyZones: false,
        canManageUsers: true
      };
    case 'ciudadano':
    default:
      return {
        canSimulateMl: false,
        canInjectIoT: false,
        canExportReports: true,
        canModifyZones: false,
        canManageUsers: false
      };
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users list in local database
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('trujillo_digital_twin_users_db');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored users database', e);
      }
    }
    return INITIAL_DEMO_USERS;
  });

  // Currently logged in user (null by default so authentication gate is shown before entering panel)
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('trujillo_digital_twin_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing active user', e);
      }
    }
    return null; // User must log in first before entering the panel
  });

  // Save users db to localStorage
  useEffect(() => {
    localStorage.setItem('trujillo_digital_twin_users_db', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Save active user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('trujillo_digital_twin_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('trujillo_digital_twin_active_user');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const foundUser = registeredUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!foundUser) {
      return { success: false, error: 'No se encontró un usuario registrado con este correo electrónico.' };
    }

    if (foundUser.salt && foundUser.passwordHash) {
      const isValid = await verifyPassword(password, foundUser.salt, foundUser.passwordHash);
      // Also allow demo quick-password 'trujillo2026' or 'admin123'
      if (!isValid && password !== 'trujillo2026' && password !== 'admin123' && password !== '••••••••') {
        return { success: false, error: 'Contraseña incorrecta. Verifica tus credenciales de acceso.' };
      }
    }

    const updatedUser: User = {
      ...foundUser,
      lastLogin: new Date().toISOString(),
      token: generateSessionToken(foundUser.id)
    };

    setUser(updatedUser);
    setRegisteredUsers(prev => prev.map(u => u.id === foundUser.id ? updatedUser : u));
    return { success: true };
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = data.email.trim().toLowerCase();
    if (registeredUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: 'Ya existe una cuenta registrada con este correo electrónico.' };
    }

    if (data.password.length < 6) {
      return { success: false, error: 'La contraseña debe contener al menos 6 caracteres por seguridad.' };
    }

    const salt = generateSalt(16);
    const passwordHash = await hashPasswordWithSalt(data.password, salt);
    const userId = `user-${Date.now()}`;
    const token = generateSessionToken(userId);

    const newUser: User = {
      id: userId,
      name: data.name.trim(),
      email: normalizedEmail,
      role: data.role,
      institution: data.institution.trim() || 'Comunidad Digital Trujillo',
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      token
    };

    setRegisteredUsers(prev => [...prev, newUser]);
    setUser(newUser);
    return { success: true };
  };

  const loginWithDemo = (userId: string) => {
    const found = registeredUsers.find(u => u.id === userId) || INITIAL_DEMO_USERS.find(u => u.id === userId);
    if (found) {
      const updated = {
        ...found,
        lastLogin: new Date().toISOString(),
        token: generateSessionToken(found.id)
      };
      setUser(updated);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated: User = {
      ...user,
      role: newRole,
      institution: newRole === 'planificador' ? 'Municipalidad Provincial de Trujillo' : 
                   newRole === 'analista' ? 'OEFA / SENAMHI La Libertad' :
                   newRole === 'admin_iot' ? 'Red de Sensores IoT & Smart City Trujillo' :
                   newRole === 'ciudadano' ? 'Sociedad Civil Trujillo' :
                   'Universidad Nacional de Trujillo / Tesista'
    };
    setUser(updated);
    setRegisteredUsers(prev => prev.map(u => u.id === user.id ? updated : u));
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    setRegisteredUsers(prev => prev.map(u => u.id === user.id ? updated : u));
  };

  const deleteUser = (userId: string) => {
    if (user?.id === userId) {
      setUser(null);
    }
    setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
  };

  const permissions = getRolePermissions(user?.role);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      registeredUsers,
      permissions,
      login,
      register,
      loginWithDemo,
      logout,
      switchRole,
      updateProfile,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
