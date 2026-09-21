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
  Globe,
  ClipboardList,
  Zap,
  Bot,
  Star,
  User,
  Lock,
  Smartphone,
  Activity,
  Eye,
  CreditCard,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { USER_PROFILE } from '../../data/mockData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';
import { fmtUsd } from '../../data/formatNumber';
import { getReferralStats, getCurrentTier } from '../../data/referralData';

const KYC_COLORS: Record<string, string> = {
  unverified: '#EF4444',
  pending: '#F59E0B',
  verified: '#10B981',
};
const KYC_LABELS: Record<string, string> = {
  unverified: 'Chưa xác minh',
  pending: 'Đang xem xét',
  verified: 'Đã xác minh',
};

/* ─── Profile Card ─── */
function ProfileCard() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [copiedRef, setCopiedRef] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(USER_PROFILE.referralCode).catch(() => {});
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: c.surface, border: `1px solid ${c.border}` }}
    >
      <div className="flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
        >
          <span style={{ color: '#fff', fontSize: WEB_FONT['2xl'], fontWeight: 700 }}>
            {USER_PROFILE.fullName.charAt(0)}
          </span>
        </div>
        <div className="flex-1">
          <p style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700 }}>
            {USER_PROFILE.fullName}
          </p>
          <p style={{ color: c.text3, fontSize: WEB_FONT.base }}>{USER_PROFILE.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ background: '#F59E0B18', color: '#F59E0B', border: '1px solid #F59E0B33' }}
            >
              VIP {USER_PROFILE.vipLevel}
            </span>
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{
                background: KYC_COLORS[USER_PROFILE.kycStatus] + '15',
                color: KYC_COLORS[USER_PROFILE.kycStatus],
              }}
            >
              KYC {KYC_LABELS[USER_PROFILE.kycStatus]}
            </span>
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{
                background: USER_PROFILE.has2FA ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: USER_PROFILE.has2FA ? '#10B981' : '#EF4444',
              }}
            >
              {USER_PROFILE.has2FA ? '2FA Bật' : '2FA Tắt'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0">
          <div className="flex items-center gap-2">
            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>UID:</span>
            <span
              style={{
                color: c.text1,
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
            >
              {USER_PROFILE.id.toUpperCase()}
            </span>
          </div>
          <button onClick={handleCopy} className="flex items-center gap-1.5">
            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Mã giới thiệu:</span>
            <span
              style={{
                color: '#3B82F6',
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
            >
              {USER_PROFILE.referralCode}
            </span>
            {copiedRef ? (
              <CheckCircle size={WEB_ICON.xs} color="#10B981" />
            ) : (
              <Copy size={WEB_ICON.xs} color="#3B82F6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Menu Section ─── */
function MenuSection({
  title,
  items,
}: {
  title: string;
  items: {
    icon: React.ComponentType<any>;
    label: string;
    sub?: string;
    subColor?: string;
    onClick: () => void;
  }[];
}) {
  const c = useThemeColors();
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: c.surface, border: `1px solid ${c.border}` }}
    >
      <div className="px-5 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <span
          style={{
            color: c.text3,
            fontSize: WEB_FONT.xs,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
      </div>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={item.onClick}
            className="web-cmd-btn flex items-center gap-3 px-5 py-3 w-full transition-colors"
            style={{ borderBottom: i < items.length - 1 ? `1px solid ${c.divider}` : 'none' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: c.hoverBg }}
            >
              <Icon size={WEB_ICON.sm} color={c.text2} />
            </div>
            <span
              className="flex-1 text-left"
              style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 500 }}
            >
              {item.label}
            </span>
            {item.sub && (
              <span style={{ color: item.subColor || c.text3, fontSize: WEB_FONT.sm }}>
                {item.sub}
              </span>
            )}
            <ChevronRight size={WEB_ICON.xs} color={c.text3} />
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export function WebProfilePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/w/auth/login', { replace: true });
  };

  return (
    <PageLayout>
      <Header variant="page" title="Tài khoản" />
      <div className="flex flex-col gap-5 py-6 px-6" style={{ maxWidth: 900, margin: '0 auto' }}>
        <ProfileCard />

        {/* 2-column layout for menu sections */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Left column */}
          <div className="flex flex-col gap-5">
            <MenuSection
              title="Tài khoản & Bảo mật"
              items={[
                {
                  icon: ShieldCheck,
                  label: 'Xác minh danh tính (KYC)',
                  sub: KYC_LABELS[USER_PROFILE.kycStatus],
                  subColor: KYC_COLORS[USER_PROFILE.kycStatus],
                  onClick: () => navigate('/w/profile/kyc'),
                },
                {
                  icon: Shield,
                  label: 'Trung tâm bảo mật',
                  sub: USER_PROFILE.has2FA ? '2FA Bật' : '2FA Tắt',
                  subColor: USER_PROFILE.has2FA ? '#10B981' : '#EF4444',
                  onClick: () => navigate('/w/profile/security'),
                },
                {
                  icon: Key,
                  label: 'Quản lý API',
                  sub: '3 key hoạt động',
                  onClick: () => navigate('/w/profile/api'),
                },
                {
                  icon: Smartphone,
                  label: 'Quản lý thiết bị',
                  onClick: () => navigate('/w/profile/devices'),
                },
                {
                  icon: Activity,
                  label: 'Lịch sử hoạt động',
                  onClick: () => navigate('/w/profile/activity'),
                },
              ]}
            />

            <MenuSection
              title="Cài đặt"
              items={[
                { icon: Globe, label: 'Ngôn ngữ', sub: 'Tiếng Việt', onClick: () => {} },
                {
                  icon: theme === 'dark' ? Moon : Sun,
                  label: 'Giao diện',
                  sub: theme === 'dark' ? 'Tối' : 'Sáng',
                  onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
                },
                { icon: Bell, label: 'Thông báo', onClick: () => navigate('/w/notifications') },
                {
                  icon: Settings,
                  label: 'Cài đặt chung',
                  onClick: () => navigate('/w/profile/settings'),
                },
              ]}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <MenuSection
              title="Giao dịch & Sản phẩm"
              items={[
                {
                  icon: Crown,
                  label: 'VIP Program',
                  sub: 'VIP 1 · Maker 0.09%',
                  subColor: '#F59E0B',
                  onClick: () => navigate('/w/profile/vip'),
                },
                {
                  icon: ClipboardList,
                  label: 'Lệnh & Lịch sử',
                  onClick: () => navigate('/w/trade/orders-history'),
                },
                {
                  icon: Bot,
                  label: 'Trading Bots',
                  sub: 'Tự động 24/7',
                  onClick: () => navigate('/w/trade/bots'),
                },
                {
                  icon: Users,
                  label: 'Giới thiệu bạn bè',
                  sub: '20% hoa hồng',
                  onClick: () => navigate('/w/referral'),
                },
                {
                  icon: Zap,
                  label: 'Staking & Earn',
                  sub: 'APY tới 24.5%',
                  onClick: () => navigate('/w/earn/staking'),
                },
              ]}
            />

            <MenuSection
              title="Hỗ trợ"
              items={[
                {
                  icon: HelpCircle,
                  label: 'Trung tâm hỗ trợ',
                  onClick: () => navigate('/w/support'),
                },
                {
                  icon: FileText,
                  label: 'Tin tức & Thông báo',
                  onClick: () => navigate('/w/news'),
                },
                { icon: Star, label: 'Đánh giá ứng dụng', onClick: () => {} },
              ]}
            />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="web-cmd-btn flex items-center gap-3 px-5 py-3 rounded-xl transition-colors w-full"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <LogOut size={WEB_ICON.sm} color="#EF4444" />
              <span style={{ color: '#EF4444', fontSize: WEB_FONT.base, fontWeight: 600 }}>
                Đăng xuất
              </span>
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
