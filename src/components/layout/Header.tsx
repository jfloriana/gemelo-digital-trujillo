import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Trees, 
  Wind, 
  Thermometer, 
  User as UserIcon, 
  Download, 
  Lock, 
  ShieldCheck, 
  Layers,
  MapPin,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { UrbanZone } from '../../types';

interface HeaderProps {
  activeZone: UrbanZone;
  onOpenLogin: () => void;
  onQuickExport: (format: 'xlsx' | 'pdf' | 'docx' | 'csv') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeZone,
  onOpenLogin,
  onQuickExport
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-900/10">
            <Trees className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">
                Gemelo Digital Microescala Trujillo
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold font-mono">
                v2.6 Tesis
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Calidad del Aire a Microescala & Soluciones Basadas en la Naturaleza (NbS)
            </p>
          </div>
        </div>

        {/* Live Weather / Microclimate pill for Trujillo */}
        <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-2xl text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-800">Trujillo, Perú</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-mono text-slate-800 font-semibold">28.9 °C</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-mono text-slate-800 font-semibold">2.1 m/s SO</span>
          </div>
        </div>

        {/* Action Controls & Auth User Badge */}
        <div className="flex items-center gap-2.5">
          {/* Quick Export Dropdown or button */}
          <button
            onClick={() => onQuickExport('pdf')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all"
            title="Exportar reporte rápido en PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Reporte</span> PDF
          </button>

          <button
            onClick={() => onQuickExport('xlsx')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all"
            title="Exportar libro de datos en Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Libro</span> Excel
          </button>

          {/* User Account / Role Badge & Logout */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-400 px-3 py-1.5 rounded-xl transition-all text-left shadow-xs cursor-pointer"
                title="Ver perfil, permisos RBAC o cambiar de rol"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <span className="text-xs font-semibold text-slate-800 block line-clamp-1">{user.name}</span>
                  <span className="text-[10px] text-emerald-600 capitalize block font-medium">{user.role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={logout}
                className="p-2 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Cerrar sesión y volver a la pantalla de acceso"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-900/10 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
