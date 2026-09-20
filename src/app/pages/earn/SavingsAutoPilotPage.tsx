import React, { useState, useMemo, useCallback } from 'react';
import {
  Zap, Shield, TrendingUp, TrendingDown, RefreshCw, CheckCircle,
  AlertTriangle, Info, X, ChevronRight, Clock, Play, Pause,
  Settings, Lock, Unlock, PiggyBank, Target, Sparkles,
  ArrowUpRight, ArrowDownRight, ArrowRight, Eye, EyeOff,
  BarChart3, Calendar, Activity, Repeat, Lightbulb,
  Power, Brain, Gauge, Bell, ToggleLeft, ToggleRight, DollarSign,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtUsd, fmtAmount, fmtPct } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type AutoPilotStatus = 'inactive' | 'active' | 'paused';
type AutoPilotMode = 'conservative' | 'balanced' | 'growth';
type ActionType = 'dca_executed' | 'rebalanced' | 'switch_product' | 'compound_activated' | 'apy_optimized' | 'risk_adjusted';

interface AutoPilotConfig {
  mode: AutoPilotMode;
  status: AutoPilotStatus;
  monthlyBudget: number;
  dcaEnabled: boolean;
  dcaFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  rebalanceEnabled: boolean;
  rebalanceThreshold: number;
  smartSwitchEnabled: boolean;
  switchMinAPYGain: number;
  compoundEnabled: boolean;
  riskGuardEnabled: boolean;
  maxSingleAssetPct: number;
  notificationsEnabled: boolean;
  approvalRequired: boolean;
}

interface AutoAction {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  timestamp: string;
  impact: string;
  impactValue: number;
  status: 'executed' | 'pending' | 'skipped' | 'needs_approval';
  details: Record<string, string>;
}

interface PerformanceMetric {
  label: string;
  value: string;
  change: number;
  icon: React.ComponentType<any>;
  color: string;
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */

const MODE_CONFIG: Record<AutoPilotMode, {
  label: string; desc: string; icon: React.ComponentType<any>; color: string;
  dcaFreq: string; rebalanceThreshold: string; switchMinGain: string; maxConcentration: string;
}> = {
  conservative: {
    label: 'An toàn', desc: 'Stablecoin-first, DCA chậm, rebalance ít, chỉ switch khi APY chênh nhiều',
    icon: Shield, color: '#10B981',
    dcaFreq: 'Hằng tháng', rebalanceThreshold: '15%', switchMinGain: '1.5%+', maxConcentration: '50%',
  },
  balanced: {
    label: 'Cân bằng', desc: 'Đa dạng hóa, DCA trung bình, rebalance tự động, switch linh hoạt',
    icon: Target, color: '#3B82F6',
    dcaFreq: 'Hằng tuần', rebalanceThreshold: '10%', switchMinGain: '0.8%+', maxConcentration: '40%',
  },
  growth: {
    label: 'Tăng trưởng', desc: 'Ưu tiên APY cao, DCA nhanh, rebalance thường xuyên, switch nhanh',
    icon: Zap, color: '#F59E0B',
    dcaFreq: 'Hằng ngày', rebalanceThreshold: '5%', switchMinGain: '0.3%+', maxConcentration: '35%',
  },
};

const RECENT_ACTIONS: AutoAction[] = [
  {
    id: 'act1', type: 'dca_executed', title: 'DCA USDT Linh hoạt',
    description: 'Tự động gửi 250 USDT vào sản phẩm Linh hoạt theo lịch DCA hằng tuần.',
    timestamp: '09/03/2026 08:00', impact: '+250 USDT', impactValue: 250,
    status: 'executed',
    details: { 'Sản phẩm': 'USDT Linh hoạt', 'Số lượng': '250 USDT', 'APY': '4.8%', 'Nguồn': 'Ví Spot' },
  },
  {
    id: 'act2', type: 'rebalanced', title: 'Tái cân bằng danh mục',
    description: 'Tỷ trọng USDT vượt 45% (target 40%). Chuyển 5% sang ETH Linh hoạt.',
    timestamp: '08/03/2026 14:00', impact: 'USDT -5% → ETH +5%', impactValue: 0,
    status: 'executed',
    details: { 'Từ': 'USDT Linh hoạt (45%→40%)', 'Đến': 'ETH Linh hoạt (15%→20%)', 'Số tiền': '~$500' },
  },
  {
    id: 'act3', type: 'apy_optimized', title: 'Tối ưu APY BTC',
    description: 'APY BTC Cố định 60D tăng từ 3.2% lên 3.8%. Tăng mức DCA BTC.',
    timestamp: '07/03/2026 10:30', impact: '+0.6% APY', impactValue: 0.6,
    status: 'executed',
    details: { 'Sản phẩm': 'BTC Cố định 60D', 'APY cũ': '3.2%', 'APY mới': '3.8%', 'Hành động': 'Tăng DCA 10%' },
  },
  {
    id: 'act4', type: 'switch_product', title: 'Chuyển SOL sang AVAX',
    description: 'SOL Cố định 30D APY giảm 1.2%. AVAX Cố định 90D có APY cao hơn 1.5%. Đề xuất chuyển.',
    timestamp: '06/03/2026 16:00', impact: '+1.5% APY', impactValue: 1.5,
    status: 'needs_approval',
    details: { 'Từ': 'SOL Cố định 30D (5.3%)', 'Đến': 'AVAX Cố định 90D (6.8%)', 'Chênh': '+1.5% APY', 'Lưu ý': 'Lock 90 ngày' },
  },
  {
    id: 'act5', type: 'compound_activated', title: 'Bật lãi kép ETH',
    description: 'ETH Linh hoạt đủ điều kiện lãi kép tự động. Dự kiến tăng +$8/năm.',
    timestamp: '05/03/2026 09:00', impact: '+~$8/năm', impactValue: 8,
    status: 'executed',
    details: { 'Sản phẩm': 'ETH Linh hoạt', 'APY hiệu quả': '4.05% → 4.22%', 'Dự kiến thêm': '+$8/năm' },
  },
  {
    id: 'act6', type: 'risk_adjusted', title: 'Điều chỉnh rủi ro',
    description: 'AVAX chiếm 32% danh mục — vượt ngưỡng 30%. Giảm 2% sang USDT.',
    timestamp: '04/03/2026 12:00', impact: 'Giảm rủi ro tập trung', impactValue: 0,
    status: 'executed',
    details: { 'Tài sản': 'AVAX (32%→30%)', 'Chuyển': '2% sang USDT Linh hoạt', 'Lý do': 'Vượt ngưỡng single-asset' },
  },
];

const ACTION_CONFIG: Record<ActionType, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  dca_executed: { label: 'DCA', icon: Repeat, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  rebalanced: { label: 'Rebalance', icon: RefreshCw, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  switch_product: { label: 'Chuyển SP', icon: ArrowRight, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  compound_activated: { label: 'Lãi kép', icon: Zap, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
  apy_optimized: { label: 'Tối ưu APY', icon: TrendingUp, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  risk_adjusted: { label: 'Rủi ro', icon: Shield, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  executed: { label: 'Đã thực hiện', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  pending: { label: 'Đang xử lý', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  skipped: { label: 'Bỏ qua', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
  needs_approval: { label: 'Cần duyệt', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
};

/* ═══════════════════════════════════════════════════════════
   Toggle Component
   ═══════════════════════════════════════════════════════════ */

function Toggle({ on, onChange, size = 'sm' }: { on: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md' }) {
  const c = useThemeColors();
  const w = size === 'sm' ? 36 : 44;
  const h = size === 'sm' ? 20 : 24;
  const dot = size === 'sm' ? 16 : 20;
  return (
    <button onClick={() => onChange(!on)}
      style={{
        width: w, height: h, borderRadius: h,
        background: on ? '#10B981' : c.surface2,
        border: `1.5px solid ${on ? '#10B981' : c.borderSolid}`,
        position: 'relative', transition: 'all 0.2s',
      }}>
      <div style={{
        width: dot, height: dot, borderRadius: dot,
        background: on ? '#fff' : c.text3,
        position: 'absolute',
        top: (h - dot) / 2 - 1.5,
        left: on ? w - dot - 2 - 1.5 : 2,
        transition: 'all 0.2s',
      }} />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */

export function SavingsAutoPilotPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight, hapticSuccess, hapticHeavy } = useHaptic();

  /* State */
  const [tab, setTab] = useState<'overview' | 'actions' | 'settings'>('overview');
  const [config, setConfig] = useState<AutoPilotConfig>({
    mode: 'balanced',
    status: 'active',
    monthlyBudget: 1000,
    dcaEnabled: true,
    dcaFrequency: 'weekly',
    rebalanceEnabled: true,
    rebalanceThreshold: 10,
    smartSwitchEnabled: true,
    switchMinAPYGain: 0.8,
    compoundEnabled: true,
    riskGuardEnabled: true,
    maxSingleAssetPct: 40,
    notificationsEnabled: true,
    approvalRequired: true,
  });

  const [actions, setActions] = useState(RECENT_ACTIONS);
  const [showActionDetail, setShowActionDetail] = useState<AutoAction | null>(null);
  const [showActivateSheet, setShowActivateSheet] = useState(false);
  const [showPauseSheet, setShowPauseSheet] = useState(false);
  const [showToast, setShowToast] = useState<{ msg: string; color: string } | null>(null);

  /* Computed */
  const modeInfo = MODE_CONFIG[config.mode];
  const isActive = config.status === 'active';
  const isPaused = config.status === 'paused';
  const executedCount = actions.filter(a => a.status === 'executed').length;
  const pendingCount = actions.filter(a => a.status === 'needs_approval').length;
  const totalSavedAPY = actions.filter(a => a.impactValue > 0 && a.type !== 'dca_executed').reduce((s, a) => s + a.impactValue, 0);
  const totalDCA = actions.filter(a => a.type === 'dca_executed' && a.status === 'executed').reduce((s, a) => s + a.impactValue, 0);

  const performanceMetrics: PerformanceMetric[] = [
    { label: 'APY hiệu quả', value: '5.2%', change: 0.8, icon: TrendingUp, color: '#10B981' },
    { label: 'Tổng DCA', value: fmtUsd(totalDCA), change: totalDCA, icon: Repeat, color: '#3B82F6' },
    { label: 'Rebalance', value: '3 lần', change: 0, icon: RefreshCw, color: '#8B5CF6' },
    { label: 'Tối ưu APY', value: `+${totalSavedAPY.toFixed(1)}%`, change: totalSavedAPY, icon: Sparkles, color: '#F59E0B' },
  ];

  /* Handlers */
  const handleToggleStatus = useCallback(() => {
    if (config.status === 'inactive') {
      setShowActivateSheet(true);
    } else if (config.status === 'active') {
      setShowPauseSheet(true);
    } else {
      // Resume from paused
      setConfig(prev => ({ ...prev, status: 'active' }));
      hapticSuccess();
      setShowToast({ msg: 'AutoPilot đã tiếp tục hoạt động!', color: '#10B981' });
      setTimeout(() => setShowToast(null), 3000);
    }
    hapticSelection();
  }, [config.status, hapticSelection, hapticSuccess]);

  const handleActivate = useCallback(() => {
    setConfig(prev => ({ ...prev, status: 'active' }));
    setShowActivateSheet(false);
    hapticSuccess();
    setShowToast({ msg: 'AutoPilot đã được kích hoạt!', color: '#10B981' });
    setTimeout(() => setShowToast(null), 3000);
  }, [hapticSuccess]);

  const handlePause = useCallback(() => {
    setConfig(prev => ({ ...prev, status: 'paused' }));
    setShowPauseSheet(false);
    hapticHeavy();
    setShowToast({ msg: 'AutoPilot đã tạm dừng.', color: '#F59E0B' });
    setTimeout(() => setShowToast(null), 3000);
  }, [hapticHeavy]);

  const handleApproveAction = useCallback((id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'executed' as const } : a));
    hapticSuccess();
    setShowActionDetail(null);
    setShowToast({ msg: 'Đã phê duyệt hành động!', color: '#10B981' });
    setTimeout(() => setShowToast(null), 2500);
  }, [hapticSuccess]);

  const handleSkipAction = useCallback((id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'skipped' as const } : a));
    hapticLight();
    setShowActionDetail(null);
  }, [hapticLight]);

  const updateConfig = useCallback(<K extends keyof AutoPilotConfig>(key: K, val: AutoPilotConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: val }));
    hapticLight();
  }, [hapticLight]);

  const TABS = [
    { id: 'overview' as const, label: 'Tổng quan' },
    { id: 'actions' as const, label: `Hoạt động (${pendingCount > 0 ? pendingCount : executedCount})` },
    { id: 'settings' as const, label: 'Cài đặt' },
  ];

  return (
    <PageLayout>
      {/* ─── Activate Sheet ─── */}
      <BottomSheetV2 open={showActivateSheet} onClose={() => setShowActivateSheet(false)} title="Kích hoạt AutoPilot">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)' }}>
              <Brain size={ICON_SIZE.lg} color="#10B981" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>AutoPilot Savings</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Quản lý tự động toàn bộ tiết kiệm</p>
            </div>
          </div>

          <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
              AutoPilot sẽ tự động thực hiện DCA, tái cân bằng, tối ưu APY và quản lý rủi ro theo chế độ <strong style={{ color: modeInfo.color }}>{modeInfo.label}</strong>.
            </p>
          </div>

          <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
            <BottomSheetRow label="Chế độ" value={modeInfo.label} valueColor={modeInfo.color} />
            <BottomSheetRow label="Ngân sách/tháng" value={fmtUsd(config.monthlyBudget)} />
            <BottomSheetRow label="DCA" value={config.dcaEnabled ? 'Bật' : 'Tắt'} valueColor={config.dcaEnabled ? '#10B981' : '#EF4444'} />
            <BottomSheetRow label="Rebalance" value={config.rebalanceEnabled ? 'Bật' : 'Tắt'} valueColor={config.rebalanceEnabled ? '#10B981' : '#EF4444'} />
            <BottomSheetRow label="Smart Switch" value={config.smartSwitchEnabled ? 'Bật' : 'Tắt'} valueColor={config.smartSwitchEnabled ? '#10B981' : '#EF4444'} />
            <BottomSheetRow label="Phê duyệt thủ công" value={config.approvalRequired ? 'Bật' : 'Tắt'} valueColor={config.approvalRequired ? '#3B82F6' : '#F59E0B'} />
          </div>

          {config.approvalRequired && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <Shield size={12} color="#3B82F6" className="mt-0.5 shrink-0" />
              <p style={{ color: c.text2, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
                Chế độ phê duyệt thủ công đang bật. Mọi hành động chuyển sản phẩm sẽ cần bạn xác nhận trước khi thực hiện.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 p-2.5 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={12} color="#F59E0B" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
              AutoPilot tự động giao dịch với tài sản của bạn. APY và điều kiện thị trường thay đổi liên tục.
              Đây không phải lời khuyên tài chính. Bạn có thể tạm dừng hoặc tắt bất kỳ lúc nào.
            </p>
          </div>

          <CTAButton onClick={handleActivate}>
            <Power size={ICON_SIZE.sm} className="mr-2 inline" />
            Kích hoạt AutoPilot
          </CTAButton>
        </div>
      </BottomSheetV2>

      {/* ─── Pause Sheet ─── */}
      <BottomSheetV2 open={showPauseSheet} onClose={() => setShowPauseSheet(false)} title="Tạm dừng AutoPilot">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)' }}>
              <Pause size={ICON_SIZE.lg} color="#F59E0B" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>Tạm dừng AutoPilot</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Các hành động tự động sẽ dừng lại</p>
            </div>
          </div>

          <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
              Khi tạm dừng: DCA sẽ không thực hiện, rebalance/switch tự động sẽ dừng lại.
              Các vị thế hiện tại vẫn giữ nguyên, lãi vẫn được tính bình thường.
            </p>
          </div>

          <div className="flex gap-2">
            <CTAButton variant="secondary" onClick={() => setShowPauseSheet(false)} className="flex-1">
              Hủy
            </CTAButton>
            <CTAButton variant="danger" onClick={handlePause} className="flex-1">
              <Pause size={ICON_SIZE.sm} className="mr-1.5 inline" />
              Tạm dừng
            </CTAButton>
          </div>
        </div>
      </BottomSheetV2>

      {/* ─── Action Detail Sheet ─── */}
      <BottomSheetV2 open={!!showActionDetail} onClose={() => setShowActionDetail(null)} title="Chi tiết hành động">
        {showActionDetail && (() => {
          const act = showActionDetail;
          const typeInfo = ACTION_CONFIG[act.type];
          const statusInfo = STATUS_CONFIG[act.status];
          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: typeInfo.bg }}>
                  <typeInfo.icon size={ICON_SIZE.base} color={typeInfo.color} />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{act.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded"
                      style={{ background: statusInfo.bg, color: statusInfo.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                      {statusInfo.label}
                    </span>
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{act.timestamp}</span>
                  </div>
                </div>
              </div>

              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>{act.description}</p>

              {act.impact && (
                <div className="p-3 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight size={ICON_SIZE.sm} color="#10B981" />
                    <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{act.impact}</span>
                  </div>
                </div>
              )}

              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                {Object.entries(act.details).map(([key, value]) => (
                  <BottomSheetRow key={key} label={key} value={value} />
                ))}
              </div>

              {act.status === 'needs_approval' && (
                <div className="flex gap-2">
                  <CTAButton variant="secondary" onClick={() => handleSkipAction(act.id)} className="flex-1">
                    Bỏ qua
                  </CTAButton>
                  <CTAButton onClick={() => handleApproveAction(act.id)} className="flex-1">
                    <CheckCircle size={ICON_SIZE.sm} className="mr-1.5 inline" />
                    Phê duyệt
                  </CTAButton>
                </div>
              )}
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ─── Toast ─── */}
      {showToast && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: c.surface, border: `1px solid ${showToast.color}`, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto' }}>
          <CheckCircle size={ICON_SIZE.md} color={showToast.color} />
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, flex: 1 }}>{showToast.msg}</p>
          <button onClick={() => setShowToast(null)}><X size={ICON_SIZE.sm} color={c.text3} /></button>
        </div>
      )}

      {/* ─── Header ─── */}
      <Header title="AutoPilot" back />

      {/* ─── Hero ─── */}
      <TrCard variant="hero" rounded="lg" className="mx-5 mt-4 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain size={ICON_SIZE.base} color={isActive ? '#10B981' : isPaused ? '#F59E0B' : c.text3} />
            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>AutoPilot Savings</span>
          </div>
          <button onClick={handleToggleStatus}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{
              background: isActive ? 'rgba(16,185,129,0.12)' : isPaused ? 'rgba(245,158,11,0.12)' : c.surface2,
              border: `1.5px solid ${isActive ? '#10B98140' : isPaused ? '#F59E0B40' : c.borderSolid}`,
            }}>
            {isActive ? <Play size={ICON_SIZE.sm} color="#10B981" /> : isPaused ? <Pause size={ICON_SIZE.sm} color="#F59E0B" /> : <Power size={ICON_SIZE.sm} color={c.text3} />}
            <span style={{
              color: isActive ? '#10B981' : isPaused ? '#F59E0B' : c.text3,
              fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold,
            }}>
              {isActive ? 'Đang chạy' : isPaused ? 'Tạm dừng' : 'Kích hoạt'}
            </span>
          </button>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Chế độ</p>
            <p style={{ color: modeInfo.color, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>{modeInfo.label}</p>
          </div>
          <div className="text-right">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Ngân sách/tháng</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {fmtUsd(config.monthlyBudget)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Hành động</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{executedCount}</p>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Cần duyệt</p>
            <p style={{ color: pendingCount > 0 ? '#3B82F6' : c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{pendingCount}</p>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY tăng</p>
            <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>+{totalSavedAPY.toFixed(1)}%</p>
          </TrCardStat>
        </div>
      </TrCard>

      {/* ─── TabBar ─── */}
      <div className="px-5 mt-4">
        <TabBar tabs={TABS} active={tab} onChange={(t) => setTab(t as typeof tab)} />
      </div>

      {/* ═══ Overview Tab ═══ */}
      {tab === 'overview' && (
        <PageContent padding="compact" gap="default">
          {/* Performance metrics */}
          <div className="grid grid-cols-2 gap-3">
            {performanceMetrics.map(m => {
              const Icon = m.icon;
              return (
                <TrCard key={m.label} className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={ICON_SIZE.sm} color={m.color} />
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>{m.label}</span>
                  </div>
                  <p style={{ color: m.color, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>{m.value}</p>
                </TrCard>
              );
            })}
          </div>

          {/* Active modules status */}
          <PageSection label="Modules đang hoạt động">
            <div className="flex flex-col gap-2">
              {[
                { label: 'DCA tự động', desc: `${MODE_CONFIG[config.mode].dcaFreq} · ${fmtUsd(config.monthlyBudget)}/tháng`, enabled: config.dcaEnabled, icon: Repeat, color: '#10B981', route: '/earn/savings/dca' },
                { label: 'Tái cân bằng', desc: `Ngưỡng: ${config.rebalanceThreshold}% drift`, enabled: config.rebalanceEnabled, icon: RefreshCw, color: '#3B82F6', route: '/earn/savings/rebalance' },
                { label: 'Smart Switch', desc: `Min APY gain: ${config.switchMinAPYGain}%`, enabled: config.smartSwitchEnabled, icon: Sparkles, color: '#8B5CF6', route: '/earn/savings/smart-suggestions' },
                { label: 'Lãi kép tự động', desc: 'Tự động tái đầu tư lãi', enabled: config.compoundEnabled, icon: Zap, color: '#06B6D4', route: '/earn/savings/auto-compound' },
                { label: 'Risk Guard', desc: `Max single-asset: ${config.maxSingleAssetPct}%`, enabled: config.riskGuardEnabled, icon: Shield, color: '#EF4444', route: '/earn/savings/risk-assessment' },
              ].map(mod => (
                <button key={mod.label}
                  onClick={() => { navigate(`${prefix}${mod.route}`); hapticSelection(); }}
                  className="flex items-center gap-3 p-3 rounded-xl text-left"
                  style={{ background: c.surface2, border: `1px solid ${mod.enabled ? 'transparent' : c.borderSolid}` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: mod.enabled ? mod.color + '15' : c.borderSolid + '66' }}>
                    <mod.icon size={ICON_SIZE.sm} color={mod.enabled ? mod.color : c.text3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{mod.label}</p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{mod.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 rounded"
                      style={{
                        background: mod.enabled ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: mod.enabled ? '#10B981' : '#EF4444',
                        fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold,
                      }}>
                      {mod.enabled ? 'BẬT' : 'TẮT'}
                    </span>
                    <ChevronRight size={ICON_SIZE.sm} color={c.text3} />
                  </div>
                </button>
              ))}
            </div>
          </PageSection>

          {/* Recent actions preview */}
          <PageSection label="Hành động gần đây">
            <div className="flex flex-col gap-2">
              {actions.slice(0, 3).map(act => {
                const typeInfo = ACTION_CONFIG[act.type];
                const statusInfo = STATUS_CONFIG[act.status];
                return (
                  <button key={act.id}
                    onClick={() => { setShowActionDetail(act); hapticSelection(); }}
                    className="flex items-center gap-3 p-3 rounded-xl text-left"
                    style={{ background: c.surface2 }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: typeInfo.bg }}>
                      <typeInfo.icon size={ICON_SIZE.sm} color={typeInfo.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{act.title}</p>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{act.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded"
                        style={{ background: statusInfo.bg, color: statusInfo.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                        {statusInfo.label}
                      </span>
                      <ChevronRight size={ICON_SIZE.sm} color={c.text3} />
                    </div>
                  </button>
                );
              })}
              <button onClick={() => { setTab('actions'); hapticSelection(); }}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl"
                style={{ background: c.chipBg, color: c.chipText, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, border: `1px solid ${c.chipBorder}` }}>
                Xem tất cả <ChevronRight size={ICON_SIZE.sm} />
              </button>
            </div>
          </PageSection>

          {/* How it works */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              AutoPilot kết hợp DCA + Rebalance + Smart Suggestions + Lãi kép thành một hệ thống tự động.
              Bạn có thể tạm dừng bất kỳ lúc nào và mọi hành động đều được ghi nhận.
            </p>
          </div>
        </PageContent>
      )}

      {/* ═══ Actions Tab ═══ */}
      {tab === 'actions' && (
        <PageContent padding="compact" gap="default">
          {/* Pending approvals first */}
          {pendingCount > 0 && (
            <PageSection label={`Cần phê duyệt (${pendingCount})`}>
              <div className="flex flex-col gap-2">
                {actions.filter(a => a.status === 'needs_approval').map(act => {
                  const typeInfo = ACTION_CONFIG[act.type];
                  return (
                    <TrCard key={act.id} className="p-4" accentBorder="rgba(59,130,246,0.3)">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: typeInfo.bg }}>
                          <typeInfo.icon size={ICON_SIZE.base} color={typeInfo.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="px-1.5 py-0.5 rounded"
                              style={{ background: typeInfo.bg, color: typeInfo.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                              {typeInfo.label}
                            </span>
                            <span className="px-1.5 py-0.5 rounded animate-pulse"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                              Cần duyệt
                            </span>
                          </div>
                          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginTop: 4 }}>{act.title}</p>
                          <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.4, marginTop: 2 }}>{act.description}</p>
                        </div>
                      </div>

                      {act.impact && (
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <ArrowUpRight size={ICON_SIZE.sm} color="#10B981" />
                          <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{act.impact}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => handleSkipAction(act.id)}
                          className="flex-1 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontWeight: FONT_WEIGHT.semibold, border: '1px solid rgba(239,68,68,0.15)' }}>
                          <X size={ICON_SIZE.sm} />
                          Bỏ qua
                        </button>
                        <button onClick={() => { setShowActionDetail(act); hapticSelection(); }}
                          className="flex-1 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                          style={{ background: c.chipBg, color: c.chipText, fontWeight: FONT_WEIGHT.semibold, border: `1px solid ${c.chipBorder}` }}>
                          <Eye size={ICON_SIZE.sm} />
                          Xem
                        </button>
                        <button onClick={() => handleApproveAction(act.id)}
                          className="flex-1 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontWeight: FONT_WEIGHT.semibold, border: '1px solid rgba(16,185,129,0.2)' }}>
                          <CheckCircle size={ICON_SIZE.sm} />
                          Duyệt
                        </button>
                      </div>
                    </TrCard>
                  );
                })}
              </div>
            </PageSection>
          )}

          {/* All actions timeline */}
          <PageSection label="Lịch sử hành động">
            <div className="flex flex-col gap-2">
              {actions.map(act => {
                const typeInfo = ACTION_CONFIG[act.type];
                const statusInfo = STATUS_CONFIG[act.status];
                return (
                  <button key={act.id}
                    onClick={() => { setShowActionDetail(act); hapticSelection(); }}
                    className="flex items-center gap-3 p-3 rounded-xl text-left"
                    style={{ background: c.surface2 }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: typeInfo.bg }}>
                      <typeInfo.icon size={ICON_SIZE.sm} color={typeInfo.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-1 py-0.5 rounded"
                          style={{ background: typeInfo.bg, color: typeInfo.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                          {typeInfo.label}
                        </span>
                        <span className="px-1 py-0.5 rounded"
                          style={{ background: statusInfo.bg, color: statusInfo.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginTop: 2 }}>{act.title}</p>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 1 }}>{act.timestamp}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {act.impact && (
                        <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{act.impact}</p>
                      )}
                      <ChevronRight size={ICON_SIZE.sm} color={c.text3} className="ml-auto mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </PageSection>
        </PageContent>
      )}

      {/* ═══ Settings Tab ═══ */}
      {tab === 'settings' && (
        <PageContent padding="compact" gap="default">
          {/* Mode selection */}
          <PageSection label="Chế độ AutoPilot">
            <div className="flex flex-col gap-2">
              {(Object.keys(MODE_CONFIG) as AutoPilotMode[]).map(key => {
                const m = MODE_CONFIG[key];
                const Icon = m.icon;
                return (
                  <button key={key}
                    onClick={() => { updateConfig('mode', key); hapticSelection(); }}
                    className="flex items-start gap-3 p-3.5 rounded-xl text-left"
                    style={{
                      background: config.mode === key ? m.color + '10' : c.surface2,
                      border: `1.5px solid ${config.mode === key ? m.color + '40' : 'transparent'}`,
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: config.mode === key ? m.color + '22' : c.borderSolid + '66' }}>
                      <Icon size={ICON_SIZE.sm} color={config.mode === key ? m.color : c.text3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{m.label}</p>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.4, marginTop: 2 }}>{m.desc}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>DCA: {m.dcaFreq}</span>
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Rebalance: {m.rebalanceThreshold}</span>
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Switch: {m.switchMinGain}</span>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1"
                      style={{ borderColor: config.mode === key ? m.color : c.borderSolid }}>
                      {config.mode === key && <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </PageSection>

          {/* Monthly budget */}
          <PageSection label="Ngân sách hằng tháng (USD)">
            <div className="flex items-center gap-3 rounded-2xl px-4"
              style={{ background: c.surface2, border: `1.5px solid rgba(59,130,246,0.3)`, height: 48, borderRadius: 14 }}>
              <DollarSign size={ICON_SIZE.sm} color="#3B82F6" />
              <input type="number" inputMode="decimal" value={config.monthlyBudget}
                onChange={e => updateConfig('monthlyBudget', Math.max(0, Number(e.target.value) || 0))}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FONT_SCALE.base, flex: 1, fontFamily: 'monospace', fontWeight: FONT_WEIGHT.bold }} />
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>USD/tháng</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[500, 1000, 2000, 5000].map(v => (
                <button key={v} onClick={() => updateConfig('monthlyBudget', v)}
                  className="flex-1 py-1.5 rounded-xl text-xs"
                  style={{
                    background: config.monthlyBudget === v ? 'rgba(59,130,246,0.12)' : c.chipBg,
                    color: config.monthlyBudget === v ? '#3B82F6' : c.chipText,
                    border: `1px solid ${config.monthlyBudget === v ? '#3B82F640' : c.chipBorder}`,
                    fontWeight: FONT_WEIGHT.semibold,
                  }}>
                  {fmtUsd(v)}
                </button>
              ))}
            </div>
          </PageSection>

          {/* Module toggles */}
          <PageSection label="Modules tự động">
            <div className="flex flex-col gap-2">
              {[
                { key: 'dcaEnabled' as const, label: 'DCA tự động', desc: 'Tự động gửi tiết kiệm theo lịch', icon: Repeat, color: '#10B981' },
                { key: 'rebalanceEnabled' as const, label: 'Tái cân bằng tự động', desc: 'Cân bằng lại danh mục khi lệch', icon: RefreshCw, color: '#3B82F6' },
                { key: 'smartSwitchEnabled' as const, label: 'Smart Switch', desc: 'Chuyển sản phẩm khi APY tốt hơn', icon: Sparkles, color: '#8B5CF6' },
                { key: 'compoundEnabled' as const, label: 'Lãi kép tự động', desc: 'Tự động tái đầu tư tiền lãi', icon: Zap, color: '#06B6D4' },
                { key: 'riskGuardEnabled' as const, label: 'Risk Guard', desc: 'Bảo vệ chống tập trung rủi ro', icon: Shield, color: '#EF4444' },
              ].map(mod => (
                <div key={mod.key} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <mod.icon size={ICON_SIZE.sm} color={mod.color} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{mod.label}</p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{mod.desc}</p>
                  </div>
                  <Toggle on={config[mod.key]} onChange={(v) => updateConfig(mod.key, v)} />
                </div>
              ))}
            </div>
          </PageSection>

          {/* Safety settings */}
          <PageSection label="An toàn & Kiểm soát">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                <Shield size={ICON_SIZE.sm} color="#3B82F6" className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Phê duyệt thủ công</p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Yêu cầu xác nhận trước khi chuyển SP</p>
                </div>
                <Toggle on={config.approvalRequired} onChange={(v) => updateConfig('approvalRequired', v)} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                <Bell size={ICON_SIZE.sm} color="#F59E0B" className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Thông báo hành động</p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Nhận thông báo khi AutoPilot hành động</p>
                </div>
                <Toggle on={config.notificationsEnabled} onChange={(v) => updateConfig('notificationsEnabled', v)} />
              </div>
            </div>
          </PageSection>

          {/* Risk parameters */}
          <PageSection label="Tham số rủi ro">
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Ngưỡng rebalance</span>
                  <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{config.rebalanceThreshold}%</span>
                </div>
                <input type="range" min={3} max={25} step={1} value={config.rebalanceThreshold}
                  onChange={e => updateConfig('rebalanceThreshold', Number(e.target.value))}
                  className="w-full accent-blue-500" style={{ height: 4 }} />
                <div className="flex justify-between mt-1">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>3% (nhạy)</span>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>25% (ổn định)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Min APY gain cho switch</span>
                  <span style={{ color: '#8B5CF6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{config.switchMinAPYGain}%</span>
                </div>
                <input type="range" min={0.1} max={3} step={0.1} value={config.switchMinAPYGain}
                  onChange={e => updateConfig('switchMinAPYGain', Number(e.target.value))}
                  className="w-full accent-purple-500" style={{ height: 4 }} />
                <div className="flex justify-between mt-1">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>0.1% (nhạy)</span>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>3.0% (thận trọng)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Max single-asset</span>
                  <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{config.maxSingleAssetPct}%</span>
                </div>
                <input type="range" min={20} max={80} step={5} value={config.maxSingleAssetPct}
                  onChange={e => updateConfig('maxSingleAssetPct', Number(e.target.value))}
                  className="w-full accent-red-500" style={{ height: 4 }} />
                <div className="flex justify-between mt-1">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>20% (đa dạng)</span>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>80% (tập trung)</span>
                </div>
              </div>
            </div>
          </PageSection>

          {/* Safety disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              AutoPilot tự động thực hiện giao dịch với tài sản của bạn.
              Kết quả phụ thuộc vào điều kiện thị trường và thay đổi APY.
              Đây không phải lời khuyên tài chính. Bạn có thể tắt bất kỳ lúc nào.
            </p>
          </div>
        </PageContent>
      )}
    </PageLayout>
  );
}