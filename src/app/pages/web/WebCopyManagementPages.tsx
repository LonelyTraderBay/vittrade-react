/**
 * WebCopyManagementPages — Enterprise Desktop versions of:
 *   - ActiveCopiesPage
 *   - CopySettingsPage
 *   - CopyNotificationsPage
 *   - CopyPerformancePage
 *   - PerformanceAttributionPage
 *   - CopyAuditLogPage
 *   - PortfolioRiskAnalysisPage
 */
import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle, Eye, Pause, Square,
  Settings, Plus, Clock, Shield, DollarSign, Target, BarChart3, Zap,
  CheckCircle, Users, Bell, BellOff, Download, Search, Filter,
  FileText, ArrowRight, ChevronRight, Info, XCircle, Sliders,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { COPY_TRADERS } from '../../data/mockData';
import { fmtSignedUsd } from '../../data/formatNumber';
import { COMPLIANCE_MESSAGES } from '../../constants/copyTrading';
import { WEB_FONT, WEB_ICON, WEB_BUTTON, WEB_SPACING } from '../../components/layout/webConstants';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

const tooltipS = (c: any) => ({ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 11 });

function StatCard({ label, value, color, sub, icon: Icon }: {
  label: string; value: string; color?: string; sub?: string; icon?: React.ElementType;
}) {
  const c = useThemeColors();
  return (
    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14, padding: '16px 18px' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        {Icon && <Icon size={14} color={color || c.text3} />}
        <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textTransform: 'uppercase' as const }}>{label}</span>
      </div>
      <p style={{ color: color || c.text1, fontSize: WEB_FONT.xl, fontWeight: 700, fontVariantNumeric: 'tabular-nums', margin: 0, lineHeight: 1.2 }}>{value}</p>
      {sub && <p style={{ color: c.text3, fontSize: WEB_FONT.xs, margin: 0, marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Mock data
   ═══════════════════════════════════════════════════ */
const ACTIVE_COPIES = [
  { id: 'c1', providerId: 'ct001', providerName: 'AlphaHunter_VN', avatar: 'A', amount: 500, pnl: 42.50, pnlPct: 8.5, status: 'active' as const, trades: 23, startDate: '2026-02-15', stopLoss: 20, dailyLoss: 5 },
  { id: 'c2', providerId: 'ct002', providerName: 'SteadyGains_Pro', avatar: 'S', amount: 1000, pnl: 67.20, pnlPct: 6.72, status: 'active' as const, trades: 15, startDate: '2026-01-20', stopLoss: 15, dailyLoss: 3 },
  { id: 'c3', providerId: 'ct004', providerName: 'CryptoSensei', avatar: 'C', amount: 300, pnl: -12.30, pnlPct: -4.1, status: 'paused' as const, trades: 8, startDate: '2026-03-01', stopLoss: 10, dailyLoss: 3 },
];

const PERF_CHART = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`, value: 100 + Math.sin(i / 5) * 15 + i * 0.8 + (Math.random() - 0.3) * 5,
}));

const AUDIT_ENTRIES = [
  { id: 'a1', ts: '2026-03-08 14:32:15', action: 'Trade Copied', detail: 'BUY 0.01 BTC @ $68,450', provider: 'AlphaHunter_VN', pnl: 0 },
  { id: 'a2', ts: '2026-03-08 12:15:08', action: 'Trade Copied', detail: 'SELL 0.05 ETH @ $3,850', provider: 'SteadyGains_Pro', pnl: 12.50 },
  { id: 'a3', ts: '2026-03-07 18:30:42', action: 'Stop Loss Adjusted', detail: 'Stop loss changed: 20% → 15%', provider: 'CryptoSensei', pnl: 0 },
  { id: 'a4', ts: '2026-03-07 10:00:00', action: 'Copy Paused', detail: 'Manual pause by user', provider: 'CryptoSensei', pnl: 0 },
  { id: 'a5', ts: '2026-03-06 22:15:30', action: 'Trade Copied', detail: 'BUY 2 SOL @ $142.30', provider: 'AlphaHunter_VN', pnl: 0 },
  { id: 'a6', ts: '2026-03-06 16:42:18', action: 'Copy Started', detail: 'Started copying CryptoSensei with $300', provider: 'CryptoSensei', pnl: 0 },
];

/* ═══════════════════════════════════════════════════
   1. WebCopyActiveCopiesPage
   ═══════════════════════════════════════════════════ */

export function WebCopyActiveCopiesPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [copies, setCopies] = useState(ACTIVE_COPIES);
  const [confirmStop, setConfirmStop] = useState<string | null>(null);

  const totalInvested = copies.reduce((s, cp) => s + cp.amount, 0);
  const totalPnl = copies.reduce((s, cp) => s + cp.pnl, 0);
  const activeCount = copies.filter(cp => cp.status === 'active').length;

  const togglePause = (id: string) => {
    setCopies(prev => prev.map(cp => cp.id === id ? { ...cp, status: cp.status === 'active' ? 'paused' as const : 'active' as const } : cp));
    toast.success('Trạng thái đã cập nhật');
  };

  return (
    <PageLayout>
      <Header title="Copy đang hoạt động" subtitle="Active Copies · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Stats */}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          <StatCard icon={Activity} label="Đang hoạt động" value={activeCount.toString()} valueColor="#10B981" sub={`${copies.length} tổng`} />
          <StatCard icon={DollarSign} label="Tổng đầu tư" value={`$${totalInvested.toLocaleString()}`} sub="Across all copies" />
          <StatCard icon={TrendingUp} label="Tổng P/L" value={fmtSignedUsd(totalPnl)} color={totalPnl >= 0 ? '#10B981' : '#EF4444'} />
          <StatCard icon={BarChart3} label="Tổng lệnh" value={copies.reduce((s, cp) => s + cp.trades, 0).toString()} sub="Giao dịch đã copy" />
        </div>

        {/* Copies List */}
        <div className="flex flex-col gap-4">
          {copies.map(cp => {
            const profitColor = cp.pnl >= 0 ? '#10B981' : '#EF4444';
            const isActive = cp.status === 'active';
            return (
              <div key={cp.id} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden', opacity: isActive ? 1 : 0.75 }}>
                <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: `1px solid ${c.divider}` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center shrink-0" style={{ width: 44, height: 44, borderRadius: '50%', background: c.primary + '22' }}>
                      <span style={{ color: c.primary, fontSize: 16, fontWeight: 700 }}>{cp.avatar}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>{cp.providerName}</span>
                        <span style={{
                          padding: '3px 10px', borderRadius: 6, fontSize: WEB_FONT.xs, fontWeight: 600,
                          background: isActive ? '#10B98115' : '#F59E0B15', color: isActive ? '#10B981' : '#F59E0B',
                        }}>{isActive ? 'Hoạt động' : 'Tạm dừng'}</span>
                      </div>
                      <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Từ {cp.startDate} · SL: {cp.stopLoss}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p style={{ color: profitColor, fontSize: WEB_FONT.xl, fontWeight: 700, fontVariantNumeric: 'tabular-nums', margin: 0 }}>{fmtSignedUsd(cp.pnl)}</p>
                    <p style={{ color: profitColor, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums', margin: 0, marginTop: 2 }}>{cp.pnlPct >= 0 ? '+' : ''}{cp.pnlPct.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3" style={{ padding: '12px 20px' }}>
                  {[
                    { label: 'Đầu tư', value: `$${cp.amount.toLocaleString()}` },
                    { label: 'Số lệnh', value: cp.trades.toString() },
                    { label: 'Max Daily Loss', value: `${cp.dailyLoss}%` },
                  ].map(s => (
                    <div key={s.label} style={{ background: c.surface2, borderRadius: 10, padding: '10px 14px' }}>
                      <span style={{ color: c.text3, fontSize: WEB_FONT.xs, display: 'block', marginBottom: 4 }}>{s.label}</span>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2" style={{ padding: '10px 20px 14px' }}>
                  <button onClick={() => togglePause(cp.id)} className="flex items-center justify-center gap-2" style={{
                    flex: 1, height: WEB_BUTTON.md, borderRadius: 10, fontSize: WEB_FONT.sm, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${isActive ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                    background: isActive ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                    color: isActive ? '#F59E0B' : '#10B981',
                  }}>
                    {isActive ? <Pause size={WEB_ICON.xs} /> : <Activity size={WEB_ICON.xs} />}
                    {isActive ? 'Tạm dừng' : 'Tiếp tục'}
                  </button>
                  <button onClick={() => navigate(`/w/trade/copy-performance/${cp.id}`)} className="flex items-center justify-center gap-2" style={{
                    height: WEB_BUTTON.md, padding: '0 16px', borderRadius: 10, fontSize: WEB_FONT.sm, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid rgba(59,130,246,0.2)`, background: 'rgba(59,130,246,0.06)', color: '#3B82F6',
                  }}>
                    <BarChart3 size={WEB_ICON.xs} /> Chi tiết
                  </button>
                  <button onClick={() => setConfirmStop(cp.id)} className="flex items-center justify-center gap-2" style={{
                    height: WEB_BUTTON.md, padding: '0 16px', borderRadius: 10, fontSize: WEB_FONT.sm, fontWeight: 600, cursor: 'pointer',
                    border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#EF4444',
                  }}>
                    <Square size={WEB_ICON.xs} /> Dừng
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm Stop Dialog */}
        {confirmStop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmStop(null)}>
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 20, width: 440, padding: '24px 28px' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                <AlertTriangle size={WEB_ICON.xl} color="#EF4444" />
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, margin: 0 }}>Dừng Copy Trading?</h3>
              </div>
              <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0, marginBottom: 20 }}>
                Hành động này sẽ đóng tất cả vị thế đang mở và dừng sao chép giao dịch. Bạn không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmStop(null)} style={{
                  flex: 1, height: WEB_BUTTON.lg, borderRadius: 12, fontSize: WEB_FONT.md, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${c.border}`, background: c.surface, color: c.text1,
                }}>Hủy</button>
                <button onClick={() => { setCopies(prev => prev.filter(cp => cp.id !== confirmStop)); setConfirmStop(null); toast.success('Đã dừng copy'); }} style={{
                  flex: 1, height: WEB_BUTTON.lg, borderRadius: 12, fontSize: WEB_FONT.md, fontWeight: 700, cursor: 'pointer',
                  border: 'none', background: '#EF4444', color: '#fff',
                }}>Xác nhận dừng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   2. WebCopySettingsPage
   ═══════════════════════════════════════════════════ */

export function WebCopySettingsPage() {
  const c = useThemeColors();
  const [globalStopLoss, setGlobalStopLoss] = useState('30');
  const [autoRebalance, setAutoRebalance] = useState(true);
  const [maxProviders, setMaxProviders] = useState('5');

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 12, padding: 2, cursor: 'pointer', border: 'none',
      background: checked ? c.primary : c.surface2, transition: 'background 0.2s ease',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 10, background: '#fff',
        transform: checked ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );

  return (
    <PageLayout>
      <Header title="Cài đặt Copy" subtitle="Settings · Copy Trading" back />
      <div style={{ padding: '24px 0 40px', maxWidth: 800 }}>
        <div className="flex flex-col gap-5">
          {/* Risk Management */}
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px 24px' }}>
            <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, margin: 0, marginBottom: 20 }}>Quản lý Rủi ro</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: `1px solid ${c.divider}` }}>
                <div>
                  <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, display: 'block' }}>Global Stop Loss</span>
                  <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Dừng tất cả copies khi tổng lỗ vượt ngưỡng</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={globalStopLoss} onChange={e => setGlobalStopLoss(e.target.value)} style={{
                    width: 80, height: WEB_BUTTON.md, borderRadius: 10, padding: '0 12px', fontSize: WEB_FONT.md,
                    background: c.surface2, border: `1.5px solid ${c.border}`, color: c.text1, outline: 'none', textAlign: 'center',
                  }} />
                  <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>%</span>
                </div>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: `1px solid ${c.divider}` }}>
                <div>
                  <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, display: 'block' }}>Tự động Rebalance</span>
                  <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Tái cân bằng vốn khi dừng một provider</span>
                </div>
                <ToggleSwitch checked={autoRebalance} onChange={() => setAutoRebalance(!autoRebalance)} />
              </div>
              <div className="flex items-center justify-between" style={{ padding: '12px 0' }}>
                <div>
                  <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, display: 'block' }}>Giới hạn Provider</span>
                  <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Số provider copy đồng thời tối đa</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={maxProviders} onChange={e => setMaxProviders(e.target.value)} style={{
                    width: 80, height: WEB_BUTTON.md, borderRadius: 10, padding: '0 12px', fontSize: WEB_FONT.md,
                    background: c.surface2, border: `1.5px solid ${c.border}`, color: c.text1, outline: 'none', textAlign: 'center',
                  }} />
                </div>
              </div>
            </div>
          </div>
          {/* Save */}
          <button onClick={() => toast.success('Đã lưu cài đặt')} style={{
            width: '100%', height: WEB_BUTTON.lg, borderRadius: 12, fontSize: WEB_FONT.md, fontWeight: 700,
            cursor: 'pointer', border: 'none', background: c.primary, color: '#fff',
          }}>Lưu cài đặt</button>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   3. WebCopyNotificationsPage
   ═══════════════════════════════════════════════════ */

const NOTIF_ITEMS = [
  { id: 'n1', ts: '14:32', title: 'Trade copied', desc: 'BUY 0.01 BTC @ $68,450 từ AlphaHunter_VN', type: 'trade' as const },
  { id: 'n2', ts: '12:15', title: 'P/L Alert', desc: 'SteadyGains_Pro đạt +$67.20 (+6.72%)', type: 'alert' as const },
  { id: 'n3', ts: '10:00', title: 'Risk Warning', desc: 'CryptoSensei đạt daily loss limit -3%', type: 'warning' as const },
  { id: 'n4', ts: 'Hôm qua', title: 'Copy paused', desc: 'CryptoSensei tạm dừng do risk limit', type: 'system' as const },
  { id: 'n5', ts: '2 ngày', title: 'New copy started', desc: 'Bắt đầu copy CryptoSensei với $300', type: 'system' as const },
];

export function WebCopyNotificationsPage() {
  const c = useThemeColors();
  const typeConfig: Record<string, { color: string; icon: React.ElementType }> = {
    trade: { color: '#3B82F6', icon: Activity },
    alert: { color: '#10B981', icon: TrendingUp },
    warning: { color: '#F59E0B', icon: AlertTriangle },
    system: { color: '#8B5CF6', icon: Bell },
  };

  return (
    <PageLayout>
      <Header title="Thông báo Copy" subtitle="Notifications · Copy Trading" back />
      <div style={{ padding: '24px 0 40px', maxWidth: 800 }}>
        <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {NOTIF_ITEMS.map((n, i) => {
            const cfg = typeConfig[n.type];
            const NIcon = cfg.icon;
            return (
              <div key={n.id} className="flex items-center gap-4" style={{
                padding: '16px 20px', borderBottom: i < NOTIF_ITEMS.length - 1 ? `1px solid ${c.divider}` : 'none',
              }}>
                <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 10, background: cfg.color + '12' }}>
                  <NIcon size={WEB_ICON.md} color={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, display: 'block' }}>{n.title}</span>
                  <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{n.desc}</span>
                </div>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs, whiteSpace: 'nowrap' }}>{n.ts}</span>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   4. WebCopyPerformancePage
   ═══════════════════════════════════════════════════ */

export function WebCopyPerformancePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { copyId } = useParams();
  const copy = ACTIVE_COPIES.find(cp => cp.id === copyId) || ACTIVE_COPIES[0];

  return (
    <PageLayout>
      <Header title="Hiệu suất Copy" subtitle={`Performance · ${copy.providerName}`} back />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Stats */}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          <StatCard icon={DollarSign} label="Đầu tư" value={`$${copy.amount.toLocaleString()}`} />
          <StatCard icon={TrendingUp} label="P/L" value={fmtSignedUsd(copy.pnl)} color={copy.pnl >= 0 ? '#10B981' : '#EF4444'} sub={`${copy.pnlPct >= 0 ? '+' : ''}${copy.pnlPct.toFixed(2)}%`} />
          <StatCard icon={Activity} label="Số lệnh" value={copy.trades.toString()} />
          <StatCard icon={Clock} label="Bắt đầu" value={copy.startDate} />
        </div>
        {/* Chart */}
        <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
          <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, margin: 0, marginBottom: 16 }}>Biểu đồ P/L</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERF_CHART}>
                <defs>
                  <linearGradient id="plGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
                <XAxis dataKey="day" stroke={c.text3} fontSize={10} />
                <YAxis stroke={c.text3} fontSize={10} />
                <Tooltip contentStyle={tooltipS(c)} />
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#plGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Links */}
        <div className="flex gap-3">
          <button onClick={() => navigate(`/w/trade/copy-performance/${copyId}/attribution`)} className="flex items-center gap-2" style={{
            height: WEB_BUTTON.md, padding: '0 20px', borderRadius: 10, fontSize: WEB_FONT.sm, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${c.border}`, background: c.surface, color: c.text1,
          }}>
            <BarChart3 size={WEB_ICON.xs} /> Performance Attribution
          </button>
          <button onClick={() => navigate(`/w/trade/copy-audit-log/${copyId}`)} className="flex items-center gap-2" style={{
            height: WEB_BUTTON.md, padding: '0 20px', borderRadius: 10, fontSize: WEB_FONT.sm, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${c.border}`, background: c.surface, color: c.text1,
          }}>
            <FileText size={WEB_ICON.xs} /> Audit Log
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   5. WebCopyPerformanceAttributionPage
   ═══════════════════════════════════════════════════ */

const ATTR_DATA = [
  { asset: 'BTC/USDT', contribution: 45.2, trades: 12, pnl: 28.50 },
  { asset: 'ETH/USDT', contribution: 30.1, trades: 8, pnl: 18.20 },
  { asset: 'SOL/USDT', contribution: 15.5, trades: 5, pnl: -4.30 },
  { asset: 'BNB/USDT', contribution: 9.2, trades: 3, pnl: 0.10 },
];

export function WebCopyPerformanceAttributionPage() {
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Phân tích Hiệu suất" subtitle="Performance Attribution · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 120px 80px 120px 200px', padding: '12px 20px', borderBottom: `1px solid ${c.divider}`, background: c.surface2 }}>
            {['Tài sản', 'Đóng góp', 'Lệnh', 'P/L', 'Phân bổ'].map(h => (
              <span key={h} style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textTransform: 'uppercase' as const }}>{h}</span>
            ))}
          </div>
          {ATTR_DATA.map((d, i) => (
            <div key={d.asset} className="grid items-center" style={{
              gridTemplateColumns: '1fr 120px 80px 120px 200px',
              padding: '14px 20px', borderBottom: i < ATTR_DATA.length - 1 ? `1px solid ${c.divider}` : 'none',
            }}>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>{d.asset}</span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums' }}>{d.contribution.toFixed(1)}%</span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums' }}>{d.trades}</span>
              <span style={{ color: d.pnl >= 0 ? '#10B981' : '#EF4444', fontSize: WEB_FONT.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtSignedUsd(d.pnl)}</span>
              <div style={{ height: 8, borderRadius: 4, background: c.surface2, overflow: 'hidden' }}>
                <div style={{ width: `${d.contribution}%`, height: '100%', borderRadius: 4, background: d.pnl >= 0 ? '#10B981' : '#EF4444' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   6. WebCopyAuditLogPage
   ═══════════════════════════════════════════════════ */

export function WebCopyAuditLogPage() {
  const c = useThemeColors();
  const [search, setSearch] = useState('');
  const filtered = AUDIT_ENTRIES.filter(e =>
    !search || e.action.toLowerCase().includes(search.toLowerCase()) || e.detail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout>
      <Header title="Audit Log" subtitle="Nhật ký hoạt động · Copy Trading" back action={{ icon: Download, onClick: () => toast.success('Đang xuất...') }} />
      <div style={{ padding: '24px 0 40px' }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <div className="relative flex-1" style={{ maxWidth: 400 }}>
            <Search size={WEB_ICON.sm} color={c.text3} className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input placeholder="Tìm hoạt động..." value={search} onChange={e => setSearch(e.target.value)} style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, height: WEB_BUTTON.md, borderRadius: 10, fontSize: WEB_FONT.sm,
              background: c.surface, border: `1px solid ${c.border}`, color: c.text1, outline: 'none',
            }} />
          </div>
        </div>
        <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div className="grid" style={{ gridTemplateColumns: '160px 140px 1fr 100px 100px', padding: '12px 20px', borderBottom: `1px solid ${c.divider}`, background: c.surface2 }}>
            {['Thời gian', 'Hành động', 'Chi tiết', 'Provider', 'P/L'].map(h => (
              <span key={h} style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textTransform: 'uppercase' as const }}>{h}</span>
            ))}
          </div>
          {filtered.map((e, i) => (
            <div key={e.id} className="grid items-center" style={{
              gridTemplateColumns: '160px 140px 1fr 100px 100px',
              padding: '14px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${c.divider}` : 'none',
            }}>
              <span style={{ color: c.text3, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums' }}>{e.ts}</span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>{e.action}</span>
              <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>{e.detail}</span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm }}>{e.provider}</span>
              <span style={{ color: e.pnl > 0 ? '#10B981' : e.pnl < 0 ? '#EF4444' : c.text3, fontSize: WEB_FONT.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {e.pnl !== 0 ? fmtSignedUsd(e.pnl) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   7. WebCopyRiskAnalysisPage
   ═══════════════════════════════════════════════════ */

const RISK_METRICS = [
  { label: 'Portfolio VaR (95%)', value: '$42.50', color: '#EF4444', desc: 'Tổn thất tối đa dự kiến trong 1 ngày' },
  { label: 'Correlation Risk', value: 'Trung bình', color: '#F59E0B', desc: 'Mức tương quan giữa các providers' },
  { label: 'Concentration Risk', value: 'Thấp', color: '#10B981', desc: 'Mức tập trung vào 1 provider' },
  { label: 'Liquidity Risk', value: 'Thấp', color: '#10B981', desc: 'Rủi ro thanh khoản khi rút vốn' },
];

export function WebCopyRiskAnalysisPage() {
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Phân tích Rủi ro" subtitle="Risk Analysis · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}>
          {RISK_METRICS.map((rm, i) => (
            <div key={i} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                <Shield size={WEB_ICON.md} color={rm.color} />
                <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>{rm.label}</span>
              </div>
              <p style={{ color: rm.color, fontSize: WEB_FONT['2xl'], fontWeight: 700, margin: 0, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{rm.value}</p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.sm, lineHeight: 1.5, margin: 0 }}>{rm.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3" style={{
          background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, padding: '14px 18px',
        }}>
          <Info size={WEB_ICON.md} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6, margin: 0 }}>
            Phân tích rủi ro dựa trên dữ liệu lịch sử và mô hình thống kê. Kết quả thực tế có thể khác biệt đáng kể.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
