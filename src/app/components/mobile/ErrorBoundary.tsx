import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI nho gon cho tung section (thay vi full-page) */
  compact?: boolean;
  /** Section name cho error reporting */
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Enterprise Fintech — Error Boundary
 * Bat React render errors, hien thi fallback UI thay vi crash toan app
 * 2 modes: full-page (default) va compact (cho sections/widgets)
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`[ErrorBoundary${this.props.section ? ` — ${this.props.section}` : ''}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    // With memory router, we can't use window.location — just reset state
    // and let the parent re-render. Navigation handled by retry.
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { compact, section } = this.props;
    const { error, showDetails, errorInfo } = this.state;

    // ─── Compact mode: inline error card ───
    if (compact) {
      return (
        <div
          className="rounded-2xl p-4 flex flex-col items-center gap-3 mx-5 my-2"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} color="#EF4444" />
            <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 600 }}>
              {section ? `Lỗi tải ${section}` : 'Có lỗi xảy ra'}
            </span>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <RefreshCw size={12} />
            Thử lại
          </button>
        </div>
      );
    }

    // ─── Full-page error ───
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-8 py-16 gap-6">
        {/* Icon */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            boxShadow: '0 8px 32px rgba(239,68,68,0.1)',
          }}
        >
          <AlertTriangle size={44} color="#EF4444" strokeWidth={1.5} />
        </div>

        {/* Text */}
        <div className="text-center">
          <p style={{ color: 'var(--foreground)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Oops! Có lỗi xảy ra
          </p>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.6 }}>
            {section ? `Phần "${section}" gặp sự cố. ` : ''}
            Vui lòng thử lại hoặc quay về trang chủ.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={this.handleRetry}
            className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
            }}
          >
            <RefreshCw size={16} />
            Thử lại
          </button>
          <button
            onClick={this.handleGoHome}
            className="h-12 px-5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            <Home size={16} />
          </button>
        </div>

        {/* Error details toggle */}
        <button
          onClick={() => this.setState({ showDetails: !showDetails })}
          className="flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Bug size={12} />
          {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết lỗi'}
        </button>

        {showDetails && error && (
          <div
            className="w-full rounded-xl p-3 overflow-auto max-h-40"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
          >
            <p style={{ color: '#EF4444', fontSize: 12, fontFamily: 'monospace', fontWeight: 600, marginBottom: 4 }}>
              {error.name}: {error.message}
            </p>
            {errorInfo?.componentStack && (
              <pre style={{ color: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}>
                {errorInfo.componentStack.slice(0, 500)}
              </pre>
            )}
          </div>
        )}
      </div>
    );
  }
}