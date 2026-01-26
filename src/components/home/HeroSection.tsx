import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeroSlides } from '@/hooks/useCMS';
import heroImage from '@/assets/hero-gym.jpg';

export function HeroSection() {
  const { data: slides } = useHeroSlides();
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeSlides = slides?.filter(s => s.is_active) || [];
  const totalSlides = activeSlides.length || 1;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  const slide = activeSlides[currentSlide];

  // Size classes for title
  const titleSizeClasses = {
    small: 'text-3xl md:text-4xl lg:text-5xl',
    medium: 'text-4xl md:text-5xl lg:text-6xl',
    large: 'text-5xl md:text-7xl lg:text-8xl',
    xlarge: 'text-6xl md:text-8xl lg:text-9xl',
  };

  // Size classes for button
  const buttonSizeMap = {
    small: 'sm' as const,
    medium: 'default' as const,
    large: 'lg' as const,
  };

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
    <section className="relative h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={slide?.image_url || heroImage}
          alt="Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* Content */}
      <div className={`relative container mx-auto px-4 h-full flex items-center ${positionClasses[currentPosition]}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className={`max-w-2xl ${currentPosition === 'center' ? 'mx-auto' : ''}`}
          >
            <h1 className={`font-display ${titleSizeClasses[currentTitleSize]} leading-none mb-6`}>
              <span className="text-gradient">{slide?.title || 'GET STRONG'}</span>
              <br />
              <span className="text-foreground">{slide?.subtitle || 'GET REWARDS'}</span>
            </h1>
            <p className={`text-lg md:text-xl text-muted-foreground mb-8 ${currentPosition === 'center' ? 'mx-auto' : ''} max-w-lg`}>
              {slide?.description || 'Transform your body and mind with state-of-the-art equipment, expert trainers, and a motivating community.'}
            </p>
            <div className={`flex flex-wrap gap-4 ${buttonPositionClasses[currentPosition]}`}>
              <Button size={buttonSizeMap[currentButtonSize]} className="btn-glow group">
                {slide?.button_text || 'Start Your Journey'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size={buttonSizeMap[currentButtonSize]} variant="outline">
                View Special Offers
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Navigation */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background/50 backdrop-blur rounded-full hover:bg-primary transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background/50 backdrop-blur rounded-full hover:bg-primary transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide ? 'bg-primary w-8' : 'bg-foreground/30'
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
