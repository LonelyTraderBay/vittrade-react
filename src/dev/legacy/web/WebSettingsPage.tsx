/**
 * ══════════════════════════════════════════════════════════
 *  WEB SETTINGS PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/profile/settings
 *
 *  General application settings & preferences
 *  - Language & Region
 *  - Currency display
 *  - Theme (Light/Dark)
 *  - Notifications preferences
 *  - Privacy settings
 *  - Trading preferences
 *  - Display settings
 *
 *  Guidelines compliance:
 *  - §15.1: Clear settings labels
 *  - §21.4: Header with breadcrumb
 *  - 2-column layout
 *  - Organized by categories
 */

import React, { useState } from 'react';
import { Globe, Bell, Eye, TrendingUp, Monitor, ChevronRight, Info } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useTheme } from '@/shared/theme/useTheme';
import { WEB_FONT } from '@/shared/theme/webTokens';
import { PageLayout } from '@/shared/ui/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

interface SettingItem {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'link';
  value?: boolean | string;
  options?: { value: string; label: string }[];
  icon?: React.ElementType;
  onClick?: () => void;
}

interface SettingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  settings: SettingItem[];
}

const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'VND', label: 'VND (₫)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh (UTC+7)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function SettingRow({
  setting,
  onToggle,
  onSelect,
}: {
  setting: SettingItem;
  onToggle?: (id: string) => void;
  onSelect?: (id: string, value: string) => void;
}) {
  const c = useThemeColors();

  if (setting.type === 'toggle') {
    return (
      <div
        className="flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer"
        style={{
          background: c.surface,
          border: `1px solid ${c.border}`,
        }}
        onClick={() => onToggle?.(setting.id)}
      >
        <div className="flex-1">
          <div
            style={{
              color: c.text1,
              fontSize: WEB_FONT.SIZE.BODY,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {setting.label}
          </div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
            {setting.description}
          </div>
        </div>
        <div
          className="flex items-center justify-center rounded-full transition-all"
          style={{
            width: 48,
            height: 28,
            background: setting.value ? '#10B981' : c.bg,
            border: `2px solid ${setting.value ? '#10B981' : c.border}`,
            position: 'relative',
          }}
        >
          <div
            className="absolute rounded-full transition-all"
            style={{
              width: 20,
              height: 20,
              background: '#fff',
              left: setting.value ? 24 : 4,
            }}
          />
        </div>
      </div>
    );
  }

  if (setting.type === 'select') {
    return (
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{
          background: c.surface,
          border: `1px solid ${c.border}`,
        }}
      >
        <div className="flex-1">
          <div
            style={{
              color: c.text1,
              fontSize: WEB_FONT.SIZE.BODY,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {setting.label}
          </div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
            {setting.description}
          </div>
        </div>
        <select
          value={setting.value as string}
          onChange={(e) => onSelect?.(setting.id, e.target.value)}
          className="px-3 py-2 rounded-lg"
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            color: c.text1,
            fontSize: WEB_FONT.SIZE.CAPTION,
            fontWeight: 600,
            outline: 'none',
          }}
        >
          {setting.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (setting.type === 'link') {
    return (
      <button
        onClick={setting.onClick}
        className="flex items-center justify-between p-4 rounded-xl transition-colors w-full"
        style={{
          background: c.surface,
          border: `1px solid ${c.border}`,
          textAlign: 'left',
        }}
      >
        <div className="flex-1">
          <div
            style={{
              color: c.text1,
              fontSize: WEB_FONT.SIZE.BODY,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {setting.label}
          </div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
            {setting.description}
          </div>
        </div>
        <ChevronRight size={20} color={c.text3} />
      </button>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebSettingsPage() {
  const c = useThemeColors();
  const { theme, setTheme } = useTheme();

  // Settings state
  const [language, setLanguage] = useState('vi');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    trading: true,
    security: true,
    news: false,
  });
  const [privacy, setPrivacy] = useState({
    showPortfolio: false,
    showTrades: false,
    allowAnalytics: true,
  });
  const [trading, setTrading] = useState({
    confirmOrders: true,
    soundEffects: true,
    autoRefresh: true,
  });

  const handleToggle = (section: string, id: string) => {
    if (section === 'notifications') {
      setNotifications((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
    } else if (section === 'privacy') {
      setPrivacy((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
    } else if (section === 'trading') {
      setTrading((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
    }
  };

  const SETTING_SECTIONS: SettingSection[] = [
    {
      id: 'regional',
      title: 'Ngôn ngữ & Khu vực',
      icon: Globe,
      color: '#3B82F6',
      settings: [
        {
          id: 'language',
          label: 'Ngôn ngữ',
          description: 'Ngôn ngữ hiển thị',
          type: 'select',
          value: language,
          options: LANGUAGE_OPTIONS,
        },
        {
          id: 'currency',
          label: 'Tiền tệ hiển thị',
          description: 'Đơn vị tiền tệ mặc định',
          type: 'select',
          value: currency,
          options: CURRENCY_OPTIONS,
        },
        {
          id: 'timezone',
          label: 'Múi giờ',
          description: 'Múi giờ cho lịch sử giao dịch',
          type: 'select',
          value: timezone,
          options: TIMEZONE_OPTIONS,
        },
      ],
    },
    {
      id: 'appearance',
      title: 'Giao diện',
      icon: Monitor,
      color: '#8B5CF6',
      settings: [
        {
          id: 'theme',
          label: 'Chủ đề',
          description: 'Giao diện sáng hoặc tối',
          type: 'select',
          value: theme,
          options: [
            { value: 'light', label: 'Sáng' },
            { value: 'dark', label: 'Tối' },
          ],
        },
      ],
    },
    {
      id: 'notifications',
      title: 'Thông báo',
      icon: Bell,
      color: '#F59E0B',
      settings: [
        {
          id: 'email',
          label: 'Email',
          description: 'Nhận thông báo qua email',
          type: 'toggle',
          value: notifications.email,
        },
        {
          id: 'push',
          label: 'Push notifications',
          description: 'Thông báo trên trình duyệt',
          type: 'toggle',
          value: notifications.push,
        },
        {
          id: 'sms',
          label: 'SMS',
          description: 'Thông báo qua tin nhắn',
          type: 'toggle',
          value: notifications.sms,
        },
        {
          id: 'trading',
          label: 'Giao dịch',
          description: 'Thông báo lệnh, khớp lệnh',
          type: 'toggle',
          value: notifications.trading,
        },
        {
          id: 'security',
          label: 'Bảo mật',
          description: 'Đăng nhập, thay đổi mật khẩu',
          type: 'toggle',
          value: notifications.security,
        },
        {
          id: 'news',
          label: 'Tin tức & Sự kiện',
          description: 'Tin tức, niêm yết mới',
          type: 'toggle',
          value: notifications.news,
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Quyền riêng tư',
      icon: Eye,
      color: '#10B981',
      settings: [
        {
          id: 'showPortfolio',
          label: 'Hiển thị danh mục công khai',
          description: 'Cho phép người khác xem danh mục của bạn',
          type: 'toggle',
          value: privacy.showPortfolio,
        },
        {
          id: 'showTrades',
          label: 'Hiển thị lịch sử giao dịch',
          description: 'Công khai lịch sử giao dịch',
          type: 'toggle',
          value: privacy.showTrades,
        },
        {
          id: 'allowAnalytics',
          label: 'Dữ liệu phân tích',
          description: 'Cho phép thu thập dữ liệu để cải thiện dịch vụ',
          type: 'toggle',
          value: privacy.allowAnalytics,
        },
      ],
    },
    {
      id: 'trading',
      title: 'Giao dịch',
      icon: TrendingUp,
      color: '#EF4444',
      settings: [
        {
          id: 'confirmOrders',
          label: 'Xác nhận trước khi đặt lệnh',
          description: 'Hiển thị popup xác nhận',
          type: 'toggle',
          value: trading.confirmOrders,
        },
        {
          id: 'soundEffects',
          label: 'Âm thanh',
          description: 'Âm thanh khi khớp lệnh',
          type: 'toggle',
          value: trading.soundEffects,
        },
        {
          id: 'autoRefresh',
          label: 'Tự động làm mới',
          description: 'Cập nhật giá tự động',
          type: 'toggle',
          value: trading.autoRefresh,
        },
      ],
    },
  ];

  return (
    <PageLayout>
      <div className="flex" style={{ minHeight: '100%' }}>
        {/* ═══ LEFT SIDEBAR (280px) ═══ */}
        <div
          className="flex flex-col"
          style={{
            width: 280,
            background: c.surface,
            borderRight: `1px solid ${c.divider}`,
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            maxHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5"
            style={{
              height: 60,
              borderBottom: `1px solid ${c.divider}`,
            }}
          >
            <h2
              style={{
                color: c.text1,
                fontSize: WEB_FONT.SIZE.H2,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Cài đặt
            </h2>
          </div>

          {/* Quick Jump */}
          <div className="p-4">
            <div
              style={{
                color: c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Danh mục
            </div>
            <div className="flex flex-col gap-1">
              {SETTING_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left"
                    style={{
                      background: 'transparent',
                      color: c.text2,
                      fontSize: WEB_FONT.SIZE.CAPTION,
                      fontWeight: 500,
                    }}
                  >
                    <Icon size={14} color={section.color} />
                    {section.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="px-4 pb-4 mt-auto">
            <div
              className="p-3 rounded-lg"
              style={{
                background: '#3B82F615',
                border: `1px solid #3B82F640`,
              }}
            >
              <div className="flex items-start gap-2">
                <Info size={14} color="#3B82F6" className="flex-shrink-0 mt-0.5" />
                <div>
                  <div
                    style={{
                      color: '#3B82F6',
                      fontSize: WEB_FONT.SIZE.CAPTION,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Cài đặt được lưu tự động
                  </div>
                  <div style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                    Mọi thay đổi được áp dụng ngay lập tức và đồng bộ trên tất cả thiết bị.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto p-8">
            {/* Page Header */}
            <div className="mb-8">
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.H3,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Cài đặt chung
              </h3>
              <p style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, margin: 0 }}>
                Tùy chỉnh trải nghiệm sử dụng theo sở thích của bạn
              </p>
            </div>

            {/* Settings Sections */}
            <div className="flex flex-col gap-8">
              {SETTING_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <section key={section.id} id={section.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="flex items-center justify-center rounded-lg"
                        style={{
                          width: 40,
                          height: 40,
                          background: `${section.color}15`,
                        }}
                      >
                        <Icon size={20} color={section.color} />
                      </div>
                      <h4
                        style={{
                          color: c.text1,
                          fontSize: WEB_FONT.SIZE.BODY,
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        {section.title}
                      </h4>
                    </div>

                    <div className="flex flex-col gap-3">
                      {section.settings.map((setting) => (
                        <SettingRow
                          key={setting.id}
                          setting={setting}
                          onToggle={(id) => handleToggle(section.id, id)}
                          onSelect={(id, value) => {
                            if (id === 'language') setLanguage(value);
                            else if (id === 'currency') setCurrency(value);
                            else if (id === 'timezone') setTimezone(value);
                            else if (id === 'theme') setTheme(value as 'light' | 'dark');
                          }}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
