/**
 * DCA Smart Schedule Configuration Page
 * 
 * Configure market-aware scheduling:
 * - Strategy selection
 * - Time preferences
 * - Delay/advance limits
 * - Thresholds
 * 
 * @module pages/dca/DCAScheduleConfig
 * @version 1.0 (Phase 2 - Sprint 3)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  Clock,
  TrendingDown,
  Zap,
  BarChart3,
  Info,
  Save,
  AlertCircle
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../utils/golden';
import {
  smartSchedulingService,
  type SchedulingStrategy,
  type TimePreference
} from '../../services/DCASmartSchedulingService';

/* ═══════════════════════════════════════════
   STRATEGY OPTIONS
   ═══════════════════════════════════════════ */

const STRATEGIES: Array<{
  value: SchedulingStrategy;
  label: string;
  icon: any;
  description: string;
  color: string;
}> = [
  {
    value: 'fixed',
    label: 'Cố định',
    icon: Clock,
    description: 'Thực thi đúng giờ, không tối ưu',
    color: '#6B7280',
  },
  {
    value: 'volatility',
    label: 'Volatility',
    icon: TrendingDown,
    description: 'Ưu tiên thời điểm volatility thấp',
    color: '#8B5CF6',
  },
  {
    value: 'gas-optimized',
    label: 'Gas Optimized',
    icon: Zap,
    description: 'Ưu tiên gas fee thấp',
    color: '#F59E0B',
  },
  {
    value: 'volume',
    label: 'Volume',
    icon: BarChart3,
    description: 'Ưu tiên khối lượng giao dịch cao',
    color: '#3B82F6',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    icon: Zap,
    description: 'Kết hợp nhiều yếu tố (khuyên dùng)',
    color: '#10B981',
  },
];

const TIME_PREFERENCES: Array<{
  value: TimePreference;
  label: string;
  hours: string;
}> = [
  { value: 'morning', label: 'Sáng', hours: '6:00 - 12:00' },
  { value: 'afternoon', label: 'Chiều', hours: '12:00 - 18:00' },
  { value: 'evening', label: 'Tối', hours: '18:00 - 24:00' },
  { value: 'night', label: 'Đêm', hours: '0:00 - 6:00' },
  { value: 'any', label: 'Bất kỳ', hours: '0:00 - 24:00' },
];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function DCAScheduleConfig() {
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const c = useThemeColors();

  // Form state
  const [strategy, setStrategy] = useState<SchedulingStrategy>('hybrid');
  const [timePreference, setTimePreference] = useState<TimePreference>('any');
  const [maxDelayHours, setMaxDelayHours] = useState(6);
  const [maxAdvanceHours, setMaxAdvanceHours] = useState(6);
  const [volatilityThreshold, setVolatilityThreshold] = useState(3.0);
  const [gasPriceThreshold, setGasPriceThreshold] = useState(30);
  const [enabled, setEnabled] = useState(true);

  const selectedStrategy = STRATEGIES.find(s => s.value === strategy);

  const handleSave = () => {
    const config = smartSchedulingService.createConfig({
      userId: 'demo-user',
      planId: 'default-plan',
      strategy,
      timePreference,
      maxDelayHours,
      maxAdvanceHours,
      volatilityThreshold: strategy === 'volatility' || strategy === 'hybrid' ? volatilityThreshold : undefined,
      gasPriceThreshold: strategy === 'gas-optimized' || strategy === 'hybrid' ? gasPriceThreshold : undefined,
      enabled,
    });

    alert('Cấu hình đã lưu!');
    navigate(`${routePrefix}/dca/schedule/${config.id}`);
  };

  return (
    <PageLayout>
      <Header
        title="Smart Scheduling"
        subtitle="Lịch mua · DCA"
        back
      />

      <PageContent gap="default">
        {/* Info Banner */}
        <TrCard
          className="p-4"
          style={{
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <div className="flex items-start gap-3">
            <Info size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Lịch trình thông minh
              </p>
              <p style={{ color: c.text2, fontSize: 12 }}>
                Smart Scheduling tự động điều chỉnh thời gian DCA dựa trên điều kiện thị trường,
                giúp tối ưu chi phí và giảm rủi ro.
              </p>
            </div>
          </div>
        </TrCard>

        {/* Strategy Selection */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Chiến lược
            </h2>
          </div>

          <div className="space-y-2">
            {STRATEGIES.map((s) => {
              const Icon = s.icon;
              const isSelected = strategy === s.value;

              return (
                <TrCard
                  key={s.value}
                  as="button"
                  onClick={() => setStrategy(s.value)}
                  className="w-full p-4"
                  accentBorder={isSelected ? `${s.color}50` : undefined}
                  style={{
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? s.color : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${s.color}20` }}
                    >
                      <Icon size={20} color={s.color} />
                    </div>

                    <div className="flex-1 text-left">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {s.label}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {s.description}
                      </p>
                    </div>

                    {isSelected && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: s.color }}
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </TrCard>
              );
            })}
          </div>
        </div>

        {/* Time Preference */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Khung giờ ưu tiên
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {TIME_PREFERENCES.map((tp) => {
              const isSelected = timePreference === tp.value;

              return (
                <button
                  key={tp.value}
                  onClick={() => setTimePreference(tp.value)}
                  className="p-3 rounded-xl transition-all"
                  style={{
                    background: isSelected
                      ? `${selectedStrategy?.color}15`
                      : c.surface2,
                    border: isSelected
                      ? `2px solid ${selectedStrategy?.color}`
                      : '2px solid transparent',
                  }}
                >
                  <p
                    style={{
                      color: isSelected ? selectedStrategy?.color : c.text1,
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {tp.label}
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    {tp.hours}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Delay/Advance Limits */}
        <TrCard className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 12 }}>
            Giới hạn điều chỉnh
          </h3>

          <div className="space-y-4">
            {/* Max Delay */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: 12 }}>
                  Trễ tối đa
                </span>
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  {maxDelayHours}h
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={maxDelayHours}
                onChange={(e) => setMaxDelayHours(Number(e.target.value))}
                className="w-full"
              />
              <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                Cho phép trễ tối đa {maxDelayHours} giờ để đợi điều kiện tốt hơn
              </p>
            </div>

            {/* Max Advance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: 12 }}>
                  Sớm tối đa
                </span>
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  {maxAdvanceHours}h
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={maxAdvanceHours}
                onChange={(e) => setMaxAdvanceHours(Number(e.target.value))}
                className="w-full"
              />
              <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                Cho phép thực thi sớm tối đa {maxAdvanceHours} giờ nếu điều kiện thuận lợi
              </p>
            </div>
          </div>
        </TrCard>

        {/* Strategy-Specific Settings */}
        {(strategy === 'volatility' || strategy === 'hybrid') && (
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={18} color="#8B5CF6" />
              <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                Volatility Settings
              </h3>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: 12 }}>
                  Ngưỡng volatility
                </span>
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                  {volatilityThreshold.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={volatilityThreshold}
                onChange={(e) => setVolatilityThreshold(Number(e.target.value))}
                className="w-full"
              />
              <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                Ưu tiên thời điểm volatility {'<'} {volatilityThreshold.toFixed(1)}%
              </p>
            </div>
          </TrCard>
        )}

        {(strategy === 'gas-optimized' || strategy === 'hybrid') && (
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={18} color="#F59E0B" />
              <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                Gas Settings
              </h3>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: 12 }}>
                  Ngưỡng gas price
                </span>
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                  {gasPriceThreshold} gwei
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={gasPriceThreshold}
                onChange={(e) => setGasPriceThreshold(Number(e.target.value))}
                className="w-full"
              />
              <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                Ưu tiên thời điểm gas {'<'} {gasPriceThreshold} gwei
              </p>
            </div>
          </TrCard>
        )}

        {/* Enable Toggle */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                Kích hoạt Smart Scheduling
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>
                Tự động tối ưu thời gian thực thi
              </p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className="w-12 h-6 rounded-full transition-all"
              style={{
                background: enabled ? selectedStrategy?.color : c.divider,
              }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white transition-transform"
                style={{
                  transform: enabled ? 'translateX(24px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
        </TrCard>

        {/* Warning for Fixed Strategy */}
        {strategy === 'fixed' && (
          <TrCard
            className="p-3"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: '#F59E0B', fontSize: 11 }}>
                Chiến lược "Cố định" sẽ không tối ưu thời gian thực thi.
                Khuyên dùng "Hybrid" để có kết quả tốt nhất.
              </p>
            </div>
          </TrCard>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          style={{
            background: selectedStrategy?.color || '#8B5CF6',
          }}
        >
          <Save size={20} color="white" />
          <span style={{ color: 'white', fontSize: φ.base, fontWeight: 600 }}>
            Lưu cấu hình
          </span>
        </button>
      </PageContent>
    </PageLayout>
  );
}