// Daftar promo (tabel programs) — gaya OTA. Rute: /promo (juga /paket untuk tautan lama).
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarClock, Search } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrograms, useSiteSettings } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { promotionPath } from '@/lib/content-url';
import { CMSImage } from '@/components/CMSImage';
import { PageHeader, EmptyState } from '@/components/ota/OtaKit';

type Promo = {
  id: string; slug: string | null; name: string; description: string | null; image_url: string | null; category: string | null;
  is_active: boolean | null; start_date?: string | null; end_date?: string | null; promo_code?: string | null;
};

export const promoPeriod = (p: { start_date?: string | null; end_date?: string | null }) => {
  const f = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  if (p.start_date && p.end_date) return `${f(p.start_date)} – ${f(p.end_date)}`;
  if (p.end_date) return `Berlaku s.d. ${f(p.end_date)}`;
  if (p.start_date) return `Mulai ${f(p.start_date)}`;
  return null;
};

export const promoExpired = (p: { end_date?: string | null }) => !!p.end_date && new Date(`${p.end_date}T23:59:59`) < new Date();

const Packages = () => {
  const { data: programs, isLoading } = usePrograms();
  const { data: settings } = useSiteSettings();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const active = params.get('kategori') || '';
  const siteName = settings?.site_name || 'Kediaman Corp';

  useSEO({
    title: `Promo Venue & Ballroom | ${siteName}`,
    description: `Promo dan penawaran spesial venue ${siteName}: diskon paket, bonus, dan event pameran pernikahan.`,
    url: 'https://kediaman.co/promo',
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Promo', url: 'https://kediaman.co/promo' }],
  });

  const promos = useMemo(() => ((programs || []) as Promo[]).filter((p) => p.is_active && !promoExpired(p)), [programs]);
  const categories = useMemo(() => [...new Set(promos.map((p) => (p.category || '').trim()).filter(Boolean))], [promos]);
  const filtered = promos.filter((p) => {
    const q = query.trim().toLowerCase();
    return (!active || (p.category || '').trim() === active) && (!q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  });

  return (
    <Layout>
      <PageHeader title="Promo spesial" subtitle="Penawaran terbaru untuk venue, paket pernikahan, dan acara Anda." crumbs={[{ name: 'Promo' }]}>
        <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="ota-scroll-x flex-1">
            <button type="button" className="ota-chip" aria-pressed={!active} onClick={() => setParams({})}>Semua</button>
            {categories.map((c) => <button key={c} type="button" className="ota-chip" aria-pressed={active === c} onClick={() => setParams({ kategori: c })}>{c}</button>)}
          </div>
          <label className="flex items-center gap-2 h-10 px-3.5 rounded-full bg-muted md:w-72">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari promo" aria-label="Cari promo" className="bg-transparent outline-none text-sm w-full" />
          </label>
        </div>
      </PageHeader>

      <div className="ota-container py-6">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Belum ada promo yang cocok">Promo baru akan tampil di sini. Pantau terus, atau tanya tim kami lewat WhatsApp.</EmptyState>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const period = promoPeriod(p);
              return (
                <Link key={p.id} to={promotionPath(p)} className="ota-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                  <div className="relative aspect-[16/9] bg-muted">
                    {p.image_url && <CMSImage src={p.image_url} imageWidth={720} sizes="(max-width: 640px) 100vw, 380px" alt={p.name} className="absolute inset-0 w-full h-full object-cover" />}
                    {p.category && <span className="absolute left-3 top-3 ota-badge">{p.category}</span>}
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <p className="font-extrabold leading-snug line-clamp-2">{p.name}</p>
                    {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                    <div className="mt-auto pt-2 flex items-center justify-between gap-2 text-xs">
                      {period ? <span className="inline-flex items-center gap-1.5 text-muted-foreground"><CalendarClock className="size-4" aria-hidden="true" />{period}</span> : <span />}
                      {p.promo_code && <span className="rounded-md border border-dashed border-primary px-2 py-0.5 font-mono font-bold text-primary">{p.promo_code}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Packages;
