import { venuePath } from '@/lib/venue-url';
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
import heroImage from '@/assets/editorial-ballroom.jpg';
import { Button } from '@/components/ui/button';

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
  const [imageFailed, setImageFailed] = useState(false);
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
  const currentImageUrl = imageFailed ? heroImage : slide?.image_url || allLocations?.find(l => l.image_url)?.image_url || heroImage;
  useEffect(() => setImageFailed(false), [slide?.image_url]);

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
    const venue = allLocations?.find((item) => item.id === locId);
    navigate(`${venuePath(venue || { id: locId })}${params.toString() ? `?${params}` : ''}`);
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
    <section className="editorial-hero relative flex items-center justify-center text-center px-5 sm:px-8 -mt-16 lg:-mt-20 pt-32 pb-36">
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img key={currentImageUrl} src={currentImageUrl} alt={slide?.title || 'Suasana ballroom untuk pernikahan dan acara Kediaman'} width={1920} height={1088} onError={() => setImageFailed(true)} initial={{ scale: 1.04, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-0 w-full h-full object-cover" />
        </AnimatePresence>
        <div className="absolute inset-0 editorial-hero-overlay" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }} className="relative z-10 w-full max-w-5xl">
        <p className="text-xs text-foreground/80 mb-6">KEDIAMAN CORP</p>
        <h1 className="editorial-hero-title italic mb-8">{slide?.title || <>Temukan Ruang Untuk<br />Hari Bahagia Anda</>}</h1>
        <p className="text-xs sm:text-sm font-light text-foreground/80 max-w-xl mx-auto mb-10 leading-relaxed">{slide?.description || 'Venue pernikahan dan acara untuk momen yang tak terlupakan.'}</p>
        <div ref={wrapperRef} className="relative max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="backdrop-blur-xl bg-foreground/5 border border-foreground/20 p-1 flex flex-col md:flex-row items-stretch">
            <div className="flex-1 min-w-0 flex items-center px-6 py-5 border-b md:border-b-0 md:border-r border-foreground/20">
              <div className="text-left w-full">
                <label htmlFor="venue-search" className="block text-[10px] text-foreground/70 mb-2 uppercase">Lokasi</label>
                <input id="venue-search" value={locationQuery} onChange={e => { setLocationQuery(e.target.value); setShowSuggest(true); }} onFocus={() => setShowSuggest(true)} onKeyDown={e => { if (e.key === 'Escape') setShowSuggest(false); }} placeholder="Cari venue impian..." autoComplete="off" className="bg-transparent text-foreground w-full outline-none placeholder:text-foreground/60 text-base font-serif italic" />
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" className="h-auto min-h-24 flex-1 min-w-0 justify-start rounded-none px-6 py-5 text-left hover:bg-foreground/10 hover:text-foreground" aria-label="Pilih tanggal acara">
                  <span className="flex flex-col gap-2 items-start min-w-0"><span className="text-[10px] uppercase text-foreground/70">Tanggal</span><span className="font-serif text-base italic truncate">{date ? format(date, 'dd MMM yyyy', { locale: idLocale }) : 'Pilih tanggal'}</span></span>
                  {checking && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="editorial-popover w-auto p-0 border-border" align="center">
                <Calendar mode="single" selected={date} onSelect={setDate} disabled={d => d < new Date(new Date().setHours(0,0,0,0))} initialFocus className="p-3" />
              </PopoverContent>
            </Popover>
            <Button type="submit" className="h-auto min-h-16 md:min-h-24 px-8 rounded-none uppercase text-xs font-semibold">Cari Sekarang <ArrowRight /></Button>
          </form>
          <AnimatePresence>
            {showSuggest && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground border border-border z-30 text-left">
                <div className="px-5 py-3 text-xs border-b border-border">{date ? 'Pilihan venue pada tanggal ini' : 'Rekomendasi venue'}</div>
                <ul className="max-h-60 overflow-y-auto">
                  {suggestions.map(s => {
                    const unavailable = Boolean(date && unavailableIds.has(s.id));
                    return <li key={s.id} className="border-b border-border last:border-0"><Button variant="ghost" type="button" disabled={unavailable} onClick={() => goToLocation(s.id)} className="w-full h-auto rounded-none justify-start px-5 py-4 whitespace-normal"><MapPin className="shrink-0" /><span className="min-w-0 text-left"><span className="block font-serif text-base">{s.name}</span><span className="block text-xs text-muted-foreground mt-1">{unavailable ? 'Terbooking' : s.address}</span></span></Button></li>;
                  })}
                  {!suggestions.length && <li className="p-5 text-sm text-muted-foreground">{locationQuery ? 'Tidak ada venue yang cocok.' : 'Telusuri semua venue melalui pencarian.'}</li>}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <a href="#panduan-booking" className="absolute bottom-8 left-6 sm:left-12 text-xs text-foreground/70 border-b border-foreground/30 pb-1">Panduan Booking</a>
      <a href="#koleksi-venue" aria-label="Lihat koleksi venue" className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-3"><span className="editorial-scroll" /><ArrowRight className="w-4 h-4 rotate-90" /></a>
      {totalSlides > 1 && <div className="absolute bottom-8 right-6 sm:right-12 flex gap-1">{activeSlides.map((_, i) => <Button key={i} variant="ghost" size="icon-sm" onClick={() => setCurrentSlide(i)} aria-label={`Slide ${i+1}`} aria-pressed={i === currentSlide} className={cn('rounded-none', i === currentSlide && 'border-b border-foreground')}>{String(i+1).padStart(2,'0')}</Button>)}</div>}
    </section>
  );
}
