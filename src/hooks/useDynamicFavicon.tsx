import { useEffect } from 'react';
import { useSiteSettings } from './useCMS';

export function useDynamicFavicon() {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (settings?.logo_url) {
      // Update favicon
      let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      
      link.type = 'image/png';
      link.href = settings.logo_url;
    }
  }, [settings?.logo_url]);
}
