import { venuePath } from '@/lib/venue-url';
import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations, useBallroomSchedules, usePortfoliosByLocation, useTrackVenueInterest, useVenueInterest } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { isBefore, startOfToday } from 'date-fns';

import { LocationNetflixHero } from '@/components/location/LocationNetflixHero';
import { LocationFacilities } from '@/components/location/LocationFacilities';
import { LocationGalleryGrid } from '@/components/location/LocationGalleryGrid';
import { LocationAreaSection } from '@/components/location/LocationAreaSection';
import { LocationScheduleSection } from '@/components/location/LocationScheduleSection';
import { LocationContactCard } from '@/components/location/LocationContactCard';
import { LocationLightbox } from '@/components/location/LocationLightbox';
import { LocationPortfolioSection } from '@/components/location/LocationPortfolioSection';
import { Matterport360Embed } from '@/components/location/Matterport360Embed';
import { useRef } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { VenueInterestBadge } from '@/components/venue/VenueInterestBadge';

const SITE_URL = 'https://official.kediaman.co';

function buildVenueDescription(name: string, category?: string | null, address?: string | null) {
  const details = [category, address].filter(Boolean).join(' di ');
  const description = `Temukan ${name}${details ? `, venue ${details}` : ''}. Lihat fasilitas, galeri, jadwal tersedia, dan ajukan pemesanan langsung di Kediaman Corp.`;
  return description.length <= 160 ? description : `${description.slice(0, 157).trimEnd()}...`;
}

const LocationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: locations, isLoading } = useLocations();
  const location = locations?.find(l => l.slug === id || l.id === id);
  const locationId = location?.id;
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const { data: schedules = [] } = useBallroomSchedules(locationId);
  const { data: portfolios = [] } = usePortfoliosByLocation(locationId);
  const { data: interest = {} } = useVenueInterest(locationId);
  const trackInterest = useTrackVenueInterest();
  
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  const activePromo = schedules.find((schedule) => schedule.promo_type && (!schedule.promo_expires_at || new Date(schedule.promo_expires_at) >= new Date()));

  useEffect(() => {
    if (locationId) trackInterest.mutate({ locationId, eventType: 'venue_view' });
    // One event is deduplicated per visitor and day by the database.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  useEffect(() => {
    if (location?.slug && id !== location.slug) {
      navigate(`${venuePath(location)}${routeLocation.search}${routeLocation.hash}`, { replace: true });
    }
  }, [location?.slug, location?.id, id, navigate, routeLocation.search, routeLocation.hash]);

  const canonicalUrl = `${SITE_URL}${location ? venuePath(location) : `/lokasi/${id || ''}`}`;
  useSEO({
    title: location ? `${location.name} | Kediaman Corp` : 'Detail Venue | Kediaman Corp',
    description: location
      ? buildVenueDescription(location.name, location.category, location.address)
      : 'Lihat detail venue Kediaman Corp, fasilitas, galeri, jadwal tersedia, dan informasi pemesanan.',
    image: location?.image_url || undefined,
    url: canonicalUrl,
    type: 'website',
    breadcrumbs: location
      ? [
          { name: 'Beranda', url: `${SITE_URL}/` },
          { name: 'Lokasi', url: `${SITE_URL}/lokasi` },
          { name: location.name, url: canonicalUrl },
        ]
      : [],
  });

  const images = useMemo(() => {
    if (!location) return [];
    if (location.images && location.images.length > 0) return location.images;
    if (location.image_url) return [location.image_url];
    return [];
  }, [location]);

  const allImages = useMemo(() => {
    const imgs = [...images];
    if (location?.loading_area_images) imgs.push(...location.loading_area_images);
    if (location?.ballroom_layout_images) imgs.push(...location.ballroom_layout_images);
    const fi = location?.facility_items as { image_url?: string }[] | undefined;
    if (Array.isArray(fi)) fi.forEach(f => { if (f?.image_url) imgs.push(f.image_url); });
    portfolios.forEach(p => { if (p.images) imgs.push(...p.images); });
    return imgs;
  }, [images, location, portfolios]);

  const upcomingSchedules = useMemo(() => 
    schedules.filter(s => !isBefore(new Date(s.schedule_date), startOfToday())),
    [schedules]
  );

  const handleLightboxNavigate = (direction: 'prev' | 'next') => {
    if (!lightboxImage) return;
    const currentIndex = allImages.indexOf(lightboxImage);
    if (currentIndex === -1) return;
    const newIndex = direction === 'prev'
      ? (currentIndex === 0 ? allImages.length - 1 : currentIndex - 1)
      : (currentIndex === allImages.length - 1 ? 0 : currentIndex + 1);
    setLightboxImage(allImages[newIndex]);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-16 lg:pt-24 pb-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <Skeleton className="h-6 w-32 mb-8" />
            <Skeleton className="h-[300px] lg:h-[500px] rounded-sm mb-8" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-24" />
                <Skeleton className="h-48" />
              </div>
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!location) {
    return (
      <Layout>
        <div className="pt-32 pb-32">
          <div className="container mx-auto px-6 lg:px-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
            <h1 className="font-serif text-3xl lg:text-4xl mb-4 font-bold">Lokasi Tidak Ditemukan</h1>
            <p className="text-muted-foreground mb-8">Lokasi yang Anda cari tidak tersedia.</p>
            <Link to="/lokasi">
              <Button className="rounded-full px-6 text-sm tracking-[0.05em] uppercase">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="venue-detail"><Layout>
      {/* Netflix-style Hero with optional video overlay */}
      <LocationNetflixHero
        videoUrl={location.hero_video_url}
        posterImage={images[0]}
        locationName={location.name}
        category={location.category}
        address={location.address}
        isComingSoon={location.is_coming_soon || false}
        onBook={location.is_coming_soon ? undefined : () => setBookingOpen(true)}
        onScrollToDetails={() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      {/* Back link */}
      <div className="pt-8 pb-2">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Link to="/lokasi" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Kembali ke Lokasi
          </Link>
        </div>
      </div>

      {/* Content */}
      <section ref={detailsRef} className="pt-8 pb-24 lg:pt-12 lg:pb-32 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-8 min-w-0 space-y-16 lg:space-y-24">
              <LocationGalleryGrid images={images} venueName={location.name} onOpenLightbox={setLightboxImage} />
              <LocationFacilities
                facilities={location.facilities || []}
                facilityItems={(Array.isArray(location.facility_items) ? location.facility_items : []) as { name: string; image_url?: string; description?: string }[]}
                onOpenLightbox={setLightboxImage}
              />
              <LocationAreaSection title="Area Logistik" description={location.loading_area_description} capacity={location.loading_area_capacity} dimensions={location.loading_area_dimensions} images={location.loading_area_images} onOpenLightbox={setLightboxImage} />
              <LocationAreaSection title="Tata Letak Ballroom" description={location.ballroom_layout_description} capacity={location.ballroom_layout_capacity} dimensions={location.ballroom_layout_dimensions} images={location.ballroom_layout_images} onOpenLightbox={setLightboxImage} />
              {location.matterport_360_url && <Matterport360Embed url={location.matterport_360_url} />}
              <LocationScheduleSection schedules={upcomingSchedules} />
              <LocationPortfolioSection portfolios={portfolios} onOpenLightbox={setLightboxImage} />
            </div>

            <aside className="lg:col-span-4 min-w-0">
              <div className="lg:sticky lg:top-28 space-y-8">
              <VenueInterestBadge
                views={interest[location.id]?.views}
                promoLabel={activePromo?.promo_label || (activePromo?.promo_type === 'limited_offer' ? 'Limited Offer' : activePromo?.promo_type ? 'Special Offer' : null)}
                className="mb-4"
              />
              <LocationContactCard location={location} bookingOpen={bookingOpen} onBookingChange={setBookingOpen} />
              {(location.ballroom_layout_capacity || location.ballroom_layout_dimensions || location.facilities?.length) ? (
                <section className="border border-primary/15 bg-primary/5 p-6 lg:p-8">
                  <h3 className="font-serif text-2xl italic mb-5">Fasilitas Unggulan</h3>
                  <dl className="space-y-3 text-sm">
                    {location.ballroom_layout_capacity && <div className="flex justify-between gap-4 border-b border-primary/10 pb-3"><dt>Kapasitas</dt><dd className="text-primary text-right">{location.ballroom_layout_capacity}</dd></div>}
                    {location.ballroom_layout_dimensions && <div className="flex justify-between gap-4 border-b border-primary/10 pb-3"><dt>Ukuran</dt><dd className="text-primary text-right">{location.ballroom_layout_dimensions}</dd></div>}
                    {location.facilities?.slice(0, 5).map(f => <div key={f} className="border-b border-primary/10 pb-3">{f}</div>)}
                  </dl>
                </section>
              ) : null}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <LocationLightbox image={lightboxImage} images={allImages} onClose={() => setLightboxImage(null)} onNavigate={handleLightboxNavigate} />
    </Layout></div>
  );
};

export default LocationDetail;
