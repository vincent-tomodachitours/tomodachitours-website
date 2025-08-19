-- ==============================================
-- UPDATE ADMIN EMAILS FOR DISCOUNT CODES
-- ==============================================
-- This script updates the RLS policy to use the correct admin emails

-- Drop the existing admin policy
DROP POLICY IF EXISTS "Only allow admins to modify discount codes" ON public.discount_codes;

-- Create new policy with correct admin emails
CREATE POLICY "Only allow admins to modify discount codes"
ON public.discount_codes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email IN (
      'contact@tomodachitours.com',
      'spirivincent03@gmail.com'
    )
  )
);

-- Verify the policy was updated (this will show the new policy)
-- SELECT 
--   pol.polname as policy_name,
--   pol.polqual as policy_condition
-- FROM pg_policy pol
-- JOIN pg_class cls ON pol.polrelid = cls.oid
-- WHERE cls.relname = 'discount_codes'
-- AND pol.polname = 'Only allow admins to modify discount codes';

COMMIT; 