-- Add location_id foreign key to trainers table for venue/location association
ALTER TABLE public.trainers 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trainers_location_id ON public.trainers(location_id);