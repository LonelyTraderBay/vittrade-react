import { chromium, type FullConfig } from '@playwright/test';
import setupAuthMockE2E from './auth-mock-e2e-global-setup';

async function cleanupAfterFailure(error: unknown, cleanup: () => Promise<void>): Promise<never> {
  try {
    await cleanup();
  } catch (cleanupError) {
    throw new AggregateError([error, cleanupError], 'UI mock startup and cleanup failed', {
      cause: cleanupError,
    });
  }
  throw error;
}

/** Prepare the cold Vite graph once before concurrent, isolated test contexts start. */
export default async function setupUiMockE2E(config: FullConfig): Promise<() => Promise<void>> {
  const teardown = await setupAuthMockE2E();
  if (config.workers < 2) return teardown;

  try {
    const baseURL = config.projects[0]?.use.baseURL;
    if (!baseURL) throw new Error('UI mock readiness requires the configured local baseURL');
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      let writes = 0;
      page.on('request', (request) => {
        if (
          !['GET', 'HEAD', 'OPTIONS'].includes(request.method()) &&
          !new URL(request.url()).pathname.includes('/auth/')
        )
          writes++;
      });
      await page.goto(new URL('/w/auth/login', baseURL).href, { timeout: 30_000 });
      await page.getByTestId('auth-email').waitFor({ state: 'visible', timeout: 5_000 });
      if (writes) throw new Error('UI mock readiness must not perform application mutations');
      process.stdout.write(
        `C06_UI_SERVER_READY ${JSON.stringify({ workers: config.workers, writes })}\n`,
      );
    } catch (error) {
      return await cleanupAfterFailure(error, () => browser.close());
    }
    // No cookies, MSW state or page is reused by the actual tests.
    await browser.close();
    return teardown;
  } catch (error) {
    return cleanupAfterFailure(error, teardown);
  }
}
