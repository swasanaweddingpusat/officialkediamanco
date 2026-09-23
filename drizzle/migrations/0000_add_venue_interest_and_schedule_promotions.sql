ALTER TABLE public.ballroom_schedules
  ADD COLUMN IF NOT EXISTS promo_type TEXT CHECK (promo_type IS NULL OR promo_type IN ('special_offer', 'limited_offer')),
  ADD COLUMN IF NOT EXISTS promo_label TEXT,
  ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE public.venue_interest_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('venue_view', 'date_click', 'booking_request')),
  schedule_date DATE,
  visitor_key UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.venue_interest_events TO service_role;
ALTER TABLE public.venue_interest_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX venue_interest_events_lookup_idx
  ON public.venue_interest_events(location_id, created_at DESC, schedule_date, event_type);

CREATE UNIQUE INDEX venue_interest_events_daily_dedupe_idx
  ON public.venue_interest_events(
    location_id,
    event_type,
    visitor_key,
    COALESCE(schedule_date, DATE '1970-01-01'),
    ((created_at AT TIME ZONE 'UTC')::date)
  );

CREATE OR REPLACE FUNCTION public.track_venue_interest(
  _location_id UUID,
  _event_type TEXT,
  _visitor_key UUID,
  _schedule_date DATE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _event_type NOT IN ('venue_view', 'date_click', 'booking_request') THEN
    RAISE EXCEPTION 'Invalid interest event type';
  END IF;

  IF _event_type IN ('date_click', 'booking_request') AND _schedule_date IS NULL THEN
    RAISE EXCEPTION 'Schedule date is required for this event type';
  END IF;

  INSERT INTO public.venue_interest_events(location_id, event_type, schedule_date, visitor_key)
  VALUES (_location_id, _event_type, _schedule_date, _visitor_key)
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.track_venue_interest(UUID, TEXT, UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_venue_interest(UUID, TEXT, UUID, DATE) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_venue_interest(_location_id UUID DEFAULT NULL)
RETURNS TABLE (
  location_id UUID,
  schedule_date DATE,
  view_count BIGINT,
  date_click_count BIGINT,
  booking_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH recent AS (
    SELECT e.location_id, e.schedule_date, e.event_type
    FROM public.venue_interest_events e
    WHERE e.created_at >= now() - interval '7 days'
      AND (_location_id IS NULL OR e.location_id = _location_id)
  ), venue_views AS (
    SELECT r.location_id, count(*) FILTER (WHERE r.event_type = 'venue_view') AS view_count
    FROM recent r
    GROUP BY r.location_id
  ), date_activity AS (
    SELECT
      r.location_id,
      r.schedule_date,
      count(*) FILTER (WHERE r.event_type = 'date_click') AS date_click_count,
      count(*) FILTER (WHERE r.event_type = 'booking_request') AS booking_count
    FROM recent r
    WHERE r.schedule_date IS NOT NULL
    GROUP BY r.location_id, r.schedule_date
  )
  SELECT
    COALESCE(d.location_id, v.location_id),
    d.schedule_date,
    COALESCE(v.view_count, 0),
    COALESCE(d.date_click_count, 0),
    COALESCE(d.booking_count, 0)
  FROM venue_views v
  FULL JOIN date_activity d ON d.location_id = v.location_id;
$$;

REVOKE ALL ON FUNCTION public.get_venue_interest(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_venue_interest(UUID) TO anon, authenticated;
