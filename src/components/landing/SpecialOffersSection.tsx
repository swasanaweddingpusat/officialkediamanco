import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { usePrograms } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import pilatesImage from '@/assets/pilates-class.jpg';
import hiitImage from '@/assets/hiit-class.jpg';
import gymInterior from '@/assets/gym-interior.jpg';

const fallbackImages = [pilatesImage, hiitImage, gymInterior];

export function SpecialOffersSection() {
  const { data: programs, isLoading } = usePrograms();
  const activePrograms = programs?.filter(p => p.is_active)?.slice(0, 6) || [];

  return (
    <section className="py-24 md:py-32 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16"
        >
          <div className="mb-6 md:mb-0">
            <p className="font-script text-3xl md:text-4xl text-primary mb-4">Penawaran Terbaik</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wide">
              Promo <span className="text-gradient italic">Spesial</span>
            </h2>
          </div>
          <Link to="/classes">
            <Button variant="outline" className="tracking-wider border-primary/30 hover:border-primary hover:bg-primary/10">
              Lihat Semua Promo
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {activePrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Link to={`/classes/${program.id}`} className="group block">
                  <div className="relative overflow-hidden rounded-xl aspect-[4/5] border border-border/50 group-hover:border-primary/30 transition-all">
                    <img
                      src={program.image_url || fallbackImages[index % fallbackImages.length]}
                      alt={program.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      {program.category && (
                        <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm rounded-full mb-4 tracking-wider">
                          {program.category}
                        </span>
                      )}
                      <h3 className="font-display text-xl md:text-2xl mb-2 group-hover:text-primary transition-colors tracking-wide">
                        {program.name}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2 text-sm md:text-base leading-relaxed">
                        {program.description}
                      </p>
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
