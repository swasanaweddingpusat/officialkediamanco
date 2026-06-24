import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useHeroSlides } from '@/hooks/useCMS';
import heroImage from '@/assets/hero-gym.jpg';

export function HeroWithSearch() {
  const { data: slides, isLoading } = useHeroSlides();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [capacity, setCapacity] = useState('');

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
    if (capacity) params.set('capacity', capacity);
    navigate(`/lokasi${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center items-center px-6 overflow-hidden -mt-16 lg:-mt-20 pt-16 lg:pt-20">
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
            <img src={currentImageUrl} alt="Kediaman venue" className="w-full h-full object-cover brightness-75" />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background/60" />
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className="relative z-10 text-center max-w-5xl w-full"
      >
        <span className="font-script text-primary text-4xl md:text-5xl mb-4 block">
          {slide?.subtitle || 'Kemewahan yang Abadi'}
        </span>
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white font-light tracking-tight mb-10 leading-[1.05]">
          {slide?.title || (
            <>
              Wujudkan Pernikahan <br />
              <span className="italic">Impian Anda</span>
            </>
          )}
        </h1>

        {/* Bridestory-style search bar */}
        <form
          onSubmit={handleSearch}
          className="bg-background/95 backdrop-blur-md p-2 rounded-full shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row items-center border border-primary/30"
        >
          <div className="flex-1 px-6 py-3 text-left md:border-r border-border w-full">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
              Lokasi
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Cari kota atau venue..."
              className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground font-medium text-foreground"
            />
          </div>
          <div className="flex-1 px-6 py-3 text-left md:border-r border-border w-full">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground font-medium text-foreground"
            />
          </div>
          <div className="flex-1 px-6 py-3 text-left w-full">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
              Kapasitas
            </label>
            <select
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-foreground font-medium"
            >
              <option value="">Pilih jumlah tamu</option>
              <option value="100-300">100 - 300</option>
              <option value="300-800">300 - 800</option>
              <option value="1000+">1000+</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto mt-2 md:mt-0 bg-foreground text-background px-10 py-4 rounded-full font-serif hover:bg-primary hover:text-primary-foreground transition-all transform hover:scale-105 active:scale-95 text-sm tracking-wide"
          >
            Cari Venue
          </button>
        </form>

        {totalSlides > 1 && (
          <div className="flex gap-2 justify-center mt-10">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-px transition-all duration-500 ${
                  i === currentSlide ? 'w-12 bg-primary' : 'w-6 bg-white/30'
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
