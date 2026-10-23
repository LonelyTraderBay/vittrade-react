import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
for (const theme of ['light', 'dark'])
  for (const mode of ['same', 'different'])
    test(`Giới hạn dữ liệu phiên ${mode} ${theme} @ui-mock`, async ({ page }, info) => {
      let writes = 0;
      page.on('request', (r) => {
        if (
          !['GET', 'HEAD', 'OPTIONS'].includes(r.method()) &&
          !new URL(r.url()).pathname.includes('/auth/')
        )
          writes++;
      });
      await page.clock.install({ time: new Date('2026-10-22T10:00:00Z') });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/w/auth/login');
      await expect(page.getByTestId('auth-email')).toBeVisible();
      const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text(),
        dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
      if (!dependencyUrl) throw Error('Missing actual MSW dependency');
      await page.evaluate(
        async ({ dependencyUrl, workerUrl, mode }) => {
          const { worker } = await import(workerUrl),
            { http, HttpResponse } = await import(dependencyUrl),
            state = { current: 'alpha', refreshed: false, refreshes: 0, reads: [] as string[] };
          Object.assign(window, { uiSessionScope: state });
          const session = () => ({
            user: {
              id: state.current,
              email: 'session-scope@vittrade.local',
              fullName: (state.refreshed ? 'Refreshed ' : 'Initial ') + state.current,
              roles: ['user'],
              permissions: ['market:read', 'wallet:read', 'support:read', 'support:write'],
              kycStatus: 'verified',
              accountStatus: 'active',
            },
            accessTokenExpiresAt: new Date(
              Date.now() + (state.refreshed ? 3600000 : 120000),
            ).toISOString(),
          });
          worker.use(
            http.post('*/auth/login', () =>
              HttpResponse.json({ status: 'authenticated', session: session() }),
            ),
            http.get('*/auth/session', () => HttpResponse.json(session())),
            http.post('*/auth/refresh', () => {
              state.current = mode === 'different' ? 'beta' : 'alpha';
              state.refreshed = true;
              state.refreshes++;
              return HttpResponse.json(session());
            }),
            http.get('*/support/tickets', () => {
              const id = state.current;
              state.reads.push(id);
              return HttpResponse.json({
                items: [
                  {
                    id: 'ticket-' + id,
                    subject: 'Private ticket ' + id,
                    description: 'Synthetic session isolation fixture',
                    category: 'other',
                    status: 'open',
                    priority: 'normal',
                    createdAt: '2026-10-22T00:00:00.000Z',
                    updatedAt: '2026-10-22T00:00:00.000Z',
                    messages: [],
                  },
                ],
              });
            }),
          );
        },
        { dependencyUrl, workerUrl: '/src/dev/mocks/browser.ts', mode },
      );
      await page.getByTestId('auth-email').fill('session-scope@vittrade.local');
      await page.getByTestId('auth-password').fill('Preview-123!');
      await page.getByTestId('auth-submit').click();
      await expect(page).toHaveURL('/w/home');
      if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
      await page.evaluate(async (moduleUrl) => {
        const { router } = await import(moduleUrl);
        await router.navigate('/w/support');
      }, '/src/app/router/index.ts');
      await expect(page).toHaveURL('/w/support');
      await expect(page.getByText('Private ticket alpha', { exact: true })).toBeVisible();
      const field = page.getByRole('textbox', { name: 'Tiêu đề ticket', exact: true });
      await field.fill('Draft alpha');
      await page
        .getByRole('textbox', { name: 'Nội dung ticket', exact: true })
        .fill('Private draft from alpha');
      const original = await field.elementHandle();
      if (!original) throw Error('No real field');
      await field.focus();
      await page.screenshot({ path: info.outputPath('session-before.png') });
      const refreshed = page.waitForResponse((r) =>
        new URL(r.url()).pathname.endsWith('/auth/refresh'),
      );
      await page.clock.fastForward(60000);
      const response = await refreshed;
      expect(response.status()).toBe(200);
      expect(response.fromServiceWorker()).toBe(true);
      const target = mode === 'different' ? 'beta' : 'alpha';
      await expect(page.getByText('Refreshed ' + target, { exact: true }).first()).toBeVisible();
      await expect(field).toBeVisible();
      if (mode === 'different')
        await expect(page.getByText('Private ticket beta', { exact: true })).toBeVisible();
      const fieldCount = await field.count(),
        data = {
          theme,
          mode,
          url: page.url(),
          userHeader: await page
            .getByText('Refreshed ' + target, { exact: true })
            .first()
            .innerText(),
          fieldCount,
          draft: fieldCount ? await field.inputValue() : null,
          originalConnected: await original.evaluate((e) => e.isConnected),
          focusRetained: await original.evaluate((e) => document.activeElement === e),
          alphaTickets: await page.getByText('Private ticket alpha', { exact: true }).count(),
          betaTickets: await page.getByText('Private ticket beta', { exact: true }).count(),
          state: await page.evaluate(
            () =>
              (
                window as unknown as {
                  uiSessionScope: {
                    current: string;
                    refreshed: boolean;
                    refreshes: number;
                    reads: string[];
                  };
                }
              ).uiSessionScope,
          ),
          businessWrites: writes,
        };
      await writeFile(info.outputPath('session-scope.json'), JSON.stringify(data, null, 2));
      console.log('C06_REAL_SESSION_SCOPE', JSON.stringify(data));
      await page.screenshot({ path: info.outputPath('session-after.png') });
      expect(writes).toBe(0);
      expect(data.state.refreshes).toBe(1);
      expect(fieldCount).toBe(1);
      if (mode === 'same') {
        expect(data.draft).toBe('Draft alpha');
        expect(data.originalConnected).toBe(true);
        expect(data.focusRetained).toBe(true);
        expect(data.alphaTickets).toBe(1);
      } else {
        expect(data.draft).toBe('');
        expect(data.originalConnected).toBe(false);
        expect(data.alphaTickets).toBe(0);
        await expect(page.getByText('Private ticket beta', { exact: true })).toBeVisible();
      }
    });
