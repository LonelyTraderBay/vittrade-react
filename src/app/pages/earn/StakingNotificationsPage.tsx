import React, { useState } from 'react';
import { Bell, BellOff, Clock, TrendingUp, AlertTriangle, DollarSign, Calendar, Zap } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: any;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationHistory {
  id: string;
  type: 'maturity' | 'apy-change' | 'reward' | 'risk' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: 'maturity',
    title: 'Vị thế sắp đáo hạn',
    description: 'Nhận thông báo 24h trước khi Fixed staking đáo hạn',
    icon: Calendar,
    enabled: true,
    priority: 'high',
  },
  {
    id: 'apy-change',
    title: 'Thay đổi APY',
    description: 'Thông báo khi APY thay đổi &gt;1% (tăng hoặc giảm)',
    icon: TrendingUp,
    enabled: true,
    priority: 'high',
  },
  {
    id: 'reward-ready',
    title: 'Phần thưởng sẵn sàng',
    description: 'Thông báo hàng ngày khi nhận rewards (chỉ nếu &gt;$10)',
    icon: DollarSign,
    enabled: false,
    priority: 'medium',
  },
  {
    id: 'compound-done',
    title: 'Auto-compound hoàn tất',
    description: 'Thông báo khi auto-compound được thực hiện',
    icon: Zap,
    enabled: true,
    priority: 'low',
  },
  {
    id: 'validator-risk',
    title: 'Cảnh báo Validator',
    description: 'Uptime validator &lt;99% hoặc có slashing event',
    icon: AlertTriangle,
    enabled: true,
    priority: 'high',
  },
  {
    id: 'unlock-soon',
    title: 'Unbonding sắp xong',
    description: 'Thông báo khi unbonding period sắp kết thúc (còn 1 ngày)',
    icon: Clock,
    enabled: true,
    priority: 'medium',
  },
  {
    id: 'weekly-summary',
    title: 'Báo cáo hàng tuần',
    description: 'Tổng kết earnings, performance, APY trung bình',
    icon: TrendingUp,
    enabled: true,
    priority: 'low',
  },
  {
    id: 'new-products',
    title: 'Sản phẩm mới',
    description: 'Thông báo khi có sản phẩm staking mới hoặc APY hấp dẫn',
    icon: Zap,
    enabled: false,
    priority: 'low',
  },
];

const NOTIFICATION_HISTORY: NotificationHistory[] = [
  {
    id: 'n1',
    type: 'maturity',
    title: 'SOL Fixed 30D sắp đáo hạn',
    message: 'Vị thế của bạn sẽ đáo hạn vào 03/03/2026. Nhớ kiểm tra và quyết định stake lại hoặc rút về.',
    time: '2 giờ trước',
    read: false,
  },
  {
    id: 'n2',
    type: 'apy-change',
    title: 'APY USDT Flexible tăng',
    message: 'APY đã tăng từ 6.0% lên 7.0% (+16.7%). Đây là thời điểm tốt để stake thêm!',
    time: '5 giờ trước',
    read: false,
  },
  {
    id: 'n3',
    type: 'reward',
    title: 'Nhận phần thưởng hôm nay',
    message: 'Bạn đã nhận $12.45 từ 3 vị thế staking. Tổng earnings tháng này: $156.80.',
    time: '1 ngày trước',
    read: true,
  },
  {
    id: 'n4',
    type: 'system',
    title: 'Auto-compound thành công',
    message: 'Đã tự động compound 18.5 USDT vào vị thế Flexible. APY hiệu quả: 7.2%.',
    time: '1 ngày trước',
    read: true,
  },
  {
    id: 'n5',
    type: 'risk',
    title: 'Cảnh báo: Validator uptime thấp',
    message: 'Validator "Staked.us" có uptime 98.5% (thấp hơn 99%). Cân nhắc chuyển sang validator khác.',
    time: '3 ngày trước',
    read: true,
  },
];

const TYPE_CONFIG = {
  maturity: { icon: Calendar, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  'apy-change': { icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  reward: { icon: DollarSign, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  risk: { icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  system: { icon: Zap, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
};

export function StakingNotificationsPage() {
  const c = useThemeColors();
  const [settings, setSettings] = useState(NOTIFICATION_SETTINGS);
  const [history, setHistory] = useState(NOTIFICATION_HISTORY);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const markAsRead = (id: string) => {
    setHistory(history.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setHistory(history.map(n => ({ ...n, read: true })));
  };

  const unreadCount = history.filter(n => !n.read).length;

  return (
    <PageLayout>
      <Header title="Thông báo" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Bell size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Quản lý Thông báo
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Tùy chỉnh thông báo để không bỏ lỡ sự kiện quan trọng. Chúng tôi chỉ gửi thông báo thật sự cần thiết.
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <PageSection label="Cài đặt Thông báo">
          <div className="flex flex-col gap-2">
            {settings.map(setting => {
              const Icon = setting.icon;
              return (
                <TrCard key={setting.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: setting.priority === 'high' ? 'rgba(239,68,68,0.12)' :
                                   setting.priority === 'medium' ? 'rgba(59,130,246,0.12)' :
                                   'rgba(107,114,128,0.12)',
                        border: `1.5px solid ${
                          setting.priority === 'high' ? 'rgba(239,68,68,0.3)' :
                          setting.priority === 'medium' ? 'rgba(59,130,246,0.3)' :
                          'rgba(107,114,128,0.3)'
                        }`,
                      }}>
                      <Icon
                        size={18}
                        color={
                          setting.priority === 'high' ? '#EF4444' :
                          setting.priority === 'medium' ? '#3B82F6' :
                          '#6B7280'
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                          {setting.title}
                        </p>
                        {setting.priority === 'high' && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                            Quan trọng
                          </span>
                        )}
                      </div>
                      <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                        {setting.description}
                      </p>
                    </div>
                    <label className="relative inline-block w-12 h-6 shrink-0">
                      <input
                        type="checkbox"
                        checked={setting.enabled}
                        onChange={() => toggleSetting(setting.id)}
                        className="opacity-0 w-0 h-0"
                      />
                      <span
                        className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all"
                        style={{
                          background: setting.enabled ? '#10B981' : c.borderSolid,
                        }}>
                        <span
                          className="absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-all"
                          style={{
                            transform: setting.enabled ? 'translateX(24px)' : 'translateX(0)',
                          }}
                        />
                      </span>
                    </label>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Notification Channels */}
        <PageSection label="Kênh nhận Thông báo">
          <TrCard className="p-4">
            <div className="flex flex-col gap-3">
              {[
                { id: 'push', label: 'Push Notification (App)', enabled: true },
                { id: 'email', label: 'Email', enabled: true },
                { id: 'sms', label: 'SMS (chỉ High priority)', enabled: false },
              ].map(channel => (
                <div key={channel.id} className="flex items-center justify-between">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                    {channel.label}
                  </p>
                  <label className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={channel.enabled}
                      onChange={() => {}}
                      className="opacity-0 w-0 h-0"
                    />
                    <span
                      className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all"
                      style={{
                        background: channel.enabled ? '#10B981' : c.borderSolid,
                      }}>
                      <span
                        className="absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-all"
                        style={{
                          transform: channel.enabled ? 'translateX(24px)' : 'translateX(0)',
                        }}
                      />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Notification History */}
        <PageSection label={`Lịch sử (${unreadCount} chưa đọc)`}>
          <div className="flex items-center justify-between mb-3">
            <p style={{ color: c.text2, fontSize: 13 }}>
              {history.length} thông báo gần đây
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold"
                style={{ color: '#3B82F6' }}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {history.map(notif => {
              const config = TYPE_CONFIG[notif.type];
              const Icon = config.icon;
              return (
                <TrCard
                  key={notif.id}
                  hover
                  className="p-4"
                  onClick={() => markAsRead(notif.id)}
                  style={{
                    background: notif.read ? c.surface : 'rgba(59,130,246,0.03)',
                    border: notif.read ? `1px solid ${c.borderSolid}` : '1px solid rgba(59,130,246,0.15)',
                  }}>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: config.bg, border: `1.5px solid ${config.color}44` }}>
                      <Icon size={18} color={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p style={{
                          color: c.text1,
                          fontSize: 14,
                          fontWeight: notif.read ? 600 : 700,
                        }}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }} />
                        )}
                      </div>
                      <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>
                        {notif.message}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {notif.time}
                      </p>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Do Not Disturb */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3">
            <BellOff size={20} color="#F59E0B" className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Chế độ Không làm phiền
              </p>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
                Tắt tất cả thông báo từ 22:00-07:00 (trừ High priority)
              </p>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="opacity-0 w-0 h-0"
                />
                <span
                  className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all"
                  style={{ background: c.borderSolid }}>
                  <span
                    className="absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-all"
                  />
                </span>
              </label>
            </div>
          </div>
        </TrCard>

        {/* Footer Info */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Thông báo giúp bạn không bỏ lỡ các sự kiện quan trọng. Chúng tôi cam kết không spam và chỉ gửi thông báo có giá trị thật sự.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
