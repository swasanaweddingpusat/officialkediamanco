// Pemuat halaman (code-splitting) yang tahan deploy baru.
// Setelah deploy, file JS lama (nama ber-hash) hilang dari server. Tab yang masih terbuka akan gagal
// memuat halaman berikutnya → dulu layar putih. Sekarang: coba ulang sekali, lalu muat ulang halaman
// (maks 1x per 30 detik supaya tidak loop) sehingga pengguna otomatis mendapat versi terbaru.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_KEY = 'kdm_chunk_reload_at';

export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch { /* storage diblok: tetap coba muat ulang sekali */ }
  window.location.reload();
  return true;
}

const isChunkError = (e: unknown) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Unable to preload CSS/i
    .test(String((e as Error)?.message ?? e));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>): LazyExoticComponent<T> & { preload: () => Promise<unknown> } {
  let pending: Promise<{ default: T }> | null = null;
  const loadOnce = () => {
    pending ??= load().catch(async (e) => {
      // Gangguan jaringan sesaat: coba sekali lagi
      await new Promise((r) => setTimeout(r, 600));
      try { return await load(); } catch (e2) {
        pending = null;
        if (isChunkError(e2) || isChunkError(e)) reloadForNewVersion();
        throw e2;
      }
    });
    return pending;
  };
  const Comp = lazy(loadOnce) as LazyExoticComponent<T> & { preload: () => Promise<unknown> };
  Comp.preload = () => loadOnce().catch(() => undefined);
  return Comp;
}

/** Vite: gagal preload aset → muat ulang ke versi terbaru. Panggil sekali di main. */
export function installChunkErrorRecovery(): void {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForNewVersion()) event.preventDefault();
  });
}
