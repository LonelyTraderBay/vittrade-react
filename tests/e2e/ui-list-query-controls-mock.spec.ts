import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { paint } from './helpers/semantic-control-paint';

for (const theme of ['light', 'dark'])
  for (const profile of [
    { name: 'phone', prefix: '', width: 390 },
    { name: 'web', prefix: '/w', width: 1440 },
  ])
    for (const kind of [
      'history-pending',
      'history-error',
      'disputes-pending',
      'disputes-error',
      'reviews-pending',
      'reviews-error',
      'history-denied',
      'reviews-keyboard',
    ])
      test(`List query controls ${kind} ${profile.name} ${theme} @ui-mock`, async ({
        page,
      }, info) => {
        let writes = 0,
          failedReads = 0,
          workerReads = 0;
        page.on('request', (r) => {
          if (
            !['GET', 'HEAD', 'OPTIONS'].includes(r.method()) &&
            !new URL(r.url()).pathname.includes('/auth/')
          )
            writes++;
        });
        page.on('response', (r) => {
          if (
            ['/wallet/transactions', '/p2p/disputes', '/p2p/reviews'].some((p) =>
              new URL(r.url()).pathname.endsWith(p),
            )
          ) {
            expect(r.fromServiceWorker()).toBe(true);
            workerReads++;
            if (r.status() >= 400) failedReads++;
          }
        });
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/w/auth/login');
        await expect(page.getByTestId('auth-email')).toBeVisible();
        const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
        const dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
        if (!dependencyUrl) throw new Error('MSW browser dependency URL is missing');
        await page.evaluate(
          async ({ dependencyUrl, workerUrl, kind }) => {
            const { worker } = await import(workerUrl);
            const { http, HttpResponse } = await import(dependencyUrl);
            const session = {
              user: {
                id: 'ui-list-reader',
                email: 'list-reader@vittrade.local',
                fullName: 'List Reader Test',
                roles: ['user'],
                permissions: ['wallet:read', 'p2p:read'],
                kycStatus: 'verified',
                accountStatus: 'active',
              },
              accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
            };
            const waitForQuery = async (selected: boolean) => {
              if (selected && kind.endsWith('pending')) {
                document.documentElement.dataset.uiListWaiting = 'true';
                await new Promise<void>((resolve) =>
                  window.addEventListener('ui-list-release', () => resolve(), { once: true }),
                );
                delete document.documentElement.dataset.uiListWaiting;
              }
              return selected && kind.endsWith('error');
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
              http.get('*/wallet/transactions', async ({ request }: { request: Request }) => {
                if (kind === 'history-denied')
                  return HttpResponse.json(
                    { code: 'FORBIDDEN', message: 'Permission denied' },
                    { status: 403 },
                  );
                const selected = new URL(request.url).searchParams.get('type') === 'withdraw';
                if (await waitForQuery(selected))
                  return HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 });
                return HttpResponse.json({
                  items: [
                    {
                      id: selected ? 'ui-withdrawal' : 'ui-deposit',
                      type: selected ? 'withdraw' : 'deposit',
                      asset: 'USDT',
                      amount: 100,
                      status: 'completed',
                      createdAt: '2026-10-21T00:00:00.000Z',
                    },
                  ],
                  total: 1,
                });
              }),
              http.get('*/p2p/disputes', async ({ request }: { request: Request }) => {
                const selected = new URL(request.url).searchParams.get('status') === 'resolved';
                if (await waitForQuery(selected))
                  return HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 });
                return HttpResponse.json({
                  items: [
                    {
                      id: 'ui-dispute',
                      orderId: 'ui-order',
                      orderNumber: 'UI-P2P-001',
                      reason: 'Test dispute',
                      description: 'Test fixture only',
                      evidence: [],
                      status: selected ? 'resolved' : 'submitted',
                      createdAt: '2026-10-21T00:00:00.000Z',
                      timeline: [{ time: '2026-10-21T00:00:00.000Z', event: 'Dispute submitted' }],
                      supportMessages: [],
                      escalationLevel: 2,
                    },
                  ],
                  total: 1,
                });
              }),
              http.get('*/p2p/reviews', async ({ request }: { request: Request }) => {
                const selected = new URL(request.url).searchParams.get('scope') === 'given';
                if (await waitForQuery(selected))
                  return HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 });
                return HttpResponse.json({
                  items: [
                    {
                      id: 'ui-review',
                      orderId: 'ui-order',
                      fromUser: 'Test Buyer',
                      fromUserId: 'ui-buyer',
                      toUser: 'Test Merchant',
                      toUserId: 'ui-merchant',
                      rating: 5,
                      comment: selected ? 'Given review fixture' : 'Received review fixture',
                      createdAt: '2026-10-21',
                      type: 'positive',
                    },
                  ],
                  total: 1,
                  averageRating: 5,
                  positiveCount: 1,
                  negativeCount: 0,
                });
              }),
            );
          },
          { dependencyUrl, workerUrl: '/src/dev/mocks/browser.ts', kind },
        );
        await page.getByTestId('auth-email').fill('list-reader@vittrade.local');
        await page.getByTestId('auth-password').fill('Preview-123!');
        await page.getByTestId('auth-submit').click();
        await expect(page).toHaveURL('/w/home');
        if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
        await page.setViewportSize({ width: profile.width, height: 900 });
        const owner = kind.split('-')[0];
        const path = owner === 'history' ? '/wallet/history' : `/p2p/${owner}`;
        const target = `${profile.prefix}${path}`;
        const previousContext = `${profile.prefix}/home?ui-return=wallet-denied#return-point`;
        if (kind === 'history-denied') {
          // PlatformSwitcher normalizes home to the viewport shell (Phone has no /w).
          // Establish and assert a real prior entry before testing Back, including context.
          await page.evaluate(
            async ({ moduleUrl, previousContext }) => {
              const { router } = await import(moduleUrl);
              await router.navigate(previousContext, { replace: true });
            },
            { moduleUrl: '/src/app/router/index.ts', previousContext },
          );
          await expect(page).toHaveURL(previousContext);
        }
        await page.evaluate(
          async ({ moduleUrl, target }) => {
            const { router } = await import(moduleUrl);
            await router.navigate(target);
          },
          { moduleUrl: '/src/app/router/index.ts', target },
        );
        const measures = [];
        let retained, relationships;
        if (kind === 'history-denied') {
          await expect(page.getByText('Không có quyền truy cập', { exact: true })).toBeVisible();
          await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toHaveCount(0);
          await expect(page.getByRole('group', { name: 'Transaction type' })).toHaveCount(0);
          await expect(page.getByText('+100', { exact: true })).toHaveCount(0);
          expect(failedReads).toBeGreaterThan(0);
          await expect(
            page.getByRole('heading', { level: 1, name: 'Transaction history', exact: true }),
          ).toBeVisible();
          await page.getByRole('button', { name: 'Quay lại', exact: true }).press('Enter');
          await expect(page).toHaveURL(previousContext);
        } else {
          const title =
            owner === 'history'
              ? 'Transaction history'
              : owner === 'disputes'
                ? 'Tranh chấp P2P'
                : 'Đánh giá P2P';
          await expect(
            page.getByRole('heading', { level: 1, name: title, exact: true }),
          ).toBeVisible();
          const initial =
            owner === 'history'
              ? page.getByText('+100', { exact: true })
              : owner === 'disputes'
                ? page.getByRole('button', { name: 'Open dispute UI-P2P-001' })
                : page.getByText('Received review fixture', { exact: true });
          await expect(initial).toBeVisible();
          await page.evaluate(async () => {
            await document.fonts.ready;
          });
          if (owner === 'reviews') {
            for (const tab of await page.getByRole('tab').all()) {
              await expect.poll(async () => (await paint(tab)).supported).toBe(true);
              const measured = await paint(tab);
              await writeFile(
                info.outputPath(`initial-${await tab.getAttribute('aria-selected')}-paint.json`),
                JSON.stringify(measured, null, 2),
              );
              expect(measured.ratio).toBeGreaterThanOrEqual(4.5);
              measures.push({ sampleKind: 'initial-tab', ...measured });
            }
          }
          if (owner === 'history')
            await page.getByRole('textbox', { name: 'Filter by asset', exact: true }).fill('btc');
          const selected =
            owner === 'history'
              ? page
                  .getByRole('group', { name: 'Transaction type' })
                  .getByRole('button', { name: 'Withdrawal', exact: true })
              : owner === 'disputes'
                ? page
                    .getByRole('group', { name: 'Lọc trạng thái tranh chấp' })
                    .getByRole('button', { name: 'Đã giải quyết', exact: true })
                : page.getByRole('tab', { name: 'Đã viết', exact: true });
          const node = await selected.elementHandle();
          if (kind === 'reviews-keyboard')
            await page.getByRole('tab', { name: 'Nhận được', exact: true }).press('ArrowRight');
          else await selected.press('Enter');
          try {
            if (owner === 'reviews') {
              for (let frame = 0; frame < 12; frame++) {
                await page.evaluate(
                  () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
                );
                const measured = await paint(selected);
                expect(measured.supported).toBe(true);
                expect(measured.ratio).toBeGreaterThanOrEqual(4.5);
                expect(measured.hits).toEqual([true, true, true]);
                measures.push({ sampleKind: 'tab-transition', frame, ...measured });
              }
            }
            if (kind.endsWith('pending'))
              await expect(page.locator('html')).toHaveAttribute('data-ui-list-waiting', 'true');
            if (kind.endsWith('error')) {
              const error = page.getByText(
                owner === 'history'
                  ? 'Có lỗi xảy ra'
                  : owner === 'disputes'
                    ? 'Không thể tải tranh chấp P2P'
                    : 'Không thể tải đánh giá P2P',
                { exact: true },
              );
              await expect(error).toBeVisible();
              await expect.poll(async () => (await paint(error)).supported).toBe(true);
              const measured = await paint(error);
              expect(measured.ratio).toBeGreaterThanOrEqual(4.5);
              expect(measured.hits).toEqual([true, true, true]);
              measures.push(measured);
              expect(failedReads).toBeGreaterThan(0);
            }
            retained = await node!.evaluate((e) => ({
              connected: e.isConnected,
              focused: e === document.activeElement,
            }));
            expect(retained).toEqual({ connected: true, focused: true });
            await expect(selected).toHaveAttribute(
              owner === 'reviews' ? 'aria-selected' : 'aria-pressed',
              'true',
            );
            await expect
              .poll(async () => {
                const p = await paint(selected);
                return p.supported && p.hits?.every(Boolean);
              })
              .toBe(true);
            const measured = await paint(selected);
            expect(measured.ratio).toBeGreaterThanOrEqual(4.5);
            expect(measured.height).toBeGreaterThanOrEqual(24);
            expect(measured.width).toBeGreaterThanOrEqual(24);
            measures.push(measured);
            if (owner === 'reviews') {
              relationships = await page.getByRole('tab').evaluateAll((tabs) =>
                tabs.map((tab) => {
                  const panel = document.getElementById(tab.getAttribute('aria-controls')!);
                  return {
                    triggerId: tab.id,
                    panelId: panel?.id,
                    labelledBy: panel?.getAttribute('aria-labelledby'),
                    hidden: panel?.hidden,
                    selected: tab.getAttribute('aria-selected') === 'true',
                  };
                }),
              );
              expect(new Set(relationships.map((r) => r.triggerId)).size).toBe(2);
              for (const r of relationships) {
                expect(r.triggerId).toBeTruthy();
                expect(r.panelId).toBeTruthy();
                expect(r.labelledBy).toBe(r.triggerId);
                expect(r.hidden).toBe(!r.selected);
              }
              await expect(
                page.getByRole('tablist', { name: 'Phạm vi đánh giá P2P', exact: true }),
              ).toBeVisible();
              await expect(
                page.getByRole('tabpanel', { name: 'Đã viết', exact: true }),
              ).toBeVisible();
            }
            if (
              (kind === 'disputes-error' && profile.name === 'phone' && theme === 'light') ||
              (kind === 'reviews-error' && profile.name === 'web' && theme === 'dark')
            )
              await page.screenshot({
                path: info.outputPath('list-query-error.png'),
                fullPage: true,
              });
          } finally {
            if (kind.endsWith('pending'))
              await page.evaluate(() => window.dispatchEvent(new Event('ui-list-release')));
          }
          if (kind.endsWith('error')) {
            const recovery =
              owner === 'history'
                ? page
                    .getByRole('group', { name: 'Transaction type' })
                    .getByRole('button', { name: 'All', exact: true })
                : owner === 'disputes'
                  ? page
                      .getByRole('group', { name: 'Lọc trạng thái tranh chấp' })
                      .getByRole('button', { name: 'Tất cả', exact: true })
                  : page.getByRole('tab', { name: 'Nhận được', exact: true });
            await recovery.press('Enter');
            await expect(initial).toBeVisible();
            await expect(recovery).toBeFocused();
          } else {
            await expect(
              owner === 'history'
                ? page.getByText('-100', { exact: true })
                : owner === 'disputes'
                  ? initial
                  : page.getByText('Given review fixture', { exact: true }),
            ).toBeVisible();
            await expect(selected).toBeFocused();
          }
          if (kind === 'reviews-keyboard') {
            await page.keyboard.press('Tab');
            await expect(
              page.getByRole('tabpanel', { name: 'Đã viết', exact: true }),
            ).toBeFocused();
            await page.keyboard.press('Shift+Tab');
            await expect(selected).toBeFocused();
            await page.keyboard.press('ArrowLeft');
            await expect(page.getByText('Received review fixture', { exact: true })).toBeVisible();
            await expect(page.getByRole('tab', { name: 'Nhận được', exact: true })).toBeFocused();
          }
          if (owner === 'history')
            await expect(
              page.getByRole('textbox', { name: 'Filter by asset', exact: true }),
            ).toHaveValue('btc');
        }
        expect(workerReads).toBeGreaterThan(0);
        expect(writes).toBe(0);
        await writeFile(
          info.outputPath('list-query-observation.json'),
          JSON.stringify(
            {
              target,
              kind,
              theme,
              profile,
              writes,
              workerReads,
              failedReads,
              retained,
              relationships,
              measures,
              scope:
                'Synthetic reader session and real application MSW. Only Phone/Web, light/dark and listed states; no server authorization/AT/UAT/full-route acceptance. Arrow automatic activation preserved.',
            },
            null,
            2,
          ),
        );
      });
