import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTrainers } from '@/hooks/useCMS';
import trainerImage from '@/assets/trainer-1.jpg';

const layouts = [
  'row-span-2 col-span-2',
  'col-span-1 row-span-1',
  'row-span-2 col-span-1',
  'col-span-1 row-span-1',
];

export function PortfolioBentoSection() {
  const { data: trainers } = useTrainers();
  const items = trainers?.filter(t => t.is_active)?.slice(0, 4) || [];

  return (
    <section className="bg-foreground py-24 lg:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-script text-primary text-3xl block mb-2">Portfolio</span>
          <h2 className="font-serif text-4xl lg:text-5xl text-background mb-4">
            Inspirasi Perayaan
          </h2>
          <div className="w-24 h-px bg-primary mx-auto" />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={layouts[i] || 'col-span-1 row-span-1'}
            >
              <Link to={`/portfolio/${item.id}`} className="block w-full h-full group relative overflow-hidden rounded-sm">
                <img
                  src={item.photo_url || trainerImage}
                  alt={item.name}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                />
                {/* Permanent readability gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  {item.specialization && (
                    <p className="text-primary text-[10px] tracking-widest uppercase mb-1 font-semibold">
                      {item.specialization}
                    </p>
                  )}
                  <h3 className="font-serif text-background text-lg leading-tight drop-shadow-md">
                    {item.name}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/portfolio"
            className="inline-block border border-primary bg-primary text-primary-foreground px-8 py-3 uppercase text-xs tracking-widest font-bold hover:bg-transparent hover:text-primary transition-all"
          >
            Lihat Semua Portfolio
          </Link>
        </div>
      </div>
    </section>
  );
}
