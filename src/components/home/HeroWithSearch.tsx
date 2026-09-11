import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar as CalendarIcon, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useHeroSlides, useLocations } from '@/hooks/useCMS';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
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
  const [locationQuery, setLocationQuery] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [locFocused, setLocFocused] = useState(false);
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
    const q = locationQuery.trim().toLowerCase();
    const base = (allLocations || []).filter((l) => l.is_active);
    if (!q) {
      setSuggestions(base.slice(0, 6));
      return;
    }
    setSuggestions(
      base
        .filter(
          (l) =>
            l.name?.toLowerCase().includes(q) ||
            l.address?.toLowerCase().includes(q) ||
            l.category?.toLowerCase().includes(q),
        )
        .slice(0, 8),
    );
  }, [locationQuery, allLocations]);

  // Availability check against ballroom_schedules
  useEffect(() => {
    if (!date) {
      setUnavailableIds(new Set());
      return;
    }
    let cancelled = false;
    setChecking(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    supabase
      .from('ballroom_schedules')
      .select('location_id,status')
      .eq('schedule_date', dateStr)
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

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setShowSuggest(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const goToLocation = (locId: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', format(date, 'yyyy-MM-dd'));
    navigate(`/lokasi/${locId}${params.toString() ? `?${params}` : ''}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length === 1 && locationQuery.trim()) {
      goToLocation(suggestions[0].id);
      return;
    }
    const params = new URLSearchParams();
    if (locationQuery) params.set('q', locationQuery);
    if (date) params.set('date', format(date, 'yyyy-MM-dd'));
    navigate(`/lokasi${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <section className="relative min-h-[720px] md:h-[720px] flex items-center justify-center text-center px-4 sm:px-6 overflow-hidden -mt-16 lg:-mt-20 pt-20 pb-8 lg:pt-20 lg:pb-0">
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
            <img src={currentImageUrl} alt="Kediaman venue" className="w-full h-full object-cover brightness-[0.45]" />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a2e22]/40 via-transparent to-[#1a2e22]" />
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#edece7] mb-4 md:mb-6 leading-tight italic">
          {slide?.title ? (
            slide.title
          ) : (
            <>
              Temukan Ruang Untuk <br />
              <span className="font-bold not-italic">Hari Bahagia Anda</span>
            </>
          )}
        </h1>
        <p className="text-[#edece7]/80 text-sm sm:text-base md:text-lg mb-7 md:mb-12 max-w-xl mx-auto font-light leading-relaxed">
          {slide?.description ||
            'Kurasi venue pernikahan eksklusif dan dekorasi terbaik di seluruh Indonesia untuk momen yang tak terlupakan.'}
        </p>

        {/* Luxury Estate Search Bar */}
        <div ref={wrapperRef} className="relative max-w-4xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="relative bg-[#edece7] rounded-lg md:rounded-full shadow-2xl p-2 flex flex-col md:flex-row items-stretch md:items-center border border-[#dcdad0]"
          >
            {/* Location */}
            <div
              className={cn(
                'flex-1 flex items-center min-h-[64px] px-4 sm:px-5 md:px-8 py-2 md:border-r border-b md:border-b-0 border-[#d1cfc3] transition-colors rounded-md md:rounded-none',
                locFocused && 'bg-[#f7f6f2] md:rounded-l-full',
              )}
            >
              <MapPin className="w-5 h-5 text-[#1a2e22] mr-4 shrink-0" strokeWidth={1.5} />
              <div className="flex flex-col text-left w-full min-w-0">
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#8c8a7e] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Lokasi
                </label>
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setShowSuggest(true);
                  }}
                  onFocus={() => {
                    setShowSuggest(true);
                    setLocFocused(true);
                  }}
                  onBlur={() => setLocFocused(false)}
                  placeholder="Cari venue impian..."
                  autoComplete="off"
                  className="bg-transparent border-none p-0 text-[#1a2e22] focus:ring-0 focus:outline-none placeholder-[#a19f94] text-base font-medium font-serif w-full min-w-0"
                />
              </div>
            </div>

            {/* Date */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex-1 flex items-center min-h-[64px] px-4 sm:px-5 md:px-8 py-2 text-left hover:bg-[#f7f6f2] rounded-md md:rounded-r-full transition-colors"
                >
                  <CalendarIcon className="w-5 h-5 text-[#1a2e22] mr-4 shrink-0" strokeWidth={1.5} />
                  <div className="flex flex-col w-full min-w-0">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#8c8a7e] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Tanggal
                    </label>
                    <span
                      className={cn(
                        'text-base font-medium font-serif truncate',
                        date ? 'text-[#1a2e22]' : 'text-[#a19f94]',
                      )}
                    >
                      {date ? format(date, 'EEE, dd MMM yyyy', { locale: idLocale }) : 'Pilih tanggal'}
                    </span>
                  </div>
                  {checking && <Loader2 className="w-4 h-4 animate-spin text-[#bfa37e] ml-2 shrink-0" />}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#edece7] border-[#d1cfc3] shadow-xl" align="center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                  classNames={{
                    caption_label: 'text-sm font-semibold text-[#1a2e22]',
                    nav_button: 'h-7 w-7 bg-transparent p-0 text-[#1a2e22] opacity-70 hover:opacity-100 hover:bg-[#dcdad0] rounded-md border border-[#d1cfc3]',
                    head_cell: 'text-[#6b6a5f] rounded-md w-9 font-normal text-[0.8rem]',
                    day: 'h-9 w-9 p-0 font-medium text-[#1a2e22] rounded-md hover:bg-[#dcdad0] aria-selected:opacity-100',
                    day_selected: 'bg-[#1a2e22] text-[#edece7] hover:bg-[#1a2e22] hover:text-[#edece7] focus:bg-[#1a2e22] focus:text-[#edece7]',
                    day_today: 'bg-[#bfa37e]/25 text-[#1a2e22] font-bold',
                    day_outside: 'text-[#a19f94] opacity-50',
                    day_disabled: 'text-[#a19f94] opacity-40 line-through',
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* Submit */}
            <button
              type="submit"
              className="group mt-2 md:mt-0 md:ml-1 min-h-[52px] bg-[#1a2e22] text-[#edece7] px-6 md:px-8 py-3 md:py-4 rounded-md md:rounded-full font-semibold transition-all hover:bg-[#2a4533] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#bfa37e] focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              <span className="font-serif text-lg tracking-wide">Cari Sekarang</span>
              <ArrowRight className="w-4 h-4 text-[#bfa37e] group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
          </form>

          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 md:left-6 md:right-6 mt-2 md:mt-3 bg-[#edece7] rounded-lg shadow-xl border border-[#dcdad0] overflow-hidden z-30 text-left"
              >
                <div className="px-5 py-3 border-b border-[#d1cfc3] flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#8c8a7e] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {date ? 'Venue tersedia untuk tanggal ini' : 'Rekomendasi venue'}
                  </span>
                  <span className="text-[10px] text-[#bfa37e] font-serif italic">{suggestions.length} pilihan</span>
                </div>
                <ul className="max-h-60 md:max-h-80 overflow-y-auto">
                  {suggestions.map((s) => {
                    const unavailable = date && unavailableIds.has(s.id);
                    return (
                      <li key={s.id} className="border-b border-[#d1cfc3]/50 last:border-0">
                        <button
                          type="button"
                          disabled={!!unavailable}
                          onClick={() => goToLocation(s.id)}
                          className={cn(
                            'w-full flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 hover:bg-[#f7f6f2] transition-colors group',
                            unavailable && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                          )}
                        >
                          {s.image_url ? (
                            <img src={s.image_url} alt={s.name} className="w-11 h-11 object-cover rounded-md shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-md bg-[#1a2e22]/10 flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-[#1a2e22]" strokeWidth={1.5} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <p className="font-serif font-semibold text-base text-[#1a2e22] truncate">{s.name}</p>
                              {unavailable && (
                                <span className="text-[9px] tracking-[0.2em] uppercase text-red-700 shrink-0 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Terbooking
                                </span>
                              )}
                            </div>
                            {s.address && (
                              <p className="text-[11px] text-[#8c8a7e] uppercase tracking-wide truncate mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {s.address}
                              </p>
                            )}
                          </div>
                          {s.category && (
                            <span className="hidden sm:inline text-[10px] tracking-[0.2em] uppercase text-[#bfa37e] shrink-0 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
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

        <p className="text-center mt-5 md:mt-8 text-[#edece7]/60 text-sm italic font-serif">
          Temukan kemegahan yang abadi untuk hari spesial Anda
        </p>

        {totalSlides > 1 && (
          <div className="flex gap-2 justify-center mt-6">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn(
                  'h-1 rounded-full transition-all duration-500',
                  i === currentSlide ? 'w-10 bg-[#bfa37e]' : 'w-2 bg-[#edece7]/40',
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
