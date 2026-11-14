import React, { useState, useEffect } from 'react';
import { MenuItem, Order, OrderItem, UserProfile } from '../types/restaurant';
import { ShoppingBag, Plus, Minus, Trash2, Send, AlertCircle, Check, Smartphone, X, Sparkles, User } from 'lucide-react';

interface Props {
  menu: MenuItem[];
  onOrderCreated: (newOrder: Order) => Promise<void>;
  currentUser?: UserProfile | null;
}

const TABLES = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Barra 1', 'Barra 2', 'Terraza 1'];

interface CartItemDraft {
  menu_item: MenuItem;
  quantity: number;
  unit_price: number;
  sauce_or_notes?: string;
  variant_name?: string;
}

export const WaiterAppSimulator: React.FC<Props> = ({ menu, onOrderCreated, currentUser }) => {
  const [selectedTable, setSelectedTable] = useState<string>('Mesa 3');
  const [waiterName, setWaiterName] = useState<string>(currentUser?.name || 'Carlos M.');

  useEffect(() => {
    if (currentUser?.name) {
      setWaiterName(currentUser.name);
    }
  }, [currentUser]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [cart, setCart] = useState<CartItemDraft[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal para seleccionar opciones (salsa / empanizado / sabor / tamaño)
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<{ name: string; price: number } | null>(null);

  const categories = ['Todos', ...Array.from(new Set(menu.map((m) => m.category_name)))];

  const filteredMenu = menu.filter((item) => {
    if (selectedCategory === 'Todos') return true;
    return item.category_name === selectedCategory;
  });

  const handleOpenCustomization = (item: MenuItem) => {
    if (!item.is_available) return;

    if (item.options?.length || item.variants?.length) {
      setCustomizingItem(item);
      setSelectedOption(item.options ? item.options[0] : '');
      setSelectedVariant(item.variants ? item.variants[0] : null);
    } else {
      addToCartDirect(item);
    }
  };

  const addToCartDirect = (item: MenuItem, sauceOrNotes?: string, customPrice?: number) => {
    if (!item.is_available) return;

    const price = customPrice !== undefined ? customPrice : item.price;

    setCart((prev) => {
      const idx = prev.findIndex(
        (ci) => ci.menu_item.id === item.id && ci.sauce_or_notes === sauceOrNotes
      );
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          menu_item: item,
          quantity: 1,
          unit_price: price,
          sauce_or_notes: sauceOrNotes || '',
        },
      ];
    });
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;

    let notesParts: string[] = [];
    let price = customizingItem.price;

    if (selectedVariant) {
      notesParts.push(selectedVariant.name);
      price = selectedVariant.price;
    }

    if (selectedOption) {
      notesParts.push(`${customizingItem.option_label || 'Opción'}: ${selectedOption}`);
    }

    const finalNotes = notesParts.join(' • ');

    addToCartDirect(customizingItem, finalNotes, price);
    setCustomizingItem(null);
  };

  const removeFromCart = (itemId: number, sauceNotes?: string) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (ci) => ci.menu_item.id === itemId && ci.sauce_or_notes === sauceNotes
      );
      if (idx > -1) {
        const copy = [...prev];
        if (copy[idx].quantity > 1) {
          copy[idx].quantity -= 1;
          return copy;
        }
        return copy.filter((_, i) => i !== idx);
      }
      return prev;
    });
  };

  const totalAmount = cart.reduce((sum, ci) => sum + ci.unit_price * ci.quantity, 0);
  const totalWeight = cart.reduce((sum, ci) => sum + ci.menu_item.prep_weight * ci.quantity, 0);
  const totalItemsCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  const handleSendComanda = async () => {
    if (cart.length === 0) return;

    const hasSoldOut = cart.some((ci) => !ci.menu_item.is_available);
    if (hasSoldOut) {
      alert('Uno o más productos en la comanda acaban de ser marcados como AGOTADOS en cocina.');
      return;
    }

    const orderId = Math.floor(1000 + Math.random() * 9000);
    const orderItems: OrderItem[] = cart.map((ci, index) => ({
      id: index + 1,
      menu_item_id: ci.menu_item.id,
      item_name: ci.menu_item.name,
      item_weight: ci.menu_item.prep_weight,
      quantity: ci.quantity,
      unit_price: ci.unit_price,
      sauce_or_notes: ci.sauce_or_notes,
    }));

    const newOrder: Order = {
      id: orderId,
      table_number: selectedTable,
      waiter_name: waiterName,
      status: 'pending',
      total_amount: totalAmount,
      total_weight: totalWeight,
      notes: orderNotes,
      created_at: new Date().toISOString(),
      items: orderItems,
    };

    try {
      await onOrderCreated(newOrder);
      setCart([]);
      setOrderNotes('');
      setSuccessToast(`¡Comanda enviada a Cocina para ${selectedTable}!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (error) {
      console.error('[LebaWings] No se pudo enviar la comanda:', error);
      alert('No se pudo enviar la comanda a cocina. Revisa la conexión con Railway.');
    }
  };

  const getWeightTag = (w: number) => {
    switch (w) {
      case 1:
        return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">P1 Rápido</span>;
      case 2:
        return <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">P2 Medio</span>;
      case 3:
        return <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">P3 Complejo (~20m)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast de Confirmación */}
      {successToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between transition-all animate-bounce">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Check className="w-5 h-5 bg-white text-emerald-600 rounded-full p-0.5" />
            {successToast}
          </div>
          <span className="text-xs text-emerald-100 font-medium">Revisa la pestaña KDS Cocina ➔</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">App Meseros — Carta Oficial Leba Wings & Beer</h3>
            <p className="text-xs text-slate-500">
              Alitas Locas (empanizados con frituras), Alitas/Boneless con salsas, Cervezas (Med/Gde) y Tarros preparados.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Catálogo de Productos (Lado izquierdo) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          {/* Header de Mesero & Mesa */}
          <div className="space-y-2 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">LEBA WINGS & BEER</span>
                <h4 className="text-base font-extrabold text-slate-900">Toma de Comandas</h4>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Mesero: <strong className="text-slate-800">{waiterName}</strong>
              </div>
            </div>

            {/* Selector de Mesas */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Seleccionar Mesa:</label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 mt-1 scrollbar-none">
                {TABLES.map((table) => (
                  <button
                    key={table}
                    onClick={() => setSelectedTable(table)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      selectedTable === table
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {table}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categorías */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lista de Items con Protección Booleana */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredMenu.map((item) => {
              const inCartQty = cart
                .filter((ci) => ci.menu_item.id === item.id)
                .reduce((s, ci) => s + ci.quantity, 0);

              const hasOptions = !!item.options?.length || !!item.variants?.length;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    !item.is_available
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : inCartQty > 0
                      ? 'bg-rose-50/30 border-rose-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-bold ${
                            !item.is_available ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.is_available ? (
                          getWeightTag(item.prep_weight)
                        ) : (
                          <span className="text-[11px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded uppercase">
                            Agotado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">
                        {item.variants ? `Desde $${item.variants[0].price.toFixed(2)}` : `$${item.price.toFixed(2)}`}
                      </span>
                      {hasOptions && (
                        <span className="block text-[10px] text-rose-600 font-bold">
                          Personalizable ({item.option_label || 'Tamaño / Opción'})
                        </span>
                      )}
                    </div>

                    {item.is_available ? (
                      <div className="flex items-center gap-1.5">
                        {inCartQty > 0 && (
                          <span className="text-xs font-bold text-slate-900 px-1 bg-slate-100 rounded py-0.5">
                            {inCartQty} en orden
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenCustomization(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {hasOptions ? 'Configurar y Añadir' : inCartQty > 0 ? '+ Añadir más' : '+ Añadir'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">
                        Bloqueado por Cocina
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen de Comanda / Carrito Activo (Lado derecho) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-600" />
                <h4 className="text-sm font-extrabold text-slate-900">Comanda: {selectedTable}</h4>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vaciar
                </button>
              )}
            </div>

            {/* Lista de Items en la comanda */}
            {cart.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">La comanda está vacía.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Selecciona especialidades o bebidas para mandar a cocina.
                </p>
              </div>
            ) : (
              <div className="py-3 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {cart.map((ci, index) => (
                  <div
                    key={`${ci.menu_item.id}-${ci.sauce_or_notes}-${index}`}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">{ci.menu_item.name}</div>
                      {ci.sauce_or_notes && (
                        <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                          ➔ {ci.sauce_or_notes}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>${(ci.unit_price * ci.quantity).toFixed(2)}</span>
                        <span>•</span>
                        <span className="font-medium text-amber-700">P{ci.menu_item.prep_weight}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => removeFromCart(ci.menu_item.id, ci.sauce_or_notes)}
                        className="p-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-slate-900 w-4 text-center">
                        {ci.quantity}
                      </span>
                      <button
                        onClick={() => addToCartDirect(ci.menu_item, ci.sauce_or_notes, ci.unit_price)}
                        className="p-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Notas generales de mesa */}
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-600">Notas de preparación para cocina:</label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ej: Cervezas primero, alitas bien doradas..."
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer de Comanda */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items totales:</span>
                <span className="font-bold text-slate-900">{totalItemsCount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Carga de Cocina Calculada:</span>
                <span className="font-black text-rose-600">{totalWeight} pts</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total a Cobrar:</span>
                <span className="text-rose-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSendComanda}
              disabled={cart.length === 0}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-40 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Send className="w-4 h-4" /> Mandar Comanda a Cocina
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Personalización de Opciones (Alitas Locas, Salsas, Variantes) */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-rose-600 uppercase">Personalizar Producto</span>
                <h4 className="text-base font-extrabold text-slate-900">{customizingItem.name}</h4>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selección de Variante / Tamaño si existe */}
            {customizingItem.variants && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Selecciona Presentación / Tamaño:</label>
                <div className="grid grid-cols-2 gap-2">
                  {customizingItem.variants.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                        selectedVariant?.name === v.name
                          ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>{v.name}</div>
                      <div className="text-rose-600 mt-1 font-extrabold">${v.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selección de Opciones (Empanizado / Salsa / Sabor) */}
            {customizingItem.options && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  {customizingItem.option_label || 'Elige tu opción'}:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {customizingItem.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-2 rounded-lg border text-left text-xs font-semibold transition-all ${
                        selectedOption === opt
                          ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Precio Unitario:</span>
                <div className="text-lg font-black text-slate-900">
                  ${(selectedVariant ? selectedVariant.price : customizingItem.price).toFixed(2)}
                </div>
              </div>

              <button
                onClick={handleConfirmCustomization}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-colors"
              >
                Confirmar y Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
