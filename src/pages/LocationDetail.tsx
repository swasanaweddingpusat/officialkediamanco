import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations, useBallroomSchedules } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isBefore, startOfToday } from 'date-fns';

// Location detail components
import { LocationHeroGallery } from '@/components/location/LocationHeroGallery';
import { LocationFacilities } from '@/components/location/LocationFacilities';
import { LocationGalleryGrid } from '@/components/location/LocationGalleryGrid';
import { LocationAreaSection } from '@/components/location/LocationAreaSection';
import { LocationScheduleSection } from '@/components/location/LocationScheduleSection';
import { LocationContactCard } from '@/components/location/LocationContactCard';
import { LocationLightbox } from '@/components/location/LocationLightbox';

const LocationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: locations, isLoading } = useLocations();
  const { data: schedules = [] } = useBallroomSchedules(id);
  
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);

  const location = locations?.find(l => l.id === id);

  // Memoized values
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
    return imgs;
  }, [images, location]);

  const upcomingSchedules = useMemo(() => 
    schedules.filter(s => !isBefore(new Date(s.schedule_date), startOfToday())),
    [schedules]
  );

  const handleLightboxNavigate = (direction: 'prev' | 'next') => {
    if (!lightboxImage) return;
    const currentIndex = allImages.indexOf(lightboxImage);
    if (currentIndex === -1) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === allImages.length - 1 ? 0 : currentIndex + 1;
    }
    setLightboxImage(allImages[newIndex]);
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <section className="pt-20 md:pt-24 pb-16 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6">
            <Skeleton className="h-8 w-40 mb-6" />
            <Skeleton className="h-[300px] md:h-[400px] rounded-2xl mb-6" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-32" />
                <Skeleton className="h-64" />
              </div>
              <Skeleton className="h-80" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Not found state
  if (!location) {
    return (
      <Layout>
        <section className="pt-20 md:pt-24 pb-16 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="w-10 h-10 text-muted-foreground" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl mb-4">Lokasi Tidak Ditemukan</h1>
              <p className="text-muted-foreground mb-8">
                Lokasi yang Anda cari tidak tersedia atau telah dihapus.
              </p>
              <Link to="/locations">
                <Button size="lg">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Kembali ke Lokasi
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Back Button */}
      <section className="pt-20 md:pt-24 pb-4">
        <div className="container mx-auto px-4 sm:px-6">
          <Link to="/locations">
            <Button variant="ghost" className="gap-2 -ml-3 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Lokasi
            </Button>
          </Link>
        </div>
      </section>

      {/* Hero Gallery */}
      <section className="pb-6 md:pb-8">
        <div className="container mx-auto px-4 sm:px-6">
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
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    {location.category || 'Jakarta Selatan'}
                  </Badge>
                  {location.is_coming_soon && (
                    <Badge variant="secondary">Coming Soon</Badge>
                  )}
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight">
                  {location.name}
                </h1>
                {location.address && (
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{location.address}</span>
                  </div>
                )}
              </motion.div>

              {/* Facilities */}
              <LocationFacilities facilities={location.facilities || []} />

              {/* Main Gallery */}
              <LocationGalleryGrid 
                images={images} 
                onOpenLightbox={setLightboxImage} 
              />

              {/* Loading Area */}
              <LocationAreaSection
                title="Loading Area"
                description={location.loading_area_description}
                capacity={location.loading_area_capacity}
                dimensions={location.loading_area_dimensions}
                images={location.loading_area_images}
                onOpenLightbox={setLightboxImage}
              />

              {/* Ballroom Layout */}
              <LocationAreaSection
                title="Ballroom Layout"
                description={location.ballroom_layout_description}
                capacity={location.ballroom_layout_capacity}
                dimensions={location.ballroom_layout_dimensions}
                images={location.ballroom_layout_images}
                onOpenLightbox={setLightboxImage}
              />

              {/* Schedule */}
              <LocationScheduleSection schedules={upcomingSchedules} />
            </div>

            {/* Sidebar */}
            <div>
              <LocationContactCard
                location={location}
                bookingOpen={bookingOpen}
                onBookingChange={setBookingOpen}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <LocationLightbox
        image={lightboxImage}
        images={allImages}
        onClose={() => setLightboxImage(null)}
        onNavigate={handleLightboxNavigate}
      />
    </Layout>
  );
};

export default LocationDetail;
