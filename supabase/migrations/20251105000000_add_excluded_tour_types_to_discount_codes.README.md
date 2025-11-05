# Discount Code Tour Type Exclusions

This migration adds the ability to restrict discount codes from specific tour types.

## How It Works

- **`excluded_tour_types`** column added to `discount_codes` table
- If `NULL` or empty array: discount code works for **all tours** (default behavior)
- If populated: discount code is **excluded** from those specific tour types

## Examples

### Create a discount code that works for all tours
```sql
INSERT INTO discount_codes (code, type, value, excluded_tour_types)
VALUES ('SAVE10', 'percentage', 10, NULL);
-- or
VALUES ('SAVE10', 'percentage', 10, '{}');
```

### Create a discount code that works ONLY for NIGHT_TOUR
Exclude all other tours:
```sql
INSERT INTO discount_codes (code, type, value, excluded_tour_types)
VALUES ('TAMIRJAPAN', 'percentage', 15, 
  ARRAY['MORNING_TOUR', 'UJI_TOUR', 'UJI_WALKING_TOUR', 'GION_TOUR', 'MUSIC_TOUR']);
```

### Create a discount code that excludes only UJI tours
```sql
INSERT INTO discount_codes (code, type, value, excluded_tour_types)
VALUES ('KYOTOONLY', 'percentage', 20, 
  ARRAY['UJI_TOUR', 'UJI_WALKING_TOUR']);
```

### Update existing discount code to exclude tours
```sql
UPDATE discount_codes 
SET excluded_tour_types = ARRAY['UJI_TOUR', 'UJI_WALKING_TOUR']
WHERE code = 'EXISTINGCODE';
```

### Remove exclusions (make it work for all tours again)
```sql
UPDATE discount_codes 
SET excluded_tour_types = NULL
WHERE code = 'EXISTINGCODE';
```

## Available Tour Types

- `NIGHT_TOUR`
- `MORNING_TOUR`
- `UJI_TOUR`
- `UJI_WALKING_TOUR`
- `GION_TOUR`
- `MUSIC_TOUR`

## Backwards Compatibility

✅ All existing discount codes will continue to work for all tours (excluded_tour_types defaults to NULL)

✅ The validation function accepts tourType as an optional parameter for backwards compatibility

## Validation

When a customer applies a discount code, the system will:
1. Check if the code exists and is active
2. Check if the tour type is in the excluded list
3. If excluded, return error: "This discount code is not valid for the selected tour"
4. Otherwise, proceed with normal validation (dates, usage limits, etc.)

## Testing

### Test the validation function directly:

```bash
# Test with NIGHT_TOUR (should work if not excluded)
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/validate-discount' \
  --header 'Authorization: Bearer <ANON_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{"code":"TAMIRJAPAN","originalAmount":10000,"tourType":"NIGHT_TOUR"}'

# Test with MORNING_TOUR (should fail if excluded)
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/validate-discount' \
  --header 'Authorization: Bearer <ANON_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{"code":"TAMIRJAPAN","originalAmount":10000,"tourType":"MORNING_TOUR"}'
```

### Frontend Changes

The customer checkout flow now automatically passes the `tourType` parameter when validating discount codes. The tour type is derived from the `sheetId` using the `getTourTypeFromId()` utility function.
