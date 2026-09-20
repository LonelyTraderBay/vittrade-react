import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, Lock, Smartphone, Key, Fingerprint, ChevronRight,
  AlertTriangle, CheckCircle, Monitor, Eye, EyeOff, Laptop, Activity, Clock,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { USER_PROFILE } from '../../data/mockData';
import { TrCard } from '../../components/ui/TrCard';

const DEVICES = [
  { id: 'd1', name: 'iPhone 14 Pro', os: 'iOS 17.2', location: 'Hà Nội, Việt Nam', lastSeen: 'Ngay bây giờ', isCurrent: true },
  { id: 'd2', name: 'MacBook Pro', os: 'Chrome 121', location: 'Hà Nội, Việt Nam', lastSeen: '2 giờ trước', isCurrent: false },
  { id: 'd3', name: 'Samsung Galaxy S23', os: 'Android 14', location: 'TP. Hồ Chí Minh, Việt Nam', lastSeen: '5 ngày trước', isCurrent: false },
];

function SecurityItem({ icon: Icon, title, description, status, statusColor, action, danger, c }: any) {
  return (
    <button onClick={action} className="flex items-center gap-4 px-4 py-4 w-full active:opacity-70">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)' }}>
        <Icon size={20} color={danger ? '#EF4444' : '#3B82F6'} />
      </div>
      <div className="flex-1 text-left">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{title}</p>
        <p style={{ color: c.text3, fontSize: 12 }}>{description}</p>
      </div>
      {status && (
        <span className="px-2 py-1 rounded-lg text-xs font-semibold"
          style={{ background: (statusColor ?? '#10B981') + '18', color: statusColor ?? '#10B981' }}>
          {status}
        </span>
      )}
      <ChevronRight size={16} color={c.text3} />
    </button>
  );
}

export function SecurityPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const c = useThemeColors();
  const [has2FA, setHas2FA] = useState(USER_PROFILE.has2FA);
  const [showDevices, setShowDevices] = useState(false);

  const securityScore = [has2FA, true, true, false].filter(Boolean).length;
  const scoreColor = securityScore >= 3 ? '#10B981' : securityScore >= 2 ? '#F59E0B' : '#EF4444';
  const scoreLabel = ['Thấp', 'Thấp', 'Trung bình', 'Cao', 'Rất cao'][securityScore];

  return (
    <PageLayout>
      <Header title="Bảo mật" subtitle="Bảo mật · Profile" back />

      <PageContent>
      <TrCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: c.text2, fontSize: 13 }}>Điểm bảo mật</span>
          <span style={{ color: scoreColor, fontSize: 14, fontWeight: 700 }}>{scoreLabel} ({securityScore}/4)</span>
        </div>
        <div className="flex gap-2 mb-3">
          {[0,1,2,3].map(i => (<div key={i} className="flex-1 h-2 rounded-full" style={{ background: i < securityScore ? scoreColor : c.borderSolid }} />))}
        </div>
        {securityScore < 4 && (
          <div className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: '#F59E0B', fontSize: 12 }}>Bật tất cả tính năng bảo mật để bảo vệ tài sản của bạn tốt nhất.</p>
          </div>
        )}
      </TrCard>

      <TrCard overflow>
        <SecurityItem c={c} icon={Smartphone} title="Xác thực 2 lớp (2FA)" description="Google Authenticator hoặc SMS" status={has2FA ? 'Đang bật' : 'Tắt'} statusColor={has2FA ? '#10B981' : '#EF4444'} action={() => navigate(`${prefix}/auth/2fa-setup`)} />
        <div style={{ borderTop: `1px solid ${c.divider}` }}><SecurityItem c={c} icon={Key} title="Đổi mật khẩu" description="Cập nhật mật khẩu định kỳ" action={() => navigate(`${prefix}/auth/forgot-password`)} /></div>
        <div style={{ borderTop: `1px solid ${c.divider}` }}><SecurityItem c={c} icon={Shield} title="Whitelist địa chỉ rút tiền" description="Chỉ rút đến địa chỉ đã xác minh" status="Chưa cài đặt" statusColor="#F59E0B" action={() => {}} /></div>
        <div style={{ borderTop: `1px solid ${c.divider}` }}><SecurityItem c={c} icon={Laptop} title="Quản lý thiết bị đăng nhập" description={`${DEVICES.length} thiết bị đang hoạt động`} action={() => setShowDevices(!showDevices)} /></div>
        <div style={{ borderTop: `1px solid ${c.divider}` }}><SecurityItem c={c} icon={Activity} title="Nhật ký hoạt động" description="Xem lịch sử đăng nhập & thao tác" action={() => navigate(`${prefix}/profile/activity`)} /></div>
      </TrCard>

      {showDevices && (
        <div>
          <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Thiết bị đăng nhập</p>
          <TrCard overflow>
            {DEVICES.map((device, i) => (
              <div key={device.id} className="px-4 py-3" style={{ borderBottom: i < DEVICES.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Laptop size={20} color={c.text3} className="mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{device.name}</p>
                        {device.isCurrent && <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>Hiện tại</span>}
                      </div>
                      <p style={{ color: c.text3, fontSize: 12 }}>{device.os} • {device.location}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}><Clock size={10} className="inline mr-1" />{device.lastSeen}</p>
                    </div>
                  </div>
                  {!device.isCurrent && <button className="px-2 py-1 rounded-lg text-xs font-semibold shrink-0" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Đăng xuất</button>}
                </div>
              </div>
            ))}
          </TrCard>
          <button className="w-full mt-2 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>Đăng xuất tất cả thiết bị khác</button>
        </div>
      )}

      <TrCard className="p-4">
        <div className="flex items-start gap-2">
          <Shield size={18} color="#3B82F6" />
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Mã chống lừa đảo</p>
        </div>
        <p style={{ color: c.text2, fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>Đặt mã cá nhân. Email từ VitTrade sẽ luôn hiển thị mã này.</p>
        <div className="flex items-center gap-3 rounded-xl px-4 h-12" style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <input type="text" placeholder="Nhập mã 4–8 ký tự" maxLength={8} style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 14, flex: 1 }} />
          <button className="px-3 py-1 rounded-lg text-sm font-semibold" style={{ background: '#3B82F6', color: '#fff' }}>Lưu</button>
        </div>
      </TrCard>
      </PageContent>
    </PageLayout>
  );
}