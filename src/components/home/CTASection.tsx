import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function CTASection() {
  return <section className="py-12 sm:py-16 md:py-24 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      </div>

      <div className="container mx-auto px-3 sm:px-4 relative">
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-6xl mb-4 sm:mb-6 px-4 font-bold">
            SIAP MEMULAI ACARA BERSAMA KAMI?
          </h2>
          <p className="text-sm sm:text-base md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto px-4">Bergabunglah dengan ribuan klien yang telah mempercayakan acara mereka kepada kami.</p>


          <Link to="/auth">
            <Button size="lg" className="btn-glow text-sm sm:text-base md:text-lg px-6 sm:px-8 py-4 sm:py-6 group w-full sm:w-auto">
              Hubungi Kami Sekarang
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>;
}