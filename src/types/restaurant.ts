export type PrepWeight = 1 | 2 | 3;

export type OrderStatus = 'pending' | 'in_prep' | 'ready' | 'delivered' | 'cancelled';

export type UrgencyLevel = 'NORMAL' | 'ATENCIÓN' | 'CRÍTICO';

export interface MenuItem {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  price: number;
  prep_weight: PrepWeight;
  is_available: boolean;
  options?: string[]; // ej. salsas, empanizados o sabores
  option_label?: string; // ej. "Empanizado", "Salsa", "Sabor"
  variants?: Array<{ name: string; price: number }>; // ej. Mediana ($35) / Grande ($65)
}

export interface OrderItem {
  id: number;
  menu_item_id: number;
  item_name: string;
  item_weight: PrepWeight;
  quantity: number;
  unit_price: number;
  sauce_or_notes?: string;
  completed?: boolean;
}

export interface Order {
  id: number;
  table_number: string;
  waiter_name: string;
  status: OrderStatus;
  total_amount: number;
  total_weight: number;
  notes?: string;
  created_at: string; // ISO string
  prep_started_at?: string;
  completed_at?: string;
  items: OrderItem[];
  // Campos calculados por el motor de prioridad
  priority_score?: number;
  elapsed_minutes?: number;
  urgency_level?: UrgencyLevel;
  sla_status?: 'green' | 'yellow' | 'red';
  estimated_prep_time?: number;
}

export type UserRole = 'waiter' | 'kitchen' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  avatarBg: string;
}
