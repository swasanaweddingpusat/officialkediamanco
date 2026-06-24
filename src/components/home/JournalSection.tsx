import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useArticles } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';

export function JournalSection() {
  const { data: articles, isLoading } = useArticles();
  const items = articles?.slice(0, 2) || [];

  return (
    <section className="py-24 lg:py-32 px-6 bg-background">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="md:w-1/3 md:sticky md:top-32"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-6 text-foreground">
            Wawasan & Inspirasi
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Temukan panduan perencanaan dan kisah nyata pasangan dalam perjalanan menuju hari bahagia mereka.
          </p>
          <Link to="/artikel" className="inline-flex items-center gap-3 text-foreground font-bold group">
            Baca Selengkapnya
            <span className="w-10 h-10 rounded-full border border-primary flex items-center justify-center group-hover:bg-primary transition-all">
              <ChevronRight className="w-4 h-4 group-hover:text-primary-foreground transition-colors" />
            </span>
          </Link>
        </motion.div>

        <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading
            ? [...Array(2)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
            : items.map((article, i) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/artikel/${article.slug}`} className="group block cursor-pointer">
                    <div className="rounded-2xl overflow-hidden mb-6 aspect-video">
                      {article.featured_image ? (
                        <img
                          src={article.featured_image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                    {article.category && (
                      <span className="text-primary text-[10px] font-bold tracking-widest uppercase mb-3 block">
                        {article.category}
                      </span>
                    )}
                    <h4 className="font-serif text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {article.title}
                    </h4>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}
                  </Link>
                </motion.article>
              ))}
        </div>
      </div>
    </section>
  );
}
