-- Create video_testimonials table
CREATE TABLE public.video_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Video testimonials are viewable by everyone" 
ON public.video_testimonials 
FOR SELECT 
USING (true);

-- Create policies for admin access
CREATE POLICY "Admins can insert video testimonials" 
ON public.video_testimonials 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update video testimonials" 
ON public.video_testimonials 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete video testimonials" 
ON public.video_testimonials 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_testimonials_updated_at
BEFORE UPDATE ON public.video_testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();