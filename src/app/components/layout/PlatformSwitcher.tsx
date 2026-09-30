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
  return pathname.replace(/^\/(w|t|r)\//, '/').replace(/^\/(w|t|r)$/, '/home');
}

function keepsRouteShell(pathname: string): boolean {
  return (
    /^\/(?:w\/|t\/|r\/)?auth(?:\/|$)/.test(pathname) ||
    pathname === '/onboarding' ||
    pathname.startsWith('/onboarding/') ||
    pathname === '/r' ||
    pathname.startsWith('/r/')
  );
}

function hasUnsubmittedFormChanges(): boolean {
  return Array.from(document.querySelectorAll('input, textarea, select')).some((control) => {
    if (control instanceof HTMLInputElement) {
      if (['button', 'hidden', 'reset', 'submit'].includes(control.type)) return false;
      return ['checkbox', 'radio'].includes(control.type)
        ? control.checked !== control.defaultChecked
        : control.value !== control.defaultValue;
    }
    if (control instanceof HTMLTextAreaElement) return control.value !== control.defaultValue;
    if (control instanceof HTMLSelectElement) {
      return Array.from(control.options).some(
        (option) => option.selected !== option.defaultSelected,
      );
    }
    return false;
  });
}

export function PlatformSwitcher() {
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
      navigate(targetPrefix + getRoutePath(location.pathname), { replace: true });
    }
  }, [location.pathname, navigate]);

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
          navigate(targetPrefix + routePath, { replace: true });
        }
      }, 250);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [location.pathname, navigate]);

  // Skip rendering on auth/onboarding routes
  if (location.pathname.startsWith('/auth') || location.pathname.startsWith('/onboarding')) {
    return null;
  }

  const config = PLATFORM_CONFIG[currentPlatform];
  const Icon = config.icon;

  return (
    <div
      className="fixed z-[9999] flex items-center gap-1.5 rounded-full px-2.5 pointer-events-none select-none"
      style={{
        bottom: currentPlatform === 'phone' ? 100 : 24,
        right: 16,
        height: 32,
        background: `${config.color}18`,
        border: `1px solid ${config.color}30`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <Icon size={13} color={config.color} strokeWidth={2} />
      <span style={{ color: config.color, fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>
        {config.label}
      </span>
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: config.color, boxShadow: `0 0 6px ${config.color}80` }}
      />
    </div>
  );
}
