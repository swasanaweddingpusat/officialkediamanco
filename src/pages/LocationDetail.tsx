import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ChevronLeft, X, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const LocationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: locations, isLoading } = useLocations();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const location = locations?.find(l => l.id === id);

  const getImages = () => {
    if (!location) return [];
    if (location.images && location.images.length > 0) return location.images;
    if (location.image_url) return [location.image_url];
    return [];
  };

  const images = getImages();

  if (isLoading) {
    return (
      <Layout>
        <section className="pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6">
            <Skeleton className="h-8 w-32 mb-4 sm:mb-6" />
            <Skeleton className="h-[200px] sm:h-[300px] md:h-[400px] rounded-xl sm:rounded-2xl mb-6 sm:mb-8" />
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              <Skeleton className="h-48 sm:h-64" />
              <Skeleton className="h-48 sm:h-64" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!location) {
    return (
      <Layout>
        <section className="pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h1 className="font-display text-3xl sm:text-4xl mb-4">Location Not Found</h1>
            <p className="text-muted-foreground mb-6 sm:mb-8">
              The location you're looking for doesn't exist.
            </p>
            <Link to="/locations">
              <Button>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Locations
              </Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Back Button */}
      <section className="pt-16 sm:pt-20 md:pt-24 pb-2 sm:pb-4">
        <div className="container mx-auto px-4 sm:px-6">
          <Link to="/locations">
            <Button variant="ghost" className="gap-2 -ml-2 sm:ml-0 text-sm sm:text-base">
              <ChevronLeft className="w-4 h-4" />
              Back to Locations
            </Button>
          </Link>
        </div>
      </section>

      {/* Hero Image Gallery */}
      <section className="pb-4 sm:pb-6 md:pb-8">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 sm:space-y-4"
          >
            {/* Main Image */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-xl sm:rounded-2xl bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIndex]}
                  alt={location.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxImage(images[selectedImageIndex])}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <MapPin className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-30" />
                </div>
              )}

              {/* Coming Soon Badge */}
              {location.is_coming_soon && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-4 py-2 sm:px-6 sm:py-3 bg-accent text-accent-foreground font-bold text-xs sm:text-sm rounded-full">
                  Coming Soon
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 md:w-24 md:h-16 rounded-md sm:rounded-lg overflow-hidden transition-all ${
                      selectedImageIndex === i
                        ? 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Location Info */}
      <section className="pb-12 sm:pb-16 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6 md:space-y-8"
            >
              {/* Header */}
              <div>
                <Badge variant="outline" className="mb-3 sm:mb-4 border-primary text-primary text-xs sm:text-sm">
                  {location.category || 'Jakarta Selatan'}
                </Badge>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">{location.name}</h1>
                {location.address && (
                  <div className="flex items-start gap-2 sm:gap-3 text-muted-foreground">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
                    <span className="text-sm sm:text-base md:text-lg">{location.address}</span>
                  </div>
                )}
              </div>

              {/* Facilities */}
              {location.facilities && location.facilities.length > 0 && (
                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h2 className="font-display text-xl sm:text-2xl mb-3 sm:mb-4">Facilities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                    {location.facilities.map((facility, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-secondary rounded-lg"
                      >
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium line-clamp-1">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery Grid */}
              {images.length > 1 && (
                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h2 className="font-display text-xl sm:text-2xl mb-3 sm:mb-4">Gallery</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    {images.map((img, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setLightboxImage(img)}
                        className="aspect-square rounded-lg sm:rounded-xl overflow-hidden hover:ring-2 ring-primary transition-all"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading Area Section */}
              {(location.loading_area_images?.length > 0 || location.loading_area_description) && (
                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h2 className="font-display text-xl sm:text-2xl mb-3 sm:mb-4">Loading Area</h2>
                  {location.loading_area_description && (
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                      {location.loading_area_description}
                    </p>
                  )}
                  {location.loading_area_images && location.loading_area_images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {location.loading_area_images.map((img, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setLightboxImage(img)}
                          className="aspect-square rounded-lg sm:rounded-xl overflow-hidden hover:ring-2 ring-primary transition-all"
                        >
                          <img src={img} alt={`Loading Area ${i + 1}`} className="w-full h-full object-cover" />
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ballroom Layout Section */}
              {(location.ballroom_layout_images?.length > 0 || location.ballroom_layout_description) && (
                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h2 className="font-display text-xl sm:text-2xl mb-3 sm:mb-4">Ballroom Layout</h2>
                  {location.ballroom_layout_description && (
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                      {location.ballroom_layout_description}
                    </p>
                  )}
                  {location.ballroom_layout_images && location.ballroom_layout_images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {location.ballroom_layout_images.map((img, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setLightboxImage(img)}
                          className="aspect-square rounded-lg sm:rounded-xl overflow-hidden hover:ring-2 ring-primary transition-all"
                        >
                          <img src={img} alt={`Ballroom Layout ${i + 1}`} className="w-full h-full object-cover" />
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Contact Card */}
              <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:sticky lg:top-24">
                <h3 className="font-display text-lg sm:text-xl mb-3 sm:mb-4">Contact Information</h3>

                <div className="space-y-3 sm:space-y-4">
                  {location.phone && (
                    <a
                      href={`tel:${location.phone}`}
                      className="flex items-center gap-2 sm:gap-3 text-muted-foreground hover:text-primary transition-colors text-sm sm:text-base"
                    >
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <span className="break-all">{location.phone}</span>
                    </a>
                  )}

                  {location.email && (
                    <a
                      href={`mailto:${location.email}`}
                      className="flex items-center gap-2 sm:gap-3 text-muted-foreground hover:text-primary transition-colors text-sm sm:text-base"
                    >
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <span className="break-all">{location.email}</span>
                    </a>
                  )}

                  {location.operating_hours && (
                    <div className="flex items-start gap-2 sm:gap-3 text-muted-foreground text-sm sm:text-base">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        {typeof location.operating_hours === 'object' ? (
                          <pre className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                            {JSON.stringify(location.operating_hours, null, 2)}
                          </pre>
                        ) : (
                          <span>{String(location.operating_hours)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Map Link */}
                {location.google_maps_url && !location.is_coming_soon && (
                  <a
                    href={location.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 sm:mt-6 block"
                  >
                    <Button className="w-full gap-2 text-sm sm:text-base">
                      <ExternalLink className="w-4 h-4" />
                      View in Google Maps
                    </Button>
                  </a>
                )}

                {location.is_coming_soon && (
                  <div className="mt-4 sm:mt-6 text-center">
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      This location is coming soon
                    </Badge>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-secondary rounded-full z-10"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Gallery"
              className="max-w-full max-h-[85vh] sm:max-h-[90vh] rounded-lg object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default LocationDetail;
