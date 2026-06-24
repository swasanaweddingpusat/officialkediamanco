import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Search } from 'lucide-react';
import { useHeroSlides } from '@/hooks/useCMS';
import heroImage from '@/assets/hero-gym.jpg';

export function HeroWithSearch() {
  const { data: slides, isLoading } = useHeroSlides();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  const activeSlides = slides?.filter(s => s.is_active) || [];
  const totalSlides = activeSlides.length;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % totalSlides), 7000);
    return () => clearInterval(t);
  }, [totalSlides]);

  const slide = activeSlides[currentSlide];
  const currentImageUrl = slide?.image_url || (isLoading ? undefined : heroImage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('q', location);
    if (date) params.set('date', date);
    navigate(`/lokasi${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <section className="relative h-[600px] md:h-[640px] flex items-center justify-center text-center px-6 overflow-hidden -mt-16 lg:-mt-20 pt-16 lg:pt-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="absolute inset-0 z-0"
        >
          {currentImageUrl ? (
            <img src={currentImageUrl} alt="Kediaman venue" className="w-full h-full object-cover brightness-50" />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background" />
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight italic">
          {slide?.title ? (
            slide.title
          ) : (
            <>
              Temukan Ruang Untuk <br />
              <span className="font-bold not-italic">Hari Bahagia Anda</span>
            </>
          )}
        </h1>
        <p className="text-white/90 text-base md:text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
          {slide?.description ||
            'Kurasi venue pernikahan eksklusif dan dekorasi terbaik di seluruh Indonesia untuk momen yang tak terlupakan.'}
        </p>

        <form
          onSubmit={handleSearch}
          className="bg-background p-2 rounded-2xl shadow-[0_20px_50px_rgba(27,48,34,0.25)] flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto border border-primary/10"
        >
          <div className="flex-1 flex items-center gap-3 px-5 py-2 md:border-r border-border w-full">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lokasi (Jakarta, Bali...)"
              className="bg-transparent outline-none w-full text-sm placeholder:text-muted-foreground font-medium text-foreground"
            />
          </div>
          <div className="flex-1 flex items-center gap-3 px-5 py-2 w-full">
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent outline-none w-full text-sm placeholder:text-muted-foreground font-medium text-foreground"
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto bg-foreground text-background px-8 py-4 rounded-xl font-semibold hover:bg-primary hover:text-primary-foreground transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            <Search className="w-4 h-4" />
            Cari Sekarang
          </button>
        </form>

        {totalSlides > 1 && (
          <div className="flex gap-2 justify-center mt-8">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === currentSlide ? 'w-10 bg-primary' : 'w-2 bg-white/40'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
