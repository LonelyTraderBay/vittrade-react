import { Check } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { ButtonHeights, ButtonPadding, ButtonRadius } from '@/shared/theme/button';
import { ALPHA, withAlpha } from '@/shared/theme/colors';
import { textRoleStyle } from '@/shared/theme/typography';

interface FilterButtonProps {
  selected: boolean;
  label: string;
  onClick: () => void;
}

/** Controlled filter choice. The parent owns selection, grouping and query changes. */
export function FilterButton({ selected, label, onClick }: FilterButtonProps) {
  const colors = useThemeColors();
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="inline-flex items-center"
      style={{
        ...textRoleStyle('button'),
        minHeight: ButtonHeights.compact,
        minWidth: 0,
        maxWidth: '100%',
        padding: `8px ${ButtonPadding.compact.x}px`,
        gap: ButtonPadding.compact.gap,
        borderRadius: ButtonRadius.compact,
        background: selected ? withAlpha(colors.primary, ALPHA.soft) : colors.surface2,
        color: selected ? colors.text1 : colors.text2,
        // Keep inverse theme text/surface pairs synchronous; retain the inherited effect timing.
        transitionProperty: 'box-shadow, filter, transform',
      }}
    >
      <Check
        size={14}
        aria-hidden="true"
        style={{ flexShrink: 0, visibility: selected ? 'visible' : 'hidden' }}
      />
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{label}</span>
    </button>
  );
}
