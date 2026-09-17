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
    description: "Kediaman Corp menghadirkan venue premium untuk pernikahan dan acara di Indonesia, lengkap dengan informasi fasilitas, jadwal, serta pemesanan mudah.",
    url: "https://official.kediaman.co/",
    type: "website",
    includeOrganization: true,
    includeWebsite: true,
    includeLocalBusiness: true,
    breadcrumbs: [
      { name: "Home", url: "https://official.kediaman.co/" }
    ]
  });

  return (
    <Layout>
      <HeroWithSearch />
      <PromoSliderSection />
      <VenueCollectionSection />
      <BookingGuideSection />
      <PortfolioBentoSection />
      <JournalSection />
      <TestimonialsSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
