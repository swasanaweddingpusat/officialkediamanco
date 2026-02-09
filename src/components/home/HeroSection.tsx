import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeroSlides } from '@/hooks/useCMS';
import heroImage from '@/assets/hero-gym.jpg';

export function HeroSection() {
  const { data: slides, isLoading } = useHeroSlides();
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeSlides = slides?.filter(s => s.is_active) || [];
  const totalSlides = activeSlides.length;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  const slide = activeSlides[currentSlide];

  // Show loading state or fallback only when no data available
  const currentImageUrl = slide?.image_url || (isLoading ? undefined : heroImage);

  // Size classes for title - mobile responsive
  const titleSizeClasses = {
    small: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
    medium: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
    large: 'text-4xl sm:text-5xl md:text-6xl lg:text-8xl',
    xlarge: 'text-5xl sm:text-6xl md:text-7xl lg:text-9xl',
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
  const button2Text = slide?.button2_text || 'Lihat Program';
  const button2Link = slide?.button2_link || '/classes';
  const button2Size = (slide?.button2_size as keyof typeof buttonSizeMap) || 'large';

  const currentTitleSize = (slide?.title_size as keyof typeof titleSizeClasses) || 'large';
  const currentButtonSize = (slide?.button_size as keyof typeof buttonSizeMap) || 'large';
  const currentPosition = (slide?.content_position as 'left' | 'center' | 'right') || 'left';

  // Position classes for content
  const positionClasses = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right',
  };

  // Position classes for button container
  const buttonPositionClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <section className="relative h-[100svh] min-h-[500px] overflow-hidden pt-14 sm:pt-16">
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="Hero"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* Content */}
      <div className={`relative container mx-auto px-4 sm:px-6 md:px-12 lg:px-16 h-full flex items-center ${positionClasses[currentPosition]}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className={`max-w-2xl ${currentPosition === 'center' ? 'mx-auto' : ''}`}
          >
            <h1 className={`font-serif ${titleSizeClasses[currentTitleSize]} leading-none mb-4 sm:mb-6 font-bold tracking-tight`}>
              <span className="text-primary">{slide?.title || 'VENUE IMPIAN'}</span>
              <br />
              <span className="text-foreground">{slide?.subtitle || 'UNTUK ACARA ANDA'}</span>
            </h1>
            <p className={`text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 ${currentPosition === 'center' ? 'mx-auto' : ''} max-w-lg`}>
              {slide?.description || 'Wujudkan acara impian Anda bersama venue premium kami dengan fasilitas terlengkap dan pelayanan terbaik.'}
            </p>
            <div className={`flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 ${buttonPositionClasses[currentPosition]}`}>
              {button1Visible && (
                <Button size={buttonSizeMap[currentButtonSize]} className="btn-glow group w-full sm:w-auto" asChild={!!slide?.button_link}>
                  {slide?.button_link ? (
                    <a href={slide.button_link}>
                      {slide?.button_text || 'Mulai Sekarang'}
                      <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <>
                      {slide?.button_text || 'Mulai Sekarang'}
                      <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              )}
              {button2Visible && (
                <Button size={buttonSizeMap[button2Size]} variant="outline" className="w-full sm:w-auto" asChild={!!button2Link && button2Link !== '#'}>
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
      </div>

      {/* Slide Navigation */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-background/50 backdrop-blur rounded-full hover:bg-primary transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-background/50 backdrop-blur rounded-full hover:bg-primary transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
                  index === currentSlide ? 'bg-primary w-6 sm:w-8' : 'bg-foreground/30'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
