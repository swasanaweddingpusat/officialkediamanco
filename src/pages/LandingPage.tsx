import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { ProgramsSection } from '@/components/home/ProgramsSection';
import { CTASection } from '@/components/home/CTASection';
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

      {/* Main Content */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <ProgramsSection />
        <CTASection />
      </main>

      {/* Simple Footer */}
      <footer className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {siteSettings?.site_name || 'Kediaman'}. All rights reserved.
          </p>
          {siteSettings?.phone && (
            <p className="text-muted-foreground text-sm mt-2">
              Contact: {siteSettings.phone}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
