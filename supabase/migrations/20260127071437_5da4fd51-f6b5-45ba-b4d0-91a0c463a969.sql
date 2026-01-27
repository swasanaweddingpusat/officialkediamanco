-- Add capacity and dimension fields for Loading Area and Ballroom Layout
ALTER TABLE public.locations
ADD COLUMN loading_area_capacity text,
ADD COLUMN loading_area_dimensions text,
ADD COLUMN ballroom_layout_capacity text,
ADD COLUMN ballroom_layout_dimensions text;