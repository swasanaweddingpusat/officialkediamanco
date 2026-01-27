-- Create ballroom schedules table for availability management
CREATE TABLE public.ballroom_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  event_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(location_id, schedule_date)
);

-- Enable Row Level Security
ALTER TABLE public.ballroom_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view ballroom schedules"
ON public.ballroom_schedules
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage ballroom schedules"
ON public.ballroom_schedules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ballroom_schedules_updated_at
BEFORE UPDATE ON public.ballroom_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_ballroom_schedules_location_date 
ON public.ballroom_schedules(location_id, schedule_date);