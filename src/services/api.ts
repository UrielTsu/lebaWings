import { MenuItem, Order, OrderStatus, PrepWeight } from '../types/restaurant';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function requireApiUrl(): string {
  if (!API_URL) {
    throw new Error('Falta configurar VITE_API_URL en Vercel.');
  }
  return API_URL;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${requireApiUrl()}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });
  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `Error HTTP ${response.status}`);
  }
  return json;
}

export async function getMenu(): Promise<MenuItem[]> {
  const response = await request<{ data: MenuItem[] }>('/menu');
  return response.data;
}

export async function getKitchenQueue(): Promise<Order[]> {
  const response = await request<{ data: Order[] }>('/orders/kitchen-queue');
  return response.data.map((order) => ({
    ...order,
    id: Number(order.id),
    total_amount: Number(order.total_amount),
    total_weight: Number(order.total_weight),
    items: (order.items || []).map((item) => ({
      ...item,
      id: Number(item.id),
      menu_item_id: Number(item.menu_item_id),
      item_weight: Number(item.item_weight) as PrepWeight,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
  }));
}

export async function getOrderHistory(): Promise<Order[]> {
  const response = await request<{ data: Order[] }>('/orders/history');
  return response.data.map((order) => ({
    ...order,
    id: Number(order.id),
    total_amount: Number(order.total_amount),
    total_weight: Number(order.total_weight),
    items: (order.items || []).map((item) => ({
      ...item,
      id: Number(item.id),
      menu_item_id: Number(item.menu_item_id),
      item_weight: Number(item.item_weight) as PrepWeight,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
  }));
}

export async function toggleStock(id: number, isAvailable: boolean) {
  return request(`/menu/${id}/toggle-stock`, {
    method: 'PATCH',
    body: JSON.stringify({ is_available: isAvailable }),
  });
}

export async function updateWeight(id: number, weight: PrepWeight) {
  return request(`/menu/${id}/weight`, {
    method: 'PATCH',
    body: JSON.stringify({ prep_weight: weight }),
  });
}

export async function createOrder(order: Order) {
  return request<{ data: { order_id: number } }>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      table_number: order.table_number,
      waiter_name: order.waiter_name,
      notes: order.notes,
      items: order.items.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        sauce_or_notes: item.sauce_or_notes,
      })),
    }),
  });
}

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  return request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
