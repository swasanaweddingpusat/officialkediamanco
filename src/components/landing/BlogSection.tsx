import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { useArticles } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function BlogSection() {
  const { data: articles, isLoading } = useArticles();
  const latestArticles = articles?.slice(0, 3) || [];

  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 md:mb-16"
        >
          <div className="mb-4 md:mb-0">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-4 font-bold">
              BLOG & <span className="text-primary">ARTIKEL</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
              Temukan artikel terbaru, tips, dan informasi seputar venue dan event
            </p>
          </div>
          <Link to="/artikel">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Lihat Semua Artikel
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[280px] sm:h-[320px] md:h-[380px] rounded-xl sm:rounded-2xl" />
            ))}
          </div>
        ) : latestArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {latestArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/artikel/${article.slug}`}>
                  <Card className="overflow-hidden h-full hover:border-primary/50 transition-all hover:-translate-y-1 group">
                    {article.featured_image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={article.featured_image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      {article.category && (
                        <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs">
                          {article.category}
                        </Badge>
                      )}
                      <h3 className="font-serif text-base sm:text-lg md:text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2 font-semibold">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                        {article.author_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[80px] sm:max-w-none">{article.author_name}</span>
                          </span>
                        )}
                        {article.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(article.published_at), 'd MMM yyyy', { locale: id })}
                          </span>
                        )}
                        {article.reading_time && (
                          <span className="flex items-center gap-1 hidden sm:flex">
                            <Clock className="w-3 h-3" />
                            {article.reading_time} menit
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-sm sm:text-base">Belum ada artikel.</p>
          </div>
        )}
      </div>
    </section>
  );
}
