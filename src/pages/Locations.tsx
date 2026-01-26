import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import gymInterior from '@/assets/gym-interior.jpg';

const Locations = () => {
  const { data: locations, isLoading } = useLocations();

  const activeLocations = locations?.filter(l => l.is_active) || [];

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-20 pb-16 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-5xl md:text-7xl mb-4">
              OUR <span className="text-gradient">LOCATIONS</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find a Power Gym near you and start your fitness journey today
            </p>
          </motion.div>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-2xl" />
              ))}
            </div>
          ) : activeLocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {activeLocations.map((location, index) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border"
                >
                  {location.is_coming_soon && (
                    <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-accent text-accent-foreground text-sm font-bold rounded-full">
                      Coming Soon
                    </div>
                  )}
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={location.image_url || gymInterior}
                      alt={location.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-3xl mb-4">{location.name}</h3>
                    
                    <div className="space-y-3 mb-6">
                      {location.address && (
                        <div className="flex items-start gap-3 text-muted-foreground">
                          <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{location.address}</span>
                        </div>
                      )}
                      {location.phone && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>{location.phone}</span>
                        </div>
                      )}
                      {location.email && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>{location.email}</span>
                        </div>
                      )}
                    </div>

                    {location.facilities && location.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {location.facilities.map((facility, i) => (
                          <span key={i} className="px-3 py-1 bg-secondary text-sm rounded-full">
                            {facility}
                          </span>
                        ))}
                      </div>
                    )}

                    {location.google_maps_url && !location.is_coming_soon && (
                      <a href={location.google_maps_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full">
                          View on Map
                          <ExternalLink className="ml-2 w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No locations available yet.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Locations;
