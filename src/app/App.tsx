import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';

/**
 * VitTrade — Enterprise Crypto Trading App
 * 80+ routes | TrCard design system | Light/Dark theme
 * Build: 2026-03-13 (Enterprise Font Size Pass)
 */
export default function App() {
  // Prevent unhandled rejections from crashing the app
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[App] Unhandled error:', event.error);
      event.preventDefault();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('[App] Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <React.Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--foreground)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(59,130,246,0.2)',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ fontSize: 14, opacity: 0.6 }}>Đang tải...</p>
        </div>
      </div>
    }>
      <RouterProvider router={router} />
    </React.Suspense>
  );
}