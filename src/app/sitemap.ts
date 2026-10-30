import { MetadataRoute } from 'next';
import { PUBLIC_SITE_PAGES } from '@/lib/constants/public-pages';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://zebra-ai.app';
  // Private workspaces and capture routes must not be indexed. Omit lastModified
  // until actual content modification dates are tracked, rather than build times.
  return PUBLIC_SITE_PAGES.map(({ href }) => ({
    url: href === '/' ? baseUrl : `${baseUrl}${href}`,
  }));
}
