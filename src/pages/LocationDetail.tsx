import { venuePath } from '@/lib/venue-url';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { MapPin, Users, Ruler, CalendarDays, Images, Check, MessageCircle, Share2, Navigation, Clock, Move3d } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations, useBallroomSchedules, usePortfoliosByLocation, useTrackVenueInterest, useVenueInterest, useSiteSettings } from '@/hooks/useCMS';
import { useVenuePackages, useVenueReviews, summarizeReviews, formatRupiah } from '@/hooks/useOta';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LocationFacilities } from '@/components/location/LocationFacilities';
import { LocationAreaSection } from '@/components/location/LocationAreaSection';
import { LocationLightbox } from '@/components/location/LocationLightbox';
import { Matterport360Embed } from '@/components/location/Matterport360Embed';
import { BookingDialog } from '@/components/booking/BookingDialog';
import { CMSImage } from '@/components/CMSImage';
import { Breadcrumbs, RatingStars, ReviewCard, EmptyState } from '@/components/ota/OtaKit';
import { waLinkFrom } from '@/components/layout/Navbar';
import { portfolioPath } from '@/lib/content-url';
import { useSEO } from '@/hooks/useSEO';
import { cn } from '@/lib/utils';

const Calendar = lazy(() => import('@/components/ui/calendar').then((m) => ({ default: m.Calendar })));
const SITE_URL = 'https://kediaman.co';

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'paket', label: 'Paket' },
  { id: 'fasilitas', label: 'Fasilitas' },
  { id: 'tata-letak', label: 'Tata letak' },
  { id: 'tur-360', label: 'Tur 360°' },
  { id: 'ulasan', label: 'Ulasan' },
  { id: 'dokumentasi', label: 'Dokumentasi' },
  { id: 'lokasi', label: 'Lokasi' },
];

function buildVenueDescription(name: string, category?: string | null, address?: string | null) {
  const details = [category, address].filter(Boolean).join(' di ');
  const description = `${name}${details ? `, venue ${details}` : ''}. Cek tanggal kosong, paket & harga, fasilitas, galeri, dan ulasan, lalu ajukan booking di Kediaman Corp.`;
  return description.length <= 160 ? description : `${description.slice(0, 157).trimEnd()}...`;
}

const LocationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: locations, isLoading } = useLocations();
  const location = locations?.find((l) => l.slug === id || l.id === id);
  const locationId = location?.id;
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [searchParams] = useSearchParams();
  const { data: schedules = [] } = useBallroomSchedules(locationId);
  const { data: portfolios = [] } = usePortfoliosByLocation(locationId);
  const { data: interest = {} } = useVenueInterest(locationId);
  const { data: packages = [] } = useVenuePackages(locationId);
  const { data: reviews = [] } = useVenueReviews(locationId);
  const { data: settings } = useSiteSettings();
  const trackInterest = useTrackVenueInterest();

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [tourStarted, setTourStarted] = useState(false);
  const [bookingPackageId, setBookingPackageId] = useState<string | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Kotak booking hanya dirender di satu tempat (samping di desktop, bawah konten di HP).
  // Sebelumnya dirender dua kali (satu disembunyikan CSS) sehingga popover kalender ikut terbuka dua kali.
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => { setIsDesktop(mql.matches); setCalendarOpen(false); };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  const initial = searchParams.get('date');
  const [date, setDate] = useState<Date | undefined>(initial && /^\d{4}-\d{2}-\d{2}$/.test(initial) ? parseISO(initial) : undefined);

  useEffect(() => {
    if (locationId) trackInterest.mutate({ locationId, eventType: 'venue_view' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  useEffect(() => {
    if (location?.slug && id !== location.slug) navigate(`${venuePath(location)}${routeLocation.search}${routeLocation.hash}`, { replace: true });
  }, [location?.slug, location?.id, id, navigate, routeLocation.search, routeLocation.hash, location]);

  const canonicalUrl = `${SITE_URL}${location ? venuePath(location) : `/lokasi/${id || ''}`}`;
  useSEO({
    title: location ? `${location.name} | Kediaman Corp` : 'Detail Venue | Kediaman Corp',
    description: location ? buildVenueDescription(location.name, location.category, location.address) : 'Detail venue Kediaman Corp: paket & harga, fasilitas, galeri, jadwal, dan ulasan.',
    image: location?.image_url || undefined,
    url: canonicalUrl,
    type: 'website',
    breadcrumbs: location ? [
      { name: 'Beranda', url: `${SITE_URL}/` },
      { name: 'Lokasi', url: `${SITE_URL}/lokasi` },
      { name: location.name, url: canonicalUrl },
    ] : [],
  });

  const images = useMemo(() => {
    if (!location) return [] as string[];
    if (location.images && location.images.length > 0) return location.images;
    return location.image_url ? [location.image_url] : [];
  }, [location]);

  const allImages = useMemo(() => {
    const imgs = [...images];
    if (location?.loading_area_images) imgs.push(...location.loading_area_images);
    if (location?.ballroom_layout_images) imgs.push(...location.ballroom_layout_images);
    const fi = location?.facility_items as { image_url?: string }[] | undefined;
    if (Array.isArray(fi)) fi.forEach((f) => { if (f?.image_url) imgs.push(f.image_url); });
    return imgs;
  }, [images, location]);

  const blockedDates = useMemo(() => new Set(schedules.filter((s) => s.status === 'booked' || s.status === 'blocked').map((s) => s.schedule_date)), [schedules]);
  const dateKey = date ? format(date, 'yyyy-MM-dd') : '';
  const dateFull = dateKey ? blockedDates.has(dateKey) : false;
  const activePackages = packages.filter((p) => p.is_active);
  const minPrice = activePackages.reduce<number | null>((m, p) => (p.price !== null && (m === null || p.price < m) ? p.price : m), null);
  const summary = summarizeReviews(reviews);
  const views = location ? interest[location.id]?.views ?? 0 : 0;
  const wa = waLinkFrom(settings);
  const facilityItems = (Array.isArray(location?.facility_items) ? location?.facility_items : []) as { name: string; image_url?: string; description?: string }[];
  const hasFacilities = (location?.facilities?.length ?? 0) > 0 || facilityItems.length > 0;
  const quickFacts = location ? [
    { icon: Users, label: 'Kapasitas', value: location.ballroom_layout_capacity },
    { icon: Ruler, label: 'Ukuran', value: location.ballroom_layout_dimensions },
    { icon: MapPin, label: 'Area', value: location.category },
    { icon: Clock, label: 'Area loading', value: location.loading_area_capacity },
  ].filter((f) => f.value) : [];
  const visibleTabs = TABS.filter((t) => {
    if (!location) return false;
    if (t.id === 'tur-360') return !!location.matterport_360_url;
    if (t.id === 'tata-letak') return !!(location.ballroom_layout_description || location.ballroom_layout_images?.length || location.loading_area_description);
    if (t.id === 'ulasan') return summary.count > 0;
    if (t.id === 'dokumentasi') return portfolios.length > 0;
    if (t.id === 'paket') return activePackages.length > 0;
    if (t.id === 'fasilitas') return hasFacilities;
    return true;
  });

  const handleLightboxNavigate = (direction: 'prev' | 'next') => {
    if (!lightboxImage) return;
    const i = allImages.indexOf(lightboxImage);
    if (i === -1) return;
    setLightboxImage(allImages[direction === 'prev' ? (i === 0 ? allImages.length - 1 : i - 1) : (i === allImages.length - 1 ? 0 : i + 1)]);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: location?.name, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* dibatalkan */ }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="ota-container py-6 space-y-4">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-8 w-96 max-w-full" />
          <Skeleton className="h-[320px] md:h-[420px] rounded-2xl" />
          <div className="grid lg:grid-cols-3 gap-6"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div>
        </div>
      </Layout>
    );
  }

  if (!location) {
    return (
      <Layout>
        <div className="ota-container py-16">
          <EmptyState title="Venue tidak ditemukan">
            <p>Venue yang Anda cari tidak tersedia.</p>
            <Link to="/lokasi" className="inline-flex mt-4 h-11 items-center px-5 rounded-xl bg-primary text-primary-foreground font-bold">Lihat semua venue</Link>
          </EmptyState>
        </div>
      </Layout>
    );
  }

  const bookingBox = (
    <div className="ota-card p-5 space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">Paket mulai</p>
        <p className="ota-price text-2xl">{formatRupiah(minPrice) ?? 'Hubungi kami'}</p>
      </div>
      {location.is_coming_soon ? (
        <p className="rounded-xl bg-accent text-accent-foreground text-sm p-3">Venue ini segera hadir. Hubungi tim kami untuk informasi pembukaan dan pemesanan awal.</p>
      ) : (
        <>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="ota-field w-full text-left">
                <span className="ota-field-label">Tanggal acara</span>
                <span className="flex items-center gap-2 font-bold min-h-7"><CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />{date ? format(date, 'EEEE, d MMM yyyy', { locale: idLocale }) : <span className="font-normal text-muted-foreground">Pilih tanggal</span>}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {calendarOpen && (
                <Suspense fallback={<div className="h-80 w-72 flex items-center justify-center" role="status">Memuat kalender…</div>}>
                  <Calendar
                    mode="single"
                    locale={idLocale}
                    selected={date}
                    onSelect={(d) => { setDate(d); setCalendarOpen(false); if (d) trackInterest.mutate({ locationId: location.id, eventType: 'date_click', scheduleDate: format(d, 'yyyy-MM-dd') }); }}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || blockedDates.has(format(d, 'yyyy-MM-dd'))}
                    initialFocus
                    className="p-3"
                  />
                </Suspense>
              )}
            </PopoverContent>
          </Popover>
          {date && (
            <p className={cn('inline-flex items-center h-7 px-2.5 rounded-full text-xs font-bold', dateFull ? 'ota-pill-full' : 'ota-pill-ok')}>{dateFull ? 'Tanggal sudah terisi' : 'Tanggal masih kosong'}</p>
          )}
          <Button className="w-full h-12 rounded-xl text-base font-extrabold" disabled={dateFull} onClick={() => { setBookingPackageId(undefined); setBookingOpen(true); }}>Ajukan booking</Button>
        </>
      )}
      <a href={wa} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-input font-bold hover:border-primary">
        <MessageCircle className="size-4" aria-hidden="true" />Tanya dulu via WhatsApp
      </a>
      <ul className="pt-3 border-t border-border space-y-1.5 text-sm text-muted-foreground">
        <li className="flex gap-2"><Check className="size-4 text-[hsl(var(--success))] shrink-0 mt-0.5" aria-hidden="true" />Gratis &amp; tanpa komitmen</li>
        <li className="flex gap-2"><Check className="size-4 text-[hsl(var(--success))] shrink-0 mt-0.5" aria-hidden="true" />Penawaran resmi dalam 1×24 jam</li>
        <li className="flex gap-2"><Check className="size-4 text-[hsl(var(--success))] shrink-0 mt-0.5" aria-hidden="true" />Tanggal terkunci setelah tanda jadi</li>
      </ul>
    </div>
  );

  return (
    <Layout>
      <div className="ota-container py-4 md:py-6">
        <Breadcrumbs items={[{ name: 'Venue', href: '/lokasi' }, { name: location.name }]} className="mb-3" />
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{location.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1.5"><MapPin className="size-4 shrink-0 mt-0.5" aria-hidden="true" />{location.address || location.category}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {summary.count > 0 && <a href="#ulasan" className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary"><RatingStars value={summary.average} />{summary.average.toFixed(1)} · {summary.count} ulasan</a>}
              {location.matterport_360_url && <a href="#tur-360" onClick={() => setTourStarted(true)} className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">Tur virtual 360°</a>}
              {views >= 10 && <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">Dilihat {views} kali dalam 7 hari</span>}
              {location.is_coming_soon && <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">Segera hadir</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={share}><Share2 className="size-4" />Bagikan</Button>
            {location.google_maps_url && <a href={location.google_maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-input text-sm font-bold"><Navigation className="size-4" />Peta</a>}
          </div>
        </div>

        {/* Galeri */}
        {images.length > 0 && (
          <div className="relative grid grid-cols-4 grid-rows-2 gap-2 h-[260px] sm:h-[360px] md:h-[420px] rounded-2xl overflow-hidden">
            {images.slice(0, 5).map((src, i) => (
              <button key={src + i} type="button" onClick={() => setLightboxImage(src)} className={cn('relative bg-muted overflow-hidden', i === 0 ? 'col-span-4 row-span-2 sm:col-span-2' : 'hidden sm:block')} aria-label={`Lihat foto ${i + 1}`}>
                <CMSImage src={src} imageWidth={i === 0 ? 1200 : 480} sizes={i === 0 ? '(max-width: 640px) 100vw, 600px' : '300px'} loading={i === 0 ? 'eager' : 'lazy'} alt={i === 0 ? location.name : ''} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                {i === Math.min(images.length, 5) - 1 && allImages.length > 1 && (
                  <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-lg bg-card/95 px-3 py-1.5 text-xs font-bold text-foreground"><Images className="size-4" aria-hidden="true" />Lihat {allImages.length} foto</span>
                )}
              </button>
            ))}
            {location.matterport_360_url && (
              <button
                type="button"
                onClick={() => { setTourStarted(true); document.getElementById('tur-360')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                className="absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-full bg-primary/90 backdrop-blur px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary"
              >
                <Move3d className="size-4" aria-hidden="true" />Tur virtual 360°
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab bagian */}
      <nav aria-label="Bagian halaman" className="sticky top-[7.25rem] md:top-16 lg:top-[6.25rem] z-30 bg-card border-y border-border">
        <div className="ota-container ota-scroll-x gap-6 text-sm font-bold">
          {visibleTabs.map((t) => <a key={t.id} href={`#${t.id}`} className="py-3 shrink-0 border-b-2 border-transparent hover:border-primary hover:text-primary">{t.label}</a>)}
        </div>
      </nav>

      <div className="ota-container py-6 flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-5 w-full">
          <section id="ringkasan" className="ota-card p-5 scroll-mt-48">
            <h2 className="text-lg font-extrabold mb-4">Sekilas venue</h2>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickFacts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl bg-muted p-3"><dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Icon className="size-3.5" aria-hidden="true" />{label}</dt><dd className="font-extrabold text-sm mt-0.5">{value}</dd></div>
              ))}
              <div className="rounded-xl bg-muted p-3"><dt className="text-xs text-muted-foreground flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />Sesi</dt><dd className="font-extrabold text-sm mt-0.5">Pagi · Malam</dd></div>
            </dl>
            {location.ballroom_layout_description && <p className="text-sm text-muted-foreground mt-4 whitespace-pre-line">{location.ballroom_layout_description}</p>}
          </section>

          {activePackages.length > 0 && (
            <section id="paket" className="ota-card p-5 scroll-mt-48">
              <h2 className="text-lg font-extrabold mb-4">Pilih paket</h2>
              <div className="space-y-3">
                {activePackages.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold flex items-center gap-2">{p.name}{p.is_featured && <span className="text-[11px] rounded-md bg-accent text-accent-foreground px-2 py-0.5">Terpopuler</span>}</p>
                      {(p.min_pax || p.max_pax) && <p className="text-xs text-muted-foreground mt-0.5">{p.min_pax && p.max_pax ? `${p.min_pax}–${p.max_pax} tamu` : `${p.min_pax || p.max_pax} tamu`}</p>}
                      {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                      {p.inclusions.length > 0 && (
                        <ul className="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {p.inclusions.map((inc) => <li key={inc} className="flex gap-2"><Check className="size-4 text-[hsl(var(--success))] shrink-0 mt-0.5" aria-hidden="true" />{inc}</li>)}
                        </ul>
                      )}
                    </div>
                    <div className="md:text-right md:w-44 shrink-0">
                      <p className="text-[11px] text-muted-foreground">{p.price_note || 'Mulai'}</p>
                      <p className="ota-price text-lg">{formatRupiah(p.price) ?? 'Hubungi kami'}</p>
                      {!location.is_coming_soon && <Button variant="outline" className="mt-2 rounded-xl border-primary font-bold" onClick={() => { setBookingPackageId(p.id); setBookingOpen(true); }}>Pilih paket</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasFacilities && (
            <section id="fasilitas" className="ota-card p-5 scroll-mt-48">
              <LocationFacilities facilities={location.facilities || []} facilityItems={facilityItems} onOpenLightbox={setLightboxImage} />
            </section>
          )}

          {visibleTabs.some((t) => t.id === 'tata-letak') && (
            <section id="tata-letak" className="ota-card p-5 space-y-8 scroll-mt-48">
              <LocationAreaSection title="Tata Letak Ballroom" description={location.ballroom_layout_description} capacity={location.ballroom_layout_capacity} dimensions={location.ballroom_layout_dimensions} images={location.ballroom_layout_images} onOpenLightbox={setLightboxImage} />
              <LocationAreaSection title="Area Logistik" description={location.loading_area_description} capacity={location.loading_area_capacity} dimensions={location.loading_area_dimensions} images={location.loading_area_images} onOpenLightbox={setLightboxImage} />
            </section>
          )}

          {location.matterport_360_url && (
            <section id="tur-360" className="ota-card p-5 scroll-mt-48">
              <Matterport360Embed url={location.matterport_360_url} poster={images[0]} venueName={location.name} started={tourStarted} onStartedChange={setTourStarted} />
            </section>
          )}

          {summary.count > 0 && (
            <section id="ulasan" className="ota-card p-5 scroll-mt-48">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h2 className="text-lg font-extrabold">Ulasan pasangan</h2>
                <span className="inline-flex items-center gap-2 text-sm"><span className="text-2xl font-extrabold text-primary">{summary.average.toFixed(1)}</span><RatingStars value={summary.average} /><span className="text-muted-foreground">{summary.count} ulasan</span></span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {reviews.slice(0, 4).map((r) => <ReviewCard key={r.id} review={r} showVenue={false} />)}
              </div>
              {summary.count > 4 && <Link to={`/ulasan?venue=${location.id}`} className="inline-block mt-4 text-sm font-bold text-primary">Lihat semua {summary.count} ulasan</Link>}
            </section>
          )}

          {portfolios.length > 0 && (
            <section id="dokumentasi" className="ota-card p-5 scroll-mt-48">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-extrabold">Dokumentasi acara di sini</h2>
                <span className="text-sm text-muted-foreground">{portfolios.length} acara</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {portfolios.slice(0, 8).map((p) => (
                  <Link key={p.id} to={portfolioPath(p)} className="group">
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted">
                      {p.photo_url && <CMSImage src={p.photo_url} imageWidth={360} sizes="(max-width: 768px) 50vw, 200px" alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <p className="mt-1.5 text-sm font-bold line-clamp-1">{p.name}</p>
                  </Link>
                ))}
              </div>
              {portfolios.length > 8 && <Link to="/portfolio" className="inline-block mt-4 text-sm font-bold text-primary">Lihat semua dokumentasi</Link>}
            </section>
          )}

          <section id="lokasi" className="ota-card p-5 scroll-mt-48">
            <h2 className="text-lg font-extrabold mb-3">Lokasi &amp; kontak</h2>
            {location.address && <p className="text-sm flex gap-2"><MapPin className="size-4 shrink-0 mt-0.5 text-muted-foreground" aria-hidden="true" />{location.address}</p>}
            <div className="flex flex-wrap gap-2 mt-4">
              {location.google_maps_url && <a href={location.google_maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-input text-sm font-bold"><Navigation className="size-4" />Buka Google Maps</a>}
              {location.phone && <a href={`tel:${location.phone}`} className="inline-flex items-center h-10 px-4 rounded-xl border border-input text-sm font-bold">{location.phone}</a>}
              {location.email && <a href={`mailto:${location.email}`} className="inline-flex items-center h-10 px-4 rounded-xl border border-input text-sm font-bold">{location.email}</a>}
            </div>
          </section>
        </div>

        {isDesktop && <aside className="w-[340px] shrink-0 sticky top-40">{bookingBox}</aside>}
      </div>

      {/* Bar booking menempel di HP */}
      {!location.is_coming_soon && (
        <div className="lg:hidden fixed inset-x-0 bottom-16 md:bottom-0 z-40 bg-card border-t border-border">
          <div className="ota-container py-3 flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Paket mulai</p>
              <p className="ota-price">{formatRupiah(minPrice) ?? 'Hubungi kami'}</p>
            </div>
            <Button className="ml-auto h-11 px-6 rounded-xl font-extrabold" onClick={() => { setBookingPackageId(undefined); setBookingOpen(true); }}>Ajukan booking</Button>
          </div>
        </div>
      )}
      {!isDesktop && <div className="ota-container pb-24">{bookingBox}</div>}

      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} locationId={location.id} locationName={location.name} initialDate={dateKey || undefined} initialPackageId={bookingPackageId} />
      <LocationLightbox image={lightboxImage} images={allImages} onClose={() => setLightboxImage(null)} onNavigate={handleLightboxNavigate} />
    </Layout>
  );
};

export default LocationDetail;
