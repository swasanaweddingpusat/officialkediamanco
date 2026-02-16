import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLocations } from '@/hooks/useCMS';

export function OurVenueSection() {
  const { data: locations } = useLocations();
  const activeLocations = locations?.filter(l => l.is_active)?.slice(0, 6) || [];

  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16"
        >
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 font-bold">
              OUR <span className="text-primary">VENUE</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-xl">
              Temukan venue eksklusif kami di berbagai kota
            </p>
          </div>
          <Link to="/locations">
            <Button variant="outline" className="mt-4 md:mt-0">
              Lihat Semua Venue
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {activeLocations.map((location, index) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/locations/${location.id}`}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[4/5] block cursor-pointer"
              >
                <img
                  src={location.image_url || '/placeholder.svg'}
                  alt={location.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  {location.category && (
                    <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs sm:text-sm rounded-full mb-2 sm:mb-3">
                      {location.category}
                    </span>
                  )}
                  <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 font-bold">
                    {location.name}
                  </h3>
                  {location.address && (
                    <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                      {location.address}
                    </p>
                  )}
                  {location.is_coming_soon && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
