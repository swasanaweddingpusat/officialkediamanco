import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Images, ArrowRight } from 'lucide-react';
import { useTrainers } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import trainerImage from '@/assets/trainer-1.jpg';

export function PortfolioSection() {
  const { data: trainers, isLoading } = useTrainers();
  const activePortfolios = trainers?.filter(t => t.is_active)?.slice(0, 8) || [];

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
              Featured Work
            </p>
            <h2 className="font-serif text-3xl lg:text-5xl font-bold leading-tight">
              Portfolio <span className="text-primary">Kami</span>
            </h2>
          </div>
          <Link
            to="/portfolio"
            className="group inline-flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-muted-foreground hover:text-primary transition-colors"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
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
                    <div className="relative overflow-hidden rounded-sm aspect-[3/4] mb-3">
                      <img
                        src={portfolio.photo_url || trainerImage}
                        alt={portfolio.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                      {portfolio.images && portfolio.images.length > 0 && (
                        <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-background/60 backdrop-blur-sm rounded-full flex items-center gap-1 text-[10px]">
                          <Images className="w-3 h-3" />
                          {portfolio.images.length}
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif text-sm lg:text-base mb-0.5 group-hover:text-primary transition-colors font-bold line-clamp-1">
                      {portfolio.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {portfolio.specialization && (
                        <span className="text-primary text-[9px] tracking-[0.15em] uppercase">{portfolio.specialization}</span>
                      )}
                      {location && (
                        <span className="text-muted-foreground text-[9px]">· {location.name}</span>
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
