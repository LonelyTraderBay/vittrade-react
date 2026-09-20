/**
 * ══════════════════════════════════════════════════════════════
 *  ActiveCopiesPage — Phase 1 Week 2: Real-time Monitoring
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Real-time P/L monitoring for active copies
 * - Stop/Pause controls (destructive actions)
 * - Portfolio overview & risk alerts
 * - Recent trades feed
 * - Performance charts
 * 
 * Compliance:
 * - Real-time position disclosure
 * - Risk alerts for underperforming copies
 * - Stop copy requires confirmation (destructive)
 * - Cooling-off status visibility
 * - Audit trail for all actions
 * 
 * Guidelines:
 * - PageLayout + PageContent pattern
 * - Real-time updates simulation
 * - Trust-first: show all risks upfront
 * - Destructive actions: confirm before execute
 * - Empty state for no active copies
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  TrendingUp, TrendingDown, Activity, AlertTriangle, Eye,
  Pause, Square, Settings, Plus, Filter, ChevronDown,
  ChevronRight, Clock, Shield, DollarSign, Target,
  BarChart3, Zap, Info, CheckCircle, Users, XCircle
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { COPY_TRADERS } from '../../data/mockData';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

type CopyStatus = 'active' | 'cooling-off' | 'paused' | 'stopped';
type TabType = 'all' | 'active' | 'paused' | 'history';

interface ActiveCopy {
  id: string;
  providerId: string;
  provider: typeof COPY_TRADERS[0];
  capital: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  status: CopyStatus;
  startDate: string;
  copyMode: 'mirror' | 'fixed' | 'smart';
  copyRatio?: number;
  trades: number;
  winRate: number;
  hasCustomStopLoss: boolean;
  stopLossLevel?: number;
  coolingOffUntil?: string;
  recentTrades: Array<{
    id: string;
    pair: string;
    side: 'buy' | 'sell';
    size: number;
    price: number;
    pnl: number;
    timestamp: string;
  }>;
  performanceHistory: Array<{
    timestamp: string;
    value: number;
  }>;
}

// Mock active copies data
const MOCK_ACTIVE_COPIES: ActiveCopy[] = [
  {
    id: 'copy-1',
    providerId: 'trader-1',
    provider: COPY_TRADERS[0],
    capital: 5000,
    currentValue: 5650,
    pnl: 650,
    pnlPct: 13,
    status: 'active',
    startDate: '2026-02-15',
    copyMode: 'fixed',
    copyRatio: 50,
    trades: 48,
    winRate: 62.5,
    hasCustomStopLoss: true,
    stopLossLevel: 10,
    recentTrades: [
      { id: 't1', pair: 'BTC/USDT', side: 'sell', size: 0.05, price: 68500, pnl: 45, timestamp: '2h ago' },
      { id: 't2', pair: 'ETH/USDT', side: 'buy', size: 2, price: 3850, pnl: -12, timestamp: '5h ago' },
      { id: 't3', pair: 'BTC/USDT', side: 'buy', size: 0.05, price: 67800, pnl: 35, timestamp: '8h ago' },
    ],
    performanceHistory: generatePerformanceData(5000, 13),
  },
  {
    id: 'copy-2',
    providerId: 'trader-2',
    provider: COPY_TRADERS[1],
    capital: 3000,
    currentValue: 2850,
    pnl: -150,
    pnlPct: -5,
    status: 'active',
    startDate: '2026-03-01',
    copyMode: 'mirror',
    trades: 22,
    winRate: 45.5,
    hasCustomStopLoss: false,
    recentTrades: [
      { id: 't4', pair: 'SOL/USDT', side: 'sell', size: 10, price: 142, pnl: -35, timestamp: '1h ago' },
      { id: 't5', pair: 'AVAX/USDT', side: 'buy', size: 15, price: 38, pnl: 12, timestamp: '4h ago' },
    ],
    performanceHistory: generatePerformanceData(3000, -5),
  },
  {
    id: 'copy-3',
    providerId: 'trader-3',
    provider: COPY_TRADERS[2],
    capital: 2000,
    currentValue: 2000,
    pnl: 0,
    pnlPct: 0,
    status: 'cooling-off',
    startDate: '2026-03-08',
    copyMode: 'smart',
    trades: 0,
    winRate: 0,
    hasCustomStopLoss: true,
    stopLossLevel: 15,
    coolingOffUntil: '2026-03-09 14:30',
    recentTrades: [],
    performanceHistory: generatePerformanceData(2000, 0),
  },
];

function generatePerformanceData(capital: number, finalPnlPct: number) {
  const data = [];
  const finalValue = capital * (1 + finalPnlPct / 100);
  
  for (let i = 0; i <= 30; i++) {
    const progress = i / 30;
    const noise = (Math.random() - 0.5) * capital * 0.02;
    const value = capital + (finalValue - capital) * progress + noise;
    data.push({
      timestamp: `Day ${i}`,
      value: Math.max(value, capital * 0.85),
    });
  }
  
  return data;
}

export function ActiveCopiesPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedCopy, setSelectedCopy] = useState<string | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  // Portfolio aggregation
  const portfolio = useMemo(() => {
    const totalCapital = MOCK_ACTIVE_COPIES.reduce((sum, c) => sum + c.capital, 0);
    const totalValue = MOCK_ACTIVE_COPIES.reduce((sum, c) => sum + c.currentValue, 0);
    const totalPnL = totalValue - totalCapital;
    const totalPnLPct = (totalPnL / totalCapital) * 100;
    const activeCopies = MOCK_ACTIVE_COPIES.filter(c => c.status === 'active').length;
    
    return {
      totalCapital,
      totalValue,
      totalPnL,
      totalPnLPct,
      activeCopies,
      totalCopies: MOCK_ACTIVE_COPIES.length,
    };
  }, []);

  // Filter copies by tab
  const filteredCopies = useMemo(() => {
    if (activeTab === 'all') return MOCK_ACTIVE_COPIES;
    if (activeTab === 'active') return MOCK_ACTIVE_COPIES.filter(c => c.status === 'active' || c.status === 'cooling-off');
    if (activeTab === 'paused') return MOCK_ACTIVE_COPIES.filter(c => c.status === 'paused');
    return [];
  }, [activeTab]);

  const handleStopCopy = (copyId: string) => {
    setSelectedCopy(copyId);
    setShowStopConfirm(true);
  };

  const confirmStopCopy = () => {
    // TODO: API call to stop copy
    console.log('Stop copy:', selectedCopy);
    setShowStopConfirm(false);
    setSelectedCopy(null);
  };

  // Empty state
  if (MOCK_ACTIVE_COPIES.length === 0) {
    return (
      <PageLayout>
        <Header title="Copy đang chạy" back />
        
        <PageContent>
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
              style={{ background: c.surface2 }}
            >
              <Users size={40} color={c.text3} />
            </div>
            <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
              Chưa có copy nào đang chạy
            </h3>
            <p style={{ color: c.text3, fontSize: 13, textAlign: 'center', lineHeight: 1.5, marginBottom: 24 }}>
              Bắt đầu copy từ trader chuyên nghiệp để tự động hóa giao dịch của bạn
            </p>
            <button
              onClick={() => navigate(`${prefix}/trade/copy-trading`)}
              className="px-6 py-3 rounded-xl"
              style={{
                background: c.primary,
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Khám phá traders
            </button>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header 
        title="Copy đang chạy" 
        back
        action={{
          icon: Plus,
          onClick: () => navigate(`${prefix}/trade/copy-trading`),
        }}
      />

      <PageContent gap="relaxed">
        {/* Portfolio Overview */}
        <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>Tổng quan portfolio</h3>
            <span style={{ color: c.text3, fontSize: 11 }}>{portfolio.activeCopies} active</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Vốn đầu tư</p>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>${portfolio.totalCapital.toFixed(0)}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Giá trị hiện tại</p>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>${portfolio.totalValue.toFixed(0)}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl" style={{ 
            background: portfolio.totalPnL >= 0 ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${portfolio.totalPnL >= 0 ? '#10B981' : '#EF4444'}`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {portfolio.totalPnL >= 0 ? (
                  <TrendingUp size={16} color="#10B981" />
                ) : (
                  <TrendingDown size={16} color="#EF4444" />
                )}
                <span style={{ 
                  color: portfolio.totalPnL >= 0 ? '#166534' : '#991B1B',
                  fontSize: 11 
                }}>
                  P/L tổng
                </span>
              </div>
              <div className="text-right">
                <p style={{ 
                  color: portfolio.totalPnL >= 0 ? '#10B981' : '#EF4444',
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 1
                }}>
                  {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toFixed(0)}
                </p>
                <p style={{ 
                  color: portfolio.totalPnL >= 0 ? '#166534' : '#991B1B',
                  fontSize: 11
                }}>
                  {portfolio.totalPnLPct >= 0 ? '+' : ''}{portfolio.totalPnLPct.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabBar
          variant="segment"
          tabs={[
            { id: 'all', label: 'Tất cả', badge: portfolio.totalCopies },
            { id: 'active', label: 'Đang chạy', badge: portfolio.activeCopies },
            { id: 'paused', label: 'Tạm dừng' },
            { id: 'history', label: 'Lịch sử' },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* Active Copies List */}
        {activeTab === 'history' ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Activity size={32} color={c.text3} className="mb-3" />
            <p style={{ color: c.text3, fontSize: 13, textAlign: 'center' }}>
              Lịch sử copy sẽ hiển thị ở đây
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCopies.map(copy => (
              <CopyCard
                key={copy.id}
                copy={copy}
                onStop={() => handleStopCopy(copy.id)}
                onViewDetails={() => navigate(`${prefix}/trade/copy-provider/${copy.providerId}`)}
                c={c}
              />
            ))}
          </div>
        )}

        {/* Risk Alerts */}
        {MOCK_ACTIVE_COPIES.some(c => c.pnlPct < -5 && c.status === 'active') && (
          <div className="p-4 rounded-2xl" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
            <div className="flex gap-3">
              <AlertTriangle size={20} color={c.warningText} className="shrink-0" />
              <div>
                <h4 style={{ color: c.warningText, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                  Cảnh báo rủi ro
                </h4>
                <p style={{ color: c.warningText, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                  {MOCK_ACTIVE_COPIES.filter(c => c.pnlPct < -5).length} copy đang lỗ &gt;5%. 
                  Xem xét dừng copy hoặc điều chỉnh stop-loss.
                </p>
                <button
                  onClick={() => setActiveTab('active')}
                  className="text-xs underline"
                  style={{ color: c.warningText, fontWeight: 600 }}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        )}
      </PageContent>

      {/* Stop Copy Confirmation Modal */}
      {showStopConfirm && selectedCopy && (
        <StopCopyModal
          copy={MOCK_ACTIVE_COPIES.find(c => c.id === selectedCopy)!}
          onConfirm={confirmStopCopy}
          onCancel={() => setShowStopConfirm(false)}
          c={c}
        />
      )}
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   COPY CARD COMPONENT
   ═══════════════════════════════════════════════════════════ */

interface CopyCardProps {
  copy: ActiveCopy;
  onStop: () => void;
  onViewDetails: () => void;
  c: ReturnType<typeof useThemeColors>;
}

function CopyCard({ copy, onStop, onViewDetails, c }: CopyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const prefix = useRoutePrefix();
  const navigate = useNavigate();

  const statusConfig = {
    'active': { label: 'Đang chạy', color: '#10B981', bg: '#F0FDF4' },
    'cooling-off': { label: 'Chờ kích hoạt', color: '#F59E0B', bg: '#FFFBEB' },
    'paused': { label: 'Tạm dừng', color: '#6B7280', bg: '#F3F4F6' },
    'stopped': { label: 'Đã dừng', color: '#EF4444', bg: '#FEF2F2' },
  };

  const status = statusConfig[copy.status];

  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{ background: c.surface, border: `1px solid ${c.border}` }}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}
          >
            <span style={{ color: c.primary, fontSize: 16, fontWeight: 700 }}>{copy.provider.avatar}</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{copy.provider.name}</p>
              {copy.provider.verified && (
                <CheckCircle size={12} color={c.primary} />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span 
                className="px-2 py-0.5 rounded text-xs"
                style={{ 
                  background: status.bg,
                  color: status.color,
                  fontWeight: 600
                }}
              >
                {status.label}
              </span>
              {copy.status === 'cooling-off' && (
                <span style={{ color: c.text3, fontSize: 10 }}>
                  đến {copy.coolingOffUntil}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2"
          >
            <ChevronDown 
              size={16} 
              color={c.text3}
              className="transition-transform"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
        </div>

        {/* P/L Summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-lg text-center" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Vốn</p>
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>${copy.capital.toFixed(0)}</p>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Hiện tại</p>
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>${copy.currentValue.toFixed(0)}</p>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ 
            background: copy.pnl >= 0 ? '#F0FDF4' : '#FEF2F2'
          }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>P/L</p>
            <p style={{ 
              color: copy.pnl >= 0 ? '#10B981' : '#EF4444',
              fontSize: 13,
              fontWeight: 700
            }}>
              {copy.pnl >= 0 ? '+' : ''}${copy.pnl.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: c.text3, fontSize: 10 }}>Return</span>
            <span style={{ 
              color: copy.pnlPct >= 0 ? '#10B981' : '#EF4444',
              fontSize: 12,
              fontWeight: 700
            }}>
              {copy.pnlPct >= 0 ? '+' : ''}{copy.pnlPct.toFixed(2)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: c.border }}>
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                background: copy.pnlPct >= 0 ? '#10B981' : '#EF4444',
                width: `${Math.min(Math.abs(copy.pnlPct) * 5, 100)}%`
              }}
            />
          </div>
        </div>

        {/* Risk Warning */}
        {copy.pnlPct < -5 && !copy.hasCustomStopLoss && (
          <div className="mt-3 p-2 rounded-lg flex items-center gap-2" style={{ background: c.dangerBg }}>
            <AlertTriangle size={12} color={c.dangerText} />
            <p style={{ color: c.dangerText, fontSize: 10, lineHeight: 1.3 }}>
              Lỗ {Math.abs(copy.pnlPct).toFixed(1)}% và chưa có stop-loss riêng
            </p>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${c.border}` }}>
          <div className="pt-4 space-y-4">
            {/* Performance Chart */}
            <div>
              <p style={{ color: c.text2, fontSize: 11, marginBottom: 8 }}>Performance (30 ngày)</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={copy.performanceHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis key="x-axis" hide />
                    <YAxis key="y-axis" hide domain={['dataMin', 'dataMax']} />
                    <Tooltip
                      key="tooltip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any) => [`$${value.toFixed(0)}`, 'Value']}
                    />
                    <Line 
                      key="line-pnl"
                      type="monotone" 
                      dataKey="value" 
                      stroke={copy.pnl >= 0 ? '#10B981' : '#EF4444'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 1 }}>Số lượng trades</p>
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{copy.trades}</p>
              </div>
              <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 1 }}>Win rate</p>
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{copy.winRate.toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 1 }}>Copy mode</p>
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  {copy.copyMode === 'mirror' ? 'Mirror' : copy.copyMode === 'fixed' ? `Fixed ${copy.copyRatio}%` : 'Smart'}
                </p>
              </div>
              <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 1 }}>Stop-loss</p>
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  {copy.hasCustomStopLoss ? `-${copy.stopLossLevel}%` : 'Provider'}
                </p>
              </div>
            </div>

            {/* Recent Trades */}
            {copy.recentTrades.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Trades gần đây</p>
                  <button
                    onClick={onViewDetails}
                    className="text-xs"
                    style={{ color: c.primary }}
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="space-y-2">
                  {copy.recentTrades.slice(0, 3).map(trade => (
                    <div 
                      key={trade.id}
                      className="p-2 rounded-lg flex items-center justify-between"
                      style={{ background: c.surface2 }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span 
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{ 
                              background: trade.side === 'buy' ? '#10B981' : '#EF4444',
                              color: '#fff',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}
                          >
                            {trade.side}
                          </span>
                          <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{trade.pair}</span>
                        </div>
                        <span style={{ color: c.text3, fontSize: 9 }}>{trade.timestamp}</span>
                      </div>
                      <div className="text-right">
                        <p style={{ color: c.text2, fontSize: 10, marginBottom: 0.5 }}>
                          {trade.size} @ ${trade.price.toFixed(0)}
                        </p>
                        <p style={{ 
                          color: trade.pnl >= 0 ? '#10B981' : '#EF4444',
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(`${prefix}/trade/copy-provider/${copy.providerId}/configuration`)}
                className="px-4 py-2.5 rounded-xl flex items-center justify-center gap-2"
                style={{
                  background: c.surface2,
                  color: c.text1,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Settings size={14} />
                <span>Điều chỉnh</span>
              </button>
              <button
                onClick={onStop}
                disabled={copy.status === 'cooling-off'}
                className="px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: c.dangerBg,
                  color: c.dangerText,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Square size={14} />
                <span>Dừng copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STOP COPY MODAL
   ═══════════════════════════════════════════════════════════ */

interface StopCopyModalProps {
  copy: ActiveCopy;
  onConfirm: () => void;
  onCancel: () => void;
  c: ReturnType<typeof useThemeColors>;
}

function StopCopyModal({ copy, onConfirm, onCancel, c }: StopCopyModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const canConfirm = confirmText.toLowerCase() === 'stop';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-md rounded-t-3xl p-6"
        style={{ background: c.bg }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: c.dangerBg }}
          >
            <Square size={24} color={c.dangerText} />
          </div>
          <div>
            <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
              Dừng copy?
            </h3>
            <p style={{ color: c.text3, fontSize: 12 }}>
              {copy.provider.name}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="p-3 rounded-xl" style={{ background: c.dangerBg, border: `1px solid ${c.dangerBorder}` }}>
            <p style={{ color: c.dangerText, fontSize: 12, lineHeight: 1.5 }}>
              <strong>Cảnh báo:</strong> Khi dừng copy, tất cả vị thế đang mở sẽ được đóng ngay lập tức. 
              Bạn không thể hoàn tác hành động này.
            </p>
          </div>

          <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
            <div className="flex justify-between items-center mb-2">
              <span style={{ color: c.text3, fontSize: 11 }}>P/L hiện tại</span>
              <span style={{ 
                color: copy.pnl >= 0 ? '#10B981' : '#EF4444',
                fontSize: 14,
                fontWeight: 700
              }}>
                {copy.pnl >= 0 ? '+' : ''}${copy.pnl.toFixed(0)} ({copy.pnlPct >= 0 ? '+' : ''}{copy.pnlPct.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span style={{ color: c.text3, fontSize: 11 }}>Vị thế đang mở</span>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                {copy.recentTrades.filter(t => t.side === 'buy').length} positions
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: c.text3, fontSize: 11 }}>Vốn sẽ về ví</span>
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                ${copy.currentValue.toFixed(0)}
              </span>
            </div>
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
              Nhập <strong>STOP</strong> để xác nhận
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="STOP"
              className="w-full px-4 py-3 rounded-xl"
              style={{
                background: c.surface2,
                border: `1px solid ${c.border}`,
                color: c.text1,
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-3 rounded-xl"
            style={{
              background: c.surface2,
              color: c.text1,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="px-4 py-3 rounded-xl disabled:opacity-50"
            style={{
              background: c.dangerText,
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Dừng copy
          </button>
        </div>
      </div>
    </div>
  );
}