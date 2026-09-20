import React, { useState } from 'react';
import { RotateCw, TrendingUp, Calendar, DollarSign, Zap, Info, Settings } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd } from '../../data/formatNumber';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useIsDark } from '../../hooks/useIsDark';

interface Position {
  id: string;
  product: string;
  asset: string;
  amount: number;
  autoCompound: boolean;
}

interface ComparisonData {
  month: number;
  withCompound: number;
  withoutCompound: number;
}

const POSITIONS: Position[] = [
  { id: 'p1', product: 'USDT Flexible', asset: 'USDT', amount: 2500, autoCompound: true },
  { id: 'p2', product: 'BTC Fixed 90D', asset: 'BTC', amount: 0.05, autoCompound: false },
  { id: 'p3', product: 'ETH Fixed 60D', asset: 'ETH', amount: 1.5, autoCompound: true },
  { id: 'p4', product: 'SOL Fixed 30D', asset: 'SOL', amount: 50, autoCompound: false },
];

const generateComparisonData = (principal: number, apy: number, months: number): ComparisonData[] => {
  const data: ComparisonData[] = [];
  const monthlyRate = apy / 100 / 12;
  
  for (let m = 0; m <= months; m++) {
    // With compound
    const withCompound = principal * Math.pow(1 + monthlyRate, m);
    
    // Without compound (simple interest)
    const withoutCompound = principal * (1 + monthlyRate * m);
    
    data.push({
      month: m,
      withCompound,
      withoutCompound,
    });
  }
  
  return data;
};

export function StakingAutoCompoundPage() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [minThreshold, setMinThreshold] = useState('10');
  const [gasOptimization, setGasOptimization] = useState(true);
  
  const [simulationPrincipal, setSimulationPrincipal] = useState('1000');
  const [simulationAPY, setSimulationAPY] = useState('7.5');
  const [simulationMonths, setSimulationMonths] = useState('12');

  const comparisonData = generateComparisonData(
    parseFloat(simulationPrincipal || '1000'),
    parseFloat(simulationAPY || '7.5'),
    parseInt(simulationMonths || '12')
  );

  const finalWithCompound = comparisonData[comparisonData.length - 1].withCompound;
  const finalWithoutCompound = comparisonData[comparisonData.length - 1].withoutCompound;
  const difference = finalWithCompound - finalWithoutCompound;
  const percentageGain = (difference / finalWithoutCompound) * 100;

  const activePositions = POSITIONS.filter(p => p.autoCompound).length;
  const totalPositions = POSITIONS.length;

  return (
    <PageLayout>
      <Header title="Auto-Compound" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
          <div className="flex gap-3">
            <RotateCw size={20} color="#10B981" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Tự động Tái đầu tư
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Auto-compound tự động thêm phần thưởng vào số lượng stake để tối đa hóa lợi nhuận kép. APY thực tế sẽ cao hơn APY danh nghĩa.
              </p>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>
                Auto-compound đang bật
              </p>
              <p style={{ color: c.text1, fontSize: 24, fontWeight: 700 }}>
                {activePositions}/{totalPositions}
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>positions</p>
            </div>
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.12)', border: '3px solid rgba(16,185,129,0.3)' }}>
              <RotateCw size={36} color="#10B981" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Tần suất</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                {frequency === 'daily' ? 'Hàng ngày' : frequency === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Ngưỡng tối thiểu</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                ${minThreshold}
              </p>
            </div>
          </div>
        </TrCard>

        {/* Settings */}
        <PageSection label="Cài đặt Auto-Compound">
          <TrCard className="p-4">
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 8 }}>
                  Tần suất tái đầu tư
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'daily' as const, label: 'Hàng ngày', desc: 'APY cao nhất' },
                    { id: 'weekly' as const, label: 'Hàng tuần', desc: 'Cân bằng' },
                    { id: 'monthly' as const, label: 'Hàng tháng', desc: 'Tiết kiệm gas' },
                  ].map(freq => (
                    <button
                      key={freq.id}
                      onClick={() => setFrequency(freq.id)}
                      className="flex-1 p-3 rounded-xl text-left"
                      style={{
                        background: frequency === freq.id ? 'rgba(16,185,129,0.12)' : c.surface2,
                        border: `1.5px solid ${frequency === freq.id ? '#10B981' : c.borderSolid}`,
                      }}>
                      <p style={{
                        color: frequency === freq.id ? '#10B981' : c.text1,
                        fontSize: 13,
                        fontWeight: 700,
                        marginBottom: 2,
                      }}>
                        {freq.label}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>{freq.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 8 }}>
                  Ngưỡng tối thiểu (USD)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={minThreshold}
                  onChange={e => setMinThreshold(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: c.surface2,
                    border: `1px solid ${c.borderSolid}`,
                    color: c.text1,
                    fontSize: 15,
                    fontFamily: 'monospace',
                  }}
                />
                <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>
                  Chỉ tái đầu tư khi phần thưởng ≥ ${minThreshold}
                </p>
              </div>

              <button
                onClick={() => setGasOptimization(!gasOptimization)}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: c.surface2 }}>
                <div
                  className="w-5 h-5 rounded-md border flex items-center justify-center"
                  style={{
                    borderColor: gasOptimization ? '#10B981' : c.borderSolid,
                    background: gasOptimization ? '#10B981' : 'transparent',
                  }}>
                  {gasOptimization && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Tối ưu Gas Fee</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    Chỉ compound khi gas fee thấp (tiết kiệm ~30-50%)
                  </p>
                </div>
              </button>

              <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="flex gap-2">
                  <Info size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    <strong>Gợi ý:</strong> Tần suất Daily cho APY tối đa. Weekly cân bằng giữa APY và gas fee. Monthly tiết kiệm gas nhất nhưng APY thấp hơn.
                  </p>
                </div>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Position Settings */}
        <PageSection label="Vị thế Auto-Compound">
          <div className="flex flex-col gap-3">
            {POSITIONS.map(position => (
              <TrCard key={position.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                      {position.product}
                    </p>
                    <p style={{ color: c.text3, fontSize: 12 }}>
                      {position.amount} {position.asset}
                    </p>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={position.autoCompound}
                      onChange={() => {}}
                      className="opacity-0 w-0 h-0"
                    />
                    <span
                      className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all"
                      style={{
                        background: position.autoCompound ? '#10B981' : c.borderSolid,
                      }}>
                      <span
                        className="absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-all"
                        style={{
                          transform: position.autoCompound ? 'translateX(24px)' : 'translateX(0)',
                        }}
                      />
                    </span>
                  </label>
                </div>
                {position.autoCompound && (
                  <div className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <Zap size={14} color="#10B981" />
                    <p style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                      Auto-compound đang bật • {frequency === 'daily' ? 'Hàng ngày' : frequency === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
                    </p>
                  </div>
                )}
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Simulation */}
        <PageSection label="Mô phỏng Lợi nhuận Kép">
          <TrCard className="p-4">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={{ color: c.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Số lượng gốc
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={simulationPrincipal}
                    onChange={e => setSimulationPrincipal(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg outline-none text-center"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.borderSolid}`,
                      color: c.text1,
                      fontSize: 13,
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: c.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    APY (%)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={simulationAPY}
                    onChange={e => setSimulationAPY(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg outline-none text-center"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.borderSolid}`,
                      color: c.text1,
                      fontSize: 13,
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: c.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Tháng
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={simulationMonths}
                    onChange={e => setSimulationMonths(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg outline-none text-center"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.borderSolid}`,
                      color: c.text1,
                      fontSize: 13,
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={comparisonData}>
                  <CartesianGrid
                    key="grid"
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                    vertical={false}
                  />
                  <XAxis
                    key="x-axis"
                    dataKey="month"
                    stroke={c.text3}
                    tick={{ fill: c.text3, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Tháng', position: 'insideBottom', offset: -5, fill: c.text3, fontSize: 11 }}
                  />
                  <YAxis
                    key="y-axis"
                    stroke={c.text3}
                    tick={{ fill: c.text3, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.borderSolid}`,
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                      name === 'withCompound' ? 'Có compound' : 'Không compound'
                    ]}
                  />
                  <Line
                    key="compound-line-with"
                    type="monotone"
                    dataKey="withCompound"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    key="compound-line-without"
                    type="monotone"
                    dataKey="withoutCompound"
                    stroke="#EF4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-0.5 rounded" style={{ background: '#10B981' }} />
                    <p style={{ color: c.text3, fontSize: 10 }}>Có compound</p>
                  </div>
                  <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtUsd(finalWithCompound)}
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-0.5 rounded" style={{ background: '#EF4444', borderTop: '2px dashed #EF4444' }} />
                    <p style={{ color: c.text3, fontSize: 10 }}>Không compound</p>
                  </div>
                  <p style={{ color: '#EF4444', fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtUsd(finalWithoutCompound)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Lợi thế compound</p>
                <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
                  +{fmtUsd(difference)}
                </p>
                <p style={{ color: c.text3, fontSize: 11 }}>
                  (+{percentageGain.toFixed(2)}% cao hơn)
                </p>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Save Button */}
        <button
          className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
          style={{ background: c.primary, color: '#FFF' }}>
          <Settings size={18} />
          Lưu cài đặt
        </button>

        {/* Footer Info */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Auto-compound hoạt động tự động 24/7. Phần thưởng sẽ được tự động thêm vào số lượng stake theo tần suất đã chọn. Bạn có thể tắt bất kỳ lúc nào mà không mất phần thưởng đã tích lũy.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}