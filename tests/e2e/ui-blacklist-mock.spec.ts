import { resizeAuthenticatedHome } from './helpers/resize-home';
import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { paint } from './helpers/semantic-control-paint';

for (const theme of ['light', 'dark'])
  for (const profile of [
    { name: 'phone', prefix: '', width: 390, height: 844 },
    { name: 'web', prefix: '/w', width: 1440, height: 900 },
    { name: 'phone-short', prefix: '', width: 568, height: 320 },
    { name: 'web-short', prefix: '/w', width: 1440, height: 400 },
  ])
    for (const kind of profile.name.endsWith('short')
      ? ['cancel']
      : ['query', 'retry', 'cancel', 'read-error', 'readonly'])
      test(`Blacklist ${kind} ${profile.name} ${theme} @ui-mock`, async ({ page }, info) => {
        const keys: string[] = [];
        let writes = 0;
        let workerDeletes = 0;
        let queryErrors = 0;
        page.on('request', (r) => {
          if (
            !['GET', 'HEAD', 'OPTIONS'].includes(r.method()) &&
            !new URL(r.url()).pathname.includes('/auth/')
          )
            writes++;
          if (r.method() === 'DELETE') keys.push(r.headers()['idempotency-key']);
        });
        page.on('response', (r) => {
          if (r.request().method() === 'DELETE') {
            expect(r.fromServiceWorker()).toBe(true);
            workerDeletes++;
          }
          if (new URL(r.url()).pathname.endsWith('/p2p/blacklist') && r.status() === 503) {
            expect(r.fromServiceWorker()).toBe(true);
            queryErrors++;
          }
        });
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/w/auth/login');
        await expect(page.getByTestId('auth-email')).toBeVisible();
        const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
        const dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
        expect(dependencyUrl).toBeTruthy();
        if (!dependencyUrl) throw new Error('MSW browser dependency URL is missing');
        await page.evaluate(
          async ({ dependencyUrl, workerUrl, kind }) => {
            const { worker } = await import(workerUrl);
            const { http, HttpResponse } = await import(dependencyUrl);
            const session = {
              user: {
                id: 'ui-blacklist-user',
                email: 'blacklist@vittrade.local',
                fullName: 'Blacklist Test',
                roles: ['user'],
                permissions: kind === 'readonly' ? ['p2p:read'] : ['p2p:read', 'p2p:write'],
                kycStatus: 'verified',
                accountStatus: 'active',
              },
              accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
            };
            let attempts = 0;
            let removed = false;
            worker.use(
              http.post('*/auth/login', async ({ request }: { request: Request }) => {
                const body = await request.json();
                return body.email === session.user.email && body.password === 'Preview-123!'
                  ? HttpResponse.json({ status: 'authenticated', session })
                  : HttpResponse.json({ code: 'INVALID_CREDENTIALS' }, { status: 401 });
              }),
              http.get('*/auth/session', () => HttpResponse.json(session)),
              http.post('*/auth/refresh', () => HttpResponse.json(session)),
              http.get('*/p2p/blacklist', ({ request }: { request: Request }) => {
                const search = new URL(request.url).searchParams.get('search');
                return search === 'neo' || (kind === 'read-error' && removed)
                  ? HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 })
                  : HttpResponse.json({
                      items: removed
                        ? []
                        : [
                            {
                              id: 'ui-entry',
                              userId: 'ui-counterparty',
                              username: 'Test Merchant',
                              reason: 'scam',
                              reasonText: 'Test fixture only',
                              blockedAt: '2026-10-21T00:00:00.000Z',
                              tradesBefore: 42,
                              completionRate: 98,
                              isVerified: true,
                            },
                          ],
                      total: removed ? 0 : 1,
                    });
              }),
              http.delete('*/p2p/blacklist/:id', async () => {
                attempts++;
                if (kind === 'retry' && attempts === 1) {
                  document.documentElement.dataset.uiBlacklistWaiting = 'true';
                  await new Promise<void>((resolve) =>
                    window.addEventListener('ui-blacklist-release', () => resolve(), {
                      once: true,
                    }),
                  );
                  delete document.documentElement.dataset.uiBlacklistWaiting;
                  return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
                }
                removed = true;
                return new HttpResponse(null, { status: 204 });
              }),
            );
          },
          { dependencyUrl, workerUrl: '/src/dev/mocks/browser.ts', kind },
        );
        await page.getByTestId('auth-email').fill('blacklist@vittrade.local');
        await page.getByTestId('auth-password').fill('Preview-123!');
        await page.getByTestId('auth-submit').click();
        await expect(page).toHaveURL('/w/home');
        if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
        await resizeAuthenticatedHome(page, { width: profile.width, height: profile.height });
        const target = `${profile.prefix}/p2p/blacklist`;
        await page.evaluate(
          async ({ moduleUrl, target }) => {
            const { router } = await import(moduleUrl);
            await router.navigate(target);
          },
          { moduleUrl: '/src/app/router/index.ts', target },
        );
        const remove = page.getByRole('button', {
          name: 'Remove Test Merchant from P2P blacklist',
        });
        await expect(remove).toBeVisible();
        const measures = [];
        let cancelTheme;
        if (kind === 'query') {
          const search = page.getByRole('textbox', { name: 'Tìm người dùng đã chặn', exact: true });
          await search.fill('neo');
          const node = await search.elementHandle();
          await expect(
            page.getByText('Không thể tải danh sách chặn', { exact: true }),
          ).toBeVisible();
          expect(await node!.evaluate((e) => e.isConnected && e === document.activeElement)).toBe(
            true,
          );
          await expect(search).toHaveValue('neo');
          await search.fill('');
          await expect(remove).toBeEnabled();
          await expect(search).toBeFocused();
          expect(queryErrors).toBeGreaterThan(0);
        } else if (kind === 'readonly') {
          await expect(remove).toBeDisabled();
          await expect(
            page.getByRole('button', { name: 'Thêm người dùng vào danh sách chặn' }),
          ).toBeDisabled();
          await expect(page.getByRole('dialog')).toHaveCount(0);
        } else {
          await remove.press('Enter');
          const dialog = page.getByRole('dialog', { name: 'Bỏ chặn người dùng?', exact: true });
          await expect(dialog).toBeVisible();
          await expect
            .poll(() => dialog.evaluate((e) => e.contains(document.activeElement)))
            .toBe(true);
          const cancel = dialog.getByRole('button', { name: 'Huỷ', exact: true });
          const confirm = dialog.getByRole('button', { name: 'Bỏ chặn', exact: true });
          await confirm.focus();
          await confirm.scrollIntoViewIfNeeded();
          await expect
            .poll(() =>
              confirm.evaluate((e) => {
                const r = e.getBoundingClientRect();
                return [0.1, 0.5, 0.9].every((f) => {
                  const hit = document.elementFromPoint(r.x + r.width * f, r.y + r.height / 2);
                  return hit === e || Boolean(hit && e.contains(hit));
                });
              }),
            )
            .toBe(true);
          const size = await confirm.boundingBox();
          expect(size!.height).toBeGreaterThanOrEqual(52);
          expect(size!.width).toBeGreaterThanOrEqual(24);
          if (kind === 'cancel') {
            await cancel.press('Enter');
            await expect(dialog).toHaveCount(0);
            await expect(remove).toBeFocused();
          } else {
            await confirm.press('Enter');
            if (kind === 'retry') {
              await expect(page.locator('html')).toHaveAttribute(
                'data-ui-blacklist-waiting',
                'true',
              );
              await expect(dialog.getByRole('button', { name: 'Đang xử lý…' })).toBeDisabled();
              await expect(cancel).toBeDisabled();
              await page.keyboard.press('Enter');
              await page.keyboard.press('Escape');
              expect(keys).toHaveLength(1);
              await expect(dialog).toBeVisible();
              await expect
                .poll(() => dialog.evaluate((e) => e.contains(document.activeElement)))
                .toBe(true);
              expect(
                await page
                  .getByRole('region', {
                    name: 'Danh sách người dùng đã chặn',
                    includeHidden: true,
                  })
                  .evaluate((e) => Boolean(e.closest('[inert], [aria-hidden="true"]'))),
              ).toBe(true);
              await page
                .getByRole('textbox', { name: 'Tìm người dùng đã chặn', includeHidden: true })
                .evaluate((e) => (e as HTMLElement).focus());
              await expect
                .poll(() => dialog.evaluate((e) => e.contains(document.activeElement)))
                .toBe(true);
              await page.locator('[data-bottom-sheet-overlay]').click({ position: { x: 2, y: 2 } });
              await expect(dialog).toBeVisible();
              expect(keys).toHaveLength(1);
              await page.evaluate(() => window.dispatchEvent(new Event('ui-blacklist-release')));
              const error = dialog.getByRole('alert');
              await expect(error).toContainText('Không thể bỏ chặn');
              await expect(confirm).toBeEnabled();
              // Check paint after the modal motion has settled, without a timer.
              await expect.poll(async () => (await paint(error)).hits?.every(Boolean)).toBe(true);
              const measured = await paint(error);
              expect(measured.supported).toBe(true);
              expect(measured.ratio).toBeGreaterThanOrEqual(4.5);
              measures.push(measured);
              await expect
                .poll(() =>
                  cancel.evaluate((e) =>
                    e
                      .getAnimations({ subtree: true })
                      .every((a) => a.playState === 'finished' || a.playState === 'idle'),
                  ),
                )
                .toBe(true);
              const cancelPaint = await paint(cancel);
              // The strict resolver rejects the existing ripple pseudo paint.
              // Verify the settled semantic mapping without claiming contrast.
              expect(cancelPaint.supported).toBe(false);
              expect(cancelPaint.reason).toBe('Unsupported pseudo paint');
              cancelTheme = await cancel.evaluate((e) => {
                const ctx = document.createElement('canvas').getContext('2d')!;
                const normalize = (color: string) => {
                  if (!CSS.supports('color', color)) throw new Error('Unresolved theme color');
                  ctx.fillStyle = color;
                  return ctx.fillStyle;
                };
                const s = getComputedStyle(e),
                  tokens = getComputedStyle(document.documentElement);
                return {
                  foregroundMatches:
                    normalize(s.color) === normalize(tokens.getPropertyValue('--tr-text-1').trim()),
                  backgroundMatches:
                    normalize(s.backgroundColor) ===
                    normalize(tokens.getPropertyValue('--tr-surface-2').trim()),
                  inactiveRipple: getComputedStyle(e, '::after').opacity === '0',
                };
              });
              expect(cancelTheme).toEqual({
                foregroundMatches: true,
                backgroundMatches: true,
                inactiveRipple: true,
              });
              await page.screenshot({
                path: info.outputPath('blacklist-error.png'),
                fullPage: true,
              });
              await cancel.press('Enter');
              await expect(dialog).toHaveCount(0);
              await expect(remove).toBeFocused();
              await remove.press('Enter');
              await expect(dialog).toBeVisible();
              await expect(dialog.getByRole('alert')).toHaveCount(0);
              await confirm.press('Enter');
            }
            await expect(dialog).toHaveCount(0);
            const workspace = page.getByRole('region', {
              name: 'Danh sách người dùng đã chặn',
              exact: true,
            });
            await expect(workspace).toBeFocused();
            const success = page.getByRole('status').filter({ hasText: 'Đã bỏ chặn người dùng.' });
            await expect(success).toBeVisible();
            await expect.poll(async () => (await paint(success)).hits?.every(Boolean)).toBe(true);
            const measured = await paint(success);
            expect(measured.supported).toBe(true);
            expect(measured.ratio).toBeGreaterThanOrEqual(4.5);
            measures.push(measured);
            if (kind === 'read-error') {
              await expect(
                page.getByText('Không thể tải danh sách chặn', { exact: true }),
              ).toBeVisible();
              expect(queryErrors).toBeGreaterThan(0);
            }
            expect(workerDeletes).toBe(kind === 'retry' ? 2 : 1);
            expect(keys.every(Boolean)).toBe(true);
            if (kind === 'retry') expect(new Set(keys).size).toBe(1);
          }
        }
        expect(writes).toBe(kind === 'retry' ? 2 : kind === 'read-error' ? 1 : 0);
        await writeFile(
          info.outputPath('blacklist-observation.json'),
          JSON.stringify(
            {
              target,
              theme,
              profile,
              kind,
              writes,
              workerDeletes,
              queryErrors,
              sameRetryKey: kind === 'retry' && new Set(keys).size === 1,
              measures,
              cancelTheme,
              scope:
                'Synthetic session and MSW only; original DELETE handler bypassed. Plain text contrast only; CTA gradient is not measured by this resolver.',
            },
            null,
            2,
          ),
        );
      });
