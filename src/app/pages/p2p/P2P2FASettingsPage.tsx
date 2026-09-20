/**
 * ══════════════════════════════════════════════════════════
 *  P2P2FASettingsPage — /p2p/security/2fa
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: 2FA Settings for P2P transactions
 *  Enable/disable, methods (SMS/Authenticator/Email), threshold
 *  Tone: Security-focused, clear, actionable
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Smartphone, Mail, Key, Shield, CheckCircle, ChevronRight,
  Info, AlertTriangle, Settings, QrCode, Copy, RefreshCw,
  Lock, DollarSign, Clock, X,
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
import { CTAButton } from '../../components/ui/CTAButton';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { useSheetAnalytics } from '../../hooks/useSheetAnalytics';
import { InputField } from '../../components/ui/InputField';
import { toast } from 'sonner';
import { fmtAmount } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════
   2FA Methods Configuration
   ═══════════════════════════════════════════════════════════ */
interface TwoFAMethod {
  id: '2fa_sms' | '2fa_authenticator' | '2fa_email';
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  isPrimary: boolean;
  setupRequired: boolean;
  color: string;
}

const MOCK_2FA_METHODS: TwoFAMethod[] = [
  {
    id: '2fa_sms',
    label: 'SMS OTP',
    description: '+84 *** *** **89',
    icon: Smartphone,
    enabled: true,
    isPrimary: true,
    setupRequired: false,
    color: '#10B981',
  },
  {
    id: '2fa_authenticator',
    label: 'Authenticator App',
    description: 'Google Authenticator, Authy',
    icon: Key,
    enabled: false,
    isPrimary: false,
    setupRequired: true,
    color: '#3B82F6',
  },
  {
    id: '2fa_email',
    label: 'Email OTP',
    description: 'ngu***@gmail.com',
    icon: Mail,
    enabled: true,
    isPrimary: false,
    setupRequired: false,
    color: '#F59E0B',
  },
];

/* ═══════════════════════════════════════════════════════════
   Transaction Threshold Settings
   ═══════════════════════════════════════════════════════════ */
interface ThresholdSetting {
  id: string;
  label: string;
  description: string;
  value: number;
  unit: 'VND' | 'USDT';
  enabled: boolean;
}

const MOCK_THRESHOLDS: ThresholdSetting[] = [
  {
    id: 'release',
    label: 'Release Escrow',
    description: 'Yêu cầu 2FA khi release >= threshold',
    value: 10_000_000,
    unit: 'VND',
    enabled: true,
  },
  {
    id: 'create_order',
    label: 'Create Order',
    description: 'Yêu cầu 2FA khi tạo order >= threshold',
    value: 50_000_000,
    unit: 'VND',
    enabled: false,
  },
  {
    id: 'cancel_order',
    label: 'Cancel Order',
    description: 'Luôn yêu cầu 2FA khi hủy đơn',
    value: 0,
    unit: 'VND',
    enabled: true,
  },
];

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2P2FASettingsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticError } = useHaptic();
  const prefix = useRoutePrefix();

  const [methods, setMethods] = useState<TwoFAMethod[]>(MOCK_2FA_METHODS);
  const [thresholds, setThresholds] = useState<ThresholdSetting[]>(MOCK_THRESHOLDS);
  const [setupSheet, setSetupSheet] = useState<TwoFAMethod | null>(null);
  const [thresholdSheet, setThresholdSheet] = useState<ThresholdSetting | null>(null);
  const [editedValue, setEditedValue] = useState('');

  const { trackSheetOpen, trackSheetClose, trackSheetAction } = useSheetAnalytics('P2P2FASettings');

  const handleToggleMethod = (methodId: string) => {
    const method = methods.find(m => m.id === methodId);
    if (!method) return;

    if (method.setupRequired && !method.enabled) {
      // Show setup sheet
      hapticSelection();
      setSetupSheet(method);
      trackSheetOpen('setup_2fa');
      return;
    }

    // Direct toggle
    setMethods(prev =>
      prev.map(m =>
        m.id === methodId ? { ...m, enabled: !m.enabled } : m
      )
    );
    hapticSuccess();
    toast.success(method.enabled ? '2FA đã tắt' : '2FA đã bật');
  };

  const handleSetPrimary = (methodId: string) => {
    setMethods(prev =>
      prev.map(m => ({
        ...m,
        isPrimary: m.id === methodId,
      }))
    );
    hapticSuccess();
    toast.success('Đã đặt làm phương thức chính');
  };

  const handleEditThreshold = (threshold: ThresholdSetting) => {
    hapticSelection();
    setThresholdSheet(threshold);
    setEditedValue(threshold.value.toString());
    trackSheetOpen('edit_threshold');
  };

  const handleSaveThreshold = () => {
    if (!thresholdSheet) return;

    const newValue = parseFloat(editedValue);
    if (isNaN(newValue) || newValue < 0) {
      hapticError();
      toast.error('Giá trị không hợp lệ');
      return;
    }

    setThresholds(prev =>
      prev.map(t =>
        t.id === thresholdSheet.id ? { ...t, value: newValue } : t
      )
    );

    hapticSuccess();
    toast.success('Đã cập nhật threshold');
    setThresholdSheet(null);
    trackSheetAction('threshold_saved');
  };

  const enabledMethods = methods.filter(m => m.enabled);
  const primaryMethod = methods.find(m => m.isPrimary);

  return (
    <PageLayout>
      <Header
        title="2FA cho P2P"
        subtitle="Bảo mật · P2P"
        back
      />

      {/* Status Card */}
      <div className="px-5 py-4">
        <TrCard
          rounded="lg"
          className="p-4"
          style={{
            background: enabledMethods.length > 0
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : hexToRgba('#F59E0B', 10),
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: enabledMethods.length > 0 ? 'rgba(255,255,255,0.2)' : hexToRgba('#F59E0B', 20),
              }}
            >
              <Shield
                size={24}
                color={enabledMethods.length > 0 ? '#FFFFFF' : '#F59E0B'}
              />
            </div>
            <div className="flex-1">
              <h2
                style={{
                  color: enabledMethods.length > 0 ? '#FFFFFF' : '#F59E0B',
                  fontSize: φ.md,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {enabledMethods.length > 0
                  ? `2FA đã bật (${enabledMethods.length} phương thức)`
                  : '2FA chưa bật'}
              </h2>
              <p
                style={{
                  color: enabledMethods.length > 0 ? 'rgba(255,255,255,0.9)' : c.text2,
                  fontSize: φ.xs,
                  lineHeight: 1.6,
                }}
              >
                {enabledMethods.length > 0
                  ? `Phương thức chính: ${primaryMethod?.label}`
                  : 'Bật 2FA để bảo vệ giao dịch P2P của bạn'}
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      {/* 2FA Methods */}
      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
          Phương thức xác thực
        </h3>

        <TrCard rounded="lg" className="overflow-hidden">
          {methods.map((method, idx) => {
            const MethodIcon = method.icon;
            const isLast = idx === methods.length - 1;

            return (
              <div
                key={method.id}
                className="p-4"
                style={{
                  borderBottom: isLast ? 'none' : `1px solid ${c.borderSolid}`,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: method.enabled ? hexToRgba(method.color, 12) : c.surface2,
                    }}
                  >
                    <MethodIcon
                      size={18}
                      color={method.enabled ? method.color : c.text3}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                        {method.label}
                      </h4>
                      {method.isPrimary && (
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-bold"
                          style={{
                            background: hexToRgba('#10B981', 15),
                            color: '#10B981',
                          }}
                        >
                          Chính
                        </span>
                      )}
                    </div>
                    <p style={{ color: c.text3, fontSize: 11 }}>
                      {method.description}
                    </p>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleMethod(method.id)}
                    className="shrink-0 w-12 h-7 rounded-full relative transition-colors"
                    style={{
                      background: method.enabled ? method.color : c.surface2,
                    }}
                  >
                    <div
                      className="absolute w-5 h-5 rounded-full bg-white top-1 transition-all"
                      style={{
                        left: method.enabled ? 'calc(100% - 24px)' : '4px',
                      }}
                    />
                  </button>
                </div>

                {/* Actions */}
                {method.enabled && !method.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(method.id)}
                    className="w-full py-2 rounded-lg text-xs font-semibold"
                    style={{ background: c.surface2, color: c.text2 }}
                  >
                    Đặt làm phương thức chính
                  </button>
                )}

                {method.setupRequired && !method.enabled && (
                  <div
                    className="p-2 rounded-lg flex items-center gap-2"
                    style={{ background: hexToRgba('#F59E0B', 10) }}
                  >
                    <Info size={12} color="#F59E0B" />
                    <p style={{ color: c.text2, fontSize: 10 }}>
                      Cần setup Authenticator App trước khi sử dụng
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </TrCard>
      </div>

      {/* Transaction Thresholds */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
            Ngưỡng giao dịch
          </h3>
          <Info size={14} color={c.text3} />
        </div>

        <TrCard rounded="lg" className="overflow-hidden">
          {thresholds.map((threshold, idx) => {
            const isLast = idx === thresholds.length - 1;

            return (
              <div
                key={threshold.id}
                className="p-4 flex items-center gap-3"
                style={{
                  borderBottom: isLast ? 'none' : `1px solid ${c.borderSolid}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: threshold.enabled ? hexToRgba('#3B82F6', 12) : c.surface2,
                  }}
                >
                  <Lock size={18} color={threshold.enabled ? '#3B82F6' : c.text3} />
                </div>

                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>
                    {threshold.label}
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>
                    {threshold.description}
                  </p>
                  {threshold.enabled && threshold.value > 0 && (
                    <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700 }}>
                      ≥ {fmtAmount(threshold.value, 0)} {threshold.unit}
                    </p>
                  )}
                </div>

                {threshold.value > 0 && (
                  <button
                    onClick={() => handleEditThreshold(threshold)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: c.surface2, color: c.text2 }}
                  >
                    Sửa
                  </button>
                )}

                {/* Toggle */}
                <button
                  onClick={() => {
                    setThresholds(prev =>
                      prev.map(t =>
                        t.id === threshold.id ? { ...t, enabled: !t.enabled } : t
                      )
                    );
                    hapticSuccess();
                  }}
                  className="shrink-0 w-12 h-7 rounded-full relative transition-colors"
                  style={{
                    background: threshold.enabled ? '#10B981' : c.surface2,
                  }}
                >
                  <div
                    className="absolute w-5 h-5 rounded-full bg-white top-1 transition-all"
                    style={{
                      left: threshold.enabled ? 'calc(100% - 24px)' : '4px',
                    }}
                  />
                </button>
              </div>
            );
          })}
        </TrCard>
      </div>

      {/* Info Notice */}
      <div className="px-5">
        <div
          className="p-3 rounded-lg flex items-start gap-2"
          style={{ background: hexToRgba('#3B82F6', 10), border: `1px solid ${hexToRgba('#3B82F6', 30)}` }}
        >
          <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
              Khuyến nghị bảo mật
            </p>
            <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
              Nên bật ít nhất 2 phương thức 2FA và đặt threshold thấp để đảm bảo an toàn cho tài khoản P2P.
            </p>
          </div>
        </div>
      </div>

      {/* Setup Authenticator Sheet */}
      <BottomSheetV2
        open={!!setupSheet}
        onClose={() => {
          setSetupSheet(null);
          trackSheetClose('setup_2fa');
        }}
        title="Setup Authenticator"
      >
        {setupSheet && (
          <div className="p-5">
            <div className="mb-6 text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: hexToRgba('#3B82F6', 12) }}
              >
                <QrCode size={32} color="#3B82F6" />
              </div>
              <h3 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 8 }}>
                Quét mã QR
              </h3>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                Sử dụng Google Authenticator hoặc Authy để quét mã QR bên dưới
              </p>
            </div>

            {/* Mock QR Code */}
            <div className="mb-6 flex justify-center">
              <div
                className="w-48 h-48 rounded-xl flex items-center justify-center"
                style={{ background: '#FFFFFF', border: `2px solid ${c.borderSolid}` }}
              >
                <QrCode size={180} color={c.text1} />
              </div>
            </div>

            {/* Manual Key */}
            <div className="mb-6">
              <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                Hoặc nhập thủ công:
              </p>
              <div
                className="p-3 rounded-lg flex items-center gap-2"
                style={{ background: c.surface2 }}
              >
                <code style={{ flex: 1, color: c.text1, fontSize: 12, fontFamily: 'monospace' }}>
                  ABCD EFGH IJKL MNOP QRST UVWX YZ12 3456
                </code>
                <button
                  onClick={() => {
                    hapticSuccess();
                    toast.success('Đã copy');
                  }}
                  className="p-2 rounded-lg"
                  style={{ background: c.surface1 }}
                >
                  <Copy size={14} color={c.text2} />
                </button>
              </div>
            </div>

            {/* Verify Code */}
            <InputField
              label="Nhập mã xác thực"
              placeholder="000000"
              type="text"
              maxLength={6}
            />

            <CTAButton
              label="Xác nhận & Kích hoạt"
              onClick={() => {
                setMethods(prev =>
                  prev.map(m =>
                    m.id === setupSheet.id ? { ...m, enabled: true, setupRequired: false } : m
                  )
                );
                hapticSuccess();
                toast.success('Đã kích hoạt Authenticator');
                setSetupSheet(null);
                trackSheetAction('authenticator_activated');
              }}
              icon={CheckCircle}
              className="mt-4"
            />
          </div>
        )}
      </BottomSheetV2>

      {/* Edit Threshold Sheet */}
      <BottomSheetV2
        open={!!thresholdSheet}
        onClose={() => {
          setThresholdSheet(null);
          trackSheetClose('edit_threshold');
        }}
        title="Chỉnh ngưỡng"
      >
        {thresholdSheet && (
          <div className="p-5">
            <div className="mb-6">
              <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>
                {thresholdSheet.label}
              </h3>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                {thresholdSheet.description}
              </p>
            </div>

            <InputField
              label={`Ngưỡng (${thresholdSheet.unit})`}
              placeholder="0"
              type="number"
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
            />

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[5_000_000, 10_000_000, 50_000_000].map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    hapticSelection();
                    setEditedValue(preset.toString());
                  }}
                  className="py-2 rounded-lg text-xs font-semibold"
                  style={{ background: c.surface2, color: c.text2 }}
                >
                  {fmtAmount(preset / 1_000_000, 0)}M
                </button>
              ))}
            </div>

            <CTAButton
              label="Lưu thay đổi"
              onClick={handleSaveThreshold}
              icon={CheckCircle}
            />
          </div>
        )}
      </BottomSheetV2>
    </PageLayout>
  );
}