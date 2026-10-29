// Kotak pencarian utama ala OTA: jenis acara → kota/venue → tanggal → sesi → tamu.
import { FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { MapPin, CalendarDays, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useLocations } from '@/hooks/useCMS';
import { venuePath } from '@/lib/venue-url';
import { cn } from '@/lib/utils';

const Calendar = lazy(() => import('@/components/ui/calendar').then((m) => ({ default: m.Calendar })));

export const EVENT_TABS = ['Pernikahan', 'Akad & lamaran', 'Acara kantor', 'Survei venue'] as const;
export const GUEST_RANGES = ['< 300', '300–500', '500–800', '> 800'] as const;
export const SESSIONS = ['Bebas', 'Pagi', 'Malam'] as const;

export function SearchWidget({ className, compact = false }: { className?: string; compact?: boolean }) {
  const navigate = useNavigate();
  const { data: locations = [] } = useLocations();
  const [tab, setTab] = useState<(typeof EVENT_TABS)[number]>('Pernikahan');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [session, setSession] = useState<(typeof SESSIONS)[number]>('Bebas');
  const [guests, setGuests] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const active = useMemo(() => locations.filter((l) => l.is_active), [locations]);
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cities = [...new Set(active.map((l) => l.category).filter(Boolean) as string[])];
    const cityHits = cities.filter((c) => !q || c.toLowerCase().includes(q)).map((c) => ({ kind: 'city' as const, label: c }));
    const venueHits = active
      .filter((l) => !q || l.name.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q) || l.category?.toLowerCase().includes(q))
      .slice(0, 6)
      .map((l) => ({ kind: 'venue' as const, label: l.name, venue: l }));
    return [...cityHits.slice(0, 4), ...venueHits];
  }, [active, query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setShowSuggest(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const params = () => {
    const p = new URLSearchParams();
    if (date) p.set('date', format(date, 'yyyy-MM-dd'));
    if (session !== 'Bebas') p.set('sesi', session.toLowerCase());
    if (guests) p.set('tamu', guests);
    if (tab !== 'Pernikahan') p.set('jenis', tab);
    return p;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    const exact = active.find((l) => l.name.toLowerCase() === q.toLowerCase());
    const p = params();
    if (exact) { navigate(`${venuePath(exact)}${p.toString() ? `?${p}` : ''}`); return; }
    if (q) p.set('q', q);
    navigate(`/lokasi${p.toString() ? `?${p}` : ''}`);
  };

  return (
    <div className={cn('ota-card p-4 md:p-5', className)}>
      <div role="tablist" aria-label="Jenis acara" className="ota-scroll-x pb-3 mb-3 border-b border-border">
        {EVENT_TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className="ota-chip">{t}</button>
        ))}
      </div>
      <form onSubmit={submit} className={cn('grid gap-2.5', compact ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-[2fr_1.3fr_1fr_1fr_auto]')}>
        <div ref={boxRef} className="relative col-span-2 md:col-span-1">
          <div className="ota-field">
            <label htmlFor="sw-q">Kota atau venue</label>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <input id="sw-q" value={query} autoComplete="off" onFocus={() => setShowSuggest(true)} onChange={(e) => { setQuery(e.target.value); setShowSuggest(true); }} onKeyDown={(e) => { if (e.key === 'Escape') setShowSuggest(false); }} placeholder="Jakarta Selatan, Bandung, nama venue…" className="w-full bg-transparent outline-none font-bold text-[15px] placeholder:font-normal placeholder:text-muted-foreground min-h-7" />
            </div>
          </div>
          {showSuggest && suggestions.length > 0 && (
            <ul className="absolute z-30 left-0 right-0 mt-2 ota-card p-1.5 max-h-80 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={`${s.kind}-${s.label}`}>
                  <button type="button" onClick={() => { setQuery(s.label); setShowSuggest(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                    <span className="size-8 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0"><MapPin className="size-4" aria-hidden="true" /></span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-sm truncate">{s.label}</span>
                      <span className="block text-xs text-muted-foreground truncate">{s.kind === 'city' ? 'Area' : s.venue?.address || s.venue?.category}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="ota-field text-left">
              <span className="ota-field-label">Tanggal acara</span>
              <span className="flex items-center gap-2 font-bold text-[15px] min-h-7"><CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />{date ? format(date, 'EEE, d MMM yyyy', { locale: idLocale }) : <span className="font-normal text-muted-foreground">Pilih tanggal</span>}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {calendarOpen && (
              <Suspense fallback={<div className="h-80 w-72 flex items-center justify-center" role="status">Memuat kalender…</div>}>
                <Calendar mode="single" locale={idLocale} selected={date} onSelect={(d) => { setDate(d); setCalendarOpen(false); }} disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus className="p-3" />
              </Suspense>
            )}
          </PopoverContent>
        </Popover>
        <div className="ota-field">
          <label htmlFor="sw-sesi">Sesi</label>
          <select id="sw-sesi" value={session} onChange={(e) => setSession(e.target.value as (typeof SESSIONS)[number])} className="bg-transparent outline-none font-bold text-[15px] min-h-7">
            {SESSIONS.map((s) => <option key={s} value={s}>{s === 'Bebas' ? 'Pagi / malam' : s}</option>)}
          </select>
        </div>
        <div className="ota-field">
          <label htmlFor="sw-tamu">Tamu</label>
          <select id="sw-tamu" value={guests} onChange={(e) => setGuests(e.target.value)} className="bg-transparent outline-none font-bold text-[15px] min-h-7">
            <option value="">Semua</option>
            {GUEST_RANGES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <Button type="submit" className="col-span-2 md:col-span-1 h-auto min-h-14 px-6 rounded-xl text-base font-extrabold">
          <Search className="size-4" aria-hidden="true" />Cek Tanggal
        </Button>
      </form>
      <p className="mt-3 rounded-xl bg-accent text-accent-foreground text-xs md:text-sm px-3.5 py-2.5">Gratis cek tanggal. Penawaran resmi dikirim tim venue dalam 1×24 jam, tanpa komitmen.</p>
    </div>
  );
}
