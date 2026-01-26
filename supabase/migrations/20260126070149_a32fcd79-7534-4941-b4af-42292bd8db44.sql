-- Fix RLS policies to be PERMISSIVE instead of RESTRICTIVE for public access

-- Drop and recreate features policies
DROP POLICY IF EXISTS "Anyone can view active features" ON public.features;
CREATE POLICY "Anyone can view active features" 
ON public.features 
FOR SELECT 
TO public
USING (is_active = true);

-- Drop and recreate hero_slides policies
DROP POLICY IF EXISTS "Anyone can view active hero slides" ON public.hero_slides;
CREATE POLICY "Anyone can view active hero slides" 
ON public.hero_slides 
FOR SELECT 
TO public
USING (is_active = true);

-- Drop and recreate programs policies
DROP POLICY IF EXISTS "Anyone can view active programs" ON public.programs;
CREATE POLICY "Anyone can view active programs" 
ON public.programs 
FOR SELECT 
TO public
USING (is_active = true);

-- Drop and recreate trainers policies
DROP POLICY IF EXISTS "Anyone can view active trainers" ON public.trainers;
CREATE POLICY "Anyone can view active trainers" 
ON public.trainers 
FOR SELECT 
TO public
USING (is_active = true);

-- Drop and recreate locations policies
DROP POLICY IF EXISTS "Anyone can view active locations" ON public.locations;
CREATE POLICY "Anyone can view active locations" 
ON public.locations 
FOR SELECT 
TO public
USING (is_active = true);

-- Drop and recreate testimonials policies
DROP POLICY IF EXISTS "Anyone can view active testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view active testimonials" 
ON public.testimonials 
FOR SELECT 
TO public
USING (is_active = true);

-- Drop and recreate site_settings policies
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
TO public
USING (true);