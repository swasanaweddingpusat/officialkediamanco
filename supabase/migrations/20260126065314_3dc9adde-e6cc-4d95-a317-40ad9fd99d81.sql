-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create site_settings table for general settings
CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name TEXT NOT NULL DEFAULT 'FTL Gym',
    tagline TEXT DEFAULT 'Get Strong Get Rewards',
    phone TEXT,
    email TEXT,
    address TEXT,
    whatsapp_link TEXT,
    instagram_link TEXT,
    facebook_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create hero_slides table
CREATE TABLE public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    button_text TEXT,
    button_link TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hero slides"
ON public.hero_slides
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage hero slides"
ON public.hero_slides
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create features table (Why FTL section)
CREATE TABLE public.features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active features"
ON public.features
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage features"
ON public.features
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create programs table (Classes/Programs)
CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active programs"
ON public.programs
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage programs"
ON public.programs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trainers table
CREATE TABLE public.trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT,
    bio TEXT,
    photo_url TEXT,
    instagram TEXT,
    certifications TEXT[],
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active trainers"
ON public.trainers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage trainers"
ON public.trainers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create locations table
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    google_maps_url TEXT,
    image_url TEXT,
    facilities TEXT[],
    operating_hours JSONB,
    is_coming_soon BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active locations"
ON public.locations
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage locations"
ON public.locations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create testimonials table
CREATE TABLE public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT,
    content TEXT NOT NULL,
    photo_url TEXT,
    rating INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active testimonials"
ON public.testimonials
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default site settings
INSERT INTO public.site_settings (site_name, tagline, phone, email, address)
VALUES ('POWER GYM', 'Get Strong Get Rewards', '+62 21 1234 5678', 'info@powergym.com', 'Jakarta, Indonesia');

-- Insert sample hero slides
INSERT INTO public.hero_slides (title, subtitle, sort_order) VALUES
('GET STRONG GET REWARDS', 'Transform your body, transform your life', 1),
('ALL-IN GYM EXPERIENCE', 'Everything you need in one place', 2),
('VARIETY GROUP EXERCISE CLASSES', 'From Pilates to HIIT, we have it all', 3);

-- Insert sample features
INSERT INTO public.features (title, description, icon, sort_order) VALUES
('Modern Equipment', 'State-of-the-art fitness equipment from top brands', 'Dumbbell', 1),
('Expert Trainers', 'Certified personal trainers to guide your journey', 'Users', 2),
('Flexible Hours', 'Open 24/7 to fit your schedule', 'Clock', 3),
('Group Classes', 'Fun and motivating group exercise sessions', 'Users', 4);

-- Insert sample programs
INSERT INTO public.programs (name, description, category, sort_order) VALUES
('Reformer Pilates', 'Build core strength and flexibility with our reformer pilates classes', 'Pilates', 1),
('HIIT Training', 'High-intensity interval training for maximum calorie burn', 'Cardio', 2),
('Weight Training', 'Build muscle and strength with guided weight training', 'Strength', 3),
('Yoga', 'Find balance and peace with our yoga sessions', 'Mind & Body', 4),
('Zumba', 'Dance your way to fitness with high-energy Zumba', 'Dance', 5),
('Boxing', 'Learn boxing techniques while getting a full-body workout', 'Combat', 6);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON public.trainers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();