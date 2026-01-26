import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { ProgramsSection } from '@/components/home/ProgramsSection';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <ProgramsSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
