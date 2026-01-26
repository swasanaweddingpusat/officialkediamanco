-- Add size customization columns to hero_slides
ALTER TABLE public.hero_slides 
ADD COLUMN title_size text DEFAULT 'large',
ADD COLUMN button_size text DEFAULT 'large',
ADD COLUMN description text;

-- title_size options: small, medium, large, xlarge
-- button_size options: small, medium, large