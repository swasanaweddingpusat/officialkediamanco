import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { usePrograms } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import pilatesImage from '@/assets/pilates-class.jpg';
import hiitImage from '@/assets/hiit-class.jpg';
import gymInterior from '@/assets/gym-interior.jpg';

const fallbackImages = [pilatesImage, hiitImage, gymInterior];

const Classes = () => {
  const { data: programs, isLoading } = usePrograms();

  const activePrograms = programs?.filter(p => p.is_active) || [];
  const categories = [...new Set(activePrograms.map(p => p.category).filter(Boolean))];

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-20 pb-16 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-5xl md:text-7xl mb-4">
              OUR <span className="text-gradient">CLASSES</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover a variety of fitness programs designed to challenge and inspire you
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category) => (
                <span
                  key={category}
                  className="px-4 py-2 bg-secondary rounded-full text-sm font-medium cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Programs Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activePrograms.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl aspect-[4/5]"
                >
                  <img
                    src={program.image_url || fallbackImages[index % fallbackImages.length]}
                    alt={program.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {program.category && (
                      <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm rounded-full mb-3">
                        {program.category}
                      </span>
                    )}
                    <h3 className="font-display text-3xl mb-2">{program.name}</h3>
                    <p className="text-muted-foreground">{program.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Classes;
