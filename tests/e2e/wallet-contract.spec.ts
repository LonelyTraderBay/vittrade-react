import { expect, test } from '@playwright/test';

const session = {
  user: {
    id: 'e2e-wallet-user',
    email: 'wallet@example.com',
    fullName: 'Wallet E2E User',
    roles: ['user'],
    permissions: ['market:read', 'wallet:read', 'wallet:write'],
    kycStatus: 'verified',
    kycLevel: 2,
    accountStatus: 'active',
  },
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'wallet-e2e-memory-token',
};

const accounts = {
  items: [
    { id: 'spot', name: 'Spot wallet', balanceUsd: 1_000 },
    { id: 'funding', name: 'Funding wallet', balanceUsd: 500 },
    { id: 'futures', name: 'Futures wallet', balanceUsd: 250 },
  ],
};

const assets = {
  items: [
    {
      id: 'asset-usdt',
      symbol: 'USDT',
      name: 'Tether',
      balance: 1_000,
      available: 750,
      frozen: 250,
      inOrder: 250,
      usdValue: 1_000,
      change24h: 0,
      logoColor: '#26A17B',
    },
  ],
  summary: {
    totalUsd: 1_000,
    totalBtc: 0.015,
    availableUsd: 750,
    inOrderUsd: 250,
    frozenUsd: 0,
  },
};

const depositNetworks = {
  networks: [
    {
      id: 'ethereum',
      name: 'Ethereum',
      fee: '0.00 ETH',
      minDeposit: 10,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      arrivalTime: '~5 minutes',
      confirmations: 12,
    },
  ],
};

const withdrawalNetworks = {
  networks: [
    {
      id: 'ethereum',
      name: 'Ethereum',
      fee: 0.5,
      minWithdraw: 5,
      maxWithdraw: 50,
    },
  ],
};

const addressBookResponse = {
  items: [
    {
      id: 'server-address-1',
      label: 'Contract-owned destination',
      address: 'bc1qserverownedaddress000000000000000000000',
      network: 'Bitcoin',
      asset: 'BTC',
      isFavorite: false,
      createdAt: '2026-09-22T10:00:00.000Z',
      isWhitelisted: true,
    },
  ],
  total: 1,
  whitelistEnabled: true,
};

test.describe('wallet contract smoke on local API-mode build', () => {
  test('submits an internal transfer with an idempotency key', async ({ page }) => {
    let transferBody: Record<string, unknown> | undefined;
    let idempotencyKey: string | undefined;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/accounts', (route) => route.fulfill({ json: accounts }));
    await page.route('**/wallet/assets', (route) => route.fulfill({ json: assets }));
    await page.route('**/wallet/transfers', async (route) => {
      transferBody = route.request().postDataJSON() as Record<string, unknown>;
      idempotencyKey = route.request().headers()['idempotency-key'];
      return route.fulfill({
        status: 201,
        json: {
          id: 'e2e-transfer-1',
          fromWallet: 'spot',
          toWallet: 'funding',
          asset: 'USDT',
          amount: 25,
          status: 'completed',
          createdAt: '2026-09-22T10:00:00.000Z',
        },
      });
    });

    const sessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname.endsWith('/auth/session'),
    );
    await page.goto('/wallet/transfer');
    await expect((await sessionResponse).ok()).toBeTruthy();
    await expect(page.getByText('Internal transfer').first()).toBeVisible();
    const amountField = page.getByTestId('wallet-transfer-amount');
    await expect(amountField).toBeVisible();
    await amountField.fill('25');
    const transferResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/wallet/transfers'),
    );
    await page.getByTestId('wallet-transfer-submit').click();

    await expect((await transferResponse).status()).toBe(201);
    await expect(page.getByRole('status')).toContainText('Transfer completed');
    expect(transferBody).toEqual({
      fromWallet: 'spot',
      toWallet: 'funding',
      asset: 'USDT',
      amount: 25,
    });
    expect(idempotencyKey).toBeTruthy();
  });

  test('keeps the transfer confirmation tappable at the mobile navigation overlap', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let transferSubmitted = false;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/accounts', (route) => route.fulfill({ json: accounts }));
    await page.route('**/wallet/assets', (route) => route.fulfill({ json: assets }));
    await page.route('**/wallet/transfers', (route) => {
      transferSubmitted = true;
      return route.fulfill({
        status: 201,
        json: {
          id: 'e2e-transfer-mobile-1',
          fromWallet: 'spot',
          toWallet: 'funding',
          asset: 'USDT',
          amount: 25,
          status: 'completed',
          createdAt: '2026-09-22T10:00:00.000Z',
        },
      });
    });

    await page.goto('/r/wallet/transfer');
    await page.getByTestId('wallet-transfer-amount').fill('25');
    const submit = page.getByTestId('wallet-transfer-submit');
    await expect(submit).toBeVisible();
    const bounds = await submit.boundingBox();
    expect(bounds).not.toBeNull();
    const navigationAction = page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Giao dịch' });
    const navigationActionBounds = await navigationAction.locator('div').first().boundingBox();
    expect(navigationActionBounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(navigationActionBounds!.y);
    const centerTarget = await submit.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const hit = document.elementFromPoint(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      );
      return {
        belongsToSubmit: Boolean(hit && (hit === element || element.contains(hit))),
        ctaCenterY: bounds.y + bounds.height / 2,
        hitTag: hit?.tagName ?? null,
        navigationLabel: hit?.closest('[role="navigation"]')?.getAttribute('aria-label') ?? null,
      };
    });
    expect(centerTarget.belongsToSubmit).toBe(true);
    expect(centerTarget.navigationLabel).toBeNull();
    console.log(
      `C06_WALLET_TRANSFER_HIT_TARGET ${JSON.stringify({
        ...centerTarget,
        ctaBottom: bounds!.y + bounds!.height,
        navigationTargetTop: navigationActionBounds!.y,
        clearance: navigationActionBounds!.y - (bounds!.y + bounds!.height),
      })}`,
    );
    if (process.env.C06_NAV_LAYOUT_SCREENSHOT) {
      await page.screenshot({ path: process.env.C06_NAV_LAYOUT_SCREENSHOT, fullPage: true });
    }
    await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);

    await expect(page.getByRole('status')).toContainText('Transfer completed');
    expect(transferSubmitted).toBe(true);
    await expect(page).toHaveURL(/\/r\/wallet\/transfer$/);

    await page.getByRole('button', { name: 'Giao dịch' }).click();
    await expect(page).toHaveURL(/\/r\/trade\/btcusdt$/);
  });

  test('uses the shared amount field across wallet route aliases, viewports and themes', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/accounts', (route) => route.fulfill({ json: accounts }));
    await page.route('**/wallet/assets', (route) => route.fulfill({ json: assets }));

    const aliases = [
      { path: '/wallet/transfer', width: 320, height: 568 },
      { path: '/t/wallet/transfer', width: 768, height: 1024 },
      { path: '/w/wallet/transfer', width: 1280, height: 800 },
      { path: '/r/wallet/transfer', width: 390, height: 844 },
    ];
    const measured: Array<Record<string, unknown>> = [];

    for (const alias of aliases) {
      await page.setViewportSize({ width: alias.width, height: alias.height });
      await page.goto(alias.path);
      const amountField = page.getByTestId('wallet-transfer-amount');
      await expect(amountField).toBeVisible();
      await expect(amountField).toHaveAttribute('type', 'number');
      await expect(amountField).toHaveAttribute('min', '0');
      await expect(amountField).toHaveAttribute('step', 'any');
      await expect(amountField).toHaveAttribute('inputmode', 'decimal');
      await expect(amountField).toHaveAttribute('aria-describedby', 'transfer-amount-helper');
      await expect(page.locator('#transfer-amount-helper')).toContainText('Available:');

      const geometry = await amountField.evaluate((element) => {
        const input = element as HTMLInputElement;
        const wrapper = input.parentElement;
        const style = wrapper ? getComputedStyle(wrapper) : undefined;
        const rect = input.getBoundingClientRect();
        return {
          height: style?.height,
          borderRadius: style?.borderRadius,
          inputFontSize: getComputedStyle(input).fontSize,
          inputWidth: rect.width,
          inputWithinViewport: rect.left >= 0 && rect.right <= innerWidth,
        };
      });
      expect(geometry.height).toBe('52px');
      expect(geometry.borderRadius).toBe('14px');
      expect(geometry.inputFontSize).toBe('26px');
      expect(geometry.inputWithinViewport).toBe(true);
      if (alias.path === '/r/wallet/transfer' && process.env.C06_AFTER_SCREENSHOT) {
        await page.screenshot({ path: process.env.C06_AFTER_SCREENSHOT, fullPage: true });
      }

      const themeColors: string[] = [];
      for (const theme of ['light', 'dark'] as const) {
        const colors = await amountField.evaluate((element, activeTheme) => {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(activeTheme);
          const probe = document.createElement('span');
          probe.style.color = 'var(--tr-text-1)';
          document.body.append(probe);
          const expected = getComputedStyle(probe).color;
          probe.remove();
          return { actual: getComputedStyle(element).color, expected };
        }, theme);
        expect(colors.actual).toBe(colors.expected);
        themeColors.push(colors.actual);
      }
      expect(themeColors[0]).not.toBe(themeColors[1]);

      await page.getByRole('button', { name: /Max/ }).focus();
      await page.keyboard.press('Tab');
      await expect(amountField).toBeFocused();
      await expect
        .poll(async () =>
          amountField.evaluate((element) => {
            const wrapper = element.parentElement;
            return wrapper ? getComputedStyle(wrapper).boxShadow : 'missing-wrapper';
          }),
        )
        .toContain('rgba(229, 138, 0, 0.25)');
      const focusStyle = await amountField.evaluate((element) => {
        const wrapper = element.parentElement;
        return wrapper ? getComputedStyle(wrapper).boxShadow : 'missing-wrapper';
      });
      expect(focusStyle).not.toBe('none');

      measured.push({
        path: alias.path,
        viewport: `${alias.width}x${alias.height}`,
        fieldHeight: geometry.height,
        fieldRadius: geometry.borderRadius,
        fontSize: geometry.inputFontSize,
        lightText: themeColors[0],
        darkText: themeColors[1],
        keyboardFocus: focusStyle,
      });
    }

    console.log(`C06_WALLET_TRANSFER_FIELD_MATRIX ${JSON.stringify(measured)}`);
  });

  test('renders server-owned deposit instructions and QR data', async ({ page }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/deposit/networks**', (route) =>
      route.fulfill({ json: depositNetworks }),
    );

    await page.goto('/wallet/deposit/USDT');
    await expect(page.getByLabel('Deposit network')).toHaveValue('ethereum');

    const standardizedControls = await page.evaluate(() => {
      const copy = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Copy USDT deposit address"]',
      );
      const refresh = [...document.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
        button.textContent?.includes('Refresh deposit instructions'),
      );
      const measure = (element?: HTMLButtonElement) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          width: rect.width,
          height: rect.height,
          fontSize: style.fontSize,
          borderRadius: style.borderRadius,
          backgroundColor: style.backgroundColor,
          color: style.color,
        };
      };
      return {
        viewport: `${innerWidth}x${innerHeight}`,
        copy: measure(copy ?? undefined),
        refresh: measure(refresh),
      };
    });
    expect(standardizedControls.copy?.width).toBeGreaterThanOrEqual(36);
    expect(standardizedControls.copy).toMatchObject({
      height: 36,
      fontSize: '13px',
      borderRadius: '24px',
    });
    expect(standardizedControls.refresh).toMatchObject({
      height: 52,
      fontSize: '16px',
      borderRadius: '14px',
    });

    await expect(page.getByRole('img', { name: 'Deposit address QR code' })).toBeVisible();
    await expect(page.getByText(depositNetworks.networks[0].address)).toBeVisible();
    await expect(page.getByText('12 confirmations')).toBeVisible();
  });

  test('shows a visible shared focus ring on the deposit network select', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/deposit/networks**', (route) =>
      route.fulfill({ json: depositNetworks }),
    );

    await page.goto('/r/wallet/deposit/USDT');
    const network = page.getByLabel('Deposit network');
    await expect(network).toHaveValue('ethereum');

    let focusedId = '';
    for (let attempt = 0; attempt < 40 && focusedId !== 'deposit-network'; attempt += 1) {
      await page.keyboard.press('Tab');
      focusedId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.id ?? '',
      );
    }
    await expect(network).toBeFocused();

    const measurements = await page.evaluate(() => {
      const control = document.getElementById('deposit-network');
      if (!control) throw new Error('Deposit network select is missing.');
      const themes = ['dark', 'light'] as const;
      return themes.map((theme) => {
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(theme);
        const style = getComputedStyle(control);
        const probe = document.createElement('span');
        probe.style.color = 'var(--tr-primary)';
        document.body.append(probe);
        const primary = getComputedStyle(probe).color;
        probe.remove();
        return {
          theme,
          outlineColor: style.outlineColor,
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineOffset: style.outlineOffset,
          primary,
        };
      });
    });

    console.log(`C06_NATIVE_SELECT_FOCUS ${JSON.stringify(measurements)}`);
    expect(measurements).toHaveLength(2);
    for (const measurement of measurements) {
      expect(measurement.outlineColor).toBe(measurement.primary);
      expect(measurement.outlineStyle).toBe('solid');
      expect(measurement.outlineWidth).toBe('2px');
      expect(measurement.outlineOffset).toBe('2px');
    }
  });

  test('resolves deposit status surfaces through semantic tokens in dark and light themes', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/deposit/networks**', (route) =>
      route.fulfill({
        json: {
          networks: [
            ...depositNetworks.networks,
            {
              id: 'tron',
              name: 'Tron',
              fee: '1 USDT',
              minDeposit: 5,
              address: 'TQ8k2n3exampleaddress1234567890',
              arrivalTime: '~1 minute',
              confirmations: 20,
              memo: '123456',
            },
          ],
        },
      }),
    );

    await page.goto('/wallet/deposit/USDT');
    await expect(page.getByLabel('Deposit network')).toHaveValue('ethereum');
    await page.getByLabel('Deposit network').selectOption('tron');
    await expect(page.getByText(/Memo is required for this network/)).toBeVisible();

    const readThemeStyles = async (theme: 'dark' | 'light') => {
      await page.locator('html').evaluate((element, nextTheme) => {
        element.classList.remove('dark', 'light');
        element.classList.add(nextTheme);
      }, theme);

      return page.evaluate(() => {
        const paragraphs = [...document.querySelectorAll('p')];
        const errorMessage = paragraphs.find((paragraph) =>
          paragraph.textContent?.includes('Send only'),
        );
        const warningMessage = paragraphs.find((paragraph) =>
          paragraph.textContent?.includes('Memo is required'),
        );
        const availableLabel = [...document.querySelectorAll('span')].find(
          (span) => span.textContent?.trim() === 'Network available',
        );
        const errorSurface = errorMessage?.parentElement;
        const warningSurface = warningMessage?.parentElement;
        const successDot = availableLabel?.parentElement?.querySelector('span');

        if (!errorMessage || !warningMessage || !errorSurface || !warningSurface || !successDot) {
          throw new Error('Expected all deposit status surfaces to be rendered.');
        }

        return {
          errorInlineStyle: errorSurface.getAttribute('style') ?? '',
          errorBackground: getComputedStyle(errorSurface).backgroundColor,
          errorBorder: getComputedStyle(errorSurface).borderTopColor,
          errorText: getComputedStyle(errorMessage).color,
          warningInlineStyle: warningSurface.getAttribute('style') ?? '',
          warningBackground: getComputedStyle(warningSurface).backgroundColor,
          success: getComputedStyle(successDot).backgroundColor,
        };
      });
    };

    const dark = await readThemeStyles('dark');
    const light = await readThemeStyles('light');

    for (const styles of [dark, light]) {
      expect(styles.errorInlineStyle).toContain('var(--tr-sell) 8%');
      expect(styles.errorInlineStyle).toContain('var(--tr-sell) 25%');
      expect(styles.errorBackground).not.toBe('rgba(0, 0, 0, 0)');
      expect(styles.errorBorder).not.toBe('rgba(0, 0, 0, 0)');
      expect(styles.warningInlineStyle).toContain('var(--tr-warning-bg)');
      expect(styles.warningInlineStyle).toContain('var(--tr-warning-border)');
      expect(styles.warningBackground).not.toBe('rgba(0, 0, 0, 0)');
    }
    expect(dark.errorText).not.toBe(light.errorText);
    expect(dark.errorBackground).not.toBe(light.errorBackground);
    expect(dark.errorBorder).not.toBe(light.errorBorder);
    expect(dark.success).not.toBe(light.success);
  });

  test('keeps deposit action targets reachable across shell aliases and viewports', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/deposit/networks**', (route) =>
      route.fulfill({ json: depositNetworks }),
    );

    const aliases = [
      { path: '/wallet/deposit', asset: 'USDT' },
      { path: '/t/wallet/deposit', asset: 'USDT' },
      { path: '/w/wallet/deposit', asset: 'USDT' },
      { path: '/r/wallet/deposit', asset: 'USDT' },
      { path: '/wallet/deposit/BTC', asset: 'BTC' },
      { path: '/t/wallet/deposit/BTC', asset: 'BTC' },
      { path: '/w/wallet/deposit/BTC', asset: 'BTC' },
      { path: '/r/wallet/deposit/BTC', asset: 'BTC' },
    ];
    const cases = [
      ...aliases.map((alias) => ({ ...alias, viewport: { width: 390, height: 844 } })),
      { path: '/r/wallet/deposit/USDT', asset: 'USDT', viewport: { width: 320, height: 568 } },
      { path: '/t/wallet/deposit/USDT', asset: 'USDT', viewport: { width: 768, height: 1024 } },
      { path: '/w/wallet/deposit/USDT', asset: 'USDT', viewport: { width: 1280, height: 900 } },
    ];

    for (const { path: routePath, asset, viewport } of cases) {
      await page.setViewportSize(viewport);
      await page.goto(routePath);
      await expect(page.getByLabel('Deposit network')).toHaveValue('ethereum');
      await expect(page.getByRole('heading', { name: `Deposit ${asset}` })).toBeVisible();

      const copy = page.getByRole('button', { name: `Copy ${asset} deposit address` });
      const refresh = page.getByRole('button', { name: 'Refresh deposit instructions' });
      await expect(copy).toBeVisible();
      await expect(refresh).toBeVisible();

      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentWidth).toBeLessThanOrEqual(viewport.width);

      await copy.scrollIntoViewIfNeeded();
      const copyGeometry = await copy.boundingBox();
      expect(copyGeometry?.height).toBe(36);
      expect(copyGeometry?.width).toBeGreaterThanOrEqual(36);
      const copyReceivesCenterHit = await copy.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return hit === element || Boolean(hit && element.contains(hit));
      });
      expect(copyReceivesCenterHit).toBe(true);

      await refresh.scrollIntoViewIfNeeded();
      const refreshGeometry = await refresh.boundingBox();
      expect(refreshGeometry?.height).toBe(52);
      expect(refreshGeometry?.x).toBeGreaterThanOrEqual(0);
      expect(refreshGeometry!.x + refreshGeometry!.width).toBeLessThanOrEqual(viewport.width);
      const refreshReceivesCenterHit = await refresh.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return hit === element || Boolean(hit && element.contains(hit));
      });
      expect(refreshReceivesCenterHit).toBe(true);
    }
  });

  test('scopes deposit copy feedback to its network and exposes refresh pending state', async ({
    page,
  }) => {
    const networksWithMemo = {
      networks: [
        ...depositNetworks.networks,
        {
          id: 'tron',
          name: 'Tron',
          fee: '1 USDT',
          minDeposit: 5,
          address: 'TQ8k2n3exampleaddress1234567890',
          arrivalTime: '~1 minute',
          confirmations: 20,
          memo: '123456',
        },
      ],
    };
    let networkRequests = 0;
    let finishRefresh: (() => void) | undefined;

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async () => undefined },
      });
    });
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/deposit/networks**', async (route) => {
      networkRequests += 1;
      if (networkRequests === 1) return route.fulfill({ json: networksWithMemo });
      await new Promise<void>((resolve) => {
        finishRefresh = resolve;
      });
      return route.fulfill({ json: networksWithMemo });
    });

    await page.goto('/wallet/deposit/USDT');
    const networkSelect = page.getByLabel('Deposit network');
    await expect(networkSelect).toHaveValue('ethereum');

    await page.getByRole('button', { name: 'Copy USDT deposit address' }).click();
    await expect(page.getByText('Copied USDT deposit address', { exact: true })).toBeVisible();
    await networkSelect.selectOption('tron');
    await expect(page.getByText('Copied USDT deposit address', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Copy Memo' }).click();
    await expect(page.getByText('Copied Memo', { exact: true })).toBeVisible();
    await networkSelect.selectOption('ethereum');
    await expect(page.getByText('Copied Memo', { exact: true })).toHaveCount(0);

    const refresh = page.getByRole('button', { name: 'Refresh deposit instructions' });
    await refresh.click();
    try {
      await expect.poll(() => networkRequests).toBe(2);
      await expect(refresh).toBeDisabled();
      await expect(refresh).toHaveAttribute('aria-busy', 'true');
    } finally {
      finishRefresh?.();
    }
    await expect(refresh).toBeEnabled();
    await expect(refresh).toHaveAttribute('aria-busy', 'false');
  });

  test('loads pending deposits with server filters and cursor pagination', async ({ page }) => {
    const cursors: Array<string | null> = [];
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/transactions**', async (route) => {
      const url = new URL(route.request().url());
      expect(url.searchParams.get('type')).toBe('deposit');
      expect(url.searchParams.get('status')).toBe('pending');
      expect(url.searchParams.get('limit')).toBe('100');
      const cursor = url.searchParams.get('cursor');
      cursors.push(cursor);
      return route.fulfill({
        json: cursor
          ? {
              items: [
                {
                  id: 'pending-eth',
                  type: 'deposit',
                  asset: 'ETH',
                  amount: 0.75,
                  status: 'pending',
                  createdAt: '2026-09-25T10:00:00.000Z',
                  network: 'Ethereum',
                },
              ],
              total: 2,
            }
          : {
              items: [
                {
                  id: 'pending-btc',
                  type: 'deposit',
                  asset: 'BTC',
                  amount: 0.5,
                  status: 'pending',
                  createdAt: '2026-09-24T10:00:00.000Z',
                  network: 'Bitcoin',
                },
              ],
              total: 2,
              nextCursor: 'next-page',
            },
      });
    });

    await page.goto('/wallet/pending-deposits');
    await expect(page.getByText('BTC deposit · Bitcoin')).toBeVisible();
    await page.getByRole('button', { name: 'Load more' }).click();
    await expect(page.getByText('ETH deposit · Ethereum')).toBeVisible();
    expect(cursors).toEqual([null, 'next-page']);
  });

  test('loads wallet history with server filters and cursor pagination', async ({ page }) => {
    const queries: Array<{
      asset: string | null;
      type: string | null;
      status: string | null;
      cursor: string | null;
      limit: string | null;
    }> = [];
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/transactions**', async (route) => {
      const params = new URL(route.request().url()).searchParams;
      queries.push({
        asset: params.get('asset'),
        type: params.get('type'),
        status: params.get('status'),
        cursor: params.get('cursor'),
        limit: params.get('limit'),
      });

      if (params.get('type') === 'trade_buy') {
        return route.fulfill({
          json: {
            items: [
              {
                id: 'history-trade',
                type: 'trade_buy',
                asset: 'BTC',
                amount: 0.01,
                status: 'pending',
                createdAt: '2026-09-25T10:00:00.000Z',
              },
            ],
            total: 1,
          },
        });
      }

      return route.fulfill({
        json: params.get('cursor')
          ? {
              items: [
                {
                  id: 'history-withdraw',
                  type: 'withdraw',
                  asset: 'ETH',
                  amount: 0.25,
                  status: 'completed',
                  createdAt: '2026-09-24T10:00:00.000Z',
                },
              ],
              total: 2,
            }
          : {
              items: [
                {
                  id: 'history-deposit',
                  type: 'deposit',
                  asset: 'USDT',
                  amount: 25,
                  status: 'completed',
                  createdAt: '2026-09-25T10:00:00.000Z',
                },
              ],
              total: 2,
              nextCursor: 'history-page-2',
            },
      });
    });

    await page.goto('/wallet/history');
    await expect(page.getByText('+25', { exact: true })).toBeVisible();
    expect(queries[0]).toEqual({
      asset: null,
      type: null,
      status: null,
      cursor: null,
      limit: '50',
    });

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('-0.25', { exact: true })).toBeVisible();
    expect(queries.at(-1)?.cursor).toBe('history-page-2');
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.getByText('+25', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('-0.25', { exact: true })).toBeVisible();

    const typeResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).searchParams.get('type') === 'trade_buy',
    );
    await page.getByRole('button', { name: 'Trade buy' }).click();
    await typeResponse;
    expect(queries.at(-1)?.cursor).toBeNull();
    const statusResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).searchParams.get('status') === 'pending',
    );
    await page.getByRole('button', { name: 'Pending' }).click();
    await statusResponse;
    await page.getByLabel('Filter by asset').fill('btc');
    const assetResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).searchParams.get('asset') === 'BTC',
    );
    await page.getByRole('button', { name: 'Apply' }).click();
    await assetResponse;
    await expect(page.getByText('+0.01', { exact: true })).toBeVisible();
    expect(queries.at(-1)).toEqual({
      asset: 'BTC',
      type: 'trade_buy',
      status: 'pending',
      cursor: null,
      limit: '50',
    });
  });

  test('keeps the shared asset filter accessible and within wallet route viewports', async ({
    page,
  }) => {
    const samples = [
      { path: '/wallet/history', width: 390, height: 844 },
      { path: '/t/wallet/history', width: 768, height: 1024 },
      { path: '/w/wallet/history', width: 1280, height: 900 },
      { path: '/r/wallet/history', width: 440, height: 956 },
    ];
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/transactions**', (route) =>
      route.fulfill({ json: { items: [], total: 0 } }),
    );

    for (const sample of samples) {
      await page.setViewportSize({ width: sample.width, height: sample.height });
      await page.goto(sample.path);
      const filter = page.getByRole('textbox', { name: 'Filter by asset' });
      await expect(filter).toBeVisible();
      await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible();

      const geometry = await filter.evaluate((input) => {
        const form = input.closest('form');
        const control = input.closest('.tr-search-bar-control');
        const submit = form?.querySelector('button[type="submit"]');
        if (!form || !control || !submit) return null;
        const formRect = form.getBoundingClientRect();
        return {
          left: formRect.left,
          right: formRect.right,
          controlHeight: control.getBoundingClientRect().height,
          actionHeight: submit.getBoundingClientRect().height,
        };
      });

      expect(geometry).not.toBeNull();
      expect(geometry?.left).toBeGreaterThanOrEqual(0);
      expect(geometry?.right).toBeLessThanOrEqual(sample.width);
      expect(geometry?.controlHeight).toBe(44);
      expect(geometry?.actionHeight).toBe(36);
    }
  });

  test('renders withdrawal limits returned for the selected asset', async ({ page }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/assets', (route) => route.fulfill({ json: assets }));
    await page.route('**/wallet/withdrawal/networks**', (route) =>
      route.fulfill({ json: withdrawalNetworks }),
    );

    await page.goto('/wallet/limits');

    await expect(page.getByText('Ethereum')).toBeVisible();
    await expect(page.getByText('5 USDT', { exact: true })).toBeVisible();
    await expect(page.getByText('50 USDT', { exact: true })).toBeVisible();
    await expect(page.getByText('0.5 USDT', { exact: true })).toBeVisible();
  });

  test('submits a network-limited withdrawal after MFA verification', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let challengeBody: Record<string, unknown> | undefined;
    let verificationBody: Record<string, unknown> | undefined;
    let withdrawalBody: Record<string, unknown> | undefined;
    let idempotencyKey: string | undefined;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/assets', (route) => route.fulfill({ json: assets }));
    await page.route('**/wallet/withdrawal/networks**', (route) =>
      route.fulfill({ json: withdrawalNetworks }),
    );
    await page.route('**/wallet/withdrawals/challenge', async (route) => {
      challengeBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        status: 201,
        json: {
          id: 'e2e-withdrawal-challenge',
          method: 'totp',
          maskedDestination: 'Authenticator app',
          expiresAt: '2099-01-01T00:05:00.000Z',
        },
      });
    });
    await page.route('**/wallet/withdrawals/challenge/*/verify', async (route) => {
      verificationBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        json: {
          verificationToken: 'e2e-withdrawal-verification-token',
          expiresAt: '2099-01-01T00:05:00.000Z',
        },
      });
    });
    await page.route('**/wallet/withdrawals', async (route) => {
      withdrawalBody = route.request().postDataJSON() as Record<string, unknown>;
      idempotencyKey = route.request().headers()['idempotency-key'];
      return route.fulfill({
        status: 201,
        json: {
          id: 'e2e-withdrawal-1',
          transactionId: 'e2e-transaction-1',
          asset: 'USDT',
          amount: 50,
          status: 'pending',
          createdAt: '2026-09-24T09:00:00.000Z',
        },
      });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/wallet/withdraw/USDT');
    await expect(page).toHaveURL(/\/wallet\/withdraw\/USDT$/);
    expect(new URL(page.url()).pathname).toBe('/wallet/withdraw/USDT');
    await expect(page.getByLabel('Mạng lưới')).toHaveValue('ethereum');
    const fieldTokens = await page.evaluate(() => ({
      height: getComputedStyle(document.documentElement).getPropertyValue('--input-height').trim(),
      radius: getComputedStyle(document.documentElement)
        .getPropertyValue('--tr-radius-input')
        .trim(),
    }));
    for (const selector of ['#withdraw-network', '#withdraw-address', '#withdraw-amount']) {
      const control = page.locator(selector);
      const surface = selector === '#withdraw-network' ? control : control.locator('xpath=..');
      await expect(surface).toHaveCSS('height', fieldTokens.height);
      await expect(surface).toHaveCSS('border-radius', fieldTokens.radius);
    }
    const addressField = page.locator('#withdraw-address');
    const amountField = page.locator('#withdraw-amount');
    await expect(addressField).toHaveCSS('font-size', '16px');
    await expect(amountField).toHaveCSS('font-size', '18px');
    await addressField.focus();
    await expect
      .poll(
        () =>
          addressField.evaluate((element) => getComputedStyle(element.parentElement!).boxShadow),
        { timeout: 2_000 },
      )
      .toContain('rgba(229, 138, 0, 0.25)');
    await page.getByRole('button', { name: /Tiếp tục/ }).click();
    await expect(addressField).toHaveAttribute('aria-invalid', 'true');
    await expect(addressField).toHaveAttribute('aria-describedby', 'withdraw-address-error');
    await expect(page.locator('#withdraw-address-error')).toHaveAttribute('role', 'alert');
    await expect(amountField).toHaveAttribute('aria-invalid', 'true');
    await expect(amountField).toHaveAttribute('aria-describedby', 'withdraw-amount-error');
    expect(challengeBody).toBeUndefined();

    await addressField.fill('wallet-address-long-enough-for-validation-123456');
    await expect(page.locator('#withdraw-address-error')).toHaveCount(0);
    await page.getByRole('button', { name: 'Tất cả' }).click();
    await expect(amountField).toHaveValue('50.000000');
    await expect(page.locator('#withdraw-amount-error')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    await expect(page).toHaveURL(/\/wallet\/withdraw\/USDT$/);
    await expect(addressField).toHaveValue('wallet-address-long-enough-for-validation-123456');
    await expect(amountField).toHaveValue('50.000000');
    await page.getByRole('button', { name: /Tiếp tục/ }).click();
    await page.getByRole('button', { name: /Xác minh 2FA/ }).click();

    const verificationCode = page.getByLabel(/Mã xác minh/i);
    const verificationSurface = verificationCode.locator('xpath=..');
    await expect(verificationCode).toBeVisible();
    await page.setViewportSize({ width: 320, height: 568 });
    const verificationBounds = await verificationCode.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, viewportWidth: innerWidth };
    });
    expect(verificationBounds.left).toBeGreaterThanOrEqual(0);
    expect(verificationBounds.right).toBeLessThanOrEqual(verificationBounds.viewportWidth);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(verificationCode).toHaveAttribute('type', 'tel');
    await expect(verificationCode).toHaveAttribute('inputmode', 'numeric');
    await expect(verificationCode).toHaveAttribute('maxlength', '6');
    await expect(verificationCode).toHaveAttribute('aria-invalid', 'false');
    await verificationCode.focus();
    await expect(verificationCode).toBeFocused();
    await expect
      .poll(() => verificationSurface.evaluate((surface) => getComputedStyle(surface).boxShadow), {
        timeout: 2_000,
      })
      .toContain('rgba(229, 138, 0, 0.25)');
    const expectedFocusBorder = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--tr-primary)';
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    await expect
      .poll(() =>
        verificationSurface.evaluate((surface) => getComputedStyle(surface).borderTopColor),
      )
      .toBe(expectedFocusBorder);
    const verificationStyles = await verificationSurface.evaluate((surface) => {
      const input = surface.querySelector('input')!;
      const textColorProbe = document.createElement('span');
      textColorProbe.style.color = 'var(--tr-text-1)';
      document.body.append(textColorProbe);
      const expectedInputColor = getComputedStyle(textColorProbe).color;
      textColorProbe.remove();
      const surfaceStyle = getComputedStyle(surface);
      return {
        height: surfaceStyle.height,
        borderRadius: surfaceStyle.borderRadius,
        focusBorder: surfaceStyle.borderTopColor,
        inputColor: getComputedStyle(input).color,
        expectedInputColor,
      };
    });
    expect(verificationStyles.height).toBe('64px');
    expect(verificationStyles.borderRadius).toBe(fieldTokens.radius);
    expect(verificationStyles.focusBorder).toBe(expectedFocusBorder);
    expect(verificationStyles.inputColor).toBe(verificationStyles.expectedInputColor);
    expect(challengeBody).toEqual({
      asset: 'USDT',
      networkId: 'ethereum',
      address: 'wallet-address-long-enough-for-validation-123456',
      amount: 50,
    });
    await page.getByLabel(/Mã xác minh/i).fill('123456');
    const withdrawalResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/wallet/withdrawals'),
    );
    await page.getByRole('button', { name: /Xác nhận rút tiền/ }).click();

    await expect((await withdrawalResponse).status()).toBe(201);
    await expect(page.getByText('e2e-withdrawal-1')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('e2e-transaction-1')).toBeVisible();
    await expect(page.getByText('Đang xử lý', { exact: true })).toBeVisible();
    expect(verificationBody).toEqual({ code: '123456' });
    expect(withdrawalBody).toEqual({
      asset: 'USDT',
      networkId: 'ethereum',
      address: 'wallet-address-long-enough-for-validation-123456',
      amount: 50,
      verificationToken: 'e2e-withdrawal-verification-token',
    });
    expect(idempotencyKey).toBeTruthy();
  });

  test('address-book shell aliases use the shared search control with contract data', async ({
    page,
  }) => {
    await page.route('https://e2e.test/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('https://e2e.test/wallet/address-book', (route) =>
      route.fulfill({ json: addressBookResponse }),
    );

    const samples = [
      { path: '/w/address-book', width: 320, height: 568 },
      { path: '/r/wallet/address-book', width: 390, height: 844 },
      { path: '/t/wallet/address-book', width: 768, height: 1024 },
      { path: '/wallet/address-book', width: 1280, height: 800 },
      { path: '/w/wallet/address-book', width: 1280, height: 800 },
      { path: '/w/profile/security/withdrawal-whitelist', width: 1280, height: 800 },
    ];
    const measurements: Array<Record<string, unknown>> = [];

    for (const sample of samples) {
      await page.setViewportSize({ width: sample.width, height: sample.height });
      const addressBookResponseReceived = page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          new URL(response.url()).origin === 'https://e2e.test' &&
          new URL(response.url()).pathname.endsWith('/wallet/address-book'),
      );
      await page.goto(sample.path);

      expect(new URL(page.url()).pathname).toBe(sample.path);
      expect((await addressBookResponseReceived).ok()).toBe(true);
      const destination = page.getByText('Contract-owned destination');
      await expect(destination).toBeVisible();
      await expect(page.getByText('Binance Main Wallet')).toHaveCount(0);

      const search = page.getByRole('textbox', { name: 'Tìm địa chỉ hoặc tên' });
      await expect(search).toBeVisible();
      const geometry = await search.evaluate((element) => {
        const control = element.parentElement;
        const style = control ? getComputedStyle(control) : undefined;
        const rect = control?.getBoundingClientRect();
        return {
          controlHeight: style?.height,
          outlineStyle: style?.outlineStyle,
          outlineWidth: style?.outlineWidth,
          withinViewport: Boolean(rect && rect.left >= 0 && rect.right <= innerWidth),
        };
      });
      expect(geometry.controlHeight).toBe('44px');
      expect(geometry.withinViewport).toBe(true);

      await search.focus();
      const focusStyle = await search.evaluate((element) => {
        const control = element.parentElement;
        const style = control ? getComputedStyle(control) : undefined;
        return { outlineStyle: style?.outlineStyle, outlineWidth: style?.outlineWidth };
      });
      expect(focusStyle).toEqual({ outlineStyle: 'solid', outlineWidth: '2px' });

      await search.fill('no-matching-destination');
      await expect(destination).toHaveCount(0);
      await expect(page.getByText('Không tìm thấy địa chỉ')).toBeVisible();
      await page.getByRole('button', { name: 'Xóa tìm kiếm' }).click();
      await expect(search).toHaveValue('');
      await expect(destination).toBeVisible();

      measurements.push({ ...sample, ...geometry, focusStyle });
    }

    console.log(`C06_ADDRESS_BOOK_SEARCH ${JSON.stringify(measurements)}`);
  });
});
