import { coachmarkService } from '../../services/CoachmarkService';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield,
  Bell,
  Globe,
  Moon,
  Sun,
  ChevronRight,
  LogOut,
  Copy,
  CheckCircle,
  User,
  Settings,
  ShieldCheck,
  HelpCircle,
  FileText,
  Star,
  Users,
  Key,
  Zap,
  Crown,
  Bot,
  ClipboardList,
  Smartphone,
  Trophy,
  BarChart3,
  Compass,
  RefreshCw,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { USER_PROFILE } from '../../data/mockData';
import { useHaptic } from '../../hooks/useHaptic';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ, φIcon, φAvatar } from '../../utils/golden';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';
import { ProfileModuleBlocks } from '../../components/bridges/ArenaPredictionBridges';
import { onboardingService } from '../../services/OnboardingService';

/**
 * ══════════════════════════════════════════════════════════
 *  PROFILE PAGE — Sprint 2 Polish
 * ══════════════════════════════════════════════════════════
 *
 *  Changes:
 *  ✓  Per-section icon accent colors (Account=blue, Settings=gray, Explore=purple)
 *  ✓  Single decorative glow on profile hero card
 *  ✓  Hardcoded hex → semantic tokens
 *  ✓  Section descriptions via PageSection labels
 *  ✓  KYC/status colors use semantic tokens
 *  ✓  Cleaner avatar + badge layout
 *  ✓  VIP Progress bar uses warn token
 */

const VIP_LEVELS = ['Standard', 'VIP 1', 'VIP 2', 'VIP 3', 'VIP 4', 'VIP 5'];

const KYC_MAP: Record<string, { label: string; colorKey: 'sell' | 'warn' | 'buy' }> = {
  unverified: { label: 'Chưa xác minh', colorKey: 'sell' },
  pending: { label: 'Đang xem xét', colorKey: 'warn' },
  verified: { label: 'Đã xác minh ✓', colorKey: 'buy' },
};

/* ─── Section color themes ─── */
const SECTION_THEMES = {
  account: { iconBg: 'rgba(59,130,246,0.10)', iconColor: '#3B82F6' },
  settings: { iconBg: 'rgba(148,163,184,0.12)', iconColor: '#94A3B8' },
  explore: { iconBg: 'rgba(139,92,246,0.10)', iconColor: '#8B5CF6' },
} as const;

/* ─── Profile Skeleton ─── */
function ProfileSkeleton() {
  const c = useThemeColors();
  const shimmer = {
    background: `linear-gradient(90deg, ${c.surface2} 25%, ${c.surface3} 37%, ${c.surface2} 63%)`,
    backgroundSize: '800px 100%',
    animation: 'stateShimmer 1.8s ease-in-out infinite',
  } as React.CSSProperties;

  return (
    <PageLayout>
      <div className="px-5 pt-4 pb-2">
        <div className="h-6 rounded" style={{ ...shimmer, width: 120 }} />
      </div>
      <PageContent gap="relaxed">
        <div
          className="rounded-3xl p-5"
          style={{
            background: c.surface,
            border: `1px solid ${c.cardBorder}`,
            boxShadow: c.cardShadow,
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="rounded-2xl"
              style={{ ...shimmer, width: φAvatar.md, height: φAvatar.md }}
            />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4.5 rounded" style={{ ...shimmer, width: '70%' }} />
              <div className="h-3 rounded" style={{ ...shimmer, width: '50%' }} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 rounded-2xl" style={{ ...shimmer, height: φAvatar.md }} />
            <div className="flex-1 rounded-2xl" style={{ ...shimmer, height: φAvatar.md }} />
          </div>
        </div>
        {[6, 3, 4].map((count, si) => (
          <div key={si}>
            <div className="h-3 rounded mb-2" style={{ ...shimmer, width: 80 }} />
            <TrCard overflow>
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: i < count - 1 ? `1px solid ${c.divider}` : 'none' }}
                >
                  <div
                    className="rounded-xl"
                    style={{ ...shimmer, width: φAvatar.sm, height: φAvatar.sm }}
                  />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3.5 rounded" style={{ ...shimmer, width: '65%' }} />
                    <div className="h-2.5 rounded" style={{ ...shimmer, width: '40%' }} />
                  </div>
                </div>
              ))}
            </TrCard>
          </div>
        ))}
      </PageContent>
    </PageLayout>
  );
}

/* ─── Menu Row Component ─── */
function MenuRow({
  icon: Icon,
  label,
  sub,
  subColor,
  iconBg,
  iconColor,
  onClick,
  isLast,
}: {
  icon: LucideIcon;
  label: string;
  sub?: string;
  subColor?: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
  isLast: boolean;
}) {
  const c = useThemeColors();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 w-full market-row"
      style={{
        paddingTop: 14,
        paddingBottom: 14,
        borderBottom: isLast ? 'none' : `1px solid ${c.divider}`,
      }}
    >
      <div
        className="rounded-xl flex items-center justify-center shrink-0"
        style={{ width: φAvatar.sm, height: φAvatar.sm, background: iconBg }}
      >
        <Icon size={φIcon.md} color={iconColor} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{label}</p>
        {sub && (
          <p className="truncate" style={{ color: subColor ?? c.text2, fontSize: φ.xs }}>
            {sub}
          </p>
        )}
      </div>
      <ChevronRight size={φIcon.sm} color={c.text3} className="shrink-0" />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════ */
export function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const c = useThemeColors();
  const [copiedRef, setCopiedRef] = useState(false);
  const { hapticSelection, hapticLight, hapticMedium } = useHaptic();
  const prefix = useRoutePrefix();
  const { isLoading } = useLoadingState({ loadOnly: true, initialDelay: 600 });
  const actionToast = useActionToast();

  const kycInfo = KYC_MAP[USER_PROFILE.kycStatus] ?? {
    label: USER_PROFILE.kycStatus,
    colorKey: 'warn' as const,
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(USER_PROFILE.referralCode).catch(() => {});
    setCopiedRef(true);
    actionToast.success(TOAST.COPY.REFERRAL);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleLogout = () => {
    hapticMedium();
    logout();
    navigate(`${prefix}/auth/login`, { replace: true });
  };

  /* ─── Menu data with per-section themes ─── */
  const menuSections = [
    {
      key: 'account',
      label: 'TÀI KHOẢN',
      theme: SECTION_THEMES.account,
      items: [
        {
          icon: ShieldCheck,
          label: 'Xác minh danh tính (KYC)',
          sub: kycInfo.label,
          subColor: c[kycInfo.colorKey],
          action: () => navigate(`${prefix}/profile/kyc`),
        },
        {
          icon: Shield,
          label: 'Bảo mật',
          sub: USER_PROFILE.has2FA ? '2FA đang bật' : '2FA chưa bật',
          subColor: USER_PROFILE.has2FA ? c.buy : c.sell,
          action: () => navigate(`${prefix}/profile/security`),
        },
        {
          icon: Crown,
          label: 'VIP Program',
          sub: 'VIP 1 — Maker 0.09%',
          subColor: c.warn,
          action: () => navigate(`${prefix}/profile/vip`),
        },
        {
          icon: Bell,
          label: 'Thông báo',
          sub: 'Quản lý cảnh báo',
          action: () => navigate(`${prefix}/notifications`),
        },
        {
          icon: Key,
          label: 'Quản lý API',
          sub: '3 key đang hoạt động',
          action: () => navigate(`${prefix}/profile/api`),
        },
        {
          icon: Smartphone,
          label: 'Quản lý thiết bị',
          sub: '4 thiết bị đã đăng nhập',
          action: () => navigate(`${prefix}/profile/devices`),
        },
        {
          icon: Users,
          label: 'Tài khoản phụ',
          sub: '5 tài khoản',
          action: () => navigate(`${prefix}/profile/sub-accounts`),
        },
        {
          icon: ClipboardList,
          label: 'Lịch sử lệnh',
          sub: 'Xem lệnh đã đặt',
          action: () => navigate(`${prefix}/trade/orders-history`),
        },
      ],
    },
    {
      key: 'settings',
      label: 'CÀI ĐẶT',
      theme: SECTION_THEMES.settings,
      items: [
        { icon: Globe, label: 'Ngôn ngữ', sub: 'Tiếng Việt', action: () => {} },
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: 'Giao diện',
          sub: theme === 'dark' ? 'Tối' : 'Sáng',
          action: () => {
            setTheme(theme === 'dark' ? 'light' : 'dark');
            hapticSelection();
          },
        },
        {
          icon: Settings,
          label: 'Cài đặt chung',
          sub: undefined,
          action: () => navigate(`${prefix}/profile/settings`),
        },
        {
          icon: RotateCcw,
          label: 'Xem lại Onboarding',
          sub: 'Hướng dẫn sử dụng app',
          action: () => {
            onboardingService.resetOnboarding('demo-user');
            coachmarkService.resetAll();
            hapticLight();
            navigate('/onboarding');
          },
        },
        {
          icon: MessageCircle,
          label: 'Mẹo sử dụng',
          sub: coachmarkService.isDisabled() ? 'Đã tắt' : 'Đang bật',
          subColor: coachmarkService.isDisabled() ? c.sell : c.buy,
          action: () => {
            const isDisabled = coachmarkService.isDisabled();
            coachmarkService.setDisabled(!isDisabled);
            if (!isDisabled) {
              actionToast.success('Đã tắt mẹo sử dụng — Bạn sẽ không thấy gợi ý ngữ cảnh nữa');
            } else {
              coachmarkService.resetAll();
              actionToast.success('Đã bật mẹo sử dụng — Bạn sẽ thấy gợi ý khi vào các trang');
            }
            hapticLight();
          },
        },
      ],
    },
    {
      key: 'explore',
      label: 'KHÁM PHÁ',
      theme: SECTION_THEMES.explore,
      items: [
        {
          icon: Compass,
          label: 'Khám phá chủ đề',
          sub: 'Crypto, Sports, Politics...',
          action: () => navigate(`${prefix}/topics`),
        },
        {
          icon: Users,
          label: 'Chương trình giới thiệu',
          sub: 'Nhận 20% hoa hồng',
          action: () => navigate(`${prefix}/referral`),
        },
        {
          icon: Trophy,
          label: 'Prediction Leaderboard',
          sub: 'Xem top traders',
          action: () => navigate(`${prefix}/markets/predictions/leaderboard`),
        },
        {
          icon: RefreshCw,
          label: 'Mua tự động DCA',
          sub: 'Đầu tư định kỳ tự động',
          subColor: c.buy,
          action: () => navigate(`${prefix}/dca`),
        },
        {
          icon: Zap,
          label: 'Staking & Earn',
          sub: 'APY tới 24.5%',
          action: () => navigate(`${prefix}/earn/staking`),
        },
        {
          icon: Bot,
          label: 'Trading Bots',
          sub: 'Giao dịch tự động 24/7',
          action: () => navigate(`${prefix}/trade/bots`),
        },
        {
          icon: HelpCircle,
          label: 'Trung tâm hỗ trợ',
          sub: undefined,
          action: () => navigate(`${prefix}/support`),
        },
        {
          icon: FileText,
          label: 'Tin tức & Thông báo',
          sub: undefined,
          action: () => navigate(`${prefix}/news`),
        },
        { icon: Star, label: 'Đánh giá ứng dụng', sub: undefined, action: () => {} },
      ],
    },
  ];

  if (isLoading) return <ProfileSkeleton />;

  return (
    <PageLayout>
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h1 style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>Tài khoản</h1>
      </div>

      <PageContent gap="relaxed">
        {/* ═══ Profile Hero Card ═══ */}
        <TrCard variant="hero" rounded="lg" className="p-5 relative overflow-hidden">
          {/* Single decorative glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 70% 60% at 90% 10%, rgba(139,92,246,0.18) 0%, transparent 65%),
                           radial-gradient(ellipse 50% 50% at 10% 90%, ${c.primaryAlpha15} 0%, transparent 65%)`,
            }}
          />

          <div className="flex items-center gap-4 mb-5 relative z-10">
            {/* Avatar */}
            <div
              className="rounded-2xl flex items-center justify-center shrink-0"
              style={{
                width: 58,
                height: 58,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
                boxShadow: '0 4px 16px rgba(139,92,246,0.4)',
              }}
            >
              <span style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>
                {USER_PROFILE.fullName.charAt(0)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p style={{ color: c.portfolioBtnGhostText, fontSize: 17, fontWeight: 700 }}>
                {USER_PROFILE.fullName}
              </p>
              <p style={{ color: c.portfolioTextMuted, fontSize: φ.sm, marginTop: 2 }}>
                {USER_PROFILE.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="px-2.5 py-1 rounded-lg"
                  style={{
                    background: c.warnAlpha15,
                    color: c.warn,
                    border: `1px solid ${c.warnAlpha15}`,
                    fontSize: φ.xs,
                    fontWeight: 700,
                  }}
                >
                  {VIP_LEVELS[USER_PROFILE.vipLevel]}
                </span>
                <span
                  className="px-2.5 py-1 rounded-lg"
                  style={{
                    background: c.buyAlpha15,
                    color: c.buy,
                    border: `1px solid ${c.buyAlpha20}`,
                    fontSize: φ.xs,
                    fontWeight: 700,
                  }}
                >
                  KYC Cấp {USER_PROFILE.kycLevel}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                navigate(`${prefix}/profile/edit`);
                hapticSelection();
              }}
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{
                width: 40,
                height: 40,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <User size={18} color="rgba(255,255,255,0.75)" />
            </button>
          </div>

          {/* UID + Referral */}
          <div className="flex gap-3 relative z-10">
            <div
              className="flex-1 rounded-2xl px-3.5 py-3"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p style={{ color: c.portfolioTextMuted, fontSize: φ.xs, marginBottom: 4 }}>UID</p>
              <p
                style={{
                  color: c.portfolioBtnGhostText,
                  fontSize: φ.body,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  letterSpacing: 0.5,
                }}
              >
                {USER_PROFILE.id.toUpperCase()}
              </p>
            </div>
            <button
              onClick={handleCopyRef}
              className="flex-1 rounded-2xl px-3.5 py-3 text-left"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p style={{ color: c.portfolioTextMuted, fontSize: φ.xs, marginBottom: 4 }}>
                Mã giới thiệu
              </p>
              <div className="flex items-center gap-1.5">
                <p
                  style={{
                    color: '#93C5FD',
                    fontSize: φ.body,
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    letterSpacing: 0.5,
                  }}
                >
                  {USER_PROFILE.referralCode}
                </p>
                {copiedRef ? (
                  <CheckCircle size={14} color={c.buy} />
                ) : (
                  <Copy size={14} color="#93C5FD" />
                )}
              </div>
            </button>
          </div>
        </TrCard>

        {/* ═══ VIP Progress ═══ */}
        <TrCard className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: c.text2, fontSize: φ.sm }}>VIP Progress</span>
            <span style={{ color: c.warn, fontSize: φ.xs, fontWeight: 600 }}>VIP 1 → VIP 2</span>
          </div>
          <div className="h-2 rounded-full mb-2" style={{ background: c.surface3 }}>
            <div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${c.warn}, #F97316)`, width: '35%' }}
            />
          </div>
          <p style={{ color: c.text3, fontSize: φ.xs }}>
            Volume 30 ngày: $18,450 / $50,000 để lên VIP 2
          </p>
        </TrCard>

        {/* ═══ Module Blocks — Predictions & Arena ═══ */}
        <PageSection label="Dự đoán & Thách đấu" accentColor="#8B5CF6">
          <ProfileModuleBlocks
            predictionStats={{ positions: 5, openOrders: 2, pnl: 440, pnlLabel: '+$440.00' }}
            arenaStats={{ points: 2220, pointsLabel: '2,220', rooms: 3, creatorScore: 87 }}
          />
        </PageSection>

        {/* ═══ Menu Sections ═══ */}
        {menuSections.map((section) => (
          <PageSection
            key={section.key}
            label={section.label}
            accentColor={section.theme.iconColor}
          >
            <TrCard overflow>
              {section.items.map((item, i) => (
                <MenuRow
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  sub={item.sub}
                  subColor={item.subColor}
                  iconBg={section.theme.iconBg}
                  iconColor={section.theme.iconColor}
                  onClick={() => {
                    item.action();
                    hapticSelection();
                  }}
                  isLast={i === section.items.length - 1}
                />
              ))}
            </TrCard>
          </PageSection>
        ))}

        {/* ═══ Activity Log ═══ */}
        <div>
          <TrCard
            as="button"
            hover
            onClick={() => {
              navigate(`${prefix}/profile/activity`);
              hapticSelection();
            }}
            className="w-full flex items-center justify-center gap-2 font-semibold"
            style={{ height: φAvatar.sm + 8, color: c.text2, fontSize: φ.sm }}
          >
            Nhật ký hoạt động
          </TrCard>
        </div>

        {/* ═══ Logout ═══ */}
        <div>
          <button
            onClick={handleLogout}
            className="w-full rounded-2xl flex items-center justify-center gap-2 font-semibold ripple"
            style={{
              height: φAvatar.md,
              background: c.sellAlpha10,
              border: `1px solid ${c.sellAlpha20}`,
              color: c.sell,
              fontSize: φ.base,
            }}
          >
            <LogOut size={φIcon.md} />
            Đăng xuất
          </button>
        </div>

        <p style={{ color: c.text3, fontSize: φ.xs, textAlign: 'center', marginTop: φ.base }}>
          VitTrade v2.4.1 • Tham gia từ {USER_PROFILE.joinDate}
        </p>
      </PageContent>
    </PageLayout>
  );
}
