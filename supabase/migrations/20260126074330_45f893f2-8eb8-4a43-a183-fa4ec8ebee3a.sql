-- Add images array column to locations table
ALTER TABLE public.locations ADD COLUMN images text[] DEFAULT '{}';

-- Migrate existing image_url to images array if exists
UPDATE public.locations 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '';