import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { CTASection } from '@/components/home/CTASection';
import { LocationsSection } from '@/components/landing/LocationsSection';
import { PortfolioSection } from '@/components/landing/PortfolioSection';
import { BlogSection } from '@/components/landing/BlogSection';
import { SpecialOffersSection } from '@/components/landing/SpecialOffersSection';
import { useSiteSettings } from '@/hooks/useCMS';

const LandingPage = () => {
  const { data: siteSettings } = useSiteSettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header with Logo Only */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-16">
            {siteSettings?.logo_url ? (
              <img 
                src={siteSettings.logo_url} 
                alt={siteSettings.site_name || 'Logo'} 
                className="h-10 w-auto object-contain"
              />
            ) : (
              <span className="font-display text-2xl tracking-wider">
                {siteSettings?.site_name || 'KEDIAMAN'}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - All Sections */}
      <main>
        {/* 1. Hero Section */}
        <HeroSection />
        
        {/* 2. Features/Why Us Section */}
        <FeaturesSection />
        
        {/* 3. Locations Section */}
        <LocationsSection />
        
        {/* 4. Portfolio Section */}
        <PortfolioSection />
        
        {/* 5. Special Offers Section */}
        <SpecialOffersSection />
        
        {/* 6. Blog Section */}
        <BlogSection />
        
        {/* 7. CTA Section */}
        <CTASection />
      </main>

      {/* Simple Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          {siteSettings?.logo_url && (
            <img 
              src={siteSettings.logo_url} 
              alt={siteSettings.site_name || 'Logo'} 
              className="h-12 w-auto object-contain mx-auto mb-4"
            />
          )}
          <p className="text-foreground font-display text-xl mb-2">
            {siteSettings?.site_name || 'Kediaman'}
          </p>
          {siteSettings?.tagline && (
            <p className="text-muted-foreground text-sm mb-4">
              {siteSettings.tagline}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-6">
            {siteSettings?.phone && (
              <a href={`tel:${siteSettings.phone}`} className="hover:text-primary transition-colors">
                {siteSettings.phone}
              </a>
            )}
            {siteSettings?.email && (
              <a href={`mailto:${siteSettings.email}`} className="hover:text-primary transition-colors">
                {siteSettings.email}
              </a>
            )}
          </div>
          {siteSettings?.address && (
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              {siteSettings.address}
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} {siteSettings?.site_name || 'Kediaman'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
