import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { useArticles } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function BlogSection() {
  const { data: articles, isLoading } = useArticles();
  const latestArticles = articles?.slice(0, 3) || [];

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16"
        >
          <div className="mb-6 md:mb-0">
            <p className="font-script text-3xl md:text-4xl text-primary mb-4">Inspirasi & Tips</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wide">
              Blog & <span className="text-gradient italic">Artikel</span>
            </h2>
          </div>
          <Link to="/blog">
            <Button variant="outline" className="tracking-wider border-primary/30 hover:border-primary hover:bg-primary/10">
              Lihat Semua Artikel
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[400px] rounded-xl" />
            ))}
          </div>
        ) : latestArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {latestArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Link to={`/blog/${article.slug}`} className="block group">
                  <div className="card-luxury rounded-xl overflow-hidden">
                    {article.featured_image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={article.featured_image}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-6 md:p-8">
                      {article.category && (
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm rounded-full mb-4 tracking-wider">
                          {article.category}
                        </span>
                      )}
                      <h3 className="font-display text-xl md:text-2xl mb-3 group-hover:text-primary transition-colors tracking-wide line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-muted-foreground text-base mb-6 line-clamp-3 leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {article.author_name && (
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            {article.author_name}
                          </span>
                        )}
                        {article.published_at && (
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {format(new Date(article.published_at), 'd MMM yyyy', { locale: id })}
                          </span>
                        )}
                        {article.reading_time && (
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            {article.reading_time} menit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">Belum ada artikel.</p>
          </div>
        )}
      </div>
    </section>
  );
}
