-- Drop all tour-related tables for a full reset
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.tour_settings CASCADE;
DROP TABLE IF EXISTS public.tour_time_slots CASCADE;
DROP TABLE IF EXISTS public.discount_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create a simple bookings table that matches Google Sheets structure
CREATE TABLE public.bookings (
    id SERIAL PRIMARY KEY,
    booking_date DATE NOT NULL,
    booking_time TEXT NOT NULL,
    adults INTEGER NOT NULL CHECK (adults >= 0),
    children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0),
    infants INTEGER NOT NULL DEFAULT 0 CHECK (infants >= 0),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT NOT NULL,
    total_participants INTEGER GENERATED ALWAYS AS (adults + children + infants) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED')),
    charge_id TEXT,
    discount_code TEXT,
    tour_type TEXT NOT NULL CHECK (tour_type IN ('NIGHT_TOUR', 'MORNING_TOUR', 'UJI_TOUR', 'GION_TOUR'))
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_email ON public.bookings(customer_email);
CREATE INDEX idx_bookings_tour_type ON public.bookings(tour_type);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Add a trigger to automatically update created_at timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_created_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_handle_created_at
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_created_at();

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.bookings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.bookings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.bookings
    FOR DELETE USING (auth.role() = 'authenticated'); 