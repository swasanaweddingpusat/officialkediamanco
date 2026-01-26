-- Create storage bucket for gym images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gym-images', 
  'gym-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow anyone to view images (public bucket)
CREATE POLICY "Anyone can view gym images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gym-images');

-- Allow authenticated admins to upload images
CREATE POLICY "Admins can upload gym images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gym-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated admins to update images
CREATE POLICY "Admins can update gym images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gym-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated admins to delete images
CREATE POLICY "Admins can delete gym images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gym-images' 
  AND public.has_role(auth.uid(), 'admin')
);