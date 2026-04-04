import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://zebra-ai.dev';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/overview/', '/editor/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
