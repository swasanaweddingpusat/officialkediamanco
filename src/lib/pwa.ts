// PWA: pendaftaran service worker + status "bisa dipasang" untuk tombol Pasang aplikasi.
import { useSyncExternalStore } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type InstallPlatform = 'android' | 'ios' | 'desktop' | 'other';

type InstallState = {
  /** Sudah berjalan sebagai aplikasi terpasang (standalone). */
  installed: boolean;
  /** Browser siap menampilkan dialog pasang bawaan (Chrome/Edge/Samsung Internet). */
  canPrompt: boolean;
  platform: InstallPlatform;
  /** iPhone/iPad tetapi bukan Safari: pemasangan harus lewat Safari. */
  iosNeedsSafari: boolean;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function detectPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/i.test(ua) || iPadOS) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/windows|macintosh|linux|cros/i.test(ua)) return 'desktop';
  return 'other';
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

function compute(): InstallState {
  const platform = detectPlatform();
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  return {
    installed: isStandalone(),
    canPrompt: !!deferred,
    platform,
    iosNeedsSafari: platform === 'ios' && /crios|fxios|edgios|opios|instagram|fban|fbav|line\//i.test(ua),
  };
}

let snapshot: InstallState = compute();
const emit = () => { snapshot = compute(); listeners.forEach((l) => l()); };

export function useInstallApp(): InstallState & { install: () => Promise<'accepted' | 'dismissed' | 'unavailable'> } {
  const state = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => snapshot,
    () => snapshot,
  );
  return { ...state, install: promptInstall };
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const ev = deferred;
  deferred = null;
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  emit();
  return outcome;
}

/** Panggil sekali saat aplikasi dimuat. */
export function initPwa(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();               // tampilkan tombol kita sendiri, bukan mini-infobar bawaan
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => { deferred = null; emit(); });
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', emit);

  // Service worker hanya di build produksi & bukan di dalam iframe (pratinjau editor)
  const inFrame = window.self !== window.top;
  if (import.meta.env.PROD && !inFrame && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => console.warn('SW gagal didaftarkan', err));
    });
  }
}
