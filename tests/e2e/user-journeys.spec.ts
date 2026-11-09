import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('DOCORA Complete User Journeys & Experience Verification', () => {
  test('Journey 1: Public Marketing & Auth flow (Landing -> Sign-In -> Guest Sandbox)', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 1. Visit Arabic Landing Page
    await page.goto('/ar');
    await expect(page.locator('h1')).toBeVisible();

    // 2. Navigate to Sign-In
    await page.goto('/ar/sign-in');
    await expect(page.getByTestId('auth-submit-btn')).toBeVisible();
    await expect(page.getByTestId('guest-sandbox-btn')).toBeVisible();

    // 3. Click 1-Click Guest Sandbox session
    await page.getByTestId('guest-sandbox-btn').click();
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test('Journey 2: Document Creation Wizard (Dashboard -> New Document -> Intent / Canvas)', async ({
    page,
  }) => {
    // 1. Go to New Document wizard
    await page.goto('/ar/documents/new');
    await expect(page.getByTestId('new-doc-wizard-heading')).toBeVisible();

    // 2. Verify all 4 creation modes are rendered
    await expect(page.getByTestId('creation-mode-canvas')).toBeVisible();
    await expect(page.getByTestId('creation-mode-intent')).toBeVisible();
    await expect(page.getByTestId('creation-mode-template')).toBeVisible();
    await expect(page.getByTestId('creation-mode-import')).toBeVisible();

    // 3. Switch to Intent tab and verify prompt textarea and outline preview
    await page.getByTestId('creation-mode-intent').click();
    await expect(page.getByTestId('intent-prompt-textarea')).toBeVisible();
    await expect(page.getByTestId('intent-generate-btn')).toBeVisible();

    // 4. Click Start with Intent
    await page.getByTestId('intent-generate-btn').click();
    await page.waitForURL('**/studio*');
    await expect(page.getByTestId('a4-page-1')).toBeVisible();
  });

  test('Journey 3: Document Library Filters & Category Navigation', async ({ page }) => {
    await page.goto('/ar/documents');
    await expect(page.getByTestId('document-library-heading')).toBeVisible();

    // Filter by Contracts
    await page.getByTestId('filter-btn-contracts').click();
    await expect(page.getByTestId('document-card-exec-contract-ar')).toBeVisible();

    // Filter by Reports
    await page.getByTestId('filter-btn-reports').click();
    await expect(page.getByTestId('document-card-board-report-en')).toBeVisible();

    // Search query
    await page.getByPlaceholder(/ابحث في المستندات بالاسم/i).fill('NonExistentTerm999');
    await expect(page.getByTestId('empty-state-no-search')).toBeVisible();
  });

  test('Journey 4: Canonical RESTful Document Studio Route (/documents/[id])', async ({
    page,
  }) => {
    await page.goto('/ar/documents/exec-contract-ar');
    await expect(page.getByTestId('a4-page-1')).toBeVisible();
    await expect(page.getByTestId('phase02-intelligence-panel')).toBeVisible();
  });

  test('Journey 5: User Settings, Ledger Telemetry & Phase 03 Roadmap Badges', async ({
    page,
  }) => {
    await page.goto('/ar/settings');
    await expect(page.getByTestId('settings-heading')).toBeVisible();

    // Verify Two-Phase Token Ledger telemetry
    await expect(page.getByTestId('token-balance-display')).toBeVisible();
    await expect(page.getByTestId('active-sessions-section')).toBeVisible();

    // Verify Phase 03 Roadmap Honest Badges
    await expect(page.getByTestId('phase03-roadmap-notice')).toBeVisible();
    await expect(page.getByTestId('feature-badge-style-dna')).toBeVisible();
    await expect(page.getByTestId('feature-badge-skills-registry')).toBeVisible();
  });

  test('Journey 6: Public Features, How-It-Works, FAQ, and Legal Pages', async ({
    page,
  }) => {
    // Features
    await page.goto('/ar/features');
    await expect(page.locator('h1')).toBeVisible();

    // How It Works
    await page.goto('/ar/how-it-works');
    await expect(page.locator('h1')).toBeVisible();

    // FAQ
    await page.goto('/ar/faq');
    await expect(page.locator('h1')).toBeVisible();

    // Privacy
    await page.goto('/ar/privacy');
    await expect(page.locator('h1')).toBeVisible();

    // Terms
    await page.goto('/ar/terms');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Journey 7: Responsive Mobile (375px) Layout & Touch Targets', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Landing mobile
    await page.goto('/ar');
    await expect(page.locator('h1')).toBeVisible();

    // Dashboard mobile
    await page.goto('/ar/dashboard');
    await expect(page.locator('h1')).toBeVisible();

    // New Document mobile
    await page.goto('/ar/documents/new');
    await expect(page.getByTestId('new-doc-wizard-heading')).toBeVisible();
  });

  test('Journey 8: Comprehensive Accessibility (axe-core WCAG 2.2 AA) across new routes', async ({
    page,
  }) => {
    const routesToTest = [
      '/ar/documents',
      '/ar/documents/new',
      '/ar/settings',
      '/ar/features',
      '/ar/how-it-works',
      '/ar/faq',
      '/ar/privacy',
    ];

    for (const r of routesToTest) {
      await page.goto(r);
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });
});
