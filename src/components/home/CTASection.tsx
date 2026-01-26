import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
const benefits = ['Unlimited access to all equipment', 'Free group fitness classes', 'Personal trainer consultation', 'Locker and shower facilities'];
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto mb-12">
            {benefits.map((benefit, index) => <motion.div key={index} initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-left">{benefit}</span>
              </motion.div>)}
          </div>

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