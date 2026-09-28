import { useState, useMemo } from 'react';
import { MenuItem, CartItem } from '../types';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string>('Mesa 1');
  const [waiterName, setWaiterName] = useState<string>('Carlos M.');
  const [generalNotes, setGeneralNotes] = useState<string>('');

  const addItem = (item: MenuItem, sauceOrNotes?: string, customPrice?: number) => {
    // Si el item no está disponible en inventario booleano, bloquear
    if (!item.is_available) return;

    const price = customPrice !== undefined ? customPrice : item.price;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (ci) => ci.menu_item.id === item.id && ci.sauce_or_notes === sauceOrNotes
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          menu_item: item,
          quantity: 1,
          unit_price: price,
          sauce_or_notes: sauceOrNotes,
        },
      ];
    });
  };

  const removeItem = (itemId: number, sauceOrNotes?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (ci) => ci.menu_item.id === itemId && ci.sauce_or_notes === sauceOrNotes
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        if (updated[existingIndex].quantity > 1) {
          updated[existingIndex].quantity -= 1;
          return updated;
        }
        return updated.filter((_, idx) => idx !== existingIndex);
      }
      return prev;
    });
  };

  const clearCart = () => {
    setCart([]);
    setGeneralNotes('');
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [cart]);

  const totalWeight = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menu_item.prep_weight * item.quantity, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return {
    cart,
    tableNumber,
    setTableNumber,
    waiterName,
    setWaiterName,
    generalNotes,
    setGeneralNotes,
    addItem,
    removeItem,
    clearCart,
    totalAmount,
    totalWeight,
    totalItemsCount,
  };
}
