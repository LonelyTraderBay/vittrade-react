import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * ══════════════════════════════════════════════════════════════
 *  PageLayout — Enterprise Standard Page Wrapper
 * ══════════════════════════════════════════════════════════════
 *
 *  THE canonical layout wrapper for every page in the app.
 *  Enforces consistent structure that works correctly inside
 *  AppLayout's scroll container.
 *
 *  CONSTRAINTS (from Guidelines.md + codebase rules):
 *  ─────────────────────────────────────────────────────────
 *  ✓  flex flex-col + min-h-full — fills scroll container
 *  ✓  pb-8 (32px) bottom padding — content never hidden by BottomNav
 *  ✓  background: c.bg — semantic token, auto dark/light
 *  ✗  NEVER h-screen / h-full + overflow-y-auto
 *  ✗  NEVER calc(100vh - Xpx) or height: 100vh
 *  ✗  NEVER overflowY: auto inside AppLayout
 *
 *  VARIANTS:
 *  ─────────────────────────────────────────────────────────
 *  "default"   — Standard page with c.bg background + pb-8
 *  "surface"   — Uses c.surface background (settings, forms)
 *  "flush"     — No bottom padding (for pages with own bottom CTAs)
 *  "immersive" — No background override (chart pages, custom gradients)
 *
 *  USAGE:
 *  ─────────────────────────────────────────────────────────
 *  <PageLayout>
 *    <Header title="..." back />
 *    <PageContent>
 *      ...content...
 *    </PageContent>
 *  </PageLayout>
 *
 *  <PageLayout variant="flush">
 *    <Header title="..." back />
 *    <PageContent>...</PageContent>
 *    <StickyFooter>
 *      <CTAButton>Submit</CTAButton>
 *    </StickyFooter>
 *  </PageLayout>
 *
 *  <PageLayout variant="immersive">
 *    <Header transparent back />
 *    <CustomHeroGradient />
 *    <PageContent>...</PageContent>
 *  </PageLayout>
 */

type LayoutVariant = 'default' | 'surface' | 'flush' | 'immersive';

interface PageLayoutProps {
  /** Layout variant controlling background and bottom padding */
  variant?: LayoutVariant;
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles (merged after variant defaults) */
  style?: React.CSSProperties;
  /** Page content — typically Header + PageContent */
  children: React.ReactNode;
  /** HTML id for scroll-to / anchor targets */
  id?: string;
  /** Accessibility: page landmark label */
  'aria-label'?: string;
}

export function PageLayout({
  variant = 'default',
  className = '',
  style,
  children,
  id,
  'aria-label': ariaLabel,
}: PageLayoutProps) {
  const c = useThemeColors();

  /* ─── Variant styles ─── */
  const variantStyles: Record<LayoutVariant, React.CSSProperties> = {
    default: {
      background: c.bg,
      minHeight: '100%',
      paddingBottom: 32, // 8 × 4pt = safe pb-8
    },
    surface: {
      background: c.surface,
      minHeight: '100%',
      paddingBottom: 32,
    },
    flush: {
      background: c.bg,
      minHeight: '100%',
      paddingBottom: 0, // page handles own bottom (sticky CTA, etc.)
    },
    immersive: {
      minHeight: '100%',
      paddingBottom: 32,
      // No background — page provides its own (gradient, chart, etc.)
    },
  };

  return (
    <div
      id={id}
      className={`flex flex-col ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      role="main"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

/**
 * ══════════════════════════════════════════════════════════════
 *  StickyFooter — Bottom-pinned action bar for flush layouts
 * ══════════════════════════════════════════════════════════════
 *
 *  For pages that need a bottom CTA bar (Create Order, Checkout, etc.)
 *  Uses sticky positioning that respects the scroll container.
 *
 *  USAGE:
 *  <PageLayout variant="flush">
 *    <Header title="..." back />
 *    <PageContent grow>
 *      ...scrollable content...
 *    </PageContent>
 *    <StickyFooter>
 *      <CTAButton>Confirm</CTAButton>
 *    </StickyFooter>
 *  </PageLayout>
 */
interface StickyFooterProps {
  children: React.ReactNode;
  /** Show top border (default: true) */
  border?: boolean;
  /** Background uses surface or bg (default: 'surface') */
  bg?: 'surface' | 'bg';
  /** Additional className */
  className?: string;
}

export function StickyFooter({
  children,
  border = true,
  bg = 'surface',
  className = '',
}: StickyFooterProps) {
  const c = useThemeColors();
  return (
    <div
      className={`sticky bottom-0 z-10 px-5 py-4 ${className}`}
      style={{
        background: bg === 'surface' ? c.surface : c.bg,
        borderTop: border ? `1px solid ${c.divider}` : 'none',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        // Safe bottom for BottomNav clearance
        paddingBottom: 20,
      }}
    >
      {children}
    </div>
  );
}
