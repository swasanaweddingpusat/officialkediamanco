// Halaman baru: Paket & Harga semua venue (data dari CMS "Paket & Harga").
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, MapPin, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations } from '@/hooks/useCMS';
import { useVenuePackages, formatRupiah, type VenuePackage } from '@/hooks/useOta';
import { useSEO } from '@/hooks/useSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BookingDialog } from '@/components/booking/BookingDialog';
import { PageHeader, EmptyState } from '@/components/ota/OtaKit';
import { venuePath } from '@/lib/venue-url';

type Sort = 'urutan' | 'murah' | 'mahal';

const PriceList = () => {
  const { data: packages = [], isLoading } = useVenuePackages();
  const { data: locations = [] } = useLocations();
  const [params, setParams] = useSearchParams();
  const venue = params.get('venue') || '';
  const [sort, setSort] = useState<Sort>('urutan');

  useSEO({
    title: 'Paket & Harga Venue Pernikahan | Kediaman Corp',
    description: 'Bandingkan paket dan harga pernikahan di setiap ballroom Kediaman: isi paket, kapasitas tamu, dan harga mulai.',
    url: 'https://kediaman.co/harga',
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Paket & Harga', url: 'https://kediaman.co/harga' }],
  });

  const active = packages.filter((p) => p.is_active);
  const venuesWithPackages = useMemo(() => locations.filter((l) => l.is_active && active.some((p) => p.location_id === l.id)), [locations, active]);
  const list = useMemo(() => {
    const l = venue ? active.filter((p) => p.location_id === venue) : active;
    const s = [...l];
    if (sort === 'murah') s.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === 'mahal') s.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    return s;
  }, [active, venue, sort]);

  const venueOf = (p: VenuePackage) => locations.find((l) => l.id === p.location_id);

  return (
    <Layout>
      <PageHeader title="Paket & harga" subtitle="Bandingkan isi paket dan harga mulai di setiap ballroom. Harga final dikirim tim venue dalam 1×24 jam." crumbs={[{ name: 'Paket & Harga' }]}>
        <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="ota-scroll-x flex-1">
            <button type="button" className="ota-chip" aria-pressed={!venue} onClick={() => setParams({})}>Semua venue</button>
            {venuesWithPackages.map((v) => <button key={v.id} type="button" className="ota-chip" aria-pressed={venue === v.id} onClick={() => setParams({ venue: v.id })}>{v.name}</button>)}
          </div>
          <label className="flex items-center gap-2 text-sm shrink-0">Urutkan
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 rounded-xl border border-input bg-card px-3 font-bold">
              <option value="urutan">Rekomendasi</option>
              <option value="murah">Harga terendah</option>
              <option value="mahal">Harga tertinggi</option>
            </select>
          </label>
        </div>
      </PageHeader>

      <div className="ota-container py-6">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div>
        ) : list.length === 0 ? (
          <EmptyState title="Paket belum tersedia">Daftar paket sedang disiapkan. <Link to="/lokasi" className="font-bold text-primary">Lihat venue</Link> atau tanya tim kami untuk penawaran.</EmptyState>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((p) => {
              const v = venueOf(p);
              return (
                <article key={p.id} className="ota-card p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {v ? <Link to={venuePath(v)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1"><MapPin className="size-3.5" aria-hidden="true" />{v.name}</Link> : <span className="text-xs font-bold text-muted-foreground">Semua venue</span>}
                      <h2 className="text-xl font-extrabold mt-1">{p.name}</h2>
                    </div>
                    {p.is_featured && <span className="shrink-0 rounded-md bg-accent text-accent-foreground text-[11px] font-bold px-2 py-0.5">Terpopuler</span>}
                  </div>
                  {(p.min_pax || p.max_pax) && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Users className="size-4" aria-hidden="true" />{p.min_pax && p.max_pax ? `${p.min_pax}–${p.max_pax} tamu` : `${p.min_pax || p.max_pax} tamu`}</p>}
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  {p.inclusions.length > 0 && (
                    <ul className="space-y-1.5 text-sm">
                      {p.inclusions.map((inc) => <li key={inc} className="flex gap-2"><Check className="size-4 text-[hsl(var(--success))] shrink-0 mt-0.5" aria-hidden="true" />{inc}</li>)}
                    </ul>
                  )}
                  <div className="mt-auto pt-3 border-t border-border flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">{p.price_note || 'Mulai'}</p>
                      <p className="ota-price text-xl">{formatRupiah(p.price) ?? 'Hubungi kami'}</p>
                    </div>
                    <BookingDialog locationId={v?.id} locationName={v?.name}><Button className="rounded-xl font-extrabold">Pilih paket</Button></BookingDialog>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PriceList;
