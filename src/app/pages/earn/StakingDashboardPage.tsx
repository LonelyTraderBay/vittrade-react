import React, { useState } from 'react';
import { TrendingUp, Wallet, DollarSign, Calendar, Zap, Lock, ArrowRight, Download, RefreshCw, Plus } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useIsDark } from '../../hooks/useIsDark';

interface Position {
  id: string;
  product: string;
  asset: string;
  type: 'flexible' | 'fixed' | 'defi';
  amount: number;
  usdValue: number;
  earned: number;
  earnedUsd: number;
  apy: number;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'maturing' | 'completed';
  color: string;
}

interface PerformanceData {
  date: string;
  value: number;
  earned: number;
}

const POSITIONS: Position[] = [
  { id: 'p1', product: 'BTC Fixed 90D', asset: 'BTC', type: 'fixed', amount: 0.05, usdValue: 3377, earned: 0.00029, earnedUsd: 19.58, apy: 5.8, startDate: '01/01/2026', endDate: '01/04/2026', status: 'active', color: '#F7931A' },
  { id: 'p2', product: 'USDT Flexible', asset: 'USDT', type: 'flexible', amount: 2500, usdValue: 2500, earned: 18.74, earnedUsd: 18.74, apy: 6.5, startDate: '15/01/2026', endDate: null, status: 'active', color: '#26A17B' },
  { id: 'p3', product: 'ETH Fixed 60D', asset: 'ETH', type: 'fixed', amount: 1.5, usdValue: 4200, earned: 0.035, earnedUsd: 98, apy: 7.2, startDate: '20/01/2026', endDate: '21/03/2026', status: 'maturing', color: '#627EEA' },
  { id: 'p4', product: 'SOL Fixed 30D', asset: 'SOL', type: 'fixed', amount: 50, usdValue: 6500, earned: 1.2, earnedUsd: 156, apy: 9.8, startDate: '01/02/2026', endDate: '03/03/2026', status: 'maturing', color: '#9945FF' },
  { id: 'p5', product: 'ETH-USDT LP', asset: 'LP', type: 'defi', amount: 1000, usdValue: 1000, earned: 23.5, earnedUsd: 23.5, apy: 18.7, startDate: '10/02/2026', endDate: null, status: 'active', color: '#06B6D4' },
];

const PERFORMANCE_DATA: PerformanceData[] = [
  { date: '01/01', value: 15000, earned: 0 },
  { date: '15/01', value: 15120, earned: 120 },
  { date: '01/02', value: 15280, earned: 280 },
  { date: '15/02', value: 15450, earned: 450 },
  { date: '01/03', value: 15640, earned: 640 },
  { date: '07/03', value: 15577, earned: 315.82 }, // Today
];

export function StakingDashboardPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const isDark = useIsDark();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalStaked = POSITIONS.reduce((sum, p) => sum + p.usdValue, 0);
  const totalEarned = POSITIONS.reduce((sum, p) => sum + p.earnedUsd, 0);
  const weightedAPY = POSITIONS.reduce((sum, p) => sum + (p.apy * p.usdValue), 0) / totalStaked;
  
  const dailyEarnings = totalStaked * (weightedAPY / 100 / 365);
  const monthlyEarnings = dailyEarnings * 30;
  const yearlyProjection = dailyEarnings * 365;

  const activePositions = POSITIONS.filter(p => p.status === 'active').length;
  const maturingSoon = POSITIONS.filter(p => p.status === 'maturing').length;

  // Allocation pie chart data
  const allocationData = POSITIONS.map(p => ({
    name: p.asset,
    value: p.usdValue,
    color: p.color,
  }));

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleExport = () => {
    alert('Xuất báo cáo CSV/PDF sẽ sớm ra mắt');
  };

  return (
    <PageLayout>
      <Header title="Staking Dashboard" back />

      <PageContent>
        {/* Summary Card */}
        <TrCard variant="hero" rounded="lg" className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 4 }}>
                Tổng giá trị Staking
              </p>
              <p style={{ color: '#FFF', fontSize: 32, fontWeight: 800, fontFamily: 'monospace' }}>
                {fmtUsd(totalStaked)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                <RefreshCw
                  size={18}
                  color="#FFF"
                  className={isRefreshing ? 'animate-spin' : ''}
                />
              </button>
              <button
                onClick={handleExport}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                <Download size={18} color="#FFF" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl p-3"
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
              }}>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 4 }}>
                Tổng thu nhập
              </p>
              <p style={{ color: '#34D399', fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                +{fmtUsd(totalEarned)}
              </p>
            </div>
            <div className="rounded-xl p-3"
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
              }}>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 4 }}>
                APY trung bình
              </p>
              <p style={{ color: '#60A5FA', fontSize: 18, fontWeight: 700 }}>
                {weightedAPY.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-xl p-3"
              style={{
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 4 }}>
                Vị thế
              </p>
              <p style={{ color: '#FBBF24', fontSize: 18, fontWeight: 700 }}>
                {activePositions} active
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 2 }}>
                Hàng ngày
              </p>
              <p style={{ color: '#34D399', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                +{fmtUsd(dailyEarnings)}
              </p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 2 }}>
                Hàng tháng
              </p>
              <p style={{ color: '#34D399', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                +{fmtUsd(monthlyEarnings)}
              </p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 2 }}>
                Hàng năm
              </p>
              <p style={{ color: '#34D399', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                +{fmtUsd(yearlyProjection)}
              </p>
            </div>
          </div>
        </TrCard>

        {/* Performance Chart */}
        <PageSection label="Biểu đồ Hiệu suất (6 tháng)">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={PERFORMANCE_DATA}>
                <CartesianGrid
                  key="grid"
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                  vertical={false}
                />
                <XAxis
                  key="x-axis"
                  dataKey="date"
                  stroke={c.text3}
                  tick={{ fill: c.text3, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  key="y-axis"
                  stroke={c.text3}
                  tick={{ fill: c.text3, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  key="tooltip"
                  contentStyle={{
                    background: c.surface,
                    border: `1px solid ${c.borderSolid}`,
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'value') return [`$${value.toLocaleString()}`, 'Tổng giá trị'];
                    return [`+$${value.toFixed(2)}`, 'Lợi nhuận'];
                  }}
                />
                <Line
                  key="dashboard-line-value"
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  key="dashboard-line-earned"
                  type="monotone"
                  dataKey="earned"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: '#3B82F6' }} />
                <span style={{ color: c.text3, fontSize: 11 }}>Tổng giá trị</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: '#10B981', borderTop: '2px dashed #10B981' }} />
                <span style={{ color: c.text3, fontSize: 11 }}>Lợi nhuận</span>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Asset Allocation */}
        <PageSection label="Phân bổ Tài sản">
          <TrCard className="p-4">
            <div className="flex items-center gap-4">
              <div style={{ width: 120, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      key="dashboard-pie"
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value">
                      {allocationData.map((entry, index) => (
                        <Cell key={`dashboard-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip key="pie-tooltip" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                {allocationData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.name}</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        {((item.value / totalStaked) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Active Positions */}
        <PageSection label={`Vị thế Hoạt động (${POSITIONS.length})`}>
          <div className="flex flex-col gap-3">
            {POSITIONS.map(pos => {
              const daysLeft = pos.endDate
                ? Math.ceil((new Date(pos.endDate.split('/').reverse().join('-')).getTime() - Date.now()) / 86400000)
                : null;
              
              return (
                <TrCard key={pos.id} hover className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: `${pos.color}22`, border: `1.5px solid ${pos.color}44` }}>
                        <span style={{ color: pos.color, fontSize: 10, fontWeight: 700 }}>
                          {pos.asset.slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }} className="text-truncate">
                            {pos.product}
                          </p>
                          {pos.status === 'maturing' && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold shrink-0"
                              style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                              {daysLeft} ngày nữa
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {pos.type === 'fixed' ? (
                            <Lock size={10} color="#F59E0B" />
                          ) : pos.type === 'defi' ? (
                            <Zap size={10} color="#06B6D4" />
                          ) : (
                            <Wallet size={10} color="#10B981" />
                          )}
                          <span style={{ color: c.text3, fontSize: 11 }}>
                            {pos.type === 'fixed' ? 'Cố định' : pos.type === 'defi' ? 'DeFi' : 'Linh hoạt'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                        {pos.apy}%
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Đang stake</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                        {fmtAmount(pos.amount)} {pos.asset}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>{fmtUsd(pos.usdValue)}</p>
                    </div>
                    <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Đã nhận</p>
                      <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                        +{fmtAmount(pos.earned)} {pos.asset}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>+{fmtUsd(pos.earnedUsd)}</p>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`${prefix}/earn/staking`)}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold"
            style={{ background: c.primary, color: '#FFF' }}>
            <Plus size={18} />
            Stake thêm
          </button>
          <button
            onClick={() => navigate(`${prefix}/earn/analytics`)}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold"
            style={{ background: c.surface2, color: c.text1 }}>
            <TrendingUp size={18} />
            Phân tích
          </button>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard
            hover
            className="p-4"
            onClick={() => navigate(`${prefix}/earn/history`)}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
                <Calendar size={20} color="#3B82F6" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Lịch sử</p>
                <p style={{ color: c.text3, fontSize: 11 }}>Xem giao dịch</p>
              </div>
            </div>
            <ArrowRight size={16} color={c.text3} className="ml-auto" />
          </TrCard>

          <TrCard
            hover
            className="p-4"
            onClick={() => navigate(`${prefix}/earn/calendar`)}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.3)' }}>
                <DollarSign size={20} color="#10B981" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Lịch nhận lãi</p>
                <p style={{ color: c.text3, fontSize: 11 }}>Xem lịch trình</p>
              </div>
            </div>
            <ArrowRight size={16} color={c.text3} className="ml-auto" />
          </TrCard>
        </div>

        {/* Upcoming Maturity Alert */}
        {maturingSoon > 0 && (
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-center gap-3">
              <Calendar size={20} color="#F59E0B" />
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                  {maturingSoon} vị thế sắp đáo hạn
                </p>
                <p style={{ color: c.text2, fontSize: 12 }}>
                  Kiểm tra lịch nhận lãi để không bỏ lỡ rewards
                </p>
              </div>
              <button
                onClick={() => navigate(`${prefix}/earn/calendar`)}
                className="px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background: '#F59E0B', color: '#FFF' }}>
                Xem
              </button>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}