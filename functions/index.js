const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

console.log("🚫 All Firebase Functions are DISABLED");
console.log("✅ Migration to Supabase complete");

/*
=============================================================================
ALL FIREBASE FUNCTIONS HAVE BEEN DISABLED
=============================================================================

Migration complete! All functionality has been moved to Supabase:

❌ validateDiscountCode → ✅ Supabase Edge Function 'validate-discount'
❌ createCharge → ✅ Supabase Edge Function 'create-charge'
❌ getBookings → ✅ Supabase database queries in DatePicker.jsx
❌ createBookings → ✅ Supabase database inserts in CardForm.jsx
❌ updateBookingChargeId → ✅ Handled within Supabase Edge Functions
❌ redirectCharge → ✅ Supabase Edge Function 'redirect-charge'
❌ cancelBooking → ✅ Supabase Edge Function 'process-refund'
❌ getBookingDetails → ✅ Supabase database queries in BookingCancellation.jsx

Frontend has been updated to use Supabase exclusively.
Monitor for a few days, then Firebase can be completely deleted.

=============================================================================
*/

// Empty exports - no active functions
// All functionality has been migrated to Supabase

console.log("Firebase Functions disabled - using Supabase instead");