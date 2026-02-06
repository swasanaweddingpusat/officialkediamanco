import { useState } from 'react';
import { Play, X, Quote } from 'lucide-react';
import { useVideoTestimonials } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';

type VideoSourceType = 'upload' | 'youtube' | 'tiktok';

const detectVideoSource = (url: string): VideoSourceType => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'upload';
};

const getYouTubeId = (url: string): string | null => {
  try {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,           // YouTube Shorts
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,          // Standard YouTube
      /(?:youtu\.be\/)([^&\n?#]+)/,                       // YouTube short link
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,            // Embedded
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/  // Fallback
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const id = match[1] || match[2];
        if (id && id.length === 11) {
          return id;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting YouTube ID:', error);
    return null;
  }
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
            Testimoni
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 font-bold">
            Apa Kata Mereka
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Dengarkan pengalaman langsung dari klien kami
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {testimonials.map((testimonial) => {
            const videoSource = detectVideoSource(testimonial.video_url);
            const youtubeId = videoSource === 'youtube' ? getYouTubeId(testimonial.video_url) : null;
            
            return (
              <div
                key={testimonial.id}
                className="group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-card"
                onClick={() => setActiveVideo({ url: testimonial.video_url, type: videoSource })}
              >
                {/* Thumbnail or Video Preview */}
                {testimonial.thumbnail_url ? (
                  <img
                    src={testimonial.thumbnail_url}
                    alt={testimonial.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : videoSource === 'youtube' && youtubeId ? (
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
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
            );
          })}
        </div>
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          {/* Close Button */}
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-[10000]"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Video Container */}
          <div className="relative w-full max-w-5xl">
            {/* YouTube */}
            {activeVideo.type === 'youtube' && (
              (() => {
                const youtubeId = getYouTubeId(activeVideo.url);
                if (youtubeId) {
                  return (
                    <div className="w-full aspect-video rounded-lg overflow-hidden">
                      <iframe
                        key={`youtube-${youtubeId}`}
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        title="YouTube Video"
                      />
                    </div>
                  );
                }
                return (
                  <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-white mb-2">Video tidak dapat dimuat</p>
                      <p className="text-white/60 text-sm">URL: {activeVideo.url}</p>
                    </div>
                  </div>
                );
              })()
            )}

            {/* TikTok */}
            {activeVideo.type === 'tiktok' && (
              (() => {
                const tikTokId = getTikTokId(activeVideo.url);
                if (tikTokId) {
                  return (
                    <div className="w-full max-h-[80vh] flex items-center justify-center rounded-lg overflow-hidden">
                      <iframe
                        key={`tiktok-${tikTokId}`}
                        src={`https://www.tiktok.com/embed/v2/${tikTokId}`}
                        className="w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        title="TikTok Video"
                        style={{ maxHeight: '80vh' }}
                      />
                    </div>
                  );
                }
                return (
                  <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-white mb-2">Video tidak dapat dimuat</p>
                      <p className="text-white/60 text-sm">URL: {activeVideo.url}</p>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Upload Video */}
            {activeVideo.type === 'upload' && (
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  key={`upload-${activeVideo.url}`}
                  src={activeVideo.url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                  controlsList="nodownload"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
