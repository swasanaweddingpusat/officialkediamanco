
-- Venue sessions per location (pagi/siang/malam dgn harga berbeda)
CREATE TABLE public.venue_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  price numeric(14,2) NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.venue_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venue_sessions TO authenticated;
GRANT ALL ON public.venue_sessions TO service_role;

ALTER TABLE public.venue_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sessions"
  ON public.venue_sessions FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage venue_sessions"
  ON public.venue_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_venue_sessions_updated_at
  BEFORE UPDATE ON public.venue_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_venue_sessions_location ON public.venue_sessions(location_id);

-- DP percentage per lokasi
ALTER TABLE public.locations
  ADD COLUMN dp_percentage int NOT NULL DEFAULT 30;

-- Extend ballroom_bookings
ALTER TABLE public.ballroom_bookings
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN session_id uuid REFERENCES public.venue_sessions(id) ON DELETE SET NULL,
  ADD COLUMN total_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN payment_type text NOT NULL DEFAULT 'full',
  ADD COLUMN payment_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN midtrans_order_id text UNIQUE,
  ADD COLUMN midtrans_snap_token text,
  ADD COLUMN midtrans_transaction_id text,
  ADD COLUMN payment_method text,
  ADD COLUMN paid_at timestamptz;

ALTER TABLE public.ballroom_bookings
  ADD CONSTRAINT ballroom_bookings_payment_type_check
    CHECK (payment_type IN ('dp','full'));

ALTER TABLE public.ballroom_bookings
  ADD CONSTRAINT ballroom_bookings_payment_status_check
    CHECK (payment_status IN ('pending','paid','failed','expired','refunded','cancelled'));

-- Refresh status check to include 'paid' & 'completed'
ALTER TABLE public.ballroom_bookings
  DROP CONSTRAINT IF EXISTS ballroom_bookings_status_check;
ALTER TABLE public.ballroom_bookings
  ADD CONSTRAINT ballroom_bookings_status_check
    CHECK (status IN ('pending','awaiting_payment','paid','approved','rejected','cancelled','completed'));

CREATE INDEX idx_ballroom_bookings_user ON public.ballroom_bookings(user_id);
CREATE INDEX idx_ballroom_bookings_session_date ON public.ballroom_bookings(session_id, booking_date);

-- RLS: users see own bookings, can insert own
GRANT SELECT, INSERT, UPDATE ON public.ballroom_bookings TO authenticated;

DROP POLICY IF EXISTS "Anyone can submit booking requests" ON public.ballroom_bookings;

CREATE POLICY "Users view own bookings"
  ON public.ballroom_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users create own bookings"
  ON public.ballroom_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pending bookings"
  ON public.ballroom_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND payment_status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Prevent double booking same session+date (only for non-cancelled/failed)
CREATE UNIQUE INDEX uq_booking_session_date_active
  ON public.ballroom_bookings(session_id, booking_date)
  WHERE payment_status IN ('pending','paid') AND status NOT IN ('cancelled','rejected');
