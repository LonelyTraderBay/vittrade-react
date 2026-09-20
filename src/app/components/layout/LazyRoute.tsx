import React, { Suspense, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

/* ═══════════════════════════════════════════════════════════
   LazyRoute — Resilient lazy-loading for Figma Make sandbox
   ═══════════════════════════════════════════════════════════
   - Retries failed dynamic imports up to 3 times
   - Adds page-reload fallback on persistent failure
   - ErrorBoundary catches render-time crashes
   ═══════════════════════════════════════════════════════════ */

// ─── Retry wrapper for dynamic imports ───
function retryImport<T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    importFn()
      .then(resolve)
      .catch((err: unknown) => {
        if (retries <= 0) {
          reject(err);
          return;
        }
        setTimeout(() => {
          retryImport(importFn, retries - 1, delay * 1.5)
            .then(resolve)
            .catch(reject);
        }, delay);
      });
  });
}

// ─── Loading fallback ───
function RouteLoadingFallback() {
  const c = useThemeColors();

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: c.bg }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              border: `3px solid ${c.surface2}`,
              borderTopColor: c.primary,
            }}
          />
        </div>
        <p style={{ color: c.text2, fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );
}

// ─── Error fallback ───
function RouteErrorFallback({ onRetry }: { onRetry: () => void }) {
  const c = useThemeColors();

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: c.bg }}
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)' }}
        >
          <span style={{ fontSize: 28 }}>!</span>
        </div>
        <p style={{ color: c.text1, fontSize: 16, fontWeight: 600 }}>
          Không tải được trang
        </p>
        <p style={{ color: c.text3, fontSize: 13, lineHeight: 1.5 }}>
          Lỗi kết nối hoặc module chưa sẵn sàng. Vui lòng thử lại.
        </p>
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl"
          style={{
            background: c.primary,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

// ─── Error Boundary ───
interface EBProps {
  children: ReactNode;
  fallback: ReactNode;
}
interface EBState {
  hasError: boolean;
}

class LazyErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LazyRoute] Render error:', error, info);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ─── Main component ───
interface LazyRouteProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}

export function LazyRoute({ component: Comp }: LazyRouteProps) {
  const [retryKey, setRetryKey] = React.useState(0);

  return (
    <LazyErrorBoundary
      key={retryKey}
      fallback={<RouteErrorFallback onRetry={() => setRetryKey(k => k + 1)} />}
    >
      <Suspense fallback={<RouteLoadingFallback />}>
        <Comp />
      </Suspense>
    </LazyErrorBoundary>
  );
}

// ─── Helper to wrap lazy imports with retry ───
export function lazyRoute(
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
): React.ComponentType<any> {
  const LazyComponent = React.lazy(() => retryImport(importFn, 3, 800));
  return () => <LazyRoute component={LazyComponent} />;
}
