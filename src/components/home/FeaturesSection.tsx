import { motion } from 'framer-motion';
import { Dumbbell, Users, Clock, Zap, Shield, Award, Heart, Target, Gem, Building2 } from 'lucide-react';
import { useFeatures } from '@/hooks/useCMS';

const iconMap: Record<string, React.ElementType> = {
  Dumbbell, Users, Clock, Zap, Shield, Award, Heart, Target, Gem, Building2,
};

export function FeaturesSection() {
  const { data: features } = useFeatures();
  const activeFeatures = features?.filter(f => f.is_active) || [];

  return (
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 lg:mb-20"
        >
          <div>
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-primary" />
              Mengapa Kami
            </p>
            <h2 className="font-serif text-3xl lg:text-5xl font-bold leading-tight">
              Mengapa Memilih<br />
              <span className="text-primary">Kediaman</span>?
            </h2>
          </div>
          <p className="text-muted-foreground text-sm lg:text-base max-w-md leading-relaxed">
            Semua yang Anda butuhkan untuk acara sempurna ada di satu tempat
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/50">
          {activeFeatures.map((feature, index) => {
            const IconComponent = iconMap[feature.icon || 'Dumbbell'] || Dumbbell;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-background p-8 lg:p-10 group hover:bg-card transition-colors duration-500"
              >
                <IconComponent className="w-6 h-6 text-primary mb-8 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-serif text-lg lg:text-xl mb-3 font-bold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
