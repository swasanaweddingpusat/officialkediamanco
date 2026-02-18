import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations, useBallroomSchedules, usePortfoliosByLocation } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { isBefore, startOfToday } from 'date-fns';

import { LocationHeroGallery } from '@/components/location/LocationHeroGallery';
import { LocationFacilities } from '@/components/location/LocationFacilities';
import { LocationGalleryGrid } from '@/components/location/LocationGalleryGrid';
import { LocationAreaSection } from '@/components/location/LocationAreaSection';
import { LocationScheduleSection } from '@/components/location/LocationScheduleSection';
import { LocationContactCard } from '@/components/location/LocationContactCard';
import { LocationLightbox } from '@/components/location/LocationLightbox';
import { LocationPortfolioSection } from '@/components/location/LocationPortfolioSection';
import { Matterport360Embed } from '@/components/location/Matterport360Embed';

const LocationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: locations, isLoading } = useLocations();
  const { data: schedules = [] } = useBallroomSchedules(id);
  const { data: portfolios = [] } = usePortfoliosByLocation(id);
  
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);

  const location = locations?.find(l => l.id === id);

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
          <div className="container mx-auto px-6 lg:px-12">
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
    <Layout>
      {/* Back + Breadcrumb */}
      <div className="pt-8 lg:pt-12 pb-4">
        <div className="container mx-auto px-6 lg:px-12">
          <Link to="/lokasi" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Kembali ke Lokasi
          </Link>
        </div>
      </div>

      {/* Hero Gallery */}
      <section className="pb-8">
        <div className="container mx-auto px-6 lg:px-12">
          <LocationHeroGallery
            images={images}
            locationName={location.name}
            selectedImageIndex={selectedImageIndex}
            isComingSoon={location.is_coming_soon || false}
            onSelectImage={setSelectedImageIndex}
            onOpenLightbox={setLightboxImage}
          />
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 lg:pb-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {location.category && (
                  <span className="text-primary text-[10px] tracking-[0.2em] uppercase">
                    {location.category}
                  </span>
                )}
                <h1 className="font-serif text-3xl lg:text-5xl tracking-tight font-bold">
                  {location.name}
                </h1>
                {location.address && (
                  <div className="flex items-start gap-2 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{location.address}</span>
                  </div>
                )}
              </motion.div>

              <LocationFacilities facilities={location.facilities || []} />
              <LocationGalleryGrid images={images} onOpenLightbox={setLightboxImage} />
              <LocationAreaSection title="Loading Area" description={location.loading_area_description} capacity={location.loading_area_capacity} dimensions={location.loading_area_dimensions} images={location.loading_area_images} onOpenLightbox={setLightboxImage} />
              <LocationAreaSection title="Ballroom Layout" description={location.ballroom_layout_description} capacity={location.ballroom_layout_capacity} dimensions={location.ballroom_layout_dimensions} images={location.ballroom_layout_images} onOpenLightbox={setLightboxImage} />
              {(location as any).matterport_360_url && <Matterport360Embed url={(location as any).matterport_360_url} />}
              <LocationScheduleSection schedules={upcomingSchedules} />
              <LocationPortfolioSection portfolios={portfolios} onOpenLightbox={setLightboxImage} />
            </div>

            <div>
              <LocationContactCard location={location} bookingOpen={bookingOpen} onBookingChange={setBookingOpen} />
            </div>
          </div>
        </div>
      </section>

      <LocationLightbox image={lightboxImage} images={allImages} onClose={() => setLightboxImage(null)} onNavigate={handleLightboxNavigate} />
    </Layout>
  );
};

export default LocationDetail;
