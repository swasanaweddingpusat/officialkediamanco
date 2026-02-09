import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Matterport360EmbedProps {
  url: string;
  className?: string;
}

export function Matterport360Embed({ url, className }: Matterport360EmbedProps) {
  const embedUrl = useMemo(() => {
    // Convert regular Matterport URLs to embed format
    if (!url || typeof url !== 'string') {
      console.log('Invalid URL:', url);
      return null;
    }

    console.log('Raw Matterport URL:', url);
    
    // Extract the ID from various Matterport URL formats
    let matterportId = '';
    
    // Pattern to match matterport IDs in various formats
    // Examples: 
    // - https://my.matterport.com/show/?m=abc123def456
    // - https://my.matterport.com/show/abc123def456
    // - https://my.matterport.com/embed/abc123def456
    // - abc123def456 (direct ID)
    
    // Try to extract from URL parameters
    const paramMatch = url.match(/[?&]m=([a-zA-Z0-9]+)/);
    if (paramMatch) {
      matterportId = paramMatch[1];
    } else {
      // Try to extract from path
      const pathMatch = url.match(/\/(?:show|embed)\/([a-zA-Z0-9]+)/);
      if (pathMatch) {
        matterportId = pathMatch[1];
      } else {
        // Check if URL might be just the ID
        const idMatch = url.match(/^[a-zA-Z0-9]{20,}$/);
        if (idMatch) {
          matterportId = url;
        }
      }
    }

    console.log('Extracted Matterport ID:', matterportId);

    if (!matterportId) {
      console.warn('Could not extract Matterport ID from URL:', url);
      return null;
    }
    
    return `https://my.matterport.com/show/?m=${matterportId}`;
  }, [url]);

  if (!embedUrl) {
    console.log('No valid embedUrl for Matterport component');
    return null;
  }

  console.log('Rendering Matterport embed with URL:', embedUrl);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">360° Virtual Tour</h3>
        <p className="text-sm text-muted-foreground">
          Explore this location with our interactive 360° virtual tour powered by Matterport.
        </p>
      </div>
      
      <div className="relative w-full overflow-hidden rounded-lg border border-border bg-gray-900 aspect-video">
        <iframe
          src={embedUrl}
          title="360 Virtual Tour"
          className="w-full h-full border-0"
          allow="xr-spatial-tracking"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
        />
      </div>

      {/* Display the link */}
      <div className="p-3 bg-secondary/50 rounded-lg border border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">Matterport Link</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary/90 hover:underline truncate block"
            >
              {url}
            </a>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4 text-primary" />
          </a>
        </div>
      </div>
    </div>
  );
}
