import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface LocationHeroGalleryProps {
  images: string[];
  locationName: string;
  selectedImageIndex: number;
  isComingSoon?: boolean;
  onSelectImage: (index: number) => void;
  onOpenLightbox: (image: string) => void;
}

export const LocationHeroGallery = ({
  images,
  locationName,
  selectedImageIndex,
  isComingSoon,
  onSelectImage,
  onOpenLightbox,
}: LocationHeroGalleryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Image */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-2xl bg-muted group">
        {images.length > 0 ? (
          <>
            <img
              src={images[selectedImageIndex]}
              alt={locationName}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
              onClick={() => onOpenLightbox(images[selectedImageIndex])}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <MapPin className="w-16 h-16 md:w-24 md:h-24 opacity-20" />
          </div>
        )}

        {/* Coming Soon Badge */}
        {isComingSoon && (
          <div className="absolute top-4 right-4 px-5 py-2.5 bg-accent text-accent-foreground font-bold text-sm rounded-full shadow-lg backdrop-blur-sm">
            Coming Soon
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium">
            {selectedImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {images.map((img, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectImage(i)}
              className={`flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 md:w-28 md:h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                selectedImageIndex === i
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
                  : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
