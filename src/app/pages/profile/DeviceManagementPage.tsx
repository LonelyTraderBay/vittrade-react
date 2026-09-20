import React, { useState } from 'react';
import { Shield, ShieldOff, Monitor, Smartphone, Tablet, MapPin, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TRUSTED_DEVICES } from '../../data/mockData';
import { TrCard } from '../../components/ui/TrCard';

const DEVICE_ICONS: Record<string, any> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

export function DeviceManagementPage() {
  const c = useThemeColors();
  const [devices, setDevices] = useState(TRUSTED_DEVICES);
  const [revokedId, setRevokedId] = useState<string | null>(null);

  const handleRevoke = (id: string) => {
    setRevokedId(id);
    setTimeout(() => {
      setDevices(prev => prev.filter(d => d.id !== id));
      setRevokedId(null);
    }, 800);
  };

  const handleToggleTrust = (id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, isTrusted: !d.isTrusted } : d));
  };

  const currentDevice = devices.find(d => d.isCurrent);
  const otherDevices = devices.filter(d => !d.isCurrent);

  return (
    <PageLayout>
      <Header title="Quản lý thiết bị" subtitle="Bảo mật · Profile" back />

      <PageContent gap="relaxed">
        {/* Security summary */}
        <div className="rounded-2xl p-4"
          style={{ background: c.portfolioBg, border: `1px solid ${c.portfolioBorder}`, boxShadow: c.portfolioShadow }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.15)' }}>
              <Shield size={22} color={c.primary} />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>Bảo mật thiết bị</p>
              <p style={{ color: c.text2, fontSize: 12 }}>{devices.length} thiết bị đã đăng nhập</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl p-2.5" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Tin cậy</p>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>{devices.filter(d => d.isTrusted).length}</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Không tin cậy</p>
              <p style={{ color: '#F59E0B', fontSize: 16, fontWeight: 700 }}>{devices.filter(d => !d.isTrusted).length}</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Đang hoạt động</p>
              <p style={{ color: c.primary, fontSize: 16, fontWeight: 700 }}>1</p>
            </div>
          </div>
        </div>

        {/* Current device */}
        {currentDevice && (
          <div>
            <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>THIẾT BỊ HIỆN TẠI</p>
            <DeviceCard device={currentDevice} c={c} onRevoke={() => {}} onToggleTrust={() => {}} isRevoking={false} showActions={false} />
          </div>
        )}

        {/* Other devices */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>CÁC THIẾT BỊ KHÁC ({otherDevices.length})</p>
            {otherDevices.length > 0 && (
              <button onClick={() => otherDevices.forEach(d => handleRevoke(d.id))}
                style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>
                Đăng xuất tất cả
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {otherDevices.map(device => (
              <DeviceCard key={device.id} device={device} c={c}
                onRevoke={() => handleRevoke(device.id)}
                onToggleTrust={() => handleToggleTrust(device.id)}
                isRevoking={revokedId === device.id}
                showActions={true} />
            ))}
          </div>
        </div>

        {/* Security tips */}
        <TrCard className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.15)' }}>
              <Shield size={22} color={c.primary} />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>Bảo mật thiết bị</p>
              <p style={{ color: c.text2, fontSize: 12 }}>{devices.length} thiết bị đã đăng nhập</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl p-2.5" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Tin cậy</p>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>{devices.filter(d => d.isTrusted).length}</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Không tin cậy</p>
              <p style={{ color: '#F59E0B', fontSize: 16, fontWeight: 700 }}>{devices.filter(d => !d.isTrusted).length}</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Đang hoạt động</p>
              <p style={{ color: c.primary, fontSize: 16, fontWeight: 700 }}>1</p>
            </div>
          </div>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

function DeviceCard({ device, c, onRevoke, onToggleTrust, isRevoking, showActions }: any) {
  const DevIcon = DEVICE_ICONS[device.type as keyof typeof DEVICE_ICONS] || Monitor;
  const isSuspicious = !device.isTrusted && !device.isCurrent;

  return (
    <TrCard className="p-4 transition-all"
      accentBorder={isSuspicious ? 'rgba(245,158,11,0.3)' : undefined}
      style={{ opacity: isRevoking ? 0.4 : 1 }}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isSuspicious ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)' }}>
          <DevIcon size={20} color={isSuspicious ? '#F59E0B' : c.primary} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{device.name}</p>
            {device.isCurrent && (
              <span className="px-2 py-0.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                Hiện tại
              </span>
            )}
            {isSuspicious && (
              <AlertTriangle size={14} color="#F59E0B" />
            )}
          </div>
          <p style={{ color: c.text2, fontSize: 12 }}>{device.browser} • {device.os}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <MapPin size={11} color={c.text3} />
              <span style={{ color: c.text3, fontSize: 11 }}>{device.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={11} color={c.text3} />
              <span style={{ color: c.text3, fontSize: 11 }}>{device.lastActive}</span>
            </div>
          </div>
          <p style={{ color: c.text3, fontSize: 11, marginTop: 2 }}>IP: {device.ip}</p>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
          <button onClick={onToggleTrust}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl"
            style={{ background: device.isTrusted ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>
            {device.isTrusted ? <Shield size={14} color="#10B981" /> : <ShieldOff size={14} color="#F59E0B" />}
            <span style={{ color: device.isTrusted ? '#10B981' : '#F59E0B', fontSize: 12, fontWeight: 600 }}>
              {device.isTrusted ? 'Tin cậy' : 'Đánh dấu tin cậy'}
            </span>
          </button>
          <button onClick={onRevoke}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)' }}>
            <Trash2 size={14} color="#EF4444" />
            <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>Đăng xuất</span>
          </button>
        </div>
      )}
    </TrCard>
  );
}