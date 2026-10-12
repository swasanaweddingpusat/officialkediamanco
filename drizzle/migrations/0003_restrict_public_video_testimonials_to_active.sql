ALTER POLICY "Video testimonials are viewable by everyone"
ON public.video_testimonials
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can view all video testimonials"
ON public.video_testimonials
FOR SELECT TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

COMMENT ON POLICY "Video testimonials are viewable by everyone" ON public.video_testimonials IS 'Public visitors may read only active testimonials; administrators retain access to inactive content.';