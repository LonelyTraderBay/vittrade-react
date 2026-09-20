/**
 * ══════════════════════════════════════════════════════════
 *  P2PDeviceManagementPage — /p2p/security/devices
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Manage trusted devices for P2P
 *  Device fingerprint, revoke access, trusted devices
 *  Tone: Security-focused, clear, actionable
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Smartphone, Monitor, Tablet, MapPin, Clock, Shield,
  CheckCircle, XCircle, AlertTriangle, Trash2, Info,
  ChevronRight, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Device Types & Data
   ═══════════════════════════════════════════════════════════ */
interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  firstSeen: string;
  isCurrent: boolean;
  isTrusted: boolean;
  fingerprint: string;
}

const MOCK_DEVICES: Device[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    type: 'mobile',
    os: 'iOS 17.3',
    browser: 'Safari',
    location: 'Hà Nội, VN',
    ip: '123.21.45.67',
    lastActive: '2 phút trước',
    firstSeen: '2026-01-15',
    isCurrent: true,
    isTrusted: true,
    fingerprint: 'fp_abc123xyz789',
  },
  {
    id: '2',
    name: 'MacBook Pro',
    type: 'desktop',
    os: 'macOS 14.3',
    browser: 'Chrome 121',
    location: 'TP.HCM, VN',
    ip: '113.161.78.90',
    lastActive: '3 giờ trước',
    firstSeen: '2026-02-10',
    isCurrent: false,
    isTrusted: true,
    fingerprint: 'fp_def456uvw321',
  },
  {
    id: '3',
    name: 'Samsung Galaxy S24',
    type: 'mobile',
    os: 'Android 14',
    browser: 'Chrome Mobile',
    location: 'Đà Nẵng, VN',
    ip: '14.231.56.12',
    lastActive: '1 ngày trước',
    firstSeen: '2026-03-01',
    isCurrent: false,
    isTrusted: false,
    fingerprint: 'fp_ghi789rst456',
  },
  {
    id: '4',
    name: 'iPad Pro',
    type: 'tablet',
    os: 'iPadOS 17.2',
    browser: 'Safari',
    location: 'Hà Nội, VN',
    ip: '123.21.45.70',
    lastActive: '2 ngày trước',
    firstSeen: '2025-12-20',
    isCurrent: false,
    isTrusted: true,
    fingerprint: 'fp_jkl012mno789',
  },
];

/* ═══════════════════════════════════════════════════════════
   Device Card Component
   ═══════════════════════════════════════════════════════════ */
function DeviceCard({
  device,
  onTrust,
  onRevoke,
  onRemove,
}: {
  device: Device;
  onTrust: () => void;
  onRevoke: () => void;
  onRemove: () => void;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [expanded, setExpanded] = useState(false);

  const getDeviceIcon = () => {
    switch (device.type) {
      case 'mobile':
        return Smartphone;
      case 'desktop':
        return Monitor;
      case 'tablet':
        return Tablet;
    }
  };

  const DeviceIcon = getDeviceIcon();

  return (
    <TrCard rounded="md" className="overflow-hidden">
      <button
        onClick={() => {
          hapticSelection();
          setExpanded(!expanded);
        }}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: device.isCurrent
                ? hexToRgba('#10B981', 12)
                : device.isTrusted
                  ? hexToRgba('#3B82F6', 12)
                  : c.surface2,
            }}
          >
            <DeviceIcon
              size={24}
              color={device.isCurrent ? '#10B981' : device.isTrusted ? '#3B82F6' : c.text3}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                {device.name}
              </h3>
              {device.isCurrent && (
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{ background: hexToRgba('#10B981', 15), color: '#10B981' }}
                >
                  Hiện tại
                </span>
              )}
              {device.isTrusted && !device.isCurrent && (
                <Shield size={12} color="#3B82F6" fill={hexToRgba('#3B82F6', 20)} />
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              <p style={{ color: c.text3, fontSize: 11 }}>
                {device.os} • {device.browser}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={10} color={c.text3} />
              <p style={{ color: c.text3, fontSize: 10 }}>
                {device.location}
              </p>
              <span style={{ color: c.text3, fontSize: 10 }}>•</span>
              <Clock size={10} color={c.text3} />
              <p style={{ color: c.text3, fontSize: 10 }}>
                {device.lastActive}
              </p>
            </div>
          </div>

          {!device.isTrusted && !device.isCurrent && (
            <AlertTriangle size={18} color="#F59E0B" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
            style={{ borderColor: c.borderSolid }}
          >
            <div className="p-4">
              {/* Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>IP Address</p>
                  <p style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>
                    {device.ip}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>First Seen</p>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                    {device.firstSeen}
                  </p>
                </div>
                <div className="col-span-2">
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Fingerprint</p>
                  <p style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace', fontWeight: 600 }}>
                    {device.fingerprint}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!device.isCurrent && (
                  <>
                    {!device.isTrusted ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrust();
                        }}
                        className="flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1"
                        style={{ background: hexToRgba('#10B981', 12), color: '#10B981' }}
                      >
                        <Shield size={12} />
                        Đánh dấu tin cậy
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRevoke();
                        }}
                        className="flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1"
                        style={{ background: hexToRgba('#F59E0B', 12), color: '#F59E0B' }}
                      >
                        <XCircle size={12} />
                        Hủy tin cậy
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                      }}
                      className="px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1"
                      style={{ background: hexToRgba('#EF4444', 12), color: '#EF4444' }}
                    >
                      <Trash2 size={12} />
                      Xóa
                    </button>
                  </>
                )}

                {device.isCurrent && (
                  <div
                    className="flex-1 py-2 rounded-lg text-center text-xs"
                    style={{ background: hexToRgba('#10B981', 10), color: '#10B981' }}
                  >
                    <CheckCircle size={12} className="inline mr-1" />
                    Thiết bị hiện tại
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PDeviceManagementPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticError } = useHaptic();
  const prefix = useRoutePrefix();

  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const { isRefreshing, handleRefresh } = useRefresh({
    onRefresh: async () => {
      await new Promise(res => setTimeout(res, 1000));
      hapticSuccess();
    },
  });

  const handleTrust = (deviceId: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === deviceId ? { ...d, isTrusted: true } : d))
    );
    hapticSuccess();
    toast.success('Đã đánh dấu thiết bị tin cậy');
  };

  const handleRevoke = (deviceId: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === deviceId ? { ...d, isTrusted: false } : d))
    );
    hapticSuccess();
    toast.success('Đã hủy tin cậy thiết bị');
  };

  const handleRemove = (deviceId: string) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    setConfirmRemove(null);
    hapticError();
    toast.success('Đã xóa thiết bị');
  };

  const trustedDevices = devices.filter(d => d.isTrusted);
  const untrustedDevices = devices.filter(d => !d.isTrusted);

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header
          title="Quản lý thiết bị"
          subtitle="Bảo mật · P2P"
          back
        />

        {/* Stats Card */}
        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ background: hexToRgba('#3B82F6', 12) }}
                >
                  <Monitor size={20} color="#3B82F6" />
                </div>
                <p style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>
                  {devices.length}
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>Tổng số</p>
              </div>

              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ background: hexToRgba('#10B981', 12) }}
                >
                  <Shield size={20} color="#10B981" />
                </div>
                <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>
                  {trustedDevices.length}
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>Tin cậy</p>
              </div>

              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ background: hexToRgba('#F59E0B', 12) }}
                >
                  <AlertTriangle size={20} color="#F59E0B" />
                </div>
                <p style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700 }}>
                  {untrustedDevices.length}
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>Chưa tin cậy</p>
              </div>
            </div>
          </TrCard>
        </div>

        {/* Info Banner */}
        <div className="px-5 mb-6">
          <div
            className="p-3 rounded-lg flex items-start gap-2"
            style={{ background: hexToRgba('#3B82F6', 10), border: `1px solid ${hexToRgba('#3B82F6', 30)}` }}
          >
            <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                Thiết bị tin cậy
              </p>
              <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
                Đánh dấu thiết bị tin cậy để giảm số lần xác thực 2FA. Chỉ đánh dấu thiết bị cá nhân của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Trusted Devices */}
        {trustedDevices.length > 0 && (
          <div className="px-5 mb-6">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
              Thiết bị tin cậy ({trustedDevices.length})
            </h3>

            <div className="flex flex-col gap-3">
              {trustedDevices.map(device => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onTrust={() => handleTrust(device.id)}
                  onRevoke={() => handleRevoke(device.id)}
                  onRemove={() => setConfirmRemove(device.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Untrusted Devices */}
        {untrustedDevices.length > 0 && (
          <div className="px-5">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
              Thiết bị khác ({untrustedDevices.length})
            </h3>

            <div className="flex flex-col gap-3">
              {untrustedDevices.map(device => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onTrust={() => handleTrust(device.id)}
                  onRevoke={() => handleRevoke(device.id)}
                  onRemove={() => setConfirmRemove(device.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Security Tips */}
        <div className="px-5 mt-6">
          <TrCard rounded="md" className="p-4">
            <div className="flex items-start gap-2 mb-3">
              <Shield size={16} color="#10B981" className="shrink-0 mt-0.5" />
              <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Mẹo bảo mật
              </h4>
            </div>
            <ul style={{ color: c.text2, fontSize: 11, lineHeight: 1.8, paddingLeft: 16 }}>
              <li>Kiểm tra thường xuyên danh sách thiết bị</li>
              <li>Xóa ngay thiết bị không nhận ra</li>
              <li>Không đánh dấu tin cậy thiết bị công cộng</li>
              <li>Đổi mật khẩu nếu phát hiện thiết bị lạ</li>
            </ul>
          </TrCard>
        </div>

        {/* Remove Confirmation */}
        <ConfirmationDialog
          open={!!confirmRemove}
          onClose={() => setConfirmRemove(null)}
          onConfirm={() => {
            if (confirmRemove) handleRemove(confirmRemove);
          }}
          title="Xóa thiết bị?"
          message="Thiết bị này sẽ bị đăng xuất và cần đăng nhập lại. Bạn có chắc chắn?"
          confirmText="Xóa"
          cancelText="Hủy"
          type="danger"
        />
      </PageLayout>
    </PullToRefresh>
  );
}