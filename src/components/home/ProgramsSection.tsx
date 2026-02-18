import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePrograms } from '@/hooks/useCMS';
import pilatesImage from '@/assets/pilates-class.jpg';
import hiitImage from '@/assets/hiit-class.jpg';
import gymInterior from '@/assets/gym-interior.jpg';
const fallbackImages = [pilatesImage, hiitImage, gymInterior];
export function ProgramsSection() {
  const {
    data: programs
  } = usePrograms();
  const activePrograms = programs?.filter(p => p.is_active)?.slice(0, 6) || [];
  return <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl mb-4 font-bold">
              OUR <span className="text-primary">PROGRAMS</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">Discover our best event venues in various cities</p>
          </div>
          <Link to="/tentang-kami">
            <Button variant="outline" className="mt-4 md:mt-0">
              View Special Offers
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activePrograms.map((program, index) => <motion.div key={program.id} initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: index * 0.1
        }} className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer">
              <img src={program.image_url || fallbackImages[index % fallbackImages.length]} alt={program.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {program.category && <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm rounded-full mb-3">
                    {program.category}
                  </span>}
                <h3 className="font-serif text-3xl mb-2 font-bold">{program.name}</h3>
                <p className="text-muted-foreground line-clamp-2">{program.description}</p>
              </div>
            </motion.div>)}
        </div>
      </div>
    </section>;
}