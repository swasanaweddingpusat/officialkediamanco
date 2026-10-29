import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { MapPin, Users, SlidersHorizontal, X, Eye } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations, useVenueInterest, useExternalDeals } from '@/hooks/useCMS';
import { useStartingPrices, formatRupiah } from '@/hooks/useOta';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CMSImage } from '@/components/CMSImage';
import { Breadcrumbs, EmptyState, venueImage } from '@/components/ota/OtaKit';
import { SearchWidget } from '@/components/ota/SearchWidget';
import { venuePath } from '@/lib/venue-url';
import { cn } from '@/lib/utils';

type Sort = 'relevan' | 'harga' | 'populer';

const norm = (v?: string | null) => (v ?? '').toLowerCase().trim();

const Locations = () => {
  const { data: locations = [], isLoading } = useLocations();
  const { data: interest = {} } = useVenueInterest();
  const { data: prices } = useStartingPrices();
  const { data: deals = [] } = useExternalDeals();
  const [params, setParams] = useSearchParams();
  const q = params.get('q')?.trim() || '';
  const date = params.get('date') || '';
  const [cities, setCities] = useState<string[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [only360, setOnly360] = useState(false);
  const [sort, setSort] = useState<Sort>('relevan');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());

  useSEO({
    title: 'Cari Venue & Ballroom | Kediaman Corp',
    description: 'Bandingkan ballroom Kediaman di Jakarta dan Bandung: cek tanggal kosong, kapasitas, fasilitas, dan harga paket.',
    url: 'https://kediaman.co/lokasi',
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Lokasi', url: 'https://kediaman.co/lokasi' }],
  });

  useEffect(() => {
    if (!date) { setBlocked(new Set()); return; }
    let cancelled = false;
    supabase.from('ballroom_schedules').select('location_id,status').eq('schedule_date', date).in('status', ['booked', 'blocked'])
      .then(({ data }: { data: { location_id: string }[] | null }) => { if (!cancelled) setBlocked(new Set((data || []).map((r) => r.location_id))); });
    return () => { cancelled = true; };
  }, [date]);

  const venues = useMemo(() => locations.filter((l) => l.is_active), [locations]);
  const allCities = useMemo(() => [...new Set(venues.map((v) => v.category).filter(Boolean) as string[])], [venues]);

  // Tanggal yang sudah terisi menurut data deals eksternal (dicocokkan lewat nama venue).
  const dealBlocked = useMemo(() => {
    const set = new Set<string>();
    if (!date) return set;
    for (const v of venues) {
      const n = norm(v.name);
      if (deals.some((d) => (d.tanggalAcara ?? '').slice(0, 10) === date && (norm(d.namaVenue) === n || (n.length > 3 && norm(d.namaVenue).includes(n))))) set.add(v.id);
    }
    return set;
  }, [deals, venues, date]);

  const isFull = (id: string) => blocked.has(id) || dealBlocked.has(id);

  const results = useMemo(() => {
    let list = venues;
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(needle) || l.address?.toLowerCase().includes(needle) || l.category?.toLowerCase().includes(needle));
    }
    if (cities.length) list = list.filter((l) => l.category && cities.includes(l.category));
    if (only360) list = list.filter((l) => l.matterport_360_url);
    if (date && onlyAvailable) list = list.filter((l) => !isFull(l.id) && !l.is_coming_soon);
    const sorted = [...list];
    if (sort === 'harga') sorted.sort((a, b) => (prices[a.id] ?? Infinity) - (prices[b.id] ?? Infinity));
    if (sort === 'populer') sorted.sort((a, b) => (interest[b.id]?.views ?? 0) - (interest[a.id]?.views ?? 0));
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues, q, cities, only360, date, onlyAvailable, sort, prices, interest, blocked, dealBlocked]);

  const dateLabel = date ? format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: idLocale }) : '';
  const carry = date ? `?date=${date}` : '';
  const toggleCity = (c: string) => setCities((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  const clear = () => { setCities([]); setOnly360(false); setOnlyAvailable(true); setParams({}); };

  const filters = (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><p className="font-extrabold">Filter</p><button type="button" onClick={clear} className="text-sm font-bold text-primary">Reset</button></div>
      {date && (
        <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="size-4 accent-[hsl(var(--primary))]" />Hanya yang masih kosong</label>
      )}
      <fieldset className="space-y-2.5 border-t border-border pt-4">
        <legend className="font-bold text-sm mb-2.5">Area</legend>
        {allCities.map((c) => (
          <label key={c} className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={cities.includes(c)} onChange={() => toggleCity(c)} className="size-4 accent-[hsl(var(--primary))]" />{c}</label>
        ))}
      </fieldset>
      <fieldset className="space-y-2.5 border-t border-border pt-4">
        <legend className="font-bold text-sm mb-2.5">Fasilitas</legend>
        <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={only360} onChange={(e) => setOnly360(e.target.checked)} className="size-4 accent-[hsl(var(--primary))]" />Tur virtual 360°</label>
      </fieldset>
    </div>
  );

  return (
    <Layout>
      <div className="bg-card border-b border-border">
        <div className="ota-container py-4">
          <Breadcrumbs items={[{ name: 'Venue' }]} className="mb-3" />
          <details className="group">
            <summary className="list-none cursor-pointer flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm [&::-webkit-details-marker]:hidden">
              <span className="font-bold">{q || 'Semua area'}</span>
              <span className="text-muted-foreground">·</span>
              <span>{dateLabel || 'Tanggal fleksibel'}</span>
              <span className="ml-auto inline-flex items-center h-8 px-4 rounded-full bg-primary text-primary-foreground font-bold text-xs group-open:hidden">Ubah</span>
            </summary>
            <SearchWidget className="mt-3" />
          </details>
        </div>
      </div>

      <div className="ota-container py-6 flex gap-6 items-start">
        <aside className="hidden lg:block w-64 shrink-0 ota-card p-5 sticky top-32">{filters}</aside>

        <section className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg md:text-xl font-extrabold">
              {isLoading ? 'Memuat venue…' : date ? `${results.length} venue ${onlyAvailable ? 'masih kosong' : 'ditemukan'} untuk ${dateLabel}` : `${results.length} venue ditemukan`}
            </h1>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="lg:hidden rounded-xl" onClick={() => setFiltersOpen(true)}><SlidersHorizontal className="size-4" />Filter</Button>
              <label className="flex items-center gap-2 text-sm">
                <span className="hidden sm:inline">Urutkan</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 rounded-xl border border-input bg-card px-3 font-bold text-sm">
                  <option value="relevan">Paling relevan</option>
                  <option value="harga">Harga termurah</option>
                  <option value="populer">Paling banyak dilihat</option>
                </select>
              </label>
            </div>
          </div>

          {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          {!isLoading && results.length === 0 && (
            <EmptyState title="Belum ada venue yang cocok">
              Coba ubah filter atau tanggal, atau <a className="font-bold text-primary" href="https://wa.me/6281117797567">tanya tim kami</a> untuk alternatif.
            </EmptyState>
          )}

          {results.map((v) => {
            const full = !!date && isFull(v.id);
            const views = interest[v.id]?.views ?? 0;
            return (
              <article key={v.id} className={cn('ota-card overflow-hidden flex flex-col sm:flex-row', full && 'opacity-75')}>
                <Link to={`${venuePath(v)}${carry}`} className="relative sm:w-64 shrink-0 aspect-[16/10] sm:aspect-auto bg-muted">
                  <CMSImage src={venueImage(v)} imageWidth={520} sizes="(max-width: 640px) 100vw, 256px" alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute left-2.5 top-2.5 flex gap-1.5">
                    {v.is_coming_soon && <span className="ota-badge">Segera hadir</span>}
                    {v.matterport_360_url && <span className="ota-badge">Tur 360°</span>}
                  </span>
                </Link>
                <div className="flex-1 min-w-0 p-4 flex flex-col gap-1.5">
                  <Link to={`${venuePath(v)}${carry}`} className="font-extrabold text-lg leading-snug hover:text-primary">{v.name}</Link>
                  {v.category && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" />{v.category}</p>}
                  {v.address && <p className="text-xs text-muted-foreground line-clamp-1">{v.address}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {v.ballroom_layout_capacity && <span className="flex items-center gap-1.5"><Users className="size-4" aria-hidden="true" />{v.ballroom_layout_capacity}</span>}
                    {views >= 10 && <span className="flex items-center gap-1.5"><Eye className="size-4" aria-hidden="true" />Dilihat {views}× minggu ini</span>}
                  </div>
                  {date && (
                    <p className="mt-auto pt-2"><span className={cn('inline-flex items-center h-7 px-2.5 rounded-full text-xs font-bold', full ? 'ota-pill-full' : 'ota-pill-ok')}>{full ? 'Sudah terisi' : 'Tanggal masih kosong'}</span></p>
                  )}
                </div>
                <div className="p-4 sm:w-52 shrink-0 border-t sm:border-t-0 sm:border-l border-border flex sm:flex-col items-end justify-between sm:justify-end gap-2 text-right">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Paket mulai</p>
                    <p className="ota-price text-lg">{formatRupiah(prices[v.id]) ?? 'Hubungi kami'}</p>
                  </div>
                  <Link to={`${venuePath(v)}${carry}`} className={cn('inline-flex items-center justify-center h-11 px-5 rounded-xl font-extrabold text-sm', full ? 'border border-input' : 'bg-primary text-primary-foreground')}>
                    {full ? 'Lihat tanggal lain' : 'Pilih venue'}
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/40" onClick={() => setFiltersOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Filter" className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-1"><Button variant="ghost" size="icon" onClick={() => setFiltersOpen(false)} aria-label="Tutup filter"><X /></Button></div>
            {filters}
            <Button className="w-full mt-6 h-12 rounded-xl font-extrabold" onClick={() => setFiltersOpen(false)}>Tampilkan {results.length} venue</Button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Locations;
