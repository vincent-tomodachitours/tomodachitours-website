-- Fix phone numbers that have a leading single quote
-- This addresses the issue where phone numbers were stored with a leading quote
-- causing them to display as &#x27;[phone_number] in email notifications

-- Update bookings table to remove leading single quotes from phone numbers
UPDATE bookings 
SET customer_phone = SUBSTRING(customer_phone FROM 2)
WHERE customer_phone LIKE '''%' 
  AND customer_phone IS NOT NULL 
  AND LENGTH(customer_phone) > 1;

-- Add a comment to document this fix
COMMENT ON COLUMN bookings.customer_phone IS 'Customer phone number for contact (fixed: removed leading quotes from existing data)';