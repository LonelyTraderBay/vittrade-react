/**
 * ══════════════════════════════════════════════════════════
 *  ArenaBlockedUsersPage — /profile/arena/blocked
 * ══════════════════════════════════════════════════════════
 *  07A: List of blocked users with unblock + view profile.
 *  Clear empty state when no users blocked.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Ban, Shield,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { EmptyState } from '../../components/states/EmptyState';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { SafetyBanner } from '../../components/arena/ArenaGovernance';
import { BlockedUserRow } from '../../components/arena/ArenaModerationCases';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import { ARENA_BLOCKED_USERS, type ArenaBlockedUser } from '../../data/arenaData';

const SOURCE_LABELS: Record<ArenaBlockedUser['source'], string> = {
  manual: 'Tự chặn',
  report_outcome: 'Từ báo cáo',
  system: 'Hệ thống',
};

export function ArenaBlockedUsersPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticWarning } = useHaptic();
  const actionToast = useActionToast();

  const [blockedUsers, setBlockedUsers] = useState(ARENA_BLOCKED_USERS);
  const [unblockTarget, setUnblockTarget] = useState<ArenaBlockedUser | null>(null);

  const handleUnblock = () => {
    if (!unblockTarget) return;
    setBlockedUsers(prev => prev.filter(u => u.id !== unblockTarget.id));
    actionToast.success(TOAST.ARENA.USER_UNBLOCKED);
    setUnblockTarget(null);
  };

  if (blockedUsers.length === 0) {
    return (
      <PageLayout>
        <Header title="Người đã chặn" subtitle="An toàn · Open Arena" back />
        <EmptyState
          icon={Shield}
          title="Chưa chặn ai"
          subtitle="Bạn chưa chặn người dùng nào trong Open Arena. Khi chặn, họ sẽ xuất hiện ở đây."
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Người đã chặn" subtitle="An toàn · Open Arena" back />

      <PageContent>

        {/* Info banner */}
        <SafetyBanner
          variant="info"
          title="Về tính năng chặn"
          description="Người bị chặn sẽ không thể thấy hoặc tương tác với bạn trong Open Arena. Bạn có thể bỏ chặn bất cứ lúc nào."
        />

        {/* Blocked users list */}
        <TrCard overflow>
          {blockedUsers.map((user, i) => (
            <BlockedUserRow
              key={user.id}
              avatar={user.avatar}
              name={user.name}
              reason={user.reason}
              blockedAt={user.blockedAt}
              sourceLabel={SOURCE_LABELS[user.source]}
              onUnblock={() => { setUnblockTarget(user); hapticWarning(); }}
              onViewProfile={() => { navigate(`${prefix}/arena/creator/${user.id}`); hapticSelection(); }}
              isLast={i === blockedUsers.length - 1}
            />
          ))}
        </TrCard>

        {/* Count */}
        <p style={{ color: c.text3, fontSize: φ.xs, textAlign: 'center' }}>
          {blockedUsers.length} người đã bị chặn
        </p>
      </PageContent>

      {/* Unblock confirmation */}
      <ConfirmationDialog
        open={!!unblockTarget}
        onClose={() => setUnblockTarget(null)}
        onConfirm={handleUnblock}
        variant="warning"
        icon={<Ban size={28} color="#F59E0B" />}
        title={`Bỏ chặn ${unblockTarget?.name}?`}
        description="Người này sẽ có thể thấy và tương tác với bạn trong Open Arena. Bạn có thể chặn lại bất cứ lúc nào."
        confirmText="Bỏ chặn"
        cancelText="Giữ chặn"
      />
    </PageLayout>
  );
}