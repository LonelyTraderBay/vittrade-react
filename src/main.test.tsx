import type { ReactElement, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const bootstrapState = vi.hoisted(() => ({
  dataSource: 'mock',
  isDevelopmentBuild: true,
  order: [] as string[],
  workerOptions: undefined as unknown,
  renderedElement: undefined as unknown,
  retireWorker: vi.fn(async () => false),
  startWorker: vi.fn(async (options: unknown) => {
    bootstrapState.order.push('worker.start');
    bootstrapState.workerOptions = options;
  }),
  render: vi.fn((element: unknown) => {
    bootstrapState.renderedElement = element;
    bootstrapState.order.push('render');
  }),
  assertRuntimeEnv: vi.fn(() => {
    bootstrapState.order.push('validate');
  }),
}));

vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: bootstrapState.render }),
}));
vi.mock('./app/App.tsx', () => ({ default: () => null }));
vi.mock('./styles/index.css', () => ({}));
vi.mock('@/shared/config/env', () => ({
  get env() {
    return { dataSource: bootstrapState.dataSource, apiBaseUrl: '' };
  },
  get isDevelopmentBuild() {
    return bootstrapState.isDevelopmentBuild;
  },
  assertRuntimeEnv: bootstrapState.assertRuntimeEnv,
}));
vi.mock('./dev/mocks/browser', () => {
  bootstrapState.order.push('worker.import');
  return { worker: { start: bootstrapState.startWorker }, onUnhandledRequest: vi.fn() };
});
vi.mock('./dev/mocks/retire-worker', () => {
  bootstrapState.order.push('worker.cleanup.import');
  return {
    retireMockServiceWorker: async () => {
      bootstrapState.order.push('worker.cleanup');
      return bootstrapState.retireWorker();
    },
  };
});

describe('application bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    bootstrapState.dataSource = 'mock';
    bootstrapState.isDevelopmentBuild = true;
    bootstrapState.order.length = 0;
    bootstrapState.workerOptions = undefined;
    bootstrapState.renderedElement = undefined;
    bootstrapState.retireWorker.mockReset();
    bootstrapState.retireWorker.mockResolvedValue(false);
    bootstrapState.startWorker.mockClear();
    bootstrapState.render.mockClear();
    bootstrapState.assertRuntimeEnv.mockReset();
    bootstrapState.assertRuntimeEnv.mockImplementation(() => {
      bootstrapState.order.push('validate');
    });
    document.body.innerHTML = '<div id="root"></div>';
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('validates then starts MSW before mounting the development mock preview', async () => {
    bootstrapState.dataSource = 'mock';
    bootstrapState.isDevelopmentBuild = true;

    await import('./main');
    await vi.waitFor(() => expect(bootstrapState.order).toContain('render'));

    expect(bootstrapState.order).toEqual(['validate', 'worker.import', 'worker.start', 'render']);
    expect(bootstrapState.workerOptions).toEqual({ onUnhandledRequest: expect.any(Function) });
  });

  it.each([
    [
      'development API mode',
      true,
      ['validate', 'worker.cleanup.import', 'worker.cleanup', 'render'],
    ],
    ['non-development API mode', false, ['validate', 'render']],
  ])('does not start MSW in %s', async (_label, isDevelopmentBuild, expectedOrder) => {
    bootstrapState.dataSource = 'api';
    bootstrapState.isDevelopmentBuild = isDevelopmentBuild;

    await import('./main');
    await vi.waitFor(() => expect(bootstrapState.order).toContain('render'));

    expect(bootstrapState.order).toEqual(expectedOrder);
    expect(bootstrapState.startWorker).not.toHaveBeenCalled();
  });

  it('reloads once before mounting when API mode retires a stale mock registration', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { origin: 'http://localhost:5173', reload });
    bootstrapState.dataSource = 'api';
    bootstrapState.retireWorker.mockResolvedValue(true);

    await import('./main');
    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce());

    expect(bootstrapState.order).toEqual(['validate', 'worker.cleanup']);
    expect(bootstrapState.render).not.toHaveBeenCalled();
    expect(bootstrapState.startWorker).not.toHaveBeenCalled();
  });

  it('renders a controlled accessible message without exposing a thrown configuration error', async () => {
    const logStartupFailure = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    bootstrapState.assertRuntimeEnv.mockImplementation(() => {
      throw new Error('private-runtime-value');
    });

    await import('./main');
    await vi.waitFor(() => expect(bootstrapState.render).toHaveBeenCalledOnce());

    const failure = bootstrapState.renderedElement as ReactElement<{
      role?: string;
      children?: ReactNode;
    }>;
    const children = failure.props.children as ReactElement<{ children?: ReactNode }>[];
    expect(failure.type).toBe('main');
    expect(failure.props.role).toBe('alert');
    expect(children[0]?.props.children).toBe('VitTrade could not start');
    expect(children[1]?.props.children).toContain('Contact your deployment administrator');
    expect(children[1]?.props.children).not.toContain('private-runtime-value');
    expect(logStartupFailure).toHaveBeenCalledWith(
      'VitTrade startup checks failed; verify deployment configuration.',
    );
  });
});
