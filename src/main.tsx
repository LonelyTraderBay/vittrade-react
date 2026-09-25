import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { isDevelopmentBuild } from './app/config/env';
import './styles/index.css';

async function bootstrap() {
  // The browser mock server is development-only. It is not imported by the
  // production module graph, so mock handlers cannot become a production API.
  if (isDevelopmentBuild) {
    const { worker } = await import('./dev/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  createRoot(document.getElementById('root')!).render(<App />);
}

void bootstrap();
