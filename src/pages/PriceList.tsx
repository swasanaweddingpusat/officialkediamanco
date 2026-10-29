// Halaman baru: Paket & Harga semua venue (data dari CMS "Paket & Harga").
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useLocations } from '@/hooks/useCMS';
import { useVenuePackages, type VenuePackage } from '@/hooks/useOta';
import { useSEO } from '@/hooks/useSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BookingDialog } from '@/components/booking/BookingDialog';
import { PageHeader, EmptyState, venueImage } from '@/components/ota/OtaKit';
import { PackageCard } from '@/components/ota/PackageCard';
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {list.map((p) => {
              const v = venueOf(p);
              return (
                <PackageCard
                  key={p.id}
                  pkg={p}
                  venueName={v?.name}
                  venueHref={v ? venuePath(v) : undefined}
                  fallbackImage={v ? venueImage(v) : null}
                  action={<BookingDialog locationId={v?.id} locationName={v?.name} initialPackageId={p.id}><Button className="h-11 rounded-xl px-5 font-extrabold">Pilih paket</Button></BookingDialog>}
                />
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PriceList;
