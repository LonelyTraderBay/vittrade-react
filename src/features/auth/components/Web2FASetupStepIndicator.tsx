import { CheckCircle } from 'lucide-react';
import type { ThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT } from '@/shared/theme/webTokens';

const ACTIVE_STEP_COLOR = '#1d4ed8';

interface Props {
  current: number;
  c: ThemeColors;
}
export function Web2FASetupStepIndicator({ current, c }: Props) {
  const steps = ['Quét mã QR', 'Xác minh', 'Mã dự phòng'];
  return (
    <ol
      aria-label="Tiến trình thiết lập 2FA"
      className="flex items-center"
      style={{ gap: 0, marginBottom: 32, padding: 0, listStyle: 'none' }}
    >
      {steps.map((label, i) => (
        <li
          key={label}
          aria-label={`Bước ${i + 1} trên ${steps.length}: ${label}`}
          aria-current={i === current ? 'step' : undefined}
          className="flex items-center"
          style={{ gap: 0 }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <div
              className="flex items-center justify-center"
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: i <= current ? ACTIVE_STEP_COLOR : c.surface,
                border: i <= current ? 'none' : '1.5px solid ' + c.borderSolid,
                transition: 'border-color 0.25s ease',
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
              className={i === current ? undefined : 'sr-only sm:not-sr-only'}
              style={{
                color: i <= current ? c.text1 : c.text2,
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
                background: i < current ? ACTIVE_STEP_COLOR : c.borderSolid,
                transition: 'background 0.25s ease',
              }}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
