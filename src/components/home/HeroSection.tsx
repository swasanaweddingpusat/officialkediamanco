import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';
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
    }, 6000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  const slide = activeSlides[currentSlide];
  const currentImageUrl = slide?.image_url || (isLoading ? undefined : heroImage);

  const button1Visible = slide?.button_visible ?? true;
  const button2Visible = slide?.button2_visible ?? true;

  return (
    <section className="relative h-[100svh] min-h-[600px] overflow-hidden -mt-16 lg:-mt-20">
      {/* Background Image with Ken Burns */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Hero"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 bg-background/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-20 lg:pb-28">
        <div className="container mx-auto px-6 lg:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl"
            >
              {/* Subtitle tag */}
              {slide?.subtitle && (
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-primary text-[11px] tracking-[0.3em] uppercase mb-6 flex items-center gap-3"
                >
                  <span className="w-8 h-px bg-primary" />
                  {slide.subtitle}
                </motion.p>
              )}

              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] leading-[0.95] font-bold tracking-tight mb-8">
                <span className="text-foreground">{slide?.title || 'Venue Impian'}</span>
              </h1>

              <p className="text-base lg:text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
                {slide?.description || 'Wujudkan acara impian Anda bersama venue premium kami dengan fasilitas terlengkap dan pelayanan terbaik.'}
              </p>

              <div className="flex flex-wrap gap-4">
                {button1Visible && (
                  <Button
                    size="lg"
                    className="group rounded-full px-8 text-sm tracking-[0.05em] uppercase"
                    asChild={!!slide?.button_link}
                  >
                    {slide?.button_link ? (
                      <a href={slide.button_link}>
                        {slide?.button_text || 'Mulai Sekarang'}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    ) : (
                      <>
                        {slide?.button_text || 'Mulai Sekarang'}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                )}
                {button2Visible && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 text-sm tracking-[0.05em] uppercase border-foreground/20 hover:border-primary"
                    asChild={!!(slide?.button2_link && slide.button2_link !== '#')}
                  >
                    {slide?.button2_link && slide.button2_link !== '#' ? (
                      <a href={slide.button2_link}>{slide?.button2_text || 'Lihat Program'}</a>
                    ) : (
                      <>{slide?.button2_text || 'Lihat Program'}</>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slide dots + scroll indicator */}
          <div className="flex items-center justify-between mt-12">
            {totalSlides > 1 ? (
              <div className="flex gap-2">
                {activeSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-px transition-all duration-500 ${
                      index === currentSlide ? 'w-12 bg-primary' : 'w-6 bg-foreground/20'
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            ) : (
              <div />
            )}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-muted-foreground"
            >
              <ArrowDown className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
