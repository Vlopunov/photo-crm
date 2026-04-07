export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyalty_points: number;
  total_visits: number;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  points_earned: number;
  is_active: boolean;
}

export interface Booking {
  id: string;
  client_id: string;
  date: string;
  time_slot: string;
  duration_minutes: number;
  service_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  points_used: number;
  created_at: string;
  // joined
  client?: Client;
  service?: Service;
}

export interface ScheduleSetting {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface BlockedSlot {
  id: string;
  date: string;
  time_slot?: string;
  reason?: string;
}
