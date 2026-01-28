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
              SPECIAL <span className="text-gradient">OFFERS</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Discover our exclusive packages and promotions designed for you
            </p>
          </div>
          <Link to="/classes">
            <Button variant="outline" className="mt-4 md:mt-0">
              View All Offers
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activePrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/classes/${program.id}`} className="group block">
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/5]">
                    <img
                      src={program.image_url || fallbackImages[index % fallbackImages.length]}
                      alt={program.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {program.category && (
                        <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm rounded-full mb-3">
                          {program.category}
                        </span>
                      )}
                      <h3 className="font-display text-2xl mb-2 group-hover:text-primary transition-colors">
                        {program.name}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2 text-sm">
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
