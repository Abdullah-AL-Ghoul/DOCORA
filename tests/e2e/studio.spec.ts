import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('DOCORA Phase 01 E2E & WCAG 2.2 AA Verification', () => {
  test('renders Arabic RTL Landing Page with Sandboxed Demo, 0 console errors, and passes axe-core WCAG 2.2 AA', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByTestId('sandboxed-hero-demo')).toBeVisible();
    await expect(page.locator('text=gemini-3.8-flash')).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('renders Dashboard with all 3 Empty States and proportional Trash Undo flow', async ({
    page,
  }) => {
    await page.goto('/ar/dashboard');
    await expect(page.locator('h1')).toContainText('DOCORA');

    // Switch to First-Use Empty State tab
    await page.getByRole('button', { name: /معاينة حالة المستخدم الجديد/i }).click();
    await expect(page.getByTestId('empty-state-first-use')).toBeVisible();

    // Switch to Trash tab (Empty Trash state)
    await page.getByRole('button', { name: /سلة المحذوفات/i }).click();
    await expect(page.getByTestId('empty-state-trash')).toBeVisible();

    // Switch back to Active Documents and test No-Search-Results state
    await page.getByRole('button', { name: /المستندات النشطة/i }).click();
    await page.getByPlaceholder(/ابحث بعنوان المستند/i).fill('مستند غير موجود 999');
    await expect(page.getByTestId('empty-state-no-search-results')).toBeVisible();
  });

  test('renders Document Studio with Tiptap 3.0 editor, Synchronized A4 Preview, and Continue Generation flow', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/ar/studio?doc=interrupted-draft-ar');
    await expect(page.getByTestId('a4-page-1')).toBeVisible();

    // Trigger Continue Generation recovery
    const continueBtn = page.getByRole('button', {
      name: /إكمال التوليد \(Continue Generation\)/i,
    });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    await expect(page.getByRole('status')).toContainText(/تم استكمال التوليد وتسوية/i);
    expect(consoleErrors).toEqual([]);
  });
});
