/**
 * ══════════════════════════════════════════════════════════════
 *  CopySettingsPage — Phase 1 Week 3: Copy Trading Settings
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Global copy trading preferences
 * - Default copy mode setting
 * - Risk limit configuration
 * - Notification preferences
 * - Emergency contact setup
 * - Auto-stop rules
 * 
 * Compliance:
 * - Default risk settings for new copies
 * - Emergency contact (required for high-risk copies)
 * - Notification opt-in/out with legal requirements
 * - Auto-stop circuit breakers
 * 
 * Guidelines:
 * - PageLayout + PageSection pattern
 * - Settings organized by category
 * - Toggle switches for binary options
 * - Confirmation for destructive changes
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Settings, Bell, Shield, AlertTriangle, Target, Phone,
  Mail, Lock, Eye, EyeOff, ChevronRight, Info, Zap
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

type CopyMode = 'mirror' | 'fixed' | 'smart';

interface SettingsState {
  // Defaults
  defaultCopyMode: CopyMode;
  defaultCopyRatio: number;
  defaultStopLoss: number;
  defaultTakeProfit: number;
  
  // Risk Limits
  maxPortfolioAllocation: number;
  maxCopiesActive: number;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  
  // Notifications
  notifyNewTrades: boolean;
  notifyPnLChanges: boolean;
  notifyRiskAlerts: boolean;
  notifyProviderUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  
  // Emergency
  emergencyContact: string;
  emergencyPhone: string;
  
  // Privacy
  showPortfolioPublic: boolean;
}

export function CopySettingsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [settings, setSettings] = useState<SettingsState>({
    defaultCopyMode: 'fixed',
    defaultCopyRatio: 50,
    defaultStopLoss: 10,
    defaultTakeProfit: 20,
    maxPortfolioAllocation: 20,
    maxCopiesActive: 5,
    enableCircuitBreaker: true,
    circuitBreakerThreshold: 15,
    notifyNewTrades: true,
    notifyPnLChanges: true,
    notifyRiskAlerts: true,
    notifyProviderUpdates: false,
    emailNotifications: true,
    pushNotifications: true,
    emergencyContact: '',
    emergencyPhone: '',
    showPortfolioPublic: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Save settings to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageLayout>
      <Header title="Cài đặt Copy Trading" back />

      <PageContent gap="relaxed">
        {/* Default Settings */}
        <PageSection label="Cài đặt mặc định" accentColor={c.primary}>
          <div className="space-y-3">
            {/* Default Copy Mode */}
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <label style={{ color: c.text1, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Copy Mode mặc định
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mirror' as const, label: 'Mirror' },
                  { id: 'fixed' as const, label: 'Fixed' },
                  { id: 'smart' as const, label: 'Smart' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSettings({ ...settings, defaultCopyMode: mode.id })}
                    className="px-3 py-2 rounded-lg text-xs transition-all"
                    style={{
                      background: settings.defaultCopyMode === mode.id ? c.primary : c.surface,
                      color: settings.defaultCopyMode === mode.id ? '#fff' : c.text2,
                      border: `1px solid ${settings.defaultCopyMode === mode.id ? c.primary : c.border}`,
                      fontWeight: settings.defaultCopyMode === mode.id ? 600 : 500,
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Copy Ratio (for Fixed mode) */}
            {settings.defaultCopyMode === 'fixed' && (
              <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                <div className="flex justify-between items-center mb-2">
                  <label style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    Copy Ratio mặc định
                  </label>
                  <span style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                    {settings.defaultCopyRatio}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={settings.defaultCopyRatio}
                  onChange={(e) => setSettings({ ...settings, defaultCopyRatio: parseInt(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: c.primary }}
                />
                <p style={{ color: c.text3, fontSize: 9, marginTop: 4 }}>
                  Copy {settings.defaultCopyRatio}% position size của provider
                </p>
              </div>
            )}

            {/* Default Stop-Loss */}
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex justify-between items-center mb-2">
                <label style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                  Stop-Loss mặc định
                </label>
                <span style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>
                  -{settings.defaultStopLoss}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={settings.defaultStopLoss}
                onChange={(e) => setSettings({ ...settings, defaultStopLoss: parseInt(e.target.value) })}
                className="w-full"
                style={{ accentColor: '#EF4444' }}
              />
            </div>

            {/* Default Take-Profit */}
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex justify-between items-center mb-2">
                <label style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                  Take-Profit mặc định
                </label>
                <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                  +{settings.defaultTakeProfit}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={settings.defaultTakeProfit}
                onChange={(e) => setSettings({ ...settings, defaultTakeProfit: parseInt(e.target.value) })}
                className="w-full"
                style={{ accentColor: '#10B981' }}
              />
            </div>
          </div>
        </PageSection>

        {/* Risk Limits */}
        <PageSection label="Giới hạn rủi ro" accentColor="#EF4444">
          <div className="space-y-3">
            {/* Max Portfolio Allocation */}
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <label style={{ color: c.text1, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    Max allocation per provider
                  </label>
                  <p style={{ color: c.text3, fontSize: 9 }}>Không copy quá X% tổng portfolio vào 1 provider</p>
                </div>
                <span style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                  {settings.maxPortfolioAllocation}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={settings.maxPortfolioAllocation}
                onChange={(e) => setSettings({ ...settings, maxPortfolioAllocation: parseInt(e.target.value) })}
                className="w-full"
                style={{ accentColor: c.primary }}
              />
            </div>

            {/* Max Active Copies */}
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <label style={{ color: c.text1, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    Max số copy đồng thời
                  </label>
                  <p style={{ color: c.text3, fontSize: 9 }}>Giới hạn số provider bạn có thể copy cùng lúc</p>
                </div>
                <span style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                  {settings.maxCopiesActive}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={settings.maxCopiesActive}
                onChange={(e) => setSettings({ ...settings, maxCopiesActive: parseInt(e.target.value) })}
                className="w-full"
                style={{ accentColor: c.primary }}
              />
            </div>

            {/* Circuit Breaker */}
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} color={c.primary} />
                    <label style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                      Circuit Breaker
                    </label>
                  </div>
                  <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4 }}>
                    Tự động dừng TẤT CẢ copy khi tổng portfolio lỗ quá X%
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enableCircuitBreaker: !settings.enableCircuitBreaker })}
                  className="w-12 h-6 rounded-full transition-all relative"
                  style={{
                    background: settings.enableCircuitBreaker ? c.primary : c.border,
                  }}
                >
                  <div 
                    className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow"
                    style={{ left: settings.enableCircuitBreaker ? '24px' : '2px' }}
                  />
                </button>
              </div>

              {settings.enableCircuitBreaker && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ color: c.text2, fontSize: 10 }}>Ngưỡng kích hoạt</span>
                    <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 700 }}>
                      -{settings.circuitBreakerThreshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    step={5}
                    value={settings.circuitBreakerThreshold}
                    onChange={(e) => setSettings({ ...settings, circuitBreakerThreshold: parseInt(e.target.value) })}
                    className="w-full"
                    style={{ accentColor: '#EF4444' }}
                  />
                </div>
              )}
            </div>
          </div>
        </PageSection>

        {/* Notifications */}
        <PageSection label="Thông báo" accentColor="#3B82F6">
          <div className="space-y-3">
            {[
              { key: 'notifyNewTrades' as const, label: 'Trades mới', desc: 'Thông báo mỗi khi provider mở/đóng lệnh' },
              { key: 'notifyPnLChanges' as const, label: 'Thay đổi P/L', desc: 'Cảnh báo khi P/L thay đổi >5%' },
              { key: 'notifyRiskAlerts' as const, label: 'Cảnh báo rủi ro', desc: 'Provider gần stop-loss hoặc có drawdown lớn' },
              { key: 'notifyProviderUpdates' as const, label: 'Cập nhật provider', desc: 'Thông báo khi provider thay đổi chiến lược' },
            ].map(item => (
              <div 
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: c.surface2 }}
              >
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                    {item.label}
                  </p>
                  <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                  className="w-12 h-6 rounded-full transition-all relative ml-3"
                  style={{
                    background: settings[item.key] ? c.primary : c.border,
                  }}
                >
                  <div 
                    className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow"
                    style={{ left: settings[item.key] ? '24px' : '2px' }}
                  />
                </button>
              </div>
            ))}

            <div className="h-px" style={{ background: c.border }} />

            {/* Notification Channels */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                className="p-3 rounded-xl flex items-center gap-2 transition-all"
                style={{
                  background: settings.emailNotifications ? c.primary + '15' : c.surface2,
                  border: `1px solid ${settings.emailNotifications ? c.primary : c.border}`,
                }}
              >
                <Mail size={14} color={settings.emailNotifications ? c.primary : c.text3} />
                <span style={{ 
                  color: settings.emailNotifications ? c.primary : c.text2,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  Email
                </span>
              </button>
              <button
                onClick={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
                className="p-3 rounded-xl flex items-center gap-2 transition-all"
                style={{
                  background: settings.pushNotifications ? c.primary + '15' : c.surface2,
                  border: `1px solid ${settings.pushNotifications ? c.primary : c.border}`,
                }}
              >
                <Bell size={14} color={settings.pushNotifications ? c.primary : c.text3} />
                <span style={{ 
                  color: settings.pushNotifications ? c.primary : c.text2,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  Push
                </span>
              </button>
            </div>
          </div>
        </PageSection>

        {/* Emergency Contact */}
        <PageSection label="Liên hệ khẩn cấp" accentColor="#F59E0B">
          <div className="p-3 rounded-xl" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
            <div className="flex items-start gap-2 mb-3">
              <Info size={14} color={c.warningText} className="shrink-0 mt-0.5" />
              <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.5 }}>
                Người liên hệ khẩn cấp sẽ được thông báo nếu tài khoản của bạn có hoạt động bất thường 
                hoặc kích hoạt circuit breaker.
              </p>
            </div>

            <div className="space-y-2">
              <div>
                <label style={{ color: c.text2, fontSize: 10, display: 'block', marginBottom: 4 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={settings.emergencyContact}
                  onChange={(e) => setSettings({ ...settings, emergencyContact: e.target.value })}
                  placeholder="emergency@example.com"
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    background: c.surface2,
                    border: `1px solid ${c.border}`,
                    color: c.text1,
                    fontSize: 12,
                  }}
                />
              </div>

              <div>
                <label style={{ color: c.text2, fontSize: 10, display: 'block', marginBottom: 4 }}>
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={settings.emergencyPhone}
                  onChange={(e) => setSettings({ ...settings, emergencyPhone: e.target.value })}
                  placeholder="+84 xxx xxx xxx"
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    background: c.surface2,
                    border: `1px solid ${c.border}`,
                    color: c.text1,
                    fontSize: 12,
                  }}
                />
              </div>
            </div>
          </div>
        </PageSection>

        {/* Privacy */}
        <PageSection label="Quyền riêng tư" accentColor="#6B7280">
          <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {settings.showPortfolioPublic ? (
                    <Eye size={14} color={c.primary} />
                  ) : (
                    <EyeOff size={14} color={c.text3} />
                  )}
                  <label style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    Hiển thị portfolio công khai
                  </label>
                </div>
                <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4 }}>
                  Cho phép người khác xem portfolio copy của bạn (không hiện số tiền cụ thể)
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, showPortfolioPublic: !settings.showPortfolioPublic })}
                className="w-12 h-6 rounded-full transition-all relative ml-3"
                style={{
                  background: settings.showPortfolioPublic ? c.primary : c.border,
                }}
              >
                <div 
                  className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow"
                  style={{ left: settings.showPortfolioPublic ? '24px' : '2px' }}
                />
              </button>
            </div>
          </div>
        </PageSection>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full rounded-xl flex items-center justify-center gap-2 transition-all"
          style={{
            background: saved ? '#10B981' : c.primary,
            color: '#fff',
            height: 48,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {saved ? (
            <>
              <Shield size={16} />
              <span>Đã lưu!</span>
            </>
          ) : (
            <>
              <Settings size={16} />
              <span>Lưu cài đặt</span>
            </>
          )}
        </button>
      </PageContent>
    </PageLayout>
  );
}
