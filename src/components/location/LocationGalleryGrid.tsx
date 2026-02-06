import { motion } from 'framer-motion';
import { Expand } from 'lucide-react';

interface LocationGalleryGridProps {
  images: string[];
  title?: string;
  onOpenLightbox: (image: string) => void;
}

export const LocationGalleryGrid = ({ 
  images, 
  title = 'Galeri',
  onOpenLightbox 
}: LocationGalleryGridProps) => {
  if (!images || images.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-2xl p-6 md:p-8"
    >
      <h2 className="font-serif text-2xl mb-6 font-bold">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {images.map((img, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onOpenLightbox(img)}
            className="relative aspect-square rounded-xl overflow-hidden group"
          >
            <img 
              src={img} 
              alt={`${title} ${i + 1}`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors duration-300 flex items-center justify-center">
              <Expand className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
