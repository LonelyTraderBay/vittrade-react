const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../../../../../');
const req = createRequire(path.join(root, 'package.json'));
const { chromium } = req('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const responses = [];
  const consoleResourceErrors = [];
  const pageErrors = [];
  const screenshots = [];
  const contextFor = async (id) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on('console', (message) => { if (message.type() === 'error') consoleResourceErrors.push({ scenario: id, message: message.text() }); });
    page.on('pageerror', (error) => pageErrors.push({ scenario: id, message: error.message }));
    page.on('response', (response) => {
      if (!/\/api\/auth\//.test(response.url())) return;
      responses.push({ scenario: id, url: new URL(response.url()).pathname, status: response.status(), fromServiceWorker: response.fromServiceWorker() });
    });
    return { context, page };
  };

  const base = process.env.VITTRADE_DEV_BASE ?? 'http://127.0.0.1:5173';
  const result = { observedAt: new Date().toISOString(), mode: 'Vite development + actual MSW service worker, Chromium headless, no backend', scenarios: [], authResponses: responses, consoleResourceErrors, pageErrors };
  try {
    let { context, page } = await contextFor('direct-login-and-logout');
    await page.goto(`${base}/w/auth/login`, { waitUntil: 'networkidle' });
    const hintText = await page.locator('body').innerText();
    const previewHintsPassed = hintText.includes('developer@vittrade.local / Preview-123!') && hintText.includes('mfa@vittrade.local / Preview-123!') && hintText.includes('demo@vittrade.vn / demo') && hintText.includes('Email khác → thông tin đăng nhập không hợp lệ');
    await page.screenshot({ path: path.join(__dirname, 'dev-auth-login-hints.png'), fullPage: true });
    screenshots.push('dev-auth-login-hints.png');
    await page.getByTestId('auth-email').fill('developer@vittrade.local');
    await page.getByTestId('auth-password').fill('Preview-123!');
    await page.getByTestId('auth-submit').click();
    await page.waitForURL('**/w/home', { timeout: 8000 });
    await page.screenshot({ path: path.join(__dirname, 'dev-auth-home.png'), fullPage: true });
    screenshots.push('dev-auth-home.png');
    result.scenarios.push({ id: 'direct-login', passed: previewHintsPassed, url: page.url(), evidence: 'Dev-only fixture instructions were visible before login; home loaded after MSW session login.' });

    await page.getByRole('button', { name: /VitTrader Pro/ }).click();
    await page.waitForURL('**/w/profile', { timeout: 5000 });
    const signOut = page.getByTestId('auth-sign-out');
    await signOut.waitFor({ state: 'visible', timeout: 5000 });
    const logoutResponse = page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/api/auth/logout'), { timeout: 5000 });
    await signOut.click();
    const logoutResult = await logoutResponse;
    await page.waitForURL('**/w/auth/login', { timeout: 5000 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByTestId('auth-email').waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: path.join(__dirname, 'dev-auth-logout.png'), fullPage: true });
    screenshots.push('dev-auth-logout.png');
    result.scenarios.push({ id: 'logout-and-reload', passed: logoutResult.status() === 204 && page.url().endsWith('/w/auth/login') && await page.getByTestId('auth-email').isVisible(), logoutStatus: logoutResult.status(), urlAfterReload: page.url() });
    await context.close();

    ({ context, page } = await contextFor('mfa'));
    await page.goto(`${base}/w/auth/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('auth-email').fill('mfa@vittrade.local');
    await page.getByTestId('auth-password').fill('Preview-123!');
    await page.getByTestId('auth-submit').click();
    await page.waitForURL('**/w/auth/otp', { timeout: 8000 });
    const otp = page.locator('input[maxlength="1"]');
    await otp.first().waitFor({ state: 'visible', timeout: 5000 });
    if (await otp.count() !== 6) throw new Error(`Expected 6 OTP inputs, received ${await otp.count()}`);
    await page.screenshot({ path: path.join(__dirname, 'dev-auth-mfa.png'), fullPage: true });
    screenshots.push('dev-auth-mfa.png');
    result.scenarios.push({ id: 'mfa-challenge', passed: true, url: page.url(), otpInputs: await otp.count() });
    for (let index = 0; index < 6; index += 1) await otp.nth(index).fill('123456'[index]);
    await page.waitForURL('**/w/home', { timeout: 5000 });
    result.scenarios.push({ id: 'mfa-verification', passed: true, url: page.url(), code: '[redacted demo code]' });
    await context.close();

    ({ context, page } = await contextFor('invalid-password'));
    await page.goto(`${base}/w/auth/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('auth-email').fill('developer@vittrade.local');
    await page.getByTestId('auth-password').fill('wrong-preview-password');
    await page.getByTestId('auth-submit').click();
    await page.getByText('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.').waitFor({ state: 'visible', timeout: 5000 });
    const loginErrorText = await page.locator('body').innerText();
    result.scenarios.push({ id: 'invalid-password', passed: loginErrorText.includes('Đăng nhập thất bại.'), url: page.url(), errorTextFound: loginErrorText.includes('Đăng nhập thất bại.') });
    await page.screenshot({ path: path.join(__dirname, 'dev-auth-invalid.png'), fullPage: true });
    screenshots.push('dev-auth-invalid.png');
    await context.close();

    ({ context, page } = await contextFor('locked-account'));
    await page.goto(`${base}/w/auth/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('auth-email').fill('locked@vittrade.local');
    await page.getByTestId('auth-password').fill('Preview-123!');
    await page.getByTestId('auth-submit').click();
    await page.waitForURL('**/w/auth/account-locked', { timeout: 5000 });
    const lockedHeading = page.getByRole('heading', { name: 'Tài khoản tạm khóa' });
    await lockedHeading.waitFor({ state: 'visible', timeout: 5000 });
    result.scenarios.push({ id: 'locked-account', passed: await lockedHeading.isVisible(), url: page.url() });
    await context.close();

    ({ context, page } = await contextFor('demo-button'));
    await page.goto(`${base}/w/auth/login`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Trải nghiệm Demo/ }).click();
    await page.waitForURL('**/w/home', { timeout: 5000 });
    result.scenarios.push({ id: 'demo-button', passed: true, url: page.url() });
    await context.close();
  } finally {
    await browser.close();
  }
  result.screenshots = screenshots;
  result.passed = result.scenarios.length === 7 && result.scenarios.every(scenario => scenario.passed) && responses.some(response => response.url.endsWith('/api/auth/logout') && response.status === 204) && responses.every(response => response.fromServiceWorker) && pageErrors.length === 0;
  fs.writeFileSync(path.join(__dirname, 'dev-browser-results.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
