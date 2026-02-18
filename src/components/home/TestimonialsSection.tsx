import { useState } from 'react';
import { motion } from 'framer-motion';
import { useVideoTestimonials } from '@/hooks/useCMS';
import { Star, Play, X } from 'lucide-react';

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
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 lg:mb-20"
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
            <span className="w-8 h-px bg-primary" />
            Testimoni
          </p>
          <h2 className="font-serif text-3xl lg:text-5xl font-bold leading-tight">
            Testimoni <span className="text-primary">Klien</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
          {activeTestimonials.map((testimonial, index) => {
            const source = detectSource(testimonial.video_url);
            const youtubeId = source === 'youtube' ? getYouTubeId(testimonial.video_url) : null;

            return (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group relative overflow-hidden aspect-[9/16] rounded-sm cursor-pointer"
                onClick={() => setActiveVideo(testimonial.video_url)}
              >
                {testimonial.thumbnail_url ? (
                  <img src={testimonial.thumbnail_url} alt={testimonial.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : youtubeId ? (
                  <img src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`} alt={testimonial.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Play className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Play */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
                  </div>
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                  </div>
                  <h3 className="font-serif text-sm lg:text-base font-bold text-white line-clamp-1">{testimonial.name}</h3>
                  {testimonial.role && <p className="text-[11px] text-white/60 line-clamp-1">{testimonial.role}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4" onClick={() => setActiveVideo(null)}>
          <button onClick={() => setActiveVideo(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[10000]">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {activeSource === 'youtube' && activeYoutubeId ? (
              <div className="w-full aspect-video rounded-sm overflow-hidden">
                <iframe src={`https://www.youtube.com/embed/${activeYoutubeId}?autoplay=1&rel=0`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen title="Video Testimonial" />
              </div>
            ) : (
              <div className="w-full aspect-video bg-black rounded-sm overflow-hidden">
                <video src={activeVideo} className="w-full h-full object-contain" controls autoPlay playsInline />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
