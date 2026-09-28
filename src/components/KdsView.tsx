import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types/restaurant';
import { PriorityEngine } from '../services/priorityEngine';
import { Clock, Flame, Zap, ChefHat, AlertTriangle, ArrowRight, RefreshCw, Layers, RotateCcw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  orders: Order[];
  onUpdateOrderStatus: (orderId: number, newStatus: OrderStatus) => void;
  onToggleItemDone: (orderId: number, itemId: number) => void;
  onRefresh?: () => void;
}

export const KdsView: React.FC<Props> = ({
  orders,
  onUpdateOrderStatus,
  onToggleItemDone,
  onRefresh,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_prep'>('all');

  // Estado para modal de confirmación de entrega (evitar cierres por error)
  const [orderToDeliver, setOrderToDeliver] = useState<Order | null>(null);

  // Estado para toast flotante de deshacer entrega accidental
  const [undoOrder, setUndoOrder] = useState<{ id: number; table_number: string } | null>(null);

  // Reloj en tiempo real para recalcular las métricas dinámicas cada 3 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Filtrar y ordenar la cola de cocina
  const activeOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'in_prep'
  );

  const sortedOrders = PriorityEngine.sortKitchenQueue(activeOrders, currentTime);

  const filteredOrders = sortedOrders.filter((o) => {
    if (filter === 'pending') return o.status === 'pending';
    if (filter === 'in_prep') return o.status === 'in_prep';
    return true;
  });

  // Métricas agregadas de cocina para control de cuello de botella
  const totalActiveWeight = activeOrders.reduce((sum, o) => sum + (o.total_weight || 0), 0);
  const criticalOrdersCount = sortedOrders.filter((o) => o.urgency_level === 'CRÍTICO').length;
  const avgWaitMinutes =
    sortedOrders.length > 0
      ? Math.round(
          sortedOrders.reduce((acc, o) => acc + (o.elapsed_minutes || 0), 0) / sortedOrders.length
        )
      : 0;

  // Manejar confirmación de entrega segura
  const handleConfirmDelivery = (order: Order) => {
    onUpdateOrderStatus(order.id, 'delivered');
    setOrderToDeliver(null);

    // Activar toast de deshacer por 10 segundos
    setUndoOrder({ id: order.id, table_number: order.table_number });
    setTimeout(() => {
      setUndoOrder((current) => (current?.id === order.id ? null : current));
    }, 10000);
  };

  // Manejar reversión / reabrir comanda si se cerró por error
  const handleUndoDelivery = () => {
    if (undoOrder) {
      onUpdateOrderStatus(undoOrder.id, 'in_prep');
      setUndoOrder(null);
    }
  };

  const getWeightBadge = (weight: number) => {
    switch (weight) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
            <Zap className="w-3 h-3 text-emerald-600" /> P1 Rápido
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" /> P2 Medio
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
            <Flame className="w-3 h-3 text-rose-600" /> P3 Complejo
          </span>
        );
      default:
        return <span>P{weight}</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Flotante de Deshacer Cierre Accidental */}
      {undoOrder && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <p className="text-xs font-bold">
                Comanda #{undoOrder.id} ({undoOrder.table_number}) marcada como entregada
              </p>
              <p className="text-[11px] text-slate-400">¿Fue un clic por error?</p>
            </div>
          </div>
          <button
            onClick={handleUndoDelivery}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Deshacer y Reabrir
          </button>
          <button
            onClick={() => setUndoOrder(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal de Confirmación de Entrega para evitar cierres accidentales */}
      {orderToDeliver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>Confirmar Entrega de Comanda</span>
              </div>
              <button
                onClick={() => setOrderToDeliver(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {orderToDeliver.table_number}
                  </span>
                  <span className="text-slate-500 font-mono ml-2">#{orderToDeliver.id}</span>
                </div>
                <div className="text-right text-slate-600">
                  <span>Mesero: <strong>{orderToDeliver.waiter_name}</strong></span>
                  <div className="text-[11px] text-amber-600 font-bold">
                    Espera: {orderToDeliver.elapsed_minutes || 0} min
                  </div>
                </div>
              </div>

              {/* Advertencia si hay items no tildados */}
              {orderToDeliver.items.some((i) => !i.completed) ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Platos pendientes de marcar en ticket:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-800/90 pl-1">
                    {orderToDeliver.items
                      .filter((i) => !i.completed)
                      .map((i) => (
                        <li key={i.id}>
                          {i.quantity}x {i.item_name} {i.sauce_or_notes ? `(${i.sauce_or_notes})` : ''}
                        </li>
                      ))}
                  </ul>
                  <p className="text-[10px] text-amber-700 pt-1 font-semibold">
                    ¿Confirmas que ya salieron de cocina todos estos productos?
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Todos los productos están marcados y verificados.</span>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Al confirmar, la orden saldrá del KDS de cocina y se registrará como <strong>Entregada</strong> en el historial del día.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDeliver(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                Cancelar y Mantener
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelivery(orderToDeliver)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Sí, Entregar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Bottleneck Telemetry Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-rose-600 rounded-lg text-white">
                <ChefHat className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">KDS Cocina — Leba Wings</h2>
                <p className="text-xs text-slate-400">
                  Cola de prioridad inteligente: Ordenamiento dinámico por Peso de Plato (1-3) y Tiempo de Espera
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Recalcular Cola
            </button>
            <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg text-xs font-mono text-slate-300">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Telemetría de Cuellos de Botella */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-1">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Comandas en Cocina</div>
            <div className="text-2xl font-black text-white mt-1">{activeOrders.length}</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Carga de Peso Acumulada</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-400">{totalActiveWeight}</span>
              <span className="text-xs text-slate-400">pts de carga</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Tiempo Medio Espera</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{avgWaitMinutes} min</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Atención Crítica (&gt;18 min)</div>
            <div className={`text-2xl font-black mt-1 ${criticalOrdersCount > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
              {criticalOrdersCount}
            </div>
          </div>
        </div>
      </div>

      {/* Selector de filtros de estado */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas las Activas ({sortedOrders.length})
          </button>
          <button
            onClick={() => setFilter('in_prep')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              filter === 'in_prep'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            En Preparación ({sortedOrders.filter((o) => o.status === 'in_prep').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              filter === 'pending'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nuevas / Pendientes ({sortedOrders.filter((o) => o.status === 'pending').length})
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Normal (&lt;10m)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            Atención (10-17m)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
            Crítico (≥18m o alto puntaje)
          </span>
        </div>
      </div>

      {/* Grilla de Tickets de Cocina KDS */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">¡Cocina al día! Sin comandas pendientes</h3>
          <p className="text-xs text-slate-400 mt-1">Usa la App de Meseros para enviar una nueva orden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredOrders.map((order) => {
            const isCritical = order.urgency_level === 'CRÍTICO';
            const isWarning = order.urgency_level === 'ATENCIÓN';
            const isInPrep = order.status === 'in_prep';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl flex flex-col justify-between border transition-all shadow-sm overflow-hidden ${
                  isCritical
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : isWarning
                    ? 'border-amber-400'
                    : isInPrep
                    ? 'border-indigo-400'
                    : 'border-slate-200'
                }`}
              >
                {/* Cabecera de Comanda */}
                <div>
                  <div
                    className={`px-4 py-3 flex items-center justify-between ${
                      isCritical
                        ? 'bg-rose-500 text-white'
                        : isWarning
                        ? 'bg-amber-500 text-white'
                        : isInPrep
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-90">
                          #{order.id}
                        </span>
                        <span className="text-base font-extrabold">{order.table_number}</span>
                      </div>
                      <div className="text-xs opacity-80 mt-0.5">Mesero: {order.waiter_name}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold uppercase tracking-wide">
                        {isInPrep ? '⚡ EN PREPARACIÓN' : 'PENDIENTE'}
                      </div>
                      <div className="text-sm font-mono font-extrabold flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {order.elapsed_minutes ?? 0} min
                      </div>
                    </div>
                  </div>

                  {/* Ribbon de Puntuación de Prioridad & Cuello de Botella */}
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-600">Score Prioridad:</span>
                      <span className="font-mono font-black text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {order.priority_score} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Carga: <strong>{order.total_weight} pts</strong></span>
                    </div>
                  </div>

                  {/* Notas Generales si existen */}
                  {order.notes && (
                    <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200/60 text-xs text-amber-900 font-medium flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{order.notes}</span>
                    </div>
                  )}

                  {/* Lista de Items con Peso y Checkbox */}
                  <div className="p-4 space-y-2.5">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onToggleItemDone(order.id, item.id)}
                        className={`p-2 rounded-lg border cursor-pointer select-none transition-all flex items-start justify-between gap-2 ${
                          item.completed
                            ? 'bg-slate-50 border-slate-200 opacity-50'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={!!item.completed}
                            onChange={() => {}}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-black text-sm text-slate-900">
                                {item.quantity}x
                              </span>
                              <span
                                className={`text-sm font-bold text-slate-800 ${
                                  item.completed ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {item.item_name}
                              </span>
                            </div>
                            {item.sauce_or_notes && (
                              <p className="text-xs text-rose-600 font-semibold mt-0.5">
                                ➔ {item.sauce_or_notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">{getWeightBadge(item.item_weight)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones del Ticket en Cocina: Sin botón de Plato Listo; botón seguro de Entrega */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                  {order.status === 'pending' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'in_prep')}
                        className="py-2.5 px-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm transition-colors"
                      >
                        <ChefHat className="w-3.5 h-3.5" /> Preparar
                      </button>
                      <button
                        onClick={() => setOrderToDeliver(order)}
                        className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm transition-colors"
                      >
                        Entregar <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setOrderToDeliver(order)}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Entregar Pedido a Mesa
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
