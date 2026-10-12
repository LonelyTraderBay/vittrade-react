import type { useP2PAdDeleteMutation, useP2PAdStatusMutation } from './p2p-my-ads-queries';
import type { P2PAd } from './p2p-types';

type P2PAdStatusMutationGate = Pick<
  ReturnType<typeof useP2PAdStatusMutation>,
  'isPending' | 'mutateAsync'
>;
type P2PAdDeleteMutationGate = Pick<
  ReturnType<typeof useP2PAdDeleteMutation>,
  'isPending' | 'mutateAsync'
>;

export async function runOwnedAdStatusUpdate(
  canWriteAds: boolean,
  ad: P2PAd,
  mutation: P2PAdStatusMutationGate,
  onStart: () => void,
  onFailure: () => void,
): Promise<void> {
  if (!canWriteAds || ad.status === 'expired' || mutation.isPending) return;
  onStart();
  try {
    await mutation.mutateAsync({
      adId: ad.id,
      request: { status: ad.status === 'active' ? 'paused' : 'active' },
      idempotencyKey: `p2p-ad-status-${ad.id}-${crypto.randomUUID()}`,
    });
  } catch {
    onFailure();
  }
}

export async function runOwnedAdDelete(
  canWriteAds: boolean,
  deleteId: string | null,
  mutation: P2PAdDeleteMutationGate,
  onStart: () => void,
  onSuccess: () => void,
  onFailure: () => void,
): Promise<void> {
  if (!canWriteAds || !deleteId || mutation.isPending) return;
  onStart();
  try {
    await mutation.mutateAsync({
      adId: deleteId,
      idempotencyKey: `p2p-ad-delete-${deleteId}-${crypto.randomUUID()}`,
    });
    onSuccess();
  } catch {
    onFailure();
  }
}
