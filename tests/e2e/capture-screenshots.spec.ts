import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PHASE = process.env.SCREENSHOT_PHASE || 'after';
const OUT_DIR = path.join(
  process.cwd(),
  'artifacts',
  process.env.ARTIFACT_SUBDIR || 'product-experience',
  PHASE
);

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-375', width: 375, height: 812 },
];

const ROUTES = [
  { slug: 'landing-ar', path: '/ar' },
  { slug: 'landing-en', path: '/en' },
  { slug: 'dashboard-ar', path: '/ar/dashboard' },
  { slug: 'dashboard-en', path: '/en/dashboard' },
  { slug: 'documents-ar', path: '/ar/documents' },
  { slug: 'documents-en', path: '/en/documents' },
  { slug: 'new-doc-ar', path: '/ar/documents/new' },
  { slug: 'new-doc-en', path: '/en/documents/new' },
  { slug: 'studio-ar', path: '/ar/studio' },
  { slug: 'studio-en', path: '/en/studio' },
  { slug: 'features-ar', path: '/ar/features' },
  { slug: 'features-en', path: '/en/features' },
  { slug: 'how-it-works-ar', path: '/ar/how-it-works' },
  { slug: 'how-it-works-en', path: '/en/how-it-works' },
  { slug: 'faq-ar', path: '/ar/faq' },
  { slug: 'faq-en', path: '/en/faq' },
  { slug: 'sign-in-ar', path: '/ar/sign-in' },
  { slug: 'sign-in-en', path: '/en/sign-in' },
  { slug: 'settings-ar', path: '/ar/settings' },
  { slug: 'settings-en', path: '/en/settings' },
  { slug: 'privacy-ar', path: '/ar/privacy' },
  { slug: 'terms-ar', path: '/ar/terms' },
];

test.describe(`Visual Audit Capture (${PHASE})`, () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test(`Capture all routes across 4 viewports (${PHASE})`, async ({ page }) => {
    test.setTimeout(300000);
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ROUTES) {
        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);
        const fileName = `${route.slug}--${vp.name}.png`;
        await page.screenshot({
          path: path.join(OUT_DIR, fileName),
          fullPage: true,
        });
      }
    }
    const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png'));
    expect(files.length).toBeGreaterThanOrEqual(40);
  });
});
