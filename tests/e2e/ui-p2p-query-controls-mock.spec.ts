import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { paint } from './helpers/semantic-control-paint';
import { measureButtonPaint } from './helpers/button-paint';
import { ButtonTextColors } from '../../src/shared/theme/button';

const sourceUrls = {
  worker: '/src/dev/mocks/browser.ts',
  router: '/src/app/router/index.ts',
  query: '/src/shared/api/query-client.ts',
};

for (const theme of ['light', 'dark'])
  for (const profile of [
    { name: 'phone', prefix: '', width: 390 },
    { name: 'web', prefix: '/w', width: 1440 },
  ])
    for (const kind of [
      'express-asset',
      'express-payments',
      'express-confirm',
      'marketplace-asset',
      'marketplace-fiat',
      'marketplace-overview',
      'marketplace-quick-overview',
    ])
      test(`P2P query controls ${kind} ${profile.name} ${theme} @ui-mock`, async ({
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
            ['/p2p/ads', '/p2p/payment-methods', '/p2p/overview'].some((p) =>
              new URL(r.url()).pathname.endsWith(p),
            )
          ) {
            expect(r.fromServiceWorker()).toBe(true);
            workerReads++;
            if (r.status() === 503) failedReads++;
          }
        });
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/w/auth/login');
        await page.getByTestId('auth-email').fill('developer@vittrade.local');
        await page.getByTestId('auth-password').fill('Preview-123!');
        await page.getByTestId('auth-submit').click();
        await expect(page).toHaveURL('/w/home');
        if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
        await page.setViewportSize({ width: profile.width, height: 900 });
        const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
        const dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
        if (!dependencyUrl) throw Error('Missing actual browser MSW dependency');
        const express = kind.startsWith('express');
        const target = profile.prefix + (express ? '/p2p/express' : '/p2p');
        await page.evaluate(
          async ({ dependencyUrl, kind, target, sourceUrls }) => {
            const { worker } = await import(sourceUrls.worker);
            const { http, HttpResponse } = await import(dependencyUrl);
            const state = { fail: false, recover: false, released: false };
            Object.assign(window, { uiP2pQuery: state });
            const ad = (asset: string, currency: string, type: string) => ({
              id: `ui-${asset}-${currency}-${type}`,
              type,
              asset,
              merchant: `UI ${asset} ${type === 'sell' ? 'Seller' : 'Buyer'}`,
              merchantId: 'ui-query-merchant',
              merchantLevel: 2,
              merchantVerified: true,
              merchantJoinDate: '2025-01-01',
              completionRate: 98,
              completedOrders: 120,
              totalVolume30d: 50000,
              price: asset === 'BTC' ? 1600000000 : 25000,
              currency,
              priceType: 'fixed',
              minLimit: 100000,
              maxLimit: 20000000,
              available: 2000,
              paymentMethods: ['VCB'],
              avgResponseTime: '2m',
              isOnline: true,
              createdAt: '2026-10-21T00:00:00.000Z',
              status: 'active',
            });
            worker.use(
              http.get('*/p2p/ads', async ({ request }: { request: Request }) => {
                const query = new URL(request.url).searchParams;
                const asset = query.get('asset') ?? 'USDT',
                  currency = query.get('currency') ?? 'VND';
                const selected = kind.endsWith('asset')
                  ? asset === 'BTC'
                  : kind.endsWith('fiat') && currency === 'USD';
                if (selected && !state.recover) {
                  if (!state.released) {
                    document.documentElement.dataset.uiP2pWaiting = 'true';
                    await new Promise<void>((resolve) =>
                      window.addEventListener(
                        'ui-p2p-release',
                        () => {
                          state.released = true;
                          resolve();
                        },
                        { once: true },
                      ),
                    );
                    delete document.documentElement.dataset.uiP2pWaiting;
                  }
                  return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
                }
                return HttpResponse.json({
                  items: [ad(asset, currency, 'sell'), ad(asset, currency, 'buy')],
                });
              }),
              http.get('*/p2p/ads/:adId', ({ params }: { params: Record<string, string> }) => {
                const [, asset, currency, type] = params.adId.split('-');
                return HttpResponse.json(ad(asset, currency, type));
              }),
              http.get('*/p2p/payment-methods', () =>
                state.fail && !state.recover && kind.endsWith('payments')
                  ? HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 })
                  : HttpResponse.json({
                      items: [
                        {
                          id: 'ui-payment',
                          type: 'bank',
                          bankName: 'VCB',
                          accountNumber: 'UI-TEST',
                          accountName: 'UI Test Fixture',
                          isDefault: true,
                          isVerified: true,
                          createdAt: '2026-10-21T00:00:00.000Z',
                        },
                      ],
                    }),
              ),
            );
            const { router } = await import(sourceUrls.router);
            await router.navigate(target);
          },
          { dependencyUrl, kind, target, sourceUrls },
        );
        await expect(page.getByText('UI USDT Seller', { exact: true })).toBeVisible();
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        const amount = express
          ? page.getByLabel('Số tiền VND', { exact: true })
          : page.getByPlaceholder(/^Nhập số tiền (VND|USD)\.\.\.$/);
        if (!express) await page.getByRole('button', { name: 'Bật bộ lọc', exact: true }).click();
        await amount.fill('1000000');
        if (express) await page.getByRole('button', { name: 'VCB', exact: true }).click();
        const observations: unknown[] = [],
          paints: unknown[] = [];
        if (kind === 'express-confirm') {
          for (const tradeType of ['buy', 'sell']) {
            if (tradeType === 'sell')
              await page.getByRole('button', { name: 'BÁN NHANH', exact: true }).click();
            const action = page.getByRole('button', {
              name: `${tradeType === 'buy' ? 'Mua' : 'Bán'} nhanh USDT`,
              exact: true,
            });
            await action.scrollIntoViewIfNeeded();
            await expect(action).toBeEnabled();
            // The raster oracle requires an opaque, settled route surface. This is
            // a nominal CTA paint check, not a claim about entrance-animation frames.
            await expect
              .poll(() =>
                action.evaluate((element) => {
                  for (let n: Element | null = element; n; n = n.parentElement) {
                    const c = getComputedStyle(n);
                    if (c.opacity !== '1' || c.mixBlendMode !== 'normal' || c.filter !== 'none')
                      return false;
                  }
                  return true;
                }),
              )
              .toBe(true);
            const expectedColor =
              'rgb(' +
              ButtonTextColors[tradeType === 'buy' ? 'success' : 'danger']
                .match(/[0-9a-f]{2}/gi)!
                .map((v) => parseInt(v, 16))
                .join(', ') +
              ')';
            const frames = [];
            for (let frame = 0; frame < 12; frame++) {
              await page.evaluate(
                () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
              );
              const sample = await action.evaluate((e) => {
                const c = getComputedStyle(e);
                return {
                  color: c.color,
                  backgroundImage: c.backgroundImage,
                  transitionProperty: c.transitionProperty,
                };
              });
              expect(sample.color).toBe(expectedColor);
              expect(sample.transitionProperty.split(',').map((p) => p.trim())).toEqual([
                'box-shadow',
                'transform',
              ]);
              frames.push(sample);
            }
            observations.push({ tradeType, frames });
            const buttonPaint = await measureButtonPaint(
              page,
              action,
              info,
              `express-${tradeType}`,
            );
            expect(buttonPaint.minimumRatio).toBeGreaterThanOrEqual(4.5);
            expect(buttonPaint.height).toBe(52);
            paints.push(buttonPaint);
            await action.click();
            await expect(page).toHaveURL(
              new RegExp(
                `${profile.prefix}/p2p/express/confirm\\?type=${tradeType}&asset=USDT&fiat=1000000&adId=ui-USDT-VND-${tradeType === 'buy' ? 'sell' : 'buy'}&payment=VCB$`,
              ),
            );
            await expect(page.getByText('Xác nhận Express', { exact: true })).toBeVisible();
            observations.push({ tradeType, url: page.url(), submitted: false });
            if (tradeType === 'buy') {
              await page.evaluate(async (sourceUrls) => {
                const { router } = await import(sourceUrls.router);
                await router.navigate(-1);
              }, sourceUrls);
              await expect(page.getByRole('combobox', { name: 'Tài sản' })).toBeVisible();
              await amount.fill('1000000');
              await page.getByRole('button', { name: 'VCB', exact: true }).click();
            }
          }
        } else {
          const control = express
            ? page.getByRole('combobox', { name: 'Tài sản', exact: true })
            : page.getByRole('button', {
                name: kind.endsWith('fiat') ? 'USD' : 'BTC',
                exact: true,
              });
          await control.focus();
          const handle = (await control.elementHandle())!;
          const amountHandle = (await amount.elementHandle())!;
          const modalCase = kind.endsWith('overview');
          if (modalCase) {
            // Focus return must reveal its target without relying on scroll anchoring after reflow.
            await page.evaluate(() => {
              document.documentElement.style.overflowAnchor = 'none';
              document.body.style.overflowAnchor = 'none';
              document.querySelectorAll<HTMLElement>('[data-pull-scroll]').forEach((element) => {
                element.style.overflowAnchor = 'none';
              });
            });
            const opener = kind.includes('quick')
              ? page.getByRole('button', { name: 'Tuỳ chọn P2P', exact: true })
              : page.getByRole('button', {
                  name: 'Tuỳ chọn offer của UI USDT Seller',
                  exact: true,
                });
            await opener.press('Enter');
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect
              .poll(() =>
                page.getByRole('dialog').evaluate((e) => e.contains(document.activeElement)),
              )
              .toBe(true);
          }
          const region = page.getByRole('region', {
            name: express ? 'Offer Express P2P' : 'Kết quả offer P2P',
            exact: true,
          });
          if (kind.endsWith('asset') || kind.endsWith('fiat')) {
            try {
              if (express) await control.selectOption('BTC');
              else await control.press('Enter');
              await expect(page.locator('html')).toHaveAttribute('data-ui-p2p-waiting', 'true');
              const pending = await handle.evaluate((e) => ({
                connected: e.isConnected,
                focused: e === document.activeElement,
              }));
              expect(pending).toEqual({ connected: true, focused: true });
              await expect(region).toHaveAttribute('aria-busy', 'true');
              await expect(page.getByText('UI USDT Seller', { exact: true })).toHaveCount(0);
              if (express)
                await expect(
                  page.getByRole('button', { name: 'Mua nhanh BTC', exact: true }),
                ).toBeDisabled();
              else
                await expect(page.getByText('Không tìm thấy offer', { exact: true })).toHaveCount(
                  0,
                );
              observations.push({ pending });
            } finally {
              await page.evaluate(() => window.dispatchEvent(new Event('ui-p2p-release')));
            }
          } else {
            await page.evaluate(
              async ({ dependencyUrl, kind, sourceUrls }) => {
                const state = (
                  window as unknown as { uiP2pQuery: { fail: boolean; recover: boolean } }
                ).uiP2pQuery;
                state.fail = true;
                const { queryClient } = await import(sourceUrls.query);
                if (kind.endsWith('overview')) {
                  const { worker } = await import(sourceUrls.worker);
                  const { http, HttpResponse } = await import(dependencyUrl);
                  const data = queryClient.getQueryData(['p2p', 'overview']);
                  worker.use(
                    http.get('*/p2p/overview', () =>
                      state.recover
                        ? HttpResponse.json(data)
                        : HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 }),
                    ),
                  );
                }
                void queryClient.refetchQueries({
                  queryKey: ['p2p', kind.endsWith('payments') ? 'payment-methods' : 'overview'],
                });
              },
              { dependencyUrl, kind, sourceUrls },
            );
          }
          await expect(
            page.getByRole('alert').filter({
              hasText: express ? 'Không thể tải dữ liệu Express P2P' : 'Không thể tải P2P',
            }),
          ).toBeVisible();
          const error = await handle.evaluate((e) => ({
            connected: e.isConnected,
            focused: e === document.activeElement,
          }));
          if (modalCase) {
            await expect(page.getByRole('dialog')).toHaveCount(0);
            const actualFocus = await page.evaluate(() => ({
              tag: document.activeElement?.tagName,
              text: document.activeElement?.textContent?.trim().slice(0, 100),
            }));
            await writeFile(
              info.outputPath('modal-query-error-focus.json'),
              JSON.stringify(
                {
                  kind,
                  actualFocus,
                  expected: 'selected USDT asset control',
                  scope:
                    'Real query error while modal open, scroll anchoring disabled to expose offscreen focus after reflow; no writes.',
                },
                null,
                2,
              ),
            );
            await expect(page.getByRole('button', { name: 'USDT', exact: true })).toBeFocused();
            const returnControl = page.getByRole('button', { name: 'USDT', exact: true });
            // Check before scrollIntoView below: focus may otherwise be restored off screen.
            await expect(returnControl).toBeInViewport({ ratio: 1 });
            const returnPaint = await paint(returnControl);
            expect(returnPaint.supported).toBe(true);
            expect(returnPaint.ratio).toBeGreaterThanOrEqual(4.5);
            expect(returnPaint.focusVisible).toBe(true);
            expect(returnPaint.outlineStyle).not.toBe('none');
            expect(returnPaint.hits).toEqual([true, true, true]);
            paints.push(returnPaint);
          }
          expect(error).toEqual({ connected: true, focused: !modalCase });
          expect(await amountHandle.evaluate((e) => e.isConnected)).toBe(true);
          await expect(amount).toHaveValue(express ? '1000000' : '1,000,000');
          await expect(page.getByText('UI USDT Seller', { exact: true })).toHaveCount(0);
          if (express)
            await expect(page.getByRole('button', { name: /Mua nhanh (BTC|USDT)/ })).toBeDisabled();
          if (kind.endsWith('overview')) {
            await expect(page.getByText('Volume 24h', { exact: true })).toHaveCount(0);
            await expect(
              page.getByRole('button', { name: 'Tuỳ chọn P2P', exact: true }),
            ).toBeDisabled();
            await expect(
              page.getByRole('button', { name: 'Lịch sử lệnh', exact: true }),
            ).toBeVisible();
          }
          await control.scrollIntoViewIfNeeded();
          const controlPaint = await paint(control);
          expect(controlPaint.supported).toBe(true);
          expect(controlPaint.ratio).toBeGreaterThanOrEqual(4.5);
          paints.push(controlPaint);
          await page.screenshot({ path: info.outputPath('p2p-query-error.png') });
          await page.evaluate(() => {
            (window as unknown as { uiP2pQuery: { recover: boolean } }).uiP2pQuery.recover = true;
          });
          await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
          await expect(
            page.getByText(`UI ${kind.endsWith('asset') ? 'BTC' : 'USDT'} Seller`, { exact: true }),
          ).toBeVisible();
          expect(await handle.evaluate((e) => e.isConnected)).toBe(true);
          await expect(amount).toHaveValue(express ? '1000000' : '1,000,000');
          if (express)
            await expect(page.getByRole('button', { name: 'VCB', exact: true })).toHaveAttribute(
              'aria-pressed',
              'true',
            );
          else
            await expect(control).toHaveAttribute(
              'aria-pressed',
              kind.endsWith('asset') || kind.endsWith('fiat') ? 'true' : 'false',
            );
          if (modalCase) await expect(page.getByRole('dialog')).toHaveCount(0);
          observations.push({ error, recovered: true, logicalModalFocusReturn: modalCase });
          expect(failedReads).toBeGreaterThan(0);
        }
        if (!express) {
          await expect(
            page.getByText('Mất kết nối. Đang hiển thị dữ liệu gần nhất.', { exact: true }),
          ).toHaveCount(0);
          await expect(
            page.getByText('Cập nhật lần cuối: 2 phút trước', { exact: true }),
          ).toHaveCount(0);
        }
        if (kind === 'marketplace-fiat') {
          await page.context().setOffline(true);
          try {
            await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
            await page.evaluate(async (sourceUrls) => {
              const { queryClient } = await import(sourceUrls.query);
              void queryClient.refetchQueries({
                queryKey: ['p2p', 'ads', { asset: 'USDT', currency: 'USD' }],
                exact: true,
              });
            }, sourceUrls);
            await expect(
              page.getByText('Đang chờ kết nối để cập nhật dữ liệu P2P.', { exact: true }),
            ).toBeVisible();
            await expect(page.getByText('UI USDT Seller', { exact: true })).toBeVisible();
            const beforePaused = workerReads;
            const asset = page.getByRole('button', { name: 'ETH', exact: true });
            await asset.press('Enter');
            await expect(
              page.getByRole('status').filter({ hasText: 'Đang chờ kết nối để tải dữ liệu P2P…' }),
            ).toBeVisible();
            await expect(asset).toBeFocused();
            await expect(page.getByText('UI USDT Seller', { exact: true })).toHaveCount(0);
            await expect(amount).toHaveValue('1,000,000');
            expect(workerReads).toBe(beforePaused);
          } finally {
            await page.context().setOffline(false);
          }
          await expect(page.getByText('UI ETH Seller', { exact: true })).toBeVisible();
          await expect(page.getByRole('button', { name: 'ETH', exact: true })).toBeFocused();
          observations.push({
            nativeOffline: true,
            cachedAndNewQueryPaused: true,
            pausedWorkerReads: 0,
            resumedCurrentAsset: 'ETH',
          });
        }
        expect(writes).toBe(0);
        expect(workerReads).toBeGreaterThan(0);
        const result = {
          target,
          kind,
          theme,
          profile,
          writes,
          failedReads,
          workerReads,
          observations,
          paints,
          scope:
            'Current real route/providers and native controls; held/current/cached error and explicit retry through shipped MSW. Synthetic read-only offers. Confirmation navigation only, no order submission/backend/UAT/AT or human visual approval.',
        };
        await writeFile(
          info.outputPath('p2p-query-controls.json'),
          JSON.stringify(result, null, 2),
        );
        console.log('C06_P2P_QUERY_CONTROLS', JSON.stringify(result));
      });
