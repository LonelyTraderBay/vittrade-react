import React, { useId, useState, useCallback, useRef } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { AlertCircle, Eye, EyeOff, X } from 'lucide-react';
import { φ, φRadius } from '../../utils/golden';

/**
 * ══════════════════════════════════════════════════════════════
 *  TrInput — Enterprise Fintech Input Component
 * ══════════════════════════════════════════════════════════════
 *
 *  Standardized input following Guidelines §7.2:
 *  ✓  label + placeholder + helper + error
 *  ✓  prefix / suffix (currency symbols, units)
 *  ✓  numeric mode with thousands separator
 *  ✓  selectOnFocus (fintech standard)
 *  ✓  clear button (optional)
 *  ✓  password toggle (optional)
 *
 *  SIZE VARIANTS:
 *  ─────────────────────────────────────────────────────────────
 *  "standard" — 52px height (enterprise CTA-aligned)
 *  "compact"  — 44px height (dense forms, order entry)
 *  "hero"     — 64px height (large, prominent inputs)
 *
 *  USAGE:
 *  ─────────────────────────────────────────────────────────────
 *  <TrInput label="Số lượng" placeholder="0.00" suffix="BTC"
 *    helper="Tối thiểu: 0.001 BTC" error={errors.amount} numeric />
 *
 *  <TrInput label="Email" placeholder="name@example.com"
 *    error={errors.email} clearable />
 *
 *  <TrInput label="Mật khẩu" type="password" />
 *
 *  <TrInput label="Tìm kiếm" variant="search"
 *    prefix={<Search size={16} />} clearable />
 */

type InputSize = 'standard' | 'compact' | 'hero';
type InputVariant = 'default' | 'search' | 'amount';

interface TrInputProps {
  /** Field label (displayed above input) */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text below input (hidden when error is shown) */
  helper?: string;
  /** Error message (replaces helper, adds red border) */
  error?: string;
  /** Left-side content (icon or text, e.g. "$", <Search />) */
  prefix?: React.ReactNode;
  /** Right-side content (text, e.g. "BTC", "USDT") */
  suffix?: React.ReactNode;
  /** Input value (controlled) */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Native input change handler (if you need the event) */
  onChangeNative?: React.ChangeEventHandler<HTMLInputElement>;
  /** Blur handler */
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Focus handler */
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  /** Key down handler */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  /** Input type (default: "text") */
  type?: 'text' | 'password' | 'email' | 'tel' | 'number' | 'url';
  /** Height variant */
  size?: InputSize;
  /** Visual variant */
  variant?: InputVariant;
  /** Enable numeric formatting (thousands separator) */
  numeric?: boolean;
  /** Select all text on focus (common in fintech for quick replacement) */
  selectOnFocus?: boolean;
  /** Show clear button when value is not empty */
  clearable?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Maximum length */
  maxLength?: number;
  /** Auto-complete hint */
  autoComplete?: string;
  /** HTML input mode (affects mobile keyboard) */
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email' | 'url' | 'search' | 'none';
  /** Additional className for the wrapper */
  className?: string;
  /** Additional className for the input element */
  inputClassName?: string;
  /** Additional inline styles for the wrapper */
  style?: React.CSSProperties;
  /** Test ID */
  'data-testid'?: string;
}

/* ─── Size Presets ─── */
const SIZE_MAP: Record<InputSize, number> = {
  standard: 52,
  compact: 44,
  hero: 64,
};

export function TrInput({
  label,
  placeholder,
  helper,
  error,
  prefix,
  suffix,
  value,
  onChange,
  onChangeNative,
  onBlur,
  onFocus,
  onKeyDown,
  type = 'text',
  size = 'standard',
  variant = 'default',
  numeric = false,
  selectOnFocus = false,
  clearable = false,
  disabled = false,
  readOnly = false,
  maxLength,
  autoComplete,
  inputMode,
  className = '',
  inputClassName = '',
  style,
  'data-testid': testId,
}: TrInputProps) {
  const c = useThemeColors();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = !!error;
  const hasValue = !!value && value.length > 0;
  const isPassword = type === 'password';
  const height = SIZE_MAP[size];
  const isHero = size === 'hero';

  /* ─── Numeric formatting ─── */
  const formatNumeric = useCallback((raw: string): string => {
    if (!numeric) return raw;
    // Strip non-numeric except dot and minus
    const cleaned = raw.replace(/[^0-9.\-]/g, '');
    // Split integer and decimal parts
    const parts = cleaned.split('.');
    // Add thousands separator to integer part
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  }, [numeric]);

  const parseNumeric = useCallback((formatted: string): string => {
    if (!numeric) return formatted;
    return formatted.replace(/,/g, '');
  }, [numeric]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (onChangeNative) onChangeNative(e);
    if (onChange) {
      onChange(numeric ? parseNumeric(raw) : raw);
    }
  }, [onChange, onChangeNative, numeric, parseNumeric]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    if (selectOnFocus) {
      // Defer to allow the browser to focus first
      requestAnimationFrame(() => e.target.select());
    }
    onFocus?.(e);
  }, [selectOnFocus, onFocus]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const handleClear = useCallback(() => {
    onChange?.('');
    inputRef.current?.focus();
  }, [onChange]);

  /* ─── Border color logic ─── */
  const borderColor = hasError
    ? 'var(--input-border-error)'
    : focused
      ? c.primary
      : 'var(--input-border)';

  const boxShadow = hasError
    ? '0 0 0 2px rgba(239,68,68,0.15)'
    : focused
      ? `0 0 0 2px ${c.primary}40`
      : 'none';

  /* ─── Display value (with formatting) ─── */
  const displayValue = numeric && value ? formatNumeric(value) : (value ?? '');

  /* ─── Resolve input type (password toggle) ─── */
  const resolvedType = isPassword
    ? (showPassword ? 'text' : 'password')
    : type;

  /* ─── Resolve inputMode ─── */
  const resolvedInputMode = inputMode ?? (numeric ? 'decimal' : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} style={style}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          style={{
            color: hasError ? c.sell : c.text2,
            fontSize: φ.sm,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {label}
        </label>
      )}

      {/* Input container */}
      <div
        className="flex items-center gap-2 px-4"
        style={{
          height,
          borderRadius: 14,
          background: disabled ? c.surface2 : 'var(--input-bg)',
          border: `${isHero ? 2 : 1.5}px solid ${borderColor}`,
          boxShadow,
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color var(--tr-duration-normal) ease, box-shadow var(--tr-duration-normal) ease',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Prefix */}
        {prefix && (
          <span
            className="shrink-0 flex items-center"
            style={{ color: c.text3, fontSize: φ.sm }}
          >
            {prefix}
          </span>
        )}

        {/* Input element */}
        <input
          ref={inputRef}
          id={id}
          type={resolvedType}
          value={displayValue}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          autoComplete={autoComplete}
          inputMode={resolvedInputMode}
          data-testid={testId}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : helper ? `${id}-helper` : undefined}
          className={`flex-1 min-w-0 bg-transparent outline-none ${inputClassName}`}
          style={{
            color: c.text1,
            fontSize: isHero ? φ.lg : φ.base,
            fontWeight: isHero ? 700 : 400,
            lineHeight: 1.5,
            fontFamily: numeric ? '-apple-system, BlinkMacSystemFont, "SF Mono", monospace' : 'inherit',
            /* Prevent iOS zoom — already set to 16px in theme.css */
          }}
        />

        {/* Clear button */}
        {clearable && hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 flex items-center justify-center rounded-full active:opacity-60"
            style={{
              width: 20,
              height: 20,
              background: c.surface3,
            }}
            aria-label="Xóa"
            tabIndex={-1}
          >
            <X size={12} color={c.text3} strokeWidth={2.5} />
          </button>
        )}

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="shrink-0 flex items-center justify-center active:opacity-60"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            tabIndex={-1}
          >
            {showPassword
              ? <EyeOff size={18} color={c.text3} />
              : <Eye size={18} color={c.text3} />
            }
          </button>
        )}

        {/* Suffix */}
        {suffix && (
          <span
            className="shrink-0 flex items-center"
            style={{
              color: c.text2,
              fontSize: φ.sm,
              fontWeight: 600,
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      {/* Error / Helper text */}
      {(hasError || helper) && (
        <div
          id={hasError ? `${id}-error` : `${id}-helper`}
          className="flex items-start gap-1"
          style={{
            color: hasError ? c.sell : c.text3,
            fontSize: φ.xs,
            lineHeight: 1.4,
          }}
          role={hasError ? 'alert' : undefined}
        >
          {hasError && <AlertCircle size={12} className="shrink-0 mt-0.5" />}
          <span>{hasError ? error : helper}</span>
        </div>
      )}
    </div>
  );
}

/**
 * ══════════════════════════════════════════════════════════════
 *  TrTextarea — Enterprise Textarea (same token system)
 * ══════════════════════════════════════════════════════════════
 */
interface TrTextareaProps {
  label?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function TrTextarea({
  label,
  placeholder,
  helper,
  error,
  value,
  onChange,
  onBlur,
  rows = 3,
  maxLength,
  disabled = false,
  className = '',
  'data-testid': testId,
}: TrTextareaProps) {
  const c = useThemeColors();
  const id = useId();
  const [focused, setFocused] = useState(false);

  const hasError = !!error;
  const borderColor = hasError
    ? 'var(--input-border-error)'
    : focused
      ? c.primary
      : 'var(--input-border)';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          style={{
            color: hasError ? c.sell : c.text2,
            fontSize: φ.sm,
            fontWeight: 600,
          }}
        >
          {label}
        </label>
      )}

      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        data-testid={testId}
        aria-invalid={hasError}
        className="w-full bg-transparent outline-none resize-none px-4 py-3"
        style={{
          borderRadius: 14,
          background: disabled ? c.surface2 : 'var(--input-bg)',
          border: `1.5px solid ${borderColor}`,
          boxShadow: hasError ? '0 0 0 2px rgba(239,68,68,0.15)' : focused ? `0 0 0 2px ${c.primary}40` : 'none',
          color: c.text1,
          fontSize: φ.base,
          transition: 'border-color var(--tr-duration-normal) ease, box-shadow var(--tr-duration-normal) ease',
          opacity: disabled ? 0.5 : 1,
        }}
      />

      <div className="flex items-center justify-between">
        {(hasError || helper) && (
          <div
            className="flex items-start gap-1"
            style={{ color: hasError ? c.sell : c.text3, fontSize: φ.xs }}
            role={hasError ? 'alert' : undefined}
          >
            {hasError && <AlertCircle size={12} className="shrink-0 mt-0.5" />}
            <span>{hasError ? error : helper}</span>
          </div>
        )}
        {maxLength && (
          <span style={{ color: c.text3, fontSize: φ.xs, marginLeft: 'auto' }}>
            {(value?.length ?? 0)}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}