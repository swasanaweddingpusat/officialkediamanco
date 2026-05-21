
-- 1) Restrict ballroom_bookings SELECT (drop public policy)
DROP POLICY IF EXISTS "Anyone can view bookings by email" ON public.ballroom_bookings;

-- Admins already have ALL via existing policy. Add explicit SELECT for own auth user (future-proof) - optional skip.

-- 2) Allow admins to SELECT profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
