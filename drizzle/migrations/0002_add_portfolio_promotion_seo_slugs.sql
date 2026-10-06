ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS slug text;
WITH names AS (
 SELECT id, coalesce(nullif(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'portfolio') AS base FROM public.trainers
), numbered AS (
 SELECT id, base, row_number() OVER (PARTITION BY base ORDER BY id) AS n FROM names
)
UPDATE public.trainers t SET slug = numbered.base || CASE WHEN numbered.n > 1 THEN '-' || numbered.n::text ELSE '' END FROM numbered WHERE t.id = numbered.id AND t.slug IS NULL;
WITH names AS (
 SELECT id, coalesce(nullif(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'promosi') AS base FROM public.programs
), numbered AS (
 SELECT id, base, row_number() OVER (PARTITION BY base ORDER BY id) AS n FROM names
)
UPDATE public.programs p SET slug = numbered.base || CASE WHEN numbered.n > 1 THEN '-' || numbered.n::text ELSE '' END FROM numbered WHERE p.id = numbered.id AND p.slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS trainers_slug_unique ON public.trainers(slug);
CREATE UNIQUE INDEX IF NOT EXISTS programs_slug_unique ON public.programs(slug);
ALTER TABLE public.trainers ADD CONSTRAINT trainers_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE public.programs ADD CONSTRAINT programs_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
CREATE OR REPLACE FUNCTION public.assign_content_slug() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text; suffix integer := 1; occupied boolean;
BEGIN
 IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL THEN NEW.slug := OLD.slug; RETURN NEW; END IF;
 base := coalesce(nullif(trim(both '-' from regexp_replace(lower(NEW.name), '[^a-z0-9]+', '-', 'g')), ''), CASE WHEN TG_TABLE_NAME = 'trainers' THEN 'portfolio' ELSE 'promosi' END);
 PERFORM pg_advisory_xact_lock(hashtextextended(TG_TABLE_NAME || ':' || base, 0));
 candidate := base;
 LOOP
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE slug = $1 AND id <> $2)', TG_TABLE_NAME) INTO occupied USING candidate, NEW.id;
  EXIT WHEN NOT occupied;
  suffix := suffix + 1; candidate := base || '-' || suffix::text;
 END LOOP;
 NEW.slug := candidate;
 RETURN NEW;
END;
$$;
CREATE TRIGGER assign_portfolio_slug_before_write BEFORE INSERT OR UPDATE ON public.trainers FOR EACH ROW EXECUTE FUNCTION public.assign_content_slug();
CREATE TRIGGER assign_promotion_slug_before_write BEFORE INSERT OR UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.assign_content_slug();