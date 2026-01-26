-- Add content position column to hero_slides
ALTER TABLE public.hero_slides 
ADD COLUMN content_position text DEFAULT 'left';

-- content_position options: left, center, right