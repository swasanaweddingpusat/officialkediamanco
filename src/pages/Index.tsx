import { Layout } from '@/components/layout/Layout';
import { HeroWithSearch } from '@/components/home/HeroWithSearch';
import { PromoSliderSection } from '@/components/home/PromoSliderSection';
import { VenueCollectionSection } from '@/components/home/VenueCollectionSection';
import { PortfolioBentoSection } from '@/components/home/PortfolioBentoSection';
import { JournalSection } from '@/components/home/JournalSection';
import { BookingGuideSection } from '@/components/home/BookingGuideSection';
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
      <HeroWithSearch />
      <PromoSliderSection />
      <VenueCollectionSection />
      <PortfolioBentoSection />
      <JournalSection />
      <TestimonialsSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
