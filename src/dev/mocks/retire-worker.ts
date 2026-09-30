type WorkerRegistrationSource = Pick<ServiceWorkerContainer, 'getRegistrations'>;

function registrationUsesMswWorker(
  registration: ServiceWorkerRegistration,
  origin: string,
): boolean {
  const expectedUrl = new URL('/mockServiceWorker.js', origin);
  return [registration.active, registration.waiting, registration.installing]
    .filter((worker): worker is ServiceWorker => worker !== null)
    .some((worker) => {
      const scriptUrl = new URL(worker.scriptURL);
      return scriptUrl.origin === expectedUrl.origin && scriptUrl.pathname === expectedUrl.pathname;
    });
}

/** Unregister only this app's MSW worker; return true when a page reload is needed. */
export async function retireMockServiceWorker(
  serviceWorker: WorkerRegistrationSource | undefined,
  origin: string,
): Promise<boolean> {
  if (!serviceWorker) return false;

  const registrations = await serviceWorker.getRegistrations();
  const mockRegistrations = registrations.filter((registration) =>
    registrationUsesMswWorker(registration, origin),
  );
  if (mockRegistrations.length === 0) return false;

  const unregistered = await Promise.all(
    mockRegistrations.map((registration) => registration.unregister()),
  );
  if (unregistered.some((result) => !result)) {
    throw new Error('Could not unregister the development mock service worker');
  }

  return true;
}
