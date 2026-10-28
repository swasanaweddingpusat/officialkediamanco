// Google Tag Manager untuk situs publik kediaman.co.
//
// - ID container dibaca dari VITE_GTM_ID saat build (set di variabel Railway, contoh "GTM-XXXXXXX").
//   Tanpa ID, tidak ada script Google yang dimuat.
// - GTM dimuat setelah interaksi pertama atau saat browser idle (maks. ~4 detik setelah load),
//   supaya tidak menambah beban render awal (PageSpeed). Event yang terjadi sebelum itu
//   tetap antre di dataLayer dan terkirim saat GTM siap.
// - Halaman admin/login tidak dimuati GTM supaya aktivitas staf tidak tercatat.
// - Page view SPA ditangani GA4 lewat "Enhanced measurement → Page changes based on browser
//   history events" (aktif secara default), jadi tidak ada push page_view manual di sini.

type DataLayerEvent = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
  }
}

const GTM_ID = (import.meta.env.VITE_GTM_ID as string | undefined)?.trim() ?? "";
const PRIVATE_PATHS = ["/admin", "/auth", "/.lovable"];

let loaded = false;

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function dataLayer(): DataLayerEvent[] {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

function loadGtm(): void {
  if (loaded || !/^GTM-[A-Z0-9]+$/.test(GTM_ID)) return;
  if (isPrivatePath(location.pathname)) return;
  loaded = true;
  dataLayer().push({ "gtm.start": Date.now(), event: "gtm.js" });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(s);
}

/** Kirim event ke dataLayer (diteruskan GTM ke GA4). Jangan masukkan data pribadi (nama, email, nomor HP). */
export function track(event: string, params: DataLayerEvent = {}): void {
  if (!GTM_ID || isPrivatePath(location.pathname)) return;
  dataLayer().push({ event, ...params });
}

function classifyLink(href: string): { event: string; method: string } | null {
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)\//i.test(href)) {
    return { event: "whatsapp_click", method: "whatsapp" };
  }
  if (href.startsWith("tel:")) return { event: "contact_click", method: "phone" };
  if (href.startsWith("mailto:")) return { event: "contact_click", method: "email" };
  return null;
}

/** Pasang GTM + pelacakan klik WhatsApp/telepon/email. Dipanggil sekali dari main.tsx. */
export function initAnalytics(): void {
  if (!GTM_ID) return;
  dataLayer();

  const start = () => {
    window.removeEventListener("pointerdown", start);
    window.removeEventListener("keydown", start);
    window.removeEventListener("scroll", start);
    loadGtm();
  };
  window.addEventListener("pointerdown", start, { once: true, passive: true });
  window.addEventListener("keydown", start, { once: true });
  window.addEventListener("scroll", start, { once: true, passive: true });
  const idle = () => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 4000 });
    else setTimeout(start, 3000);
  };
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });

  // Satu listener untuk semua tautan (FloatingChat, CTA, footer, halaman venue, dst.).
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const kind = classifyLink(a.href);
      if (!kind) return;
      track(kind.event, {
        contact_method: kind.method,
        link_text: (a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 80),
        page_path: location.pathname,
      });
    },
    { capture: true },
  );
}
