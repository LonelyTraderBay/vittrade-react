import { expect, test, type Page } from '@playwright/test';
import { resizeAuthenticatedHome } from './helpers/resize-home';

const profiles = [
  { name: 'phone', width: 390, height: 844, prefix: '' },
  { name: 'tablet', width: 768, height: 900, prefix: '/t' },
  { name: 'responsive', width: 1024, height: 900, prefix: '/r' },
  { name: 'web', width: 1440, height: 900, prefix: '/w' },
] as const;

const supportTicket = {
  id: 'c0613-ticket',
  subject: 'C06.13 support fixture',
  category: 'other',
  status: 'open',
  priority: 'normal',
  description: 'Synthetic browser test data.',
  createdAt: '2026-10-24T00:00:00.000Z',
  updatedAt: '2026-10-24T00:00:00.000Z',
  messages: [],
};

const helpResponse = {
  categories: [{ id: 'account', name: 'Tài khoản', icon: '👤', count: 1 }],
  articles: [
    {
      id: 'c0613-help',
      category: 'account',
      categoryIcon: '👤',
      title: 'C06.13 help fixture',
      summary: 'Synthetic browser test data.',
      views: 20,
    },
  ],
};

type ReadMode = 'normal' | 'initial-error' | 'refetch-error';

async function installSupportSession(page: Page, permissions: string[], readMode: ReadMode) {
  const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
  const dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
  if (!dependencyUrl) throw new Error('MSW browser dependency URL is missing');

  await page.evaluate(
    async ({ dependencyUrl, workerUrl, permissions, readMode, supportTicket, helpResponse }) => {
      const { worker } = await import(workerUrl);
      const { http, HttpResponse } = await import(dependencyUrl);
      const state = { ticketReads: 0, helpReads: 0, ticketWrites: 0 };
      Object.assign(window, { c0613SupportState: state });
      const session = {
        user: {
          id: 'c0613-support-user',
          email: 'c0613-support@vittrade.local',
          fullName: 'C06.13 Support Test',
          roles: ['user'],
          permissions,
          kycStatus: 'verified',
          accountStatus: 'active',
        },
        accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      worker.use(
        http.post('*/auth/login', async ({ request }: { request: Request }) => {
          const body = (await request.json()) as { email?: string; password?: string };
          return body.email === session.user.email && body.password === 'Preview-123!'
            ? HttpResponse.json({ status: 'authenticated', session })
            : HttpResponse.json({ code: 'INVALID_CREDENTIALS' }, { status: 401 });
        }),
        http.get('*/auth/session', () => HttpResponse.json(session)),
        http.post('*/auth/refresh', () => HttpResponse.json(session)),
        http.get('*/support/tickets', () => {
          state.ticketReads += 1;
          if (
            readMode === 'initial-error' ||
            (readMode === 'refetch-error' && state.ticketReads > 1)
          )
            return HttpResponse.error();
          return HttpResponse.json({ items: [supportTicket] });
        }),
        http.get('*/support/help', () => {
          state.helpReads += 1;
          if (readMode === 'initial-error' || (readMode === 'refetch-error' && state.helpReads > 1))
            return HttpResponse.error();
          return HttpResponse.json(helpResponse);
        }),
        http.post('*/support/tickets', () => {
          state.ticketWrites += 1;
          return HttpResponse.json(supportTicket, { status: 201 });
        }),
      );
    },
    {
      dependencyUrl,
      workerUrl: '/src/dev/mocks/browser.ts',
      permissions,
      readMode,
      supportTicket,
      helpResponse,
    },
  );
}

async function loginAndOpenSupportPage(
  page: Page,
  profile: (typeof profiles)[number],
  permissions: string[],
  readMode: ReadMode,
  pageName: 'support' | 'help',
) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/w/auth/login');
  await expect(page.getByTestId('auth-email')).toBeVisible();
  await installSupportSession(page, permissions, readMode);
  await page.getByTestId('auth-email').fill('c0613-support@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await resizeAuthenticatedHome(page, { width: profile.width, height: profile.height });

  const route = `${profile.prefix}/${pageName === 'help' ? 'support/help' : 'support'}`;
  await page.evaluate(async (target) => {
    const { router } = await import('/src/app/router/index.ts');
    await router.navigate(target);
  }, route);
  await expect(page).toHaveURL(route);
}

async function readCounts(page: Page) {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          c0613SupportState: { ticketReads: number; helpReads: number; ticketWrites: number };
        }
      ).c0613SupportState,
  );
}

for (const profile of profiles)
  for (const pageName of ['support', 'help'] as const)
    test(`Support/Help retains controls after refetch error ${pageName} ${profile.name} @ui-mock`, async ({
      page,
    }) => {
      await loginAndOpenSupportPage(
        page,
        profile,
        ['support:read', 'support:write'],
        'refetch-error',
        pageName,
      );

      if (pageName === 'support') {
        const subject = page.getByRole('textbox', { name: 'Tiêu đề ticket', exact: true });
        const description = page.getByRole('textbox', { name: 'Nội dung ticket', exact: true });
        await expect(page.getByText(supportTicket.subject, { exact: true })).toBeVisible();
        await subject.fill('Draft remains after refresh failure');
        await description.fill('Keep this message while the list is unavailable.');
        await description.focus();
        await page.evaluate(async () => {
          const { queryClient } = await import('/src/shared/api/query-client.ts');
          await queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
        });
        await expect(
          page.getByText(
            'Không thể cập nhật danh sách ticket; dữ liệu đang hiển thị có thể đã cũ.',
            { exact: true },
          ),
        ).toBeVisible();
        expect(
          await description.evaluate((element) =>
            (element as HTMLTextAreaElement).matches(':focus'),
          ),
        ).toBe(true);
        await expect(subject).toHaveValue('Draft remains after refresh failure');
        await expect(description).toHaveValue('Keep this message while the list is unavailable.');
        await expect(page.getByText(supportTicket.subject, { exact: true })).toBeVisible();
      } else {
        const search = page.getByRole('textbox', { name: 'Tìm kiếm trợ giúp', exact: true });
        await expect(page.getByText(helpResponse.articles[0].title, { exact: true })).toBeVisible();
        await search.fill('C06.13');
        await search.focus();
        await page.evaluate(async () => {
          const { queryClient } = await import('/src/shared/api/query-client.ts');
          await queryClient.invalidateQueries({ queryKey: ['support', 'help'] });
        });
        await expect(
          page.getByText('Dữ liệu trợ giúp đang hiển thị có thể đã cũ vì không thể cập nhật.', {
            exact: true,
          }),
        ).toBeVisible();
        expect(await search.evaluate((element) => element.matches(':focus'))).toBe(true);
        await expect(search).toHaveValue('C06.13');
        await expect(page.getByText(helpResponse.articles[0].title, { exact: true })).toBeVisible();
      }

      const counts = await readCounts(page);
      expect(counts.ticketReads + counts.helpReads).toBeGreaterThan(1);
      expect(counts.ticketWrites).toBe(0);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

for (const profile of profiles)
  for (const scenario of ['initial-error', 'reader', 'writer'] as const)
    test(`Support keeps the contract for ${scenario} ${profile.name} @ui-mock`, async ({
      page,
    }) => {
      const permissions =
        scenario === 'reader'
          ? ['support:read']
          : scenario === 'writer'
            ? ['support:write']
            : ['support:read', 'support:write'];
      await loginAndOpenSupportPage(
        page,
        profile,
        permissions,
        scenario === 'initial-error' ? 'initial-error' : 'normal',
        'support',
      );

      if (scenario === 'initial-error') {
        await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { level: 1, name: 'Hỗ trợ' })).toBeVisible();
        await expect(page.getByLabel('Tiêu đề ticket')).toBeVisible();
        await expect(
          page.getByText('Bạn chưa có yêu cầu hỗ trợ nào.', { exact: true }),
        ).toHaveCount(0);
      } else if (scenario === 'reader') {
        await expect(page.getByText(supportTicket.subject, { exact: true })).toBeVisible();
        await expect(page.getByLabel('Tiêu đề ticket')).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Gửi ticket' })).toBeDisabled();
      } else {
        await expect(
          page.getByText('Support read permission is required to view ticket history.', {
            exact: true,
          }),
        ).toBeVisible();
        const subject = page.getByLabel('Tiêu đề ticket');
        await expect(subject).toBeEnabled();
        await subject.fill('Writer only fixture');
        await page.getByLabel('Nội dung ticket').fill('No read request is required to write.');
        await page.getByRole('button', { name: 'Gửi ticket' }).click();
        await expect(subject).toHaveValue('');
      }

      const counts = await readCounts(page);
      expect(counts.ticketWrites).toBe(scenario === 'writer' ? 1 : 0);
      if (scenario === 'writer') expect(counts.ticketReads).toBe(0);
      else expect(counts.ticketReads).toBeGreaterThan(0);
      await expect(page.getByRole('heading', { level: 1, name: 'Hỗ trợ' })).toBeVisible();
    });
