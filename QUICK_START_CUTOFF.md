# Quick Start: Booking Cutoff Times

## TL;DR
Booking cutoff times are now stored in the `tours` table instead of being hardcoded to 24 hours. You can configure different cutoff times for each tour.

## Setup (1 minute)

### 1. Apply Database Migration
Run this SQL in your database:

```sql
-- Add booking cutoff column
ALTER TABLE tours 
ADD COLUMN booking_cutoff_hours INTEGER DEFAULT 24;

-- Set initial values
UPDATE tours SET booking_cutoff_hours = 24 
WHERE type IN ('NIGHT_TOUR', 'MORNING_TOUR', 'GION_TOUR');

UPDATE tours SET booking_cutoff_hours = 48 
WHERE type IN ('UJI_TOUR', 'UJI_WALKING_TOUR');
```

Or use the migration file:
```bash
psql -f supabase/migrations/20250116000001_add_booking_cutoff_to_tours.sql
```

### 2. Verify
```sql
SELECT type, name, booking_cutoff_hours 
FROM tours 
ORDER BY type;
```

Done! 🎉

## Update Cutoff Times

Use the provided SQL file `UPDATE_CUTOFF_TIMES.sql` or run directly:

```sql
-- Standard tours: 24 hours
UPDATE tours 
SET booking_cutoff_hours = 24 
WHERE type = 'NIGHT_TOUR';

-- Uji tours: 48 hours (needs partner coordination)
UPDATE tours 
SET booking_cutoff_hours = 48 
WHERE type = 'UJI_TOUR';
```

## How It Works

1. Cutoff times stored in `tours.booking_cutoff_hours`
2. Tours service reads cutoff when loading tours
3. Booking logic uses cutoff to restrict bookings
4. Falls back to 24 hours if not set

## What Changed

- ✅ Cutoff times stored in tours table
- ✅ Configurable per tour via SQL
- ✅ Falls back to 24 hours
- ✅ Removed hardcoded values
- ✅ Simple to update

## Files Changed

- `supabase/migrations/20250116000001_add_booking_cutoff_to_tours.sql` (NEW)
- `customer/src/services/toursService.ts` (UPDATED)
- `schema.ts` (UPDATED)
- `UPDATE_CUTOFF_TIMES.sql` (NEW - helper script)
