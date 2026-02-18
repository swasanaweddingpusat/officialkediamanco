import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocations } from '@/hooks/useCMS';

export function OurVenueSection() {
  const { data: locations } = useLocations();
  const activeLocations = locations?.filter(l => l.is_active)?.slice(0, 6) || [];

  return (
    <section className="py-24 lg:py-32 bg-card">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 lg:mb-20"
        >
          <div>
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-primary" />
              Venue
            </p>
            <h2 className="font-serif text-3xl lg:text-5xl font-bold leading-tight">
              Our <span className="text-primary">Venue</span>
            </h2>
          </div>
          <Link
            to="/lokasi"
            className="group inline-flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-muted-foreground hover:text-primary transition-colors"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {activeLocations.map((location, index) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Link
                to={`/lokasi/${location.id}`}
                className="group block relative overflow-hidden aspect-[3/4] rounded-sm"
              >
                <img
                  src={location.image_url || '/placeholder.svg'}
                  alt={location.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                  {location.category && (
                    <span className="text-primary text-[10px] tracking-[0.2em] uppercase mb-2 block">
                      {location.category}
                    </span>
                  )}
                  <h3 className="font-serif text-xl lg:text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                    {location.name}
                  </h3>
                  {location.address && (
                    <p className="text-muted-foreground text-xs flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {location.address}
                    </p>
                  )}
                  {location.is_coming_soon && (
                    <span className="inline-block mt-3 px-3 py-1 bg-accent/80 text-accent-foreground text-[10px] tracking-[0.1em] uppercase rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Hover Arrow */}
                <div className="absolute top-6 right-6 w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:border-primary">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
