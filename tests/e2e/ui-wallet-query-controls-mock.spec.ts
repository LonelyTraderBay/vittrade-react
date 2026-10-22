import { resizeAuthenticatedHome } from './helpers/resize-home';
import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { paint } from './helpers/semantic-control-paint';

for (const theme of ['light', 'dark'])
  for (const profile of [
    { name: 'phone', prefix: '', width: 390 },
    { name: 'web', prefix: '/w', width: 1440 },
  ])
    for (const kind of [
      'portfolio',
      'dust-quote',
      'dust-pending',
      'dust-completed',
      'dust-confirm-error',
      'dust-retry',
      'dust-receipt-read-error',
    ])
      test(`Wallet query controls ${kind} ${profile.name} ${theme} @ui-mock`, async ({
        page,
      }, info) => {
        let writes = 0;
        let quoteErrors = 0;
        let assetErrors = 0;
        page.on('request', (r) => {
          if (
            !['GET', 'HEAD', 'OPTIONS'].includes(r.method()) &&
            !new URL(r.url()).pathname.includes('/auth/')
          )
            writes++;
        });
        page.on('response', (r) => {
          if (new URL(r.url()).pathname.endsWith('/wallet/assets') && r.status() === 503) {
            expect(r.fromServiceWorker()).toBe(true);
            assetErrors++;
          }
          if (
            new URL(r.url()).pathname.endsWith('/wallet/dust-conversions/quote') &&
            r.status() === 503
          ) {
            expect(r.fromServiceWorker()).toBe(true);
            quoteErrors++;
          }
        });
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/w/auth/login');
        await expect(page.getByTestId('auth-email')).toBeVisible();
        if (kind !== 'portfolio') {
          const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
          const dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
          expect(dependencyUrl).toBeTruthy();
          await page.evaluate(
            async ({ dependencyUrl, workerUrl, kind }) => {
              const { worker } = await import(workerUrl);
              const { http, HttpResponse } = await import(dependencyUrl);
              let assetsFailed = false;
              let attempts = 0;
              // Test-only writer session, shaped by authSessionSchema. The
              // shipped Wallet persona only has transfer/withdraw permissions.
              if (kind !== 'dust-quote') {
                const session = {
                  user: {
                    id: 'ui-dust-writer',
                    email: 'dust-writer@vittrade.local',
                    fullName: 'Dust Writer Test',
                    roles: ['user'],
                    permissions: ['market:read', 'wallet:read', 'wallet:dust-convert'],
                    kycStatus: 'verified',
                    accountStatus: 'active',
                  },
                  accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
                };
                worker.use(
                  http.post('*/auth/login', async ({ request }: { request: Request }) => {
                    const body = await request.json();
                    return body.email === session.user.email && body.password === 'Preview-123!'
                      ? HttpResponse.json({ status: 'authenticated', session })
                      : HttpResponse.json({ code: 'INVALID_CREDENTIALS' }, { status: 401 });
                  }),
                  http.get('*/auth/session', () => HttpResponse.json(session)),
                  http.post('*/auth/refresh', () => HttpResponse.json(session)),
                );
              }
              worker.use(
                http.get('*/wallet/assets', () =>
                  assetsFailed
                    ? HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 })
                    : HttpResponse.json({
                        items: [
                          {
                            id: 'dust',
                            symbol: 'DUST',
                            name: 'Dust Asset',
                            balance: 0.1,
                            available: 0.1,
                            frozen: 0,
                            inOrder: 0,
                            usdValue: 0.25,
                            change24h: -1,
                            logoColor: '#64748B',
                          },
                        ],
                        summary: {
                          totalUsd: 0.25,
                          totalBtc: 0,
                          availableUsd: 0.25,
                          inOrderUsd: 0,
                          frozenUsd: 0,
                        },
                      }),
                ),
                http.get('*/wallet/dust-conversions/quote', () =>
                  kind === 'dust-quote'
                    ? HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 })
                    : HttpResponse.json({
                        targetAsset: 'USDT',
                        grossUsd: 0.25,
                        feePct: 1,
                        feeUsd: 0.0025,
                        receivedUsd: 0.2475,
                        targetAmount: 0.2475,
                      }),
                ),
                http.post('*/wallet/dust-conversions', async () => {
                  attempts++;
                  if (kind === 'dust-retry' && attempts === 1) {
                    document.documentElement.dataset.uiDustWaiting = 'true';
                    await new Promise<void>((resolve) =>
                      window.addEventListener('ui-dust-release', () => resolve(), { once: true }),
                    );
                    delete document.documentElement.dataset.uiDustWaiting;
                    return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
                  }
                  assetsFailed = kind === 'dust-receipt-read-error';
                  return HttpResponse.json(
                    {
                      id: 'ui-pending-dust',
                      status: kind === 'dust-completed' ? 'completed' : 'pending',
                      createdAt: '2026-10-21T00:00:00.000Z',
                      targetAsset: 'USDT',
                      grossUsd: 0.25,
                      feePct: 1,
                      feeUsd: 0.0025,
                      receivedUsd: 0.2475,
                      targetAmount: 0.2475,
                    },
                    { status: 201 },
                  );
                }),
              );
            },
            { dependencyUrl: dependencyUrl!, workerUrl: '/src/dev/mocks/browser.ts', kind },
          );
        }
        await page
          .getByTestId('auth-email')
          .fill(
            kind !== 'portfolio' && kind !== 'dust-quote'
              ? 'dust-writer@vittrade.local'
              : 'wallet@vittrade.local',
          );
        await page.getByTestId('auth-password').fill('Preview-123!');
        await page.getByTestId('auth-submit').click();
        await expect(page).toHaveURL('/w/home');
        if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
        await expect(page.locator('html')).toHaveClass(new RegExp('\\b' + theme + '\\b'));
        await resizeAuthenticatedHome(page, { width: profile.width, height: 900 });
        const target =
          kind === 'portfolio'
            ? profile.prefix
              ? '/w/portfolio/analytics'
              : '/wallet/portfolio-analytics'
            : profile.prefix + '/wallet/dust-converter';
        await page.evaluate(
          async ({ moduleUrl, target }) => {
            const { router } = await import(moduleUrl);
            await router.navigate(target);
          },
          { moduleUrl: '/src/app/router/index.ts', target },
        );
        await expect(page).toHaveURL(target);
        let observation;
        if (kind === 'portfolio') {
          await expect(page.getByText('Period 1M', { exact: true })).toBeVisible();
          const control = page.getByRole('button', { name: '1W', exact: true });
          const original = await control.elementHandle();
          await control.focus();
          const response = page.waitForResponse((r) => {
            const url = new URL(r.url());
            return (
              url.pathname.endsWith('/wallet/analytics/portfolio') &&
              url.searchParams.get('period') === '1W'
            );
          });
          await control.press('Enter');
          const received = await response;
          expect(received.status()).toBe(200);
          expect(received.fromServiceWorker()).toBe(true);
          await expect(page.getByText('Period 1W', { exact: true })).toBeVisible();
          await control.scrollIntoViewIfNeeded();
          let selectedPaint = await paint(control);
          await expect
            .poll(async () => {
              selectedPaint = await paint(control);
              return selectedPaint.nominalAlpha;
            })
            .toBe(33);
          expect(selectedPaint.supported).toBe(true);
          expect(selectedPaint.ratio).toBeGreaterThanOrEqual(4.5);
          expect(selectedPaint.nominalAlpha).toBe(33);
          expect(selectedPaint.pressed).toBe('true');
          expect(selectedPaint.focusVisible).toBe(true);
          expect(selectedPaint.outlineStyle).not.toBe('none');
          expect(selectedPaint.height).toBeGreaterThanOrEqual(36);
          expect(selectedPaint.hits).toEqual([true, true, true]);
          const retained = await original!.evaluate((element) => ({
            connected: element.isConnected,
            focused: document.activeElement === element,
          }));
          const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
          const dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
          expect(dependencyUrl).toBeTruthy();
          await page.evaluate(
            async ({ dependencyUrl, workerUrl, data }) => {
              const { worker } = await import(workerUrl);
              const { http, HttpResponse } = await import(dependencyUrl);
              worker.use(
                http.get('*/wallet/analytics/portfolio', ({ request }: { request: Request }) => {
                  const period = new URL(request.url).searchParams.get('period');
                  return period === '3M'
                    ? HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 })
                    : HttpResponse.json({ ...data, period });
                }),
              );
            },
            {
              dependencyUrl: dependencyUrl!,
              workerUrl: '/src/dev/mocks/browser.ts',
              data: await received.json(),
            },
          );
          const failingPeriod = page.getByRole('button', { name: '3M', exact: true });
          await failingPeriod.focus();
          await failingPeriod.press('Enter');
          await expect(page.getByRole('alert')).toContainText('Có lỗi xảy ra');
          await expect(failingPeriod).toBeFocused();
          await expect(failingPeriod).toHaveAttribute('aria-pressed', 'true');
          await expect(page.getByText('Period 1W', { exact: true })).toHaveCount(0);
          const recovery = page.getByRole('button', { name: '1Y', exact: true });
          await recovery.focus();
          await recovery.press('Enter');
          await expect(page.getByText('Period 1Y', { exact: true })).toBeVisible();
          await expect(recovery).toBeFocused();
          observation = {
            target,
            kind,
            profile,
            theme,
            writes,
            retained,
            fromWorker: received.fromServiceWorker(),
            status: received.status(),
            selectedPaint,
            errorAndRecoveryFocusRetained: true,
          };
        } else if (kind === 'dust-quote') {
          await expect(page.getByText('DUST', { exact: true })).toBeVisible();
          const control = page.getByRole('button', { name: 'Chọn tất cả', exact: true });
          const original = await control.elementHandle();
          await control.focus();
          await control.press('Enter');
          await expect(
            page.getByText(/Không thể tải (dữ liệu chuyển đổi|báo giá chuyển đổi)/),
          ).toBeVisible();
          observation = {
            target,
            kind,
            profile,
            theme,
            writes,
            retained: await original!.evaluate((e) => ({
              connected: e.isConnected,
              focused: document.activeElement === e,
            })),
            quoteErrors,
            dustRowsVisible: await page.getByText('DUST', { exact: true }).count(),
          };
          await expect(page.getByRole('button', { name: /Chuyển đổi 1 tài sản/ })).toBeDisabled();
          await page.getByRole('button', { name: /BNB BNB/ }).press('Enter');
          await expect(page.getByRole('button', { name: /Dust Asset/ })).toHaveAttribute(
            'aria-pressed',
            'false',
          );
          await expect(
            page.getByRole('button', { name: 'Chọn tài sản để chuyển đổi', exact: true }),
          ).toBeDisabled();
        } else {
          await expect(page.getByText('DUST', { exact: true })).toBeVisible();
          await page.getByRole('button', { name: 'Chọn tất cả', exact: true }).press('Enter');
          const openConfirmation = page.getByRole('button', { name: /Chuyển đổi 1 tài sản/ });
          await expect(openConfirmation).toBeEnabled();
          await openConfirmation.press('Enter');
          const confirm = page.getByRole('button', { name: 'Chuyển đổi sang USDT', exact: true });
          await expect(confirm).toBeEnabled();
          const confirmationAmount = page
            .getByRole('dialog', { name: 'Xác nhận chuyển đổi', exact: true })
            .getByText('0.247500 USDT', { exact: true });
          await expect(confirmationAmount).toBeVisible();
          let confirmationPaint = await paint(confirmationAmount);
          await expect
            .poll(async () => {
              confirmationPaint = await paint(confirmationAmount);
              return confirmationPaint.hits;
            })
            .toEqual([true, true, true]);
          expect(confirmationPaint.supported).toBe(true);
          expect(confirmationPaint.ratio).toBeGreaterThanOrEqual(4.5);
          if (kind === 'dust-confirm-error') {
            const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
            const dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
            expect(dependencyUrl).toBeTruthy();
            await page.evaluate(
              async ({ dependencyUrl, workerUrl, clientUrl }) => {
                const { worker } = await import(workerUrl);
                const { http, HttpResponse } = await import(dependencyUrl);
                const { queryClient } = await import(clientUrl);
                worker.use(
                  http.get('*/wallet/dust-conversions/quote', () =>
                    HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 }),
                  ),
                );
                await queryClient.invalidateQueries({
                  queryKey: ['wallet', 'dust-conversion-quote'],
                });
              },
              {
                dependencyUrl: dependencyUrl!,
                workerUrl: '/src/dev/mocks/browser.ts',
                clientUrl: '/src/shared/api/query-client.ts',
              },
            );
            const confirmation = page.getByRole('dialog', {
              name: 'Xác nhận chuyển đổi',
              exact: true,
            });
            await expect(confirmation.getByRole('alert')).toContainText('Không lấy được báo giá');
            await expect(confirm).toBeDisabled();
            await expect(confirmation.getByText('Tổng giá trị', { exact: true })).toHaveCount(0);
            await confirm.press('Enter');
            await page.screenshot({
              path: info.outputPath('wallet-query-controls.png'),
              fullPage: true,
            });
            await confirmation.press('Escape');
            await expect(confirmation).toHaveCount(0);
            await expect(
              page.getByRole('region', { name: 'Lựa chọn và báo giá chuyển đổi', exact: true }),
            ).toBeFocused();
            const returnedFocus = await page.evaluate(() => ({
              tag: document.activeElement?.tagName,
              connected: document.activeElement?.isConnected,
              inSheet: Boolean(document.activeElement?.closest('[role="dialog"]')),
            }));
            const observation = {
              kind,
              target,
              profile,
              theme,
              writes,
              quoteErrors,
              returnedFocus,
            };
            await writeFile(
              info.outputPath('wallet-query-controls.json'),
              JSON.stringify(observation, null, 2),
            );
            console.log('C06_WALLET_QUERY_CONTROLS', JSON.stringify(observation));
            expect(writes).toBe(0);
            expect(returnedFocus.tag).not.toBe('BODY');
            expect(returnedFocus.connected).toBe(true);
            expect(returnedFocus.inSheet).toBe(false);
            return;
          }
          const response = page.waitForResponse(
            (r) =>
              new URL(r.url()).pathname.endsWith('/wallet/dust-conversions') &&
              r.request().method() === 'POST' &&
              r.status() === 201,
          );
          const firstFailure =
            kind === 'dust-retry'
              ? page.waitForResponse(
                  (r) =>
                    new URL(r.url()).pathname.endsWith('/wallet/dust-conversions') &&
                    r.request().method() === 'POST' &&
                    r.status() === 503,
                )
              : null;
          await confirm.press('Enter');
          let retryKey: string | undefined;
          if (firstFailure) {
            await expect(page.locator('html')).toHaveAttribute('data-ui-dust-waiting', 'true');
            const confirmation = page.getByRole('dialog', {
              name: 'Xác nhận chuyển đổi',
              exact: true,
            });
            await expect(
              confirmation.getByRole('button', { name: 'Đang chuyển đổi...' }),
            ).toBeDisabled();
            await expect(
              confirmation.getByRole('button', { name: 'Đóng', exact: true }),
            ).toBeDisabled();
            await confirmation.press('Escape');
            await expect(confirmation).toBeVisible();
            expect(writes).toBe(1);
            await page.evaluate(() => window.dispatchEvent(new Event('ui-dust-release')));
            const failed = await firstFailure;
            expect(failed.fromServiceWorker()).toBe(true);
            retryKey = failed.request().headers()['idempotency-key'];
            expect(retryKey).toBeTruthy();
            await expect(confirm).toBeEnabled();
            await expect(confirmation.getByText('0.247500 USDT', { exact: true })).toBeVisible();
            expect(writes).toBe(1);
            await confirm.press('Enter');
          }
          const received = await response;
          expect(received.status()).toBe(201);
          expect(received.fromServiceWorker()).toBe(true);
          const expectedStatus = kind === 'dust-completed' ? 'completed' : 'pending';
          expect((await received.json()).status).toBe(expectedStatus);
          expect(received.request().postDataJSON()).toEqual({
            sourceAssetIds: ['dust'],
            targetAsset: 'USDT',
          });
          expect(received.request().headers()['idempotency-key']).toBeTruthy();
          if (retryKey) expect(received.request().headers()['idempotency-key']).toBe(retryKey);
          const dialog = page.getByRole('dialog', {
            name:
              kind === 'dust-completed'
                ? 'Chuyển đổi thành công!'
                : 'Yêu cầu chuyển đổi đang xử lý',
            exact: true,
          });
          if (kind === 'dust-receipt-read-error')
            await expect.poll(() => assetErrors).toBeGreaterThan(0);
          await expect(dialog).toBeVisible();
          await expect(
            page.getByRole('dialog', { name: 'Xác nhận chuyển đổi', exact: true }),
          ).toHaveCount(0);
          let clientOutcome = {
            inFlight: -1,
            receipts: [] as { status: string; receiptStatus: string | null }[],
          };
          await expect
            .poll(async () => {
              clientOutcome = await page.evaluate(async (moduleUrl) => {
                const { queryClient } = await import(moduleUrl);
                const receipts: { status: string; receiptStatus: string | null }[] = [];
                for (const mutation of queryClient.getMutationCache().getAll()) {
                  if (mutation.state.variables?.request?.sourceAssetIds?.includes('dust'))
                    receipts.push({
                      status: mutation.state.status,
                      receiptStatus: mutation.state.data?.status ?? null,
                    });
                }
                return { inFlight: queryClient.isMutating(), receipts };
              }, '/src/shared/api/query-client.ts');
              return clientOutcome;
            })
            .toEqual({
              inFlight: 0,
              receipts: [
                ...(kind === 'dust-retry' ? [{ status: 'error', receiptStatus: null }] : []),
                { status: 'success', receiptStatus: expectedStatus },
              ],
            });
          const pendingVisible = (await dialog.count()) === 1;
          const amount = dialog.getByText(
            kind === 'dust-completed' ? '+0.247500 USDT' : 'Dự kiến 0.247500 USDT',
            { exact: true },
          );
          await expect(amount).toBeVisible();
          let receiptPaint = await paint(amount);
          await expect
            .poll(async () => {
              receiptPaint = await paint(amount);
              return receiptPaint.hits;
            })
            .toEqual([true, true, true]);
          expect(receiptPaint.supported).toBe(true);
          expect(receiptPaint.ratio).toBeGreaterThanOrEqual(4.5);
          const warningAlpha = pendingVisible
            ? await dialog.locator('div.w-16.h-16').evaluate((e) => {
                const c = document.createElement('canvas');
                c.width = c.height = 1;
                const ctx = c.getContext('2d')!;
                ctx.fillStyle = getComputedStyle(e).backgroundColor;
                ctx.fillRect(0, 0, 1, 1);
                return ctx.getImageData(0, 0, 1, 1).data[3];
              })
            : null;
          observation = {
            target,
            kind,
            profile,
            theme,
            writes,
            assetErrors,
            clientOutcome,
            pendingVisible,
            warningAlpha,
            responseStatus: received.status(),
            fromWorker: received.fromServiceWorker(),
            confirmationPaint,
            receiptPaint,
            retriedWithSameKey: Boolean(retryKey),
          };
          await page.screenshot({
            path: info.outputPath('wallet-query-controls.png'),
            fullPage: true,
          });
          await dialog
            .getByRole('button', {
              name: kind === 'dust-completed' ? 'Hoàn tất' : 'Đóng biên nhận',
              exact: true,
            })
            .press('Enter');
          await expect(dialog).toHaveCount(0);
          await expect(
            page.getByRole('region', { name: 'Lựa chọn và báo giá chuyển đổi', exact: true }),
          ).toBeFocused();
          const returnedFocus = await page.evaluate(() => ({
            tag: document.activeElement?.tagName,
            connected: document.activeElement?.isConnected,
            inSheet: Boolean(document.activeElement?.closest('[role="dialog"]')),
          }));
          console.log(
            'C06_WALLET_RETURN_FOCUS',
            JSON.stringify({ kind, target, theme, returnedFocus }),
          );
          await writeFile(
            info.outputPath('wallet-return-focus.json'),
            JSON.stringify(returnedFocus, null, 2),
          );
          expect(returnedFocus.tag).not.toBe('BODY');
          expect(returnedFocus.connected).toBe(true);
          expect(returnedFocus.inSheet).toBe(false);
        }
        await writeFile(
          info.outputPath('wallet-query-controls.json'),
          JSON.stringify(observation, null, 2),
        );
        console.log('C06_WALLET_QUERY_CONTROLS', JSON.stringify(observation));
        if ('retained' in observation) {
          expect(writes).toBe(0);
          expect(observation.retained).toEqual({ connected: true, focused: true });
        } else {
          expect(writes).toBe(kind === 'dust-retry' ? 2 : 1);
          expect(observation.pendingVisible).toBe(true);
          if (kind !== 'dust-completed') expect(observation.warningAlpha).toBe(33);
        }
      });
