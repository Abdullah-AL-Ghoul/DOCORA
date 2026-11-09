import type { MetadataRoute } from 'next';

/**
 * DOCORA Robots Governance (`src/app/robots.ts`)
 * - Allows search engines to crawl public marketing pages (`/ar`, `/en`).
 * - Strictly disallows indexing of private workspace, studio, and API routes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/ar', '/en'],
        disallow: ['/api/', '/ar/dashboard', '/en/dashboard', '/ar/studio', '/en/studio'],
      },
    ],
    sitemap: 'https://docora.studio/sitemap.xml',
  };
}
