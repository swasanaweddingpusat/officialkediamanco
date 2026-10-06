import { useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, MapPin, CalendarDays, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

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

export const LocationNetflixHero = ({ videoUrl, posterImage, locationName, category, address, isComingSoon, onScrollToDetails, onBook }: LocationNetflixHeroProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const youtubeId = videoUrl?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)?.[1];
  const directVideo = videoUrl && !youtubeId && !videoUrl.includes('tiktok.com') && !videoFailed;
  const words = locationName.split(' ');
  const titleBreak = words.length > 3 ? Math.ceil(words.length / 2) : words.length;
  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { try { await video.play(); } catch { setIsPlaying(false); } }
    else video.pause();
  };

  return (
    <section className="relative w-full h-[70svh] min-h-[520px] max-h-[760px] overflow-hidden bg-background flex items-end">
      <div className="absolute inset-0">
        {directVideo ? (
          <video ref={videoRef} src={videoUrl || undefined} poster={posterImage} autoPlay={!reduceMotion} muted={isMuted} loop playsInline onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onError={() => setVideoFailed(true)} aria-label={`Video ${locationName}`} className="w-full h-full object-cover" />
        ) : posterImage ? <img src={posterImage} alt={`Interior venue ${locationName}`} className="w-full h-full object-cover" fetchPriority="high" /> : null}
      </div>
      <div className="absolute inset-0 venue-hero-overlay pointer-events-none" />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-20 lg:pb-16">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 text-primary mb-4 text-xs uppercase font-semibold">
            {category && <span>{category}</span>}
            {isComingSoon && <span className="border border-primary/40 px-3 py-1">Segera Hadir</span>}
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.05] mb-6 break-words">
            {words.slice(0, titleBreak).join(' ')}
            {titleBreak < words.length && <><br /><span className="italic">{words.slice(titleBreak).join(' ')}</span></>}
          </h1>
          <div className="flex flex-wrap items-center gap-6 lg:gap-8">
            {address && <div className="flex items-start gap-2 text-sm text-foreground/85 max-w-md"><MapPin className="w-4 h-4 text-primary shrink-0 mt-1" /><span className="leading-relaxed">{address}</span></div>}
            <div className="flex flex-wrap gap-3">
              {onBook && <Button onClick={onBook} size="lg" className="rounded-none text-xs uppercase font-semibold h-12 px-5 sm:px-8"><CalendarDays />Reservasi Sekarang</Button>}
              {onScrollToDetails && <Button onClick={onScrollToDetails} size="lg" variant="outline" className="rounded-none text-xs uppercase h-12 px-5 sm:px-8 bg-background/20 border-foreground/30"><ArrowDown />Lihat Detail</Button>}
              {youtubeId && <Button onClick={() => setYoutubeOpen(true)} size="icon" variant="outline" title="Tonton video venue" aria-label="Tonton video venue" className="h-12 w-12 rounded-none bg-background/20 border-foreground/30"><Play /></Button>}
            </div>
          </div>
        </div>
      </div>
      {directVideo && <div className="absolute bottom-4 right-6 lg:right-8 z-20 flex gap-2">
        <Button variant="outline" size="icon" onClick={togglePlay} title={isPlaying ? 'Jeda video' : 'Putar video'} aria-label={isPlaying ? 'Jeda video' : 'Putar video'} className="bg-background/70 border-foreground/30">{isPlaying ? <Pause /> : <Play />}</Button>
        <Button variant="outline" size="icon" onClick={() => setIsMuted(m => !m)} title={isMuted ? 'Aktifkan suara' : 'Matikan suara'} aria-label={isMuted ? 'Aktifkan suara' : 'Matikan suara'} className="bg-background/70 border-foreground/30">{isMuted ? <VolumeX /> : <Volume2 />}</Button>
      </div>}
      {youtubeId && <Dialog open={youtubeOpen} onOpenChange={setYoutubeOpen}><DialogContent className="max-w-5xl p-6"><DialogTitle className="font-serif">Video {locationName}</DialogTitle>{youtubeOpen && <iframe src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen title={`Video ${locationName}`} className="w-full aspect-video" />}</DialogContent></Dialog>}
    </section>
  );
};
