import { describe, expect, it, vi } from 'vitest';
import { retireMockServiceWorker } from './retire-worker';

function registration(scriptURL: string, unregister = vi.fn(async () => true)) {
  const worker = { scriptURL } as ServiceWorker;
  return {
    active: worker,
    waiting: null,
    installing: null,
    unregister,
  } as unknown as ServiceWorkerRegistration;
}

function serviceWorkerWith(registrations: ServiceWorkerRegistration[]) {
  return { getRegistrations: vi.fn(async () => registrations) };
}

describe('retire development mock service worker', () => {
  it('leaves unrelated registrations in place', async () => {
    const unrelated = registration('http://localhost:5173/other-worker.js');
    const serviceWorker = serviceWorkerWith([unrelated]);

    await expect(retireMockServiceWorker(serviceWorker, 'http://localhost:5173')).resolves.toBe(
      false,
    );
    expect(unrelated.unregister).not.toHaveBeenCalled();
  });

  it('unregisters the exact same-origin MSW worker and signals for one reload', async () => {
    const mswWorker = registration('http://localhost:5173/mockServiceWorker.js');
    const otherOrigin = registration('http://localhost:5174/mockServiceWorker.js');
    const serviceWorker = serviceWorkerWith([mswWorker, otherOrigin]);

    await expect(retireMockServiceWorker(serviceWorker, 'http://localhost:5173')).resolves.toBe(
      true,
    );
    expect(mswWorker.unregister).toHaveBeenCalledOnce();
    expect(otherOrigin.unregister).not.toHaveBeenCalled();
  });

  it('fails startup cleanup when the matching registration cannot be removed', async () => {
    const blockedWorker = registration(
      'http://localhost:5173/mockServiceWorker.js',
      vi.fn(async () => false),
    );
    const serviceWorker = serviceWorkerWith([blockedWorker]);

    await expect(retireMockServiceWorker(serviceWorker, 'http://localhost:5173')).rejects.toThrow(
      'Could not unregister the development mock service worker',
    );
  });
});
