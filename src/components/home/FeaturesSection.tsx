import { motion } from 'framer-motion';
import { Dumbbell, Users, Clock, Zap, Shield, Award, Heart, Target, Gem, Building2 } from 'lucide-react';
import { useFeatures } from '@/hooks/useCMS';
const iconMap: Record<string, React.ElementType> = {
  Dumbbell,
  Users,
  Clock,
  Zap,
  Shield,
  Award,
  Heart,
  Target,
  Gem,
  Building2
};
export function FeaturesSection() {
  const {
    data: features
  } = useFeatures();
  const activeFeatures = features?.filter(f => f.is_active) || [];
  return <section className="py-12 sm:py-16 md:py-24 bg-card">
      <div className="container mx-auto px-3 sm:px-4">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-4 font-bold tracking-tight">
            MENGAPA <span className="text-primary">KEDIAMAN</span>?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">Semua yang Anda butuhkan untuk acara sempurna ada di satu tempat</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
          {activeFeatures.map((feature, index) => {
          const IconComponent = iconMap[feature.icon || 'Dumbbell'] || Dumbbell;
          return <motion.div key={feature.id} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="group p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl card-gradient border border-border hover:border-primary/50 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:bg-primary transition-colors">
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-serif text-base sm:text-lg md:text-2xl mb-1 sm:mb-2 md:mb-3 line-clamp-2 text-foreground font-bold">{feature.title}</h3>
                <p className="text-foreground text-xs sm:text-sm md:text-base line-clamp-3 font-medium">{feature.description}</p>
              </motion.div>;
        })}
        </div>
      </div>
    </section>;
}