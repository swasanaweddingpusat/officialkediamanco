import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

interface Matterport360EmbedProps {
  url: string;
}

export function Matterport360Embed({ url }: Matterport360EmbedProps) {
  if (!url) return null;

  // Extract Matterport model ID from URL if needed
  const getEmbedUrl = (inputUrl: string): string => {
    // If it's already an embed URL, return as is
    if (inputUrl.includes('/show/')) {
      return inputUrl;
    }
    
    // Try to extract model ID and create embed URL
    const matterportRegex = /matterport\.com\/show\/\?m=([a-zA-Z0-9]+)/;
    const match = inputUrl.match(matterportRegex);
    
    if (match) {
      return `https://my.matterport.com/show/?m=${match[1]}`;
    }
    
    // Return original URL if we can't parse it
    return inputUrl;
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Compass className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-display text-2xl font-semibold">Virtual Tour 360°</h3>
      </div>

      <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-card">
        <iframe
          src={embedUrl}
          title="Virtual Tour 360"
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="xr-spatial-tracking"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Jelajahi ruangan secara virtual dengan tampilan 360°. Gunakan mouse atau sentuh untuk melihat sekeliling.
      </p>
    </motion.div>
  );
}
