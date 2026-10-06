import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface LocationLightboxProps {
  image: string | null;
  images?: string[];
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export const LocationLightbox = ({ 
  image, 
  images = [],
  onClose,
  onNavigate 
}: LocationLightboxProps) => {
  const currentIndex = image ? images.indexOf(image) : -1;
  const canNavigate = images.length > 1;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!image) return;
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [image]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && onNavigate) onNavigate('prev');
    if (e.key === 'ArrowRight' && onNavigate) onNavigate('next');
  };

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex items-center justify-center"
          onClick={onClose}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label="Galeri foto venue"
        >
          {/* Close button */}
          <Button
            ref={closeRef}
            variant="ghost"
            size="icon"
            aria-label="Tutup galeri"
            className="absolute top-4 right-4 p-3 bg-secondary/80 hover:bg-secondary rounded-full z-10 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Navigation buttons */}
          {canNavigate && onNavigate && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Foto sebelumnya"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-secondary/80 hover:bg-secondary rounded-full z-10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('prev');
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Foto berikutnya"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-secondary/80 hover:bg-secondary rounded-full z-10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('next');
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Image counter */}
          {canNavigate && currentIndex >= 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-secondary/80 rounded-full text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <motion.img
            key={image}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            src={image}
            alt={`Foto venue ${currentIndex >= 0 ? currentIndex + 1 : ''}`}
            className="max-w-[90vw] max-h-[85vh] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
