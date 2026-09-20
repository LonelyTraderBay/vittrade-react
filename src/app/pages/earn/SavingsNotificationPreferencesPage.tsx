import React, { useState, useCallback } from 'react';
import {
  Bell, BellOff, BellRing, Volume2, VolumeX, Mail, Smartphone,
  MessageSquare, Moon, Sun, Clock, ChevronRight, CheckCircle,
  AlertTriangle, TrendingUp, PiggyBank, Lock, Unlock, Zap,
  Calendar, Shield, Package, ArrowUpFromLine, ArrowDownToLine,
  Megaphone, Settings, Info, RefreshCw, Target, X,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { TrCard } from '../../components/ui/TrCard';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { CTAButton } from '../../components/ui/CTAButton';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

interface AlertSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  enabled: boolean;
  category: 'product' | 'transaction' | 'system';
  severity: 'critical' | 'important' | 'info';
}

interface ProductAlert {
  productId: string;
  productName: string;
  asset: string;
  color: string;
  type: 'flexible' | 'locked';
  alerts: {
    apyChange: boolean;
    maturityReminder: boolean;
    capacityWarning: boolean;
    interestPaid: boolean;
    autoRenew: boolean;
  };
}

interface DeliveryChannel {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  enabled: boolean;
  detail: string;
}

interface QuietHours {
  enabled: boolean;
  startHour: number;
  endHour: number;
  allowCritical: boolean;
}

type DigestFrequency = 'instant' | 'hourly' | 'daily' | 'weekly';

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */

const INITIAL_ALERTS: AlertSetting[] = [
  // Product alerts
  {
    id: 'apy-change', title: 'Thay đổi APY', description: 'Thông báo khi APY sản phẩm thay đổi trên 0.5%',
    icon: TrendingUp, enabled: true, category: 'product', severity: 'important',
  },
  {
    id: 'maturity-reminder', title: 'Sắp đáo hạn', description: 'Thông báo 7 ngày, 3 ngày và 24h trước khi sản phẩm Cố định đáo hạn',
    icon: Calendar, enabled: true, category: 'product', severity: 'critical',
  },
  {
    id: 'capacity-warning', title: 'Sắp hết hạn mức', description: 'Thông báo khi sản phẩm còn dưới 10% hạn mức đăng ký',
    icon: AlertTriangle, enabled: true, category: 'product', severity: 'important',
  },
  {
    id: 'new-product', title: 'Sản phẩm mới', description: 'Thông báo khi có sản phẩm tiết kiệm mới ra mắt',
    icon: Package, enabled: true, category: 'product', severity: 'info',
  },
  {
    id: 'apy-opportunity', title: 'Cơ hội APY cao', description: 'Thông báo khi có sản phẩm APY vượt trên 5% phù hợp hồ sơ rủi ro của bạn',
    icon: Zap, enabled: false, category: 'product', severity: 'info',
  },
  // Transaction alerts
  {
    id: 'subscribe-confirm', title: 'Xác nhận đăng ký', description: 'Thông báo khi lệnh đăng ký tiết kiệm được xử lý thành công',
    icon: ArrowDownToLine, enabled: true, category: 'transaction', severity: 'critical',
  },
  {
    id: 'redeem-confirm', title: 'Xác nhận rút', description: 'Thông báo khi lệnh rút tiết kiệm được xử lý và tiền về ví',
    icon: ArrowUpFromLine, enabled: true, category: 'transaction', severity: 'critical',
  },
  {
    id: 'interest-paid', title: 'Nhận lãi hằng ngày', description: 'Thông báo khi lãi tiết kiệm được phân phối mỗi ngày',
    icon: PiggyBank, enabled: false, category: 'transaction', severity: 'info',
  },
  {
    id: 'auto-compound', title: 'Lãi kép tự động', description: 'Thông báo khi lãi kép tự động được thực hiện thành công',
    icon: RefreshCw, enabled: true, category: 'transaction', severity: 'info',
  },
  {
    id: 'goal-milestone', title: 'Đạt milestone mục tiêu', description: 'Thông báo khi bạn đạt milestone tiết kiệm (25%, 50%, 75%, 100%)',
    icon: Target, enabled: true, category: 'transaction', severity: 'important',
  },
  // System alerts
  {
    id: 'maintenance', title: 'Bảo trì hệ thống', description: 'Thông báo trước khi hệ thống bảo trì ảnh hưởng đến tiết kiệm',
    icon: Settings, enabled: true, category: 'system', severity: 'critical',
  },
  {
    id: 'security-alert', title: 'Cảnh báo bảo mật', description: 'Thông báo bất thường liên quan đến tài khoản tiết kiệm',
    icon: Shield, enabled: true, category: 'system', severity: 'critical',
  },
  {
    id: 'promotion', title: 'Khuyến mãi & Ưu đãi', description: 'Thông báo về chương trình khuyến mãi, APY boost, và ưu đãi đặc biệt',
    icon: Megaphone, enabled: false, category: 'system', severity: 'info',
  },
];

const INITIAL_PRODUCT_ALERTS: ProductAlert[] = [
  {
    productId: 'ms1', productName: 'USDT Linh hoạt', asset: 'USDT', color: '#26A17B', type: 'flexible',
    alerts: { apyChange: true, maturityReminder: false, capacityWarning: true, interestPaid: false, autoRenew: false },
  },
  {
    productId: 'ms2', productName: 'BTC Cố định 60D', asset: 'BTC', color: '#F7931A', type: 'locked',
    alerts: { apyChange: true, maturityReminder: true, capacityWarning: false, interestPaid: true, autoRenew: true },
  },
  {
    productId: 'ms3', productName: 'SOL Cố định 30D', asset: 'SOL', color: '#9945FF', type: 'locked',
    alerts: { apyChange: true, maturityReminder: true, capacityWarning: false, interestPaid: false, autoRenew: false },
  },
];

const INITIAL_CHANNELS: DeliveryChannel[] = [
  { id: 'push', label: 'Push Notification', icon: BellRing, enabled: true, detail: 'iPhone 15 Pro · 2 thiết bị' },
  { id: 'email', label: 'Email', icon: Mail, enabled: true, detail: 'n****@gmail.com' },
  { id: 'sms', label: 'SMS', icon: Smartphone, enabled: false, detail: '+84 *** *** 890' },
  { id: 'in-app', label: 'Trong ứng dụng', icon: MessageSquare, enabled: true, detail: 'Luôn bật' },
];

const DIGEST_OPTIONS: { id: DigestFrequency; label: string; desc: string }[] = [
  { id: 'instant', label: 'Ngay lập tức', desc: 'Gửi thông báo mỗi khi sự kiện xảy ra' },
  { id: 'hourly', label: 'Mỗi giờ', desc: 'Gộp nhóm thông báo gửi 1 lần/giờ' },
  { id: 'daily', label: 'Hằng ngày', desc: 'Tóm tắt thông báo gửi 1 lần/ngày lúc 9:00' },
  { id: 'weekly', label: 'Hằng tuần', desc: 'Báo cáo tổng hợp gửi mỗi thứ Hai' },
];

const SEVERITY_CONFIG = {
  critical: { label: 'Quan trọng', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  important: { label: 'Lưu ý', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  info: { label: 'Thông tin', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
};

const PRODUCT_ALERT_LABELS: Record<string, { label: string; icon: React.ComponentType<{ size?: number; color?: string }> }> = {
  apyChange: { label: 'Thay đổi APY', icon: TrendingUp },
  maturityReminder: { label: 'Nhắc đáo hạn', icon: Calendar },
  capacityWarning: { label: 'Cảnh báo hạn mức', icon: AlertTriangle },
  interestPaid: { label: 'Nhận lãi', icon: PiggyBank },
  autoRenew: { label: 'Tự động gia hạn', icon: RefreshCw },
};

/* ═══════════════════════════════════════════════════════════
   Toggle Switch Component
   ═══════════════════════════════════════════════════════════ */

function Toggle({ on, onChange, size = 'md', disabled = false }: {
  on: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md'; disabled?: boolean;
}) {
  const c = useThemeColors();
  const w = size === 'sm' ? 36 : 44;
  const h = size === 'sm' ? 20 : 24;
  const dot = size === 'sm' ? 16 : 20;
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: w, height: h, borderRadius: h,
        background: disabled ? c.borderSolid : on ? '#10B981' : c.surface2,
        border: `1.5px solid ${disabled ? c.borderSolid : on ? '#10B981' : c.borderSolid}`,
        position: 'relative', transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
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
   Main Page Component
   ═══════════════════════════════════════════════════════════ */

export function SavingsNotificationPreferencesPage() {
  const c = useThemeColors();
  const { hapticSelection, hapticLight, hapticSuccess } = useHaptic();

  /* State */
  const [tab, setTab] = useState<'events' | 'products' | 'delivery'>('events');
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [productAlerts, setProductAlerts] = useState(INITIAL_PRODUCT_ALERTS);
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>('instant');
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false, startHour: 22, endHour: 7, allowCritical: true,
  });
  const [masterToggle, setMasterToggle] = useState(true);
  const [showDigestSheet, setShowDigestSheet] = useState(false);
  const [showQuietSheet, setShowQuietSheet] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  /* Handlers */
  const toggleAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
    hapticLight();
  }, [hapticLight]);

  const toggleProductAlert = useCallback((productId: string, key: string) => {
    setProductAlerts(prev => prev.map(p =>
      p.productId === productId
        ? { ...p, alerts: { ...p.alerts, [key]: !(p.alerts as any)[key] } }
        : p
    ));
    hapticLight();
  }, [hapticLight]);

  const toggleChannel = useCallback((id: string) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, enabled: !ch.enabled } : ch));
    hapticLight();
  }, [hapticLight]);

  const handleMasterToggle = useCallback((val: boolean) => {
    setMasterToggle(val);
    hapticSelection();
    if (!val) {
      setAlerts(prev => prev.map(a => ({ ...a, enabled: false })));
    }
  }, [hapticSelection]);

  const handleSave = useCallback(() => {
    hapticSuccess();
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2500);
  }, [hapticSuccess]);

  /* Computed */
  const enabledCount = alerts.filter(a => a.enabled).length;
  const totalCount = alerts.length;
  const categoryAlerts = (cat: AlertSetting['category']) => alerts.filter(a => a.category === cat);

  const TABS = [
    { id: 'events' as const, label: 'Sự kiện' },
    { id: 'products' as const, label: 'Sản phẩm' },
    { id: 'delivery' as const, label: 'Kênh & Lịch' },
  ];

  return (
    <PageLayout>
      {/* ─── Digest Frequency Sheet ─── */}
      <BottomSheetV2 open={showDigestSheet} onClose={() => setShowDigestSheet(false)} title="Tần suất thông báo">
        <div className="flex flex-col gap-2">
          {DIGEST_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => { setDigestFrequency(opt.id); hapticSelection(); setShowDigestSheet(false); }}
              className="flex items-center gap-3 p-3 rounded-xl text-left"
              style={{
                background: digestFrequency === opt.id ? 'rgba(16,185,129,0.08)' : c.surface2,
                border: `1.5px solid ${digestFrequency === opt.id ? '#10B981' : 'transparent'}`,
              }}
            >
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: digestFrequency === opt.id ? '#10B981' : c.borderSolid }}>
                {digestFrequency === opt.id && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
                )}
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{opt.label}</p>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </BottomSheetV2>

      {/* ─── Quiet Hours Sheet ─── */}
      <BottomSheetV2 open={showQuietSheet} onClose={() => setShowQuietSheet(false)} title="Giờ im lặng">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Bật giờ im lặng</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Tạm dừng thông báo trong khung giờ chỉ định</p>
            </div>
            <Toggle on={quietHours.enabled} onChange={(v) => setQuietHours(prev => ({ ...prev, enabled: v }))} />
          </div>

          {quietHours.enabled && (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 4, display: 'block' }}>Từ</label>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                    <Moon size={ICON_SIZE.sm} color="#8B5CF6" />
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{quietHours.startHour}:00</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 4, display: 'block' }}>Đến</label>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                    <Sun size={ICON_SIZE.sm} color="#F59E0B" />
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{quietHours.endHour}:00</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={ICON_SIZE.sm} color="#EF4444" />
                  <div>
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Vẫn gửi cảnh báo quan trọng</p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Bảo mật, bảo trì, đáo hạn</p>
                  </div>
                </div>
                <Toggle on={quietHours.allowCritical} size="sm"
                  onChange={(v) => setQuietHours(prev => ({ ...prev, allowCritical: v }))} />
              </div>
            </>
          )}

          <CTAButton onClick={() => { setShowQuietSheet(false); hapticSuccess(); }}>
            Lưu cài đặt
          </CTAButton>
        </div>
      </BottomSheetV2>

      {/* ─── Saved Toast ─── */}
      {showSaved && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: c.surface, border: '1px solid #10B981',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto',
          }}>
          <CheckCircle size={ICON_SIZE.md} color="#10B981" />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Đã lưu cài đặt!</p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Thông báo sẽ áp dụng từ bây giờ.</p>
          </div>
          <button onClick={() => setShowSaved(false)}><X size={ICON_SIZE.sm} color={c.text3} /></button>
        </div>
      )}

      {/* ─── Header ─── */}
      <Header title="Cài đặt thông báo" back />

      {/* ─── Master Toggle ─── */}
      <TrCard variant="hero" rounded="lg" className="mx-5 mt-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: masterToggle ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)' }}>
              {masterToggle ? <Bell size={ICON_SIZE.md} color="#10B981" /> : <BellOff size={ICON_SIZE.md} color="#EF4444" />}
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                {masterToggle ? 'Thông báo đang bật' : 'Thông báo đã tắt'}
              </p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                {enabledCount}/{totalCount} loại thông báo đang hoạt động
              </p>
            </div>
          </div>
          <Toggle on={masterToggle} onChange={handleMasterToggle} />
        </div>

        {!masterToggle && (
          <div className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertTriangle size={13} color="#EF4444" className="mt-0.5 shrink-0" />
            <p style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              Tắt thông báo có thể khiến bạn bỏ lỡ cảnh báo đáo hạn, thay đổi APY và các sự kiện quan trọng.
            </p>
          </div>
        )}
      </TrCard>

      {/* ─── Quick Stats ─── */}
      <div className="flex gap-2 mx-5 mt-3">
        <div className="flex-1 p-3 rounded-xl" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Kênh hoạt động</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>
            {channels.filter(ch => ch.enabled).length}/{channels.length}
          </p>
        </div>
        <div className="flex-1 p-3 rounded-xl" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tần suất</p>
          <p style={{ color: '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            {DIGEST_OPTIONS.find(d => d.id === digestFrequency)?.label}
          </p>
        </div>
        <div className="flex-1 p-3 rounded-xl" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Giờ im lặng</p>
          <p style={{ color: quietHours.enabled ? '#8B5CF6' : c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            {quietHours.enabled ? `${quietHours.startHour}h-${quietHours.endHour}h` : 'Tắt'}
          </p>
        </div>
      </div>

      {/* ─── TabBar ─── */}
      <div className="px-5 mt-4">
        <TabBar tabs={TABS} active={tab} onChange={(t) => setTab(t as typeof tab)} />
      </div>

      {/* ═══ Tab: Events ═══ */}
      {tab === 'events' && (
        <PageContent padding="compact" gap="default">
          {(['product', 'transaction', 'system'] as const).map(cat => {
            const catAlerts = categoryAlerts(cat);
            const catLabels = {
              product: { title: 'Sản phẩm', icon: Package, color: '#3B82F6' },
              transaction: { title: 'Giao dịch', icon: ArrowDownToLine, color: '#10B981' },
              system: { title: 'Hệ thống', icon: Shield, color: '#8B5CF6' },
            };
            const catInfo = catLabels[cat];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <catInfo.icon size={ICON_SIZE.sm} color={catInfo.color} />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{catInfo.title}</span>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                    ({catAlerts.filter(a => a.enabled).length}/{catAlerts.length})
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {catAlerts.map(alert => {
                    const sev = SEVERITY_CONFIG[alert.severity];
                    return (
                      <TrCard key={alert.id} className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: sev.bg }}>
                            <alert.icon size={ICON_SIZE.sm} color={sev.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{alert.title}</p>
                              <span className="px-1.5 py-0.5 rounded"
                                style={{ background: sev.bg, color: sev.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                                {sev.label}
                              </span>
                            </div>
                            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.4, marginTop: 2 }}>
                              {alert.description}
                            </p>
                          </div>
                          <Toggle on={alert.enabled && masterToggle} size="sm"
                            onChange={() => toggleAlert(alert.id)}
                            disabled={!masterToggle} />
                        </div>
                      </TrCard>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </PageContent>
      )}

      {/* ═══ Tab: Products ═══ */}
      {tab === 'products' && (
        <PageContent padding="compact" gap="default">
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              Tùy chỉnh thông báo cho từng sản phẩm đang ký. Chỉ áp dụng cho sản phẩm bạn đang có vị thế hoạt động.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {productAlerts.map(prod => {
              const isExpanded = expandedProduct === prod.productId;
              const enabledAlerts = Object.values(prod.alerts).filter(Boolean).length;
              const totalAlerts = Object.keys(prod.alerts).length;

              return (
                <TrCard key={prod.productId} className="overflow-hidden">
                  {/* Product header */}
                  <button
                    onClick={() => { setExpandedProduct(isExpanded ? null : prod.productId); hapticSelection(); }}
                    className="w-full flex items-center gap-3 p-4"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: prod.color + '22', border: `1.5px solid ${prod.color}44` }}>
                      <span style={{ color: prod.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                        {prod.asset.slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{prod.productName}</p>
                        {prod.type === 'flexible'
                          ? <Unlock size={ICON_SIZE.sm} color="#10B981" />
                          : <Lock size={ICON_SIZE.sm} color="#F59E0B" />}
                      </div>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                        {enabledAlerts}/{totalAlerts} thông báo đang bật
                      </p>
                    </div>
                    <ChevronRight size={ICON_SIZE.sm} color={c.text3}
                      style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }} />
                  </button>

                  {/* Expanded alerts */}
                  <div style={{
                    display: 'grid',
                    gridTemplateRows: isExpanded ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.25s ease',
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div className="px-4 pb-4 flex flex-col gap-2"
                        style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }}>
                        {Object.entries(prod.alerts).map(([key, val]) => {
                          const alertInfo = PRODUCT_ALERT_LABELS[key];
                          if (!alertInfo) return null;
                          // Hide maturity for flexible products
                          if (key === 'maturityReminder' && prod.type === 'flexible') return null;
                          if (key === 'autoRenew' && prod.type === 'flexible') return null;
                          return (
                            <div key={key} className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2">
                                <alertInfo.icon size={ICON_SIZE.sm} color={c.text3} />
                                <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>{alertInfo.label}</span>
                              </div>
                              <Toggle on={val && masterToggle} size="sm"
                                onChange={() => toggleProductAlert(prod.productId, key)}
                                disabled={!masterToggle} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageContent>
      )}

      {/* ═══ Tab: Delivery & Schedule ═══ */}
      {tab === 'delivery' && (
        <PageContent padding="compact" gap="default">
          {/* Delivery channels */}
          <PageSection label="Kênh nhận thông báo">
            <div className="flex flex-col gap-2">
              {channels.map(ch => (
                <TrCard key={ch.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: ch.enabled ? 'rgba(16,185,129,0.1)' : c.surface2 }}>
                      <ch.icon size={ICON_SIZE.sm} color={ch.enabled ? '#10B981' : c.text3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{ch.label}</p>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{ch.detail}</p>
                    </div>
                    <Toggle on={ch.enabled} size="sm" onChange={() => toggleChannel(ch.id)}
                      disabled={ch.id === 'in-app'} />
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>

          {/* Digest frequency */}
          <PageSection label="Tần suất gửi">
            <button onClick={() => { setShowDigestSheet(true); hapticSelection(); }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
              <Clock size={ICON_SIZE.base} color="#3B82F6" />
              <div className="flex-1 text-left">
                <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                  {DIGEST_OPTIONS.find(d => d.id === digestFrequency)?.label}
                </p>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                  {DIGEST_OPTIONS.find(d => d.id === digestFrequency)?.desc}
                </p>
              </div>
              <ChevronRight size={ICON_SIZE.sm} color={c.text3} />
            </button>
          </PageSection>

          {/* Quiet hours */}
          <PageSection label="Giờ im lặng">
            <button onClick={() => { setShowQuietSheet(true); hapticSelection(); }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
              <Moon size={ICON_SIZE.base} color="#8B5CF6" />
              <div className="flex-1 text-left">
                <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                  {quietHours.enabled ? `${quietHours.startHour}:00 — ${quietHours.endHour}:00` : 'Chưa bật'}
                </p>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                  {quietHours.enabled
                    ? `Tạm dừng thông báo${quietHours.allowCritical ? ', ngoại trừ cảnh báo quan trọng' : ''}`
                    : 'Bật để tạm dừng thông báo vào ban đêm'}
                </p>
              </div>
              <ChevronRight size={ICON_SIZE.sm} color={c.text3} />
            </button>
          </PageSection>

          {/* Save CTA */}
          <CTAButton onClick={handleSave}>
            Lưu tất cả cài đặt
          </CTAButton>
        </PageContent>
      )}
    </PageLayout>
  );
}