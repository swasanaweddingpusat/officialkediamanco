import { publicImageRenditions } from '@/generated/public-image-renditions';
const storageOrigin = import.meta.env.VITE_SUPABASE_URL;
// Railway: gambar di MinIO dikecilkan oleh backend (GET /img/<path>?w=&q=) menjadi WebP.
const apiUrl = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const minioPrefix = `${String(import.meta.env.VITE_STORAGE_PUBLIC_URL ?? '').replace(/\/$/, '')}/gym-images/`;

function railwayImageUrl(src: string, width: number, quality: number): string | undefined {
  if (!apiUrl || minioPrefix === '/gym-images/' || !src.startsWith(minioPrefix)) return undefined;
  const key = src.slice(minioPrefix.length).split('?')[0];
  if (!key || /\.(svg|gif)$/i.test(key)) return undefined;
  // Disajikan lewat domain situs (Caddy meneruskan /img/* ke backend) agar ikut cache CDN.
  return `/img/${key}?w=${width}&q=${quality}`;
}

export function cachedImageUrl(renditions: Record<number, string> | undefined, width: number): string | undefined {
  if (!renditions) return undefined;
  const widths = Object.keys(renditions).map(Number).sort((a, b) => a - b);
  const selected = widths.find(value => value >= width) ?? widths.at(-1);
  return selected === undefined ? undefined : renditions[selected];
}

// Only transform this project's public storage images, never arbitrary URLs.
export function cmsImageUrl(src: string, width: number, quality = 75): string {
  const cached = cachedImageUrl(publicImageRenditions[src], width);
  if (cached) return cached;
  const railway = railwayImageUrl(src, width, quality);
  if (railway) return railway;
  try {
    const url = new URL(src);
    if (url.origin !== storageOrigin || !url.pathname.startsWith('/storage/v1/object/public/') || /\.svg$/i.test(url.pathname)) return src;
    url.pathname = url.pathname.replace('/object/public/', '/render/image/public/');
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', String(quality));
    url.searchParams.set('resize', 'contain');
    return url.toString();
  } catch {
    return src;
  }
}

export function cmsImageSrcSet(src: string, widths = [320, 640, 960, 1440, 1920]): string | undefined {
  const cached = publicImageRenditions[src];
  if (cached) return Object.entries(cached).map(([width, url]) => `${url} ${width}w`).join(', ');
  if (cmsImageUrl(src, widths[0]) === src) return undefined;
  return widths.map(width => `${cmsImageUrl(src, width)} ${width}w`).join(', ');
}