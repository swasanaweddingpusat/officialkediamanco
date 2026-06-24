import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, MapPin, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationNetflixHeroProps {
  videoUrl?: string | null;
  posterImage?: string;
  locationName: string;
  category?: string | null;
  address?: string | null;
  isComingSoon?: boolean;
  onScrollToDetails?: () => void;
  onBook?: () => void;
}

const getYoutubeId = (url: string) => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
};

export const LocationNetflixHero = ({
  videoUrl,
  posterImage,
  locationName,
  category,
  address,
  isComingSoon,
  onScrollToDetails,
  onBook,
}: LocationNetflixHeroProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const youtubeId = videoUrl ? getYoutubeId(videoUrl) : null;
  const isDirectVideo = !!videoUrl && !youtubeId && !videoUrl.includes('tiktok.com');

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
  }, [isMuted]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  return (
    <section className="relative w-full h-[88svh] min-h-[560px] max-h-[900px] overflow-hidden bg-black -mt-16 lg:-mt-24">
      {/* Background media */}
      <div className="absolute inset-0">
        {isDirectVideo ? (
          <video
            ref={videoRef}
            src={videoUrl!}
            poster={posterImage}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&playsinline=1&rel=0&showinfo=0`}
            allow="autoplay; encrypted-media"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full pointer-events-none"
            title={locationName}
          />
        ) : posterImage ? (
          <img src={posterImage} alt={locationName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 to-background" />
        )}
      </div>

      {/* Netflix-style gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-end pb-16 lg:pb-24">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-2xl space-y-5"
          >
            {category && (
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-primary" />
                <span className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium">
                  {category}
                </span>
                {isComingSoon && (
                  <span className="px-2.5 py-0.5 bg-accent text-accent-foreground text-[10px] tracking-[0.2em] uppercase rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
            )}

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl tracking-tight font-bold text-foreground drop-shadow-lg leading-[1.05]">
              {locationName}
            </h1>

            {address && (
              <div className="flex items-start gap-2 text-foreground/85 text-sm lg:text-base">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <span className="leading-relaxed">{address}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-3">
              {onBook && (
                <Button
                  onClick={onBook}
                  size="lg"
                  className="rounded-full px-7 text-sm tracking-[0.1em] uppercase gap-2 shadow-xl"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Reservasi Sekarang
                </Button>
              )}
              {onScrollToDetails && (
                <Button
                  onClick={onScrollToDetails}
                  size="lg"
                  variant="secondary"
                  className="rounded-full px-7 text-sm tracking-[0.1em] uppercase gap-2 bg-foreground/15 hover:bg-foreground/25 backdrop-blur-md border border-foreground/20 text-foreground"
                >
                  <Info className="w-4 h-4" />
                  Lihat Detail
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Video controls (only for direct uploaded video) */}
      {isDirectVideo && (
        <div className="absolute bottom-6 right-6 z-20 flex gap-2">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-10 h-10 rounded-full border border-foreground/40 bg-background/40 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background/70 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMuted(m => !m)}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="w-10 h-10 rounded-full border border-foreground/40 bg-background/40 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background/70 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}
    </section>
  );
};
