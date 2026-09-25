import React, { useCallback } from 'react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useHaptic } from '@/shared/hooks/useHaptic';

/**
 * ══════════════════════════════════════════════════════════════
 *  TabBar — Enterprise Standard In-Page Tab Navigation
 * ══════════════════════════════════════════════════════════════
 *
 *  PERFORMANCE MANDATE:
 *  ─────────────────────────────────────────────────────────────
 *  ✓  Zero motion/framer-motion dependency
 *  ✓  Pure CSS transitions for indicator (scaleX + opacity)
 *  ✓  No layoutId, no AnimatePresence
 *  ✓  No useEffect, no DOM measurement
 *  ✓  Haptic feedback via useHaptic (native-feel)
 *
 *  VARIANTS:
 *  ─────────────────────────────────────────────────────────────
 *  "underline"  — Bottom line indicator (default, for content tabs)
 *  "pill"       — Pill background highlight (for filter/mode switching)
 *  "segment"    — iOS segmented control style (for binary/ternary toggles)
 *
 *  ACCESSIBILITY:
 *  ─────────────────────────────────────────────────────────────
 *  - role="tablist" on container
 *  - role="tab" on each button
 *  - aria-selected on active tab
 *  - Keyboard: ArrowLeft/Right to navigate, Enter/Space to select
 *
 *  USAGE:
 *  ─────────────────────────────────────────────────────────────
 *  const [tab, setTab] = useState('FAQ');
 *
 *  <TabBar
 *    tabs={['Hướng dẫn', 'An toàn', 'FAQ', 'Video']}
 *    active={tab}
 *    onChange={setTab}
 *  />
 *
 *  <TabBar
 *    variant="pill"
 *    tabs={['Tất cả', 'Mua', 'Bán']}
 *    active={filter}
 *    onChange={setFilter}
 *  />
 *
 *  <TabBar
 *    variant="segment"
 *    tabs={['Mua', 'Bán']}
 *    active={mode}
 *    onChange={setMode}
 *    colors={{ active: '#10B981' }}
 *  />
 */

type TabBarVariant = 'underline' | 'pill' | 'segment';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

interface TabBarProps<T extends string> {
  /** Array of tab labels (strings) or tab objects */
  tabs: readonly T[] | readonly TabItem[];
  /** Currently active tab ID */
  active: T;
  /** Callback when tab changes */
  onChange: (tab: T) => void;
  /** Visual variant */
  variant?: TabBarVariant;
  /** Active indicator/text color (default: #E58A00) */
  activeColor?: string;
  /** Per-tab custom colors (for segment variant, e.g. buy/sell) */
  colors?: Partial<Record<T, string>>;
  /** Show on surface background with border (default: true for underline) */
  bordered?: boolean;
  /** Additional className */
  className?: string;
  /** Tab bar ID for ARIA */
  id?: string;
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'underline',
  activeColor = '#E58A00',
  colors,
  bordered,
  className = '',
  id,
}: TabBarProps<T>) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  // Normalize tabs to always work with objects
  const normalizedTabs = tabs.map((tab): TabItem =>
    typeof tab === 'string' ? { id: tab, label: tab } : tab,
  );

  const handleSelect = useCallback(
    (tabId: T) => {
      if (tabId !== active) {
        onChange(tabId);
        hapticSelection();
      }
    },
    [active, onChange, hapticSelection],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex =
          e.key === 'ArrowRight'
            ? (currentIndex + 1) % normalizedTabs.length
            : (currentIndex - 1 + normalizedTabs.length) % normalizedTabs.length;
        handleSelect(normalizedTabs[nextIndex].id as T);
      }
    },
    [normalizedTabs, handleSelect],
  );

  /* ═══ Underline variant ═══ */
  if (variant === 'underline') {
    const showBorder = bordered !== undefined ? bordered : true;
    return (
      <div
        id={id}
        role="tablist"
        className={`flex px-5 pt-2 pb-0 gap-1 ${className}`}
        style={{
          background: c.surface,
          borderBottom: showBorder ? `1px solid ${c.divider}` : 'none',
        }}
      >
        {normalizedTabs.map((tab, i) => {
          const isActive = tab.id === active;
          const tabColor = colors?.[tab.id as T] ?? activeColor;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelect(tab.id as T)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="flex-1 pb-2.5 relative"
              style={{
                color: isActive ? tabColor : c.text3,
                fontSize: 12,
                fontWeight: 700,
                minHeight: 44,
                transition: 'color var(--tr-duration-fast) ease',
              }}
            >
              {tab.label}
              <div
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                style={{
                  background: tabColor,
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                  transition:
                    'opacity var(--tr-duration-normal) ease, transform var(--tr-duration-normal) ease',
                }}
              />
            </button>
          );
        })}
      </div>
    );
  }

  /* ═══ Pill variant ═══ */
  if (variant === 'pill') {
    return (
      <div id={id} role="tablist" className={`flex gap-2 ${className}`}>
        {normalizedTabs.map((tab, i) => {
          const isActive = tab.id === active;
          const tabColor = colors?.[tab.id as T] ?? activeColor;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelect(tab.id as T)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="px-4 py-2 rounded-full"
              style={{
                background: isActive ? `${tabColor}14` : c.surface2,
                color: isActive ? tabColor : c.text3,
                fontSize: 12,
                fontWeight: 600,
                border: isActive ? `1px solid ${tabColor}30` : `1px solid transparent`,
                minHeight: 36,
                transition: 'all var(--tr-duration-fast) ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  /* ═══ Segment variant ═══ */
  return (
    <div
      id={id}
      role="tablist"
      className={`flex rounded-xl p-1 ${className}`}
      style={{ background: c.surface2 }}
    >
      {normalizedTabs.map((tab, i) => {
        const isActive = tab.id === active;
        const tabColor = colors?.[tab.id as T] ?? activeColor;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleSelect(tab.id as T)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="flex-1 py-2.5 rounded-lg flex items-center justify-center"
            style={{
              background: isActive ? tabColor : 'transparent',
              color: isActive ? '#fff' : c.text3,
              fontWeight: 700,
              fontSize: 13,
              minHeight: 40,
              transition:
                'background var(--tr-duration-fast) ease, color var(--tr-duration-fast) ease',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
