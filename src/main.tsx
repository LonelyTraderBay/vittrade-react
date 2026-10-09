import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { assertRuntimeEnv, env, isDevelopmentBuild } from '@/shared/config/env';
import './styles/index.css';

async function bootstrap() {
  assertRuntimeEnv();

  // The browser mock server is development-only. It is not imported by the
  // production module graph, so mock handlers cannot become a production API.
  if (isDevelopmentBuild && env.dataSource === 'mock') {
    const { worker, onUnhandledRequest } = await import('./dev/mocks/browser');
    await worker.start({ onUnhandledRequest });
  }

  if (isDevelopmentBuild && env.dataSource === 'api') {
    const { retireMockServiceWorker } = await import('./dev/mocks/retire-worker');
    const serviceWorker = 'serviceWorker' in navigator ? navigator.serviceWorker : undefined;
    const retired = await retireMockServiceWorker(serviceWorker, window.location.origin);
    if (retired) {
      window.location.reload();
      return;
    }
  }

  createRoot(document.getElementById('root')!).render(<App />);
}

function renderStartupFailure(): void {
  const root = document.getElementById('root');
  if (!root) return;

  console.error('VitTrade startup checks failed; verify deployment configuration.');
  document.title = 'VitTrade unavailable';
  createRoot(root).render(
    <main
      role="alert"
      aria-labelledby="startup-error-title"
      className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-12"
    >
      <h1 id="startup-error-title" className="text-2xl font-semibold">
        VitTrade could not start
      </h1>
      <p>
        A required startup check failed. Contact your deployment administrator. No configuration
        values are shown here.
      </p>
    </main>,
  );
}

void bootstrap().catch(renderStartupFailure);
