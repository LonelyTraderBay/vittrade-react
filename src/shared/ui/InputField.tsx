import React, { useId, useState } from 'react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { textRoleSize } from '@/shared/theme/typography';

/**
 * InputField — Enterprise Input Component
 * Centralized design tokens: height 52px, borderRadius 14px
 * Supports label, error state, prefix/suffix icons, and wrapper mode
 * Focus border follows VitTrade primary amber token.
 */

export interface InputFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'prefix'
> {
  /** Optional label above input */
  label?: React.ReactNode;
  /** Optional instructions connected to the input for visual and assistive-technology users */
  helper?: string;
  /** Error message (turns border red) */
  error?: string;
  /** Prefix element (icon, text) */
  prefix?: React.ReactNode;
  /** Suffix element (icon, button) */
  suffix?: React.ReactNode;
  /** Container className override */
  containerClassName?: string;
  /** Container style override */
  containerStyle?: React.CSSProperties;
}

export function InputField({
  label,
  error,
  prefix,
  suffix,
  containerClassName = '',
  containerStyle,
  className = '',
  style,
  id,
  helper,
  'aria-describedby': ariaDescribedBy,
  onFocus,
  onBlur,
  ...inputProps
}: InputFieldProps) {
  const c = useThemeColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? 'var(--input-border-error)' : focused ? c.primary : c.borderSolid;
  const focusShadow = focused ? `0 0 0 2px ${error ? c.text1 : 'rgba(229, 138, 0, 0.25)'}` : 'none';
  const generatedId = useId();
  const inputId =
    id ||
    (typeof label === 'string' && label
      ? 'input-' + label.replace(/\s+/g, '-').toLowerCase()
      : label
        ? 'input-' + generatedId.replace(/:/g, '')
        : undefined);
  const helperId = helper && inputId ? `${inputId}-helper` : undefined;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const describedBy = [
    ...new Set(
      [ariaDescribedBy, helperId, errorId]
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => value.split(/\s+/).filter(Boolean)),
    ),
  ].join(' ');

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            color: c.text2,
            fontSize: textRoleSize('label'),
            display: 'block',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <div
        className="flex items-center gap-3 px-4"
        style={{
          background: c.surface2,
          border: `1.5px solid ${borderColor}`,
          height: 'var(--input-height)',
          borderRadius: 'var(--input-radius)',
          boxShadow: focusShadow,
          transition:
            'border-color var(--tr-duration-normal) ease, box-shadow var(--tr-duration-normal) ease',
          ...containerStyle,
        }}
      >
        {prefix}
        <input
          id={inputId}
          className={`flex-1 min-w-0 ${className}`}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: c.text1,
            fontSize: 15,
            ...style,
          }}
          {...inputProps}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {suffix}
      </div>
      {helper && (
        <p
          id={helperId}
          style={{ color: c.text2, fontSize: textRoleSize('caption'), marginTop: 4 }}
        >
          {helper}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          style={{ color: c.errorText, fontSize: textRoleSize('caption'), marginTop: 4 }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * InputWrapper — For custom content inside input-styled container
 * Uses same design tokens as InputField
 */
export interface InputWrapperProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function InputWrapper({
  label,
  error,
  children,
  className = '',
  style,
  onClick,
}: InputWrapperProps) {
  const c = useThemeColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? 'var(--input-border-error)' : focused ? c.primary : c.borderSolid;
  const focusShadow = focused && !error ? '0 0 0 2px rgba(229, 138, 0, 0.25)' : 'none';

  return (
    <div>
      {label && (
        <label
          style={{
            color: c.text2,
            fontSize: textRoleSize('label'),
            display: 'block',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <div
        className={`flex items-center gap-3 px-4 ${className}`}
        style={{
          background: c.surface2,
          border: `1.5px solid ${borderColor}`,
          height: 'var(--input-height)',
          borderRadius: 'var(--input-radius)',
          boxShadow: focusShadow,
          transition:
            'border-color var(--tr-duration-normal) ease, box-shadow var(--tr-duration-normal) ease',
          cursor: onClick ? 'pointer' : undefined,
          ...style,
        }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? label : undefined}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || !onClick) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
      </div>
      {error && (
        <p style={{ color: c.errorText, fontSize: textRoleSize('caption'), marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}
