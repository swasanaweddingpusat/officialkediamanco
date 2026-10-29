// Halaman baru: Ulasan pasangan (data dari CMS "Ulasan", hanya yang sudah diterbitkan).
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useVenueReviews, summarizeReviews } from '@/hooks/useOta';
import { useLocations } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, ReviewCard, RatingStars, EmptyState } from '@/components/ota/OtaKit';

const Reviews = () => {
  const { data: reviews = [], isLoading } = useVenueReviews();
  const { data: locations = [] } = useLocations();
  const [params, setParams] = useSearchParams();
  const venue = params.get('venue') || '';
  const [star, setStar] = useState(0);

  useSEO({
    title: 'Ulasan Pasangan | Kediaman Corp',
    description: 'Cerita dan penilaian pasangan yang sudah menikah di ballroom Kediaman.',
    url: 'https://kediaman.co/ulasan',
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Ulasan', url: 'https://kediaman.co/ulasan' }],
  });

  const byVenue = venue ? reviews.filter((r) => r.location_id === venue) : reviews;
  const summary = summarizeReviews(byVenue);
  const shown = star ? byVenue.filter((r) => r.rating === star) : byVenue;
  const venues = useMemo(() => locations.filter((l) => reviews.some((r) => r.location_id === l.id)), [locations, reviews]);

  return (
    <Layout>
      <PageHeader title="Ulasan pasangan" subtitle="Cerita dari pasangan yang merayakan hari besarnya di Kediaman." crumbs={[{ name: 'Ulasan' }]}>
        {venues.length > 0 && (
          <div className="ota-scroll-x mt-4">
            <button type="button" className="ota-chip" aria-pressed={!venue} onClick={() => setParams({})}>Semua venue</button>
            {venues.map((v) => <button key={v.id} type="button" className="ota-chip" aria-pressed={venue === v.id} onClick={() => setParams({ venue: v.id })}>{v.name}</button>)}
          </div>
        )}
      </PageHeader>

      <div className="ota-container py-6 flex flex-col lg:flex-row gap-6 items-start">
        <aside className="w-full lg:w-72 shrink-0 ota-card p-5 lg:sticky lg:top-40">
          <p className="text-4xl font-extrabold text-primary">{summary.count ? summary.average.toFixed(1) : '–'}</p>
          <RatingStars value={summary.average} size="md" className="mt-1" />
          <p className="text-sm text-muted-foreground mt-1">{summary.count} ulasan</p>
          <div className="mt-4 space-y-1.5">
            {summary.byStar.map(({ star: s, count }) => (
              <button key={s} type="button" onClick={() => setStar(star === s ? 0 : s)} aria-pressed={star === s} className="w-full flex items-center gap-2 text-sm rounded-lg px-1.5 py-1 hover:bg-muted aria-pressed:bg-secondary">
                <span className="w-6 font-bold">{s}★</span>
                <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><span className="block h-full bg-[hsl(var(--gold))]" style={{ width: `${summary.count ? (count / summary.count) * 100 : 0}%` }} /></span>
                <span className="w-8 text-right text-muted-foreground">{count}</span>
              </button>
            ))}
          </div>
        </aside>
        <div className="flex-1 min-w-0 w-full">
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
          ) : shown.length === 0 ? (
            <EmptyState title="Belum ada ulasan">Ulasan pasangan akan tampil di sini setelah diterbitkan tim Kediaman.</EmptyState>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">{shown.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reviews;
