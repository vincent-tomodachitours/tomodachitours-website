# Bokun Booking Cutoff Integration

This system fetches and caches booking cutoff times from Bokun product settings, with a 24-hour fallback.

## How It Works

### 1. Database Storage
The `bokun_products` table stores:
- `booking_cutoff_hours` - Minimum hours before tour start that bookings are allowed
- `last_product_sync_at` - Timestamp of last sync from Bokun

### 2. Automatic Syncing
When a tour's cutoff is requested:
- If never synced OR last sync > 24 hours ago → Fetch from Bokun API
- Otherwise → Use cached value from database
- If Bokun fetch fails → Fall back to 24 hours

### 3. Bokun API Integration
The system fetches product details from Bokun's `/activity.json/{productId}` endpoint and extracts cutoff from:
- `bookingSettings.cutOffMinutes` (most common)
- `bookingSettings.advanceBookingMinimum`
- `bookingSettings.bookingCutoff`
- `cutOffMinutes` (top-level)

If none found → defaults to 24 hours

## Usage

### Automatic (Recommended)
The system automatically syncs when needed. No action required.

```javascript
import { bokunProductSyncService } from './services/bokun/product-sync-service';

// Get cutoff for a single tour
const cutoffHours = await bokunProductSyncService.getBookingCutoff('NIGHT_TOUR');
// Returns: 24 (or whatever is configured in Bokun)

// Get cutoffs for multiple tours
const cutoffs = await bokunProductSyncService.getBookingCutoffs(['NIGHT_TOUR', 'UJI_TOUR']);
// Returns: { NIGHT_TOUR: 24, UJI_TOUR: 48 }
```

### Manual Sync
Force sync all products immediately:

```bash
# From customer directory
node src/utils/sync-bokun-products.js
```

Or programmatically:
```javascript
import { bokunProductSyncService } from './services/bokun/product-sync-service';

await bokunProductSyncService.syncAllProducts();
```

### Force Sync Single Product
```javascript
await bokunProductSyncService.syncProductDetails('932404', 'NIGHT_TOUR');
```

## Configuration

### Sync Interval
Default: 24 hours (configurable in `product-sync-service.js`)

```javascript
this.SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
```

### Default Fallback
Default: 24 hours (configurable in `product-sync-service.js`)

```javascript
this.DEFAULT_CUTOFF_HOURS = 24;
```

## Database Migration

Run the migration to add the required columns:

```bash
# Apply migration
supabase db push

# Or manually
psql -f supabase/migrations/20250116000000_add_booking_cutoff_to_bokun_products.sql
```

## Bokun Product Settings

To configure cutoff times in Bokun:
1. Log into Bokun dashboard
2. Go to Products → Select your activity
3. Navigate to Booking Settings
4. Set "Cut-off time" (usually in minutes before tour start)
5. Save changes
6. Run manual sync or wait for automatic sync

## Troubleshooting

### Cutoff not updating
1. Check `bokun_products` table for `last_product_sync_at`
2. Check logs for sync errors
3. Verify Bokun API credentials are correct
4. Manually trigger sync: `bokunProductSyncService.syncAllProducts()`

### Always getting 24 hours
- Bokun product may not have cutoff configured
- Check Bokun product settings
- Verify product ID mapping in `bokun_products` table
- Check console logs for extraction details

### Sync failing
- Verify Bokun API credentials in environment variables
- Check network connectivity
- Verify product ID exists in Bokun
- Check edge function logs: `supabase functions logs bokun-proxy`

## Example Bokun Response

```json
{
  "id": "932404",
  "title": "Kyoto Night Tour",
  "bookingSettings": {
    "cutOffMinutes": 1440,
    "advanceBookingMinimum": 1440,
    "allowSameDayBooking": false
  }
}
```

This would result in `booking_cutoff_hours = 24` (1440 minutes / 60).

## Integration Points

The cutoff is used in:
- `customer/src/services/toursService.ts` - Fetches cutoffs when loading tours
- `customer/src/hooks/useAvailability.ts` - Filters time slots based on cutoff
- `customer/src/Components/DatePicker.tsx` - Disables dates/times within cutoff window

## Future Enhancements

- [ ] Add webhook to sync when Bokun product settings change
- [ ] Add admin UI to view/override cutoff times
- [ ] Support different cutoffs for different participant counts
- [ ] Add monitoring/alerts for sync failures
