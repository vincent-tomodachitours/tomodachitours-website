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

### 3. Find Your Activity IDs
1. Go to **Products** → **Activities** in Bokun
2. Find each of your tour activities:
   - Night Tour (Fushimi Inari)
   - Morning Tour (Early Bird)
   - Uji Tour (Tea Tour)
   - Gion Tour (Early Morning Walking)
3. For each activity, click to edit it
4. The Activity ID is shown in the URL or activity details
5. Copy these IDs for your environment variables:
   - `NIGHT_TOUR_PRODUCT_ID`
   - `MORNING_TOUR_PRODUCT_ID`
   - `UJI_TOUR_PRODUCT_ID`
   - `GION_TOUR_PRODUCT_ID`

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
# BOKUN_API_URL=https://api.bokuntest.com  # Test environment
BOKUN_API_URL=https://api.bokun.io     # Production environment
BOKUN_WEBHOOK_SECRET=your_generated_webhook_secret

# Product IDs for all tours
NIGHT_TOUR_PRODUCT_ID=your_night_tour_bokun_activity_id
MORNING_TOUR_PRODUCT_ID=your_morning_tour_bokun_activity_id
UJI_TOUR_PRODUCT_ID=your_uji_tour_bokun_activity_id
GION_TOUR_PRODUCT_ID=your_gion_tour_bokun_activity_id
```

⚠️ **IMPORTANT**: 
- Bokun uses HMAC-SHA1 signature authentication, NOT OAuth
- Now configured for PRODUCTION environment (api.bokun.io) by default
- You need to create a booking channel in Bokun before getting API keys

#### 2. Database Migration
Run the Bokun tables migration:
```bash
supabase db push
```

#### 3. Configure Product Mappings
Use the provided SQL script to update all product mappings:

```bash
# First, set your environment variables with actual Bokun product IDs
export NIGHT_TOUR_PRODUCT_ID=your_actual_night_tour_id
export MORNING_TOUR_PRODUCT_ID=your_actual_morning_tour_id
export UJI_TOUR_PRODUCT_ID=your_actual_uji_tour_id
export GION_TOUR_PRODUCT_ID=your_actual_gion_tour_id

# Then run the SQL script
envsubst < update_bokun_products.sql | psql -d your_database
```

Or manually update the database:
```sql
-- Update all tour product IDs with your actual Bokun activity IDs
UPDATE bokun_products SET bokun_product_id = 'YOUR_NIGHT_TOUR_ID', is_active = true WHERE local_tour_type = 'NIGHT_TOUR';
UPDATE bokun_products SET bokun_product_id = 'YOUR_MORNING_TOUR_ID', is_active = true WHERE local_tour_type = 'MORNING_TOUR';
UPDATE bokun_products SET bokun_product_id = 'YOUR_UJI_TOUR_ID', is_active = true WHERE local_tour_type = 'UJI_TOUR';
UPDATE bokun_products SET bokun_product_id = 'YOUR_GION_TOUR_ID', is_active = true WHERE local_tour_type = 'GION_TOUR';
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