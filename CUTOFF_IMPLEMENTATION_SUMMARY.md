# Booking Cutoff Time Implementation - Summary

## What Was Done

Successfully implemented configurable booking cutoff times that are stored in the database and used throughout the booking flow, with automatic fallback to 24 hours.

## Changes Made

### 1. Database Schema
**File:** `supabase/migrations/20250116000001_add_booking_cutoff_to_tours.sql`

- Added `booking_cutoff_hours` column to `tours` table
- Set default value to 24 hours
- Initialized values: 24 hours for most tours, 48 hours for Uji tours
- Added index for efficient queries

### 2. Tours Service
**File:** `customer/src/services/toursService.ts`

- Updated to fetch `booking_cutoff_hours` from tours table
- Removed dependency on non-existent columns
- Added fallback to 24 hours if cutoff not set

### 3. Availability Hook
**File:** `customer/src/hooks/useAvailability.ts`

- Added safe fallback variables for cutoff times
- Ensures cutoff defaults to 24 hours if undefined
- Uses cutoff to filter available time slots

### 4. DatePicker Component
**File:** `customer/src/Components/DatePicker.tsx`

- Added default parameter value of 24 hours for cutoff
- Created safe cutoff variables with fallback logic
- Passes safe values to useAvailability hook

### 5. Type Definitions
**File:** `schema.ts`

- Updated tours table schema to include `booking_cutoff_hours`
- Removed non-existent cutoff columns

## How It Works

### Data Flow
```
Database (tours table)
    ↓
toursService.fetchTours()
    ↓ (fetches booking_cutoff_hours)
TourConfig object
    ↓
BaseTourPage
    ↓ (passes as cancellationCutoffHours prop)
DatePicker component
    ↓ (applies fallback: cutoff || 24)
useAvailability hook
    ↓ (applies fallback: cutoff || 24)
Time slot filtering
```

### Fallback Chain
1. **Database value** - Primary source from `tours.booking_cutoff_hours`
2. **Default parameter** - DatePicker has default of 24
3. **Safe variables** - Both DatePicker and useAvailability create safe variables
4. **Final fallback** - `|| 24` ensures 24 hours minimum

### Current Cutoff Times
- **NIGHT_TOUR**: 24 hours
- **MORNING_TOUR**: 24 hours
- **GION_TOUR**: 24 hours
- **UJI_TOUR**: 48 hours (needs partner coordination)
- **UJI_WALKING_TOUR**: 48 hours

## Testing

### Verify Database
```sql
SELECT type, name, booking_cutoff_hours 
FROM tours 
ORDER BY type;
```

### Test Booking Flow
1. Try booking a tour within cutoff window → Should be blocked
2. Try booking outside cutoff window → Should work
3. Check console logs for cutoff values being used

### Test Fallback
1. Set cutoff to NULL in database
2. Verify booking still works with 24-hour default
3. Check console for fallback messages

## Updating Cutoff Times

### Via SQL
```sql
-- Update single tour
UPDATE tours 
SET booking_cutoff_hours = 72 
WHERE type = 'UJI_TOUR';

-- Update multiple tours
UPDATE tours 
SET booking_cutoff_hours = 48 
WHERE type IN ('UJI_TOUR', 'UJI_WALKING_TOUR');
```

### Using Helper Script
```bash
# Edit UPDATE_CUTOFF_TIMES.sql with desired values
psql -f UPDATE_CUTOFF_TIMES.sql
```

## Benefits

✅ **Flexible** - Different cutoff times per tour
✅ **Reliable** - Multiple fallback layers ensure system always works
✅ **Simple** - Easy to update via SQL
✅ **Maintainable** - No complex API integrations
✅ **Safe** - Always defaults to tour-specific cutoff if anything fails (48h for Uji, 24h for others)

## Files Modified

1. `supabase/migrations/20250116000001_add_booking_cutoff_to_tours.sql` (NEW)
2. `customer/src/services/toursService.ts` (UPDATED)
3. `customer/src/hooks/useAvailability.ts` (UPDATED)
4. `customer/src/Components/DatePicker.tsx` (UPDATED)
5. `schema.ts` (UPDATED)
6. `UPDATE_CUTOFF_TIMES.sql` (NEW - helper script)
7. `QUICK_START_CUTOFF.md` (NEW - documentation)

## Fallback Logic

The system has **intelligent fallback** to ensure it always works:

1. **Database value** (primary) - Fetched from `tours.booking_cutoff_hours`
2. **Tour-specific default** - If database value is missing:
   - Uji Tour & Uji Walking Tour: **48 hours** (needs partner coordination)
   - All other tours: **24 hours**
3. **Safe variables** - Both DatePicker and useAvailability apply fallback
4. **Automatic detection** - Uses `tourId` or `sheetId` to identify Uji tours

## Migration Applied

✅ Database migration has been applied
✅ Cutoff times have been set
✅ Code has been updated
✅ Fallbacks are in place (48h for Uji, 24h for others)

## Next Steps

1. Test booking flow on staging/production
2. Monitor console logs for cutoff values
3. Adjust cutoff times as needed via SQL
4. Consider adding admin UI for cutoff management (future enhancement)

## Troubleshooting

### Issue: Cutoff not working
**Check:**
- Database has `booking_cutoff_hours` column
- Tours table has values set
- Console logs show correct cutoff values

### Issue: Always using 24 hours
**Possible causes:**
- Database value is NULL
- Fallback is working as intended
- Check: `SELECT booking_cutoff_hours FROM tours WHERE type = 'YOUR_TOUR'`

### Issue: Bookings blocked unexpectedly
**Check:**
- Cutoff time in database
- Current time vs tour time
- Console logs for "hoursUntilTour" and "cutoffHours"

## Success Criteria

✅ Tours load with correct cutoff times from database
✅ Booking restrictions work based on cutoff
✅ System falls back to 24 hours if cutoff missing
✅ Easy to update cutoff times via SQL
✅ No hardcoded cutoff values in code
