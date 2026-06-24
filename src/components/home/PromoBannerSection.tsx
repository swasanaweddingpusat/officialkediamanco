import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePrograms } from '@/hooks/useCMS';

export function PromoBannerSection() {
  const { data: programs } = usePrograms();
  const promo = programs?.filter(p => p.is_active)?.[0];

  if (!promo) return null;

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative h-[420px] flex items-center bg-foreground overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1/2 opacity-60">
            <img
              src={promo.image_url || '/placeholder.svg'}
              alt={promo.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 w-full md:w-1/2 ml-auto px-8 md:px-12 py-10 bg-foreground/40 backdrop-blur-sm">
            {promo.category && (
              <span className="text-primary uppercase tracking-[0.3em] text-xs font-bold">
                {promo.category}
              </span>
            )}
            <h2 className="font-serif text-3xl md:text-4xl text-background my-4 leading-tight">
              {promo.name}
            </h2>
            {promo.description && (
              <p className="text-background/70 mb-8 line-clamp-3">{promo.description}</p>
            )}
            <Link
              to={`/tentang-kami/${promo.id}`}
              className="inline-block border border-primary text-primary px-8 py-3 uppercase text-xs tracking-widest font-bold hover:bg-primary hover:text-primary-foreground transition-all"
            >
              Pelajari Detail
            </Link>
          </div>
          <div className="absolute inset-0 border-[16px] border-background/10 pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
