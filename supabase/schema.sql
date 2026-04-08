-- Supabase schema for Photo Studio CRM

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  points_earned INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  service_id UUID REFERENCES services(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  points_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule settings (working hours per day of week)
CREATE TABLE schedule_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '20:00',
  is_available BOOLEAN DEFAULT true,
  UNIQUE(day_of_week)
);

-- Blocked slots (holidays, breaks, etc.)
CREATE TABLE blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time_slot TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: default schedule (Mon-Sat 9:00-20:00, Sun off)
INSERT INTO schedule_settings (day_of_week, start_time, end_time, is_available) VALUES
  (0, '09:00', '20:00', false),  -- Sunday
  (1, '09:00', '20:00', true),   -- Monday
  (2, '09:00', '20:00', true),   -- Tuesday
  (3, '09:00', '20:00', true),   -- Wednesday
  (4, '09:00', '20:00', true),   -- Thursday
  (5, '09:00', '20:00', true),   -- Friday
  (6, '10:00', '18:00', true);   -- Saturday

-- Seed: default services
INSERT INTO services (name, price, duration_minutes, points_earned) VALUES
  ('Портретная съёмка', 150, 60, 50),
  ('Семейная съёмка', 250, 90, 80),
  ('Предметная съёмка', 90, 30, 30),
  ('Фотосессия для документов', 30, 30, 10),
  ('Студийная аренда', 60, 60, 20),
  ('Love Story', 200, 90, 70),
  ('Детская съёмка', 180, 60, 60);

-- Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Public read access for services and schedule
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Schedule is viewable by everyone" ON schedule_settings FOR SELECT USING (true);
CREATE POLICY "Bookings are viewable by everyone" ON bookings FOR SELECT USING (true);
CREATE POLICY "Clients can insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Clients can insert themselves" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Clients are viewable by everyone" ON clients FOR SELECT USING (true);
CREATE POLICY "Blocked slots viewable by everyone" ON blocked_slots FOR SELECT USING (true);

-- Admin policies (using service role key for admin operations)
CREATE POLICY "Admin can update bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Admin can delete bookings" ON bookings FOR DELETE USING (true);
CREATE POLICY "Admin can update clients" ON clients FOR UPDATE USING (true);
CREATE POLICY "Admin can manage blocked slots" ON blocked_slots FOR ALL USING (true);
CREATE POLICY "Admin can manage schedule" ON schedule_settings FOR ALL USING (true);
CREATE POLICY "Admin can manage services" ON services FOR ALL USING (true);
