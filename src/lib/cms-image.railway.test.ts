import { describe, expect, it, vi } from 'vitest';

vi.stubEnv('VITE_API_URL', 'https://api.example');
vi.stubEnv('VITE_STORAGE_PUBLIC_URL', 'https://bucket.example');
const { cmsImageUrl, cmsImageSrcSet } = await import('./cms-image');

describe('CMS image delivery on Railway', () => {
  it('serves MinIO images through the resize endpoint', () => {
    expect(cmsImageUrl('https://bucket.example/gym-images/hero/a.jpg', 640)).toBe('https://api.example/img/hero/a.jpg?w=640&q=75');
    expect(cmsImageSrcSet('https://bucket.example/gym-images/hero/a.jpg', [320, 960])).toBe(
      'https://api.example/img/hero/a.jpg?w=320&q=75 320w, https://api.example/img/hero/a.jpg?w=960&q=75 960w',
    );
  });
  it('leaves vector images and other hosts untouched', () => {
    for (const src of ['https://bucket.example/gym-images/logo.svg', 'https://other.example/gym-images/a.jpg', '/assets/a.jpg']) {
      expect(cmsImageUrl(src, 640)).toBe(src);
    }
  });
});
