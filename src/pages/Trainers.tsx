import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Images, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useTrainers } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import trainerImage from '@/assets/trainer-1.jpg';

const Trainers = () => {
  const { data: trainers, isLoading } = useTrainers();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeTrainers = trainers?.filter(t => t.is_active) || [];

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeTrainers.forEach(t => {
      if (t.specialization) cats.add(t.specialization);
    });
    return Array.from(cats).sort();
  }, [activeTrainers]);

  // Filter portfolios by category
  const filteredPortfolios = useMemo(() => {
    if (!selectedCategory) return activeTrainers;
    return activeTrainers.filter(t => t.specialization === selectedCategory);
  }, [activeTrainers, selectedCategory]);

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

      {/* Filter Section */}
      {categories.length > 0 && (
        <section className="py-6 border-b border-border bg-background sticky top-16 z-30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="flex items-center gap-2 text-muted-foreground mr-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Kategori:</span>
              </div>
              
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="rounded-full"
              >
                Semua
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs bg-background/20">
                  {activeTrainers.length}
                </Badge>
              </Button>

              {categories.map((category) => {
                const count = activeTrainers.filter(t => t.specialization === category).length;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="rounded-full"
                  >
                    {category}
                    <Badge 
                      variant="secondary" 
                      className={`ml-2 px-1.5 py-0 text-xs ${
                        selectedCategory === category ? 'bg-background/20' : ''
                      }`}
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* Portfolio Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
              ))}
            </div>
          ) : filteredPortfolios.length > 0 ? (
            <>
              {/* Results count */}
              {selectedCategory && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-muted-foreground mb-6"
                >
                  Menampilkan {filteredPortfolios.length} portfolio untuk kategori "{selectedCategory}"
                </motion.p>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCategory || 'all'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                  {filteredPortfolios.map((portfolio, index) => {
                    const location = portfolio.locations as { name: string } | null;
                    return (
                      <motion.div
                        key={portfolio.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
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
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <div className="text-center py-16">
              {selectedCategory ? (
                <div>
                  <p className="text-muted-foreground text-lg mb-4">
                    Tidak ada portfolio untuk kategori "{selectedCategory}"
                  </p>
                  <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                    Tampilkan Semua
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-lg">
                  There are no events held yet.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Trainers;
