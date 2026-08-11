interface PortfolioVideoProps {
  url: string;
  className?: string;
  title?: string;
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/shorts/')) {
        return `https://www.youtube.com/embed/${u.pathname.split('/')[2]}`;
      }
      if (u.pathname.startsWith('/embed/')) return url;
    }
    if (u.hostname.includes('tiktok.com')) {
      const parts = u.pathname.split('/');
      const idx = parts.indexOf('video');
      if (idx !== -1 && parts[idx + 1]) {
        return `https://www.tiktok.com/embed/v2/${parts[idx + 1]}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function PortfolioVideo({ url, className, title }: PortfolioVideoProps) {
  const embed = getEmbedUrl(url);

  if (embed) {
    return (
      <iframe
        src={embed}
        title={title || 'Video'}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  return (
    <video src={url} className={className} controls playsInline preload="metadata" />
  );
}
