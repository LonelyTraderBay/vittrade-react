/**
 * ══════════════════════════════════════════════════════════════
 *  CopyEducationPage — Phase 1: Educational Hub
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Standalone educational resource (accessible anytime)
 * - Interactive scenario simulators
 * - Fee calculator with real examples
 * - Common mistakes guide
 * - Regulatory notices
 * 
 * Compliance:
 * - No promotional language
 * - Balanced risk/reward presentation
 * - Real-world loss scenarios included
 * - Past performance disclaimers
 * - Educational, not investment advice
 * 
 * Guidelines:
 * - PageLayout + PageContent pattern
 * - TabBar for content navigation
 * - Trust-first, safety-by-design
 * - Interactive learning (not passive reading)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  BookOpen, DollarSign, TrendingDown, AlertTriangle, 
  Target, Users, Clock, Zap, Info, CheckCircle,
  XCircle, Shield, Calculator, BarChart3, Activity,
  TrendingUp, AlertCircle, ChevronRight, Eye
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

type TabType = 'how-it-works' | 'scenarios' | 'fees' | 'mistakes' | 'regulatory';

// Mock scenario data
const generateScenarioData = (type: 'profit' | 'loss' | 'slippage') => {
  const data = [];
  const baseValue = 10000;
  
  for (let i = 0; i <= 30; i++) {
    let providerValue = baseValue;
    let yourValue = baseValue;
    
    if (type === 'profit') {
      providerValue = baseValue + (i * 100);
      yourValue = baseValue + (i * 100) - (i * 8); // Fees + slippage
    } else if (type === 'loss') {
      providerValue = baseValue - (i * 80);
      yourValue = baseValue - (i * 85); // Slightly worse due to slippage
    } else if (type === 'slippage') {
      providerValue = baseValue + (i * 50);
      yourValue = baseValue + (i * 45); // 10% slippage impact
    }
    
    data.push({
      day: i,
      provider: providerValue,
      you: yourValue,
      label: i % 5 === 0 ? `D${i}` : '',
    });
  }
  
  return data;
};

export function CopyEducationPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [activeTab, setActiveTab] = useState<TabType>('how-it-works');
  
  // Scenario simulator state
  const [selectedScenario, setSelectedScenario] = useState<'profit' | 'loss' | 'slippage'>('profit');
  
  // Fee calculator state
  const [feeCapital, setFeeCapital] = useState(5000);
  const [feeProfit, setFeeProfit] = useState(15);
  const [feeTrades, setFeeTrades] = useState(50);

  // Calculate fees
  const platformFee = feeCapital * 0.001; // 0.1%
  const performanceFee = (feeCapital * (feeProfit / 100)) * 0.1; // 10% of profit
  const tradingFees = feeTrades * 2 * 0.0025 * (feeCapital / 50); // Avg trade size assumption
  const totalFees = platformFee + performanceFee + tradingFees;
  const grossProfit = feeCapital * (feeProfit / 100);
  const netProfit = grossProfit - totalFees;
  const effectiveFeePercent = (totalFees / grossProfit) * 100;

  const scenarioData = generateScenarioData(selectedScenario);
  const finalProvider = scenarioData[scenarioData.length - 1].provider;
  const finalYou = scenarioData[scenarioData.length - 1].you;
  const gap = finalProvider - finalYou;
  const gapPercent = ((gap / finalProvider) * 100).toFixed(1);

  return (
    <PageLayout>
      <Header title="Hướng dẫn Copy Trading" back />

      <PageContent gap="relaxed">
        {/* Intro Banner */}
        <div className="rounded-2xl p-4 flex gap-3" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
          <BookOpen size={24} color={c.primary} className="shrink-0" />
          <div>
            <h3 style={{ color: c.primary, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              Học trước khi đầu tư
            </h3>
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
              Trang này giúp bạn hiểu rõ cơ chế, rủi ro và chi phí của Copy Trading. 
              Không có gì thay thế được hiểu biết đầy đủ.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'how-it-works', label: 'Cơ chế' },
            { id: 'scenarios', label: 'Kịch bản' },
            { id: 'fees', label: 'Phí & Chi phí' },
            { id: 'mistakes', label: 'Sai lầm' },
            { id: 'regulatory', label: 'Quy định' },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* Tab Content */}
        {activeTab === 'how-it-works' && (
          <div className="flex flex-col gap-5">
            {/* How it Works */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Copy Trading hoạt động như thế nào?
              </h3>
              
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    icon: Users,
                    title: 'Chọn provider',
                    desc: 'Bạn chọn một provider (trader) dựa trên hiệu suất, chiến lược và risk level. Provider phải được xác minh và công khai thông tin.',
                    color: c.primary,
                  },
                  {
                    step: 2,
                    icon: Target,
                    title: 'Cấu hình sao chép',
                    desc: 'Bạn chọn số tiền copy, tỷ lệ sao chép (vd: 50% = provider mở $1000, bạn mở $500), và các giới hạn rủi ro (stop-loss, take-profit).',
                    color: c.primary,
                  },
                  {
                    step: 3,
                    icon: Zap,
                    title: 'Sao chép tự động',
                    desc: 'Khi provider mở/đóng lệnh, hệ thống tự động sao chép vào tài khoản của bạn trong vòng 0.5-3 giây. Giá có thể khác nhau (slippage).',
                    color: c.primary,
                  },
                  {
                    step: 4,
                    icon: Activity,
                    title: 'Theo dõi & điều chỉnh',
                    desc: 'Bạn có thể xem real-time P/L, tắt copy bất cứ lúc nào, hoặc điều chỉnh cấu hình. Các vị thế đang mở vẫn theo provider cho đến khi đóng.',
                    color: c.primary,
                  },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="flex gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: item.color + '15' }}
                      >
                        <span style={{ color: item.color, fontSize: 14, fontWeight: 700 }}>{item.step}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={14} color={c.text1} />
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.title}</p>
                        </div>
                        <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TrCard>

            {/* Copy Modes */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Các chế độ sao chép
              </h3>
              
              <div className="space-y-3">
                {[
                  {
                    mode: 'Mirror Copy',
                    desc: 'Sao chép chính xác tỷ lệ vị thế. Provider mở 10% portfolio, bạn cũng mở 10%.',
                    pros: 'Đơn giản, rủi ro tương tự provider',
                    cons: 'Không linh hoạt, phụ thuộc hoàn toàn vào provider',
                    color: '#3B82F6',
                  },
                  {
                    mode: 'Fixed Ratio',
                    desc: 'Bạn đặt tỷ lệ cố định (vd: 50%). Provider mở $1000, bạn mở $500.',
                    pros: 'Kiểm soát vốn tốt hơn, dễ tính toán',
                    cons: 'Vẫn phụ thuộc vào timing của provider',
                    color: '#10B981',
                  },
                  {
                    mode: 'Smart Copy',
                    desc: 'Hệ thống điều chỉnh size dựa trên volatility và risk của từng trade.',
                    pros: 'Tối ưu risk-adjusted returns',
                    cons: 'Phức tạp hơn, kết quả khác xa provider',
                    color: '#F59E0B',
                  },
                ].map(item => (
                  <div key={item.mode} className="p-3 rounded-xl" style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.mode}</p>
                    </div>
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4, marginBottom: 2 }}>
                      {item.desc}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-start gap-1">
                        <CheckCircle size={10} color="#10B981" className="mt-0.5" />
                        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3 }}>{item.pros}</p>
                      </div>
                      <div className="flex items-start gap-1">
                        <XCircle size={10} color="#EF4444" className="mt-0.5" />
                        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3 }}>{item.cons}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Key Concepts */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Khái niệm quan trọng
              </h3>
              
              <div className="space-y-2">
                {[
                  { 
                    term: 'Slippage', 
                    def: 'Chênh lệch giá giữa lệnh của provider và lệnh của bạn. Thường 0.05-0.2%. Trong thị trường biến động mạnh có thể lên 0.5-1%.',
                    icon: TrendingDown,
                  },
                  { 
                    term: 'High-Water Mark', 
                    def: 'Provider chỉ nhận performance fee trên profit mới (vượt đỉnh cũ). Nếu tài khoản $10k → $12k → $11k → $13k, fee chỉ tính trên $1k cuối.',
                    icon: TrendingUp,
                  },
                  { 
                    term: 'Position Sizing', 
                    def: 'Cách tính kích thước vị thế sao chép. Mirror = tỷ lệ %, Fixed = số tiền cố định, Smart = dynamic dựa trên risk.',
                    icon: Target,
                  },
                  { 
                    term: 'Execution Delay', 
                    def: 'Thời gian từ khi provider mở lệnh đến khi lệnh của bạn execute. Thường 0.5-3 giây. Delay cao → slippage cao.',
                    icon: Clock,
                  },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.term} className="flex gap-2">
                      <Icon size={14} color={c.primary} className="shrink-0 mt-0.5" />
                      <div>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.term}</p>
                        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{item.def}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TrCard>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="flex flex-col gap-5">
            {/* Scenario Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'profit', label: 'Lời', icon: TrendingUp, color: '#10B981' },
                { id: 'loss', label: 'Lỗ', icon: TrendingDown, color: '#EF4444' },
                { id: 'slippage', label: 'Slippage', icon: Activity, color: '#F59E0B' },
              ].map(s => {
                const Icon = s.icon;
                const isActive = selectedScenario === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenario(s.id as any)}
                    className="p-3 rounded-xl flex flex-col items-center gap-2 transition-all"
                    style={{
                      background: isActive ? s.color + '15' : c.surface2,
                      border: `1.5px solid ${isActive ? s.color : 'transparent'}`,
                    }}
                  >
                    <Icon size={20} color={isActive ? s.color : c.text3} />
                    <span style={{ 
                      color: isActive ? s.color : c.text2, 
                      fontSize: 12, 
                      fontWeight: isActive ? 600 : 500 
                    }}>
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
                  Kịch bản: {
                    selectedScenario === 'profit' ? 'Provider lời 30%' :
                    selectedScenario === 'loss' ? 'Provider lỗ 24%' :
                    'Slippage impact 10%'
                  }
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
                        <stop offset="5%" stopColor={c.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={c.primary} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="you-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
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
                      tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      key="tooltip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any, name: string) => [
                        `$${value.toFixed(0)}`, 
                        name === 'provider' ? 'Provider' : 'Bạn'
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
                  <p style={{ 
                    color: selectedScenario === 'loss' ? '#EF4444' : '#10B981', 
                    fontSize: 16, 
                    fontWeight: 700 
                  }}>
                    ${finalProvider.toFixed(0)}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 1 }}>Bạn</p>
                  <p style={{ 
                    color: selectedScenario === 'loss' ? '#EF4444' : '#10B981', 
                    fontSize: 16, 
                    fontWeight: 700 
                  }}>
                    ${finalYou.toFixed(0)}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 1 }}>Gap</p>
                  <p style={{ color: '#EF4444', fontSize: 16, fontWeight: 700 }}>
                    -{gapPercent}%
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <div className="p-3 rounded-xl" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
                <p style={{ color: c.warningText, fontSize: 11, lineHeight: 1.5 }}>
                  {selectedScenario === 'profit' && (
                    <>Provider lời 30%, nhưng bạn chỉ lời ~22% do phí (platform + performance + trading) và slippage. 
                    <strong> Gap ~8% là chi phí thực tế của Copy Trading.</strong></>
                  )}
                  {selectedScenario === 'loss' && (
                    <>Provider lỗ 24%, bạn lỗ ~25.5% do slippage làm kết quả tệ hơn. 
                    <strong> Trong thị trường xấu, bạn có thể lỗ nhiều hơn provider.</strong></>
                  )}
                  {selectedScenario === 'slippage' && (
                    <>Slippage 10% có nghĩa là nếu provider lời $1500, bạn chỉ lời $1350 (~$150 mất do execution delay). 
                    <strong> Slippage cao trong thị trường biến động hoặc provider trade quá nhanh.</strong></>
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
                  <div key={idx} className="p-3 rounded-xl" style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle size={14} color={scenario.color} className="shrink-0 mt-0.5" />
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{scenario.title}</p>
                    </div>
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4, marginBottom: 2 }}>
                      {scenario.desc}
                    </p>
                    <div className="flex items-center gap-1">
                      <span style={{ color: c.text3, fontSize: 10 }}>Impact:</span>
                      <span style={{ color: scenario.color, fontSize: 10, fontWeight: 600 }}>{scenario.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="flex flex-col gap-5">
            {/* Fee Calculator */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Máy tính phí
              </h3>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Số vốn copy (USD)
                  </label>
                  <input
                    type="number"
                    value={feeCapital}
                    onChange={(e) => setFeeCapital(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 14,
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Lợi nhuận dự kiến (%)
                  </label>
                  <input
                    type="number"
                    value={feeProfit}
                    onChange={(e) => setFeeProfit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 14,
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Số lượng trades (30 ngày)
                  </label>
                  <input
                    type="number"
                    value={feeTrades}
                    onChange={(e) => setFeeTrades(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              {/* Results */}
              <div className="p-4 rounded-xl" style={{ background: c.surface2 }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ color: c.text3, fontSize: 11 }}>Platform fee (0.1%)</span>
                  <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ color: c.text3, fontSize: 11 }}>Performance fee (10% of profit)</span>
                  <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>${performanceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span style={{ color: c.text3, fontSize: 11 }}>Trading fees (~0.25%)</span>
                  <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>${tradingFees.toFixed(2)}</span>
                </div>
                <div className="h-px mb-3" style={{ background: c.border }} />
                <div className="flex justify-between items-center mb-2">
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Tổng phí</span>
                  <span style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>${totalFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Lợi nhuận gross</span>
                  <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>${grossProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Lợi nhuận NET</span>
                  <span style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>${netProfit.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-xl" style={{ background: c.primary + '15' }}>
                <p style={{ color: c.primary, fontSize: 11, lineHeight: 1.4 }}>
                  <strong>Phí thực tế: {effectiveFeePercent.toFixed(1)}%</strong> của lợi nhuận. 
                  Chưa tính slippage (thường thêm 0.5-2%).
                </p>
              </div>
            </TrCard>

            {/* Fee Structure Breakdown */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Chi tiết cấu trúc phí
              </h3>
              
              <div className="space-y-3">
                {[
                  {
                    fee: 'Platform Fee (0.1%)',
                    when: 'Tính khi bắt đầu copy',
                    example: 'Copy $10,000 → phí $10',
                    note: 'Không hoàn lại nếu dừng copy sớm',
                  },
                  {
                    fee: 'Performance Fee (10%)',
                    when: 'Tính hàng tháng trên profit',
                    example: 'Lời $1,000 → phí $100',
                    note: 'High-water mark: chỉ tính trên profit mới',
                  },
                  {
                    fee: 'Trading Fee (0.25%)',
                    when: 'Mỗi lần mở/đóng lệnh',
                    example: '50 trades/tháng, size trung bình $2k → phí ~$25',
                    note: 'Cao nếu provider trade thường xuyên',
                  },
                  {
                    fee: 'Slippage (0.5-2%)',
                    when: 'Mỗi lệnh (không phải phí, là chi phí ẩn)',
                    example: 'Provider mua $100, bạn mua $100.50 → slippage $0.50',
                    note: 'Cao trong thị trường biến động',
                  },
                ].map(item => (
                  <div key={item.fee} className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{item.fee}</p>
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <span style={{ color: c.text3, fontSize: 10 }}>Khi nào:</span>
                        <span style={{ color: c.text2, fontSize: 10 }}>{item.when}</span>
                      </div>
                      <div className="flex gap-2">
                        <span style={{ color: c.text3, fontSize: 10 }}>Ví dụ:</span>
                        <span style={{ color: c.text2, fontSize: 10 }}>{item.example}</span>
                      </div>
                      <div className="flex gap-2">
                        <span style={{ color: c.text3, fontSize: 10 }}>Lưu ý:</span>
                        <span style={{ color: c.text2, fontSize: 10 }}>{item.note}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="flex flex-col gap-5">
            {/* Common Mistakes */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                10 sai lầm phổ biến
              </h3>
              
              <div className="space-y-3">
                {[
                  {
                    mistake: 'Chỉ nhìn ROI, không nhìn Max Drawdown',
                    why: 'Provider có ROI 200% nhưng Max DD 60% = bạn có thể mất 60% vốn trước khi phục hồi.',
                    fix: 'Chọn provider có Max DD <25%, Win Rate >55%, Sharpe Ratio >1.5',
                    severity: 'critical',
                  },
                  {
                    mistake: 'Copy 100% vốn vào 1 provider',
                    why: 'Nếu provider đột nhiên thay đổi chiến lược hoặc có string of losses, bạn mất tất cả.',
                    fix: 'Không copy quá 20% vốn cho 1 provider. Chia đều cho 3-5 providers.',
                    severity: 'critical',
                  },
                  {
                    mistake: 'Không đặt stop-loss riêng',
                    why: 'Provider có thể chấp nhận DD 50%, nhưng bạn chỉ chấp nhận 15%. Dùng stop của provider = risk không match.',
                    fix: 'Đặt stop-loss chặt hơn provider nếu risk tolerance thấp',
                    severity: 'high',
                  },
                  {
                    mistake: 'Copy provider mới (<3 tháng track record)',
                    why: 'Track record ngắn có thể do may mắn hoặc demo account. Chưa qua thị trường xấu.',
                    fix: 'Chỉ copy provider có >6 tháng verified track record',
                    severity: 'high',
                  },
                  {
                    mistake: 'Không theo dõi, để "auto-pilot"',
                    why: 'Provider có thể thay đổi chiến lược, tăng leverage, hoặc gặp vấn đề. Bạn không biết cho đến khi quá muộn.',
                    fix: 'Check portfolio ít nhất 2-3 lần/tuần, set alert cho DD >10%',
                    severity: 'medium',
                  },
                  {
                    mistake: 'Dừng copy ngay khi lỗ',
                    why: 'Copy Trading cần thời gian. Dừng ngay khi lỗ 5-10% = bạn chỉ chịu loss, không hưởng recovery.',
                    fix: 'Commit ít nhất 1-3 tháng, trừ khi provider vi phạm risk limits',
                    severity: 'medium',
                  },
                  {
                    mistake: 'Copy nhiều provider cùng strategy',
                    why: 'Copy 5 providers đều scalping BTC/USDT = không diversify, risk vẫn tập trung.',
                    fix: 'Diversify cả strategy (scalping/swing/arbitrage) và assets (BTC/ETH/alts)',
                    severity: 'medium',
                  },
                  {
                    mistake: 'Không đọc conflict of interest disclosure',
                    why: 'Provider có thể nhận spread rebate, trade cho chính mình trước followers, hoặc có lợi ích khác.',
                    fix: 'Đọc kỹ disclosure, tránh provider có conflict chưa công khai',
                    severity: 'medium',
                  },
                  {
                    mistake: 'Copy trong thị trường sideways/low volatility',
                    why: 'Provider scalper cần volatility để lời. Thị trường sideways → nhiều trades, ít lời, phí cao.',
                    fix: 'Chọn provider phù hợp với điều kiện thị trường hiện tại',
                    severity: 'low',
                  },
                  {
                    mistake: 'Quên tính thuế',
                    why: 'Copy trading generate rất nhiều trades → nhiều taxable events. Có thể nợ thuế dù tổng thể lỗ.',
                    fix: 'Consult tax advisor, export audit trail để khai thuế đúng',
                    severity: 'low',
                  },
                ].map((item, idx) => {
                  const severityColor = item.severity === 'critical' ? '#EF4444' : item.severity === 'high' ? '#F59E0B' : '#6B7280';
                  return (
                    <div key={idx} className="p-3 rounded-xl" style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
                      <div className="flex items-start gap-2 mb-2">
                        <div className="shrink-0 mt-0.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: severityColor + '22' }}>
                            <span style={{ color: severityColor, fontSize: 10, fontWeight: 700 }}>{idx + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 1 }}>
                            {item.mistake}
                          </p>
                          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>
                            <strong style={{ color: c.text2 }}>Tại sao sai:</strong> {item.why}
                          </p>
                          <div className="flex items-start gap-1">
                            <CheckCircle size={10} color="#10B981" className="shrink-0 mt-0.5" />
                            <p style={{ color: '#10B981', fontSize: 10, lineHeight: 1.4 }}>
                              <strong>Cách fix:</strong> {item.fix}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TrCard>
          </div>
        )}

        {activeTab === 'regulatory' && (
          <div className="flex flex-col gap-5">
            {/* Regulatory Framework */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Khung pháp lý
              </h3>
              
              <div className="space-y-3">
                {[
                  {
                    regulation: 'MiFID II (EU)',
                    applies: 'Markets in Financial Instruments Directive',
                    requirements: [
                      'Appropriateness assessment trước khi copy (Art. 25.3)',
                      'Provider phải công khai: compensation, conflicts, performance',
                      'Cooling-off period 24-48h cho first-time copiers',
                      'Past performance disclaimers bắt buộc',
                    ],
                  },
                  {
                    regulation: 'ESMA Guidelines',
                    applies: 'European Securities and Markets Authority',
                    requirements: [
                      'Risk warnings phải rõ ràng, nổi bật',
                      'Max Drawdown phải hiển thị cùng ROI',
                      'Không được dùng ngôn ngữ hype/FOMO',
                      'Investor protection: circuit breakers, position limits',
                    ],
                  },
                  {
                    regulation: 'Local Regulations',
                    applies: 'Tùy thuộc vào quốc gia',
                    requirements: [
                      'Một số quốc gia cấm Copy Trading hoàn toàn',
                      'KYC/AML requirements khác nhau',
                      'Tax reporting obligations',
                      'Investor compensation schemes (nếu có)',
                    ],
                  },
                ].map(item => (
                  <div key={item.regulation} className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={14} color={c.primary} />
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.regulation}</p>
                    </div>
                    <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>{item.applies}</p>
                    <ul className="space-y-1">
                      {item.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <div className="w-1 h-1 rounded-full mt-1.5" style={{ background: c.primary }} />
                          <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Your Rights */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Quyền lợi của bạn
              </h3>
              
              <div className="space-y-2">
                {[
                  'Được đánh giá appropriateness trước khi copy',
                  'Được cooling-off period để suy nghĩ',
                  'Được access đầy đủ performance history và risk metrics',
                  'Được biết tất cả conflicts of interest của provider',
                  'Được dừng copy bất cứ lúc nào (vị thế đang mở sẽ theo provider)',
                  'Được export audit trail cho tax reporting',
                  'Được khiếu nại nếu provider vi phạm disclosure obligations',
                  'Được investor protection (tùy jurisdictions)',
                ].map((right, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle size={14} color="#10B981" className="shrink-0 mt-0.5" />
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{right}</p>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Disclaimers */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
              <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.6, textAlign: 'center' }}>
                <strong style={{ color: c.text1 }}>Investment Disclaimer:</strong> Copy Trading không phải là lời khuyên đầu tư. 
                Provider không phải investment advisor được cấp phép. Hiệu suất quá khứ không đảm bảo kết quả tương lai. 
                Bạn có thể mất toàn bộ vốn đầu tư. Chỉ đầu tư số tiền bạn có thể chấp nhận mất. 
                Platform không chịu trách nhiệm cho kết quả copy trading của bạn.
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate(`${prefix}/trade/copy-trading`)}
          className="w-full rounded-xl flex items-center justify-center gap-2"
          style={{
            background: c.primary,
            color: '#fff',
            height: 48,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <Eye size={16} />
          <span>Xem danh sách providers</span>
        </button>
      </PageContent>
    </PageLayout>
  );
}