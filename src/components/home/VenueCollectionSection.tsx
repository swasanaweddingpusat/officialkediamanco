import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLocations } from '@/hooks/useCMS';

export function VenueCollectionSection() {
  const { data: locations } = useLocations();
  const active = locations?.filter(l => l.is_active)?.slice(0, 6) || [];

  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14"
        >
          <div>
            <h2 className="font-serif text-3xl lg:text-5xl mb-2 text-foreground">
              Koleksi Venue Eksklusif
            </h2>
            <p className="text-lg text-muted-foreground italic">
              Pilihan lokasi terbaik untuk momen bersejarah Anda
            </p>
          </div>
          <Link
            to="/lokasi"
            className="text-primary border-b border-primary pb-1 font-medium tracking-wide hover:opacity-70 transition-opacity w-fit"
          >
            Lihat Semua
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {active.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={`/lokasi/${loc.id}`} className="group block cursor-pointer">
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm mb-4">
                  <img
                    src={loc.image_url || '/placeholder.svg'}
                    alt={loc.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {loc.category && (
                    <div className="absolute top-4 right-4 bg-foreground/80 text-background px-3 py-1 text-xs tracking-widest backdrop-blur-sm uppercase">
                      {loc.category}
                    </div>
                  )}
                </div>
                <h3 className="font-serif text-2xl group-hover:text-primary transition-colors text-foreground">
                  {loc.name}
                </h3>
                {loc.address && (
                  <p className="text-sm uppercase tracking-widest text-muted-foreground mt-1 line-clamp-1">
                    {loc.address}
                  </p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
