import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const shells = [
  { name: 'phone', prefix: '', width: 390 },
  { name: 'tablet', prefix: '/t', width: 768 },
  { name: 'responsive', prefix: '/r', width: 1024 },
  { name: 'web', prefix: '/w', width: 1440 },
] as const;

async function signIn(page: Page, email: string) {
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('Preview-123!');
  const pending = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/auth/login'),
  );
  await page.getByTestId('auth-submit').click();
  const response = await pending;
  expect(response.fromServiceWorker()).toBe(true);
  expect(response.status()).toBe(200);
  expect(response.request().postDataJSON()).toEqual({ email, password: 'Preview-123!' });
  return response.json();
}

async function verifyCode(page: Page, code: string, status: number, challengeId: string) {
  const group = page.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' });
  await expect(group).toBeVisible();
  const pending = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/auth/login/mfa/verify'),
  );
  const inputs = group.locator('input');
  for (let index = 0; index < 6; index++) await inputs.nth(index).fill(code[index]);
  const response = await pending;
  expect(response.fromServiceWorker()).toBe(true);
  expect(response.status()).toBe(status);
  expect(response.request().postDataJSON()).toEqual({ challengeId, code });
}

async function readLocation(page: Page) {
  return page.evaluate(async () => {
    const modulePath = '/src/app/router/index.ts';
    const { router } = await import(/* @vite-ignore */ modulePath);
    const { pathname, search, hash, state } = router.state.location;
    return { url: pathname + search + hash, state };
  });
}

for (const shell of shells) {
  for (const theme of ['light', 'dark'] as const) {
    for (const mfa of [false, true]) {
      test(`Auth return ${shell.name} ${theme} ${mfa ? 'MFA' : 'password'} @ui-mock`, async ({
        page,
      }, info) => {
        await page.setViewportSize({ width: shell.width, height: 900 });
        const destination = `${shell.prefix}/wallet/transfer?origin=c06&asset=BTC%2FUSDT#amount`;
        let financialWrites = 0;
        page.on('request', (request) => {
          if (request.method() === 'POST' && /\/wallet\//.test(request.url())) financialWrites++;
        });
        await page.goto(destination);
        await expect(page.getByTestId('auth-email')).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`${shell.prefix}/auth/login$`));
        expect((await readLocation(page)).state).toMatchObject({ from: destination });
        // Explicit CSS modes; these cases do not prove ThemeProvider persistence.
        await page.locator('html').evaluate((html, mode) => {
          html.classList.toggle('dark', mode === 'dark');
          html.classList.toggle('light', mode === 'light');
        }, theme);
        const result = await signIn(page, mfa ? 'mfa@vittrade.local' : 'wallet@vittrade.local');
        if (mfa) {
          await expect(page).toHaveURL(new RegExp(`${shell.prefix}/auth/otp$`));
          expect((await readLocation(page)).state).toMatchObject({ from: destination });
          await verifyCode(page, '111111', 400, result.challenge.id);
          await expect(page.getByRole('alert')).toHaveText(
            shell.prefix === '/w'
              ? 'Mã xác thực không đúng. Vui lòng kiểm tra lại.'
              : 'Mã OTP không đúng. Vui lòng thử lại.',
          );
          await expect(page.getByRole('group').locator('input')).toHaveCount(6);
          await page.screenshot({
            path: info.outputPath('invalid-code.png'),
            fullPage: true,
            animations: 'disabled',
          });
          await verifyCode(page, '123456', 200, result.challenge.id);
        }
        await expect(page).toHaveURL(
          new RegExp(`${destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        );
        await expect(page.getByTestId('wallet-transfer-amount')).toBeVisible();
        const location = await readLocation(page);
        expect(location.url).toBe(destination);
        expect(financialWrites).toBe(0);
        await page.screenshot({
          path: info.outputPath('returned-destination.png'),
          fullPage: true,
          animations: 'disabled',
        });
        const observation = {
          shell,
          theme,
          mfa,
          destination,
          actual: location.url,
          financialWrites,
        };
        await writeFile(
          info.outputPath('return-context.json'),
          JSON.stringify(observation, null, 2),
        );
        console.log('C06_AUTH_RETURN', JSON.stringify(observation));
      });
    }
  }

  test(`Auth rate-limit restart retains context ${shell.name} @ui-mock`, async ({ page }) => {
    await page.setViewportSize({ width: shell.width, height: 900 });
    const destination = `${shell.prefix}/wallet/transfer?origin=retry#amount`;
    await page.goto(destination);
    const result = await signIn(page, 'mfa-rate-limited@vittrade.local');
    await verifyCode(page, '123456', 429, result.challenge.id);
    await expect(page.getByRole('alert')).toContainText('Quá nhiều lần xác thực.');
    await page
      .getByRole('button', {
        name: shell.prefix === '/w' ? 'Quay lại' : 'Quay lại đăng nhập',
        exact: true,
      })
      .click();
    await expect(page.getByTestId('auth-email')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${shell.prefix}/auth/login$`));
    expect((await readLocation(page)).state).toMatchObject({ from: destination });
    await signIn(page, 'wallet@vittrade.local');
    await expect(page.getByTestId('wallet-transfer-amount')).toBeVisible();
    expect((await readLocation(page)).url).toBe(destination);
  });

  test(`Auth client expiry retains context ${shell.name} @ui-mock`, async ({ page }) => {
    await page.clock.install();
    await page.setViewportSize({ width: shell.width, height: 900 });
    const destination = `${shell.prefix}/wallet/transfer?origin=expiry#amount`;
    await page.goto(destination);
    const result = await signIn(page, 'mfa@vittrade.local');
    await expect(page.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' })).toBeVisible();
    let verifications = 0;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.endsWith('/auth/login/mfa/verify')) verifications++;
    });
    const remaining = await page.evaluate(
      (expiry) => Date.parse(expiry) - Date.now(),
      result.challenge.expiresAt,
    );
    // Advance to the actual server-issued deadline, rather than waiting an arbitrary interval.
    await page.clock.fastForward(Math.max(0, remaining) + 1);
    await expect(page.getByTestId('auth-email')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${shell.prefix}/auth/login$`));
    expect((await readLocation(page)).state).toMatchObject({ from: destination });
    expect(verifications).toBe(0);
  });
}

for (const from of ['//foreign.test/path', '/w/auth/otp']) {
  test(`Auth rejects unsafe or looping return ${from} @ui-mock`, async ({ page }) => {
    await page.goto('/w/auth/login');
    await expect(page.getByTestId('auth-email')).toBeVisible();
    await page.evaluate(async (value) => {
      const modulePath = '/src/app/router/index.ts';
      const { router } = await import(/* @vite-ignore */ modulePath);
      await router.navigate('/w/auth/login', { state: { from: value } });
    }, from);
    await signIn(page, 'wallet@vittrade.local');
    await expect(page).toHaveURL(/\/w\/home$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Thị trường' })).toBeVisible();
  });
}
