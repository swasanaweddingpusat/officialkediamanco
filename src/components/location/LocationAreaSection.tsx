import { motion } from 'framer-motion';
import { Users, Ruler, Expand } from 'lucide-react';

interface LocationAreaSectionProps {
  title: string;
  description?: string | null;
  capacity?: string | null;
  dimensions?: string | null;
  images?: string[] | null;
  onOpenLightbox: (image: string) => void;
}

export const LocationAreaSection = ({
  title,
  description,
  capacity,
  dimensions,
  images,
  onOpenLightbox,
}: LocationAreaSectionProps) => {
  const hasContent = images?.length || description || capacity || dimensions;
  
  if (!hasContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card border border-border rounded-2xl p-6 md:p-8"
    >
      <h2 className="font-serif text-2xl mb-4 font-bold">{title}</h2>
      
      {/* Info badges */}
      {(capacity || dimensions) && (
        <div className="flex flex-wrap gap-3 mb-5">
          {capacity && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl">
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">{capacity}</span>
            </div>
          )}
          {dimensions && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary rounded-xl">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{dimensions}</span>
            </div>
          )}
        </div>
      )}
      
      {description && (
        <p className="text-muted-foreground leading-relaxed mb-6">
          {description}
        </p>
      )}
      
      {images && images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {images.map((img, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onOpenLightbox(img)}
              className="relative aspect-[4/3] rounded-xl overflow-hidden group"
            >
              <img 
                src={img} 
                alt={`${title} ${i + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors duration-300 flex items-center justify-center">
                <Expand className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
