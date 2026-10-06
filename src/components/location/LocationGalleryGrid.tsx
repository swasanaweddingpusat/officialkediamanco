import { Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationGalleryGridProps {
  images: string[];
  title?: string;
  venueName?: string;
  onOpenLightbox: (image: string) => void;
}

export const LocationGalleryGrid = ({ images, title = 'Galeri', venueName = 'venue', onOpenLightbox }: LocationGalleryGridProps) => {
  if (!images.length) return null;
  return (
    <section className="venue-section">
      <div className="flex items-baseline justify-between gap-4 border-b border-primary/15 pb-4 mb-8">
        <h2 className="font-serif text-4xl italic !border-0 !pb-0 !mb-0">{title}</h2>
        <span className="text-xs text-foreground/65 tabular-nums">{String(images.length).padStart(2, '0')} foto</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {images.map((img, i) => <Button key={`${img}-${i}`} variant="ghost" onClick={() => onOpenLightbox(img)} aria-label={`Perbesar foto ${i + 1} ${venueName}`} className={`group relative block w-full h-auto p-0 rounded-none overflow-hidden border border-primary/15 ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
          <img src={img} alt={`${venueName} — foto galeri ${i + 1}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]" />
          <span className="absolute right-3 bottom-3 p-2 bg-background/75 text-foreground group-hover:bg-background transition-colors"><Expand aria-hidden="true" /></span>
        </Button>)}
      </div>
    </section>
  );
};
