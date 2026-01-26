import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Play, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import gymInterior from '@/assets/gym-interior.jpg';

const LOCATION_CATEGORIES = ['Semua', 'Jakarta Selatan', 'Jakarta Timur', 'Bintaro', 'Bandung'] as const;

const Locations = () => {
  const { data: locations, isLoading } = useLocations();
  const [expandedGallery, setExpandedGallery] = useState<string | null>(null);
  const [expandedFacilities, setExpandedFacilities] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const activeLocations = locations?.filter(l => l.is_active) || [];
  
  const filteredLocations = useMemo(() => {
    if (selectedCategory === 'Semua') return activeLocations;
    return activeLocations.filter(l => l.category === selectedCategory);
  }, [activeLocations, selectedCategory]);

  const comingSoonLocations = filteredLocations.filter(l => l.is_coming_soon);
  const openLocations = filteredLocations.filter(l => !l.is_coming_soon);

  const toggleGallery = (id: string) => {
    setExpandedGallery(expandedGallery === id ? null : id);
  };

  const toggleFacilities = (id: string) => {
    setExpandedFacilities(expandedFacilities === id ? null : id);
  };

  const getImages = (location: typeof activeLocations[0]) => {
    if (location.images && location.images.length > 0) return location.images;
    if (location.image_url) return [location.image_url];
    return [gymInterior];
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-20 pb-10 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-primary font-semibold tracking-widest uppercase mb-2">FTL CLUB</p>
            <h1 className="font-display text-5xl md:text-7xl mb-4">
              OUR <span className="text-gradient">LOCATIONS</span>
            </h1>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mt-8"
          >
            {LOCATION_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="py-8 pb-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[420px] rounded-2xl" />
              ))}
            </div>
          ) : openLocations.length > 0 || comingSoonLocations.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Open Locations */}
                {openLocations.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {openLocations.map((location, index) => (
                      <LocationCard
                        key={location.id}
                        location={location}
                        index={index}
                        images={getImages(location)}
                        expandedGallery={expandedGallery}
                        expandedFacilities={expandedFacilities}
                        onToggleGallery={toggleGallery}
                        onToggleFacilities={toggleFacilities}
                        onImageClick={setLightboxImage}
                      />
                    ))}
                  </div>
                )}

                {/* Coming Soon */}
                {comingSoonLocations.length > 0 && (
                  <>
                    <h2 className="font-display text-3xl text-center mb-8">
                      <span className="text-muted-foreground">COMING</span> SOON
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {comingSoonLocations.map((location, index) => (
                        <LocationCard
                          key={location.id}
                          location={location}
                          index={index}
                          images={getImages(location)}
                          expandedGallery={expandedGallery}
                          expandedFacilities={expandedFacilities}
                          onToggleGallery={toggleGallery}
                          onToggleFacilities={toggleFacilities}
                          onImageClick={setLightboxImage}
                          isComingSoon
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {selectedCategory === 'Semua' 
                  ? 'No locations available yet.' 
                  : `Tidak ada lokasi di ${selectedCategory}.`}
              </p>
            </div>
          )}
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

interface LocationCardProps {
  location: {
    id: string;
    name: string;
    address: string | null;
    google_maps_url: string | null;
    image_url: string | null;
    images: string[] | null;
    facilities: string[] | null;
    is_coming_soon: boolean | null;
    category: string | null;
  };
  index: number;
  images: string[];
  expandedGallery: string | null;
  expandedFacilities: string | null;
  onToggleGallery: (id: string) => void;
  onToggleFacilities: (id: string) => void;
  onImageClick: (url: string) => void;
  isComingSoon?: boolean;
}

const LocationCard = ({
  location,
  index,
  images,
  expandedGallery,
  expandedFacilities,
  onToggleGallery,
  onToggleFacilities,
  onImageClick,
  isComingSoon,
}: LocationCardProps) => {
  const isGalleryExpanded = expandedGallery === location.id;
  const isFacilitiesExpanded = expandedFacilities === location.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border"
    >
      {/* Main Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={images[0]}
          alt={location.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* View in Maps overlay */}
        {location.google_maps_url && !isComingSoon && (
          <a
            href={location.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-full hover:bg-primary/90 transition-colors"
          >
            View in Maps
          </a>
        )}

        {/* Coming Soon Badge */}
        {isComingSoon && (
          <div className="absolute top-4 right-4 px-4 py-2 bg-accent text-accent-foreground font-bold text-sm rounded-full">
            Coming Soon
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Badge */}
        <Badge variant="outline" className="mb-3 border-primary text-primary">
          {location.category || 'Jakarta Selatan'}
        </Badge>

        {/* Name */}
        <h3 className="font-display text-2xl mb-2">{location.name}</h3>

        {/* Address */}
        {location.address && (
          <div className="flex items-start gap-2 text-muted-foreground text-sm mb-4">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{location.address}</span>
          </div>
        )}

        {/* Gallery Toggle */}
        {images.length > 1 && (
          <div className="border-t border-border pt-3">
            <button
              onClick={() => onToggleGallery(location.id)}
              className="flex items-center justify-between w-full py-2 text-left hover:text-primary transition-colors"
            >
              <span className="font-semibold flex items-center gap-2">
                <Play className="w-4 h-4" />
                Gallery
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${isGalleryExpanded ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence>
              {isGalleryExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2 pt-2 pb-3">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => onImageClick(img)}
                        className="aspect-square rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Facilities Toggle */}
        {location.facilities && location.facilities.length > 0 && (
          <div className="border-t border-border pt-3">
            <button
              onClick={() => onToggleFacilities(location.id)}
              className="flex items-center justify-between w-full py-2 text-left hover:text-primary transition-colors"
            >
              <span className="font-semibold">Facilities</span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${isFacilitiesExpanded ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence>
              {isFacilitiesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 pt-2 pb-3">
                    {location.facilities.map((facility, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Locations;
