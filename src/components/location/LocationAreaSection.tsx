import { motion } from 'framer-motion';
import { Users, Ruler, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      className="venue-section bg-card border border-border rounded-lg p-6 md:p-8"
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
        <div className={`grid gap-4 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.map((img, i) => (
            <Button
              key={i}
              variant="ghost"
              aria-label={`Perbesar foto ${title} ${i + 1}`}
              onClick={() => onOpenLightbox(img)}
              className="relative w-full h-auto p-0 aspect-[4/3] rounded-none overflow-hidden group border border-primary/15"
            >
              <img 
                src={img} 
                alt={`${title} ${i + 1}`}
                loading="lazy" 
                className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]" 
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors duration-300 flex items-center justify-center">
                <Expand className="w-6 h-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
              </div>
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
