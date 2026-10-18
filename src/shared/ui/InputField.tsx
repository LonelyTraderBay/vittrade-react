import React, { useId, useState } from 'react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { textRoleSize, textRoleWeight } from '@/shared/theme/typography';

/**
 * InputField — shared labeled input with accessible helper/error wiring.
 * Comfortable density preserves the existing 52px/14px contract; compact
 * density uses the shared compact input tokens for denser forms.
 */

export interface InputFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'prefix'
> {
  /** Optional label above input */
  label?: React.ReactNode;
  /** Optional instructions connected to the input for visual and assistive-technology users */
  helper?: string;
  /** Error message (turns border red and is connected to the input) */
  error?: string;
  /** Density profile for the input control. */
  density?: 'comfortable' | 'compact';
  /** Semantic surface tone behind the input control. */
  surfaceTone?: 'raised' | 'base';
  /** Optional control displayed beside the field label, outside the label element. */
  labelAction?: React.ReactNode;
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
  density = 'comfortable',
  surfaceTone = 'raised',
  labelAction,
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
  const compact = density === 'compact';
  const inputHeight = compact ? 'var(--input-height-compact)' : 'var(--input-height)';
  const inputRadius = compact ? 'var(--input-radius-compact)' : 'var(--input-radius)';
  const inputPaddingInline = compact ? 'var(--input-padding-inline-compact)' : undefined;
  const inputGap = compact ? 'var(--input-gap-compact)' : undefined;
  const labelFontSize = compact ? textRoleSize('captionMedium') : textRoleSize('label');
  const inputFontSize = compact ? textRoleSize('body') : 15;
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
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 'var(--input-label-gap)' }}
        >
          <label
            htmlFor={inputId}
            style={{
              color: c.text2,
              fontSize: labelFontSize,
              fontWeight: compact ? textRoleWeight('captionMedium') : undefined,
              display: 'block',
            }}
          >
            {label}
          </label>
          {labelAction}
        </div>
      )}
      <div
        className="flex items-center gap-3 px-4"
        style={{
          background: surfaceTone === 'base' ? c.surface : c.surface2,
          border: `1.5px solid ${borderColor}`,
          height: inputHeight,
          borderRadius: inputRadius,
          paddingInline: inputPaddingInline,
          gap: inputGap,
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
            fontSize: inputFontSize,
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
            marginBottom: 'var(--input-label-gap)',
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
