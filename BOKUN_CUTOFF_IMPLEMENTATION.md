# Bokun Booking Cutoff Implementation Summary

## Overview
Implemented a system to fetch booking cutoff times from Bokun product settings, with automatic caching and a 24-hour fallback.

## What Was Changed

### 1. Database Migration
**File:** `supabase/migrations/20250116000000_add_booking_cutoff_to_bokun_products.sql`

Added two columns to `bokun_products` table:
- `booking_cutoff_hours` - Stores the cutoff time (default: 24)
- `last_product_sync_at` - Tracks when product was last synced from Bokun

### 2. Product Sync Service
**File:** `customer/src/services/bokun/product-sync-service.js`

New service that:
- Fetches product details from Bokun API
- Extracts booking cutoff from various possible fields
- Caches cutoff in database
- Auto-syncs every 24 hours
- Falls back to 24 hours if Bokun unavailable

**Key Methods:**
```javascript
// Get cutoff for a single tour (auto-syncs if needed)
await bokunProductSyncService.getBookingCutoff('NIGHT_TOUR')

// Get cutoffs for multiple tours
await bokunProductSyncService.getBookingCutoffs(['NIGHT_TOUR', 'UJI_TOUR'])

// Force sync all products
await bokunProductSyncService.syncAllProducts()
```

### 3. Bokun Proxy Updates
**File:** `supabase/functions/bokun-proxy/index.ts`

Added new endpoint to fetch product details:
- `GET /product/{productId}` - Returns full product details including booking settings

### 4. Secure API Client Updates
**File:** `customer/src/services/bokun/secure-api-client.js`

Added methods:
- `getProduct(productId)` - Fetch product details
- `getActivity(activityId)` - Alias for getProduct

### 5. Tours Service Integration
**File:** `customer/src/services/toursService.ts`

Updated `fetchTours()` to:
- Fetch cutoffs from Bokun for all tours
- Use Bokun cutoff instead of hardcoded 24 hours
- Fall back to 24 hours if Bokun unavailable

Removed references to non-existent database columns:
- `cancellation_cutoff_hours`
- `cancellation_cutoff_hours_with_participant`
- `next_day_cutoff_time`

### 6. Utility Scripts
**File:** `customer/src/utils/sync-bokun-products.js`

Manual sync script:
```bash
node src/utils/sync-bokun-products.js
```

**File:** `customer/src/services/bokun/test-cutoff.js`

Test script to verify the system works:
```bash
node src/services/bokun/test-cutoff.js
```

### 7. Documentation
**File:** `customer/src/services/bokun/BOOKING_CUTOFF.md`

Complete documentation covering:
- How the system works
- Usage examples
- Configuration options
- Troubleshooting guide
- Integration points

## How It Works

### Flow Diagram
```
User requests tour data
    ↓
toursService.fetchTours()
    ↓
bokunProductSyncService.getBookingCutoff(tourType)
    ↓
Check database cache
    ↓
Is cache fresh? (< 24 hours old)
    ↓ No                    ↓ Yes
Fetch from Bokun API    Return cached value
    ↓
Extract cutoff from product.bookingSettings
    ↓
Save to database
    ↓
Return cutoff (or 24 if not found)
```

### Bokun API Fields Checked
The system looks for cutoff in these fields (in order):
1. `bookingSettings.cutOffMinutes` ← Most common
2. `bookingSettings.advanceBookingMinimum`
3. `bookingSettings.bookingCutoff`
4. `cutOffMinutes` (top-level)

If none found → defaults to 24 hours

## Setup Instructions

### 1. Run Database Migration
```bash
cd supabase
supabase db push
```

Or manually:
```bash
psql -f supabase/migrations/20250116000000_add_booking_cutoff_to_bokun_products.sql
```

### 2. Verify Bokun Product Mappings
Check that your `bokun_products` table has correct product IDs:
```sql
SELECT local_tour_type, bokun_product_id, is_active 
FROM bokun_products;
```

### 3. Initial Sync (Optional)
Force sync all products to populate cutoffs immediately:
```bash
cd customer
node src/utils/sync-bokun-products.js
```

### 4. Verify Cutoffs
Check the database:
```sql
SELECT local_tour_type, booking_cutoff_hours, last_product_sync_at 
FROM bokun_products;
```

### 5. Test the System
```bash
cd customer
node src/services/bokun/test-cutoff.js
```

## Configuration

### Change Sync Interval
Edit `customer/src/services/bokun/product-sync-service.js`:
```javascript
this.SYNC_INTERVAL = 24 * 60 * 60 * 1000; // Change to desired interval
```

### Change Default Fallback
Edit `customer/src/services/bokun/product-sync-service.js`:
```javascript
this.DEFAULT_CUTOFF_HOURS = 24; // Change to desired default
```

## Fallback Behavior

The system has multiple fallback layers:

1. **Bokun API fails** → Use cached value (even if expired)
2. **No cached value** → Use 24 hours
3. **Bokun product has no cutoff** → Use 24 hours
4. **Product not found in database** → Use 24 hours

This ensures bookings always work, even if Bokun is unavailable.

## Monitoring

### Check Sync Status
```sql
SELECT 
    local_tour_type,
    booking_cutoff_hours,
    last_product_sync_at,
    EXTRACT(EPOCH FROM (NOW() - last_product_sync_at))/3600 as hours_since_sync
FROM bokun_products
WHERE is_active = true;
```

### Check Logs
```bash
# Edge function logs
supabase functions logs bokun-proxy

# Application logs
# Check browser console for sync messages
```

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Bokun product mappings are correct
- [ ] Initial sync completed without errors
- [ ] Cutoff values populated in database
- [ ] Tours load with correct cutoff times
- [ ] Booking restrictions work based on cutoff
- [ ] Fallback to 24 hours works when Bokun unavailable
- [ ] Auto-sync triggers after 24 hours

## Troubleshooting

### Issue: Cutoff always 24 hours
**Possible causes:**
- Bokun product doesn't have cutoff configured
- Product ID mapping incorrect
- Sync hasn't run yet

**Solution:**
1. Check Bokun dashboard → Product → Booking Settings
2. Verify product ID in `bokun_products` table
3. Run manual sync: `node src/utils/sync-bokun-products.js`

### Issue: Sync failing
**Possible causes:**
- Bokun API credentials missing/incorrect
- Network issues
- Product ID doesn't exist in Bokun

**Solution:**
1. Check environment variables: `BOKUN_PUBLIC_KEY`, `BOKUN_SECRET_KEY`
2. Test Bokun API manually
3. Check edge function logs
4. Verify product ID exists in Bokun

### Issue: Old cutoff not updating
**Possible causes:**
- Sync interval hasn't elapsed (24 hours)
- Sync errors being silently caught

**Solution:**
1. Force sync: `bokunProductSyncService.syncAllProducts()`
2. Check `last_product_sync_at` timestamp
3. Check console logs for errors

## Future Enhancements

Potential improvements:
- [ ] Webhook integration for real-time updates when Bokun settings change
- [ ] Admin UI to view/override cutoff times
- [ ] Different cutoffs based on participant count
- [ ] Monitoring dashboard for sync status
- [ ] Alerts for sync failures
- [ ] Support for time-of-day specific cutoffs

## Related Files

### Core Implementation
- `customer/src/services/bokun/product-sync-service.js`
- `supabase/functions/bokun-proxy/index.ts`
- `customer/src/services/bokun/secure-api-client.js`
- `customer/src/services/toursService.ts`

### Database
- `supabase/migrations/20250116000000_add_booking_cutoff_to_bokun_products.sql`

### Utilities
- `customer/src/utils/sync-bokun-products.js`
- `customer/src/services/bokun/test-cutoff.js`

### Documentation
- `customer/src/services/bokun/BOOKING_CUTOFF.md`

## Support

For issues or questions:
1. Check the documentation: `customer/src/services/bokun/BOOKING_CUTOFF.md`
2. Review logs for error messages
3. Test with: `node src/services/bokun/test-cutoff.js`
4. Check database state with SQL queries above
