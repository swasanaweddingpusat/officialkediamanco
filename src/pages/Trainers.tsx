import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTrainers } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import trainerImage from '@/assets/trainer-1.jpg';
const Trainers = () => {
  const {
    data: trainers,
    isLoading
  } = useTrainers();
  const activeTrainers = trainers?.filter(t => t.is_active) || [];
  return <Layout>
      {/* Hero */}
      <section className="pt-20 pb-16 bg-card">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-center">
            <h1 className="font-display text-5xl md:text-7xl mb-4">OUR PORTFOLIO<span className="text-gradient">OUR PORTFOLIO</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Find inspiration from several events that have been held</p>
          </motion.div>
        </div>
      </section>

      {/* Trainers Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div> : activeTrainers.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {activeTrainers.map((trainer, index) => <motion.div key={trainer.id} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="group">
                  <div className="relative overflow-hidden rounded-2xl aspect-[3/4] mb-4">
                    <img src={trainer.photo_url || trainerImage} alt={trainer.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
                    {trainer.instagram && <a href={`https://instagram.com/${trainer.instagram}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4 p-2 bg-background/80 backdrop-blur rounded-lg hover:bg-primary transition-colors">
                        <Instagram className="w-5 h-5" />
                      </a>}
                  </div>
                  <h3 className="font-display text-2xl mb-1">{trainer.name}</h3>
                  {trainer.specialization && <p className="text-primary font-medium mb-2">{trainer.specialization}</p>}
                  {trainer.bio && <p className="text-muted-foreground text-sm line-clamp-3">{trainer.bio}</p>}
                  {trainer.certifications && trainer.certifications.length > 0 && <div className="flex flex-wrap gap-2 mt-3">
                      {trainer.certifications.slice(0, 3).map((cert, i) => <span key={i} className="text-xs px-2 py-1 bg-secondary rounded">
                          {cert}
                        </span>)}
                    </div>}
                </motion.div>)}
            </div> : <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">There are no events held yet.</p>
            </div>}
        </div>
      </section>
    </Layout>;
};
export default Trainers;