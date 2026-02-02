import { useState } from 'react';
import { Play, X, Quote } from 'lucide-react';
import { useVideoTestimonials } from '@/hooks/useCMS';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export function VideoTestimonialsSection() {
  const { data: testimonials, isLoading } = useVideoTestimonials();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-secondary/30">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[9/16] rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-secondary/30">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <Quote className="w-3 h-3 sm:w-4 sm:h-4" />
            Testimonials
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3">
            Apa Kata Mereka
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Dengarkan pengalaman langsung dari klien kami
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-card"
              onClick={() => setActiveVideo(testimonial.video_url)}
            >
              {/* Thumbnail or Video Preview */}
              {testimonial.thumbnail_url ? (
                <img
                  src={testimonial.thumbnail_url}
                  alt={testimonial.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <video
                  src={testimonial.video_url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-primary/90 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary-foreground ml-1" fill="currentColor" />
                </div>
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <p className="font-medium text-white text-sm sm:text-base truncate">
                  {testimonial.name}
                </p>
                {testimonial.role && (
                  <p className="text-white/70 text-xs sm:text-sm truncate">
                    {testimonial.role}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-none overflow-hidden">
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-2 right-2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {activeVideo && (
            <video
              src={activeVideo}
              className="w-full aspect-[9/16] max-h-[80vh] object-contain"
              controls
              autoPlay
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
