import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Images, Search, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useTrainers } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import trainerImage from '@/assets/trainer-1.jpg';

const Trainers = () => {
  const { data: trainers, isLoading } = useTrainers();
  
  useSEO({
    title: "Kediaman Corp - Portfolio Kami",
    description: "Temukan inspirasi dari berbagai acara yang telah kami selenggarakan.",
    url: "https://official.kediaman.co/portfolio",
    breadcrumbs: [
      { name: "Home", url: "https://official.kediaman.co/" },
      { name: "Portfolio", url: "https://official.kediaman.co/portfolio" }
    ]
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const activeTrainers = trainers?.filter(t => t.is_active) || [];

  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeTrainers.forEach(t => { if (t.specialization) cats.add(t.specialization); });
    return Array.from(cats).sort();
  }, [activeTrainers]);

  const filteredPortfolios = useMemo(() => {
    let filtered = activeTrainers;
    if (selectedCategory) filtered = filtered.filter(t => t.specialization === selectedCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => t.name.toLowerCase().includes(query) || t.bio?.toLowerCase().includes(query) || t.specialization?.toLowerCase().includes(query));
    }
    return filtered;
  }, [activeTrainers, selectedCategory, searchQuery]);

  const clearFilters = () => { setSelectedCategory(null); setSearchQuery(''); };
  const hasActiveFilters = selectedCategory !== null || searchQuery.trim() !== '';

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-16 lg:pt-24 pb-12 lg:pb-16">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-primary" />
              Portfolio
            </p>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold mb-4">
              Portfolio <span className="text-primary">Kami</span>
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base max-w-xl">
              Temukan inspirasi dari berbagai acara yang telah kami selenggarakan
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-8 border-b border-border/50 sticky top-16 lg:top-20 z-30 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 lg:px-12 space-y-4 py-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari portfolio..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-transparent border-border/50 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase rounded-full border transition-all duration-300 ${
                  !selectedCategory ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary'
                }`}
              >
                Semua
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase rounded-full border transition-all duration-300 ${
                    selectedCategory === category ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 lg:py-20 pb-24 lg:pb-32">
        <div className="container mx-auto px-6 lg:px-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-sm" />)}
            </div>
          ) : filteredPortfolios.length > 0 ? (
            <>
              {hasActiveFilters && (
                <p className="text-muted-foreground text-xs mb-8">
                  {filteredPortfolios.length} portfolio ditemukan
                </p>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCategory || 'all'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
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
                          <div className="relative overflow-hidden aspect-[3/4] rounded-sm mb-4">
                            <img
                              src={portfolio.photo_url || trainerImage}
                              alt={portfolio.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                            {portfolio.images && portfolio.images.length > 0 && (
                              <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/60 backdrop-blur-sm rounded-full flex items-center gap-1.5 text-xs">
                                <Images className="w-3 h-3" />
                                {portfolio.images.length}
                              </div>
                            )}
                            <div className="absolute top-4 right-4 w-9 h-9 rounded-full border border-foreground/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:border-primary">
                              <ArrowRight className="w-3.5 h-3.5 text-primary" />
                            </div>
                          </div>
                          <h3 className="font-serif text-lg lg:text-xl mb-1 group-hover:text-primary transition-colors font-bold line-clamp-1">
                            {portfolio.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {portfolio.specialization && (
                              <span className="text-primary text-[10px] tracking-[0.15em] uppercase">{portfolio.specialization}</span>
                            )}
                            {location && (
                              <span className="text-muted-foreground text-[10px]">· {location.name}</span>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <div className="text-center py-24">
              <p className="text-muted-foreground mb-4">Tidak ada portfolio ditemukan.</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-primary text-sm hover:underline">
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Trainers;
