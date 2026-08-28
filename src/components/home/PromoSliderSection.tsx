import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePrograms } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';

export function PromoSliderSection() {
  const { data: programs, isLoading } = usePrograms();
  const promos = programs?.filter(p => p.is_active) || [];
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const slidesPerView = typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1;
  const maxIndex = Math.max(0, promos.length - slidesPerView);

  // Autoplay
  useEffect(() => {
    if (promos.length <= slidesPerView) return;
    const t = setInterval(() => {
      setIndex((p) => (p >= maxIndex ? 0 : p + 1));
    }, 5500);
    return () => clearInterval(t);
  }, [promos.length, maxIndex, slidesPerView]);

  // Scroll on index change
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    if (card) {
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }
  }, [index]);

  const prev = () => setIndex((p) => Math.max(0, p - 1));
  const next = () => setIndex((p) => Math.min(maxIndex, p + 1));

  if (!isLoading && promos.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex justify-between items-end mb-8"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-primary" />
            <span className="text-primary font-semibold tracking-[0.2em] text-[10px] uppercase">
              Exclusive Offers
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Promosi Spesial
          </h2>
        </div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={prev}
            disabled={index === 0}
            className="p-3 rounded-full border border-foreground/10 hover:bg-card hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={next}
            disabled={index >= maxIndex}
            className="p-3 rounded-full border border-foreground/10 hover:bg-card hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : (
        <>
          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {promos.map((promo, i) => {
              const altStyle = i % 2 === 1;
              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex-none w-[88%] md:w-[calc(50%-12px)] snap-start group"
                >
                  <Link to={`/tentang-kami/${promo.id}`} className="block" aria-label={promo.name}>
                    <div className="relative h-64 md:h-72 rounded-3xl overflow-hidden shadow-xl">
                      <img
                        src={promo.image_url || '/placeholder.svg'}
                        alt={promo.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {promos.length > slidesPerView && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1 rounded-full transition-all ${
                    i === index ? 'w-10 bg-foreground' : 'w-2 bg-muted'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
