import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLocations } from '@/hooks/useCMS';

export function VenueCollectionSection() {
  const { data: locations } = useLocations();
  const active = locations?.filter(l => l.is_active)?.slice(0, 6) || [];

  return (
    <section className="py-20 lg:py-24 px-6 bg-card">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 italic text-foreground">
            Destinasi Terpopuler
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Jelajahi pilihan venue terbaik yang telah dikurasi oleh tim ahli kami.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {active.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={`/lokasi/${loc.id}`} className="group block cursor-pointer">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-6 shadow-md">
                  <img
                    src={loc.image_url || '/placeholder.svg'}
                    alt={loc.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  {loc.category && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-background/95 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-foreground shadow-sm">
                        {loc.category}
                      </span>
                    </div>
                  )}
                  {loc.is_coming_soon && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="font-serif text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {loc.name}
                </h3>
                {loc.address && (
                  <p className="text-muted-foreground text-sm mt-1 mb-4 line-clamp-1">
                    {loc.address}
                  </p>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-primary font-bold text-sm">Lihat Detail →</span>
                  {loc.phone && (
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Tersedia
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/lokasi"
            className="inline-block px-8 py-3 rounded-full border border-foreground text-foreground font-semibold text-sm hover:bg-foreground hover:text-background transition-all"
          >
            Lihat Semua Venue
          </Link>
        </div>
      </div>
    </section>
  );
}
