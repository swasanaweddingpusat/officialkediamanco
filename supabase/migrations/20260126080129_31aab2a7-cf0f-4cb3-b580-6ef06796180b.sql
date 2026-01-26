-- Add category column to locations table
ALTER TABLE public.locations 
ADD COLUMN category text DEFAULT 'Jakarta Selatan';

-- Add comment for documentation
COMMENT ON COLUMN public.locations.category IS 'Location category: Jakarta Selatan, Jakarta Timur, Bintaro, Bandung';