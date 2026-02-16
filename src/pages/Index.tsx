import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { OurVenueSection } from '@/components/home/OurVenueSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CTASection } from '@/components/home/CTASection';
import { useSEO } from '@/hooks/useSEO';

const Index = () => {
  useSEO({
    title: "Kediaman Corp - The Best Choice Venue Operator",
    description: "Kediaman Corp adalah platform terpercaya untuk venue operator terbaik di Indonesia. Dapatkan akses ke kelas, pelatih profesional, lokasi premium, dan booking mudah.",
    image: "https://kediamancorp.com/og-image.png",
    url: "https://kediamancorp.com/",
    type: "website",
    includeOrganization: true,
    includeWebsite: true,
    includeLocalBusiness: true,
    breadcrumbs: [
      { name: "Home", url: "https://kediamancorp.com/" }
    ]
  });

  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <OurVenueSection />
      <TestimonialsSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
