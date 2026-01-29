-- Add fields for second button and visibility toggles
ALTER TABLE public.hero_slides
ADD COLUMN IF NOT EXISTS button_visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS button2_text text,
ADD COLUMN IF NOT EXISTS button2_link text,
ADD COLUMN IF NOT EXISTS button2_size text DEFAULT 'large',
ADD COLUMN IF NOT EXISTS button2_visible boolean DEFAULT true;