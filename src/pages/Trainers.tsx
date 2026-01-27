import { motion } from 'framer-motion';
import { Images } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useTrainers } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import trainerImage from '@/assets/trainer-1.jpg';

const Trainers = () => {
  const { data: trainers, isLoading } = useTrainers();
  const activeTrainers = trainers?.filter(t => t.is_active) || [];

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-20 pb-16 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-5xl md:text-7xl mb-4">
              OUR <span className="text-gradient">PORTFOLIO</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find inspiration from several events that have been held
            </p>
          </motion.div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
              ))}
            </div>
          ) : activeTrainers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {activeTrainers.map((portfolio, index) => {
                const location = portfolio.locations as { name: string } | null;
                return (
                  <motion.div
                    key={portfolio.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/portfolio/${portfolio.id}`} className="group block">
                      <div className="relative overflow-hidden rounded-2xl aspect-[3/4] mb-4">
                        <img
                          src={portfolio.photo_url || trainerImage}
                          alt={portfolio.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
                        
                        {/* Image count badge */}
                        {portfolio.images && portfolio.images.length > 0 && (
                          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/80 backdrop-blur rounded-full flex items-center gap-1.5 text-sm">
                            <Images className="w-4 h-4" />
                            {portfolio.images.length}
                          </div>
                        )}
                      </div>
                      <h3 className="font-display text-2xl mb-1 group-hover:text-primary transition-colors">
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
                      {portfolio.bio && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {portfolio.bio}
                        </p>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                There are no events held yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Trainers;