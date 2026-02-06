import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeroSlides } from '@/hooks/useCMS';
import heroImage from '@/assets/hero-gym.jpg';
import pilatesImage from '@/assets/pilates-class.jpg';
import hiitImage from '@/assets/hiit-class.jpg';
import gymInterior from '@/assets/gym-interior.jpg';

const galleryImages = [heroImage, pilatesImage, hiitImage, gymInterior];

export function HeroSection() {
  const { data: slides, isLoading } = useHeroSlides();
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeSlides = slides?.filter(s => s.is_active) || [];
  const totalSlides = activeSlides.length;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  const slide = activeSlides[currentSlide];
  const currentImageUrl = slide?.image_url || (isLoading ? undefined : heroImage);

  // Size classes for title - mobile responsive
  const titleSizeClasses = {
    small: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
    medium: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl',
    large: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl',
    xlarge: 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl',
  };

  // Size classes for button
  const buttonSizeMap: Record<string, 'sm' | 'default' | 'lg'> = {
    small: 'sm',
    medium: 'default',
    large: 'lg',
  };

  // Button visibility and settings
  const button1Visible = slide?.button_visible ?? true;
  const button2Visible = slide?.button2_visible ?? true;
  const button2Text = slide?.button2_text || 'Jelajahi';
  const button2Link = slide?.button2_link || '/locations';
  const button2Size = (slide?.button2_size as keyof typeof buttonSizeMap) || 'large';

  const currentTitleSize = (slide?.title_size as keyof typeof titleSizeClasses) || 'large';
  const currentButtonSize = (slide?.button_size as keyof typeof buttonSizeMap) || 'large';

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-background">
      {/* Tilted Gallery Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 transform rotate-[-8deg] scale-[1.3] origin-center opacity-60">
          {galleryImages.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.8 }}
              className="relative aspect-[3/4] overflow-hidden rounded-lg"
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-background/40" />
            </motion.div>
          ))}
          {galleryImages.map((img, index) => (
            <motion.div
              key={`second-${index}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 4) * 0.15, duration: 0.8 }}
              className="relative aspect-[3/4] overflow-hidden rounded-lg"
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-background/40" />
            </motion.div>
          ))}
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/80" />
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-4 sm:px-6 md:px-12 lg:px-16 min-h-[100svh] flex flex-col justify-end pb-20 pt-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-4xl"
          >
            {/* Script accent text */}
            <motion.p
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-script text-3xl sm:text-4xl md:text-5xl text-primary mb-4"
            >
              {slide?.description?.split(' ').slice(0, 3).join(' ') || 'Tempat Istimewa'}
            </motion.p>

            {/* Main headline */}
            <h1 className={`font-display ${titleSizeClasses[currentTitleSize]} leading-[0.9] tracking-wide mb-6`}>
              <span className="block text-foreground">{slide?.title || 'Splendor'}</span>
              <span className="block text-gradient italic">{slide?.subtitle || 'of Renewal'}</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-xl mb-10 leading-relaxed font-light">
              {slide?.description || 'Wujudkan acara impian Anda bersama venue premium kami dengan fasilitas terlengkap dan pelayanan terbaik.'}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {button1Visible && (
                <Button 
                  size={buttonSizeMap[currentButtonSize]} 
                  className="btn-glow group px-8 py-6 text-lg font-medium tracking-wide" 
                  asChild={!!slide?.button_link}
                >
                  {slide?.button_link ? (
                    <a href={slide.button_link}>
                      {slide?.button_text || 'Hubungi Kami'}
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <>
                      {slide?.button_text || 'Hubungi Kami'}
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              )}
              {button2Visible && (
                <Button 
                  size={buttonSizeMap[button2Size]} 
                  variant="outline" 
                  className="px-8 py-6 text-lg font-medium tracking-wide border-primary/30 hover:bg-primary/10 hover:border-primary"
                  asChild={!!button2Link && button2Link !== '#'}
                >
                  {button2Link && button2Link !== '#' ? (
                    <a href={button2Link}>{button2Text}</a>
                  ) : (
                    <>{button2Text}</>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Navigation */}
        {totalSlides > 1 && (
          <div className="absolute bottom-8 right-8 flex items-center gap-4">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
              className="p-3 border border-primary/30 rounded-full hover:bg-primary/10 hover:border-primary transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl font-display">{String(currentSlide + 1).padStart(2, '0')}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{String(totalSlides).padStart(2, '0')}</span>
            </div>
            
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)}
              className="p-3 border border-primary/30 rounded-full hover:bg-primary/10 hover:border-primary transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 right-8 hidden lg:block">
        <motion.div
          initial={{ opacity: 0, rotate: -45 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="w-px h-32 bg-gradient-to-b from-transparent via-primary/50 to-transparent"
        />
      </div>
    </section>
  );
}
