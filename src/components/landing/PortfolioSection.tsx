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
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16"
        >
          <div>
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              OUR <span className="text-gradient">PORTFOLIO</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Find inspiration from several events that have been held
            </p>
          </div>
          <Link to="/trainers">
            <Button variant="outline" className="mt-4 md:mt-0">
              View All Portfolio
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <div className="relative overflow-hidden rounded-2xl aspect-[3/4] mb-4">
                      <img
                        src={portfolio.photo_url || trainerImage}
                        alt={portfolio.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
                      
                      {portfolio.images && portfolio.images.length > 0 && (
                        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/80 backdrop-blur rounded-full flex items-center gap-1.5 text-sm">
                          <Images className="w-4 h-4" />
                          {portfolio.images.length}
                        </div>
                      )}
                    </div>
                    <h3 className="font-display text-xl mb-1 group-hover:text-primary transition-colors">
                      {portfolio.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {portfolio.specialization && (
                        <Badge variant="outline" className="text-xs">
                          {portfolio.specialization}
                        </Badge>
                      )}
                      {location && (
                        <Badge variant="secondary" className="text-xs">
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
