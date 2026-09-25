import { CheckCircle } from 'lucide-react';
import type { ThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT } from '@/shared/theme/webTokens';
interface Props {
  current: number;
  c: ThemeColors;
}
export function Web2FASetupStepIndicator({ current, c }: Props) {
  const steps = ['Quét mã QR', 'Xác minh', 'Mã dự phòng'];
  return (
    <div className="flex items-center" style={{ gap: 0, marginBottom: 32 }}>
      {steps.map((label, i) => (
        <div key={label} className="flex items-center" style={{ gap: 0 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: i <= current ? '#3B82F6' : c.surface,
                border: i <= current ? 'none' : '1.5px solid ' + c.borderSolid,
                transition: 'all 0.25s ease',
              }}
            >
              {i < current ? (
                <CheckCircle size={14} color="#fff" strokeWidth={2.5} />
              ) : (
                <span
                  style={{
                    color: i === current ? '#fff' : c.text3,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <span
              style={{
                color: i <= current ? c.text1 : c.text3,
                fontSize: WEB_FONT.xs,
                fontWeight: i === current ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                width: 32,
                height: 1,
                marginLeft: 8,
                marginRight: 8,
                background: i < current ? '#3B82F6' : c.borderSolid,
                transition: 'background 0.25s ease',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
