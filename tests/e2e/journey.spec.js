import { test, expect } from '@playwright/test';

/**
 * End-to-end journeys.
 *
 * These run in a real browser against the production build: real CSS, real
 * layout, real lazy-loaded chunks, real network stack. Nothing is mocked.
 */

test.describe('PureAir Life', () => {
  test('renders the dashboard with the city baseline and no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/reference baseline/i).first()).toBeVisible();

    // The city figures must be labelled as a modelled baseline, never as a
    // live monitoring feed.
    await expect(page.getByTitle(/not a live monitoring feed/i).first()).toBeVisible();

    expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
  });

  test('exposes exactly one h1 and a working skip link', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeFocused();

    await skipLink.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
  });

  test('moves between the workspaces with the tab list', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: /DIY Hack Lab/i }).click();
    await expect(page.getByRole('tab', { name: /DIY Hack Lab/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(
      page.getByRole('heading', { level: 1, name: /DIY Indoor Air Hack Lab/i })
    ).toBeVisible();

    await page.getByRole('tab', { name: /Family Impact/i }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: /Family Impact Ledger/i })
    ).toBeVisible();
  });

  test('opens the planner from the dashboard call to action', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /generate ai smog routine/i }).click();

    await expect(page.getByRole('tab', { name: /AI Smog-Armor/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(
      page.getByRole('heading', { level: 1, name: /AI Smog-Armor Planner/i })
    ).toBeVisible();
  });

  test('switches the whole interface to Hindi', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('tab', { name: 'Smog Shield' })).toBeVisible();

    await page.getByTestId('language-toggle').click();

    await expect(page.getByRole('tab', { name: /स्मॉग शील्ड/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /परिवार प्रभाव/ })).toBeVisible();
    // The document language must follow the interface language.
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  });

  test('keeps the citation of the reference data honest', async ({ page }) => {
    await page.goto('/');

    // The dashboard must never present modelled values as live measurements.
    await expect(page.getByTitle(/not a live monitoring feed/i).first()).toBeVisible();
    await expect(page.getByText(/reference baseline/i).first()).toBeVisible();
  });
});
