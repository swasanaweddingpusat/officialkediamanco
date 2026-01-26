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
        <section className="pt-24 pb-20">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-[400px] rounded-2xl mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!location) {
    return (
      <Layout>
        <section className="pt-24 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl mb-4">Location Not Found</h1>
            <p className="text-muted-foreground mb-8">
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
      <section className="pt-24 pb-4">
        <div className="container mx-auto px-4">
          <Link to="/locations">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Locations
            </Button>
          </Link>
        </div>
      </section>

      {/* Hero Image Gallery */}
      <section className="pb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIndex]}
                  alt={location.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxImage(images[selectedImageIndex])}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <MapPin className="w-20 h-20 opacity-30" />
                </div>
              )}

              {/* Coming Soon Badge */}
              {location.is_coming_soon && (
                <div className="absolute top-4 right-4 px-6 py-3 bg-accent text-accent-foreground font-bold rounded-full">
                  Coming Soon
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden transition-all ${
                      selectedImageIndex === i
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
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
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Header */}
              <div>
                <Badge variant="outline" className="mb-4 border-primary text-primary">
                  {location.category || 'Jakarta Selatan'}
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl mb-4">{location.name}</h1>
                {location.address && (
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span className="text-lg">{location.address}</span>
                  </div>
                )}
              </div>

              {/* Facilities */}
              {location.facilities && location.facilities.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="font-display text-2xl mb-4">Facilities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {location.facilities.map((facility, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-4 py-3 bg-secondary rounded-lg"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm font-medium">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery Grid */}
              {images.length > 1 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="font-display text-2xl mb-4">Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((img, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setLightboxImage(img)}
                        className="aspect-square rounded-xl overflow-hidden hover:ring-2 ring-primary transition-all"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Contact Card */}
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
                <h3 className="font-display text-xl mb-4">Contact Information</h3>
                
                <div className="space-y-4">
                  {location.phone && (
                    <a
                      href={`tel:${location.phone}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="w-5 h-5 text-primary" />
                      <span>{location.phone}</span>
                    </a>
                  )}

                  {location.email && (
                    <a
                      href={`mailto:${location.email}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="w-5 h-5 text-primary" />
                      <span>{location.email}</span>
                    </a>
                  )}

                  {location.operating_hours && (
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        {typeof location.operating_hours === 'object' ? (
                          <pre className="text-sm whitespace-pre-wrap">
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
                    className="mt-6 block"
                  >
                    <Button className="w-full gap-2">
                      <ExternalLink className="w-4 h-4" />
                      View in Google Maps
                    </Button>
                  </a>
                )}

                {location.is_coming_soon && (
                  <div className="mt-6 text-center">
                    <Badge variant="secondary" className="text-sm">
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
            className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 bg-secondary rounded-full"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Gallery"
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default LocationDetail;
