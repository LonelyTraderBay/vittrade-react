import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FullConfig } from '@playwright/test';

const mock = vi.hoisted(() => ({
  setup: vi.fn(),
  teardown: vi.fn(),
  launch: vi.fn(),
  newPage: vi.fn(),
  close: vi.fn(),
  goto: vi.fn(),
  ready: vi.fn(),
  on: vi.fn(),
}));
vi.mock('./auth-mock-e2e-global-setup', () => ({ default: mock.setup }));
vi.mock('@playwright/test', () => ({ chromium: { launch: mock.launch } }));
import setupUiMockE2E from './ui-mock-e2e-global-setup';

const config = {
  workers: 2,
  projects: [{ use: { baseURL: 'http://127.0.0.1:4182' } }],
} as FullConfig;

beforeEach(() => {
  vi.resetAllMocks();
  mock.setup.mockResolvedValue(mock.teardown);
  mock.teardown.mockResolvedValue(undefined);
  mock.launch.mockResolvedValue({ newPage: mock.newPage, close: mock.close });
  mock.newPage.mockResolvedValue({
    goto: mock.goto,
    getByTestId: () => ({ waitFor: mock.ready }),
    on: mock.on,
  });
  mock.close.mockResolvedValue(undefined);
  mock.goto.mockResolvedValue(undefined);
  mock.ready.mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('UI mock concurrent startup lifecycle', () => {
  it('leaves the single-worker setup unchanged', async () => {
    const teardown = await setupUiMockE2E({ ...config, workers: 1 });
    expect(mock.launch).not.toHaveBeenCalled();
    expect(mock.teardown).not.toHaveBeenCalled();
    await teardown();
    expect(mock.teardown).toHaveBeenCalledOnce();
  });

  it('waits for the real login field and disposes the readiness browser before tests', async () => {
    const teardown = await setupUiMockE2E(config);
    expect(mock.goto).toHaveBeenCalledWith('http://127.0.0.1:4182/w/auth/login', {
      timeout: 30_000,
    });
    expect(mock.ready).toHaveBeenCalledWith({ state: 'visible', timeout: 5_000 });
    expect(mock.close).toHaveBeenCalledOnce();
    expect(mock.teardown).not.toHaveBeenCalled();
    await teardown();
    expect(mock.teardown).toHaveBeenCalledOnce();
  });

  it('cleans the server if launching a browser fails', async () => {
    const error = new Error('Browser unavailable');
    mock.launch.mockRejectedValueOnce(error);
    await expect(setupUiMockE2E(config)).rejects.toBe(error);
    expect(mock.teardown).toHaveBeenCalledOnce();
    expect(mock.close).not.toHaveBeenCalled();
  });

  it('rejects a missing baseURL and closes the server before launching a browser', async () => {
    await expect(setupUiMockE2E({ ...config, projects: [] })).rejects.toThrow('local baseURL');
    expect(mock.launch).not.toHaveBeenCalled();
    expect(mock.teardown).toHaveBeenCalledOnce();
  });

  it.each(['goto', 'ready'] as const)('cleans both resources after %s fails', async (stage) => {
    const error = new Error('Not ready');
    mock[stage].mockRejectedValueOnce(error);
    await expect(setupUiMockE2E(config)).rejects.toBe(error);
    expect(mock.close).toHaveBeenCalledOnce();
    expect(mock.teardown).toHaveBeenCalledOnce();
  });

  it('rejects an unexpected application mutation during the readiness visit', async () => {
    mock.ready.mockImplementationOnce(async () => {
      const listener = mock.on.mock.calls.find(([name]) => name === 'request')![1];
      listener({ method: () => 'POST', url: () => 'http://127.0.0.1:4182/wallet/transfers' });
    });
    await expect(setupUiMockE2E(config)).rejects.toThrow('must not perform application mutations');
    expect(mock.close).toHaveBeenCalledOnce();
    expect(mock.teardown).toHaveBeenCalledOnce();
  });

  it('preserves the startup error and both cleanup errors', async () => {
    const startup = new Error('Page unavailable');
    const browser = new Error('Browser close failed');
    const server = new Error('Server close failed');
    mock.goto.mockRejectedValueOnce(startup);
    mock.close.mockRejectedValueOnce(browser);
    mock.teardown.mockRejectedValueOnce(server);
    const failure = await setupUiMockE2E(config).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AggregateError);
    const outer = failure as AggregateError;
    expect(outer.errors[0]).toBeInstanceOf(AggregateError);
    expect((outer.errors[0] as AggregateError).errors).toEqual([startup, browser]);
    expect(outer.errors[1]).toBe(server);
    expect(mock.close).toHaveBeenCalledOnce();
    expect(mock.teardown).toHaveBeenCalledOnce();
  });

  it('cleans the server if the successful readiness browser cannot close', async () => {
    const error = new Error('Browser close failed');
    mock.close.mockRejectedValueOnce(error);
    await expect(setupUiMockE2E(config)).rejects.toBe(error);
    expect(mock.close).toHaveBeenCalledOnce();
    expect(mock.teardown).toHaveBeenCalledOnce();
  });
});
