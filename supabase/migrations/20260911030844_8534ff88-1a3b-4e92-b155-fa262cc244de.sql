GRANT INSERT ON public.ballroom_bookings TO anon;

DROP POLICY IF EXISTS "Authenticated users create own bookings" ON public.ballroom_bookings;
DROP POLICY IF EXISTS "Anyone can submit booking requests" ON public.ballroom_bookings;

CREATE POLICY "Public can submit booking requests"
  ON public.ballroom_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());