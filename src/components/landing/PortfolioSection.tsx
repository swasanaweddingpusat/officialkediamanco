import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Images, ArrowRight } from 'lucide-react';
import { useTrainers } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import trainerImage from '@/assets/trainer-1.jpg';

export function PortfolioSection() {
  const { data: trainers, isLoading } = useTrainers();
  const activePortfolios = trainers?.filter(t => t.is_active)?.slice(0, 8) || [];

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
            <p className="font-script text-3xl md:text-4xl text-primary mb-4">Karya Terbaik</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wide">
              Portfolio <span className="text-gradient italic">Kami</span>
            </h2>
          </div>
          <Link to="/trainers">
            <Button variant="outline" className="tracking-wider border-primary/30 hover:border-primary hover:bg-primary/10">
              Lihat Semua Portfolio
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {activePortfolios.map((portfolio, index) => {
              const location = portfolio.locations as { name: string } | null;
              return (
                <motion.div
                  key={portfolio.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.6 }}
                >
                  <Link to={`/portfolio/${portfolio.id}`} className="group block">
                    <div className="relative overflow-hidden rounded-xl aspect-[3/4] border border-border/50 group-hover:border-primary/30 transition-all">
                      <img
                        src={portfolio.photo_url || trainerImage}
                        alt={portfolio.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                      
                      {portfolio.images && portfolio.images.length > 0 && (
                        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full flex items-center gap-2 text-sm">
                          <Images className="w-4 h-4" />
                          {portfolio.images.length}
                        </div>
                      )}
                      
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                        <h3 className="font-display text-lg md:text-xl mb-2 group-hover:text-primary transition-colors tracking-wide line-clamp-1">
                          {portfolio.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          {portfolio.specialization && (
                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full tracking-wide">
                              {portfolio.specialization}
                            </span>
                          )}
                          {location && (
                            <span className="text-xs text-muted-foreground hidden md:inline">
                              {location.name}
                            </span>
                          )}
                        </div>
                      </div>
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
