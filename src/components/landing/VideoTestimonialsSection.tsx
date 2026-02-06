import { useState } from 'react';
import { Play, X, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVideoTestimonials } from '@/hooks/useCMS';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

type VideoSourceType = 'upload' | 'youtube' | 'tiktok';

const detectVideoSource = (url: string): VideoSourceType => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'upload';
};

const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getTikTokId = (url: string): string | null => {
  const regExp = /tiktok\.com\/@[^/]+\/video\/(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export function VideoTestimonialsSection() {
  const { data: testimonials, isLoading } = useVideoTestimonials();
  const [activeVideo, setActiveVideo] = useState<{ url: string; type: VideoSourceType } | null>(null);

  if (isLoading) {
    return (
      <section className="py-24 md:py-32 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
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
    <section className="py-24 md:py-32 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="font-script text-3xl md:text-4xl text-primary mb-4">Cerita Mereka</p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wide mb-6">
            Testimoni <span className="text-gradient italic">Klien</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto">
            Dengarkan pengalaman langsung dari klien kami
          </p>
        </motion.div>

        {/* Video Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {testimonials.map((testimonial, index) => {
            const videoSource = detectVideoSource(testimonial.video_url);
            const youtubeId = videoSource === 'youtube' ? getYouTubeId(testimonial.video_url) : null;
            
            return (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer border border-border/50 hover:border-primary/30 transition-all"
                onClick={() => setActiveVideo({ url: testimonial.video_url, type: videoSource })}
              >
                {/* Thumbnail or Video Preview */}
                {testimonial.thumbnail_url ? (
                  <img
                    src={testimonial.thumbnail_url}
                    alt={testimonial.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : videoSource === 'youtube' && youtubeId ? (
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                    alt={testimonial.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-primary/50 bg-primary/20 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300">
                    <Play className="w-6 h-6 md:w-7 md:h-7 text-foreground ml-1" />
                  </div>
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <p className="font-display text-lg text-foreground tracking-wide truncate">
                    {testimonial.name}
                  </p>
                  {testimonial.role && (
                    <p className="text-muted-foreground text-sm truncate">
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
      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-3xl p-0 bg-background border border-border/50 overflow-hidden">
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 right-4 z-10 p-2 bg-background/80 hover:bg-background rounded-full transition-colors border border-border/50"
          >
            <X className="w-5 h-5" />
          </button>
          {activeVideo && activeVideo.type === 'youtube' && getYouTubeId(activeVideo.url) && (
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(activeVideo.url)}?autoplay=1`}
              className="w-full aspect-video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {activeVideo && activeVideo.type === 'tiktok' && getTikTokId(activeVideo.url) && (
            <iframe
              src={`https://www.tiktok.com/embed/v2/${getTikTokId(activeVideo.url)}`}
              className="w-full aspect-[9/16] max-h-[80vh]"
              allowFullScreen
            />
          )}
          {activeVideo && activeVideo.type === 'upload' && (
            <video
              src={activeVideo.url}
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
