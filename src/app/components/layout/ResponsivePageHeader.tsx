import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';

interface Props {
  title: string;
  back?: boolean | string;
  right?: React.ReactNode;
}

export function ResponsivePageHeader({ title, back = true, right }: Props) {
  const navigate = useNavigate();
  const c = useThemeColors();
  const handleBack = () => {
    if (typeof back === 'string') navigate(back);
    else navigate(-1);
  };
  return (
    <div
      className="flex items-center justify-between px-5 py-3 sticky top-0 z-20"
      style={{ background: c.bg, borderBottom: `1px solid ${c.divider}` }}
    >
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={handleBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl active:opacity-60"
            style={{ background: c.surface2 }}
          >
            <ArrowLeft size={18} color={c.text1} />
          </button>
        )}
        <h1 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{title}</h1>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
