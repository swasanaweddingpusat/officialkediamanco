import { useEffect } from 'react';

const SITE_URL = 'https://official.kediaman.co';

interface Breadcrumb {
  name: string;
  url: string;
}

interface SEOOptions {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  includeOrganization?: boolean;
  includeWebsite?: boolean;
  includeLocalBusiness?: boolean;
  breadcrumbs?: Breadcrumb[];
}

export function useSEO({
  title,
  description,
  image,
  url,
  type = 'website',
  includeOrganization = false,
  includeWebsite = false,
  includeLocalBusiness = false,
  breadcrumbs = [],
}: SEOOptions) {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${window.location.pathname === '/' ? '/' : window.location.pathname.replace(/\/$/, '')}`;

    // Update document title
    document.title = title;

    // Update meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }

    // Update Open Graph tags
    const updateMetaTag = (property: string, content: string | undefined) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:url', canonicalUrl);
    updateMetaTag('og:type', type);

    // Keep one self-referencing canonical URL for the active route.
    const canonicalLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
    const canonicalLink = canonicalLinks[0] ?? document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', canonicalUrl);
    if (!canonicalLink.parentNode) document.head.appendChild(canonicalLink);
    canonicalLinks.slice(1).forEach((link) => link.remove());

    // Update Twitter tags
    const updateTwitterTag = (name: string, content: string | undefined) => {
      if (!content) return;
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateTwitterTag('twitter:title', title);
    updateTwitterTag('twitter:description', description);
    updateTwitterTag('twitter:image', image);

    // Add JSON-LD structured data
    const structuredData: any[] = [];

    if (includeOrganization) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Kediaman Corp',
        url: 'https://kediamancorp.com',
      });
    }

    if (includeWebsite) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Kediaman Corp',
        url: 'https://kediamancorp.com',
      });
    }

    if (includeLocalBusiness) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Kediaman Corp',
        url: 'https://kediamancorp.com',
      });
    }

    if (breadcrumbs.length > 0) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((bc, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: bc.name,
          item: bc.url,
        })),
      });
    }

    // Remove existing JSON-LD scripts
    document.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach(el => el.remove());

    // Add new JSON-LD scripts
    structuredData.forEach(data => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'true');
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    });

    return () => {
      // Cleanup JSON-LD on unmount
      document.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach(el => el.remove());
    };
  }, [title, description, image, url, type, includeOrganization, includeWebsite, includeLocalBusiness, breadcrumbs]);
}
