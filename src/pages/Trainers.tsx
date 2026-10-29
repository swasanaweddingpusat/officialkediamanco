// Portfolio (tabel trainers) — gaya OTA.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Images, Search } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations, useTrainers } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { CMSImage } from '@/components/CMSImage';
import { PageHeader, EmptyState } from '@/components/ota/OtaKit';
import { portfolioPath } from '@/lib/content-url';

const PAGE = 24;

const Trainers = () => {
  const { data: trainers, isLoading } = useTrainers();
  const { data: locations = [] } = useLocations();
  const [category, setCategory] = useState('');
  const [venue, setVenue] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  useSEO({
    title: 'Portfolio Acara & Pernikahan | Kediaman Corp',
    description: 'Inspirasi dari pernikahan dan acara yang sudah digelar di ballroom Kediaman.',
    url: 'https://kediaman.co/portfolio',
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Portfolio', url: 'https://kediaman.co/portfolio' }],
  });

  const active = useMemo(() => (trainers || []).filter((t) => t.is_active), [trainers]);
  const categories = useMemo(() => [...new Set(active.map((t) => t.specialization).filter(Boolean) as string[])].sort(), [active]);
  const venues = useMemo(() => locations.filter((l) => active.some((t) => (t as { location_id?: string | null }).location_id === l.id)), [locations, active]);
  const filtered = active.filter((t) => {
    const q = query.trim().toLowerCase();
    const loc = (t as { location_id?: string | null }).location_id;
    return (!category || t.specialization === category) && (!venue || loc === venue) && (!q || t.name.toLowerCase().includes(q) || t.bio?.toLowerCase().includes(q));
  });
  const venueName = (id?: string | null) => locations.find((l) => l.id === id)?.name;

  return (
    <Layout>
      <PageHeader title="Portfolio" subtitle="Inspirasi dari pernikahan dan acara yang sudah digelar di ballroom Kediaman." crumbs={[{ name: 'Portfolio' }]}>
        <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="ota-scroll-x flex-1">
            <button type="button" className="ota-chip" aria-pressed={!category} onClick={() => { setCategory(''); setLimit(PAGE); }}>Semua</button>
            {categories.map((c) => <button key={c} type="button" className="ota-chip" aria-pressed={category === c} onClick={() => { setCategory(c); setLimit(PAGE); }}>{c}</button>)}
          </div>
          {venues.length > 0 && (
            <select value={venue} onChange={(e) => { setVenue(e.target.value); setLimit(PAGE); }} aria-label="Filter venue" className="h-10 rounded-xl border border-input bg-card px-3 text-sm font-bold">
              <option value="">Semua venue</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 h-10 px-3.5 rounded-full bg-muted md:w-64">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="Cari nama pasangan" aria-label="Cari portfolio" className="bg-transparent outline-none text-sm w-full" />
          </label>
        </div>
      </PageHeader>

      <div className="ota-container py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Portfolio tidak ditemukan">Coba kata kunci atau filter lain.</EmptyState>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">{filtered.length} acara</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filtered.slice(0, limit).map((t) => {
                const loc = venueName((t as { location_id?: string | null }).location_id);
                return (
                  <Link key={t.id} to={portfolioPath(t)} className="group ota-card overflow-hidden flex flex-col">
                    <div className="relative aspect-[4/5] bg-muted">
                      {t.photo_url && <CMSImage src={t.photo_url} imageWidth={480} sizes="(max-width: 768px) 50vw, 280px" alt={t.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                      {t.images && t.images.length > 0 && <span className="absolute right-2.5 top-2.5 ota-badge"><Images className="size-3.5" aria-hidden="true" />{t.images.length + 1}</span>}
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-accent-foreground">{t.specialization || 'Wedding'}</p>
                      <p className="font-bold text-sm line-clamp-1">{t.name}</p>
                      {loc && <p className="text-xs text-muted-foreground line-clamp-1">{loc}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
            {filtered.length > limit && (
              <div className="text-center mt-6"><button type="button" onClick={() => setLimit((l) => l + PAGE)} className="h-11 px-6 rounded-xl border border-input font-bold hover:border-primary">Tampilkan lebih banyak</button></div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Trainers;
