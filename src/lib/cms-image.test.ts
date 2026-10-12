import { describe, expect, it, vi } from 'vitest';

vi.stubEnv('VITE_SUPABASE_URL', 'https://project.example');
const { cmsImageUrl, cmsImageSrcSet } = await import('./cms-image');

describe('CMS image delivery', () => {
  it('requests a bounded rendition from the project public storage', () => {
    const url = new URL(cmsImageUrl('https://project.example/storage/v1/object/public/gym-images/photo.jpg', 640));
    expect(url.pathname).toBe('/storage/v1/render/image/public/gym-images/photo.jpg');
    expect(url.searchParams.get('width')).toBe('640');
    expect(url.searchParams.get('quality')).toBe('75');
  });
  it('does not transform another host, private storage, or vector images', () => {
    for (const src of ['https://other.example/storage/v1/object/public/pic.jpg', 'https://project.example/storage/v1/object/sign/pic.jpg', '/assets/pic.jpg', 'https://project.example/storage/v1/object/public/logo.svg']) {
      expect(cmsImageUrl(src, 640)).toBe(src);
      expect(cmsImageSrcSet(src)).toBeUndefined();
    }
  });
  it('provides distinct mobile and desktop renditions', () => {
    const src = 'https://project.example/storage/v1/object/public/gym-images/photo.jpg';
    const set = cmsImageSrcSet(src, [320, 960]);
    expect(set).toContain('width=320&quality=75&resize=contain 320w');
    expect(set).toContain('width=960&quality=75&resize=contain 960w');
  });
});