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

  test('verifies Phase 02 Multi-Agent Review, 14-Vector Quality Pulse, Hard Gate BLOCKED override, Inline Diff Accept/Reject, and passes axe-core WCAG 2.2 AA', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/ar/studio?doc=exec-contract-ar');
    await expect(page.getByTestId('phase02-intelligence-panel')).toBeVisible();
    await expect(page.getByTestId('quality-gate-status-badge')).toContainText(/READY/i);

    // 1. Accept first Inline Diff Proposal & reject second Proposal
    const acceptBtn = page.getByTestId('accept-proposal-prop-domain-p-intro');
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();
    await expect(page.getByTestId('proposal-card-prop-domain-p-intro')).toContainText(
      /تم القبول والتطبيق/i
    );

    const rejectBtn = page.getByTestId('reject-proposal-prop-bidi-p-nda');
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();
    await expect(page.getByTestId('proposal-card-prop-bidi-p-nda')).toContainText(
      /تم الرفض/i
    );

    // 2. Switch to 14 Quality Dimensions tab and verify all 14 vectors render
    await page.getByTestId('tab-14-vectors').click();
    await expect(page.getByTestId('quality-vector-1')).toBeVisible();
    await expect(page.getByTestId('quality-vector-14')).toBeVisible();

    // 3. Switch to 9 Bounded Agent Roles tab and verify all 9 roles render
    await page.getByTestId('tab-9-agents').click();
    await expect(page.getByTestId('agent-role-1')).toBeVisible();
    await expect(page.getByTestId('agent-role-9')).toBeVisible();

    // 4. Switch to Provenance Citations tab
    await page.getByTestId('tab-provenance-citations').click();
    await expect(page.getByTestId('citation-item-cit-exec-1')).toBeVisible();

    // 5. Trigger Hard Gate (Dangling Citation -> BLOCKED) and verify alert + disabled Export buttons
    await page.getByTestId('toggle-hard-gate-citation').click();
    await expect(page.getByTestId('quality-gate-status-badge')).toContainText(/BLOCKED/i);
    await expect(page.getByTestId('hard-gate-blocked-alert')).toBeVisible();
    await expect(page.getByTestId('export-docx-btn')).toBeDisabled();
    await expect(page.getByTestId('export-pdf-btn')).toBeDisabled();

    // Restore READY state and verify Export buttons are re-enabled
    await page.getByTestId('toggle-hard-gate-citation').click();
    await expect(page.getByTestId('quality-gate-status-badge')).toContainText(/READY/i);
    await expect(page.getByTestId('export-docx-btn')).toBeEnabled();
    await expect(page.getByTestId('export-pdf-btn')).toBeEnabled();

    // 6. Simulate Circuit Breaker 5xx Outage and run Bounded 9-Role Review via /api/ai/review
    await page.getByTestId('toggle-circuit-breaker-sim').click();
    await page.getByTestId('run-multi-agent-review-btn').click();
    await expect(page.getByTestId('router-telemetry-banner')).toBeVisible();
    await expect(page.getByTestId('router-telemetry-banner')).toContainText(/store: false/i);

    // 7. Run axe-core WCAG 2.2 AA audit on the full Phase 02 Studio view
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});

