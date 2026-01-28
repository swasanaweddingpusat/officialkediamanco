import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, ExternalLink, Users, Ruler, ChevronDown, X } from 'lucide-react';
import { useLocations, useBallroomSchedules, usePortfoliosByLocation } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LocationScheduleSection } from '@/components/location/LocationScheduleSection';
import { LocationPortfolioSection } from '@/components/location/LocationPortfolioSection';
import { BallroomBookingForm } from '@/components/booking/BallroomBookingForm';
import { isBefore, startOfToday } from 'date-fns';

interface LocationDetailCardProps {
  location: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    google_maps_url: string | null;
    image_url: string | null;
    images: string[] | null;
    facilities: string[] | null;
    category: string | null;
    loading_area_description: string | null;
    loading_area_capacity: string | null;
    loading_area_dimensions: string | null;
    loading_area_images: string[] | null;
    ballroom_layout_description: string | null;
    ballroom_layout_capacity: string | null;
    ballroom_layout_dimensions: string | null;
    ballroom_layout_images: string[] | null;
  };
  onOpenLightbox: (url: string) => void;
}

function LocationDetailCard({ location, onOpenLightbox }: LocationDetailCardProps) {
  const { data: schedules = [] } = useBallroomSchedules(location.id);
  const { data: portfolios = [] } = usePortfoliosByLocation(location.id);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const images = useMemo(() => {
    if (location.images && location.images.length > 0) return location.images;
    if (location.image_url) return [location.image_url];
    return [];
  }, [location]);

  const upcomingSchedules = useMemo(() => 
    schedules.filter(s => !isBefore(new Date(s.schedule_date), startOfToday())),
    [schedules]
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Hero Image */}
      <div className="relative aspect-[21/9] overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={location.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <MapPin className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <Badge variant="outline" className="mb-3 border-primary/50 text-primary bg-background/80">
            {location.category || 'Jakarta'}
          </Badge>
          <h3 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground">
            {location.name}
          </h3>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Address & Contact */}
        <div className="grid md:grid-cols-2 gap-4">
          {location.address && (
            <div className="flex items-start gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>{location.address}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-4">
            {location.phone && (
              <a href={`tel:${location.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                {location.phone}
              </a>
            )}
            {location.email && (
              <a href={`mailto:${location.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                {location.email}
              </a>
            )}
          </div>
        </div>

        {/* Facilities */}
        {location.facilities && location.facilities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {location.facilities.map((facility, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {facility}
              </Badge>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        {images.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {images.slice(0, 8).map((img, i) => (
              <button
                key={i}
                onClick={() => onOpenLightbox(img)}
                className="aspect-square rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Loading Area Section */}
        {(location.loading_area_description || location.loading_area_images?.length) && (
          <div className="border-t border-border pt-4">
            <button
              onClick={() => toggleSection('loading')}
              className="flex items-center justify-between w-full py-2 text-left hover:text-primary transition-colors"
            >
              <span className="font-display text-xl">Loading Area</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${expandedSection === 'loading' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {expandedSection === 'loading' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-4 space-y-4">
                    {location.loading_area_description && (
                      <p className="text-muted-foreground">{location.loading_area_description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {location.loading_area_capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span>{location.loading_area_capacity}</span>
                        </div>
                      )}
                      {location.loading_area_dimensions && (
                        <div className="flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-primary" />
                          <span>{location.loading_area_dimensions}</span>
                        </div>
                      )}
                    </div>
                    {location.loading_area_images && location.loading_area_images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {location.loading_area_images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => onOpenLightbox(img)}
                            className="aspect-video rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Ballroom Layout Section */}
        {(location.ballroom_layout_description || location.ballroom_layout_images?.length) && (
          <div className="border-t border-border pt-4">
            <button
              onClick={() => toggleSection('ballroom')}
              className="flex items-center justify-between w-full py-2 text-left hover:text-primary transition-colors"
            >
              <span className="font-display text-xl">Ballroom Layout</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${expandedSection === 'ballroom' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {expandedSection === 'ballroom' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-4 space-y-4">
                    {location.ballroom_layout_description && (
                      <p className="text-muted-foreground">{location.ballroom_layout_description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {location.ballroom_layout_capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span>{location.ballroom_layout_capacity}</span>
                        </div>
                      )}
                      {location.ballroom_layout_dimensions && (
                        <div className="flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-primary" />
                          <span>{location.ballroom_layout_dimensions}</span>
                        </div>
                      )}
                    </div>
                    {location.ballroom_layout_images && location.ballroom_layout_images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {location.ballroom_layout_images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => onOpenLightbox(img)}
                            className="aspect-video rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Schedule Section */}
        {upcomingSchedules.length > 0 && (
          <div className="border-t border-border pt-4">
            <button
              onClick={() => toggleSection('schedule')}
              className="flex items-center justify-between w-full py-2 text-left hover:text-primary transition-colors"
            >
              <span className="font-display text-xl">Jadwal Ketersediaan</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${expandedSection === 'schedule' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {expandedSection === 'schedule' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-4">
                    <LocationScheduleSection schedules={upcomingSchedules} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Portfolio Section */}
        {portfolios.length > 0 && (
          <div className="border-t border-border pt-4">
            <button
              onClick={() => toggleSection('portfolio')}
              className="flex items-center justify-between w-full py-2 text-left hover:text-primary transition-colors"
            >
              <span className="font-display text-xl">Event Portfolio</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${expandedSection === 'portfolio' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {expandedSection === 'portfolio' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-4">
                    <LocationPortfolioSection 
                      portfolios={portfolios}
                      onOpenLightbox={onOpenLightbox}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
          <Button onClick={() => setBookingOpen(true)} className="btn-glow">
            Booking Venue
          </Button>
          {location.google_maps_url && (
            <Button variant="outline" asChild>
              <a href={location.google_maps_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Maps
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Booking Form Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="sr-only">Booking {location.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-4">
            <BallroomBookingForm
              locationId={location.id}
              locationName={location.name}
              onClose={() => setBookingOpen(false)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FullLocationsSection() {
  const { data: locations, isLoading } = useLocations();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const activeLocations = locations?.filter(l => l.is_active && !l.is_coming_soon) || [];

  // Generate slug from location name
  const getLocationSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  return (
    <>
      {/* Location Navigation */}
      <nav className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-sm text-muted-foreground font-medium whitespace-nowrap mr-2">Lokasi:</span>
            {activeLocations.map((location) => (
              <a
                key={location.id}
                href={`#location-${getLocationSlug(location.name)}`}
                className="px-4 py-2 rounded-full text-sm font-medium bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
              >
                {location.name}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Locations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              OUR <span className="text-gradient">LOCATIONS</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Temukan venue terbaik kami di berbagai lokasi strategis
            </p>
          </motion.div>

          {isLoading ? (
            <div className="space-y-12">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[500px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {activeLocations.map((location, index) => (
                <motion.div
                  key={location.id}
                  id={`location-${getLocationSlug(location.name)}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="scroll-mt-32"
                >
                  <LocationDetailCard 
                    location={location} 
                    onOpenLightbox={setLightboxImage}
                  />
                </motion.div>
              ))}
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
              className="absolute top-4 right-4 p-2 bg-secondary rounded-full z-10"
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
    </>
  );
}
