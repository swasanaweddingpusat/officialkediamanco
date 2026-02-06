import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function CTASection() {
  return (
    <section className="py-24 md:py-32 bg-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <p className="font-script text-3xl md:text-4xl text-primary mb-6">Siap Memulai?</p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-wide mb-8 leading-tight">
            Wujudkan Acara <br />
            <span className="text-gradient italic">Impian Anda</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Hubungi tim kami untuk konsultasi gratis dan temukan venue yang sempurna untuk momen istimewa Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/locations">
              <Button size="lg" className="btn-glow px-10 py-7 text-lg tracking-wider group w-full sm:w-auto">
                Lihat Venue
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button 
                size="lg" 
                variant="outline" 
                className="px-10 py-7 text-lg tracking-wider border-primary/30 hover:border-primary hover:bg-primary/10 w-full sm:w-auto"
              >
                Hubungi Kami
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
