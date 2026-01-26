import { motion } from 'framer-motion';
import { Dumbbell, Users, Clock, Zap, Shield, Award } from 'lucide-react';
import { useFeatures } from '@/hooks/useCMS';

const iconMap: Record<string, React.ElementType> = {
  Dumbbell,
  Users,
  Clock,
  Zap,
  Shield,
  Award,
};

export function FeaturesSection() {
  const { data: features } = useFeatures();

  const activeFeatures = features?.filter(f => f.is_active) || [];

  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            WHY <span className="text-gradient">POWER GYM</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to achieve your fitness goals in one place
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {activeFeatures.map((feature, index) => {
            const IconComponent = iconMap[feature.icon || 'Dumbbell'] || Dumbbell;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 rounded-2xl card-gradient border border-border hover:border-primary/50 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                  <IconComponent className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-display text-2xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
