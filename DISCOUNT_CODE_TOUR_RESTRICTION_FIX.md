# Discount Code Tour Restriction - Implementation Fix

## Problem
The TAMIRJAPAN discount code was being applied to all tours (including MORNING_TOUR) even though it was configured to only work for NIGHT_TOUR.

## Root Cause
The frontend checkout flow was not passing the `tourType` parameter to the `validate-discount` function, so the backend couldn't check if the tour was excluded.

## Solution

### 1. Backend (Already Implemented)
- ✅ Added `excluded_tour_types` column to `discount_codes` table
- ✅ Updated validation function to check excluded tour types
- ✅ Made `tourType` parameter optional for backwards compatibility

### 2. Frontend (Fixed)

#### Added Tour Type Mapping Utility
**File:** `customer/src/utils/tourUtils.ts`

```typescript
export const getTourTypeFromId = (tourId: string): string => {
    const tourTypeMap: Record<string, string> = {
        'night-tour': 'NIGHT_TOUR',
        'morning-tour': 'MORNING_TOUR',
        'uji-tour': 'UJI_TOUR',
        'uji-walking-tour': 'UJI_WALKING_TOUR',
        'gion-tour': 'GION_TOUR',
        'music-tour': 'MUSIC_TOUR',
        'music-performance': 'MUSIC_PERFORMANCE'
    };
    
    return tourTypeMap[tourId] || tourId.toUpperCase().replace(/-/g, '_');
};
```

#### Updated Checkout Logic
**File:** `customer/src/Components/Checkout/useCheckoutLogic.ts`

- Imported `getTourTypeFromId` utility
- Modified `handleApplyDiscount` to include `tourType` in the API request:

```typescript
const tourType = getTourTypeFromId(sheetId);

const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/validate-discount`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
        code: discountCode,
        originalAmount: (adult + child) * tourPrice,
        tourType: tourType  // ← Now included!
    }),
});
```

## Deployment Steps

### 1. Deploy Database Migration
```bash
# Local testing
supabase db reset

# Production
supabase db push
```

### 2. Deploy Edge Function
```bash
# Local
supabase functions deploy validate-discount

# Production
supabase functions deploy validate-discount --project-ref <your-project-ref>
```

### 3. Deploy Frontend
```bash
# Build and deploy your customer frontend
cd customer
npm run build
# Deploy to your hosting (Vercel, Netlify, etc.)
```

## Testing

### 1. Verify Database Column
```sql
SELECT code, excluded_tour_types 
FROM discount_codes 
WHERE code = 'TAMIRJAPAN';
```

Expected result:
```
code        | excluded_tour_types
------------|--------------------
TAMIRJAPAN  | {MORNING_TOUR,UJI_TOUR,UJI_WALKING_TOUR,GION_TOUR,MUSIC_TOUR}
```

### 2. Test API Directly
```bash
# Should succeed (NIGHT_TOUR not excluded)
curl -X POST 'https://your-project.supabase.co/functions/v1/validate-discount' \
  -H 'Authorization: Bearer <ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"TAMIRJAPAN","originalAmount":10000,"tourType":"NIGHT_TOUR"}'

# Should fail (MORNING_TOUR is excluded)
curl -X POST 'https://your-project.supabase.co/functions/v1/validate-discount' \
  -H 'Authorization: Bearer <ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"TAMIRJAPAN","originalAmount":10000,"tourType":"MORNING_TOUR"}'
```

### 3. Test in Browser
1. Go to the Night Tour booking page
2. Add TAMIRJAPAN discount code
3. ✅ Should apply successfully

4. Go to the Morning Tour booking page
5. Add TAMIRJAPAN discount code
6. ❌ Should show error: "This discount code is not valid for the selected tour"

## Files Changed

### Backend
- `supabase/migrations/20251105000000_add_excluded_tour_types_to_discount_codes.sql`
- `supabase/functions/validate-discount/index.ts`
- `schema.ts`

### Frontend
- `customer/src/utils/tourUtils.ts`
- `customer/src/Components/Checkout/useCheckoutLogic.ts`

### Documentation
- `supabase/migrations/20251105000000_add_excluded_tour_types_to_discount_codes.README.md`

## Backwards Compatibility

✅ All existing discount codes continue to work (excluded_tour_types defaults to NULL)
✅ Old API calls without tourType parameter still work (parameter is optional)
✅ No breaking changes to existing functionality
