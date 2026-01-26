-- Add auth_background_url column to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS auth_background_url TEXT;