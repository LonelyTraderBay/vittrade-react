import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router';
import {
  ChevronLeft, AlertTriangle, Zap, Shield, Info, CheckCircle,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';

/**
 * ══════════════════════════════════════════════════════════
 *  LEVERAGE PAGE — Standalone page for adjusting leverage
 * ══════════════════════════════════════════════════════════
 *  Route: /trade/:pairId/futures/leverage
 *  Receives: location.state.currentLeverage (number)
 *  Returns:  navigates back with location.state.newLeverage
 */

const LEVERAGE_PRESETS = [1, 2, 3, 5, 10, 20, 25, 50, 75, 100];
const SLIDER_STOPS = [1, 10, 25, 50, 75, 100];

function getRisk(val: number): { label: string; color: string; level: number } {
  if (val <= 3) return { label: 'Rất thấp', color: '#10B981', level: 1 };
  if (val <= 5) return { label: 'Thấp', color: '#10B981', level: 2 };
  if (val <= 10) return { label: 'Trung bình thấp', color: '#84CC16', level: 3 };
  if (val <= 20) return { label: 'Trung bình', color: '#F59E0B', level: 4 };
  if (val <= 50) return { label: 'Cao', color: '#F97316', level: 5 };
  return { label: 'Rất cao', color: '#EF4444', level: 6 };
}

export function LeveragePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { pairId } = useParams<{ pairId: string }>();
  const location = useLocation();
  const prefix = useRoutePrefix();

  const currentLeverage = (location.state as any)?.currentLeverage ?? 10;
  const [val, setVal] = useState(currentLeverage);
  const risk = getRisk(val);

  // Simulated margin impact
  const exampleMargin = 100;
  const positionSize = exampleMargin * val;
  const liqDistance = (100 / val) * 0.9;

  const handleConfirm = () => {
    navigate(`${prefix}/trade/${pairId || 'btc-usdt'}/futures`, {
      state: { newLeverage: val },
    });
  };

  return (
    <PageLayout>
      <Header
        title="Điều chỉnh đòn bẩy"
        subtitle={`Hiện tại: ${currentLeverage}x`}
        back
        breadcrumb
      />

      <div className="flex-1 px-5 py-5 flex flex-col gap-5">
        {/* Current leverage display */}
        <div
          className="rounded-2xl p-6 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${risk.color}12 0%, ${risk.color}06 100%)`,
            border: `1.5px solid ${risk.color}30`,
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${risk.color}, transparent 70%)`,
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap size={20} color={risk.color} />
              <span style={{ color: c.text2, fontSize: 12 }}>Đòn bẩy</span>
            </div>
            <p style={{ color: risk.color, fontSize: 56, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
              {val}x
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div
                className="px-3 py-1 rounded-full"
                style={{ background: `${risk.color}20`, border: `1px solid ${risk.color}40` }}
              >
                <span style={{ color: risk.color, fontSize: 12, fontWeight: 700 }}>
                  Rủi ro: {risk.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk meter bar */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span style={{ color: c.text3, fontSize: 12 }}>Mức rủi ro</span>
            <span style={{ color: risk.color, fontSize: 12, fontWeight: 600 }}>{risk.label}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex gap-1" style={{ background: c.surface2 }}>
            {[1, 2, 3, 4, 5, 6].map(level => (
              <div
                key={level}
                className="flex-1 rounded-full"
                style={{
                  background: level <= risk.level
                    ? level <= 2 ? '#10B981' : level <= 4 ? '#F59E0B' : '#EF4444'
                    : c.surface2,
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Slider */}
        <div className="flex flex-col gap-3">
          <label style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Kéo để điều chỉnh</label>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={val}
            onChange={e => setVal(parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: risk.color }}
          />
          <div className="flex justify-between">
            {SLIDER_STOPS.map(v => (
              <button
                key={v}
                onClick={() => setVal(v)}
                className="text-xs px-3 py-2 rounded-lg"
                style={{
                  background: val === v ? '#3B82F6' : c.surface2,
                  color: val === v ? '#fff' : c.text2,
                  border: `1px solid ${val === v ? '#3B82F6' : c.borderSolid}`,
                  fontWeight: val === v ? 700 : 500,
                }}
              >
                {v}x
              </button>
            ))}
          </div>
        </div>

        {/* Preset grid */}
        <div className="flex flex-col gap-2">
          <label style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Chọn nhanh</label>
          <div className="grid grid-cols-5 gap-2">
            {LEVERAGE_PRESETS.map(v => (
              <button
                key={v}
                onClick={() => setVal(v)}
                className="h-10 rounded-xl text-sm font-bold"
                style={{
                  background: val === v
                    ? `linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)`
                    : c.surface2,
                  color: val === v ? '#fff' : c.text2,
                  border: `1px solid ${val === v ? 'transparent' : c.borderSolid}`,
                  boxShadow: val === v ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                }}
              >
                {v}x
              </button>
            ))}
          </div>
        </div>

        {/* Impact preview */}
        <TrCard className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <Info size={14} color="#3B82F6" />
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Ước tính tác động</span>
          </div>
          <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>
            Với ký quỹ ${exampleMargin} USDT
          </p>
          {[
            { label: 'Giá trị hợp đồng', value: `$${positionSize.toLocaleString()}`, color: c.text1 },
            { label: 'Thanh lý cách giá vào', value: `~${liqDistance.toFixed(1)}%`, color: '#EF4444' },
            { label: 'Phí mở vị thế (0.02%)', value: `$${(positionSize * 0.0002).toFixed(4)}`, color: '#F59E0B' },
            { label: 'Lợi nhuận nếu +1%', value: `+$${(exampleMargin * val * 0.01).toFixed(2)}`, color: '#10B981' },
            { label: 'Lỗ nếu -1%', value: `-$${(exampleMargin * val * 0.01).toFixed(2)}`, color: '#EF4444' },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ color: c.text3, fontSize: 12 }}>{row.label}</span>
              <span style={{ color: row.color, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{row.value}</span>
            </div>
          ))}
        </TrCard>

        {/* Warning */}
        <div
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{
            background: val > 20 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${val > 20 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}
        >
          <AlertTriangle size={14} color={val > 20 ? '#EF4444' : '#F59E0B'} className="shrink-0 mt-1" />
          <p style={{ color: val > 20 ? '#EF4444' : '#F59E0B', fontSize: 12, lineHeight: 1.6 }}>
            {val > 50
              ? 'Đòn bẩy cực kỳ cao! Giá chỉ cần biến động nhỏ cũng có thể thanh lý toàn bộ vị thế. Chỉ dành cho trader có kinh nghiệm.'
              : val > 20
              ? 'Đòn bẩy cao làm tăng đáng kể rủi ro thanh lý. Hãy đảm bảo quản lý rủi ro chặt chẽ với Stop Loss.'
              : 'Đòn bẩy giúp khuếch đại lợi nhuận nhưng cũng tăng rủi ro. Luôn sử dụng Take Profit và Stop Loss.'}
          </p>
        </div>

        {/* Tips for high leverage */}
        {val > 20 && (
          <TrCard className="p-4" accentBorder="rgba(239,68,68,0.2)">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} color="#EF4444" />
              <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>Lưu ý quan trọng</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                'Luôn đặt Stop Loss để giới hạn lỗ',
                'Không sử dụng quá 5% tổng vốn cho 1 lệnh',
                'Theo dõi vị thế thường xuyên',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle size={12} color="#EF4444" className="shrink-0 mt-1" />
                  <span style={{ color: c.text2, fontSize: 12, lineHeight: 1.4 }}>{tip}</span>
                </div>
              ))}
            </div>
          </TrCard>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Confirm button */}
        <CTAButton onClick={handleConfirm}>
          Xác nhận đòn bẩy {val}x
        </CTAButton>

        <div style={{ height: 16 }} />
      </div>
    </PageLayout>
  );
}