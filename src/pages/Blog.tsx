import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useArticles } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Search, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSiteSettings } from '@/hooks/useCMS';
import { motion } from 'framer-motion';

const Blog = () => {
  const { data: articles, isLoading } = useArticles();
  const { data: siteSettings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const siteName = siteSettings?.site_name || 'Kediaman Corp';

  useSEO({
    title: "Kediaman Corp Blog - Artikel & Tips",
    description: "Baca artikel terbaru, tips, dan informasi seputar venue dan event management.",
    url: "https://official.kediaman.co/artikel",
    breadcrumbs: [
      { name: "Home", url: "https://official.kediaman.co/" },
      { name: "Artikel", url: "https://official.kediaman.co/artikel" }
    ]
  });

  const filteredArticles = articles?.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(articles?.map(a => a.category).filter(Boolean))];

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-16 lg:pt-24 pb-12 lg:pb-16">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-primary" />
              Blog
            </p>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold mb-4">
              Blog & <span className="text-primary">Artikel</span>
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base max-w-xl mb-8">
              Temukan artikel terbaru seputar venue dan event management
            </p>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-transparent border-border/50 text-sm"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="pb-8 border-b border-border/50">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 text-[10px] tracking-[0.15em] uppercase rounded-full border transition-all duration-300 ${
                  !selectedCategory ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary'
                }`}
              >
                Semua
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category as string)}
                  className={`px-4 py-2 text-[10px] tracking-[0.15em] uppercase rounded-full border transition-all duration-300 ${
                    selectedCategory === category ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-12 lg:py-20 pb-24 lg:pb-32">
        <div className="container mx-auto px-6 lg:px-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <Skeleton className="aspect-[16/10] mb-4 rounded-sm" />
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : filteredArticles?.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground">
                {searchQuery ? 'Tidak ada artikel yang ditemukan.' : 'Belum ada artikel.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredArticles?.map((article, index) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/artikel/${article.slug}`} className="group block">
                    {article.featured_image && (
                      <div className="aspect-[16/10] overflow-hidden rounded-sm mb-4">
                        <img
                          src={article.featured_image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      {article.category && (
                        <span className="text-primary text-[10px] tracking-[0.15em] uppercase">{article.category}</span>
                      )}
                      {article.published_at && (
                        <span className="text-muted-foreground/60 text-[10px]">
                          {format(new Date(article.published_at), 'd MMM yyyy', { locale: id })}
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-lg lg:text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2 font-bold">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
