import React, { useState, useMemo, useCallback } from 'react';
import {
  Sparkles, TrendingUp, TrendingDown, Shield, Zap, Target,
  ArrowRight, ArrowUpRight, ArrowDownRight, AlertTriangle,
  PiggyBank, Lock, Unlock, ChevronRight, BarChart3, Clock,
  RefreshCw, CheckCircle, X, Info, Repeat, Calendar,
  Lightbulb, ArrowLeftRight, Eye, EyeOff, ThumbsUp, ThumbsDown,
  Star, Award, Activity,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtUsd, fmtPct, fmtAmount } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';
import { useIsDark } from '../../hooks/useIsDark';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { ChartGradientDefs } from '../../components/charts/ChartGradientDefs';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type SuggestionType = 'dca_timing' | 'product_switch' | 'rebalance' | 'new_opportunity' | 'risk_alert' | 'compound_boost';
type SuggestionPriority = 'high' | 'medium' | 'low';
type SuggestionStatus = 'new' | 'viewed' | 'applied' | 'dismissed';

interface Suggestion {
  id: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  status: SuggestionStatus;
  title: string;
  description: string;
  reasoning: string;
  impact: string;
  impactValue: number;
  impactType: 'apy_gain' | 'risk_reduction' | 'earning_boost' | 'cost_saving';
  fromProduct?: string;
  toProduct?: string;
  fromAPY?: number;
  toAPY?: number;
  action: string;
  actionRoute?: string;
  confidence: number;
  createdAt: string;
  expiresAt?: string;
  tags: string[];
}

interface APYTrend {
  product: string;
  asset: string;
  color: string;
  data: { date: string; apy: number }[];
  currentAPY: number;
  avgAPY: number;
  trend: 'up' | 'down' | 'stable';
  prediction: number;
}

interface MarketSignal {
  id: string;
  title: string;
  type: 'bullish' | 'bearish' | 'neutral';
  impact: string;
  affectedProducts: string[];
  timestamp: string;
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */

const SUGGESTIONS: Suggestion[] = [
  {
    id: 'sg1', type: 'dca_timing', priority: 'high', status: 'new',
    title: 'Thời điểm DCA USDT tốt', description: 'APY USDT Linh hoạt vừa tăng từ 4.2% lên 4.8%, cao nhất 30 ngày. Nên tăng mức DCA để tận dụng lãi suất cao.',
    reasoning: 'APY tăng 14% so với trung bình 30 ngày. Xu hướng tăng kéo dài 5 ngày liên tiếp. Thanh khoản thị trường ổn định.',
    impact: '+0.6% APY so với trung bình', impactValue: 0.6, impactType: 'apy_gain',
    toProduct: 'USDT Linh hoạt', toAPY: 4.8,
    action: 'Tăng DCA', actionRoute: '/earn/savings/dca', confidence: 85,
    createdAt: '09/03/2026 14:30', expiresAt: '12/03/2026',
    tags: ['DCA', 'USDT', 'APY cao'],
  },
  {
    id: 'sg2', type: 'product_switch', priority: 'high', status: 'new',
    title: 'Chuyển SOL sang ETH Linh hoạt', description: 'SOL Cố định 30D sắp đáo hạn (22/03). ETH Linh hoạt đang có APY 4.2% — cao hơn SOL Linh hoạt (3.8%). Nên xem xét chuyển.',
    reasoning: 'SOL Cố định đáo hạn còn 13 ngày. ETH Linh hoạt APY vượt SOL Linh hoạt 0.4%. Rủi ro tương đương (thấp). Thanh khoản ETH tốt hơn.',
    impact: '+0.4% APY khi chuyển', impactValue: 0.4, impactType: 'apy_gain',
    fromProduct: 'SOL Cố định 30D', toProduct: 'ETH Linh hoạt',
    fromAPY: 6.5, toAPY: 4.2,
    action: 'Xem chi tiết', actionRoute: '/earn/savings/comparison', confidence: 72,
    createdAt: '09/03/2026 10:15', tags: ['Chuyển SP', 'SOL', 'ETH'],
  },
  {
    id: 'sg3', type: 'compound_boost', priority: 'medium', status: 'new',
    title: 'Bật lãi kép cho USDT', description: 'USDT Linh hoạt của bạn chưa bật lãi kép tự động. Bật lãi kép có thể tăng thu nhập thêm ~$12/năm với số dư hiện tại.',
    reasoning: 'Số dư $3,500 × 4.5% APY. Lãi kép hằng ngày tăng hiệu quả thêm ~0.34% APY thực tế. Không có rủi ro thêm.',
    impact: '+~$12/năm', impactValue: 12, impactType: 'earning_boost',
    toProduct: 'USDT Linh hoạt', toAPY: 4.5,
    action: 'Bật lãi kép', actionRoute: '/earn/savings/auto-compound', confidence: 95,
    createdAt: '08/03/2026 09:00', tags: ['Lãi kép', 'USDT', 'Tối ưu'],
  },
  {
    id: 'sg4', type: 'rebalance', priority: 'medium', status: 'viewed',
    title: 'Danh mục lệch 8% khỏi mục tiêu', description: 'Tỷ trọng USDT (68%) cao hơn mục tiêu (60%). Nên xem xét tái cân bằng để giảm rủi ro tập trung.',
    reasoning: 'Drift USDT +8% so với target. Drift BTC -5%. Tái cân bằng giúp đa dạng hóa và giảm rủi ro single-asset.',
    impact: 'Giảm rủi ro tập trung', impactValue: 8, impactType: 'risk_reduction',
    action: 'Tái cân bằng', actionRoute: '/earn/savings/rebalance', confidence: 78,
    createdAt: '07/03/2026 16:00', tags: ['Tái cân bằng', 'Đa dạng hóa'],
  },
  {
    id: 'sg5', type: 'new_opportunity', priority: 'low', status: 'new',
    title: 'Sản phẩm mới: AVAX Cố định 90D', description: 'AVAX Cố định 90D vừa ra mắt với APY 7.2% — cao nhất trong các sản phẩm tương đương rủi ro trung bình.',
    reasoning: 'APY 7.2% cao hơn trung bình nhóm locked 90D (5.8%). AVAX on-chain staking backing. Hạn mức còn 85%.',
    impact: 'APY 7.2% — cao nhất nhóm', impactValue: 7.2, impactType: 'apy_gain',
    toProduct: 'AVAX Cố định 90D', toAPY: 7.2,
    action: 'Xem sản phẩm', confidence: 65,
    createdAt: '06/03/2026 11:30', tags: ['Moi', 'AVAX', 'Locked'],
  },
  {
    id: 'sg6', type: 'risk_alert', priority: 'high', status: 'new',
    title: 'APY SOL giảm 15% trong 7 ngày', description: 'APY SOL Cố định giảm từ 7.5% xuống 6.5%. Xu hướng giảm có thể tiếp tục. Cần đánh giá lại vị thế.',
    reasoning: 'APY giảm 3 tuần liên tiếp. On-chain staking yield giảm theo. Dự báo APY có thể về 5.8% trong 2 tuần tới.',
    impact: '-1.0% APY dự báo', impactValue: -1.0, impactType: 'apy_gain',
    fromProduct: 'SOL Cố định 30D', fromAPY: 7.5, toAPY: 6.5,
    action: 'Xem xu hướng', confidence: 70,
    createdAt: '09/03/2026 08:00', tags: ['Cảnh báo', 'SOL', 'APY giảm'],
  },
];

const APY_TRENDS: APYTrend[] = [
  {
    product: 'USDT Linh hoạt', asset: 'USDT', color: '#26A17B',
    currentAPY: 4.8, avgAPY: 4.35, trend: 'up', prediction: 5.0,
    data: [
      { date: '01/02', apy: 4.0 }, { date: '08/02', apy: 4.1 }, { date: '15/02', apy: 4.0 },
      { date: '22/02', apy: 4.2 }, { date: '01/03', apy: 4.5 }, { date: '05/03', apy: 4.6 },
      { date: '09/03', apy: 4.8 },
    ],
  },
  {
    product: 'BTC Cố định 60D', asset: 'BTC', color: '#F7931A',
    currentAPY: 3.5, avgAPY: 3.6, trend: 'stable', prediction: 3.5,
    data: [
      { date: '01/02', apy: 3.7 }, { date: '08/02', apy: 3.6 }, { date: '15/02', apy: 3.5 },
      { date: '22/02', apy: 3.6 }, { date: '01/03', apy: 3.5 }, { date: '05/03', apy: 3.5 },
      { date: '09/03', apy: 3.5 },
    ],
  },
  {
    product: 'SOL Cố định 30D', asset: 'SOL', color: '#9945FF',
    currentAPY: 6.5, avgAPY: 7.1, trend: 'down', prediction: 5.8,
    data: [
      { date: '01/02', apy: 7.5 }, { date: '08/02', apy: 7.8 }, { date: '15/02', apy: 7.5 },
      { date: '22/02', apy: 7.2 }, { date: '01/03', apy: 7.0 }, { date: '05/03', apy: 6.8 },
      { date: '09/03', apy: 6.5 },
    ],
  },
  {
    product: 'ETH Linh hoạt', asset: 'ETH', color: '#627EEA',
    currentAPY: 4.2, avgAPY: 3.9, trend: 'up', prediction: 4.5,
    data: [
      { date: '01/02', apy: 3.5 }, { date: '08/02', apy: 3.6 }, { date: '15/02', apy: 3.8 },
      { date: '22/02', apy: 3.9 }, { date: '01/03', apy: 4.0 }, { date: '05/03', apy: 4.1 },
      { date: '09/03', apy: 4.2 },
    ],
  },
];

const MARKET_SIGNALS: MarketSignal[] = [
  {
    id: 'ms1', title: 'Fed giữ lãi suất ổn định — stablecoin yield tăng nhẹ',
    type: 'bullish', impact: 'APY stablecoin có thể tăng 0.3-0.5% trong 2 tuần tới',
    affectedProducts: ['USDT Linh hoạt', 'USDT Cố định'], timestamp: '09/03/2026 06:00',
  },
  {
    id: 'ms2', title: 'Ethereum Shanghai upgrade hoàn thành — staking yield ổn định',
    type: 'neutral', impact: 'ETH staking yield dự kiến duy trì ở mức 3.8-4.2%',
    affectedProducts: ['ETH Linh hoạt'], timestamp: '08/03/2026 14:00',
  },
  {
    id: 'ms3', title: 'Solana network congestion — validator rewards giảm',
    type: 'bearish', impact: 'SOL staking yield có thể giảm thêm 0.5-1.0% trong tháng 3',
    affectedProducts: ['SOL Cố định 30D', 'SOL Cố định 90D'], timestamp: '07/03/2026 20:00',
  },
];

const TYPE_CONFIG: Record<SuggestionType, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  dca_timing: { label: 'DCA Timing', icon: Repeat, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  product_switch: { label: 'Chuyển SP', icon: ArrowLeftRight, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  rebalance: { label: 'Tái cân bằng', icon: RefreshCw, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  new_opportunity: { label: 'Cơ hội mới', icon: Sparkles, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  risk_alert: { label: 'Cảnh báo', icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  compound_boost: { label: 'Tối ưu', icon: Zap, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
};

const PRIORITY_CONFIG: Record<SuggestionPriority, { label: string; color: string; bg: string }> = {
  high: { label: 'Ưu tiên cao', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  medium: { label: 'Trung bình', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  low: { label: 'Tham khảo', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
};

/* ═══════════════════════════════════════════════════════════
   Confidence Bar
   ═══════════════════════════════════════════════════════════ */

function ConfidenceBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const c = useThemeColors();
  const color = value >= 80 ? '#10B981' : value >= 60 ? '#F59E0B' : '#EF4444';
  const h = size === 'sm' ? 4 : 6;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full" style={{ background: c.borderSolid, height: h }}>
        <div className="h-full rounded-full transition-all" style={{ background: color, width: `${value}%` }} />
      </div>
      <span style={{ color, fontSize: size === 'sm' ? FONT_SCALE.micro : FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace', minWidth: 28 }}>
        {value}%
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */

export function SavingsSmartSuggestionsPage() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight, hapticSuccess } = useHaptic();
  const { isLoading } = useLoadingState({ loadOnly: true, initialDelay: 500 });

  /* State */
  const [tab, setTab] = useState<'suggestions' | 'trends' | 'signals'>('suggestions');
  const [suggestions, setSuggestions] = useState(SUGGESTIONS);
  const [showDetail, setShowDetail] = useState<Suggestion | null>(null);
  const [selectedTrend, setSelectedTrend] = useState<APYTrend | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | SuggestionPriority>('all');
  const [showAppliedToast, setShowAppliedToast] = useState(false);
  const [showDismissedToast, setShowDismissedToast] = useState(false);

  /* Computed */
  const newCount = suggestions.filter(s => s.status === 'new').length;
  const highCount = suggestions.filter(s => s.priority === 'high' && s.status !== 'dismissed').length;
  const filteredSuggestions = useMemo(() => {
    let result = suggestions.filter(s => s.status !== 'dismissed');
    if (filterPriority !== 'all') result = result.filter(s => s.priority === filterPriority);
    return result.sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    });
  }, [suggestions, filterPriority]);

  const potentialGain = suggestions
    .filter(s => s.status !== 'dismissed' && s.impactType === 'apy_gain' && s.impactValue > 0)
    .reduce((s, sg) => s + sg.impactValue, 0);

  /* Handlers */
  const handleApply = useCallback((id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'applied' as const } : s));
    const sg = suggestions.find(s => s.id === id);
    hapticSuccess();
    setShowDetail(null);
    if (sg?.actionRoute) {
      navigate(`${prefix}${sg.actionRoute}`);
    } else {
      setShowAppliedToast(true);
      setTimeout(() => setShowAppliedToast(false), 3000);
    }
  }, [suggestions, navigate, prefix, hapticSuccess]);

  const handleDismiss = useCallback((id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'dismissed' as const } : s));
    hapticLight();
    setShowDetail(null);
    setShowDismissedToast(true);
    setTimeout(() => setShowDismissedToast(false), 2000);
  }, [hapticLight]);

  const handleViewDetail = useCallback((sg: Suggestion) => {
    setSuggestions(prev => prev.map(s => s.id === sg.id && s.status === 'new' ? { ...s, status: 'viewed' as const } : s));
    setShowDetail(sg);
    hapticSelection();
  }, [hapticSelection]);

  const TABS = [
    { id: 'suggestions' as const, label: `Gợi ý (${newCount})` },
    { id: 'trends' as const, label: 'Xu hướng APY' },
    { id: 'signals' as const, label: 'Tin hiệu' },
  ];

  return (
    <PageLayout>
      {/* ─── Suggestion Detail Sheet ─── */}
      <BottomSheetV2 open={!!showDetail} onClose={() => setShowDetail(null)} title="Chi tiết gợi ý">
        {showDetail && (() => {
          const sg = showDetail;
          const typeInfo = TYPE_CONFIG[sg.type];
          const prioInfo = PRIORITY_CONFIG[sg.priority];
          return (
            <div className="flex flex-col gap-4">
              {/* Type & priority */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: typeInfo.bg, color: typeInfo.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  <typeInfo.icon size={ICON_SIZE.sm} /> {typeInfo.label}
                </span>
                <span className="px-2 py-1 rounded-lg" style={{ background: prioInfo.bg, color: prioInfo.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  {prioInfo.label}
                </span>
                {sg.status === 'new' && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>

              {/* Title & description */}
              <div>
                <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, lineHeight: 1.4 }}>{sg.title}</p>
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6, marginTop: 8 }}>{sg.description}</p>
              </div>

              {/* Product switch visual */}
              {sg.fromProduct && sg.toProduct && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <div className="flex-1 text-center">
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Hiện tại</p>
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{sg.fromProduct}</p>
                    {sg.fromAPY && <p style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{sg.fromAPY}% APY</p>}
                  </div>
                  <ArrowRight size={ICON_SIZE.base} color={c.text3} />
                  <div className="flex-1 text-center">
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Gợi ý</p>
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{sg.toProduct}</p>
                    {sg.toAPY && <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{sg.toAPY}% APY</p>}
                  </div>
                </div>
              )}

              {/* Impact */}
              <div className="p-3 rounded-xl" style={{
                background: sg.impactValue >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${sg.impactValue >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}>
                <div className="flex items-center gap-2 mb-1">
                  {sg.impactValue >= 0 ? <ArrowUpRight size={ICON_SIZE.sm} color="#10B981" /> : <ArrowDownRight size={ICON_SIZE.sm} color="#EF4444" />}
                  <span style={{ color: sg.impactValue >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                    {sg.impact}
                  </span>
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={ICON_SIZE.sm} color="#F59E0B" />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Lý do gợi ý</span>
                </div>
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6, paddingLeft: 22 }}>{sg.reasoning}</p>
              </div>

              {/* Confidence */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Độ tin cậy</span>
                </div>
                <ConfidenceBar value={sg.confidence} />
              </div>

              {/* Meta */}
              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <BottomSheetRow label="Tạo lúc" value={sg.createdAt} />
                {sg.expiresAt && <BottomSheetRow label="Hết hạn" value={sg.expiresAt} valueColor="#F59E0B" />}
                <BottomSheetRow label="Tags" value={sg.tags.join(' · ')} />
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="mt-0.5 shrink-0" />
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                  Đây là gợi ý dựa trên phân tích dữ liệu. Không phải lời khuyên tài chính. 
                  APY và điều kiện thị trường có thể thay đổi. Luôn đánh giá trước khi hành động.
                </p>
              </div>

              {/* Actions */}
              {sg.status !== 'applied' && (
                <div className="flex gap-2">
                  <CTAButton variant="secondary" onClick={() => handleDismiss(sg.id)} className="flex-1">
                    Bỏ qua
                  </CTAButton>
                  <CTAButton onClick={() => handleApply(sg.id)} className="flex-1">
                    {sg.action}
                  </CTAButton>
                </div>
              )}

              {sg.status === 'applied' && (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircle size={ICON_SIZE.sm} color="#10B981" />
                  <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Đã áp dụng gợi ý này</span>
                </div>
              )}
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ─── APY Trend Detail Sheet ─── */}
      <BottomSheetV2 open={!!selectedTrend} onClose={() => setSelectedTrend(null)} title="Chi tiết xu hướng APY">
        {selectedTrend && (() => {
          const trend = selectedTrend;
          const trendIcon = trend.trend === 'up' ? ArrowUpRight : trend.trend === 'down' ? ArrowDownRight : ArrowRight;
          const trendColor = trend.trend === 'up' ? '#10B981' : trend.trend === 'down' ? '#EF4444' : '#F59E0B';
          const trendLabel = trend.trend === 'up' ? 'Tăng' : trend.trend === 'down' ? 'Giảm' : 'On định';
          const TrendIcon = trendIcon;
          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: trend.color + '22', border: `1.5px solid ${trend.color}44` }}>
                  <span style={{ color: trend.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>{trend.asset}</span>
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{trend.product}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TrendIcon size={ICON_SIZE.sm} color={trendColor} />
                    <span style={{ color: trendColor, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{trendLabel}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p style={{ color: trendColor, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>{trend.currentAPY}%</p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY hiện tại</p>
                </div>
              </div>

              {/* Chart */}
              <div className="rounded-xl p-3" style={{ background: c.surface2, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend.data} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                    <ChartGradientDefs key="gradient-defs" gradients={[
                      { id: `fill-${trend.asset}`, color: trend.color, opacityFrom: 0.25 },
                    ]} />
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
                    <XAxis key="x" dataKey="date" tick={{ fontSize: 10, fill: c.text3 }} axisLine={false} tickLine={false} />
                    <YAxis key="y" tick={{ fontSize: 10, fill: c.text3 }} axisLine={false} tickLine={false} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <Tooltip key="tooltip" contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }} />
                    <ReferenceLine key="ref-avg" y={trend.avgAPY} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: `TB ${trend.avgAPY}%`, fill: '#F59E0B', fontSize: 9, position: 'right' }} />
                    <Area key="area" type="monotone" dataKey="apy" stroke={trend.color} strokeWidth={2} fill={`url(#fill-${trend.asset})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Trung bình 30D</p>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{trend.avgAPY}%</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Hiện tại</p>
                  <p style={{ color: trendColor, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{trend.currentAPY}%</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Dự báo</p>
                  <p style={{ color: trend.prediction > trend.currentAPY ? '#10B981' : trend.prediction < trend.currentAPY ? '#EF4444' : '#F59E0B', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                    {trend.prediction}%
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
                <p style={{ color: c.text2, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
                  Dự báo APY dựa trên xu hướng 30 ngày và điều kiện on-chain. Kết quả thực tế có thể khác biệt.
                </p>
              </div>
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ─── Toasts ─── */}
      {showAppliedToast && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: c.surface, border: '1px solid #10B981', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto' }}>
          <CheckCircle size={ICON_SIZE.md} color="#10B981" />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Đã áp dụng gợi ý!</p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Chuyển đến trang tương ứng để hoàn tất.</p>
          </div>
          <button onClick={() => setShowAppliedToast(false)}><X size={ICON_SIZE.sm} color={c.text3} /></button>
        </div>
      )}
      {showDismissedToast && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto' }}>
          <EyeOff size={ICON_SIZE.base} color={c.text3} />
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Đã bỏ qua gợi ý này</p>
          <button onClick={() => setShowDismissedToast(false)}><X size={ICON_SIZE.sm} color={c.text3} /></button>
        </div>
      )}

      {/* ─── Header ─── */}
      <Header title="Gợi ý thông minh" back />

      {/* ─── Hero Summary ─── */}
      <TrCard variant="hero" rounded="lg" className="mx-5 mt-4 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={ICON_SIZE.base} color="#F59E0B" />
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Smart Suggestions</span>
        </div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Gợi ý chưa xử lý</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold }}>{newCount}</p>
          </div>
          <div className="text-right">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Tiềm năng APY tăng</p>
            <p style={{ color: '#10B981', fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>
              +{potentialGain.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Ưu tiên cao</p>
            <p style={{ color: '#EF4444', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{highCount}</p>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Xu hướng</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={ICON_SIZE.sm} color="#10B981" />
              <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{APY_TRENDS.filter(t => t.trend === 'up').length} tăng</p>
            </div>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tin hiệu</p>
            <p style={{ color: '#3B82F6', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{MARKET_SIGNALS.length}</p>
          </TrCardStat>
        </div>
      </TrCard>

      {/* ─── TabBar ─── */}
      <div className="px-5 mt-4">
        <TabBar tabs={TABS} active={tab} onChange={(t) => setTab(t as typeof tab)} />
      </div>

      {/* ═══ Suggestions Tab ═══ */}
      {tab === 'suggestions' && (
        <PageContent padding="compact" gap="default">
          {/* Priority filter */}
          <div className="flex gap-2">
            {([
              { id: 'all' as const, label: 'Tất cả' },
              { id: 'high' as const, label: 'Ưu tiên', color: '#EF4444' },
              { id: 'medium' as const, label: 'Trung bình', color: '#F59E0B' },
              { id: 'low' as const, label: 'Tham khảo', color: '#3B82F6' },
            ]).map(f => (
              <button key={f.id}
                onClick={() => { setFilterPriority(f.id); hapticSelection(); }}
                className="px-3 py-1.5 rounded-xl text-xs"
                style={{
                  background: filterPriority === f.id ? (f.color ? f.color + '18' : c.chipActiveBg) : c.chipBg,
                  color: filterPriority === f.id ? (f.color ?? c.chipActiveText) : c.chipText,
                  border: `1px solid ${filterPriority === f.id ? (f.color ? f.color + '40' : c.chipActiveBorder) : c.chipBorder}`,
                  fontWeight: FONT_WEIGHT.semibold,
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Suggestion cards */}
          {filteredSuggestions.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
                <CheckCircle size={ICON_SIZE.xl} color={c.text3} />
              </div>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Không có gợi ý nào</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, textAlign: 'center', maxWidth: 260 }}>
                Tất cả gợi ý đã được xử lý hoặc không có gợi ý mới phù hợp.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredSuggestions.map(sg => {
                const typeInfo = TYPE_CONFIG[sg.type];
                const prioInfo = PRIORITY_CONFIG[sg.priority];
                return (
                  <TrCard key={sg.id} hover className="p-4"
                    onClick={() => handleViewDetail(sg)}>
                    {/* Header row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: typeInfo.bg }}>
                        <typeInfo.icon size={ICON_SIZE.base} color={typeInfo.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded" style={{ background: typeInfo.bg, color: typeInfo.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                            {typeInfo.label}
                          </span>
                          <span className="px-1.5 py-0.5 rounded" style={{ background: prioInfo.bg, color: prioInfo.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                            {prioInfo.label}
                          </span>
                          {sg.status === 'new' && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                          {sg.status === 'applied' && (
                            <CheckCircle size={ICON_SIZE.sm} color="#10B981" />
                          )}
                        </div>
                        <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, lineHeight: 1.4, marginTop: 4 }}>
                          {sg.title}
                        </p>
                      </div>
                    </div>

                    {/* Impact */}
                    <div className="flex items-center gap-2 mb-2 px-1">
                      {sg.impactValue >= 0
                        ? <ArrowUpRight size={ICON_SIZE.sm} color="#10B981" />
                        : <ArrowDownRight size={ICON_SIZE.sm} color="#EF4444" />}
                      <span style={{ color: sg.impactValue >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                        {sg.impact}
                      </span>
                    </div>

                    {/* Confidence */}
                    <div className="px-1 mb-2">
                      <ConfidenceBar value={sg.confidence} size="sm" />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3"
                      style={{ borderTop: `1px solid ${c.divider}` }}>
                      <div className="flex items-center gap-1.5">
                        <Clock size={ICON_SIZE.sm} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{sg.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sg.status !== 'applied' && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); handleDismiss(sg.id); }}
                              className="p-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)' }}>
                              <ThumbsDown size={ICON_SIZE.sm} color="#EF4444" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleApply(sg.id); }}
                              className="p-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)' }}>
                              <ThumbsUp size={ICON_SIZE.sm} color="#10B981" />
                            </button>
                          </>
                        )}
                        <ChevronRight size={ICON_SIZE.sm} color={c.text3} />
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          )}

          {/* Algorithm disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              Gợi ý dựa trên phân tích xu hướng APY
            </p>
          </div>
        </PageContent>
      )}

      {/* ═══ Trends Tab ═══ */}
      {tab === 'trends' && (
        <PageContent padding="compact" gap="default">
          {/* Trend overview chart */}
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={ICON_SIZE.sm} color="#3B82F6" />
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>APY 30 ngày</span>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
                  <XAxis key="x" dataKey="date" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false}
                    type="category" allowDuplicatedCategory={false} />
                  <YAxis key="y" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip key="tooltip" contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }} />
                  {APY_TRENDS.map(t => (
                    <Line key={t.asset} data={t.data} type="monotone" dataKey="apy" name={t.product}
                      stroke={t.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {APY_TRENDS.map(t => (
                <div key={t.asset} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{t.asset}</span>
                </div>
              ))}
            </div>
          </TrCard>

          {/* Product trend cards */}
          <div className="flex flex-col gap-3">
            {APY_TRENDS.map(trend => {
              const trendColor = trend.trend === 'up' ? '#10B981' : trend.trend === 'down' ? '#EF4444' : '#F59E0B';
              const trendLabel = trend.trend === 'up' ? 'Tăng' : trend.trend === 'down' ? 'Giảm' : 'On định';
              const TrendIcon = trend.trend === 'up' ? ArrowUpRight : trend.trend === 'down' ? ArrowDownRight : ArrowRight;
              const diff = trend.currentAPY - trend.avgAPY;

              return (
                <TrCard key={trend.asset} hover className="p-4"
                  onClick={() => { setSelectedTrend(trend); hapticSelection(); }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: trend.color + '22', border: `1.5px solid ${trend.color}44` }}>
                      <span style={{ color: trend.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>{trend.asset}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{trend.product}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <TrendIcon size={ICON_SIZE.sm} color={trendColor} />
                        <span style={{ color: trendColor, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{trendLabel}</span>
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                          TB: {trend.avgAPY}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ color: trendColor, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{trend.currentAPY}%</p>
                      <p style={{ color: diff >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(1)}% vs TB
                      </p>
                    </div>
                  </div>

                  {/* Mini sparkline */}
                  <div className="mt-3" style={{ height: 40 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trend.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <ChartGradientDefs key="gradient-defs" gradients={[
                          { id: `spark-${trend.asset}`, color: trendColor, opacityFrom: 0.2 },
                        ]} />
                        <Area key="area" type="monotone" dataKey="apy" stroke={trendColor} strokeWidth={1.5}
                          fill={`url(#spark-${trend.asset})`} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Prediction */}
                  <div className="flex items-center justify-between mt-2 pt-2"
                    style={{ borderTop: `1px solid ${c.divider}` }}>
                    <div className="flex items-center gap-1">
                      <Target size={ICON_SIZE.sm} color={c.text3} />
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Dự báo: </span>
                      <span style={{
                        color: trend.prediction > trend.currentAPY ? '#10B981' : trend.prediction < trend.currentAPY ? '#EF4444' : '#F59E0B',
                        fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold,
                      }}>
                        {trend.prediction}%
                      </span>
                    </div>
                    <ChevronRight size={ICON_SIZE.sm} color={c.text3} />
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageContent>
      )}

      {/* ═══ Signals Tab ═══ */}
      {tab === 'signals' && (
        <PageContent padding="compact" gap="default">
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
              Tin hiệu thị trường ảnh hưởng
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {MARKET_SIGNALS.map(signal => {
              const signalColor = signal.type === 'bullish' ? '#10B981' : signal.type === 'bearish' ? '#EF4444' : '#F59E0B';
              const signalBg = signal.type === 'bullish' ? 'rgba(16,185,129,0.1)' : signal.type === 'bearish' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
              const signalLabel = signal.type === 'bullish' ? 'Tích cực' : signal.type === 'bearish' ? 'Tiêu cực' : 'Trung tính';
              const SignalIcon = signal.type === 'bullish' ? TrendingUp : signal.type === 'bearish' ? TrendingDown : Activity;

              return (
                <TrCard key={signal.id} className="p-4">
                  {/* Signal header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: signalBg }}>
                      <SignalIcon size={ICON_SIZE.base} color={signalColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded"
                          style={{ background: signalBg, color: signalColor, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                          {signalLabel}
                        </span>
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{signal.timestamp}</span>
                      </div>
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, lineHeight: 1.4 }}>
                        {signal.title}
                      </p>
                    </div>
                  </div>

                  {/* Impact */}
                  <div className="p-2.5 rounded-xl mb-3" style={{ background: c.surface2 }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle size={ICON_SIZE.sm} color={signalColor} />
                      <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Tác động dự kiến</span>
                    </div>
                    <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>{signal.impact}</p>
                  </div>

                  {/* Affected products */}
                  <div className="flex flex-wrap gap-1.5">
                    {signal.affectedProducts.map(product => (
                      <span key={product} className="px-2 py-1 rounded-lg"
                        style={{ background: c.chipBg, color: c.chipText, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium, border: `1px solid ${c.chipBorder}` }}>
                        {product}
                      </span>
                    ))}
                  </div>
                </TrCard>
              );
            })}
          </div>

          {/* Load more placeholder */}
          <div className="flex justify-center py-4">
            <button className="px-6 py-2.5 rounded-xl"
              style={{ background: c.surface2, color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, border: `1px solid ${c.borderSolid}` }}>
              Xem thêm tin hiệu
            </button>
          </div>
        </PageContent>
      )}
    </PageLayout>
  );
}