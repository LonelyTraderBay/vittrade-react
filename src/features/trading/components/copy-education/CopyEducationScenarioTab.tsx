import { Activity, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

type Scenario = 'profit' | 'loss' | 'slippage';

function generateScenarioData(type: Scenario) {
  const data = [];
  const baseValue = 10000;
  for (let i = 0; i <= 30; i++) {
    const [providerValue, yourValue] =
      type === 'profit'
        ? [baseValue + i * 100, baseValue + i * 100 - i * 8]
        : type === 'loss'
          ? [baseValue - i * 80, baseValue - i * 85]
          : [baseValue + i * 50, baseValue + i * 45];
    data.push({
      day: i,
      provider: providerValue,
      you: yourValue,
      label: i % 5 === 0 ? 'D' + i : '',
    });
  }
  return data;
}

export function CopyEducationScenarioTab() {
  const c = useThemeColors();
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('profit');
  const scenarioData = generateScenarioData(selectedScenario);
  const finalProvider = scenarioData[scenarioData.length - 1].provider;
  const finalYou = scenarioData[scenarioData.length - 1].you;
  const gap = finalProvider - finalYou;
  const gapPercent = ((gap / finalProvider) * 100).toFixed(1);
  return (
    <div className="flex flex-col gap-5">
      {/* Scenario Selector */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'profit', label: 'Lời', icon: TrendingUp, color: '#10B981' },
          { id: 'loss', label: 'Lỗ', icon: TrendingDown, color: '#EF4444' },
          { id: 'slippage', label: 'Slippage', icon: Activity, color: '#F59E0B' },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = selectedScenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(s.id as 'profit' | 'loss' | 'slippage')}
              className="p-3 rounded-xl flex flex-col items-center gap-2 transition-all"
              style={{
                background: isActive ? s.color + '15' : c.surface2,
                border: `1.5px solid ${isActive ? s.color : 'transparent'}`,
              }}
            >
              <Icon size={20} color={isActive ? s.color : c.text3} />
              <span
                style={{
                  color: isActive ? s.color : c.text2,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scenario Chart */}
      <TrCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
            Kịch bản:{' '}
            {selectedScenario === 'profit'
              ? 'Provider lời 30%'
              : selectedScenario === 'loss'
                ? 'Provider lỗ 24%'
                : 'Slippage impact 10%'}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: c.primary }} />
              <span style={{ color: c.text3, fontSize: 10 }}>Provider</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#F59E0B' }} />
              <span style={{ color: c.text3, fontSize: 10 }}>Bạn</span>
            </div>
          </div>
        </div>

        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scenarioData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs key="gradient-defs">
                <linearGradient id="provider-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={c.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="you-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.border} />
              <XAxis
                key="x-axis"
                dataKey="label"
                tick={{ fill: c.text3, fontSize: 9 }}
                stroke={c.border}
              />
              <YAxis
                key="y-axis"
                tick={{ fill: c.text3, fontSize: 9 }}
                stroke={c.border}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value, name) => [
                  `$${Number(value).toFixed(0)}`,
                  name === 'provider' ? 'Provider' : 'Bạn',
                ]}
              />
              <Area
                key="area-provider"
                type="monotone"
                dataKey="provider"
                stroke={c.primary}
                strokeWidth={2}
                fill="url(#provider-grad)"
              />
              <Area
                key="area-you"
                type="monotone"
                dataKey="you"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#you-grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Results */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 rounded-lg" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 1 }}>Provider</p>
            <p
              style={{
                color: selectedScenario === 'loss' ? '#EF4444' : '#10B981',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              ${finalProvider.toFixed(0)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 1 }}>Bạn</p>
            <p
              style={{
                color: selectedScenario === 'loss' ? '#EF4444' : '#10B981',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              ${finalYou.toFixed(0)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 1 }}>Gap</p>
            <p style={{ color: '#EF4444', fontSize: 16, fontWeight: 700 }}>-{gapPercent}%</p>
          </div>
        </div>

        {/* Explanation */}
        <div
          className="p-3 rounded-xl"
          style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}
        >
          <p style={{ color: c.warningText, fontSize: 11, lineHeight: 1.5 }}>
            {selectedScenario === 'profit' && (
              <>
                Provider lời 30%, nhưng bạn chỉ lời ~22% do phí (platform + performance + trading)
                và slippage.
                <strong> Gap ~8% là chi phí thực tế của Copy Trading.</strong>
              </>
            )}
            {selectedScenario === 'loss' && (
              <>
                Provider lỗ 24%, bạn lỗ ~25.5% do slippage làm kết quả tệ hơn.
                <strong> Trong thị trường xấu, bạn có thể lỗ nhiều hơn provider.</strong>
              </>
            )}
            {selectedScenario === 'slippage' && (
              <>
                Slippage 10% có nghĩa là nếu provider lời $1500, bạn chỉ lời $1350 (~$150 mất do
                execution delay).
                <strong>
                  {' '}
                  Slippage cao trong thị trường biến động hoặc provider trade quá nhanh.
                </strong>
              </>
            )}
          </p>
        </div>
      </TrCard>

      {/* Real-World Scenarios */}
      <TrCard className="p-4">
        <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Kịch bản thực tế
        </h3>

        <div className="space-y-3">
          {[
            {
              title: 'Provider thay đổi chiến lược đột ngột',
              desc: 'Provider ban đầu swing trade (giữ 1-2 ngày), sau đó chuyển sang scalping (giữ 1-2 giờ). Bạn không kịp điều chỉnh, slippage tăng vọt từ 0.1% lên 0.5%.',
              impact: 'Loss thêm 3-5% do slippage',
              color: '#EF4444',
            },
            {
              title: 'Flash crash + stop-loss cascade',
              desc: 'BTC flash crash 15% trong 2 phút. Provider có stop-loss 5%, bạn cũng vậy. Nhưng do execution delay, stop của bạn trigger ở mức thấp hơn 2%.',
              impact: 'Loss thêm 2% so với provider',
              color: '#EF4444',
            },
            {
              title: 'Provider đóng nền tảng, mở exchange khác',
              desc: 'Provider chuyển từ Binance sang exchange khác với liquidity thấp hơn. Bạn vẫn copy trên Binance, nhưng trades không còn match.',
              impact: 'Copy bị dừng, vị thế stuck',
              color: '#F59E0B',
            },
            {
              title: 'Pump & dump coin nhỏ',
              desc: 'Provider trade altcoin có market cap thấp. Lệnh của provider ($50k) không ảnh hưởng giá, nhưng lệnh aggregate của 200 followers ($10M) làm giá pump, rồi dump ngay.',
              impact: 'Followers mua cao, bán thấp',
              color: '#EF4444',
            },
          ].map((scenario, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl"
              style={{ background: c.surface2, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={14} color={scenario.color} className="shrink-0 mt-0.5" />
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{scenario.title}</p>
              </div>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4, marginBottom: 2 }}>
                {scenario.desc}
              </p>
              <div className="flex items-center gap-1">
                <span style={{ color: c.text3, fontSize: 10 }}>Impact:</span>
                <span style={{ color: scenario.color, fontSize: 10, fontWeight: 600 }}>
                  {scenario.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </TrCard>
    </div>
  );
}
