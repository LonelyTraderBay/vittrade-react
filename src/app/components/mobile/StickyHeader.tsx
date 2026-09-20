import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

interface StickyHeaderProps {
  children: React.ReactNode;
  /** Top offset nếu cần (px) — dùng khi có header phía trên */
  top?: number;
  /** Background color — mặc định dùng surface bg */
  bg?: string;
}

/**
 * Enterprise Fintech — Sticky Section Header
 * Sticky header cho lists/sections, tự động blur background
 * Dùng cho: Market list columns, Transaction groups, Settings sections
 */
export function StickyHeader({ children, top = 0, bg }: StickyHeaderProps) {
  const c = useThemeColors();
  return (
    <div
      className="sticky z-10"
      style={{
        top,
        background: bg || c.navBg,
        backdropFilter: 'saturate(180%) blur(24px)',
        WebkitBackdropFilter: 'saturate(180%) blur(24px)',
        borderBottom: `1px solid ${c.border}`,
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Compact column header cho data tables/lists
 */
export function StickyColumnHeader({
  columns,
  top = 0,
}: {
  columns: { label: string; align?: 'left' | 'center' | 'right'; flex?: number }[];
  top?: number;
}) {
  const c = useThemeColors();
  return (
    <StickyHeader top={top}>
      <div className="flex items-center px-5 py-2">
        {columns.map((col, i) => (
          <span
            key={col.label}
            style={{
              flex: col.flex ?? 1,
              color: c.text3,
              fontSize: 10,
              fontWeight: 500,
              textAlign: col.align || (i === 0 ? 'left' : i === columns.length - 1 ? 'right' : 'center'),
            }}
          >
            {col.label}
          </span>
        ))}
      </div>
    </StickyHeader>
  );
}

/**
 * Date group header cho transaction/order lists
 */
export function StickyDateHeader({ date, top = 0 }: { date: string; top?: number }) {
  const c = useThemeColors();
  return (
    <StickyHeader top={top}>
      <div className="px-5 py-2">
        <span style={{ color: c.text2, fontSize: 13, fontWeight: 600 }}>{date}</span>
      </div>
    </StickyHeader>
  );
}