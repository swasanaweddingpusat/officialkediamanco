ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS slug text;
WITH names AS (SELECT id, coalesce(nullif(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'venue') AS base, row_number() OVER (PARTITION BY coalesce(nullif(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'venue') ORDER BY created_at, id) AS n FROM public.locations)
UPDATE public.locations l SET slug = names.base || CASE WHEN names.n > 1 THEN '-' || replace(l.id::text, '-', '') ELSE '' END FROM names WHERE l.id = names.id AND l.slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS locations_slug_unique ON public.locations(slug);
ALTER TABLE public.locations ADD CONSTRAINT locations_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
CREATE OR REPLACE FUNCTION public.assign_venue_slug() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text;
BEGIN
 IF NEW.slug IS NULL OR NEW.slug = '' THEN
  base := coalesce(nullif(trim(both '-' from regexp_replace(lower(NEW.name), '[^a-z0-9]+', '-', 'g')), ''), 'venue');
  PERFORM pg_advisory_xact_lock(hashtextextended(base, 0));
  NEW.slug := base;
  IF EXISTS (SELECT 1 FROM public.locations WHERE slug = NEW.slug AND id <> NEW.id) THEN
   NEW.slug := base || '-' || replace(NEW.id::text, '-', '');
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER assign_venue_slug_before_write BEFORE INSERT OR UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.assign_venue_slug();