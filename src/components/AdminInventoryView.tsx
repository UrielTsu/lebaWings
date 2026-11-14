import React, { useState } from 'react';
import { MenuItem, Order, PrepWeight } from '../types/restaurant';
import {
  Check,
  X,
  Search,
  Zap,
  Clock,
  Flame,
  Receipt,
  DollarSign,
  RotateCcw,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ChefHat,
  Download
} from 'lucide-react';

interface Props {
  menu: MenuItem[];
  orders: Order[];
  onToggleStock: (id: number) => void;
  onUpdateWeight: (id: number, weight: PrepWeight) => void;
  onReopenOrder?: (orderId: number) => void;
}

export const AdminInventoryView: React.FC<Props> = ({
  menu,
  orders,
  onToggleStock,
  onUpdateWeight,
  onReopenOrder,
}) => {
  const [adminTab, setAdminTab] = useState<'inventory' | 'history'>('inventory');

  // Estado para filtros de Inventario
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Estado para filtros de Historial de Pedidos
  const [historyFilter, setHistoryFilter] = useState<'all' | 'delivered' | 'active'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [salesPeriod, setSalesPeriod] = useState<'day' | 'week' | 'month'>('day');

  // ----------------------------------------------------
  // Métricas del Historial y Costo / Ingreso del Día
  // ----------------------------------------------------
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const activeOrders = orders.filter((o) => o.status === 'pending' || o.status === 'in_prep');

  const periodStart = new Date();
  periodStart.setHours(0, 0, 0, 0);
  if (salesPeriod === 'week') {
    periodStart.setDate(periodStart.getDate() - 6);
  } else if (salesPeriod === 'month') {
    periodStart.setDate(1);
  }

  const periodOrders = orders.filter((order) => new Date(order.created_at) >= periodStart);
  const periodDeliveredOrders = periodOrders.filter((order) => order.status === 'delivered');
  const periodRevenue = periodDeliveredOrders.reduce((total, order) => total + (order.total_amount || 0), 0);

  // Total de ingresos por comandas ya entregadas / cobradas
  const totalRevenueDelivered = periodRevenue;

  // Total de ingresos de comandas actualmente en preparación / pendientes
  const totalRevenuePending = activeOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);

  // Venta total potencial del día (entregadas + en cocina)
  const totalDailyRevenue = totalRevenueDelivered + totalRevenuePending;

  // Ticket promedio
  const avgTicket =
    periodDeliveredOrders.length > 0 ? totalRevenueDelivered / periodDeliveredOrders.length : 0;

  // Tiempo promedio de entrega en minutos para pedidos completados
  const avgDeliveryMinutes =
    periodDeliveredOrders.length > 0
      ? Math.round(
          periodDeliveredOrders.reduce((sum, o) => {
            if (!o.completed_at || !o.created_at) return sum + 18;
            const diff =
              (new Date(o.completed_at).getTime() - new Date(o.created_at).getTime()) / (1000 * 60);
            return sum + Math.max(diff, 1);
          }, 0) / periodDeliveredOrders.length
        )
      : 0;

  // Filtrado de Historial
  const filteredHistoryOrders = periodOrders.filter((order) => {
    const matchesStatus =
      historyFilter === 'all'
        ? true
        : historyFilter === 'delivered'
        ? order.status === 'delivered'
        : order.status === 'pending' || order.status === 'in_prep';

    const matchesSearch =
      order.table_number.toLowerCase().includes(historySearch.toLowerCase()) ||
      order.waiter_name.toLowerCase().includes(historySearch.toLowerCase()) ||
      order.id.toString().includes(historySearch);

    return matchesStatus && matchesSearch;
  });

  const exportSalesCsv = () => {
    const rows = periodDeliveredOrders.map((order) => [
      order.id,
      order.created_at,
      order.completed_at || '',
      order.table_number,
      order.waiter_name,
      order.total_amount.toFixed(2),
      order.items.map((item) => `${item.quantity}x ${item.item_name}`).join(' | '),
    ]);
    const csv = [
      ['Folio', 'Pedido', 'Entrega', 'Mesa', 'Mesero', 'Total MXN', 'Productos'],
      ...rows,
    ].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas-${salesPeriod}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------
  // Filtrado de Inventario
  // ----------------------------------------------------
  const categories = ['Todos', ...Array.from(new Set(menu.map((m) => m.category_name)))];

  const filteredItems = menu.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todos' || item.category_name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const availableCount = menu.filter((m) => m.is_available).length;
  const soldOutCount = menu.filter((m) => !m.is_available).length;

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Entregado
          </span>
        );
      case 'in_prep':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <ChefHat className="w-3.5 h-3.5 text-amber-600" /> En Cocina
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <Clock className="w-3.5 h-3.5 text-rose-600" /> Pendiente
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-100">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navegación del Panel de Administración */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setAdminTab('inventory')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              adminTab === 'inventory'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventario Booleano & Pesos</span>
          </button>
          <button
            onClick={() => setAdminTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              adminTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
                <span>Historial de Pedidos & Ventas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-black">
              ${totalRevenueDelivered.toFixed(0)}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Leba Wings & Beer • San Juan Cuautlancingo, Pue.
        </div>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 1: HISTORIAL DE PEDIDOS DEL DÍA & COSTO / VENTAS  */}
      {/* ========================================================= */}
      {adminTab === 'history' && (
        <div className="space-y-6">
          {/* Tarjetas KPI de Costo / Ingresos Generados en el Día */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Venta Entregada */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Venta Entregada / Cobrada</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  ${totalRevenueDelivered.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 font-medium">MXN</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                ✓ {deliveredOrders.length} comandas completadas
              </p>
            </div>

            {/* En Cocina / Por Despachar */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>En Cocina / Por Cobrar</span>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <ChefHat className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  ${totalRevenuePending.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 font-medium">MXN</span>
              </div>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">
                ⚡ {activeOrders.length} comandas en proceso
              </p>
            </div>

            {/* Ticket Promedio */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Ticket Promedio</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  ${avgTicket.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 font-medium">MXN</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Por comanda entregada
              </p>
            </div>

            {/* Tiempo Promedio Despacho */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Tiempo Medio de Entrega</span>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{avgDeliveryMinutes}</span>
                <span className="text-xs text-slate-400 font-medium">minutos</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Tiempo de atención promedio
              </p>
            </div>
          </div>

          {/* Banner de Total Potencial del Día */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-600 text-white rounded-lg">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  Balance Total de Comandas del Día (Entregadas + En Preparación)
                </h4>
                <p className="text-xs text-slate-400">
                  {orders.length} pedidos registrados hoy • San Juan Cuautlancingo
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                Venta Total Acumulada
              </div>
              <div className="text-2xl font-black text-rose-400">
                ${totalDailyRevenue.toFixed(2)} <span className="text-xs text-slate-300">MXN</span>
              </div>
            </div>
          </div>

          {/* Filtros del Historial */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              {(['day', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSalesPeriod(period)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    salesPeriod === period ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {period === 'day' ? 'Día' : period === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={exportSalesCsv}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Descargar ventas CSV
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por Mesa, Mesero o Folio..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  historyFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({periodOrders.length})
              </button>
              <button
                onClick={() => setHistoryFilter('delivered')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  historyFilter === 'delivered'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entregadas ({periodDeliveredOrders.length})
              </button>
              <button
                onClick={() => setHistoryFilter('active')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  historyFilter === 'active'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                En Cocina ({periodOrders.filter((order) => order.status === 'pending' || order.status === 'in_prep').length})
              </button>
            </div>
          </div>

          {/* Tabla de Historial Detallada */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Folio</th>
                    <th className="py-3 px-4">Mesa</th>
                    <th className="py-3 px-4">Mesero</th>
                    <th className="py-3 px-4">Hora Pedido / Entrega</th>
                    <th className="py-3 px-4">Desglose de Platillos</th>
                    <th className="py-3 px-4 text-right">Total ($ MXN)</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredHistoryOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No hay pedidos en el historial con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryOrders.map((order) => {
                      const isDelivered = order.status === 'delivered';
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            #{order.id}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-800">
                            {order.table_number}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {order.waiter_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            <div>
                              <span className="font-semibold text-slate-800">
                                {formatTime(order.created_at)}
                              </span>
                              {order.completed_at ? (
                                <span className="text-emerald-700 font-bold ml-1.5">
                                  ➔ {formatTime(order.completed_at)}
                                </span>
                              ) : (
                                <span className="text-amber-600 font-semibold ml-1.5">
                                  (En curso)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1 max-w-sm">
                              {order.items.map((it) => (
                                <div key={it.id} className="flex items-baseline gap-1 text-[11px]">
                                  <span className="font-black text-slate-800">{it.quantity}x</span>
                                  <span className="text-slate-700">{it.item_name}</span>
                                  {it.sauce_or_notes && (
                                    <span className="text-rose-600 font-medium">
                                      ({it.sauce_or_notes})
                                    </span>
                                  )}
                                </div>
                              ))}
                              {order.notes && (
                                <div className="text-[10px] text-amber-700 italic">
                                  Nota: {order.notes}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                            ${(order.total_amount || 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {getOrderStatusBadge(order.status)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {isDelivered && onReopenOrder ? (
                              <button
                                onClick={() => onReopenOrder(order.id)}
                                title="Si se marcó entregado por error, reabrir a cocina"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 hover:border-rose-400 hover:text-rose-600 text-slate-600 transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reabrir a Cocina</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: CONTROL DE INVENTARIO BOOLEANO & PESOS 1 A 3    */}
      {/* ========================================================= */}
      {adminTab === 'inventory' && (
        <div className="space-y-6">
          {/* Resumen Superior de Inventario Booleano */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Control de Inventario Booleano & Pesos de Cocina
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sin conteo por gramos: cambia el estado a Disponible o Agotado con un click. El cambio se refleja de inmediato en la App de Meseros.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  {availableCount} Disponibles
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  {soldOutCount} Agotados
                </div>
              </div>
            </div>

            {/* Explicación de la Escala de Pesos 1 a 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Peso 1: Rápido (1 a 5 min)</span>
                </div>
                <p className="text-emerald-800 mt-1 text-[11px]">
                  Cervezas Corona/Victoria, refrescos, papas extra cruji o aros de cebolla.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Peso 2: Medio (6 a 12 min)</span>
                </div>
                <p className="text-amber-800 mt-1 text-[11px]">
                  Alitas y Boneless salseados, dedos de queso, banderillas, coctel Don Goyo.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200/80 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>Peso 3: Complejo (13 a 25 min)</span>
                </div>
                <p className="text-rose-800 mt-1 text-[11px]">
                  Alitas Locas con empanizado artesanal de frituras (Takis, Doritos, Cheetos).
                </p>
              </div>
            </div>
          </div>

          {/* Barra de Filtros & Búsqueda */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar platillo o bebida por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Productos con Controles Booleanos y Pesos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Precio</th>
                    <th className="py-3 px-4 text-center">Peso de Cocina (1-3)</th>
                    <th className="py-3 px-4 text-center">Disponibilidad Booleana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !item.is_available ? 'bg-slate-50/50 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{item.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {item.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {item.category_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        ${item.price.toFixed(2)}
                      </td>

                      {/* Selector de Peso de Cocina (1 a 3) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                          {([1, 2, 3] as PrepWeight[]).map((w) => {
                            const isSelected = item.prep_weight === w;
                            return (
                              <button
                                key={w}
                                onClick={() => onUpdateWeight(item.id, w)}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                                  isSelected
                                    ? w === 1
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : w === 2
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {w === 1 ? 'P1' : w === 2 ? 'P2' : 'P3'}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Toggle Booleano (Disponible / Agotado) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onToggleStock(item.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all shadow-xs ${
                            item.is_available
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                          }`}
                        >
                          {item.is_available ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Disponible</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Agotado</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
