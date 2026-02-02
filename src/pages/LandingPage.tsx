import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { CTASection } from '@/components/home/CTASection';
import { FullLocationsSection } from '@/components/landing/FullLocationsSection';
import { PortfolioSection } from '@/components/landing/PortfolioSection';
import { BlogSection } from '@/components/landing/BlogSection';
import { SpecialOffersSection } from '@/components/landing/SpecialOffersSection';
import { VideoTestimonialsSection } from '@/components/landing/VideoTestimonialsSection';
import { useSiteSettings } from '@/hooks/useCMS';

const LandingPage = () => {
  const { data: siteSettings } = useSiteSettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header with Logo Only */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-center h-14 sm:h-16">
            {siteSettings?.logo_url ? (
              <img 
                src={siteSettings.logo_url} 
                alt={siteSettings.site_name || 'Logo'} 
                className="h-8 sm:h-10 w-auto object-contain"
              />
            ) : (
              <span className="font-display text-xl sm:text-2xl tracking-wider">
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
        
        {/* 3. Full Locations Section with Navigation */}
        <FullLocationsSection />
        
        {/* 4. Portfolio Section */}
        <PortfolioSection />
        
        {/* 5. Special Offers Section */}
        <SpecialOffersSection />

        {/* 6. Video Testimonials Section */}
        <VideoTestimonialsSection />
        
        {/* 7. Blog Section */}
        <BlogSection />
        
        {/* 8. CTA Section */}
        <CTASection />
      </main>

      {/* Simple Footer */}
      <footer className="py-8 sm:py-12 bg-card border-t border-border">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          {siteSettings?.logo_url && (
            <img 
              src={siteSettings.logo_url} 
              alt={siteSettings.site_name || 'Logo'} 
              className="h-10 sm:h-12 w-auto object-contain mx-auto mb-3 sm:mb-4"
            />
          )}
          <p className="text-foreground font-display text-lg sm:text-xl mb-2">
            {siteSettings?.site_name || 'Kediaman'}
          </p>
          {siteSettings?.tagline && (
            <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
              {siteSettings.tagline}
            </p>
          )}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
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
            <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6 max-w-md mx-auto px-4">
              {siteSettings.address}
            </p>
          )}
          <p className="text-muted-foreground text-[10px] sm:text-xs">
            © {new Date().getFullYear()} {siteSettings?.site_name || 'Kediaman'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
