import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { resizeAuthenticatedHome } from './helpers/resize-home';
import { measureButtonPaint } from './helpers/button-paint';
import { paint } from './helpers/semantic-control-paint';

const profiles = [
  { name: 'phone', prefix: '', width: 390, height: 844 },
  { name: 'web', prefix: '/w', width: 1440, height: 900 },
] as const;

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.locator('html').evaluate((html, value) => {
    html.classList.toggle('light', value === 'light');
    html.classList.toggle('dark', value === 'dark');
  }, theme);
}

async function signInDeveloper(page: Page, profile: (typeof profiles)[number]) {
  // Sign in in the web shell first, then let the shared helper switch to the target shell.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/w/auth/login');
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/w/home');
  await resizeAuthenticatedHome(page, { width: profile.width, height: profile.height });
}

async function signInDca(page: Page, profile: (typeof profiles)[number]) {
  await page.setViewportSize({ width: profile.width, height: profile.height });
  await page.goto(`${profile.prefix}/dca`);
  await page.getByTestId('auth-email').fill('dca@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(page.getByRole('heading', { name: 'Mua tự động (DCA)', exact: true })).toBeVisible();
}

async function navigate(page: Page, target: string) {
  await page.evaluate(
    async ({ target, moduleUrl }) => {
      const { router } = await import(moduleUrl);
      await router.navigate(target);
    },
    { target, moduleUrl: '/src/app/router/index.ts' },
  );
  await expect(page).toHaveURL(target);
}

async function assertPrimaryPair(
  page: Page,
  button: Locator,
  info: TestInfo,
  name: string,
  icon = false,
) {
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await button.scrollIntoViewIfNeeded();

  if (icon) {
    const result = await paint(button);
    expect(result.supported, result.reason).toBe(true);
    expect(result.ratio).toBeGreaterThanOrEqual(3);
    const pair = await button.evaluate((element) => {
      const style = getComputedStyle(element);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      const rgba = (value: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      };
      return {
        foreground: rgba(style.color),
        icon: rgba(getComputedStyle(element.querySelector('svg')!).stroke),
        semantic: rgba(style.getPropertyValue('--tr-text-on-color')),
        background: rgba(style.backgroundColor),
        primary: rgba(style.getPropertyValue('--tr-primary')),
        marker: element.getAttribute('data-tr-color-pair'),
        transitionProperty: style.transitionProperty,
      };
    });
    expect(pair.icon).toEqual(pair.foreground);
    expect(pair.foreground).toEqual(pair.semantic);
    expect(pair.background).toEqual(pair.primary);
    expect(pair.marker).toBe('primary');
    expect(pair.transitionProperty.split(',').map((value) => value.trim())).not.toEqual(
      expect.arrayContaining(['all', 'color', 'background-color']),
    );
    expect(result.width).toBeGreaterThanOrEqual(24);
    expect(result.height).toBeGreaterThanOrEqual(24);
    expect(result.hits).toEqual([true, true, true]);
    return result;
  }

  const result = await measureButtonPaint(page, button, info, name);
  expect(result.minimumRatio).toBeGreaterThanOrEqual(4.5);
  const pair = await button.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const rgba = (value: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    return {
      foreground: rgba(style.color),
      semantic: rgba(style.getPropertyValue('--tr-text-on-color')),
      background: rgba(style.backgroundColor),
      primary: rgba(style.getPropertyValue('--tr-primary')),
      marker: element.getAttribute('data-tr-color-pair'),
      transitionProperty: style.transitionProperty,
      width: rect.width,
      height: rect.height,
      hits: [0.1, 0.5, 0.9].map((fraction) => {
        const hit = document.elementFromPoint(
          rect.x + rect.width * fraction,
          rect.y + rect.height / 2,
        );
        return hit === element || Boolean(hit && element.contains(hit));
      }),
    };
  });
  expect(pair.foreground).toEqual(pair.semantic);
  expect(pair.background).toEqual(pair.primary);
  expect(pair.marker).toBe('primary');
  expect(pair.transitionProperty.split(',').map((value) => value.trim())).not.toEqual(
    expect.arrayContaining(['all', 'color', 'background-color']),
  );
  expect(pair.width).toBeGreaterThanOrEqual(24);
  expect(pair.height).toBeGreaterThanOrEqual(24);
  expect(pair.hits).toEqual([true, true, true]);
  return result;
}

for (const theme of ['light', 'dark'] as const) {
  for (const profile of profiles) {
    test(`Conditional primary pair P2P ${profile.name} ${theme} @ui-mock`, async ({
      page,
    }, info) => {
      let writes = 0;
      page.on('request', (request) => {
        const pathname = new URL(request.url()).pathname;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !pathname.includes('/auth/'))
          writes++;
      });
      await signInDeveloper(page, profile);
      await setTheme(page, theme);
      const path = `${profile.prefix}${profile.name === 'web' ? '/p2p/create-offer' : '/p2p/create'}`;
      await navigate(page, path);
      await expect(page.getByRole('heading', { name: 'Đăng quảng cáo P2P' })).toBeVisible();

      await page.getByLabel('Giá (VND/USDT)', { exact: true }).fill('25000');
      await page.getByLabel('Tổng USDT', { exact: true }).fill('2');
      await page.getByLabel('Tối thiểu (VND)', { exact: true }).fill('100000');
      await page.getByLabel('Tối đa (VND)', { exact: true }).fill('250000');
      const payment = page.getByRole('button', { name: 'Vietcombank', exact: true });
      await payment.click();
      await expect(payment).toHaveAttribute('aria-pressed', 'true');
      await assertPrimaryPair(page, payment, info, 'p2p-selected-payment');

      const submit = page.getByRole('button', {
        name: 'Xem xác nhận đăng quảng cáo',
        exact: true,
      });
      await assertPrimaryPair(page, submit, info, 'p2p-valid-submit');
      expect(writes).toBe(0);
    });

    test(`Conditional primary pair Copy confirmation ${profile.name} ${theme} @ui-mock`, async ({
      page,
    }, info) => {
      let writes = 0;
      page.on('request', (request) => {
        const pathname = new URL(request.url()).pathname;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !pathname.includes('/auth/'))
          writes++;
      });
      await signInDeveloper(page, profile);
      await setTheme(page, theme);
      const path =
        profile.prefix +
        (profile.name === 'web'
          ? '/trade/copy/provider/ct001/confirmation'
          : '/trade/copy-provider/ct001/confirmation');
      await navigate(page, path);
      await expect(page.getByText('AlphaHunter_VN').first()).toBeVisible();
      const consents = page.getByRole('checkbox');
      await expect(consents).toHaveCount(4);
      for (const consent of await consents.all()) await consent.check();
      const submit = page.getByRole('button', { name: 'Xác nhận & Bắt đầu Copy', exact: true });
      await assertPrimaryPair(page, submit, info, 'copy-confirmation');
      expect(writes).toBe(0);
    });

    test(`Conditional primary pair pre-copy assessment ${profile.name} ${theme} @ui-mock`, async ({
      page,
    }, info) => {
      let writes = 0;
      page.on('request', (request) => {
        const pathname = new URL(request.url()).pathname;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !pathname.includes('/auth/'))
          writes++;
      });
      await signInDeveloper(page, profile);
      await setTheme(page, theme);
      const path =
        profile.prefix +
        (profile.name === 'web'
          ? '/trade/copy/provider/ct001/assessment'
          : '/trade/copy-provider/ct001/assessment');
      await navigate(page, path);
      const checks = page.getByRole('checkbox');
      await expect(checks).toHaveCount(3);
      for (const check of await checks.all()) await check.check();
      const proceed = page.getByRole('button', { name: 'Tiếp tục cấu hình', exact: true });
      await assertPrimaryPair(page, proceed, info, 'copy-assessment');
      expect(writes).toBe(0);
    });

    test(`Conditional primary pair DCA annotation ${profile.name} ${theme} @ui-mock`, async ({
      page,
    }, info) => {
      let writes = 0;
      page.on('request', (request) => {
        const pathname = new URL(request.url()).pathname;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !pathname.includes('/auth/'))
          writes++;
      });
      await signInDca(page, profile);
      await setTheme(page, theme);
      await page.getByRole('button', { name: 'Biểu đồ', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Biểu đồ danh mục' })).toBeVisible();
      const annotation = page.getByRole('button', { name: 'Bật ghi chú', exact: true });
      await expect(annotation).toBeVisible();
      await annotation.click();
      const activeAnnotation = page.getByRole('button', { name: 'Tắt ghi chú', exact: true });
      await assertPrimaryPair(page, activeAnnotation, info, 'dca-annotation', true);
      expect(writes).toBe(0);
    });
  }
}
