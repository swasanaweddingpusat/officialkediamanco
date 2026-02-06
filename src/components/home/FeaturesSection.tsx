import { motion } from 'framer-motion';
import { Dumbbell, Users, Clock, Zap, Shield, Award, Heart, Target, Gem, Building2, Star, Sparkles } from 'lucide-react';
import { useFeatures } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';

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
  Building2,
  Star,
  Sparkles,
  dumbbell: Dumbbell,
  trophy: Award,
  users: Users,
  clock: Clock,
  flame: Zap,
  target: Target,
  heart: Heart,
  zap: Zap,
  shield: Shield,
  star: Star,
  award: Award,
  sparkles: Sparkles,
};

export function FeaturesSection() {
  const { data: features, isLoading } = useFeatures();
  const activeFeatures = features?.filter(f => f.is_active)?.slice(0, 6) || [];

  return (
    <section className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="font-script text-3xl md:text-4xl text-primary mb-4">Mengapa Memilih Kami</p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wide">
            Keunggulan <span className="text-gradient italic">Kami</span>
          </h2>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {activeFeatures.map((feature, index) => {
              const IconComponent = iconMap[feature.icon || 'Star'] || Star;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="card-luxury p-8 rounded-xl group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl mb-4 tracking-wide">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
