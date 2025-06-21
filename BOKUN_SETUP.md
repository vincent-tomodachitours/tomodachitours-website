# Bokun Integration Setup Guide

## Overview
This document outlines the setup steps for the Bokun REST API integration that manages available timeslots.

## Prerequisites - What You Need From Bokun

Before implementing the technical integration, you need to set up your Bokun account properly:

### 1. Create a Booking Channel in Bokun
1. Log into your Bokun dashboard
2. Go to **Settings** → **Booking Channels**
3. Click **"Create New Booking Channel"**
4. Configure the channel:
   - Name: "Website Direct Bookings" (or similar)
   - Currency: Your preferred currency (USD, EUR, JPY, etc.)
   - Set booking permissions as needed

### 2. Create an API Key
1. In Bokun dashboard, go to **Settings** → **API Keys**
2. Click **"Create New API Key"**
3. Select your booking channel
4. Set permissions:
   - ✅ **Read activities**
   - ✅ **Read availability**
   - ✅ **Create bookings**
   - ✅ **Read bookings**
   - ✅ **Cancel bookings**
5. Save and copy:
   - **Access Key** (this is your `BOKUN_PUBLIC_KEY`)
   - **Secret Key** (this is your `BOKUN_SECRET_KEY`)

### 3. Find Your Activity ID
1. Go to **Products** → **Activities** in Bokun
2. Find your Night Tour activity
3. Click to edit it
4. The Activity ID is shown in the URL or activity details
5. Copy this ID (this is your `NIGHT_TOUR_PRODUCT_ID`)

## Current Implementation Status

### ✅ Completed
1. **Database Schema** - Created Bokun integration tables
2. **API Client** - HMAC-SHA1 authenticated API client for Bokun
3. **Availability Service** - Service for managing timeslots with caching
4. **Webhook Handler** - Supabase Edge Function for real-time updates
5. **Tours Service Integration** - Enhanced existing service with Bokun support

### 📋 Implementation Steps

#### 1. Environment Configuration
Add these environment variables to your `.env` file:

```bash
# Bokun API Configuration
BOKUN_PUBLIC_KEY=your_bokun_access_key
BOKUN_SECRET_KEY=your_bokun_secret_key
BOKUN_API_URL=https://api.bokuntest.com  # Test environment
# BOKUN_API_URL=https://api.bokun.io     # Production environment
BOKUN_WEBHOOK_SECRET=your_generated_webhook_secret
NIGHT_TOUR_PRODUCT_ID=your_bokun_activity_id
```

⚠️ **IMPORTANT**: 
- Bokun uses HMAC-SHA1 signature authentication, NOT OAuth
- Always use the TEST environment (api.bokuntest.com) for development
- You need to create a booking channel in Bokun before getting API keys

#### 2. Database Migration
Run the Bokun tables migration:
```bash
supabase db push
```

#### 3. Configure Product Mappings
Update the `bokun_products` table with your actual Bokun activity ID:

```sql
-- Replace 'YOUR_ACTUAL_NIGHT_TOUR_ACTIVITY_ID' with your Bokun activity ID
UPDATE bokun_products 
SET bokun_product_id = 'YOUR_ACTUAL_NIGHT_TOUR_ACTIVITY_ID', is_active = true 
WHERE local_tour_type = 'NIGHT_TOUR';

-- Or insert if not exists
INSERT INTO bokun_products (local_tour_type, bokun_product_id, is_active) 
VALUES ('NIGHT_TOUR', 'YOUR_ACTUAL_NIGHT_TOUR_ACTIVITY_ID', true)
ON CONFLICT (local_tour_type, bokun_product_id) 
DO UPDATE SET is_active = true, updated_at = NOW();
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