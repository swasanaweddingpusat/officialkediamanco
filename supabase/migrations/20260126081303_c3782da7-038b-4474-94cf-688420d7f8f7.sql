-- Add youtube_link column to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN youtube_link text;