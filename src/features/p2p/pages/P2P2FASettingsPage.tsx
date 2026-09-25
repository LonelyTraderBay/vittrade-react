import { useState } from 'react';
import { Header } from '@/shared/ui/layout/Header';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useP2P2FAMethodMutation,
  useP2P2FAPrimaryMutation,
  useP2P2FASettingsQuery,
  useP2P2FAThresholdMutation,
  useP2PAuthenticatorConfirmMutation,
  useP2PAuthenticatorSetupMutation,
} from '../model/p2p-security-queries';
import type { P2P2FAMethod, P2P2FAThreshold, P2P2FAThresholdId } from '../model/p2p-types';
import { P2P2FASettingsView } from '../components/P2P2FASettingsView';

export function P2P2FASettingsPage() {
  const colors = useThemeColors();
  const toast = useActionToast();
  const { hasPermission } = useAuth();
  const canManageSecurity = hasPermission('p2p:write') || hasPermission('p2p:security:write');
  const { hapticSelection, hapticSuccess, hapticError } = useHaptic();
  const settingsQuery = useP2P2FASettingsQuery();
  const methodMutation = useP2P2FAMethodMutation();
  const primaryMutation = useP2P2FAPrimaryMutation();
  const thresholdMutation = useP2P2FAThresholdMutation();
  const setupMutation = useP2PAuthenticatorSetupMutation();
  const confirmMutation = useP2PAuthenticatorConfirmMutation();
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupCode, setSetupCode] = useState('');
  const [editingThreshold, setEditingThreshold] = useState<P2P2FAThresholdId | null>(null);
  const [editedValue, setEditedValue] = useState('');
  const busy =
    methodMutation.isPending ||
    primaryMutation.isPending ||
    thresholdMutation.isPending ||
    setupMutation.isPending ||
    confirmMutation.isPending;

  if (settingsQuery.isLoading) {
    return (
      <PageLayout>
        <Header title="2FA cho P2P" subtitle="Bảo mật · P2P" back />
        <p className="py-16 text-center" style={{ color: colors.text2 }}>
          Đang tải cài đặt bảo mật…
        </p>
      </PageLayout>
    );
  }

  if (settingsQuery.error || !settingsQuery.data) {
    return (
      <PageLayout>
        <Header title="2FA cho P2P" subtitle="Bảo mật · P2P" back />
        <ErrorState
          title="Không thể tải cài đặt 2FA"
          onAction={() => void settingsQuery.refetch()}
        />
      </PageLayout>
    );
  }

  const { methods, thresholds } = settingsQuery.data;

  const handleToggle = async (method: P2P2FAMethod) => {
    if (!canManageSecurity) return;
    if (method.setupRequired && !method.enabled) {
      hapticSelection();
      try {
        await setupMutation.mutateAsync();
        setSetupOpen(true);
      } catch {
        toast.error('Không thể tạo phiên setup Authenticator.');
      }
      return;
    }
    try {
      await methodMutation.mutateAsync({
        methodId: method.id,
        enabled: !method.enabled,
        idempotencyKey: crypto.randomUUID(),
      });
      hapticSuccess();
      toast.success(method.enabled ? 'Đã tắt phương thức 2FA.' : 'Đã bật phương thức 2FA.');
    } catch {
      hapticError();
      toast.error('Không thể cập nhật phương thức 2FA.');
    }
  };

  const handlePrimary = async (method: P2P2FAMethod) => {
    if (!canManageSecurity) return;
    try {
      await primaryMutation.mutateAsync({
        methodId: method.id,
        idempotencyKey: crypto.randomUUID(),
      });
      hapticSuccess();
      toast.success('Đã đặt phương thức chính.');
    } catch {
      toast.error('Không thể đặt phương thức chính.');
    }
  };

  const handleSaveThreshold = async () => {
    if (!canManageSecurity || !editingThreshold) return;
    const value = Number(editedValue);
    if (!Number.isFinite(value) || value < 0) {
      toast.error('Giá trị threshold không hợp lệ.');
      return;
    }
    try {
      await thresholdMutation.mutateAsync({
        thresholdId: editingThreshold,
        request: { value },
        idempotencyKey: crypto.randomUUID(),
      });
      setEditingThreshold(null);
      toast.success('Đã cập nhật threshold.');
    } catch {
      toast.error('Không thể cập nhật threshold.');
    }
  };

  const handleToggleThreshold = async (thresholdId: P2P2FAThresholdId, enabled: boolean) => {
    if (!canManageSecurity) return;
    try {
      await thresholdMutation.mutateAsync({
        thresholdId,
        request: { enabled },
        idempotencyKey: crypto.randomUUID(),
      });
      hapticSuccess();
    } catch {
      toast.error('Không thể cập nhật chính sách threshold.');
    }
  };

  const handleConfirmSetup = async () => {
    if (!canManageSecurity) return;
    if (!/^\d{6}$/.test(setupCode)) {
      toast.error('Nhập mã Authenticator gồm 6 chữ số.');
      return;
    }
    try {
      await confirmMutation.mutateAsync({ code: setupCode, idempotencyKey: crypto.randomUUID() });
      setSetupOpen(false);
      setSetupCode('');
      toast.success('Đã bật Authenticator App.');
    } catch {
      toast.error('Mã Authenticator không hợp lệ hoặc đã hết hạn.');
    }
  };

  const handleEditThreshold = (threshold: P2P2FAThreshold) => {
    if (!canManageSecurity) return;
    setEditingThreshold(threshold.id);
    setEditedValue(String(threshold.value));
  };

  return (
    <PageLayout>
      <Header title="2FA cho P2P" subtitle="Bảo mật · P2P" back />
      <P2P2FASettingsView
        colors={colors}
        methods={methods}
        thresholds={thresholds}
        canManageSecurity={canManageSecurity}
        busy={busy}
        setupOpen={setupOpen}
        setupData={setupMutation.data}
        setupCode={setupCode}
        editingThreshold={editingThreshold}
        editedValue={editedValue}
        onToggleMethod={(method) => void handleToggle(method)}
        onSetPrimary={(method) => void handlePrimary(method)}
        onToggleThreshold={(thresholdId, enabled) =>
          void handleToggleThreshold(thresholdId, enabled)
        }
        onEditThreshold={handleEditThreshold}
        onSetupClose={() => setSetupOpen(false)}
        onSetupCodeChange={setSetupCode}
        onConfirmSetup={() => void handleConfirmSetup()}
        onThresholdClose={() => setEditingThreshold(null)}
        onEditedValueChange={setEditedValue}
        onSaveThreshold={() => void handleSaveThreshold()}
      />
    </PageLayout>
  );
}
