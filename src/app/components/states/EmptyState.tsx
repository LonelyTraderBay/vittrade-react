import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  /** Optional emoji to show instead of icon */
  emoji?: string;
}

export function EmptyState({ icon: Icon, title, subtitle, ctaLabel, onCta, emoji }: EmptyStateProps) {
  const c = useThemeColors();
  return (
    <div className="flex flex-col items-center py-16 gap-4 px-8">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
      >
        {emoji ? (
          <span style={{ fontSize: 36 }}>{emoji}</span>
        ) : (
          <Icon size={36} color={c.borderSolid} strokeWidth={1.5} />
        )}
      </div>

      <div className="text-center">
        <p style={{ color: c.text2, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ color: c.text3, fontSize: 13, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>

      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="px-6 py-3 rounded-2xl font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}