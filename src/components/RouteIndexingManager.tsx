import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://official.kediaman.co";

const PUBLIC_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/landing\/?$/,
  /^\/venue-only\/?$/,
  /^\/tentang-kami(?:\/[^/]+)?\/?$/,
  /^\/portfolio(?:\/[^/]+)?\/?$/,
  /^\/paket\/?$/,
  /^\/lokasi(?:\/[^/]+)?\/?$/,
  /^\/artikel(?:\/[^/]+)?\/?$/,
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function RouteIndexingManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const robotsTags = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="robots"]'),
    );
    const canonicalLinks = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'),
    );

    if (!isPublicRoute(pathname)) {
      const robotsTag = robotsTags[0] ?? document.createElement("meta");
      robotsTag.setAttribute("name", "robots");
      robotsTag.setAttribute("content", "noindex, nofollow");
      if (!robotsTag.parentNode) document.head.appendChild(robotsTag);
      robotsTags.slice(1).forEach((tag) => tag.remove());
      canonicalLinks.forEach((link) => link.remove());
      return;
    }

    robotsTags.forEach((tag) => tag.remove());

    const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    const canonicalUrl = `${SITE_URL}${normalizedPath}`;
    const canonicalLink = canonicalLinks[0] ?? document.createElement("link");
    canonicalLink.setAttribute("rel", "canonical");
    canonicalLink.setAttribute("href", canonicalUrl);
    if (!canonicalLink.parentNode) document.head.appendChild(canonicalLink);
    canonicalLinks.slice(1).forEach((link) => link.remove());
  }, [pathname]);

  return null;
}