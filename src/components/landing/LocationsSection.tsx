import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { useLocations } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function LocationsSection() {
  const { data: locations, isLoading } = useLocations();
  const activeLocations = locations?.filter(l => l.is_active && !l.is_coming_soon)?.slice(0, 6) || [];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16"
        >
          <div>
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              OUR <span className="text-gradient">LOCATIONS</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Find our venues in various strategic locations
            </p>
          </div>
          <Link to="/locations">
            <Button variant="outline" className="mt-4 md:mt-0">
              View All Locations
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[320px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeLocations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/locations/${location.id}`} className="group block">
                  <div className="relative overflow-hidden rounded-2xl bg-card border border-border">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      {location.image_url || (location.images && location.images.length > 0) ? (
                        <img
                          src={location.images?.[0] || location.image_url || ''}
                          alt={location.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <MapPin className="w-12 h-12 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <Badge variant="outline" className="mb-3 border-primary text-primary text-xs">
                        {location.category || 'Jakarta'}
                      </Badge>
                      <h3 className="font-display text-xl mb-2 group-hover:text-primary transition-colors">
                        {location.name}
                      </h3>
                      {location.address && (
                        <div className="flex items-start gap-2 text-muted-foreground text-sm">
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{location.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
