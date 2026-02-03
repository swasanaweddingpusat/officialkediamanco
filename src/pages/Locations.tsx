import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Play, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
const LOCATION_CATEGORIES = ['Semua', 'Jakarta Selatan', 'Jakarta Timur', 'Bintaro', 'Bandung'] as const;
const Locations = () => {
  const {
    data: locations,
    isLoading
  } = useLocations();
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
    return [];
  };
  return <Layout>
      {/* Hero */}
      <section className="pt-12 sm:pt-16 md:pt-20 pb-8 md:pb-10 bg-card">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4">
              LOKASI <span className="text-gradient text-primary">KAMI</span>
            </h1>
          </motion.div>

          {/* Category Filter */}
          <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2
        }} className="flex flex-wrap justify-center gap-2 mt-6 md:mt-8">
            {LOCATION_CATEGORIES.map(category => <Button key={category} variant={selectedCategory === category ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(category)} className="rounded-full text-xs sm:text-sm px-3 sm:px-4">
                {category}
              </Button>)}
          </motion.div>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="py-6 sm:py-8 pb-12 sm:pb-16 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[380px] sm:h-[420px] rounded-2xl" />)}
            </div> : openLocations.length > 0 || comingSoonLocations.length > 0 ? <AnimatePresence mode="wait">
              <motion.div key={selectedCategory} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -20
          }} transition={{
            duration: 0.3
          }}>
                {/* Open Locations */}
                {openLocations.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 md:mb-12">
                    {openLocations.map((location, index) => <LocationCard key={location.id} location={location} index={index} images={getImages(location)} expandedGallery={expandedGallery} expandedFacilities={expandedFacilities} onToggleGallery={toggleGallery} onToggleFacilities={toggleFacilities} onImageClick={setLightboxImage} />)}
                  </div>}

                {/* Coming Soon */}
                {comingSoonLocations.length > 0 && <>
                    <h2 className="font-display text-2xl sm:text-3xl text-center mb-6 md:mb-8">
                      <span className="text-muted-foreground">SEGERA</span> HADIR
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {comingSoonLocations.map((location, index) => <LocationCard key={location.id} location={location} index={index} images={getImages(location)} expandedGallery={expandedGallery} expandedFacilities={expandedFacilities} onToggleGallery={toggleGallery} onToggleFacilities={toggleFacilities} onImageClick={setLightboxImage} isComingSoon />)}
                    </div>
                  </>}
              </motion.div>
            </AnimatePresence> : <div className="text-center py-12 md:py-16">
              <p className="text-muted-foreground text-base sm:text-lg">
                {selectedCategory === 'Semua' ? 'Belum ada lokasi tersedia.' : `Tidak ada lokasi di ${selectedCategory}.`}
              </p>
            </div>}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-2 sm:p-4" onClick={() => setLightboxImage(null)}>
            <button className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-secondary rounded-full z-10" onClick={() => setLightboxImage(null)}>
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <motion.img initial={{
          scale: 0.9
        }} animate={{
          scale: 1
        }} exit={{
          scale: 0.9
        }} src={lightboxImage} alt="Gallery" className="max-w-full max-h-[85vh] sm:max-h-[90vh] rounded-lg object-contain" />
          </motion.div>}
      </AnimatePresence>
    </Layout>;
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
  isComingSoon
}: LocationCardProps) => {
  const isGalleryExpanded = expandedGallery === location.id;
  const isFacilitiesExpanded = expandedFacilities === location.id;
  return <motion.div initial={{
    opacity: 0,
    y: 30
  }} whileInView={{
    opacity: 1,
    y: 0
  }} viewport={{
    once: true
  }} transition={{
    delay: Math.min(index * 0.1, 0.3)
  }} className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-card border border-border">
      {/* Main Image - Clickable to detail */}
      <Link to={`/locations/${location.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted cursor-pointer">
          {images.length > 0 ? <img src={images[0]} alt={location.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <MapPin className="w-10 h-10 sm:w-12 sm:h-12 opacity-30" />
            </div>}

          {/* View in Maps overlay */}
          {location.google_maps_url && !isComingSoon && <span onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          window.open(location.google_maps_url!, '_blank');
        }} className="absolute top-3 right-3 sm:top-4 sm:right-4 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-primary-foreground font-semibold text-xs sm:text-sm rounded-full hover:bg-primary/90 transition-colors">
              Lihat di Peta
            </span>}

          {/* Coming Soon Badge */}
          {isComingSoon && <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-3 py-1.5 sm:px-4 sm:py-2 bg-accent text-accent-foreground font-bold text-xs sm:text-sm rounded-full">
              Segera Hadir
            </div>}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Badge */}
        <Badge variant="outline" className="mb-2 sm:mb-3 border-primary text-primary text-xs">
          {location.category || 'Jakarta Selatan'}
        </Badge>

        {/* Name - Clickable */}
        <Link to={`/locations/${location.id}`}>
          <h3 className="font-display text-xl sm:text-2xl mb-2 hover:text-primary transition-colors line-clamp-1">
            {location.name}
          </h3>
        </Link>

        {/* Address */}
        {location.address && <div className="flex items-start gap-2 text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{location.address}</span>
          </div>}

        {/* Gallery Toggle */}
        {images.length > 1 && <div className="border-t border-border pt-2 sm:pt-3">
            <button onClick={() => onToggleGallery(location.id)} className="flex items-center justify-between w-full py-1.5 sm:py-2 text-left hover:text-primary transition-colors">
              <span className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Galeri
              </span>
              <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isGalleryExpanded ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isGalleryExpanded && <motion.div initial={{
            height: 0,
            opacity: 0
          }} animate={{
            height: 'auto',
            opacity: 1
          }} exit={{
            height: 0,
            opacity: 0
          }} className="overflow-hidden">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 pb-2 sm:pb-3">
                    {images.map((img, i) => <button key={i} onClick={() => onImageClick(img)} className="aspect-square rounded-md sm:rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>)}
                  </div>
                </motion.div>}
            </AnimatePresence>
          </div>}

        {/* Facilities Toggle */}
        {location.facilities && location.facilities.length > 0 && <div className="border-t border-border pt-2 sm:pt-3">
            <button onClick={() => onToggleFacilities(location.id)} className="flex items-center justify-between w-full py-1.5 sm:py-2 text-left hover:text-primary transition-colors">
              <span className="font-semibold text-sm sm:text-base">Fasilitas</span>
              <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isFacilitiesExpanded ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isFacilitiesExpanded && <motion.div initial={{
            height: 0,
            opacity: 0
          }} animate={{
            height: 'auto',
            opacity: 1
          }} exit={{
            height: 0,
            opacity: 0
          }} className="overflow-hidden">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2 pb-2 sm:pb-3">
                    {location.facilities.map((facility, i) => <span key={i} className="px-2 py-0.5 sm:px-3 sm:py-1 bg-secondary text-secondary-foreground text-[10px] sm:text-xs rounded-full">
                        {facility}
                      </span>)}
                  </div>
                </motion.div>}
            </AnimatePresence>
          </div>}
      </div>
    </motion.div>;
};
export default Locations;