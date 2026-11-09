import type { MetadataRoute } from 'next';

/**
 * DOCORA Public Sitemap (`src/app/sitemap.ts`)
 * - Includes only public bilingual marketing landing routes (`/ar`, `/en`).
 * - Private workspace routes (`/dashboard`, `/studio`) are excluded from search indexing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-11-08T12:00:00Z');
  return [
    {
      url: 'https://docora.studio/ar',
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          ar: 'https://docora.studio/ar',
          en: 'https://docora.studio/en',
        },
      },
    },
    {
      url: 'https://docora.studio/en',
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          ar: 'https://docora.studio/ar',
          en: 'https://docora.studio/en',
        },
      },
    },
  ];
}
