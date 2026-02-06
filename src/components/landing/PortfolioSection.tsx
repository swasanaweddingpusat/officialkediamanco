import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Images, ArrowRight } from 'lucide-react';
import { useTrainers } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import trainerImage from '@/assets/trainer-1.jpg';

export function PortfolioSection() {
  const { data: trainers, isLoading } = useTrainers();
  const activePortfolios = trainers?.filter(t => t.is_active)?.slice(0, 8) || [];

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
              PORTFOLIO <span className="text-primary">KAMI</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
              Temukan inspirasi dari berbagai acara yang telah kami selenggarakan
            </p>
          </div>
          <Link to="/trainers">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Lihat Semua Portfolio
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl sm:rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {activePortfolios.map((portfolio, index) => {
              const location = portfolio.locations as { name: string } | null;
              return (
                <motion.div
                  key={portfolio.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/portfolio/${portfolio.id}`} className="group block">
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[3/4] mb-2 sm:mb-4">
                      <img
                        src={portfolio.photo_url || trainerImage}
                        alt={portfolio.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
                      
                      {portfolio.images && portfolio.images.length > 0 && (
                        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 px-2 py-1 sm:px-3 sm:py-1.5 bg-background/80 backdrop-blur rounded-full flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
                          <Images className="w-3 h-3 sm:w-4 sm:h-4" />
                          {portfolio.images.length}
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif text-sm sm:text-lg md:text-xl mb-1 group-hover:text-primary transition-colors line-clamp-1 font-semibold">
                      {portfolio.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      {portfolio.specialization && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0">
                          {portfolio.specialization}
                        </Badge>
                      )}
                      {location && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0 hidden sm:inline-flex">
                          {location.name}
                        </Badge>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
