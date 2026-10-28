// Google Analytics 4 / Google Tag Manager untuk situs publik kediaman.co.
//
// - ID dibaca saat build dari variabel Railway:
//     VITE_GTM_ID  = "GTM-XXXXXXX"  → muat Google Tag Manager (GA4 diatur di dalam GTM)
//     VITE_GA4_ID  = "G-XXXXXXXXXX" → muat GA4 langsung (gtag.js), dipakai bila GTM tidak di-set
//   Tanpa keduanya, tidak ada script Google yang dimuat.
// - Script dimuat setelah interaksi pertama atau saat browser idle (maks. ~4 detik setelah load),
//   supaya tidak menambah beban render awal (PageSpeed). Event sebelum itu antre di dataLayer.
// - Halaman admin/login tidak dilacak supaya aktivitas staf tidak tercatat.
// - Snippet GTM resmi (GTM-5GMWFZ55) dipasang statis di index.html atas permintaan pemilik situs.
//   Selama GA4 belum dikonfigurasi di dalam GTM, GA4 tetap dimuat langsung lewat VITE_GA4_ID.
//   Setelah tag GA4 di GTM dipublish: hapus VITE_GA4_ID dan set VITE_GTM_ID di Railway,
//   supaya page view tidak tercatat dua kali.
// - Page view SPA ditangani GA4 lewat "Enhanced measurement → Page changes based on browser
//   history events" (aktif secara default), jadi tidak ada page_view manual di sini.

type Params = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const RAW_GTM = ((import.meta.env.VITE_GTM_ID as string | undefined) ?? "").trim();
const RAW_GA4 = ((import.meta.env.VITE_GA4_ID as string | undefined) ?? "").trim();
const GTM_ID = /^GTM-[A-Z0-9]+$/.test(RAW_GTM) ? RAW_GTM : "";
const GA4_ID = !GTM_ID && /^G-[A-Z0-9]+$/.test(RAW_GA4) ? RAW_GA4 : "";
const ENABLED = Boolean(GTM_ID || GA4_ID);
const PRIVATE_PATHS = ["/admin", "/auth", "/.lovable"];

let loaded = false;

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function dataLayer(): unknown[] {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

function gtag(...args: unknown[]): void {
  // gtag.js membaca objek `arguments`, bukan array biasa.
  // eslint-disable-next-line prefer-rest-params
  dataLayer().push(arguments);
  void args;
}

function addScript(src: string): void {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function load(): void {
  if (loaded || !ENABLED || isPrivatePath(location.pathname)) return;
  loaded = true;
  if (GTM_ID) {
    // index.html sudah memuat snippet GTM resmi di <head>; jangan muat dua kali.
    if (document.querySelector(`script[src*="gtm.js?id=${GTM_ID}"]`)) return;
    dataLayer().push({ "gtm.start": Date.now(), event: "gtm.js" });
    addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`);
  } else {
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`);
  }
}

/** Kirim event ke GA4 (langsung atau lewat GTM). Jangan masukkan data pribadi (nama, email, nomor HP). */
export function track(event: string, params: Params = {}): void {
  if (!ENABLED || isPrivatePath(location.pathname)) return;
  if (GTM_ID) dataLayer().push({ event, ...params });
  else gtag("event", event, params);
}

function classifyLink(href: string): { event: string; method: string } | null {
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)\//i.test(href)) {
    return { event: "whatsapp_click", method: "whatsapp" };
  }
  if (href.startsWith("tel:")) return { event: "contact_click", method: "phone" };
  if (href.startsWith("mailto:")) return { event: "contact_click", method: "email" };
  return null;
}

/** Pasang GA4/GTM + pelacakan klik WhatsApp/telepon/email. Dipanggil sekali dari main.tsx. */
export function initAnalytics(): void {
  if (!ENABLED || isPrivatePath(location.pathname)) return;
  dataLayer();
  if (GA4_ID) {
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA4_ID);
  }

  const start = () => {
    window.removeEventListener("pointerdown", start);
    window.removeEventListener("keydown", start);
    window.removeEventListener("scroll", start);
    load();
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
