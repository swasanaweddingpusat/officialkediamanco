import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function CTASection() {
  return (
    <section className="py-24 lg:py-40 relative overflow-hidden bg-card">
      <div className="container mx-auto px-6 lg:px-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-6">
            Mari Mulai
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-6xl mb-6 font-bold leading-tight">
            Siap Memulai Acara<br />Bersama Kami?
          </h2>
          <p className="text-muted-foreground text-sm lg:text-base mb-10 max-w-lg mx-auto leading-relaxed">
            Bergabunglah dengan ribuan klien yang telah mempercayakan acara mereka kepada kami.
          </p>
          <Link to="/auth">
            <Button size="lg" className="group rounded-full px-10 text-sm tracking-[0.05em] uppercase">
              Hubungi Kami
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
