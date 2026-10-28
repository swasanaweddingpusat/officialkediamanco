import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initAnalytics } from "./lib/analytics";
// Font self-host: @font-face di src/index.css, file di public/fonts.

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
initAnalytics();

// index.html may contain a static copy of the home hero (scripts/prerender-meta.ts) so the
// hero photo paints before this bundle runs. Remove it once the React hero image is ready.
const bootHero = document.getElementById("boot-hero");
if (bootHero) {
  const started = performance.now();
  const check = () => {
    const reactImage = document.querySelector<HTMLImageElement>("#root section.editorial-hero img");
    const ready = reactImage?.complete && reactImage.naturalWidth > 0;
    if (ready || location.pathname !== "/" || performance.now() - started > 10000) bootHero.remove();
    else requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}
