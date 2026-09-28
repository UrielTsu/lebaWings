import { MenuItem, OrderSubmissionPayload, OrderResponse } from '../types';

const API_BASE_URL = 'https://api.lebawings.local/api'; // O IP de tu servidor local (ej: http://192.168.1.100:8000/api)

export const WaiterApi = {
  /**
   * Obtiene el menú asegurando sólo productos disponibles para meseros.
   */
  async getMenu(): Promise<MenuItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/menu?only_available=true`, {
        headers: { 'Accept': 'application/json' },
      });
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'Error al obtener el menú');
      }
      return json.data;
    } catch (error) {
      console.error('[WaiterApi] Error getMenu:', error);
      throw error;
    }
  },

  /**
   * Envía la comanda de forma atómica y segura al backend PHP.
   */
  async submitOrder(payload: OrderSubmissionPayload): Promise<OrderResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Error al procesar la comanda');
      }
      return json;
    } catch (error) {
      console.error('[WaiterApi] Error submitOrder:', error);
      throw error;
    }
  },
};
