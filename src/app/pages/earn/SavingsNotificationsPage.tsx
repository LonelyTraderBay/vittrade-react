import React, { useState } from 'react';
import {
  Bell, BellOff, Clock, TrendingUp, AlertTriangle, PiggyBank,
  Calendar, Zap, Shield, CheckCircle, Trash2, Settings,
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

/* ═══════════════════════════════════════════════════════════
   Notification Settings
   ═══════════════════════════════════════════════════════════ */
interface NotifSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
}

const INITIAL_SETTINGS: NotifSetting[] = [
  {
    id: 'maturity',
    title: 'Sắp đáo hạn',
    description: 'Nhận thông báo 3 ngày và 24 giờ trước khi sản phẩm Cố định đáo hạn',
    icon: Calendar,
    enabled: true,
    priority: 'high',
  },
  {
    id: 'apy-change',
    title: 'Thay đổi APY',
    description: 'Thông báo khi APY sản phẩm Linh hoạt thay đổi trên 0.5%',
    icon: TrendingUp,
    enabled: true,
    priority: 'high',
  },
  {
    id: 'interest-paid',
    title: 'Nhận lãi',
    description: 'Thông báo hàng ngày khi lãi được phân phối vào ví tiết kiệm',
    icon: PiggyBank,
    enabled: false,
    priority: 'medium',
  },
  {
    id: 'compound-done',
    title: 'Tái đầu tư hoàn tất',
    description: 'Thông báo khi auto-compound tự động gộp lãi vào gốc',
    icon: Zap,
    enabled: true,
    priority: 'low',
  },
  {
    id: 'new-product',
    title: 'Sản phẩm mới',
    description: 'Thông báo khi có sản phẩm tiết kiệm mới với APY hấp dẫn',
    icon: Bell,
    enabled: true,
    priority: 'low',
  },
  {
    id: 'capacity-warning',
    title: 'Sắp hết quota',
    description: 'Thông báo khi sản phẩm bạn quan tâm sắp hết capacity (>90%)',
    icon: AlertTriangle,
    enabled: true,
    priority: 'medium',
  },
  {
    id: 'early-redeem-risk',
    title: 'Cảnh báo rút sớm',
    description: 'Nhắc nhở phí phạt trước khi xác nhận rút sớm Cố định',
    icon: Shield,
    enabled: true,
    priority: 'high',
  },
  {
    id: 'weekly-summary',
    title: 'Báo cáo tuần',
    description: 'Tổng kết lãi nhận được, APY trung bình, portfolio update hàng tuần',
    icon: TrendingUp,
    enabled: true,
    priority: 'low',
  },
];

/* ═══════════════════════════════════════════════════════════
   Notification History
   ═══════════════════════════════════════════════════════════ */
type NotifType = 'maturity' | 'apy' | 'interest' | 'compound' | 'product' | 'system';

interface NotifItem {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_HISTORY: NotifItem[] = [
  {
    id: 'nh1', type: 'maturity',
    title: 'BTC Cố định 60D sắp đáo hạn',
    message: 'Vị thế của bạn sẽ đáo hạn vào 16/03/2026 (còn 7 ngày). Gốc + lãi sẽ tự động trả về ví.',
    time: '1 giờ trước',
    read: false,
  },
  {
    id: 'nh2', type: 'apy',
    title: 'APY USDT Linh hoạt tăng lên 4.8%',
    message: 'APY tăng từ 4.5% lên 4.8% (+0.3%). Lãi hàng ngày của bạn tăng ~$0.03.',
    time: '3 giờ trước',
    read: false,
  },
  {
    id: 'nh3', type: 'interest',
    title: 'Nhận lãi hôm nay: +$1.19',
    message: 'Đã phân phối lãi từ 4 vị thế. Tổng lãi tháng này: $35.55. Auto-compound đã gộp vào gốc.',
    time: '6 giờ trước',
    read: false,
  },
  {
    id: 'nh4', type: 'compound',
    title: 'Auto-compound thành công',
    message: 'Đã tự động gộp $1.19 lãi vào gốc USDT Linh hoạt. Gốc mới: $3,514.58. APY hiệu quả: 4.62%.',
    time: '6 giờ trước',
    read: true,
  },
  {
    id: 'nh5', type: 'maturity',
    title: 'SOL Cố định 30D sắp đáo hạn',
    message: 'Vị thế sẽ đáo hạn vào 22/03/2026 (còn 13 ngày). Bạn sẽ nhận 25 SOL + 0.45 SOL lãi.',
    time: '1 ngày trước',
    read: true,
  },
  {
    id: 'nh6', type: 'product',
    title: 'Sản phẩm mới: AVAX Cố định 30D',
    message: 'AVAX Cố định 30D đã ra mắt với APY khởi đầu 8.2%. Quota có hạn — 35% đã được đăng ký.',
    time: '2 ngày trước',
    read: true,
  },
  {
    id: 'nh7', type: 'system',
    title: 'Báo cáo tuần 03/03 - 09/03',
    message: 'Tổng lãi tuần: $8.07 | APY TB: 4.18% | Portfolio: $10,340.86 (+0.08%). Chi tiết trong Danh mục.',
    time: '2 ngày trước',
    read: true,
  },
  {
    id: 'nh8', type: 'interest',
    title: 'Nhận lãi hôm qua: +$1.16',
    message: 'Đã phân phối lãi từ 4 vị thế. USDT: +$0.43, BTC: +$0.01, SOL: +$0.46, ETH: +$0.26.',
    time: '1 ngày trước',
    read: true,
  },
];

const NOTIF_TYPE_CONFIG: Record<NotifType, {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  bg: string;
}> = {
  maturity: { icon: Calendar, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  apy: { icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  interest: { icon: PiggyBank, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  compound: { icon: Zap, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  product: { icon: Bell, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  system: { icon: Settings, color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#3B82F6',
  low: '#6B7280',
};

/* ─── Toggle switch component ─── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const c = useThemeColors();
  return (
    <button
      onClick={onToggle}
      className="relative shrink-0 transition-all"
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? c.primary : c.borderSolid,
      }}
    >
      <div
        className="absolute top-1 rounded-full bg-white transition-all"
        style={{
          width: 16,
          height: 16,
          left: on ? 24 : 4,
        }}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export function SavingsNotificationsPage() {
  const c = useThemeColors();
  const { hapticSelection, hapticLight } = useHaptic();

  const [tab, setTab] = useState<'history' | 'settings'>('history');
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [history, setHistory] = useState(INITIAL_HISTORY);

  /* Settings handlers */
  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    hapticLight();
  };

  const enabledCount = settings.filter(s => s.enabled).length;

  /* History handlers */
  const markAsRead = (id: string) => {
    setHistory(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    hapticLight();
  };

  const markAllAsRead = () => {
    setHistory(prev => prev.map(n => ({ ...n, read: true })));
    hapticLight();
  };

  const clearAll = () => {
    setHistory([]);
    hapticLight();
  };

  const unreadCount = history.filter(n => !n.read).length;

  return (
    <PageLayout>
      <Header title="Thông báo Tiết kiệm" back />

      <TabBar
        tabs={[
          { key: 'history', label: `Thông báo${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          { key: 'settings', label: 'Cài đặt' },
        ]}
        active={tab}
        onChange={(k) => { setTab(k as typeof tab); hapticLight(); }}
      />

      <PageContent gap="default">
        {/* ═══ HISTORY TAB ═══ */}
        {tab === 'history' && (
          <>
            {/* Info + action bar */}
            <div className="flex items-center justify-between px-1">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                {history.length} thông báo · {unreadCount} chưa đọc
              </span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <CheckCircle size={ICON_SIZE.sm} color="#3B82F6" />
                  <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>Đọc tất cả</span>
                </button>
              )}
            </div>

            {/* Notification list */}
            {history.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: c.surface2 }}>
                  <BellOff size={ICON_SIZE.lg} color={c.text3} />
                </div>
                <span style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.medium }}>
                  Chưa có thông báo
                </span>
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                  Thông báo về tiết kiệm sẽ hiển thị tại đây
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {history.map(notif => {
                  const cfg = NOTIF_TYPE_CONFIG[notif.type];
                  const Icon = cfg.icon;
                  return (
                    <button key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className="w-full rounded-2xl p-3 flex items-start gap-3 text-left"
                      style={{
                        background: notif.read ? c.surface2 : `${cfg.bg}`,
                        border: notif.read ? 'none' : `1px solid ${cfg.color}20`,
                      }}
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: cfg.bg }}>
                        <Icon size={ICON_SIZE.base} color={cfg.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{
                            color: c.text,
                            fontSize: FONT_SCALE.xs,
                            fontWeight: notif.read ? FONT_WEIGHT.medium : FONT_WEIGHT.bold,
                          }}>
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: c.primary }} />
                          )}
                        </div>
                        <p style={{
                          color: c.text3,
                          fontSize: FONT_SCALE.xs,
                          lineHeight: 1.5,
                          marginBottom: 4,
                        }}>
                          {notif.message}
                        </p>
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                          {notif.time}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Clear all */}
            {history.length > 0 && (
              <button onClick={clearAll}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                <Trash2 size={ICON_SIZE.sm} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>Xóa tất cả thông báo</span>
              </button>
            )}
          </>
        )}

        {/* ═══ SETTINGS TAB ═══ */}
        {tab === 'settings' && (
          <>
            {/* Summary */}
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
              <div className="flex gap-3">
                <Bell size={ICON_SIZE.md} color="#3B82F6" className="shrink-0 mt-0.5" />
                <div>
                  <div style={{ color: c.text, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 4 }}>
                    Quản lý Thông báo
                  </div>
                  <div style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
                    Tùy chỉnh thông báo để không bỏ lỡ sự kiện quan trọng.
                    Đang bật {enabledCount}/{settings.length} loại thông báo.
                  </div>
                </div>
              </div>
            </div>

            {/* Settings list grouped by priority */}
            {(['high', 'medium', 'low'] as const).map(priority => {
              const group = settings.filter(s => s.priority === priority);
              if (group.length === 0) return null;
              const priorityLabels = { high: 'Quan trọng', medium: 'Trung bình', low: 'Phụ' };
              return (
                <PageSection
                  key={priority}
                  label={priorityLabels[priority]}
                  accentColor={PRIORITY_COLORS[priority]}
                >
                  <div className="flex flex-col gap-2">
                    {group.map(setting => {
                      const Icon = setting.icon;
                      return (
                        <TrCard key={setting.id}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: setting.priority === 'high' ? 'rgba(239,68,68,0.12)' :
                                  setting.priority === 'medium' ? 'rgba(59,130,246,0.12)' :
                                    'rgba(107,114,128,0.12)',
                              }}>
                              <Icon size={ICON_SIZE.base} color={
                                setting.priority === 'high' ? '#EF4444' :
                                  setting.priority === 'medium' ? '#3B82F6' :
                                    '#6B7280'
                              } />
                            </div>
                            <div className="flex-1">
                              <div style={{ color: c.text, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 2 }}>
                                {setting.title}
                              </div>
                              <div style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.4 }}>
                                {setting.description}
                              </div>
                            </div>
                            <Toggle on={setting.enabled} onToggle={() => toggleSetting(setting.id)} />
                          </div>
                        </TrCard>
                      );
                    })}
                  </div>
                </PageSection>
              );
            })}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <Shield size={ICON_SIZE.sm} color="#3B82F6" className="shrink-0 mt-0.5" />
              <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.micro, lineHeight: 1.4 }}>
                Thông báo quan trọng (đáo hạn, cảnh báo rủi ro) được khuyến nghị luôn bật.
                Bạn có thể quản lý thông báo push chung trong Cài đặt hệ thống.
              </span>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}