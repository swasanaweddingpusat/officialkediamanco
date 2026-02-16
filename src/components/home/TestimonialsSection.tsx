import { useState } from 'react';
import { motion } from 'framer-motion';
import { useVideoTestimonials } from '@/hooks/useCMS';
import { Star, Play, X, Quote } from 'lucide-react';

const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]?.length === 11) return match[1];
  }
  return null;
};

type VideoSource = 'upload' | 'youtube' | 'tiktok';

const detectSource = (url: string): VideoSource => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'upload';
};

export function TestimonialsSection() {
  const { data: testimonials } = useVideoTestimonials();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const activeTestimonials = testimonials?.slice(0, 6) || [];

  if (!activeTestimonials.length) return null;

  const activeSource = activeVideo ? detectSource(activeVideo) : null;
  const activeYoutubeId = activeVideo && activeSource === 'youtube' ? getYouTubeId(activeVideo) : null;

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-background to-card/30">
      <div className="container mx-auto px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <Quote className="w-3 h-3 sm:w-4 sm:h-4" />
            Testimoni
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-4 font-bold tracking-tight">
            TESTIMONI <span className="text-primary">KLIEN</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Dengarkan pengalaman nyata dari klien-klien kami yang puas
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {activeTestimonials.map((testimonial, index) => {
            const source = detectSource(testimonial.video_url);
            const youtubeId = source === 'youtube' ? getYouTubeId(testimonial.video_url) : null;

            return (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[9/16] bg-muted border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer"
                onClick={() => setActiveVideo(testimonial.video_url)}
              >
                {/* Thumbnail */}
                {testimonial.thumbnail_url ? (
                  <img
                    src={testimonial.thumbnail_url}
                    alt={testimonial.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : youtubeId ? (
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                    alt={testimonial.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Play className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground ml-0.5" fill="currentColor" />
                  </div>
                </div>

                {/* Info at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <div className="flex gap-0.5 mb-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                  </div>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-white line-clamp-1">
                    {testimonial.name}
                  </h3>
                  {testimonial.role && (
                    <p className="text-xs text-white/70 line-clamp-1">
                      {testimonial.role}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={() => setActiveVideo(null)}
        >
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-[10000]"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {activeSource === 'youtube' && activeYoutubeId ? (
              <div className="w-full aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${activeYoutubeId}?autoplay=1&rel=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  title="Video Testimonial"
                />
              </div>
            ) : (
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={activeVideo}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
