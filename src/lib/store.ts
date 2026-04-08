import { supabase, isSupabaseConfigured } from './supabase';
import { Client, Service, Booking, ScheduleSetting, BlockedSlot } from './types';

// ─── localStorage helpers ───

function getLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function setLS<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function uid() {
  return crypto.randomUUID();
}

// ─── Seed data ───

const DEFAULT_SERVICES: Service[] = [
  // 📸 Аренда залов для съёмки
  { id: uid(), name: 'Зал «Кристалл» — аренда', price: 70, duration_minutes: 60, points_earned: 20, is_active: true },
  { id: uid(), name: 'Зал «Графит» — аренда', price: 70, duration_minutes: 60, points_earned: 20, is_active: true },
  { id: uid(), name: 'Зал «Милена» — аренда', price: 80, duration_minutes: 60, points_earned: 25, is_active: true },
  // 📸 Фотосъёмка с фотографом
  { id: uid(), name: 'Фотосессия с фотографом', price: 175, duration_minutes: 60, points_earned: 50, is_active: true },
  { id: uid(), name: 'Семейная фотосессия', price: 250, duration_minutes: 90, points_earned: 80, is_active: true },
  { id: uid(), name: 'Детская фотосессия', price: 200, duration_minutes: 60, points_earned: 60, is_active: true },
  { id: uid(), name: 'Love Story', price: 200, duration_minutes: 90, points_earned: 70, is_active: true },
  // 💄 Допуслуги
  { id: uid(), name: 'Макияж и причёска', price: 70, duration_minutes: 60, points_earned: 15, is_active: true },
  // 🎉 Moloko Event
  { id: uid(), name: 'Аренда зала для праздника', price: 100, duration_minutes: 120, points_earned: 30, is_active: true },
  { id: uid(), name: 'Детский день рождения', price: 350, duration_minutes: 180, points_earned: 100, is_active: true },
  { id: uid(), name: 'Аренда пространства для встречи', price: 70, duration_minutes: 60, points_earned: 20, is_active: true },
];

const DEFAULT_SCHEDULE: ScheduleSetting[] = [
  { id: uid(), day_of_week: 0, start_time: '09:00', end_time: '20:00', is_available: false },
  { id: uid(), day_of_week: 1, start_time: '09:00', end_time: '20:00', is_available: true },
  { id: uid(), day_of_week: 2, start_time: '09:00', end_time: '20:00', is_available: true },
  { id: uid(), day_of_week: 3, start_time: '09:00', end_time: '20:00', is_available: true },
  { id: uid(), day_of_week: 4, start_time: '09:00', end_time: '20:00', is_available: true },
  { id: uid(), day_of_week: 5, start_time: '09:00', end_time: '20:00', is_available: true },
  { id: uid(), day_of_week: 6, start_time: '10:00', end_time: '18:00', is_available: true },
];

function initLS() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('crm_services')) {
    setLS('crm_services', DEFAULT_SERVICES);
  }
  if (!localStorage.getItem('crm_schedule')) {
    setLS('crm_schedule', DEFAULT_SCHEDULE);
  }
  if (!localStorage.getItem('crm_bookings')) {
    setLS('crm_bookings', []);
  }
  if (!localStorage.getItem('crm_clients')) {
    setLS('crm_clients', []);
  }
  if (!localStorage.getItem('crm_blocked')) {
    setLS('crm_blocked', []);
  }
}

// ─── Services ───

export async function getServices(): Promise<Service[]> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase!.from('services').select('*').eq('is_active', true).order('name');
    return data || [];
  }
  initLS();
  return getLS<Service[]>('crm_services', []).filter(s => s.is_active);
}

// ─── Schedule ───

export async function getSchedule(): Promise<ScheduleSetting[]> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase!.from('schedule_settings').select('*').order('day_of_week');
    return data || [];
  }
  initLS();
  return getLS<ScheduleSetting[]>('crm_schedule', []);
}

export async function updateSchedule(settings: ScheduleSetting[]): Promise<void> {
  if (isSupabaseConfigured()) {
    for (const s of settings) {
      await supabase!.from('schedule_settings').upsert(s);
    }
    return;
  }
  setLS('crm_schedule', settings);
}

// ─── Blocked Slots ───

export async function getBlockedSlots(): Promise<BlockedSlot[]> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase!.from('blocked_slots').select('*');
    return data || [];
  }
  initLS();
  return getLS<BlockedSlot[]>('crm_blocked', []);
}

// ─── Clients ───

export async function getClients(): Promise<Client[]> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase!.from('clients').select('*').order('created_at', { ascending: false });
    return data || [];
  }
  initLS();
  return getLS<Client[]>('crm_clients', []);
}

export async function findClientByPhone(phone: string): Promise<Client | null> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase!.from('clients').select('*').eq('phone', phone).single();
    return data;
  }
  const clients = getLS<Client[]>('crm_clients', []);
  return clients.find(c => c.phone === phone) || null;
}

export async function createClient(client: Omit<Client, 'id' | 'loyalty_points' | 'total_visits' | 'created_at'>): Promise<Client> {
  const newClient: Client = {
    id: uid(),
    loyalty_points: 0,
    total_visits: 0,
    created_at: new Date().toISOString(),
    ...client,
  };
  if (isSupabaseConfigured()) {
    const { data } = await supabase!.from('clients').insert(newClient).select().single();
    return data!;
  }
  const clients = getLS<Client[]>('crm_clients', []);
  clients.unshift(newClient);
  setLS('crm_clients', clients);
  return newClient;
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase!.from('clients').update(updates).eq('id', id);
    return;
  }
  const clients = getLS<Client[]>('crm_clients', []);
  const idx = clients.findIndex(c => c.id === id);
  if (idx !== -1) {
    clients[idx] = { ...clients[idx], ...updates };
    setLS('crm_clients', clients);
  }
}

// ─── Bookings ───

export async function getBookings(): Promise<Booking[]> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase!
      .from('bookings')
      .select('*, client:clients(*), service:services(*)')
      .order('date', { ascending: false });
    return data || [];
  }
  initLS();
  const bookings = getLS<Booking[]>('crm_bookings', []);
  const clients = getLS<Client[]>('crm_clients', []);
  const services = getLS<Service[]>('crm_services', []);
  return bookings.map(b => ({
    ...b,
    client: clients.find(c => c.id === b.client_id),
    service: services.find(s => s.id === b.service_id),
  })).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getBookingsForDate(date: string): Promise<Booking[]> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase!
      .from('bookings')
      .select('*')
      .eq('date', date)
      .neq('status', 'cancelled');
    return data || [];
  }
  initLS();
  const bookings = getLS<Booking[]>('crm_bookings', []);
  return bookings.filter(b => b.date === date && b.status !== 'cancelled');
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'client' | 'service'>): Promise<Booking> {
  const newBooking: Booking = {
    id: uid(),
    created_at: new Date().toISOString(),
    ...booking,
  };
  if (isSupabaseConfigured()) {
    const { data } = await supabase!.from('bookings').insert(newBooking).select().single();
    return data!;
  }
  const bookings = getLS<Booking[]>('crm_bookings', []);
  bookings.unshift(newBooking);
  setLS('crm_bookings', bookings);
  return newBooking;
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase!.from('bookings').update({ status }).eq('id', id);
  } else {
    const bookings = getLS<Booking[]>('crm_bookings', []);
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      bookings[idx].status = status;
      setLS('crm_bookings', bookings);
    }
  }

  // If completed, award loyalty points
  if (status === 'completed') {
    const allBookings = isSupabaseConfigured()
      ? (await supabase!.from('bookings').select('*, service:services(*)').eq('id', id).single()).data
      : (() => {
          const bookings = getLS<Booking[]>('crm_bookings', []);
          const services = getLS<Service[]>('crm_services', []);
          const b = bookings.find(b => b.id === id);
          if (b) b.service = services.find(s => s.id === b.service_id);
          return b;
        })();

    if (allBookings?.service && allBookings.client_id) {
      const pointsToAdd = allBookings.service.points_earned;
      if (isSupabaseConfigured()) {
        const { data: client } = await supabase!.from('clients').select('*').eq('id', allBookings.client_id).single();
        if (client) {
          await supabase!.from('clients').update({
            loyalty_points: client.loyalty_points + pointsToAdd,
            total_visits: client.total_visits + 1,
          }).eq('id', allBookings.client_id);
        }
      } else {
        const clients = getLS<Client[]>('crm_clients', []);
        const cidx = clients.findIndex(c => c.id === allBookings.client_id);
        if (cidx !== -1) {
          clients[cidx].loyalty_points += pointsToAdd;
          clients[cidx].total_visits += 1;
          setLS('crm_clients', clients);
        }
      }
    }
  }
}

// ─── Time slots generation ───

export function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (current < end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += 30;
  }
  return slots;
}

export function isSlotBooked(
  slot: string,
  bookedSlots: Booking[],
  serviceDuration: number
): boolean {
  const slotMin = timeToMinutes(slot);
  const slotEnd = slotMin + serviceDuration;

  for (const b of bookedSlots) {
    const bStart = timeToMinutes(b.time_slot);
    const bEnd = bStart + b.duration_minutes;
    if (slotMin < bEnd && slotEnd > bStart) return true;
  }
  return false;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
