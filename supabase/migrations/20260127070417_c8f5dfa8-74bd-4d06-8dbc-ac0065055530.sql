-- Add Loading Area and Ballroom Layout fields to locations table
ALTER TABLE public.locations 
ADD COLUMN loading_area_images text[] DEFAULT '{}'::text[],
ADD COLUMN loading_area_description text,
ADD COLUMN ballroom_layout_images text[] DEFAULT '{}'::text[],
ADD COLUMN ballroom_layout_description text;