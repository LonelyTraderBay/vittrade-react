import { Info, KeyRound, Lock, Mail, Shield, Smartphone } from 'lucide-react';
import { BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { CTAButton } from '@/shared/ui/CTAButton';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtAmount } from '@/shared/lib/formatNumber';
import type { ThemeColors } from '@/shared/hooks/useThemeColors';
import type {
  P2P2FAMethod,
  P2P2FAThreshold,
  P2P2FAThresholdId,
  P2PAuthenticatorSetupChallenge,
} from '../model/p2p-types';

const methodIcons = {
  '2fa_sms': Smartphone,
  '2fa_authenticator': KeyRound,
  '2fa_email': Mail,
} as const;

interface P2P2FASettingsViewProps {
  colors: ThemeColors;
  methods: P2P2FAMethod[];
  thresholds: P2P2FAThreshold[];
  canManageSecurity: boolean;
  busy: boolean;
  setupOpen: boolean;
  setupData?: P2PAuthenticatorSetupChallenge;
  setupCode: string;
  editingThreshold: P2P2FAThresholdId | null;
  editedValue: string;
  onToggleMethod: (method: P2P2FAMethod) => void;
  onSetPrimary: (method: P2P2FAMethod) => void;
  onToggleThreshold: (thresholdId: P2P2FAThresholdId, enabled: boolean) => void;
  onEditThreshold: (threshold: P2P2FAThreshold) => void;
  onSetupClose: () => void;
  onSetupCodeChange: (value: string) => void;
  onConfirmSetup: () => void;
  onThresholdClose: () => void;
  onEditedValueChange: (value: string) => void;
  onSaveThreshold: () => void;
}

export function P2P2FASettingsView({
  colors,
  methods,
  thresholds,
  canManageSecurity,
  busy,
  setupOpen,
  setupData,
  setupCode,
  editingThreshold,
  editedValue,
  onToggleMethod,
  onSetPrimary,
  onToggleThreshold,
  onEditThreshold,
  onSetupClose,
  onSetupCodeChange,
  onConfirmSetup,
  onThresholdClose,
  onEditedValueChange,
  onSaveThreshold,
}: P2P2FASettingsViewProps) {
  const enabledMethods = methods.filter((method) => method.enabled);
  const primaryMethod = methods.find((method) => method.isPrimary);

  return (
    <>
      <PageContent gap="default">
        <TrCard
          className="p-4"
          style={{ background: enabledMethods.length ? colors.buyAlpha15 : colors.warnAlpha10 }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: enabledMethods.length ? colors.buyAlpha20 : colors.warnAlpha15 }}
            >
              <Shield size={24} color={enabledMethods.length ? colors.success : colors.warn} />
            </div>
            <div>
              <h2
                style={{
                  color: enabledMethods.length ? colors.success : colors.warn,
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                {enabledMethods.length
                  ? `2FA đã bật (${enabledMethods.length} phương thức)`
                  : '2FA chưa bật'}
              </h2>
              <p style={{ color: colors.text2, fontSize: 12, marginTop: 4 }}>
                {enabledMethods.length
                  ? `Phương thức chính: ${primaryMethod?.label ?? 'Chưa chọn'}`
                  : 'Bật 2FA để bảo vệ giao dịch P2P.'}
              </p>
            </div>
          </div>
        </TrCard>

        {!canManageSecurity && (
          <p role="alert" style={{ color: colors.warning, fontSize: 12 }}>
            P2P security write permission is required to change 2FA settings.
          </p>
        )}

        <section>
          <h3 style={{ color: colors.text1, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
            Phương thức xác thực
          </h3>
          <TrCard className="overflow-hidden">
            {methods.map((method, index) => {
              const Icon = methodIcons[method.id];
              return (
                <div
                  key={method.id}
                  className="p-4"
                  style={{
                    borderBottom:
                      index === methods.length - 1 ? 'none' : `1px solid ${colors.borderSolid}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: method.enabled ? `${method.color}1F` : colors.surface2 }}
                    >
                      <Icon size={18} color={method.enabled ? method.color : colors.text3} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                          {method.label}
                        </h4>
                        {method.isPrimary && (
                          <span
                            className="rounded-md px-2 py-0.5 text-xs font-bold"
                            style={{ background: colors.buyAlpha15, color: colors.success }}
                          >
                            Chính
                          </span>
                        )}
                      </div>
                      <p style={{ color: colors.text3, fontSize: 11, marginTop: 3 }}>
                        {method.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Bật hoặc tắt ${method.label}`}
                      onClick={() => onToggleMethod(method)}
                      disabled={!canManageSecurity || busy}
                      className="relative h-7 w-12 shrink-0 rounded-full"
                      style={{ background: method.enabled ? method.color : colors.surface2 }}
                    >
                      <span
                        className="absolute top-1 h-5 w-5 rounded-full bg-white"
                        style={{ left: method.enabled ? 'calc(100% - 24px)' : 4 }}
                      />
                    </button>
                  </div>
                  {method.enabled && !method.isPrimary && (
                    <button
                      type="button"
                      onClick={() => onSetPrimary(method)}
                      aria-label={`Set primary 2FA method: ${method.label}`}
                      disabled={!canManageSecurity || busy}
                      className="mt-3 w-full rounded-lg py-2 text-xs font-semibold"
                      style={{ background: colors.surface2, color: colors.text2 }}
                    >
                      Đặt làm phương thức chính
                    </button>
                  )}
                  {method.setupRequired && !method.enabled && (
                    <p
                      className="mt-3 flex items-center gap-2 text-xs"
                      style={{ color: colors.warn }}
                    >
                      <Info size={12} /> Cần setup trước khi sử dụng.
                    </p>
                  )}
                </div>
              );
            })}
          </TrCard>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>Ngưỡng giao dịch</h3>
            <Info size={14} color={colors.text3} />
          </div>
          <TrCard className="overflow-hidden">
            {thresholds.map((threshold, index) => (
              <div
                key={threshold.id}
                className="flex items-center gap-3 p-4"
                style={{
                  borderBottom:
                    index === thresholds.length - 1 ? 'none' : `1px solid ${colors.borderSolid}`,
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: threshold.enabled ? colors.primaryAlpha12 : colors.surface2,
                  }}
                >
                  <Lock size={18} color={threshold.enabled ? colors.primary : colors.text3} />
                </div>
                <div className="min-w-0 flex-1">
                  <p style={{ color: colors.text1, fontSize: 14, fontWeight: 600 }}>
                    {threshold.label}
                  </p>
                  <p style={{ color: colors.text3, fontSize: 10, marginTop: 3 }}>
                    {threshold.description}
                  </p>
                  {threshold.enabled && threshold.value > 0 && (
                    <p
                      style={{ color: colors.primary, fontSize: 11, fontWeight: 700, marginTop: 4 }}
                    >
                      ≥ {fmtAmount(threshold.value, 0)} {threshold.unit}
                    </p>
                  )}
                </div>
                {threshold.value > 0 && (
                  <button
                    type="button"
                    onClick={() => onEditThreshold(threshold)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ background: colors.surface2, color: colors.text2 }}
                  >
                    Sửa
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Bật hoặc tắt ${threshold.label}`}
                  onClick={() => onToggleThreshold(threshold.id, !threshold.enabled)}
                  disabled={!canManageSecurity || busy}
                  className="relative h-7 w-12 shrink-0 rounded-full"
                  style={{ background: threshold.enabled ? colors.success : colors.surface2 }}
                >
                  <span
                    className="absolute top-1 h-5 w-5 rounded-full bg-white"
                    style={{ left: threshold.enabled ? 'calc(100% - 24px)' : 4 }}
                  />
                </button>
              </div>
            ))}
          </TrCard>
        </section>

        <div
          className="flex items-start gap-2 rounded-xl p-3"
          style={{ background: colors.primaryAlpha12 }}
        >
          <Info size={14} color={colors.primary} className="mt-0.5 shrink-0" />
          <p style={{ color: colors.text2, fontSize: 11, lineHeight: 1.5 }}>
            Nên bật ít nhất hai phương thức 2FA và đặt threshold phù hợp với hạn mức tài khoản.
          </p>
        </div>
      </PageContent>

      <BottomSheetV2
        open={Boolean(setupOpen && setupData)}
        onClose={onSetupClose}
        title="Setup Authenticator"
      >
        {setupData && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex justify-center">
              <img
                src={setupData.qrCodeUrl}
                alt="QR setup Authenticator"
                className="h-40 w-40 rounded-xl bg-white p-2"
              />
            </div>
            <p className="text-center text-xs" style={{ color: colors.text2 }}>
              Quét mã QR bằng ứng dụng Authenticator rồi nhập mã xác nhận.
            </p>
            <input
              value={setupCode}
              onChange={(event) =>
                onSetupCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              maxLength={6}
              inputMode="numeric"
              aria-label="Mã Authenticator"
              placeholder="••••••"
              className="h-14 rounded-xl px-4 text-center"
              style={{
                background: colors.surface2,
                border: `1px solid ${colors.borderSolid}`,
                color: colors.text1,
                fontFamily: 'monospace',
                fontSize: 22,
                letterSpacing: 8,
              }}
            />
            <CTAButton
              onClick={onConfirmSetup}
              disabled={!canManageSecurity || setupCode.length !== 6 || busy}
              loading={busy}
            >
              Xác nhận setup
            </CTAButton>
          </div>
        )}
      </BottomSheetV2>

      <BottomSheetV2
        open={Boolean(editingThreshold)}
        onClose={onThresholdClose}
        title="Chỉnh threshold"
      >
        <div className="flex flex-col gap-4 p-4">
          <input
            type="number"
            min={0}
            value={editedValue}
            onChange={(event) => onEditedValueChange(event.target.value)}
            aria-label="Giá trị threshold"
            className="h-14 rounded-xl px-4"
            style={{
              background: colors.surface2,
              border: `1px solid ${colors.borderSolid}`,
              color: colors.text1,
            }}
          />
          <CTAButton onClick={onSaveThreshold} disabled={!canManageSecurity || busy} loading={busy}>
            Lưu thay đổi
          </CTAButton>
        </div>
      </BottomSheetV2>
    </>
  );
}
