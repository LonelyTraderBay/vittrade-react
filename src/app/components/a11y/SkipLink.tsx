import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * ══════════════════════════════════════════════════════════
 *  SKIP LINK — WCAG 2.4.1 Bypass Blocks
 * ══════════════════════════════════════════════════════════
 *
 *  Allows keyboard users to skip repetitive navigation and
 *  jump directly to main content.
 *
 *  Requirements:
 *  - Hidden by default (sr-only)
 *  - Visible when focused
 *  - Fixed position at top of viewport
 *  - High z-index to appear above all content
 *  - Accessible styling (high contrast, large touch target)
 *
 *  Usage:
 *  1. Add <SkipLink /> as first child in AppLayout/ResponsiveShell
 *  2. Add id="main-content" to main content container
 */

export function SkipLink() {
  const c = useThemeColors();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only"
      style={{
        // Hidden by default
        position: 'absolute',
        left: -10000,
        top: 'auto',
        width: 1,
        height: 1,
        overflow: 'hidden',
        
        // Visible when focused
        ':focus': {
          position: 'fixed',
          top: 8,
          left: 8,
          zIndex: 9999,
          width: 'auto',
          height: 'auto',
          padding: '12px 20px',
          background: c.primary,
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 8,
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          outline: `3px solid ${c.ring}`,
          outlineOffset: 2,
        },
      }}
      onFocus={(e) => {
        // Inline style override for :focus pseudo-class
        e.currentTarget.style.position = 'fixed';
        e.currentTarget.style.top = '8px';
        e.currentTarget.style.left = '8px';
        e.currentTarget.style.zIndex = '9999';
        e.currentTarget.style.width = 'auto';
        e.currentTarget.style.height = 'auto';
        e.currentTarget.style.padding = '12px 20px';
        e.currentTarget.style.background = c.primary;
        e.currentTarget.style.color = '#FFFFFF';
        e.currentTarget.style.fontSize = '14px';
        e.currentTarget.style.fontWeight = '600';
        e.currentTarget.style.borderRadius = '8px';
        e.currentTarget.style.textDecoration = 'none';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
        e.currentTarget.style.outline = `3px solid ${c.ring}`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        // Reset to hidden state
        e.currentTarget.style.position = 'absolute';
        e.currentTarget.style.left = '-10000px';
        e.currentTarget.style.top = 'auto';
        e.currentTarget.style.width = '1px';
        e.currentTarget.style.height = '1px';
        e.currentTarget.style.overflow = 'hidden';
      }}
    >
      Bỏ qua đến nội dung chính
    </a>
  );
}
