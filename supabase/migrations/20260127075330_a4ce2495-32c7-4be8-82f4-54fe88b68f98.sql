-- Add images array column for gallery support in portfolio
ALTER TABLE public.trainers 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[];