import { createServer, type ViteDevServer } from 'vite';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const mockE2EPort = 4182;
const mockEnvironment = {
  VITE_DATA_SOURCE: 'mock',
  // Existing diagnostic scenarios opt in; the defaults profile explicitly opts out.
  VITE_ENABLE_DEVTOOLS: process.env.VITE_ENABLE_DEVTOOLS ?? 'true',
  VITE_API_BASE_URL: '',
  VITE_WS_URL: '',
} as const;

export default async function setupAuthMockE2E(): Promise<() => Promise<void>> {
  const previousEnvironment: Record<string, string | undefined> = {};
  for (const key of Object.keys(mockEnvironment)) {
    previousEnvironment[key] = process.env[key];
  }
  Object.assign(process.env, mockEnvironment);

  let vite: ViteDevServer | undefined;
  try {
    vite = await createServer({
      configFile: resolve(projectRoot, 'vite.config.ts'),
      root: projectRoot,
      clearScreen: false,
      server: { host: '127.0.0.1', port: mockE2EPort, strictPort: true },
    });
    await vite.listen();
    // Listening does not finish the cold dependency scan; do not spend test time on it.
    await vite.environments.client.depsOptimizer?.scanProcessing;
  } catch (error) {
    if (vite) await vite.close();
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    throw error;
  }

  return async () => {
    try {
      await vite?.close();
    } finally {
      for (const [key, value] of Object.entries(previousEnvironment)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  };
}
