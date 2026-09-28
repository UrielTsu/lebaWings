export type PrepWeight = 1 | 2 | 3;

export interface MenuItem {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  price: number;
  prep_weight: PrepWeight;
  is_available: boolean;
  options?: string[]; // Salsas, empanizados (Takis, Doritos, etc.) o sabores
  option_label?: string; // "Empanizado", "Salsa", "Sabor"
  variants?: Array<{ name: string; price: number }>; // Mediana / Grande
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  unit_price: number;
  sauce_or_notes?: string;
}

export interface OrderSubmissionPayload {
  table_number: string;
  waiter_name: string;
  notes?: string;
  items: Array<{
    menu_item_id: number;
    quantity: number;
    unit_price?: number;
    sauce_or_notes?: string;
  }>;
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    order_id: number;
    table_number: string;
    total_amount: number;
    total_weight: number;
    status: string;
    items_count: number;
  };
}
