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

void bootstrap();
