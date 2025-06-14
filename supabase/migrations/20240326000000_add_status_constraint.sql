-- Add status enum type if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED');
    END IF;
END $$;

-- Drop default temporarily if column is text
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'status' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE bookings 
        ALTER COLUMN status DROP DEFAULT;
    END IF;
END $$;

-- Convert existing status column to use enum if not already converted
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'status' 
        AND data_type = 'text'
    ) THEN
        -- Update any lowercase values to uppercase
        UPDATE bookings 
        SET status = UPPER(status)
        WHERE status != UPPER(status);

        -- Convert column type
        ALTER TABLE bookings 
        ALTER COLUMN status TYPE booking_status USING status::booking_status;
    END IF;
END $$;

-- Set default value for status
ALTER TABLE bookings 
ALTER COLUMN status SET DEFAULT 'PENDING'::booking_status;

-- Add check constraint to payment_status if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'bookings' 
        AND constraint_name = 'valid_payment_status'
    ) THEN
        -- Update any lowercase values to uppercase
        UPDATE bookings 
        SET payment_status = UPPER(payment_status)
        WHERE payment_status IS NOT NULL 
        AND payment_status != UPPER(payment_status);

        ALTER TABLE bookings
        ADD CONSTRAINT valid_payment_status 
        CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'CANCELLED'));
    END IF;
END $$; 