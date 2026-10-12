import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
import { existsSync, readFileSync } from "node:fs";

function firstPaintResources() {
  return {
    name: 'first-paint-resources',
    transformIndexHtml(html: string) {
      const snapshotPath = path.resolve(__dirname, 'src/generated/hero-slides.json');
      if (!existsSync(snapshotPath)) return html;
      const slides = JSON.parse(readFileSync(snapshotPath, 'utf8'));
      const src = slides[0]?.image_url;
      if (typeof src !== 'string') return html;
      const imageUrl = new URL(src);
      if (!imageUrl.pathname.startsWith('/storage/v1/object/public/')) return html;
      imageUrl.pathname = imageUrl.pathname.replace('/object/public/', '/render/image/public/');
      const rendition = (width: number) => {
        const url = new URL(imageUrl);
        url.searchParams.set('width', String(width));
        url.searchParams.set('quality', '75');
        url.searchParams.set('resize', 'contain');
        return url.toString();
      };
      const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
      // The document is shared by all routes; preload only on the home page.
      const preload = `<script>if(location.pathname==='/'){var l=document.createElement('link');l.rel='preload';l.as='image';l.href=${JSON.stringify(rendition(1920))};l.imageSrcset=${JSON.stringify([320,640,960,1440,1920].map(w => `${rendition(w)} ${w}w`).join(', '))};l.imageSizes='100vw';l.fetchPriority='high';document.head.appendChild(l);}</script>`;
      // Keep the chosen font families, but don't block the initial paint on Google CSS.
      const withFonts = html.replace(/<link href="(https:\/\/fonts\.googleapis\.com\/css2[^\"]+)" rel="stylesheet"\s*\/>/g,
        (_, href) => `<link href="${escape(href.replaceAll('&amp;', '&'))}" rel="stylesheet" media="print" onload="this.media='all'" /><noscript><link href="${escape(href.replaceAll('&amp;', '&'))}" rel="stylesheet" /></noscript>`);
      return withFonts.replace('</head>', `${preload}</head>`);
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
    mcpPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
