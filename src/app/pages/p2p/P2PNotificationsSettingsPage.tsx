/**
 * ══════════════════════════════════════════════════════════
 *  P2PNotificationsSettingsPage — /p2p/settings/notifications
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: P2P-specific notification preferences
 */

import React, { useState } from 'react';
import { Bell, Mail, MessageCircle, Shield, CheckCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { toast } from 'sonner';

const NOTIFICATION_SETTINGS = [
  { id: 'order_updates', label: 'Order Updates', description: 'Cập nhật trạng thái đơn hàng', channels: { push: true, email: true, sms: false } },
  { id: 'payment_received', label: 'Payment Received', description: 'Thông báo khi nhận thanh toán', channels: { push: true, email: true, sms: true } },
  { id: 'release_reminder', label: 'Release Reminder', description: 'Nhắc release escrow', channels: { push: true, email: false, sms: false } },
  { id: 'security_alerts', label: 'Security Alerts', description: 'Cảnh báo bảo mật', channels: { push: true, email: true, sms: true } },
  { id: 'kyc_updates', label: 'KYC Updates', description: 'Cập nhật xác minh KYC', channels: { push: true, email: true, sms: false } },
];

export function P2PNotificationsSettingsPage() {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const [settings, setSettings] = useState(NOTIFICATION_SETTINGS);

  const handleToggle = (id: string, channel: 'push' | 'email' | 'sms') => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, channels: { ...s.channels, [channel]: !s.channels[channel] } } : s));
    hapticSuccess();
    toast.success('Đã cập nhật');
  };

  return (
    <PageLayout>
      <Header title="P2P Notifications" subtitle="Thông báo · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#3B82F6' }}>
              <Bell size={24} color="#FFFFFF" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Notification Settings</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Tùy chỉnh thông báo cho P2P Trading</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        <TrCard rounded="lg" className="overflow-hidden">
          {settings.map((setting, idx) => (
            <div key={setting.id} className="p-4" style={{ borderBottom: idx === settings.length - 1 ? 'none' : `1px solid ${c.borderSolid}` }}>
              <div className="mb-3">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 2 }}>{setting.label}</p>
                <p style={{ color: c.text3, fontSize: 11 }}>{setting.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: 'push', label: 'Push', icon: Bell }, { id: 'email', label: 'Email', icon: Mail }, { id: 'sms', label: 'SMS', icon: MessageCircle }].map(channel => (
                  <button key={channel.id} onClick={() => handleToggle(setting.id, channel.id as 'push' | 'email' | 'sms')} className="p-2 rounded-lg flex flex-col items-center gap-1" style={{ background: setting.channels[channel.id as keyof typeof setting.channels] ? hexToRgba('#10B981', 12) : c.surface2, border: `1px solid ${setting.channels[channel.id as keyof typeof setting.channels] ? '#10B981' : 'transparent'}` }}>
                    <channel.icon size={16} color={setting.channels[channel.id as keyof typeof setting.channels] ? '#10B981' : c.text3} />
                    <span style={{ color: setting.channels[channel.id as keyof typeof setting.channels] ? '#10B981' : c.text3, fontSize: 10, fontWeight: 600 }}>{channel.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </TrCard>
      </div>
    </PageLayout>
  );
}