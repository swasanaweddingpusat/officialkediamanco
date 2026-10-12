import { useState, type ImgHTMLAttributes } from 'react';
import { cmsImageUrl, cmsImageSrcSet } from '@/lib/cms-image';

type CMSImageProps = ImgHTMLAttributes<HTMLImageElement> & { src: string; imageWidth?: number };

export function CMSImage({ src, imageWidth = 960, sizes = '100vw', loading = 'lazy', onError, ...props }: CMSImageProps) {
  const [failedSource, setFailedSource] = useState<string>();
  const fallback = failedSource === src;
  return <img {...props} src={fallback ? src : cmsImageUrl(src, imageWidth)} srcSet={fallback ? undefined : cmsImageSrcSet(src)} sizes={sizes} loading={loading} decoding="async" onError={event => {
    if (!fallback && cmsImageUrl(src, imageWidth) !== src) setFailedSource(src);
    else onError?.(event);
  }} />;
}