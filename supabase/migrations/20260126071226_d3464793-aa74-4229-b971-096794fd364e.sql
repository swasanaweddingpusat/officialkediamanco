-- Add logo_url column to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN logo_url text;