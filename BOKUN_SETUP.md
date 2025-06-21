# Bokun Integration Setup Guide

## Overview
This document outlines the setup steps for the Bokun REST API integration that manages available timeslots.

## Current Implementation Status

### ✅ Completed
1. **Database Schema** - Created Bokun integration tables
2. **API Client** - Basic Bokun API client with authentication
3. **Availability Service** - Service for managing timeslots with caching
4. **Webhook Handler** - Supabase Edge Function for real-time updates
5. **Tours Service Integration** - Enhanced existing service with Bokun support

### 📋 Next Steps

#### 1. Environment Configuration
Add these environment variables to your `.env` file:

```bash
# Bokun API Configuration (TEST ENVIRONMENT ONLY)
REACT_APP_BOKUN_API_KEY=your_test_api_key
REACT_APP_BOKUN_API_SECRET=your_test_api_secret  
REACT_APP_BOKUN_API_URL=https://api.test.bokun.io/booking
BOKUN_WEBHOOK_SECRET=your_webhook_secret
```

⚠️ **IMPORTANT**: Always use the TEST environment API for development!

#### 2. Database Migration
Run the Bokun tables migration:
```bash
supabase db push
```

#### 3. Configure Product Mappings
Update the `bokun_products` table with your actual Bokun product IDs:

```sql
UPDATE bokun_products 
SET bokun_product_id = 'actual_bokun_product_id', is_active = true 
WHERE local_tour_type = 'NIGHT_TOUR';

-- Repeat for other tour types
```

#### 4. Deploy Webhook Handler
```bash
supabase functions deploy bokun-webhook
```

#### 5. Configure Bokun Webhooks
In your Bokun dashboard, set up webhooks pointing to:
```
https://your-project.supabase.co/functions/v1/bokun-webhook
```

## Files Created/Modified

### New Files
- `supabase/migrations/20241214000000_create_bokun_tables.sql`
- `src/services/bokun/api-client.js`
- `src/services/bokun/availability-service.js`
- `supabase/functions/bokun-webhook/index.ts`

### Modified Files
- `src/services/toursService.js` - Added availability checking functions
- `supabase/functions/_shared/cors.ts` - Added Bokun webhook headers

## Usage Examples

### Check Availability
```javascript
import { checkAvailability } from '../services/toursService';

const isAvailable = await checkAvailability('night-tour', '2024-12-15', '18:00', 2);
```

### Get Available Time Slots
```javascript
import { getAvailableTimeSlots } from '../services/toursService';

const slots = await getAvailableTimeSlots('night-tour', '2024-12-15');
// Returns: [{ time: '18:00', availableSpots: 8, source: 'bokun' }, ...]
```

## Architecture

```
Frontend → Tours Service → Bokun Availability Service → Bokun API
                        ↓
                  Local Database Cache
                        ↑
            Bokun Webhooks → Supabase Edge Function
```

## Features

### Availability Management
- ✅ Real-time availability checking via Bokun API
- ✅ 15-minute caching to reduce API calls
- ✅ Automatic fallback to local availability if Bokun is unavailable
- ✅ Cache invalidation on booking changes

### Booking Synchronization
- ✅ External booking tracking from OTAs (via webhooks)
- 🔄 Booking sync to Bokun (to be implemented next)

### Monitoring
- ✅ Comprehensive error logging
- ✅ Source tracking (bokun/local/fallback)

## Testing

Before going live:
1. Test API connection: `bokunAPI.testConnection()`
2. Verify availability data matches between Bokun and local
3. Test webhook handling with sample events
4. Confirm cache expiration and refresh logic

## Security Notes

- All API credentials are environment-based
- Webhook signature verification implemented
- Test environment enforced for development
- Rate limiting considered in API client

## Support

For issues with this integration, check:
1. Console logs for API errors
2. Supabase logs for webhook processing
3. Database for sync status in `bokun_bookings` table 