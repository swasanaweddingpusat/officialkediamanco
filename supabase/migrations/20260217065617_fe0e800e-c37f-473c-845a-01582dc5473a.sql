
-- Create flexible sections table for About Us page builder
CREATE TABLE public.about_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL DEFAULT 'text',
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  styling JSONB NOT NULL DEFAULT '{"bg_color": "default", "padding": "normal", "text_align": "left"}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.about_sections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view visible about sections"
ON public.about_sections FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins can manage about sections"
ON public.about_sections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_about_sections_updated_at
BEFORE UPDATE ON public.about_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with default sections matching current About page
INSERT INTO public.about_sections (section_type, title, sort_order, content, styling) VALUES
('hero', 'Hero Section', 0, '{"subtitle": "Tentang Kami", "title": "Mewujudkan Momen Tak Terlupakan", "description": "Hadir sebagai mitra terpercaya dalam menciptakan pengalaman istimewa melalui venue premium dan layanan event profesional."}', '{"bg_color": "default", "padding": "large", "text_align": "center"}'),
('text_columns', 'Visi & Misi', 1, '{"left_label": "Visi", "left_title": "Menjadi Destinasi Venue & Event Terdepan", "left_description": "Kami bercita-cita menjadi pilihan utama dalam penyediaan venue premium dan penyelenggaraan event berkualitas tinggi.", "right_label": "Misi", "right_items": ["Menyediakan fasilitas venue dengan standar kualitas tertinggi", "Memberikan pelayanan personal dan profesional kepada setiap klien", "Terus berinovasi dalam menghadirkan konsep event yang unik dan berkesan", "Membangun hubungan jangka panjang berbasis kepercayaan dan kepuasan"]}', '{"bg_color": "default", "padding": "normal", "text_align": "left"}'),
('values', 'Nilai-Nilai', 2, '{"heading_script": "Mengapa Memilih Kami", "heading": "Nilai Yang Kami Junjung", "items": [{"icon": "Heart", "title": "Dedikasi Penuh", "description": "Kami berkomitmen memberikan pelayanan terbaik dengan sepenuh hati untuk setiap klien."}, {"icon": "Star", "title": "Kualitas Premium", "description": "Standar tertinggi dalam setiap detail, dari fasilitas hingga layanan yang kami tawarkan."}, {"icon": "Users", "title": "Tim Profesional", "description": "Didukung oleh tim berpengalaman yang ahli di bidangnya masing-masing."}, {"icon": "Award", "title": "Kepercayaan", "description": "Dipercaya oleh ratusan klien untuk momen-momen penting dalam hidup mereka."}]}', '{"bg_color": "card", "padding": "normal", "text_align": "center"}'),
('stats', 'Statistik', 3, '{"items": [{"number": "500+", "label": "Event Sukses"}, {"number": "100%", "label": "Kepuasan Klien"}], "show_dynamic": true}', '{"bg_color": "default", "padding": "normal", "text_align": "center"}'),
('cta', 'Call to Action', 4, '{"subtitle": "Mari Berkolaborasi", "title": "Siap Mewujudkan Event Impian Anda?", "description": "Hubungi kami untuk konsultasi gratis dan temukan venue sempurna untuk momen spesial Anda.", "button_text": "Lihat Venue Kami", "button_link": "/locations", "show_whatsapp": true}', '{"bg_color": "card", "padding": "large", "text_align": "center"}');
