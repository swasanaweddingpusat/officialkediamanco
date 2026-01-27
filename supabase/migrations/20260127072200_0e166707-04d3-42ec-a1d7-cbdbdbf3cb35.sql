-- Create ballroom bookings table
CREATE TABLE public.ballroom_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  
  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  
  -- Event details
  event_name TEXT NOT NULL,
  event_type TEXT,
  guest_count INTEGER,
  
  -- Additional info
  notes TEXT,
  
  -- Status management
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ballroom_bookings ENABLE ROW LEVEL SECURITY;

-- Public can submit bookings (insert only)
CREATE POLICY "Anyone can submit booking requests"
ON public.ballroom_bookings
FOR INSERT
WITH CHECK (true);

-- Public can view their own bookings by email (for confirmation page)
CREATE POLICY "Anyone can view bookings by email"
ON public.ballroom_bookings
FOR SELECT
USING (true);

-- Admins can manage all bookings
CREATE POLICY "Admins can manage bookings"
ON public.ballroom_bookings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ballroom_bookings_updated_at
BEFORE UPDATE ON public.ballroom_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for faster lookups
CREATE INDEX idx_ballroom_bookings_location_date 
ON public.ballroom_bookings(location_id, booking_date);

CREATE INDEX idx_ballroom_bookings_status 
ON public.ballroom_bookings(status);