import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import {
  Shield, ShieldCheck, CheckCircle, XCircle, Clock,
  FileText, AlertTriangle, ChevronRight, Info,
  DollarSign, Search, Bell, TrendingUp,
  ArrowUpRight, Activity, Lock, ExternalLink,
  Scale, HeartPulse, Calculator, BarChart3,
  Users, Zap, Award, ShieldAlert, Target, Bookmark, HelpCircle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtVnd, fmtCompact } from '../../data/formatNumber';
import { φ, φSpace } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { toast } from 'sonner';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { useSheetAnalytics } from '../../hooks/useSheetAnalytics';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import { InsuranceOnboardingTour } from '../../components/insurance/InsuranceOnboardingTour';

/* ═══════════════════════════════════════════════════════════
   P2P Insurance Fund — Enterprise Trust & Transparency
   ═══════════════════════════════════════════════════════════ */

type ActiveTab = 'overview' | 'claims';
type ClaimStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'paid';
type ClaimReason = 'fraud' | 'chargeback' | 'dispute_error' | 'other';

interface InsuranceClaim {
  id: string;
  claimCode: string;
  orderId: string;
  reason: ClaimReason;
  amount: number;
  paidAmount?: number;
  status: ClaimStatus;
  submittedAt: string;
}

/* ─── Mock Data ─── */

const MOCK_CLAIMS: InsuranceClaim[] = [
  {
    id: 'ic001', claimCode: 'CLM-001', orderId: 'P2P-78400',
    reason: 'fraud', amount: 15_000_000, paidAmount: 12_750_000,
    status: 'paid', submittedAt: '2026-02-18',
  },
  {
    id: 'ic002', claimCode: 'CLM-002', orderId: 'P2P-78412',
    reason: 'chargeback', amount: 8_000_000,
    status: 'reviewing', submittedAt: '2026-02-23',
  },
  {
    id: 'ic003', claimCode: 'CLM-003', orderId: 'P2P-78415',
    reason: 'dispute_error', amount: 50_000_000,
    status: 'approved', submittedAt: '2026-02-22',
  },
  {
    id: 'ic004', claimCode: 'CLM-004', orderId: 'P2P-78390',
    reason: 'other', amount: 3_000_000,
    status: 'rejected', submittedAt: '2026-02-20',
  },
  {
    id: 'ic005', claimCode: 'CLM-005', orderId: 'P2P-78425',
    reason: 'fraud', amount: 25_000_000,
    status: 'pending', submittedAt: '2026-02-25',
  },
];

const CLAIM_REASON_LABELS: Record<ClaimReason, string> = {
  fraud: 'Gian lận',
  chargeback: 'Chargeback',
  dispute_error: 'Lỗi dispute',
  other: 'Khác',
};

const CLAIM_STATUS_CONFIG: Record<ClaimStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Chờ xử lý', color: '#F59E0B', icon: Clock },
  reviewing: { label: 'Đang xem xét', color: '#3B82F6', icon: Search },
  approved: { label: 'Đã duyệt', color: '#10B981', icon: CheckCircle },
  rejected: { label: 'Từ chối', color: '#EF4444', icon: XCircle },
  paid: { label: 'Đã chi trả', color: '#10B981', icon: DollarSign },
};

/* ─── Coverage Tiers ─── */

interface TierInfo {
  name: string;
  coveragePct: string;
  bonus?: string;
  highlight?: boolean;
}

const COVERAGE_TIERS: TierInfo[] = [
  { name: 'Thường', coveragePct: 'Không có' },
  { name: 'Xác minh', coveragePct: '70%' },
  { name: 'Pro', coveragePct: '85%', highlight: true },
  { name: 'Elite', coveragePct: '100%', bonus: '+10%' },
];

/* ─── Fund Stats ─── */
const FUND_STATS = {
  totalFund: 523_000_000,
  activeClaims: 3,
  totalContributed: 780_000_000,
  totalPaid: 257_000_000,
};

/* ─── Fund Solvency & Governance (TIER 1.2) ─── */
const FUND_SOLVENCY = {
  outstandingClaimsAmount: 83_000_000,   // CLM-002 (8M) + CLM-003 (50M) + CLM-005 (25M)
  solvencyRatio: 6.3,                    // totalFund / outstandingClaimsAmount
  healthStatus: 'healthy' as 'healthy' | 'warning' | 'critical',
  lastAuditDate: '28/02/2026',
  auditorName: 'Deloitte Vietnam',
  nextAuditDate: '31/03/2026',
  maxClaimPerPeriod: 100_000_000,        // 100M VND per 30 days
  claimWindowDays: 7,
  approvalRate: 78.5,                    // % all-time
  avgResolutionHours: 36,
};

const HEALTH_CONFIG: Record<typeof FUND_SOLVENCY.healthStatus, { label: string; color: string; desc: string }> = {
  healthy:  { label: 'Khỏe mạnh', color: '#10B981', desc: 'Quỹ đủ khả năng chi trả toàn bộ claims đang xử lý' },
  warning:  { label: 'Cảnh báo',  color: '#F59E0B', desc: 'Tỷ lệ thanh khoản đang giảm, cần theo dõi' },
  critical: { label: 'Nguy hiểm', color: '#EF4444', desc: 'Quỹ không đủ chi trả, đang tạm ngưng nhận claims' },
};

/* ─── Mock Order Lookup for Amount Validation (TIER 1.4) ─── */
const MOCK_ORDER_LOOKUP: Record<string, { amount: number; coin: string; date: string; hasExistingClaim: boolean }> = {
  'P2P-78400': { amount: 15_000_000, coin: 'USDT', date: '2026-02-18', hasExistingClaim: true },
  'P2P-78412': { amount: 8_000_000, coin: 'BTC', date: '2026-02-23', hasExistingClaim: true },
  'P2P-78415': { amount: 50_000_000, coin: 'ETH', date: '2026-02-22', hasExistingClaim: true },
  'P2P-78390': { amount: 3_000_000, coin: 'USDT', date: '2026-02-20', hasExistingClaim: true },
  'P2P-78425': { amount: 25_000_000, coin: 'BTC', date: '2026-02-25', hasExistingClaim: true },
  'P2P-78450': { amount: 42_000_000, coin: 'ETH', date: '2026-03-01', hasExistingClaim: false },
  'P2P-78460': { amount: 18_500_000, coin: 'USDT', date: '2026-03-02', hasExistingClaim: false },
  'P2P-78470': { amount: 7_200_000, coin: 'BTC', date: '2026-03-03', hasExistingClaim: false },
};

/* ─── Amount formatting helpers ─── */
const parseAmountInput = (raw: string): number => {
  const cleaned = raw.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
};

const formatAmountInput = (raw: string): string => {
  const num = parseAmountInput(raw);
  if (num === 0) return '';
  return num.toLocaleString('vi-VN');
};

/* ─── User Profile ─── */
const USER_PROFILE = {
  coveragePct: 85,
  tierName: 'Pro',
  contributionRate: '0.1%',
};

/* ─── Fund Balance Chart Data (30 days) ─── */
const FUND_CHART_DATA_30D = [
  { day: '01/02', balance: 380, inflow: 12, outflow: 5 },
  { day: '03/02', balance: 387, inflow: 10, outflow: 3 },
  { day: '05/02', balance: 394, inflow: 11, outflow: 4 },
  { day: '07/02', balance: 401, inflow: 14, outflow: 7 },
  { day: '09/02', balance: 408, inflow: 13, outflow: 6 },
  { day: '11/02', balance: 420, inflow: 18, outflow: 6 },
  { day: '13/02', balance: 430, inflow: 15, outflow: 5 },
  { day: '15/02', balance: 440, inflow: 16, outflow: 6 },
  { day: '17/02', balance: 455, inflow: 20, outflow: 5 },
  { day: '19/02', balance: 465, inflow: 17, outflow: 7 },
  { day: '21/02', balance: 478, inflow: 19, outflow: 6 },
  { day: '23/02', balance: 490, inflow: 18, outflow: 6 },
  { day: '25/02', balance: 505, inflow: 20, outflow: 5 },
  { day: '27/02', balance: 515, inflow: 15, outflow: 5 },
  { day: '01/03', balance: 523, inflow: 14, outflow: 6 },
];

const FUND_CHART_DATA_90D = [
  { day: '01/12', balance: 210, inflow: 8, outflow: 4 },
  { day: '08/12', balance: 225, inflow: 9, outflow: 5 },
  { day: '15/12', balance: 245, inflow: 12, outflow: 6 },
  { day: '22/12', balance: 260, inflow: 10, outflow: 3 },
  { day: '01/01', balance: 280, inflow: 14, outflow: 8 },
  { day: '08/01', balance: 300, inflow: 15, outflow: 5 },
  { day: '15/01', balance: 320, inflow: 16, outflow: 6 },
  { day: '22/01', balance: 345, inflow: 18, outflow: 7 },
  { day: '01/02', balance: 380, inflow: 12, outflow: 5 },
  { day: '08/02', balance: 405, inflow: 14, outflow: 6 },
  { day: '15/02', balance: 440, inflow: 16, outflow: 6 },
  { day: '22/02', balance: 490, inflow: 18, outflow: 6 },
  { day: '01/03', balance: 523, inflow: 14, outflow: 6 },
];

const getChartData = (range: ChartRange) => {
  if (range === '7d') return FUND_CHART_DATA_30D.slice(-5);
  if (range === '90d') return FUND_CHART_DATA_90D;
  return FUND_CHART_DATA_30D;
};

type ChartRange = '7d' | '30d' | '90d';

/* ─── Platform Statistics (TIER 2.1) ─── */
const PLATFORM_STATS = {
  totalClaimsAllTime: 847,
  totalAmountProcessed: 2_140_000_000,
  averageClaimAmount: 15_200_000,
  claimsThisMonth: 12,
  avgResolutionSpeed: '36h',
  fastestResolution: '4h',
  merchantsCovered: 1_240,
  totalPayouts: 257_000_000,
};

/* ─── Personal Claim Summary (TIER 2.2) ─── */
const PERSONAL_SUMMARY = {
  totalClaims: MOCK_CLAIMS.length,
  totalClaimed: MOCK_CLAIMS.reduce((sum, cl) => sum + cl.amount, 0),
  totalReceived: MOCK_CLAIMS.filter(cl => cl.paidAmount).reduce((sum, cl) => sum + (cl.paidAmount || 0), 0),
  pendingCount: MOCK_CLAIMS.filter(cl => cl.status === 'pending' || cl.status === 'reviewing').length,
  successRate: Math.round(MOCK_CLAIMS.filter(cl => cl.status === 'paid' || cl.status === 'approved').length / MOCK_CLAIMS.length * 100),
};

/* ─── Notification Prefs ─── */
interface NotifPref {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
}

const DEFAULT_NOTIF_PREFS: NotifPref[] = [
  { key: 'status_change', label: 'Thay đổi trạng thái', desc: 'Khi claim chuyển sang trạng thái mới', enabled: true },
  { key: 'reviewer_note', label: 'Ghi chú reviewer', desc: 'Khi có ghi chú mới từ nhân viên', enabled: true },
  { key: 'evidence_request', label: 'Yêu cầu bằng chứng', desc: 'Khi cần bổ sung tài liệu', enabled: true },
  { key: 'payment_complete', label: 'Chi trả hoàn tất', desc: 'Khi tiền đã chuyển vào ví', enabled: true },
  { key: 'fund_report', label: 'Báo cáo quỹ hàng tuần', desc: 'Cập nhật tình hình quỹ bảo hiểm', enabled: false },
];

/* ═══════════════════════════════════════════════════════════ */

export function P2PInsuranceFundPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [claimFilter, setClaimFilter] = useState<ClaimStatus | 'all'>('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showOnboardingTour, setShowOnboardingTour] = useState(() => {
    // Show tour for first-time visitors (simulated via sessionStorage)
    try {
      const seen = sessionStorage.getItem('p2p_insurance_tour_seen');
      return !seen;
    } catch {
      return true;
    }
  });

  const handleCloseTour = () => {
    setShowOnboardingTour(false);
    try {
      sessionStorage.setItem('p2p_insurance_tour_seen', '1');
    } catch {}
  };

  /* ─── Sheet Analytics ─── */
  const { onAfterOpen: onSubmitSheetOpen } = useSheetAnalytics('p2p-insurance-submit-claim');

  const filteredClaims = claimFilter === 'all'
    ? MOCK_CLAIMS
    : MOCK_CLAIMS.filter(cl => cl.status === claimFilter);

  const handleClaimTap = (claimId: string) => {
    hapticSelection();
    navigate(`${prefix}/p2p/insurance/claim/${claimId}`);
  };

  return (
    <PageLayout>
      <Header
        title="Quỹ bảo hiểm"
        subtitle="Bảo hiểm · P2P"
        back
        right={
          <button
            onClick={() => { setShowOnboardingTour(true); hapticSelection(); }}
            className="flex items-center justify-center"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: c.searchBg, border: `1px solid ${c.border}`,
            }}
            aria-label="Hướng dẫn sử dụng"
          >
            <HelpCircle size={18} color="#3B82F6" strokeWidth={1.8} />
          </button>
        }
      />

      {/* ── Tab Switcher ── */}
      <div className="px-5 pt-3 pb-1" style={{ flexShrink: 0 }}>
        <div className="flex rounded-xl p-1" style={{ background: c.surface2 }}>
          {(['overview', 'claims'] as const).map(tab => {
            const isActive = activeTab === tab;
            const label = tab === 'overview' ? 'Tổng quan' : 'Yêu cầu của tôi';
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); hapticSelection(); }}
                className="flex-1 py-2.5 rounded-lg text-center transition-all"
                style={{
                  fontSize: φ.body,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#fff' : c.text2,
                  background: isActive ? '#3B82F6' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      {activeTab === 'overview' ? (
        <OverviewTab c={c} stats={FUND_STATS} userProfile={USER_PROFILE} tiers={COVERAGE_TIERS} />
      ) : (
        <ClaimsTab
          c={c}
          claims={filteredClaims}
          allClaims={MOCK_CLAIMS}
          filter={claimFilter}
          setFilter={(f) => { setClaimFilter(f); hapticSelection(); }}
          onSubmitClaim={() => { setShowSubmitModal(true); hapticSelection(); }}
          onClaimTap={handleClaimTap}
        />
      )}

      {/* ── Submit Claim Modal → BottomSheetV2 bottom ── */}
      <SubmitClaimModal
        c={c}
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={() => {
          setShowSubmitModal(false);
          hapticSuccess();
          toast.success('Đã gửi yêu cầu', { description: 'Chúng tôi sẽ xem xét trong 24-48 giờ' });
        }}
        onAfterOpen={onSubmitSheetOpen}
      />

      {/* ── Insurance Onboarding Tour (TIER 6.3) ── */}
      <InsuranceOnboardingTour
        open={showOnboardingTour}
        onClose={handleCloseTour}
        userProfile={{
          tier: 'pro',
          tradingVolume30d: 125_000_000,
          totalTrades: 47,
          kycLevel: 2,
          has2FA: true,
          claimCount: 2,
          accountAgeDays: 180,
        }}
      />
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   OVERVIEW TAB
   ═══════════════════════════════════════════════════════════ */

interface OverviewTabProps {
  c: ReturnType<typeof useThemeColors>;
  stats: typeof FUND_STATS;
  userProfile: typeof USER_PROFILE;
  tiers: TierInfo[];
}

/* ─── Animated Stat Component (TIER 3.5) ─── */
interface AnimatedStatProps {
  value: number;
  suffix?: string;
  prefix?: string;
  formatFn?: (n: number) => string;
}

function AnimatedStat({ value, suffix = '', prefix = '', formatFn }: AnimatedStatProps) {
  const animatedValue = useAnimatedCounter(value);
  
  if (formatFn) {
    return <>{formatFn(animatedValue)}</>;
  }
  
  return <>{prefix}{animatedValue.toLocaleString('vi-VN')}{suffix}</>;
}

function OverviewTab({ c, stats, userProfile, tiers }: OverviewTabProps) {
  const [chartRange, setChartRange] = useState<ChartRange>('30d');
  const [notifPrefs, setNotifPrefs] = useState<NotifPref[]>(DEFAULT_NOTIF_PREFS);
  const [calcAmount, setCalcAmount] = useState('');
  const { hapticSelection } = useHaptic();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  const toggleNotifPref = (key: string) => {
    setNotifPrefs(prev => prev.map(p =>
      p.key === key ? { ...p, enabled: !p.enabled } : p
    ));
    hapticSelection();
    toast.success('Đã cập nhật thông báo');
  };

  const enabledCount = notifPrefs.filter(p => p.enabled).length;

  const handleCalcAmountChange = (raw: string) => {
    // Only keep digits
    const digits = raw.replace(/[^0-9]/g, '');
    setCalcAmount(digits);
  };

  const parsedCalcAmount = parseAmountInput(calcAmount);
  const displayCalcAmount = calcAmount ? formatAmountInput(calcAmount) : '';
  const calcPayout = parsedCalcAmount > 0 ? Math.round(parsedCalcAmount * userProfile.coveragePct / 100) : 0;

  return (
    <PageContent gap="relaxed">
      {/* ── Fund Summary Card ── */}
      <TrCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} color="#3B82F6" />
          <span style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>
            Quỹ bảo hiểm P2P
          </span>
        </div>

        <div className="grid grid-cols-2" style={{ gap: φSpace[4] }}>
          <div>
            <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Tổng quỹ</p>
            <p style={{
              color: '#10B981', fontSize: 22, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums', lineHeight: 1.3, marginTop: 2,
            }}>
              {fmtVnd(stats.totalFund)} đ
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Claims đang xử lý</p>
            <p style={{
              color: '#3B82F6', fontSize: 22, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums', lineHeight: 1.3, marginTop: 2,
            }}>
              {stats.activeClaims}
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Tổng đóng góp</p>
            <p style={{
              color: c.text1, fontSize: φ.base, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums', lineHeight: 1.3, marginTop: 2,
            }}>
              {fmtVnd(stats.totalContributed)} đ
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Đã chi trả</p>
            <p style={{
              color: c.text1, fontSize: φ.base, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums', lineHeight: 1.3, marginTop: 2,
            }}>
              {fmtVnd(stats.totalPaid)} đ
            </p>
          </div>
        </div>
      </TrCard>

      {/* ── Contribution History CTA (TIER 3.4) ── */}
      <TrCard
        className="p-4"
        onClick={() => {
          hapticSelection();
          navigate(`${prefix}/p2p/insurance/contribution-history`);
        }}
        style={{ cursor: 'pointer' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.08)' }}
            >
              <FileText size={18} color="#10B981" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, lineHeight: 1.5 }}>
                Lịch sử đóng góp
              </p>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                Xem chi tiết các lần trích phí vào quỹ
              </p>
            </div>
          </div>
          <ChevronRight size={18} color={c.text3} />
        </div>
      </TrCard>

      {/* ── Enterprise Quick Actions (TIER 5) ── */}
      <div className="flex flex-col" style={{ gap: φSpace[2] }}>
        <TrCard
          className="p-4"
          onClick={() => {
            hapticSelection();
            navigate(`${prefix}/p2p/insurance/score`);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.08)' }}
              >
                <Target size={18} color="#8B5CF6" />
              </div>
              <div>
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, lineHeight: 1.5 }}>
                  Điểm bảo vệ
                </p>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  Xem điểm bảo vệ cá nhân và lộ trình nâng tier
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: '#3B82F6', fontSize: φ.body, fontWeight: 700 }}>78/100</span>
              <ChevronRight size={18} color={c.text3} />
            </div>
          </div>
        </TrCard>

        <TrCard
          className="p-4"
          onClick={() => {
            hapticSelection();
            navigate(`${prefix}/p2p/fraud-prevention`);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.08)' }}
              >
                <ShieldAlert size={18} color="#EF4444" />
              </div>
              <div>
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, lineHeight: 1.5 }}>
                  Phòng chống gian lận
                </p>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  Nhận biết scam, checklist an toàn P2P
                </p>
              </div>
            </div>
            <ChevronRight size={18} color={c.text3} />
          </div>
        </TrCard>

        <TrCard
          className="p-4"
          onClick={() => {
            hapticSelection();
            navigate(`${prefix}/p2p/insurance/certificate`);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.08)' }}
              >
                <Award size={18} color="#3B82F6" />
              </div>
              <div>
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, lineHeight: 1.5 }}>
                  Chứng nhận bảo hiểm
                </p>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  Tải và chia sẻ chứng nhận bảo hiểm P2P
                </p>
              </div>
            </div>
            <ChevronRight size={18} color={c.text3} />
          </div>
        </TrCard>
      </div>

      {/* ── Dispute → Claim Bridge (TIER 5.4) ── */}
      <TrCard
        className="p-4"
        style={{ border: '1.5px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)' }}
          >
            <AlertTriangle size={18} color="#F59E0B" />
          </div>
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, lineHeight: 1.5 }}>
              Bạn vừa thua dispute?
            </p>
            <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5, marginTop: 2 }}>
              Nếu bạn nghĩ kết quả không công bằng, bạn có thể gửi yêu cầu bồi thường bảo hiểm trong vòng 7 ngày.
            </p>
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${prefix}/p2p/disputes`);
              }}
              className="flex items-center gap-1.5 mt-2"
            >
              <span style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 600 }}>
                Xem disputes gần đây
              </span>
              <ChevronRight size={14} color="#3B82F6" />
            </button>
          </div>
        </div>
      </TrCard>

      {/* ── Eligibility Pre-check (TIER 5.5) ── */}
      <TrCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} color="#10B981" />
          <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
            Kiểm tra đủ điều kiện claim
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {[
            { label: 'KYC đã xác minh', met: true, detail: 'Level 2 — Pro' },
            { label: '2FA đã bật', met: true, detail: 'Google Authenticator' },
            { label: 'Tier đủ điều kiện', met: true, detail: 'Pro — bảo hiểm 85%' },
            { label: 'Hạn mức còn lại', met: true, detail: `${fmtVnd(100_000_000 - 25_000_000)} đ / 30 ngày` },
            { label: 'Giao dịch P2P gần đây', met: true, detail: '3 đơn trong 7 ngày qua' },
          ].map(item => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: `1px solid ${c.divider}` }}
            >
              <div className="flex items-center gap-2">
                {item.met ? (
                  <CheckCircle size={14} color="#10B981" />
                ) : (
                  <XCircle size={14} color="#EF4444" />
                )}
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 500, lineHeight: 1.5 }}>
                  {item.label}
                </span>
              </div>
              <span style={{
                color: item.met ? '#10B981' : '#EF4444',
                fontSize: 11, fontWeight: 600,
              }}>
                {item.detail}
              </span>
            </div>
          ))}
        </div>

        <div
          className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(16,185,129,0.06)' }}
        >
          <ShieldCheck size={14} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 600 }}>
            Bạn đủ điều kiện gửi yêu cầu bồi thường
          </span>
        </div>
      </TrCard>

      {/* ── Fund Solvency & Transparency (TIER 1.2) ── */}
      <TrCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HeartPulse size={18} color={HEALTH_CONFIG[FUND_SOLVENCY.healthStatus].color} />
            <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
              Sức khỏe quỹ
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: `${HEALTH_CONFIG[FUND_SOLVENCY.healthStatus].color}12` }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: HEALTH_CONFIG[FUND_SOLVENCY.healthStatus].color }}
            />
            <span style={{
              color: HEALTH_CONFIG[FUND_SOLVENCY.healthStatus].color,
              fontSize: φ.sm, fontWeight: 700,
            }}>
              {HEALTH_CONFIG[FUND_SOLVENCY.healthStatus].label}
            </span>
          </div>
        </div>

        <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5, marginBottom: 16 }}>
          {HEALTH_CONFIG[FUND_SOLVENCY.healthStatus].desc}
        </p>

        {/* Solvency metrics */}
        <div className="flex flex-col gap-3" style={{ paddingTop: 12, borderTop: `1px solid ${c.divider}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={14} color={c.text3} />
              <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Tỷ lệ thanh khoản</span>
            </div>
            <span style={{
              color: FUND_SOLVENCY.solvencyRatio >= 3 ? '#10B981' : FUND_SOLVENCY.solvencyRatio >= 1 ? '#F59E0B' : '#EF4444',
              fontSize: φ.body, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            }}>
              {FUND_SOLVENCY.solvencyRatio.toFixed(1)}x
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Claims chưa giải quyết</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {fmtVnd(FUND_SOLVENCY.outstandingClaimsAmount)} đ
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Tỷ lệ duyệt</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {FUND_SOLVENCY.approvalRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Thời gian xử lý TB</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {FUND_SOLVENCY.avgResolutionHours}h
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Hạn mức/30 ngày</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {fmtVnd(FUND_SOLVENCY.maxClaimPerPeriod)} đ
            </span>
          </div>
        </div>

        {/* Proof of Reserves */}
        <div
          className="mt-4 p-3 rounded-xl flex items-start gap-3"
          style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.1)' }}>
            <ShieldCheck size={16} color="#3B82F6" />
          </div>
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, lineHeight: 1.5 }}>
              Proof of Reserves
            </p>
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5, marginTop: 2 }}>
              Kiểm toán gần nhất: {FUND_SOLVENCY.lastAuditDate}
            </p>
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
              Đơn vị: {FUND_SOLVENCY.auditorName}
            </p>
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
              Kỳ tiếp theo: {FUND_SOLVENCY.nextAuditDate}
            </p>
          </div>
          <button
            onClick={() => toast.info('Đang mở báo cáo kiểm toán')}
            className="shrink-0 mt-1"
          >
            <ExternalLink size={14} color="#3B82F6" />
          </button>
        </div>
      </TrCard>

      {/* ── Fund Balance Chart ── */}
      <TrCard className="p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} color="#10B981" />
            <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
              Biến động quỹ
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight size={14} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>
              +37.6%
            </span>
          </div>
        </div>
        <p style={{ color: c.text3, fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>
          Số dư quỹ bảo hiểm (triệu VND)
        </p>

        {/* Range selector */}
        <div className="flex gap-1.5 mb-3">
          {(['7d', '30d', '90d'] as ChartRange[]).map(range => {
            const isActive = chartRange === range;
            const labels: Record<ChartRange, string> = { '7d': '7 ngày', '30d': '30 ngày', '90d': '90 ngày' };
            return (
              <button
                key={range}
                onClick={() => { setChartRange(range); hapticSelection(); }}
                className="px-3 py-1.5 rounded-lg"
                style={{
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#fff' : c.text2,
                  background: isActive ? '#3B82F6' : c.surface2,
                }}
              >
                {labels[range]}
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <div style={{ height: 160, marginLeft: -8, marginRight: -8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getChartData(chartRange)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs key="defs-fund-gradient">
                <linearGradient id="fundGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
              <XAxis
                key="xaxis"
                dataKey="day"
                tick={{ fontSize: 10, fill: 'rgba(128,128,128,0.6)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                key="yaxis"
                tick={{ fontSize: 10, fill: 'rgba(128,128,128,0.6)' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '8px 12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}
                formatter={(value: number) => [`${fmtVnd(value * 1_000_000)} đ`, 'Số dư']}
              />
              <Area
                key="area-balance"
                type="monotone"
                dataKey="balance"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#fundGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Inflow/Outflow summary */}
        <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
            <span style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>Đóng góp 30d</span>
            <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700, marginLeft: 'auto' }}>
              +{fmtCompact(240_000_000)}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
            <span style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>Chi trả 30d</span>
            <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700, marginLeft: 'auto' }}>
              -{fmtCompact(97_000_000)}
            </span>
          </div>
        </div>
      </TrCard>

      {/* ── User Coverage Card ── */}
      <TrCard className="p-5" style={{ border: '1.5px dashed rgba(59,130,246,0.3)' }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>
            Mức bảo hiểm của bạn
          </span>
          <span style={{
            color: '#3B82F6', fontSize: 28, fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {userProfile.coveragePct}%
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Tier merchant</span>
            <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>{userProfile.tierName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Đóng góp/giao dịch</span>
            <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>{userProfile.contributionRate}</span>
          </div>
        </div>
      </TrCard>

      {/* ── Coverage Tier Table ── */}
      <TrCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} color={c.text3} />
          <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
            Bảng bảo hiểm theo tier
          </span>
        </div>

        <div className="flex flex-col">
          {tiers.map((tier, idx) => {
            const isLast = idx === tiers.length - 1;
            return (
              <div
                key={tier.name}
                className="flex items-center justify-between py-3"
                style={{
                  borderBottom: isLast ? 'none' : `1px solid ${c.divider}`,
                  background: tier.highlight ? 'rgba(59,130,246,0.06)' : 'transparent',
                  marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20,
                  borderRadius: tier.highlight ? 8 : 0,
                }}
              >
                <span style={{
                  color: tier.highlight ? '#3B82F6' : c.text1,
                  fontSize: φ.body, fontWeight: tier.highlight ? 700 : 500,
                }}>
                  {tier.name}
                </span>
                <span style={{
                  color: tier.coveragePct === 'Không có' ? c.text3 : (tier.highlight ? '#3B82F6' : c.text1),
                  fontSize: φ.body, fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {tier.coveragePct}
                  {tier.bonus && (
                    <span style={{ color: '#10B981', fontSize: φ.sm, marginLeft: 4 }}>
                      {tier.bonus}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </TrCard>

      {/* ── Push Notification Preferences ── */}
      <TrCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={16} color="#3B82F6" />
            <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
              Thông báo bảo hiểm
            </span>
          </div>
          <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
            {enabledCount}/{notifPrefs.length} bật
          </span>
        </div>

        <div className="flex flex-col">
          {notifPrefs.map((pref, idx) => {
            const isLast = idx === notifPrefs.length - 1;
            return (
              <div
                key={pref.key}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: isLast ? 'none' : `1px solid ${c.divider}` }}
              >
                <div className="flex-1 pr-3">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                    {pref.label}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                    {pref.desc}
                  </p>
                </div>
                <button
                  onClick={() => toggleNotifPref(pref.key)}
                  className="relative shrink-0"
                  style={{ width: 44, height: 24 }}
                >
                  <div
                    className="w-full h-full rounded-full transition-all"
                    style={{
                      background: pref.enabled ? '#3B82F6' : c.surface2,
                      border: `1.5px solid ${pref.enabled ? '#3B82F6' : c.borderSolid}`,
                    }}
                  />
                  <div
                    className="absolute rounded-full transition-all"
                    style={{
                      width: 18, height: 18, top: 3,
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      left: pref.enabled ? 23 : 3,
                    }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </TrCard>

      {/* ── How It Works ── */}
      <TrCard className="p-5">
        <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, display: 'block', marginBottom: 16 }}>
          Cách hoạt động
        </span>

        <div className="flex flex-col gap-5">
          {[
            {
              step: 1,
              title: 'Đóng góp',
              desc: '0.1% mỗi giao dịch được trích vào quỹ bảo hiểm chung',
            },
            {
              step: 2,
              title: 'Claim',
              desc: 'Nếu bị fraud/chargeback, submit claim trong 7 ngày',
            },
            {
              step: 3,
              title: 'Bồi thường',
              desc: 'Review trong 48h, chi trả trong 72h',
            },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: c.surface2 }}
              >
                <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>{item.step}</span>
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, lineHeight: 1.5 }}>{item.title}</p>
                <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5, marginTop: 2 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </TrCard>

      {/* ── Coverage Calculator (TIER 2.4) ── */}
      <TrCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={16} color={c.text3} />
          <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
            Tính toán bồi thường
          </span>
        </div>

        <div>
          <label style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Nhập số tiền giao dịch (VND)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={displayCalcAmount}
            onChange={e => handleCalcAmountChange(e.target.value)}
            placeholder="VD: 50.000.000"
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{
              background: c.surface2,
              border: `1.5px solid ${parsedCalcAmount > FUND_SOLVENCY.maxClaimPerPeriod ? '#EF4444' : c.borderSolid}`,
              color: c.text1, fontSize: φ.body,
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          {parsedCalcAmount > FUND_SOLVENCY.maxClaimPerPeriod && (
            <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
              Vượt hạn mức {fmtVnd(FUND_SOLVENCY.maxClaimPerPeriod)} đ / 30 ngày
            </p>
          )}
        </div>

        {parsedCalcAmount > 0 && parsedCalcAmount <= FUND_SOLVENCY.maxClaimPerPeriod && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Đóng góp bảo hiểm</span>
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {fmtVnd(Math.round(parsedCalcAmount * 0.001))} đ
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>
                Bảo hiểm ({userProfile.tierName} {userProfile.coveragePct}%)
              </span>
              <span style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmtVnd(calcPayout)} đ
              </span>
            </div>
            <div className="pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
              <p style={{ color: c.text3, fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 0.3 }}>
                SO SÁNH THEO TIER
              </p>
              {[
                { name: 'Xác minh', pct: 70 },
                { name: 'Pro', pct: 85, current: true },
                { name: 'Elite', pct: 100 },
              ].map(t => (
                <div key={t.name} className="flex items-center justify-between py-1.5">
                  <span style={{
                    color: t.current ? '#3B82F6' : c.text3,
                    fontSize: φ.sm, fontWeight: t.current ? 700 : 500,
                  }}>
                    {t.name} ({t.pct}%)
                    {t.current && <span style={{ fontSize: 10, marginLeft: 4 }}>← Bạn</span>}
                  </span>
                  <span style={{
                    color: t.current ? '#3B82F6' : c.text1,
                    fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmtVnd(Math.round(parsedCalcAmount * t.pct / 100))} đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </TrCard>

      {/* ── Platform Statistics (TIER 2.1) ── */}
      <TrCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} color="#8B5CF6" />
          <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
            Thống kê nền tảng
          </span>
        </div>

        <div className="grid grid-cols-2" style={{ gap: φSpace[4] }}>
          {[
            { label: 'Tổng claims', value: PLATFORM_STATS.totalClaimsAllTime, isNumeric: true, icon: FileText, color: '#3B82F6' },
            { label: 'Tháng này', value: PLATFORM_STATS.claimsThisMonth, isNumeric: true, icon: Activity, color: '#F59E0B' },
            { label: 'Merchants', value: PLATFORM_STATS.merchantsCovered, isNumeric: true, icon: Users, color: '#10B981' },
            { label: 'Xử lý nhanh nhất', value: PLATFORM_STATS.fastestResolution, isNumeric: false, icon: Zap, color: '#8B5CF6' },
          ].map(stat => {
            const IconComp = stat.icon;
            return (
              <div key={stat.label} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: c.surface2 }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stat.color}12` }}>
                  <IconComp size={14} color={stat.color} />
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>{stat.label}</p>
                  <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                    {stat.isNumeric ? <AnimatedStat value={stat.value as number} /> : stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Tổng đã xử lý</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedStat value={PLATFORM_STATS.totalAmountProcessed} formatFn={fmtCompact} />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Claim trung bình</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedStat value={PLATFORM_STATS.averageClaimAmount} formatFn={(n) => `${fmtVnd(n)} đ`} />
            </span>
          </div>
        </div>
      </TrCard>
    </PageContent>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLAIMS TAB
   ═══════════════════════════════════════════════════════════ */

interface ClaimsTabProps {
  c: ReturnType<typeof useThemeColors>;
  claims: InsuranceClaim[];
  allClaims: InsuranceClaim[];
  filter: ClaimStatus | 'all';
  setFilter: (f: ClaimStatus | 'all') => void;
  onSubmitClaim: () => void;
  onClaimTap: (claimId: string) => void;
}

function ClaimsTab({ c, claims, allClaims, filter, setFilter, onSubmitClaim, onClaimTap }: ClaimsTabProps) {
  const FILTERS: { key: ClaimStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'reviewing', label: 'Đang xem xét' },
    { key: 'approved', label: 'Đã duyệt' },
    { key: 'paid', label: 'Đã chi trả' },
  ];

  return (
    <>
      {/* Filter chips */}
      <div className="px-5 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {FILTERS.map(f => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="shrink-0 px-3.5 py-2 rounded-full whitespace-nowrap"
                style={{
                  fontSize: φ.sm,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#fff' : c.text2,
                  background: isActive ? '#1E293B' : c.surface2,
                  border: `1px solid ${isActive ? '#1E293B' : c.borderSolid}`,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Claims List */}
      <PageContent gap="default">
        {/* ── Personal Claim Summary (TIER 2.2) ── */}
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p style={{ color: '#3B82F6', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {PERSONAL_SUMMARY.totalClaims}
              </p>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>Tổng gửi</p>
            </div>
            <div className="text-center">
              <p style={{ color: '#F59E0B', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {PERSONAL_SUMMARY.pendingCount}
              </p>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>Đang chờ</p>
            </div>
            <div className="text-center">
              <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {PERSONAL_SUMMARY.successRate}%
              </p>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>Thành công</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Tổng yêu cầu</span>
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {fmtVnd(PERSONAL_SUMMARY.totalClaimed)} đ
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Đã nhận</span>
              <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmtVnd(PERSONAL_SUMMARY.totalReceived)} đ
              </span>
            </div>
          </div>
        </TrCard>

        {claims.length === 0 ? (
          <TrCard className="p-8 flex flex-col items-center gap-3">
            <FileText size={32} color={c.text3} />
            <p style={{ color: c.text2, fontSize: φ.body, fontWeight: 600 }}>Chưa có yêu cầu nào</p>
            <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5, textAlign: 'center' }}>
              Gửi yêu cầu bồi thường khi gặp vấn đề giao dịch P2P
            </p>
          </TrCard>
        ) : (
          claims.map(claim => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              c={c}
              onTap={() => onClaimTap(claim.id)}
            />
          ))
        )}

        {/* Bottom CTA */}
        <div className="pt-4">
          <CTAButton onClick={onSubmitClaim} variant="primary">
            <Shield size={18} color="#fff" />
            <span>Yêu cầu bồi thường</span>
          </CTAButton>
        </div>
      </PageContent>
    </>
  );
}

/* ─── Claim Card ─── */

interface ClaimCardProps {
  claim: InsuranceClaim;
  c: ReturnType<typeof useThemeColors>;
  onTap: () => void;
}

function ClaimCard({ claim, c, onTap }: ClaimCardProps) {
  const cfg = CLAIM_STATUS_CONFIG[claim.status];
  const StatusIcon = cfg.icon;

  return (
    <TrCard className="p-4" hover as="button" onClick={onTap}>
      {/* Status badge + chevron */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: `${cfg.color}12` }}>
          <StatusIcon size={12} color={cfg.color} />
          <span style={{ color: cfg.color, fontSize: 11, fontWeight: 600 }}>{cfg.label}</span>
        </div>
        <ChevronRight size={16} color={c.text3} />
      </div>

      {/* Claim code + amount */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>{claim.claimCode}</p>
          <p style={{ color: c.text3, fontSize: φ.sm, marginTop: 2, lineHeight: 1.5 }}>
            Lệnh {claim.orderId} · {CLAIM_REASON_LABELS[claim.reason]}
          </p>
        </div>
        <div className="text-right">
          <p style={{
            color: c.text1, fontSize: φ.base, fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmtVnd(claim.amount)} đ
          </p>
          <p style={{ color: c.text3, fontSize: φ.sm, marginTop: 2, lineHeight: 1.5 }}>
            {claim.submittedAt}
          </p>
        </div>
      </div>

      {/* Paid amount (if applicable) */}
      {claim.status === 'paid' && claim.paidAmount && (
        <div
          className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(16,185,129,0.08)' }}
        >
          <CheckCircle size={12} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 600 }}>
            Đã nhận: {fmtVnd(claim.paidAmount)} đ
          </span>
        </div>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUBMIT CLAIM MODAL (Bottom Sheet)
   ═══════════════════════════════════════════════════════════ */

interface SubmitClaimModalProps {
  c: ReturnType<typeof useThemeColors>;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onAfterOpen?: () => void;
}

function SubmitClaimModal({ c, open, onClose, onSubmit, onAfterOpen }: SubmitClaimModalProps) {
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState<ClaimReason>('fraud');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [consentAccuracy, setConsentAccuracy] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [showDuplicateSheet, setShowDuplicateSheet] = useState(false);
  const { hapticSelection } = useHaptic();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  /* ─── Order lookup (TIER 1.4) ─── */
  const orderKey = orderId.trim().toUpperCase();
  const matchedOrder = MOCK_ORDER_LOOKUP[orderKey] || null;
  const orderNotFound = orderId.trim().length >= 6 && !matchedOrder;

  /* ─── Amount validation (TIER 1.4) ─── */
  const parsedAmount = parseAmountInput(amount);
  const displayAmount = amount ? formatAmountInput(amount) : '';
  const amountExceedsOrder = matchedOrder && parsedAmount > matchedOrder.amount;
  const amountExceedsMax = parsedAmount > FUND_SOLVENCY.maxClaimPerPeriod;

  /* ─── Estimated payout (TIER 1.4) ─── */
  const estimatedPayout = parsedAmount > 0 ? Math.round(parsedAmount * USER_PROFILE.coveragePct / 100) : 0;

  /* ─── Duplicate claim detection ─── */
  const hasDuplicateClaim = matchedOrder?.hasExistingClaim ?? false;

  /* ─── Validation ─── */
  const isFormValid = orderId.trim().length > 0
    && matchedOrder !== null
    && !hasDuplicateClaim
    && description.trim().length >= 10
    && parsedAmount > 0
    && !amountExceedsOrder
    && !amountExceedsMax;
  const isConsentValid = consentAccuracy && consentTerms;
  const isValid = isFormValid && isConsentValid;

  const handleAmountChange = (raw: string) => {
    // Only keep digits
    const digits = raw.replace(/[^0-9]/g, '');
    setAmount(digits);
  };

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      variant="bottom"
      title="Yêu cầu bồi thường"
      maxHeight="90vh"
      ariaLabel="Gửi yêu cầu bồi thường bảo hiểm"
      onAfterOpen={onAfterOpen}
    >
      {/* Warning */}
      <div
        className="p-3 rounded-xl mb-5 flex items-start gap-2"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
        <p style={{ color: '#D97706', fontSize: φ.sm, lineHeight: 1.5 }}>
          Vui lòng cung cấp bằng chứng đầy đủ. Yêu cầu giả mạo sẽ bị từ chối và ảnh hưởng uy tín.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 mb-4">
        {/* Order ID with lookup */}
        <div>
          <label style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Mã đơn hàng P2P *
          </label>
          <input
            type="text"
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="VD: P2P-78450"
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{
              background: c.surface2,
              border: `1.5px solid ${orderNotFound ? '#EF4444' : hasDuplicateClaim ? '#F59E0B' : matchedOrder ? '#10B981' : c.borderSolid}`,
              color: c.text1, fontSize: φ.body,
            }}
          />
          {/* Order lookup result */}
          {matchedOrder && !hasDuplicateClaim && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)' }}>
              <CheckCircle size={12} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                {matchedOrder.coin} · {fmtVnd(matchedOrder.amount)} đ · {matchedOrder.date}
              </span>
            </div>
          )}
          {hasDuplicateClaim && (
            <button
              onClick={() => {
                hapticSelection();
                setShowDuplicateSheet(true);
              }}
              className="flex items-center justify-between gap-2 mt-2 px-3 py-2 rounded-lg w-full text-left"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} color="#F59E0B" />
                <span style={{ color: '#D97706', fontSize: 11, fontWeight: 600 }}>
                  Đơn này đã có yêu cầu bồi thường đang xử lý
                </span>
              </div>
              <ChevronRight size={12} color="#F59E0B" />
            </button>
          )}
          {orderNotFound && (
            <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
              Không tìm thấy đơn hàng. Kiểm tra lại mã đơn.
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Lý do *
          </label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value as ClaimReason)}
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, color: c.text1, fontSize: φ.body }}
          >
            <option value="fraud">Gian lận</option>
            <option value="chargeback">Chargeback</option>
            <option value="dispute_error">Lỗi dispute</option>
            <option value="other">Khác</option>
          </select>
        </div>

        {/* Amount with validation */}
        <div>
          <label style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Số tiền yêu cầu (VND) *
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={displayAmount}
            onChange={e => handleAmountChange(e.target.value)}
            placeholder="VD: 15.000.000"
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{
              background: c.surface2,
              border: `1.5px solid ${amountExceedsOrder || amountExceedsMax ? '#EF4444' : c.borderSolid}`,
              color: c.text1, fontSize: φ.body,
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          {/* Amount validation errors */}
          {amountExceedsOrder && (
            <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
              Vượt quá giá trị đơn hàng ({fmtVnd(matchedOrder!.amount)} đ)
            </p>
          )}
          {amountExceedsMax && !amountExceedsOrder && (
            <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
              Vượt hạn mức {fmtVnd(FUND_SOLVENCY.maxClaimPerPeriod)} đ / 30 ngày
            </p>
          )}
          {/* Max claim info */}
          {!amountExceedsOrder && !amountExceedsMax && (
            <p style={{ color: c.text3, fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
              Hạn mức: {fmtVnd(FUND_SOLVENCY.maxClaimPerPeriod)} đ / 30 ngày
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Mô tả chi tiết * (tối thiểu 10 ký tự)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Mô tả vấn đề và cung cấp bằng chứng..."
            className="w-full px-4 py-3 rounded-xl resize-none outline-none"
            style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, color: c.text1, fontSize: φ.body }}
          />
          {description.length > 0 && description.length < 10 && (
            <p style={{ color: '#F59E0B', fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
              Còn thiếu {10 - description.length} ký tự
            </p>
          )}
        </div>
      </div>

      {/* ── Estimated Payout Preview (TIER 1.4) ── */}
      {parsedAmount > 0 && !amountExceedsOrder && !amountExceedsMax && (
        <div
          className="p-4 rounded-xl mb-4"
          style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
        >
          <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 0.3 }}>
            DỰ KIẾN BỒI THƯỜNG
          </p>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Số tiền yêu cầu</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {fmtVnd(parsedAmount)} đ
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>
              Tỷ lệ bảo hiểm ({USER_PROFILE.tierName})
            </span>
            <span style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700 }}>
              {USER_PROFILE.coveragePct}%
            </span>
          </div>
          <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px dashed ${c.divider}` }}>
            <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700, lineHeight: 1.5 }}>Dự kiến nhận</span>
            <span style={{ color: '#10B981', fontSize: φ.body, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {fmtVnd(estimatedPayout)} đ
            </span>
          </div>
        </div>
      )}

      {/* ── Consent Checkboxes (TIER 1.3) ── */}
      <div className="flex flex-col gap-3 mb-5">
        {/* Consent 1: Accuracy */}
        <button
          onClick={() => { setConsentAccuracy(v => !v); hapticSelection(); }}
          className="flex items-start gap-3 text-left"
        >
          <div
            className="w-5 h-5 rounded shrink-0 flex items-center justify-center mt-0.5"
            style={{
              border: `1.5px solid ${consentAccuracy ? '#3B82F6' : c.borderSolid}`,
              background: consentAccuracy ? '#3B82F6' : 'transparent',
            }}
          >
            {consentAccuracy && <CheckCircle size={12} color="#fff" />}
          </div>
          <span style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
            Tôi xác nhận thông tin trên là chính xác và đầy đủ. Tôi hiểu rằng cung cấp thông tin sai sẽ bị từ chối và có thể bị hạn chế tài khoản.
          </span>
        </button>

        {/* Consent 2: Terms + Privacy */}
        <button
          onClick={() => { setConsentTerms(v => !v); hapticSelection(); }}
          className="flex items-start gap-3 text-left"
        >
          <div
            className="w-5 h-5 rounded shrink-0 flex items-center justify-center mt-0.5"
            style={{
              border: `1.5px solid ${consentTerms ? '#3B82F6' : c.borderSolid}`,
              background: consentTerms ? '#3B82F6' : 'transparent',
            }}
          >
            {consentTerms && <CheckCircle size={12} color="#fff" />}
          </div>
          <span style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
            Tôi đồng ý với{' '}
            <span
              style={{ color: '#3B82F6', fontWeight: 600 }}
              onClick={(e) => { e.stopPropagation(); onClose(); navigate(`${prefix}/p2p/insurance/policy`); }}
            >
              Điều khoản Bảo hiểm P2P
            </span>
            {' '}và{' '}
            <span
              style={{ color: '#3B82F6', fontWeight: 600 }}
              onClick={(e) => { e.stopPropagation(); onClose(); navigate(`${prefix}/p2p/insurance/policy`); }}
            >
              Chính sách Quyền riêng tư
            </span>.
            Dữ liệu bằng chứng sẽ được lưu trữ bảo mật trong quá trình xử lý.
          </span>
        </button>
      </div>

      {/* ── Privacy Notice (TIER 1.3) ── */}
      <div
        className="flex items-start gap-2 p-3 rounded-xl mb-5"
        style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
      >
        <Lock size={12} color={c.text3} className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
          Thông tin cá nhân và bằng chứng của bạn được mã hóa và chỉ nhân viên có thẩm quyền mới được truy cập trong quá trình xem xét yêu cầu.
        </p>
      </div>

      {/* Submit */}
      <CTAButton
        onClick={onSubmit}
        variant="primary"
        disabled={!isValid}
      >
        Gửi yêu cầu bồi thường
      </CTAButton>

      <p style={{ color: c.text3, fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
        Yêu cầu sẽ được xem xét trong 48 giờ. Chi trả trong 72 giờ sau khi duyệt.
      </p>

      {/* ── Duplicate Claim Info Sheet (TIER 3.1) ── */}
      {hasDuplicateClaim && (
        <BottomSheetV2
          open={showDuplicateSheet}
          onClose={() => setShowDuplicateSheet(false)}
          variant="bottom"
          title="Yêu cầu bồi thường đã tồn tại"
          maxHeight="70vh"
          ariaLabel="Thông tin yêu cầu trùng lặp"
        >
          <div
            className="p-3 rounded-xl mb-4 flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: '#D97706', fontSize: φ.sm, lineHeight: 1.5 }}>
              Đơn hàng <strong>{orderKey}</strong> đã có yêu cầu bồi thường đang được xử lý.
              Mỗi đơn hàng chỉ được phép có 1 claim active.
            </p>
          </div>

          <div className="mb-4">
            <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, marginBottom: 12 }}>
              Claims hiện có cho đơn này:
            </p>
            {/* Mock existing claims for this order */}
            {MOCK_CLAIMS.filter(cl => cl.orderId === orderKey).map(existingClaim => {
              const cfg = CLAIM_STATUS_CONFIG[existingClaim.status];
              const Icon = cfg.icon;
              return (
                <TrCard
                  key={existingClaim.id}
                  className="p-4 mb-3"
                  onClick={() => {
                    hapticSelection();
                    setShowDuplicateSheet(false);
                    onClose();
                    navigate(`${prefix}/p2p/insurance/claim/${existingClaim.id}`);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={14} color={cfg.color} />
                      <span style={{ color: cfg.color, fontSize: φ.sm, fontWeight: 700 }}>
                        {cfg.label}
                      </span>
                    </div>
                    <ChevronRight size={16} color={c.text3} />
                  </div>
                  <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, marginBottom: 4 }}>
                    {existingClaim.claimCode}
                  </p>
                  <p style={{ color: c.text2, fontSize: φ.sm, marginBottom: 4, lineHeight: 1.5 }}>
                    {CLAIM_REASON_LABELS[existingClaim.reason]} • {fmtVnd(existingClaim.amount)} đ
                  </p>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                    Gửi: {existingClaim.submittedAt}
                  </p>
                </TrCard>
              );
            })}
          </div>

          <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5, textAlign: 'center' }}>
            Vui lòng chờ claim hiện tại được xử lý xong hoặc{' '}
            <span style={{ color: '#3B82F6', fontWeight: 600 }}>liên hệ hỗ trợ</span>{' '}
            nếu cần trợ giúp.
          </p>
        </BottomSheetV2>
      )}
    </BottomSheetV2>
  );
}