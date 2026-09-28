import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types/restaurant';
import { ChefHat, Smartphone, ShieldCheck, User, ArrowRight, Flame, Check } from 'lucide-react';

interface Props {
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onClose?: () => void;
  isInitial?: boolean;
}

const PRESET_WAITERS = ['Carlos M.', 'Sofía R.', 'Andrés V.', 'Mariana T.'];

export const LoginModal: React.FC<Props> = ({ currentUser, onLogin, onClose, isInitial = false }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser?.role || 'waiter');
  const [customName, setCustomName] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>(
    currentUser?.role === 'waiter' ? currentUser.name : 'Carlos M.'
  );

  // Login directo para Cocina
  const handleLoginAsKitchen = () => {
    onLogin({
      id: `kitchen-${Date.now()}`,
      name: 'Cocina',
      role: 'kitchen',
      roleTitle: 'KDS & Freidoras',
      avatarBg: 'bg-amber-600',
    });
  };

  // Login directo para Admin
  const handleLoginAsAdmin = () => {
    onLogin({
      id: `admin-${Date.now()}`,
      name: 'Administrador',
      role: 'admin',
      roleTitle: 'Administrador General',
      avatarBg: 'bg-indigo-600',
    });
  };

  // Login para Mesero con identificación
  const handleSubmitWaiter = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customName.trim() || selectedPresetName;

    onLogin({
      id: `waiter-${Date.now()}`,
      name: finalName,
      role: 'waiter',
      roleTitle: 'Mesero de Sala',
      avatarBg: 'bg-rose-600',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
        {/* Header con Marca */}
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md">
            <Flame className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            {currentUser ? 'Cambiar Rol de Trabajo' : 'Acceso al Sistema Gastronómico'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Leba Wings & Beer • Selecciona tu área para ingresar a tu panel
          </p>
        </div>

        <div className="space-y-4 pt-4">
          {/* Selector de Rol */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
              1. Selecciona tu Rol
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Rol Mesero */}
              <button
                type="button"
                onClick={() => setSelectedRole('waiter')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'waiter'
                    ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-500/20 text-slate-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedRole === 'waiter' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xs">Mesero</div>
                <div className="text-[10px] text-slate-500">Comandas</div>
              </button>

              {/* Rol Cocina */}
              <button
                type="button"
                onClick={() => setSelectedRole('kitchen')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'kitchen'
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 text-slate-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedRole === 'kitchen' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xs">Cocina</div>
                <div className="text-[10px] text-slate-500">KDS</div>
              </button>

              {/* Rol Admin */}
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'admin'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 text-slate-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedRole === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xs">Admin</div>
                <div className="text-[10px] text-slate-500">Acceso Total</div>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CASO 1: ROL MESERO (SÍ REQUIERE IDENTIFICACIÓN)          */}
          {/* ======================================================== */}
          {selectedRole === 'waiter' && (
            <form onSubmit={handleSubmitWaiter} className="space-y-4 pt-1 animate-in fade-in duration-200">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-snug">
                <strong>Identificación obligatoria:</strong> Los pedidos que tomes en sala se registrarán con tu nombre para control de mesas y comandas.
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  ¿Quién eres? (Nombre del Mesero)
                </label>

                {/* Presets de meseros */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_WAITERS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setSelectedPresetName(name);
                        setCustomName('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedPresetName === name && !customName
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* Campo para ingresar otro nombre */}
                <div className="relative pt-1">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="O escribe tu nombre si no está en la lista..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Botón de Entrada para Mesero */}
              <div className="pt-2 flex items-center gap-2.5">
                {!isInitial && onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                >
                  <span>Entrar como {customName.trim() || selectedPresetName}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* CASO 2: ROL COCINA (NO REQUIERE IDENTIFICACIÓN)          */}
          {/* ======================================================== */}
          {selectedRole === 'kitchen' && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  <span>Sin identificación requerida</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  El equipo de cocina entra directamente al sistema. Tendrás acceso exclusivo a la pantalla KDS para gestionar freidoras, tiempos de cocción y despacho de pedidos.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                {!isInitial && onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLoginAsKitchen}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Ingresar a Pantalla KDS Cocina</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* CASO 3: ROL ADMIN (NO REQUIERE IDENTIFICACIÓN)           */}
          {/* ======================================================== */}
          {selectedRole === 'admin' && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-indigo-800">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Sin identificación requerida</span>
                </div>
                <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                  Entras como Administrador con permisos totales. Podrás navegar libremente entre la Cocina KDS, la App de Meseros y el Inventario Booleano con Historial de Ventas.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                {!isInitial && onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLoginAsAdmin}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black active:bg-slate-800 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Ingresar como Administrador</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
