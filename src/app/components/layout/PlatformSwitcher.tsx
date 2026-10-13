import React, { useEffect, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

/**
 * ══════════════════════════════════════════════════════════
 *  PLATFORM SWITCHER — Auto-Detect by Viewport Width
 * ══════════════════════════════════════════════════════════
 *
 *  Automatically switches between 3 platform shells based on
 *  viewport width:
 *
 *    < 768px   → Phone  (/)
 *    768–1023  → Tablet (/t/)
 *    ≥ 1024    → Web    (/w/)
 *
 *  Shows a small floating indicator of the current platform.
 *  No manual selection needed — fully automatic.
 */

type Platform = 'phone' | 'tablet' | 'web';

const PLATFORM_CONFIG: Record<
  Platform,
  { prefix: string; icon: typeof Smartphone; label: string; color: string }
> = {
  phone: { prefix: '', icon: Smartphone, label: 'Phone', color: '#3B82F6' },
  tablet: { prefix: '/t', icon: Tablet, label: 'Tablet', color: '#8B5CF6' },
  web: { prefix: '/w', icon: Monitor, label: 'Web', color: '#10B981' },
};

function detectPlatform(width: number): Platform {
  if (width >= 1024) return 'web';
  if (width >= 768) return 'tablet';
  return 'phone';
}

function getCurrentPrefix(pathname: string): string {
  if (pathname.startsWith('/w/') || pathname === '/w') return '/w';
  if (pathname.startsWith('/t/') || pathname === '/t') return '/t';
  if (pathname.startsWith('/r/') || pathname === '/r') return '/r';
  return '';
}

function getRoutePath(pathname: string): string {
  return pathname.replace(/^\/(w|t)\//, '/').replace(/^\/(w|t)$/, '/home');
}

function isAuthenticationRoute(pathname: string): boolean {
  return /^\/(?:w\/|t\/|r\/)?auth(?:\/|$)/.test(pathname);
}

function keepsRouteShell(pathname: string): boolean {
  return (
    isAuthenticationRoute(pathname) ||
    pathname === '/onboarding' ||
    pathname.startsWith('/onboarding/') ||
    pathname === '/r' ||
    pathname.startsWith('/r/')
  );
}

function hasUnsubmittedFormChanges(): boolean {
  type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  return Array.from(document.querySelectorAll<FormControl>('input, textarea, select')).some(
    (control) => {
      // Preview selectors configure fixtures; they are not an unsubmitted product form.
      if (control.closest('[data-testid="dev-preview-controls"]')) return false;
      if (control instanceof HTMLInputElement) {
        if (['button', 'hidden', 'reset', 'submit'].includes(control.type)) return false;
        return ['checkbox', 'radio'].includes(control.type)
          ? control.checked !== control.defaultChecked
          : control.value !== control.defaultValue;
      }
      if (control instanceof HTMLTextAreaElement) return control.value !== control.defaultValue;
      return Array.from(control.options).some(
        (option) => option.selected !== option.defaultSelected,
      );
    },
  );
}

export function PlatformSwitcher({
  previewControlsVisible = false,
}: {
  previewControlsVisible?: boolean;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect current platform from route
  const currentPrefix = getCurrentPrefix(location.pathname);
  const currentPlatform: Platform =
    currentPrefix === '/w' ? 'web' : currentPrefix === '/t' ? 'tablet' : 'phone';

  useLayoutEffect(() => {
    if (keepsRouteShell(location.pathname)) return;
    const targetPrefix = PLATFORM_CONFIG[detectPlatform(window.innerWidth)].prefix;
    const curPrefix = getCurrentPrefix(location.pathname);
    if (targetPrefix !== curPrefix) {
      navigate(
        {
          pathname: targetPrefix + getRoutePath(location.pathname),
          search: location.search,
          hash: location.hash,
        },
        { replace: true },
      );
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    function handleResize() {
      if (keepsRouteShell(location.pathname)) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (hasUnsubmittedFormChanges()) return;
        const targetPlatform = detectPlatform(window.innerWidth);
        const targetPrefix = PLATFORM_CONFIG[targetPlatform].prefix;
        const curPrefix = getCurrentPrefix(location.pathname);

        // Only navigate if the target prefix differs from current
        if (targetPrefix !== curPrefix) {
          const routePath = getRoutePath(location.pathname);
          navigate(
            { pathname: targetPrefix + routePath, search: location.search, hash: location.hash },
            { replace: true },
          );
        }
      }, 250);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [location.pathname, location.search, location.hash, navigate]);

  const config = PLATFORM_CONFIG[currentPlatform];
  const Icon = config.icon;

  if (isAuthenticationRoute(location.pathname)) return null;

  return (
    <div
      className="fixed z-[9999] flex items-center gap-1.5 rounded-full px-2.5 pointer-events-none select-none"
      style={{
        bottom: currentPlatform === 'phone' ? 100 : previewControlsVisible ? 112 : 24,
        right: 16,
        height: 32,
        zIndex: previewControlsVisible ? 1200 : 9999,
        background: 'var(--tr-surface)',
        border: `1px solid ${config.color}30`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <Icon size={13} color={config.color} strokeWidth={2} />
      <span
        style={{ color: 'var(--tr-text-1)', fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}
      >
        {config.label}
      </span>
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: config.color, boxShadow: `0 0 6px ${config.color}80` }}
      />
    </div>
  );
}
