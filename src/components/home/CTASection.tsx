import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function CTASection() {
  return <section className="py-24 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-6xl mb-6">READY TO START AN 
EVENT WITH US?<span className="text-gradient">TRANSFORM</span>?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">Join thousands of people who have started their event with us.</p>


          <Link to="/auth">
            <Button size="lg" className="btn-glow text-lg px-8 py-6 group">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>;
}