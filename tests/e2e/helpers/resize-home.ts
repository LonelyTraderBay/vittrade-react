import { expect, type Page } from '@playwright/test';

/** Finish the authenticated home render and its shell switch before opening another route. */
export async function resizeAuthenticatedHome(
  page: Page,
  viewport: { width: number; height: number },
) {
  const heading = page.getByRole('heading', { name: 'Thị trường', exact: true });
  // A login URL change precedes the React commit; filled login fields can still be present.
  await expect(page).toHaveURL('/w/home');
  await expect(heading).toBeVisible();
  await expect(page.getByTestId('auth-submit')).toHaveCount(0);
  await page.setViewportSize(viewport);
  const prefix = viewport.width >= 1024 ? '/w' : viewport.width >= 768 ? '/t' : '';
  // PlatformSwitcher may still have a resize navigation pending after setViewportSize resolves.
  await expect(page).toHaveURL(prefix + '/home');
  await expect(heading).toBeVisible();
}
