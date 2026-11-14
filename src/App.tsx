import React, { useState, useEffect } from 'react';
import { INITIAL_MENU, INITIAL_ORDERS } from './data/initialData';
import { MenuItem, Order, OrderStatus, PrepWeight, UserProfile, UserRole } from './types/restaurant';
import { createOrder, getKitchenQueue, getMenu, toggleStock, updateOrderStatus, updateWeight } from './services/api';
import { KdsView } from './components/KdsView';
import { WaiterAppSimulator } from './components/WaiterAppSimulator';
import { AdminInventoryView } from './components/AdminInventoryView';
import { LoginModal } from './components/LoginModal';
import { ChefHat, Smartphone, Sliders, Flame, User, LogOut, ShieldCheck, Lock } from 'lucide-react';

type Tab = 'kds' | 'waiter' | 'admin';

const DEFAULT_USER: UserProfile = {
  id: 'waiter-1',
  name: 'Carlos M.',
  role: 'waiter',
  roleTitle: 'Mesero de Sala',
  avatarBg: 'bg-rose-600',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('leba_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_USER;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (currentUser.role === 'waiter') return 'waiter';
    if (currentUser.role === 'kitchen') return 'kds';
    return 'kds';
  });

  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  const refreshKitchenQueue = async () => {
    try {
      const remoteOrders = await getKitchenQueue();
      setOrders((currentOrders) => {
        const inactiveOrders = currentOrders.filter(
          (order) => order.status !== 'pending' && order.status !== 'in_prep'
        );
        return [...remoteOrders, ...inactiveOrders];
      });
    } catch (error) {
      console.error('[LebaWings] No se pudo actualizar la cola de cocina:', error);
    }
  };

  useEffect(() => {
    const loadRemoteData = async () => {
      try {
        const [remoteMenu, remoteOrders] = await Promise.all([getMenu(), getKitchenQueue()]);
        const localMetadata = new Map(INITIAL_MENU.map((item) => [item.id, item]));
        setMenu(remoteMenu.map((item) => ({ ...localMetadata.get(item.id), ...item })));
        setOrders(remoteOrders);
      } catch (error) {
        console.error('[LebaWings] No se pudo cargar Railway:', error);
      }
    };

    loadRemoteData();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(refreshKitchenQueue, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Manejar Login / Cambio de Rol
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('leba_current_user', JSON.stringify(user));
    } catch {
      // ignore
    }

    if (user.role === 'waiter') {
      setActiveTab('waiter');
    } else if (user.role === 'kitchen') {
      setActiveTab('kds');
    } else {
      setActiveTab('admin');
    }
    setIsLoginModalOpen(false);
  };

  // Restringir pestaña activa según rol si cambia el usuario
  useEffect(() => {
    if (currentUser.role === 'waiter' && activeTab !== 'waiter') {
      setActiveTab('waiter');
    } else if (currentUser.role === 'kitchen' && activeTab !== 'kds') {
      setActiveTab('kds');
    }
  }, [currentUser, activeTab]);

  // 1. Alternar Inventario Booleano (Disponible / Agotado)
  const handleToggleStock = async (id: number) => {
    const item = menu.find((menuItem) => menuItem.id === id);
    if (!item) return;

    try {
      await toggleStock(id, !item.is_available);
      setMenu((prev) => prev.map((current) =>
        current.id === id ? { ...current, is_available: !item.is_available } : current
      ));
    } catch (error) {
      console.error('[LebaWings] No se pudo actualizar disponibilidad:', error);
    }
  };

  // 2. Modificar Peso de Preparación (1 a 3)
  const handleUpdateWeight = async (id: number, weight: PrepWeight) => {
    try {
      await updateWeight(id, weight);
    } catch (error) {
      console.error('[LebaWings] No se pudo actualizar peso:', error);
      return;
    }

    setMenu((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, prep_weight: weight } : item
      )
    );

    // Recalcular el peso total en órdenes activas si ese item está presente
    setOrders((prev) =>
      prev.map((order) => {
        let hasItem = false;
        const updatedItems = order.items.map((it) => {
          if (it.menu_item_id === id) {
            hasItem = true;
            return { ...it, item_weight: weight };
          }
          return it;
        });

        if (!hasItem) return order;

        const newTotalWeight = updatedItems.reduce(
          (sum, it) => sum + it.item_weight * it.quantity,
          0
        );
        return {
          ...order,
          items: updatedItems,
          total_weight: newTotalWeight,
        };
      })
    );
  };

  // 3. Crear Nueva Comanda desde App de Meseros
  const handleOrderCreated = async (newOrder: Order) => {
    await createOrder(newOrder);
    await refreshKitchenQueue();
  };

  // 4. Actualizar Estado en Cocina (pending -> in_prep -> ready -> delivered)
  const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('[LebaWings] No se pudo actualizar estado:', error);
      return;
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            prep_started_at:
              newStatus === 'in_prep' && !o.prep_started_at
                ? new Date().toISOString()
                : o.prep_started_at,
            completed_at:
              newStatus === 'ready' || newStatus === 'delivered'
                ? new Date().toISOString()
                : o.completed_at,
          };
        }
        return o;
      })
    );
  };

  // 5. Marcar item individual como preparado
  const handleToggleItemDone = (orderId: number, itemId: number) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          items: order.items.map((it) =>
            it.id === itemId ? { ...it, completed: !it.completed } : it
          ),
        };
      })
    );
  };

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'in_prep'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Header Principal de Leba Wings */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-2.5 lg:py-0 lg:min-h-16 gap-3">
            {/* Fila Superior en Móvil / Lado Izquierdo: Logo y Branding */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shrink-0">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h1 className="text-sm sm:text-base font-black tracking-wider text-white">LEBA WINGS</h1>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
                    KDS Cocina • App Meseros • Inventario & Pesos
                  </p>
                </div>
              </div>

              {/* Botón rápido Cambiar Rol visible en móvil junto al logo si la pantalla es muy angosta */}
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  title="Cambiar de Rol o Usuario"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px]">Cambiar Rol</span>
                </button>
              </div>
            </div>

            {/* Fila Inferior en Móvil / Lado Derecho: Navegación y Perfil */}
            <div className="flex items-center justify-between lg:justify-end gap-2 sm:gap-3 flex-wrap sm:flex-nowrap min-w-0">
              {/* Selector de Vistas / Módulos del Sistema según Rol */}
              <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 scrollbar-none shrink min-w-0">
                {/* Botón KDS Cocina: Solo visible si es Cocina o Admin */}
                {(currentUser.role === 'kitchen' || currentUser.role === 'admin') && (
                  <button
                    onClick={() => setActiveTab('kds')}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                      activeTab === 'kds'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>KDS Cocina</span>
                    {activeOrdersCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white text-rose-600 font-black">
                        {activeOrdersCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Botón App Meseros: Solo visible si es Mesero o Admin */}
                {(currentUser.role === 'waiter' || currentUser.role === 'admin') && (
                  <button
                    onClick={() => setActiveTab('waiter')}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                      activeTab === 'waiter'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>App Meseros</span>
                  </button>
                )}

                {/* Botón Inventario & Pesos: Solo visible si es Admin */}
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                      activeTab === 'admin'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Inventario & Pesos</span>
                  </button>
                )}
              </nav>

              {/* Divisor vertical */}
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0"></div>

              {/* Identidad del Usuario Logueado & Botón Cambiar Rol (Desktop) */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${currentUser.avatarBg} text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0`}>
                    {currentUser.role === 'waiter' && <Smartphone className="w-3.5 h-3.5" />}
                    {currentUser.role === 'kitchen' && <ChefHat className="w-3.5 h-3.5" />}
                    {currentUser.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] sm:text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                      <span className="truncate max-w-[90px] sm:max-w-[130px]">{currentUser.name}</span>
                      <span className={`text-[8px] sm:text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                        currentUser.role === 'waiter'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : currentUser.role === 'kitchen'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {currentUser.role === 'waiter' ? 'Mesero' : currentUser.role === 'kitchen' ? 'Cocina' : 'Admin'}
                      </span>
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 leading-tight hidden sm:block">
                      {currentUser.roleTitle}
                    </div>
                  </div>
                </div>

                {/* Botón en Desktop */}
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  title="Cambiar de Rol o Usuario"
                  className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold items-center gap-1.5 transition-colors shadow-xs shrink-0 whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cambiar Rol</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Asignación de Roles / Login */}
      {isLoginModalOpen && (
        <LoginModal
          currentUser={currentUser}
          onLogin={handleLogin}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* Contenido Principal con Tab Switching y Control Estricto de Roles */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Banner Informativo del Rol Activo */}
        <div className="mb-4 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Sesión iniciada:</span>
            <span className="font-extrabold text-slate-900">{currentUser.name}</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              currentUser.role === 'waiter'
                ? 'bg-rose-100 text-rose-800'
                : currentUser.role === 'kitchen'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {currentUser.role === 'waiter' && 'Acceso exclusivo a App Meseros'}
              {currentUser.role === 'kitchen' && 'Acceso exclusivo a KDS Cocina'}
              {currentUser.role === 'admin' && 'Acceso Total (Cocina, Meseros, Admin)'}
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            {currentUser.role === 'waiter' && 'Tus pedidos se registrarán a tu nombre automáticamente.'}
            {currentUser.role === 'kitchen' && 'Gestión activa de freidoras y despacho de comandas.'}
            {currentUser.role === 'admin' && 'Control total de stock, pesos y balance de ventas.'}
          </div>
        </div>

        {activeTab === 'kds' && (currentUser.role === 'kitchen' || currentUser.role === 'admin') && (
          <KdsView
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onToggleItemDone={handleToggleItemDone}
            onRefresh={refreshKitchenQueue}
          />
        )}

        {activeTab === 'waiter' && (currentUser.role === 'waiter' || currentUser.role === 'admin') && (
          <WaiterAppSimulator
            menu={menu}
            onOrderCreated={handleOrderCreated}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'admin' && currentUser.role === 'admin' && (
          <AdminInventoryView
            menu={menu}
            orders={orders}
            onToggleStock={handleToggleStock}
            onUpdateWeight={handleUpdateWeight}
            onReopenOrder={(orderId) => handleUpdateOrderStatus(orderId, 'in_prep')}
          />
        )}

        {/* Bloqueo de Seguridad si intentan acceder a panel no autorizado */}
        {((activeTab === 'admin' && currentUser.role !== 'admin') ||
          (activeTab === 'kds' && currentUser.role === 'waiter') ||
          (activeTab === 'waiter' && currentUser.role === 'kitchen')) && (
          <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-auto border border-slate-200 shadow-sm space-y-4 my-10">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Panel Restringido</h3>
            <p className="text-xs text-slate-500">
              Tu rol actual (<strong>{currentUser.roleTitle}</strong>) no tiene autorización para acceder a esta área.
            </p>
            <button
              onClick={() => {
                if (currentUser.role === 'waiter') setActiveTab('waiter');
                if (currentUser.role === 'kitchen') setActiveTab('kds');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
            >
              Regresar a mi Panel
            </button>
          </div>
        )}
      </main>

      {/* Footer Técnico */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>Leba Wings Pub</strong> — Motor de prioridad activa: <code className="font-mono text-rose-600">PriorityScore = (minutos * factor) + (peso * 1.5)</code>
          </span>
          <span className="text-[11px] text-slate-400">
            Inventario Booleano: Disponible (True) / Agotado (False) sin conteo por gramos
          </span>
        </div>
      </footer>
    </div>
  );
}
