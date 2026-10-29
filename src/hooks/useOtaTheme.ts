import { useEffect } from 'react';

/**
 * Tema OTA (terang) dipasang lewat class "ota-theme" di <html> supaya dialog/popover
 * yang di-portal ke <body> ikut bertema sama. Halaman admin memanggil hook ini dengan
 * `false` agar tetap memakai tema gelap lama.
 */
export function useOtaTheme(enabled: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    const had = root.classList.contains('ota-theme');
    root.classList.toggle('ota-theme', enabled);
    return () => { root.classList.toggle('ota-theme', had); };
  }, [enabled]);
}
