import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Search, X, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { φ, φIcon, φRadius } from '../../utils/golden';
import type { LucideIcon } from 'lucide-react';

/**
 * ══════════════════════════════════════════════════════════
 *  SearchBar — Enterprise Search Input Component
 * ══════════════════════════════════════════════════════════
 *
 *  Standardized search for:
 *  - Asset lists (Wallet, Markets)
 *  - P2P marketplace (offers, merchants)
 *  - Prediction events
 *  - Arena rooms/modes
 *  - Global search
 *  - Address book
 *
 *  VARIANTS:
 *  ─────────────────────────────────────────────────────────
 *  "default"   — standard inline search (most pages)
 *  "header"    — full-width with back button (search pages)
 *  "compact"   — shorter height for dense lists
 *
 *  FEATURES:
 *  ─────────────────────────────────────────────────────────
 *  ✓  Clear button (auto-shows when value present)
 *  ✓  Optional filter button (toggleable active state)
 *  ✓  Auto-focus mode
 *  ✓  Debounced onChange
 *  ✓  onSubmit / onClear callbacks
 *  ✓  Custom right actions
 *
 *  USAGE:
 *  ─────────────────────────────────────────────────────────
 *  <SearchBar placeholder="Tìm tài sản..." value={q} onChange={setQ} />
 *
 *  <SearchBar
 *    placeholder="Tìm cặp giao dịch..."
 *    value={q} onChange={setQ}
 *    filterActive={showFilters}
 *    onFilterToggle={() => setShowFilters(!showFilters)}
 *  />
 *
 *  <SearchBar
 *    variant="header"
 *    placeholder="Tìm kiếm..."
 *    value={q} onChange={setQ}
 *    onBack={() => navigate(-1)}
 *    autoFocus
 *  />
 */

type SearchBarVariant = 'default' | 'header' | 'compact';

interface SearchBarProps {
  /** Search query value (controlled) */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Visual variant */
  variant?: SearchBarVariant;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Debounce delay in ms (0 = no debounce) */
  debounce?: number;
  /** Called when user presses Enter */
  onSubmit?: (value: string) => void;
  /** Called when clear button is pressed */
  onClear?: () => void;
  /** Show filter button */
  filterActive?: boolean;
  /** Called when filter button toggled */
  onFilterToggle?: () => void;
  /** Custom filter icon (default: SlidersHorizontal) */
  filterIcon?: LucideIcon;
  /** Back button handler (for variant="header") */
  onBack?: () => void;
  /** Custom right element (replaces filter button) */
  right?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: React.CSSProperties;
}

/* ─── Height presets ─── */
const HEIGHTS: Record<SearchBarVariant, number> = {
  default: 44,
  header: 44,
  compact: 36,
};

export function SearchBar({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  variant = 'default',
  autoFocus = false,
  debounce = 0,
  onSubmit,
  onClear,
  filterActive,
  onFilterToggle,
  filterIcon: FilterIcon = SlidersHorizontal,
  onBack,
  right,
  disabled = false,
  className = '',
  style,
}: SearchBarProps) {
  const c = useThemeColors();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const hasValue = value.length > 0;
  const height = HEIGHTS[variant];

  /* ─── Sync external value changes ─── */
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /* ─── Auto focus ─── */
  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [autoFocus]);

  /* ─── Handle input change (with optional debounce) ─── */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounce > 0) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => onChange(newValue), debounce);
    } else {
      onChange(newValue);
    }
  }, [onChange, debounce]);

  /* ─── Handle clear ─── */
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  }, [onChange, onClear]);

  /* ─── Handle submit ─── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit(localValue);
    }
  }, [onSubmit, localValue]);

  /* ─── Filter button ─── */
  const showFilter = onFilterToggle != null;

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      style={style}
    >
      {/* Back button (header variant) */}
      {variant === 'header' && onBack && (
        <button
          onClick={onBack}
          className="shrink-0 flex items-center justify-center active:opacity-60"
          style={{ width: 36, height: 36, borderRadius: 10 }}
          aria-label="Quay lại"
        >
          <ArrowLeft size={22} color={c.text1} strokeWidth={2} />
        </button>
      )}

      {/* Search input container */}
      <div
        className="flex items-center gap-2 flex-1"
        style={{
          height,
          paddingLeft: 12,
          paddingRight: 8,
          borderRadius: variant === 'compact' ? 'var(--tr-radius-sm)' : 'var(--tr-radius-md)',
          background: c.searchBg,
          border: `1px solid ${c.borderSolid}`,
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color var(--tr-duration-normal) ease',
        }}
      >
        <Search
          size={variant === 'compact' ? 14 : 16}
          color={c.text3}
          className="shrink-0"
        />

        <input
          ref={inputRef}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none min-w-0"
          style={{
            color: c.text1,
            fontSize: variant === 'compact' ? φ.xs : φ.sm,
          }}
          enterKeyHint="search"
          aria-label={placeholder}
        />

        {/* Clear button */}
        {hasValue && !disabled && (
          <button
            onClick={handleClear}
            className="shrink-0 flex items-center justify-center rounded-full active:opacity-60"
            style={{
              width: 20,
              height: 20,
              background: c.surface3,
            }}
            aria-label="Xóa tìm kiếm"
          >
            <X size={12} color={c.text3} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Filter toggle button */}
      {showFilter && !right && (
        <button
          onClick={onFilterToggle}
          className="shrink-0 flex items-center justify-center"
          style={{
            width: height,
            height,
            borderRadius: variant === 'compact' ? 'var(--tr-radius-sm)' : 'var(--tr-radius-md)',
            background: filterActive ? c.primaryAlpha12 : c.surface2,
            border: `1px solid ${filterActive ? c.primaryAlpha20 : c.borderSolid}`,
            transition: 'all var(--tr-duration-fast) ease',
          }}
          aria-label={filterActive ? 'Tắt bộ lọc' : 'Bật bộ lọc'}
          aria-pressed={filterActive}
        >
          <FilterIcon
            size={variant === 'compact' ? 14 : 16}
            color={filterActive ? c.primary : c.text3}
          />
        </button>
      )}

      {/* Custom right element */}
      {right}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SearchBarWithResults — Search + dropdown results
   ═══════════════════════════════════════════════════════════
   For use when you need an inline search with result overlay.
   Wrap the SearchBar manually with a relative container and
   position the results below.
   
   Pattern:
   <div className="relative">
     <SearchBar ... />
     {showResults && (
       <div className="absolute top-full left-0 right-0 z-50 mt-1">
         <TrCard overflow>
           {results.map(r => ...)}
         </TrCard>
       </div>
     )}
   </div>
*/
