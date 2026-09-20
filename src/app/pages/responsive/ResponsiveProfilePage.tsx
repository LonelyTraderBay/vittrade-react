import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ShieldCheck,
  Shield,
  Crown,
  Bell,
  Key,
  Settings,
  HelpCircle,
  ChevronRight,
  FileText,
  Moon,
  Sun,
  LogOut,
  Copy,
  Users,
  CheckCircle,
  MonitorSmartphone,
  Smartphone,
  Globe,
  ClipboardList,
  Zap,
  Bot,
  Star,
  User,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { TrCard } from '../../components/ui/TrCard';
import { useAuth } from '../../contexts/AuthContext';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { CTAButton } from '../../components/ui/CTAButton';
import { USER_PROFILE } from '../../data/mockData';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getReferralStats, getCurrentTier } from '../../data/referralData';
import { fmtUsd } from '../../data/formatNumber';
import { RefreshCw } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';

const VIP_LEVELS = ['Standard', 'VIP 1', 'VIP 2', 'VIP 3', 'VIP 4', 'VIP 5'];
const KYC_COLORS: Record<string, string> = {
  unverified: '#EF4444',
  pending: '#F59E0B',
  verified: '#10B981',
};
const KYC_LABELS: Record<string, string> = {
  unverified: 'Chưa xác minh',
  pending: 'Đang xem xét',
  verified: 'Đã xác minh ✓',
};

export function ResponsiveProfilePage() {
  const prefix = useRoutePrefix();
  const navigate = useNavigate();
  const c = useThemeColors();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isDesktop } = useBreakpoint();
  const [copiedRef, setCopiedRef] = useState(false);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(USER_PROFILE.referralCode).catch(() => {});
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate(`${prefix}/auth/login`, { replace: true });
  };

  const menuItems = [
    {
      section: 'Tài khoản',
      items: [
        {
          icon: ShieldCheck,
          label: 'Xác minh danh tính (KYC)',
          sub: KYC_LABELS[USER_PROFILE.kycStatus],
          subColor: KYC_COLORS[USER_PROFILE.kycStatus],
          action: () => navigate(`${prefix}/profile/kyc`),
        },
        {
          icon: Shield,
          label: 'Bảo mật',
          sub: USER_PROFILE.has2FA ? '2FA đang bật' : '2FA chưa bật',
          subColor: USER_PROFILE.has2FA ? '#10B981' : '#EF4444',
          action: () => navigate(`${prefix}/profile/security`),
        },
        {
          icon: Crown,
          label: 'VIP Program',
          sub: 'VIP 1 — Maker 0.09%',
          subColor: '#F59E0B',
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
          icon: ClipboardList,
          label: 'Lịch sử lệnh',
          sub: 'Xem lệnh đã đặt',
          action: () => navigate(`${prefix}/trade/orders-history`),
        },
      ],
    },
    {
      section: 'Cài đặt',
      items: [
        { icon: Globe, label: 'Ngôn ngữ', sub: 'Tiếng Việt', action: () => {} },
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: 'Giao diện',
          sub: theme === 'dark' ? 'Tối' : 'Sáng',
          action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        },
        {
          icon: Settings,
          label: 'Cài đặt chung',
          sub: '',
          action: () => navigate(`${prefix}/profile/settings`),
        },
      ],
    },
    {
      section: 'Khác',
      items: [
        {
          icon: Users,
          label: 'Chương trình giới thiệu',
          sub: 'Nhận 20% hoa hồng',
          action: () => navigate(`${prefix}/referral`),
        },
        {
          icon: RefreshCw,
          label: 'Mua định kỳ (DCA)',
          sub: 'Tự động mua crypto theo lịch',
          subColor: '#8B5CF6',
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
          sub: '',
          action: () => navigate(`${prefix}/support`),
        },
        {
          icon: FileText,
          label: 'Tin tức & Thông báo',
          sub: '',
          action: () => navigate(`${prefix}/news`),
        },
        { icon: Star, label: 'Đánh giá ứng dụng', sub: '', action: () => {} },
      ],
    },
  ];

  // Desktop: wider layout for profile
  const maxW = isDesktop ? 960 : undefined;

  return (
    <PageLayout style={{ maxWidth: maxW, margin: isDesktop ? '0 auto' : undefined }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h1 style={{ color: c.text1, fontSize: 22, fontWeight: 700 }}>Tài khoản</h1>
      </div>

      {/* Profile card */}
      <div
        className="mx-5 rounded-3xl p-5"
        style={{
          background: 'linear-gradient(135deg, #1a2550 0%, #0d1b3e 100%)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
          >
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>
              {USER_PROFILE.fullName.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <p style={{ color: '#F0F4FF', fontSize: 18, fontWeight: 700 }}>
              {USER_PROFILE.fullName}
            </p>
            <p style={{ color: c.text2, fontSize: 13 }}>{USER_PROFILE.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2 py-0.5 rounded-lg text-xs font-bold"
                style={{ background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B44' }}
              >
                {VIP_LEVELS[USER_PROFILE.vipLevel]}
              </span>
              <span
                className="px-2 py-0.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
              >
                KYC Cấp {USER_PROFILE.kycLevel}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`${prefix}/profile/edit`)}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <User size={16} color={c.text2} />
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p style={{ color: c.text3, fontSize: 11 }}>UID</p>
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
              {USER_PROFILE.id.toUpperCase()}
            </p>
          </div>
          <button
            onClick={handleCopyRef}
            className="flex-1 rounded-2xl p-3"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <p style={{ color: c.text3, fontSize: 11 }}>Mã giới thiệu</p>
            <div className="flex items-center gap-1">
              <p
                style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}
              >
                {USER_PROFILE.referralCode}
              </p>
              {copiedRef ? (
                <CheckCircle size={12} color="#10B981" />
              ) : (
                <Copy size={12} color="#3B82F6" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* VIP progress */}
      <TrCard className="mx-5 mt-3 p-4">
        <div className="flex justify-between items-center mb-2">
          <span style={{ color: c.text2, fontSize: 13 }}>VIP Progress</span>
          <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 600 }}>VIP 1 → VIP 2</span>
        </div>
        <div className="h-2 rounded-full mb-2" style={{ background: c.borderSolid }}>
          <div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #F59E0B, #F97316)', width: '35%' }}
          />
        </div>
        <p style={{ color: c.text3, fontSize: 11 }}>
          Volume 30 ngày: $18,450 / $50,000 để lên VIP 2
        </p>
      </TrCard>

      {/* Referral stats card */}
      <TrCard
        hover
        as="button"
        onClick={() => navigate(`${prefix}/referral`)}
        className="mx-5 mt-3 p-4"
        accentBorder="rgba(245,158,11,0.15)"
      >
        <ProfileReferralCard />
      </TrCard>

      {/* Menu sections — desktop: 2-col grid for shortcut items */}
      {menuItems.map((section) => (
        <div key={section.section} className="mx-5 mt-4">
          <p
            style={{
              color: c.text3,
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {section.section}
          </p>
          {isDesktop ? (
            // Desktop: 2-column grid
            <div className="grid grid-cols-2 gap-3">
              {section.items.map((item, i) => (
                <TrCard
                  key={item.label}
                  as="button"
                  hover
                  onClick={item.action}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.1)' }}
                  >
                    <item.icon size={18} color="#3B82F6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{item.label}</p>
                    {item.sub && (
                      <p style={{ color: item.subColor ?? c.text2, fontSize: 12 }}>{item.sub}</p>
                    )}
                  </div>
                  <ChevronRight size={16} color={c.text3} />
                </TrCard>
              ))}
            </div>
          ) : (
            // Mobile/Tablet: stacked list
            <TrCard overflow>
              {section.items.map((item, i) => (
                <TrCard
                  key={item.label}
                  as="button"
                  hover
                  onClick={item.action}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.1)' }}
                  >
                    <item.icon size={18} color="#3B82F6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{item.label}</p>
                    {item.sub && (
                      <p style={{ color: item.subColor ?? c.text2, fontSize: 12 }}>{item.sub}</p>
                    )}
                  </div>
                  <ChevronRight size={16} color={c.text3} />
                </TrCard>
              ))}
            </TrCard>
          )}
        </div>
      ))}

      {/* Logout */}
      <div className="mx-5 mt-4">
        <CTAButton
          onClick={handleLogout}
          variant="danger"
          bg="rgba(239,68,68,0.1)"
          textColor="#EF4444"
          style={{ border: '1px solid rgba(239,68,68,0.3)', fontSize: 15, boxShadow: 'none' }}
        >
          <LogOut size={16} /> Đăng xuất
        </CTAButton>
      </div>

      <p style={{ color: c.text3, fontSize: 11, textAlign: 'center', marginTop: 16 }}>
        VitTrade v2.4.1 • Tham gia từ {USER_PROFILE.joinDate}
      </p>
    </PageLayout>
  );
}

function ProfileReferralCard() {
  const c = useThemeColors();
  const stats = getReferralStats();
  const { current: currentTier, next: nextTier } = getCurrentTier(stats.totalFriends);

  return (
    <div className="w-full text-left">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${currentTier.color}22, ${currentTier.color}15)`,
            border: `1px solid ${currentTier.color}33`,
          }}
        >
          <span style={{ fontSize: 18 }}>{currentTier.icon}</span>
        </div>
        <div className="flex-1">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Giới thiệu bạn bè</p>
          <p style={{ color: c.text3, fontSize: 12 }}>
            Hạng {currentTier.name} · {currentTier.commission}% hoa hồng
          </p>
        </div>
        <ChevronRight size={16} color={c.text3} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl p-2.5" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10 }}>Bạn bè</p>
          <p style={{ color: '#3B82F6', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
            {stats.totalFriends}
          </p>
        </div>
        <div className="flex-1 rounded-xl p-2.5" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10 }}>Hoa hồng</p>
          <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
            {fmtUsd(stats.totalCommission)}
          </p>
        </div>
        <div className="flex-1 rounded-xl p-2.5" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10 }}>Tháng này</p>
          <p style={{ color: '#F59E0B', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
            +{fmtUsd(stats.thisMonthCommission)}
          </p>
        </div>
      </div>
    </div>
  );
}
