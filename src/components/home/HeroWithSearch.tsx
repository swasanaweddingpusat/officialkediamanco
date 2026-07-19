import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Search, Loader2 } from 'lucide-react';
import { useHeroSlides, useLocations } from '@/hooks/useCMS';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-gym.jpg';

type Suggestion = {
  id: string;
  name: string;
  address: string | null;
  category: string | null;
  image_url: string | null;
};

export function HeroWithSearch() {
  const { data: slides, isLoading } = useHeroSlides();
  const { data: allLocations } = useLocations();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [checking, setChecking] = useState(false);
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const wrapperRef = useRef<HTMLDivElement>(null);

  const activeSlides = slides?.filter((s) => s.is_active) || [];
  const totalSlides = activeSlides.length;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % totalSlides), 7000);
    return () => clearInterval(t);
  }, [totalSlides]);

  const slide = activeSlides[currentSlide];
  const currentImageUrl = slide?.image_url || (isLoading ? undefined : heroImage);

  // Live suggestions from Supabase (client-side filter over cached locations)
  useEffect(() => {
    const q = location.trim().toLowerCase();
    const base = (allLocations || []).filter((l) => l.is_active);
    if (!q) {
      setSuggestions(base.slice(0, 6));
      return;
    }
    const matched = base
      .filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.address?.toLowerCase().includes(q) ||
          l.category?.toLowerCase().includes(q),
      )
      .slice(0, 8);
    setSuggestions(matched);
  }, [location, allLocations]);

  // When a date is picked, check availability across venues via ballroom_schedules
  useEffect(() => {
    if (!date) {
      setUnavailableIds(new Set());
      return;
    }
    let cancelled = false;
    setChecking(true);
    supabase
      .from('ballroom_schedules')
      .select('location_id,status')
      .eq('schedule_date', date)
      .in('status', ['booked', 'blocked'])
      .then(({ data }) => {
        if (cancelled) return;
        setUnavailableIds(new Set((data || []).map((r) => r.location_id as string)));
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setShowSuggest(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const goToLocation = (id: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    navigate(`/lokasi/${id}${params.toString() ? `?${params}` : ''}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // If query exactly matches (or has only one match), jump to that venue
    if (suggestions.length === 1 && location.trim()) {
      goToLocation(suggestions[0].id);
      return;
    }
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

        <div ref={wrapperRef} className="relative max-w-3xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="bg-background p-2 rounded-2xl shadow-[0_20px_50px_rgba(27,48,34,0.25)] flex flex-col md:flex-row items-center gap-2 border border-primary/10"
          >
            <div className="flex-1 flex items-center gap-3 px-5 py-2 md:border-r border-border w-full">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowSuggest(true);
                }}
                onFocus={() => setShowSuggest(true)}
                placeholder="Cari venue, kota, atau area..."
                className="bg-transparent outline-none w-full text-sm placeholder:text-muted-foreground font-medium text-foreground"
                autoComplete="off"
              />
            </div>
            <div className="flex-1 flex items-center gap-3 px-5 py-2 w-full">
              <Calendar className="w-5 h-5 text-primary shrink-0" />
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder:text-muted-foreground font-medium text-foreground"
              />
              {checking && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
            <button
              type="submit"
              className="w-full md:w-auto bg-foreground text-background px-8 py-4 rounded-xl font-semibold hover:bg-primary hover:text-primary-foreground transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              <Search className="w-4 h-4" />
              Cari Sekarang
            </button>
          </form>

          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 mt-2 bg-background rounded-xl shadow-2xl border border-border/60 overflow-hidden z-20 text-left"
              >
                <div className="px-4 py-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground border-b border-border/40">
                  {date ? 'Venue tersedia untuk tanggal ini' : 'Saran Venue'}
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {suggestions.map((s) => {
                    const unavailable = date && unavailableIds.has(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          disabled={!!unavailable}
                          onClick={() => goToLocation(s.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors ${
                            unavailable ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {s.image_url ? (
                            <img src={s.image_url} alt={s.name} className="w-12 h-12 object-cover rounded-md shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-foreground truncate">{s.name}</p>
                              {unavailable && (
                                <span className="text-[9px] tracking-widest uppercase text-destructive shrink-0">
                                  Terbooking
                                </span>
                              )}
                            </div>
                            {s.address && (
                              <p className="text-xs text-muted-foreground truncate">{s.address}</p>
                            )}
                          </div>
                          {s.category && (
                            <span className="text-[10px] tracking-[0.15em] uppercase text-primary shrink-0">
                              {s.category}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
