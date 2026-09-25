import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Lock,
  Plus,
  Search,
  Shield,
  Star,
  StarOff,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { ConfirmationDialog } from '@/shared/ui/ConfirmationDialog';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { TOAST } from '@/shared/constants/toastMessages';
import {
  useWalletAddressBookDeleteMutation,
  useWalletAddressBookQuery,
  useWalletAddressBookSettingsMutation,
  useWalletAddressBookUpdateMutation,
} from '../model/wallet-queries';
import type { WalletAddressBookItem } from '../model/wallet-types';

const NETWORKS = ['Tất cả', 'BTC', 'ETH (ERC20)', 'BSC (BEP20)', 'SOL', 'TRC20', 'Polygon'];
const EMPTY_ENTRIES: WalletAddressBookItem[] = [];

function idempotencyKey() {
  return `address-book-${crypto.randomUUID()}`;
}

export function AddressBookPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const toast = useActionToast();
  const { hasPermission } = useAuth();
  const canManageAddressBook =
    hasPermission('wallet:write') || hasPermission('wallet:address-book');
  const addressBookQuery = useWalletAddressBookQuery();
  const updateMutation = useWalletAddressBookUpdateMutation();
  const deleteMutation = useWalletAddressBookDeleteMutation();
  const settingsMutation = useWalletAddressBookSettingsMutation();
  const [network, setNetwork] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WalletAddressBookItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const entries = addressBookQuery.data?.items ?? EMPTY_ENTRIES;
  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        const matchesNetwork = network === 'Tất cả' || entry.network === network;
        const searchValue = search.trim().toLowerCase();
        const matchesSearch =
          !searchValue ||
          entry.label.toLowerCase().includes(searchValue) ||
          entry.address.toLowerCase().includes(searchValue);
        return matchesNetwork && matchesSearch;
      }),
    [entries, network, search],
  );

  const favorites = filtered.filter((entry) => entry.isFavorite);
  const others = filtered.filter((entry) => !entry.isFavorite);

  const handleCopy = async (entry: WalletAddressBookItem) => {
    try {
      await navigator.clipboard.writeText(entry.address);
      setCopiedId(entry.id);
      toast.success(TOAST.COPY.ADDRESS);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Không thể sao chép địa chỉ.');
    }
  };

  const handleFavorite = (entry: WalletAddressBookItem) => {
    if (!canManageAddressBook) return;
    void updateMutation
      .mutateAsync({
        id: entry.id,
        request: { isFavorite: !entry.isFavorite },
        idempotencyKey: idempotencyKey(),
      })
      .then(() => toast.success(entry.isFavorite ? 'Đã bỏ yêu thích.' : 'Đã thêm yêu thích.'))
      .catch(() => toast.error('Không thể cập nhật địa chỉ.'));
  };

  const handleDelete = () => {
    if (!canManageAddressBook || !deleteTarget) return;
    void deleteMutation
      .mutateAsync({ id: deleteTarget.id, idempotencyKey: idempotencyKey() })
      .then(() => {
        toast.warning(TOAST.WALLET.ADDRESS_DELETED);
        setDeleteTarget(null);
      })
      .catch(() => toast.error('Không thể xóa địa chỉ.'));
  };

  const handleWhitelistToggle = () => {
    if (!canManageAddressBook) return;
    const enabled = !(addressBookQuery.data?.whitelistEnabled ?? false);
    void settingsMutation
      .mutateAsync({ whitelistEnabled: enabled, idempotencyKey: idempotencyKey() })
      .then(() => toast.info(enabled ? 'Whitelist đã bật.' : 'Whitelist đã tắt.'))
      .catch(() => toast.error('Không thể cập nhật chế độ whitelist.'));
  };

  if (addressBookQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Sổ địa chỉ" subtitle="Wallet" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải sổ địa chỉ…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (addressBookQuery.isError) {
    return (
      <PageLayout>
        <Header title="Sổ địa chỉ" subtitle="Wallet" back />
        <ErrorState onAction={() => void addressBookQuery.refetch()} />
      </PageLayout>
    );
  }

  const whitelistEnabled = addressBookQuery.data.whitelistEnabled;

  const renderEntry = (entry: WalletAddressBookItem) => (
    <TrCard key={entry.id} className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: colors.surface2, border: `1px solid ${colors.borderSolid}` }}
        >
          <Shield size={18} color={entry.isWhitelisted ? '#10B981' : colors.text3} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
              {entry.label}
            </span>
            {entry.isWhitelisted && (
              <span className="text-xs font-bold" style={{ color: '#10B981' }}>
                ✓ Whitelist
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ background: colors.chipBg, color: colors.chipText }}
            >
              {entry.network}
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ background: colors.chipBg, color: colors.chipText }}
            >
              {entry.asset}
            </span>
          </div>
          <p
            className="truncate"
            style={{ color: colors.text3, fontSize: 11, fontFamily: 'monospace' }}
          >
            {entry.address}
          </p>
          {entry.lastUsed && (
            <p style={{ color: colors.text3, fontSize: 10, marginTop: 2 }}>
              Dùng gần nhất: {new Date(entry.lastUsed).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => void handleCopy(entry)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}
        >
          {copiedId === entry.id ? <CheckCircle size={13} /> : <Copy size={13} />}
          {copiedId === entry.id ? 'Đã copy' : 'Sao chép'}
        </button>
        <button
          onClick={() => handleFavorite(entry)}
          disabled={!canManageAddressBook || updateMutation.isPending}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{
            background: entry.isFavorite ? 'rgba(245,158,11,0.1)' : colors.surface2,
            border: `1px solid ${colors.borderSolid}`,
          }}
        >
          {entry.isFavorite ? (
            <Star size={15} color="#F59E0B" fill="#F59E0B" />
          ) : (
            <StarOff size={15} color={colors.text3} />
          )}
        </button>
        <button
          disabled={!canManageAddressBook}
          onClick={() => setDeleteTarget(entry)}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <Trash2 size={14} color="#EF4444" />
        </button>
      </div>
    </TrCard>
  );

  return (
    <PageLayout>
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        icon={<Trash2 size={24} color="#EF4444" />}
        title="Xóa địa chỉ"
        description={
          deleteTarget ? (
            <>
              Bạn có chắc muốn xóa địa chỉ <strong>{deleteTarget.label}</strong>?
            </>
          ) : (
            ''
          )
        }
        confirmText="Xóa"
      />
      <Header
        title="Sổ địa chỉ"
        subtitle="Quản lý · Wallet"
        back
        right={
          <button
            disabled={!canManageAddressBook}
            onClick={() => navigate(`${prefix}/wallet/address-book/add`)}
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(59,130,246,0.15)' }}
          >
            <Plus size={20} color="#3B82F6" />
          </button>
        }
      />
      <PageContent gap="default">
        {!canManageAddressBook && (
          <p role="alert" style={{ color: colors.error, fontSize: 12 }}>
            Wallet address-book permission is required to manage withdrawal addresses.
          </p>
        )}
        <div
          className="flex items-center gap-3 rounded-2xl px-4"
          style={{
            background: colors.searchBg,
            border: `1.5px solid ${colors.searchBorder}`,
            height: 52,
          }}
        >
          <Search size={18} color={colors.text3} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm địa chỉ hoặc tên…"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: colors.text1,
              fontSize: 14,
              flex: 1,
            }}
          />
        </div>
        <TrCard className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: whitelistEnabled ? 'rgba(16,185,129,0.15)' : colors.surface2 }}
            >
              <Lock size={18} color={whitelistEnabled ? '#10B981' : colors.text3} />
            </div>
            <div className="flex-1">
              <strong style={{ color: colors.text1, fontSize: 14 }}>Chế độ Whitelist</strong>
              <p style={{ color: colors.text3, fontSize: 11 }}>
                {whitelistEnabled
                  ? 'Chỉ rút tới địa chỉ whitelist'
                  : 'Cho phép rút tới mọi địa chỉ'}
              </p>
            </div>
            <button
              onClick={handleWhitelistToggle}
              disabled={!canManageAddressBook || settingsMutation.isPending}
              className="w-12 h-7 rounded-full relative"
              style={{
                background: whitelistEnabled ? '#10B981' : colors.surface2,
                border: `1.5px solid ${whitelistEnabled ? '#10B981' : colors.borderSolid}`,
              }}
            >
              <div
                className="w-5 h-5 rounded-full absolute top-0.5"
                style={{ left: whitelistEnabled ? 22 : 2, background: '#fff' }}
              />
            </button>
          </div>
          {whitelistEnabled && (
            <div
              className="flex items-start gap-2 mt-3 rounded-xl px-3 py-2"
              style={{ background: 'rgba(245,158,11,0.08)' }}
            >
              <AlertTriangle size={12} color="#F59E0B" />
              <p style={{ color: '#D97706', fontSize: 10 }}>
                Địa chỉ mới trong whitelist có thể cần thời gian chờ trước khi rút.
              </p>
            </div>
          )}
        </TrCard>
        <div className="flex gap-2 -mx-5 px-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NETWORKS.map((item) => (
            <button
              key={item}
              onClick={() => setNetwork(item)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0"
              style={{
                background: network === item ? colors.chipActiveBg : colors.chipBg,
                color: network === item ? colors.chipActiveText : colors.chipText,
                border: `1px solid ${network === item ? colors.chipActiveBorder : colors.chipBorder}`,
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Tổng địa chỉ', value: entries.length, color: '#3B82F6' },
            {
              label: 'Yêu thích',
              value: entries.filter((item) => item.isFavorite).length,
              color: '#F59E0B',
            },
            {
              label: 'Whitelist',
              value: entries.filter((item) => item.isWhitelisted).length,
              color: '#10B981',
            },
          ].map((stat) => (
            <TrCard key={stat.label} className="p-3 text-center">
              <p style={{ color: stat.color, fontSize: 20, fontWeight: 700 }}>{stat.value}</p>
              <p style={{ color: colors.text3, fontSize: 10 }}>{stat.label}</p>
            </TrCard>
          ))}
        </div>
        {favorites.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <span style={{ color: colors.text2, fontSize: 13 }}>Yêu thích</span>
            </div>
            <div className="flex flex-col gap-2">{favorites.map(renderEntry)}</div>
          </section>
        )}
        {others.length > 0 && (
          <section>
            <p className="mb-2" style={{ color: colors.text2, fontSize: 13 }}>
              Tất cả địa chỉ
            </p>
            <div className="flex flex-col gap-2">{others.map(renderEntry)}</div>
          </section>
        )}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Shield size={32} color={colors.text3} />
            <p style={{ color: colors.text3, fontSize: 14 }}>Không tìm thấy địa chỉ</p>
            <button
              disabled={!canManageAddressBook}
              onClick={() => navigate(`${prefix}/wallet/address-book/add`)}
              className="px-5 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: '#3B82F6', color: '#fff' }}
            >
              <Plus size={16} /> Thêm địa chỉ mới
            </button>
          </div>
        )}
        <div
          className="flex items-start gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(59,130,246,0.06)' }}
        >
          <Shield size={14} color="#3B82F6" />
          <p style={{ color: colors.text2, fontSize: 12 }}>
            Địa chỉ whitelist được bảo vệ bởi 2FA và dùng làm nguồn kiểm soát rút tiền.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
