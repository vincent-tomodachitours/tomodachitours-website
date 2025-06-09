-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    tour_id INTEGER NOT NULL,
    booking_date DATE NOT NULL,
    number_of_people INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING',
    payment_id TEXT,
    payment_status TEXT DEFAULT 'PENDING',
    discount_code_id INTEGER,
    discount_amount INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON bookings(payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status); 