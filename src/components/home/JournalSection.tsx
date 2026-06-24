import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useArticles } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';

export function JournalSection() {
  const { data: articles, isLoading } = useArticles();
  const items = articles?.slice(0, 4) || [];

  return (
    <section className="py-24 lg:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center mb-16 text-center"
        >
          <span className="font-script text-primary text-3xl block mb-2">Jurnal</span>
          <h2 className="font-serif text-4xl lg:text-5xl text-foreground mb-4">
            Inspirasi & Cerita
          </h2>
          <p className="max-w-lg text-muted-foreground">
            Temukan tips dari para ahli dan tren terbaru dalam dunia pernikahan mewah
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground">Belum ada artikel.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {items.map((article, i) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link to={`/artikel/${article.slug}`} className="group block space-y-4 cursor-pointer">
                  <div className="overflow-hidden aspect-[3/2]">
                    {article.featured_image ? (
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>
                  {article.category && (
                    <span className="text-primary text-xs font-bold uppercase tracking-widest">
                      {article.category}
                    </span>
                  )}
                  <h4 className="font-serif text-xl leading-snug text-foreground group-hover:text-primary transition-colors">
                    {article.title}
                  </h4>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                </Link>
              </motion.article>
            ))}
          </div>
        )}

        <div className="text-center mt-14">
          <Link
            to="/artikel"
            className="inline-block border border-primary text-primary px-8 py-3 uppercase text-xs tracking-widest font-bold hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Lihat Semua Artikel
          </Link>
        </div>
      </div>
    </section>
  );
}
