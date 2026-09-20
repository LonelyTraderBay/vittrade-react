import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import React, { useState } from 'react';
import { TrCard } from '../../components/ui/TrCard';
import { Moon, Sun, Bell, Globe, Shield, Lock, Eye, EyeOff } from 'lucide-react';

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: 48,
        height: 28,
        minWidth: 48,
        flexShrink: 0,
        border: 'none',
        paddingLeft: 3,
        paddingRight: 3,
        paddingTop: 0,
        paddingBottom: 0,
        cursor: 'pointer',
        borderRadius: 999,
        background: value ? '#34C759' : 'rgba(120,120,128,0.32)',
        transition: 'background 0.25s ease',
        boxSizing: 'border-box',
        overflow: 'visible',
      }}
    >
      {/* Thumb — moves via margin-left in auto layout */}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#ffffff',
          flexShrink: 0,
          marginLeft: value ? 20 : 0,
          transition: 'margin-left 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.1)',
        }}
      />
    </button>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const c = useThemeColors();
  const [notifications, setNotifications] = useState({ trade: true, price: true, security: true, p2p: true, arena: true, news: false });
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('vi');
  const [biometric, setBiometric] = useState(false);

  const CURRENCIES = ['USD', 'VND', 'EUR', 'BTC'];
  const LANGUAGES = [{ id: 'vi', label: 'Tiếng Việt' }, { id: 'en', label: 'English' }];

  return (
    <PageLayout>
      <Header title="Cài đặt" subtitle="Cài đặt · Profile" back />

      <PageContent gap="relaxed">
      {/* Appearance */}
      <div>
        <p style={{ color: c.sectionLabelColor, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Giao diện</p>
        <TrCard overflow>
          <div className="flex items-center gap-4 px-4 py-4 transition-colors duration-150 cursor-pointer" style={{ borderBottom: `1px solid ${c.divider}` }}>
            {theme === 'dark' ? <Moon size={20} color="#3B82F6" /> : <Sun size={20} color="#F59E0B" />}
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Chế độ tối</p>
              <p style={{ color: c.text3, fontSize: 12 }}>Giao diện tối giúp tiết kiệm pin</p>
            </div>
            <Toggle value={theme === 'dark'} onChange={v => setTheme(v ? 'dark' : 'light')} label="Chế độ tối" />
          </div>

          <div className="flex items-center gap-4 px-4 py-4 transition-colors duration-150 cursor-pointer">
            <Globe size={20} color="#3B82F6" />
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Đơn vị tiền tệ hiển thị</p>
              <div className="flex gap-2 mt-2">
                {CURRENCIES.map(curr => (
                  <button key={curr} onClick={() => setCurrency(curr)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: currency === curr ? '#3B82F6' : c.surface2, color: currency === curr ? '#fff' : c.text2 }}>
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TrCard>
      </div>

      {/* Language */}
      <div>
        <p style={{ color: c.sectionLabelColor, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Ngôn ngữ</p>
        <TrCard overflow>
          {LANGUAGES.map((lang, i) => (
            <button key={lang.id} onClick={() => setLanguage(lang.id)}
              className="flex items-center justify-between px-4 py-4 w-full transition-colors duration-150"
              style={{
                borderBottomWidth: i < LANGUAGES.length - 1 ? 1 : 0,
                borderBottomStyle: 'solid',
                borderBottomColor: c.divider,
                background: language === lang.id ? 'rgba(59,130,246,0.05)' : 'transparent',
              }}>
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{lang.label}</span>
              {language === lang.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3B82F6' }} />}
            </button>
          ))}
        </TrCard>
      </div>

      {/* Security settings */}
      <div>
        <p style={{ color: c.sectionLabelColor, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Bảo mật giao dịch</p>
        <TrCard overflow>
          <div className="flex items-center gap-4 px-4 py-4 transition-colors duration-150 cursor-pointer" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <Shield size={20} color="#3B82F6" />
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Đăng nhập sinh trắc học</p>
              <p style={{ color: c.text3, fontSize: 12 }}>Face ID / Vân tay</p>
            </div>
            <Toggle value={biometric} onChange={setBiometric} label="Sinh trắc học" />
          </div>
          <div className="flex items-center gap-3 px-5 py-4 active:opacity-70" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Xác nhận lệnh</p>
              <p style={{ color: c.text3, fontSize: 12 }}>Hiện màn hình xác nhận trước khi đặt lệnh</p>
            </div>
            <Toggle value={true} onChange={() => {}} label="Xác nhận lệnh" />
          </div>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Giới hạn rút tiền 24h</p>
              <p style={{ color: c.text3, fontSize: 12 }}>Hiện tại: $100,000/ngày</p>
            </div>
          </div>
        </TrCard>
      </div>

      {/* Notifications */}
      <div>
        <p style={{ color: c.sectionLabelColor, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Thông báo</p>
        <TrCard overflow>
          {[
            { key: 'trade', label: 'Lệnh giao dịch', sub: 'Thông báo khi lệnh khớp' },
            { key: 'price', label: 'Cảnh báo giá', sub: 'Thông báo khi giá đạt ngưỡng' },
            { key: 'security', label: 'Bảo mật', sub: 'Đăng nhập mới, rút tiền' },
            { key: 'p2p', label: 'P2P', sub: 'Đơn hàng P2P mới' },
            { key: 'arena', label: 'Open Arena', sub: 'Challenge, kết quả, lời mời' },
            { key: 'news', label: 'Tin tức & Khuyến mại', sub: 'Cập nhật thị trường' },
          ].map((notif, i, arr) => (
            <div key={notif.key} className="flex items-center gap-4 px-4 py-3.5 transition-colors duration-150 cursor-pointer"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
              <Bell size={18} color="#3B82F6" />
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{notif.label}</p>
                <p style={{ color: c.text3, fontSize: 12 }}>{notif.sub}</p>
              </div>
              <Toggle
                value={notifications[notif.key as keyof typeof notifications]}
                onChange={v => setNotifications(n => ({ ...n, [notif.key]: v }))}
                label={notif.label}
              />
            </div>
          ))}
        </TrCard>
      </div>

      {/* App info */}
      <TrCard className="p-4">
        <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Thông tin ứng dụng</p>
        {[
          { label: 'Phiên bản', value: '2.4.1 (Build 241)' },
          { label: 'Môi trường', value: 'Production' },
          { label: 'Cập nhật lần cuối', value: '21/02/2026' },
        ].map(row => (
          <div key={row.label} className="flex justify-between items-center py-2 px-1 -mx-1 rounded-lg transition-colors duration-150">
            <span style={{ color: c.text2, fontSize: 13 }}>{row.label}</span>
            <span style={{ color: c.text1, fontSize: 13 }}>{row.value}</span>
          </div>
        ))}
      </TrCard>
      </PageContent>
    </PageLayout>
  );
}