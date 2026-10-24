import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { existsSync, readFileSync } from "node:fs";

// Variabel VITE_* dari environment build (Railway) atau dari file .env.
function buildEnv(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  const envPath = path.resolve(__dirname, '.env');
  if (!existsSync(envPath)) return '';
  const line = readFileSync(envPath, 'utf8').split(/\r?\n/).find(l => l.trim().startsWith(`${name}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '') : '';
}

function firstPaintResources(): Plugin {
  return {
    name: 'first-paint-resources',
    transformIndexHtml(html: string) {
      // Di Railway font dimuat dari Google Fonts (link di index.html dipertahankan), karena
      // font self-host Lovable berada di CDN /__l5e/ yang hanya ada di hosting Lovable.
      const fontHints = '';
      const apiUrl = buildEnv('VITE_API_URL').replace(/\/$/, '');
      const minioPrefix = `${buildEnv('VITE_STORAGE_PUBLIC_URL').replace(/\/$/, '')}/gym-images/`;
      const apiOrigin = apiUrl || process.env.VITE_SUPABASE_URL;
      const apiHint = apiOrigin ? `<link rel="preconnect" href="${new URL(apiOrigin).origin}" crossorigin />` : '';
      html = html.replace('<head>', `<head>${fontHints}${apiHint}`);
      const snapshotPath = path.resolve(__dirname, 'src/generated/hero-slides.json');
      if (!existsSync(snapshotPath)) return html;
      const slides = JSON.parse(readFileSync(snapshotPath, 'utf8'));
      const src = slides[0]?.image_url;
      if (typeof src !== 'string') return html;
      const imageUrl = new URL(src);
      const cachedPath = path.resolve(__dirname, 'src/generated/public-image-preloads.json');
      const cached = existsSync(cachedPath) ? JSON.parse(readFileSync(cachedPath, 'utf8'))[src] : undefined;
      // Railway: foto di MinIO dikecilkan oleh backend (/img). URL harus sama persis dengan
      // yang dibuat cmsImageUrl/cmsImageSrcSet (q=75) supaya preload terpakai.
      const railway = apiUrl && minioPrefix !== '/gym-images/' && src.startsWith(minioPrefix) && !/\.(svg|gif)$/i.test(src)
        ? src.slice(minioPrefix.length) : undefined;
      if (!cached && !railway && !imageUrl.pathname.startsWith('/storage/v1/object/public/')) return html;
      imageUrl.pathname = imageUrl.pathname.replace('/object/public/', '/render/image/public/');
      const rendition = (width: number) => {
        if (cached?.[width]) return cached[width];
        if (railway) return `${apiUrl}/img/${railway}?w=${width}&q=75`;
        const url = new URL(imageUrl);
        url.searchParams.set('width', String(width));
        url.searchParams.set('quality', '75');
        url.searchParams.set('resize', 'contain');
        return url.toString();
      };
      // The document is shared by all routes; preload only on the home page.
      const preload = `<script>if(location.pathname==='/'){var l=document.createElement('link');l.rel='preload';l.as='image';l.href=${JSON.stringify(rendition(1920))};l.imageSrcset=${JSON.stringify([320,640,960,1440,1920].map(w => `${rendition(w)} ${w}w`).join(', '))};l.imageSizes='100vw';l.fetchPriority='high';document.head.appendChild(l);}</script>`;
      // Place the hint before stylesheets, not after the blocking app CSS.
      return html.replace('<head>', `<head>${preload}`);
    },
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        const document = bundle['index.html'];
        if (!document || document.type !== 'asset') return;
        // Inline the small shared CSS instead of another blocking network round trip.
        document.source = String(document.source).replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^\"]+)"[^>]*>/g, (tag, href) => {
          const css = bundle[href.replace(/^\//, '')];
          if (!css || css.type !== 'asset' || !href.endsWith('.css')) return tag;
          return `<style>${String(css.source).replace(/<\/style/gi, '<\\/style')}</style>`;
        });
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    firstPaintResources(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
