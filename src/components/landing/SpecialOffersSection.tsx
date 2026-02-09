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
    <section className="py-12 sm:py-16 md:py-24 bg-card">
      <div className="container mx-auto px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 md:mb-16"
        >
          <div className="mb-4 md:mb-0">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-4 font-bold">
              PROGRAM <span className="text-primary">SPESIAL</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
              Temukan paket dan program eksklusif yang dirancang khusus untuk Anda
            </p>
          </div>
          <Link to="/classes">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Lihat Semua Program
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-xl sm:rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-8">
            {activePrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/classes/${program.id}`} className="group block">
                  <div className="relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[4/5]">
                    <img
                      src={program.image_url || fallbackImages[index % fallbackImages.length]}
                      alt={program.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
                      {program.category && (
                        <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-primary/20 text-primary text-[10px] sm:text-xs md:text-sm rounded-full mb-2 sm:mb-3">
                          {program.category}
                        </span>
                      )}
                      <h3 className="font-serif text-sm sm:text-lg md:text-2xl mb-1 sm:mb-2 group-hover:text-primary transition-colors line-clamp-2 font-semibold">
                        {program.name}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2 text-[10px] sm:text-xs md:text-sm hidden sm:block">
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
