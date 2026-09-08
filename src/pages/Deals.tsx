import { useExternalDeals } from '@/hooks/useCMS';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Loader2, Tag, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSEO } from '@/hooks/useSEO';

function formatCurrency(value: unknown) {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (!num || isNaN(num)) return null;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

function formatDate(value: unknown) {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function Deals() {
  const { data: deals, isLoading, error } = useExternalDeals();

  useSEO({
    title: 'Penawaran Spesial | Kediaman',
    description: 'Temukan penawaran dan deal eksklusif dari Kediaman untuk momen istimewa Anda.',
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 lg:pt-32 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mb-12 lg:mb-16"
          >
            <span className="text-primary text-xs tracking-[0.2em] uppercase font-medium">
              Eksklusif
            </span>
            <h1 className="font-serif text-4xl lg:text-6xl text-foreground mt-3 mb-4 leading-tight">
              Penawaran Spesial
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
              Kumpulan deal dan penawaran terpilih yang kami hadirkan untuk perayaan Anda.
            </p>
          </motion.div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="text-center py-20 border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-destructive">Gagal memuat penawaran. Silakan coba lagi nanti.</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && (!deals || deals.length === 0) && (
            <div className="text-center py-20 border border-border/50 rounded-lg bg-muted/20">
              <p className="text-muted-foreground">Belum ada penawaran tersedia saat ini.</p>
            </div>
          )}

          {/* Grid */}
          {!isLoading && !error && deals && deals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {deals.map((deal, index) => {
                const title =
                  typeof deal.name === 'string'
                    ? deal.name
                    : typeof deal.title === 'string'
                    ? deal.title
                    : 'Penawaran';
                const description =
                  typeof deal.description === 'string' ? deal.description : '';
                const image =
                  typeof deal.image_url === 'string'
                    ? deal.image_url
                    : typeof deal.image === 'string'
                    ? deal.image
                    : null;
                const price = formatCurrency(deal.price ?? deal.amount);
                const originalPrice = formatCurrency(deal.original_price ?? deal.old_price);
                const status =
                  typeof deal.status === 'string' ? deal.status : null;
                const createdAt = formatDate(deal.created_at);
                const link =
                  typeof deal.link === 'string'
                    ? deal.link
                    : typeof deal.url === 'string'
                    ? deal.url
                    : null;

                return (
                  <motion.article
                    key={String(deal.id ?? index)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 transition-colors duration-300"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                          <Tag className="w-10 h-10" />
                        </div>
                      )}
                      {status && (
                        <span className="absolute top-3 left-3 px-3 py-1 text-[10px] tracking-[0.15em] uppercase bg-primary text-primary-foreground rounded-full">
                          {status}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 lg:p-6">
                      <h2 className="font-serif text-xl lg:text-2xl text-foreground mb-2 leading-tight">
                        {title}
                      </h2>

                      {description && (
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
                          {description}
                        </p>
                      )}

                      <div className="flex items-end gap-3 mb-4">
                        {price && (
                          <span className="font-serif text-2xl text-primary">{price}</span>
                        )}
                        {originalPrice && (
                          <span className="text-sm text-muted-foreground line-through mb-1">
                            {originalPrice}
                          </span>
                        )}
                      </div>

                      {createdAt && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{createdAt}</span>
                        </div>
                      )}

                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full group/btn text-xs tracking-[0.1em] uppercase"
                          >
                            Lihat Detail
                            <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover/btn:translate-x-1" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
