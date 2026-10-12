import { createServer, type ViteDevServer } from 'vite';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const apiE2EPort = 4181;
const apiEnvironment = {
  VITE_DATA_SOURCE: 'api',
  VITE_API_BASE_URL: 'https://e2e.test',
  VITE_WS_URL: 'wss://e2e.test',
} as const;

export default async function setupAuthApiE2E(): Promise<() => Promise<void>> {
  const previousEnvironment: Record<string, string | undefined> = {};
  for (const key of Object.keys(apiEnvironment)) {
    previousEnvironment[key] = process.env[key];
  }
  Object.assign(process.env, apiEnvironment);

  let vite: ViteDevServer | undefined;
  try {
    vite = await createServer({
      configFile: resolve(projectRoot, 'vite.config.ts'),
      root: projectRoot,
      clearScreen: false,
      server: { host: '127.0.0.1', port: apiE2EPort, strictPort: true },
    });
    await vite.listen();
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
