import React, { useState } from 'react';
import {
  Shield, Star, StarOff, Edit3, Trash2, Plus, Copy,
  CheckCircle, Search, Lock, Info, AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  network: string;
  asset: string;
  isFavorite: boolean;
  createdAt: string;
  lastUsed?: string;
  isWhitelisted: boolean;
}

const NETWORKS = ['Tất cả', 'BTC', 'ETH (ERC20)', 'BSC (BEP20)', 'SOL', 'TRC20', 'Polygon'];
const ASSETS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'MATIC'];

const MOCK_ADDRESSES: SavedAddress[] = [
  { id: 'addr1', label: 'Ví lạnh cá nhân', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', network: 'BTC', asset: 'BTC', isFavorite: true, createdAt: '15/01/2026', lastUsed: '20/02/2026', isWhitelisted: true },
  { id: 'addr2', label: 'Binance Exchange', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f6C29f', network: 'ETH (ERC20)', asset: 'ETH', isFavorite: true, createdAt: '10/01/2026', lastUsed: '18/02/2026', isWhitelisted: true },
  { id: 'addr3', label: 'Ví USDT BSC', address: '0x8Ba1f109551bD432803012645Ac136ddd64DBa72', network: 'BSC (BEP20)', asset: 'USDT', isFavorite: false, createdAt: '20/01/2026', lastUsed: '15/02/2026', isWhitelisted: false },
  { id: 'addr4', label: 'Phantom Wallet', address: 'BkJMJfHtjL8o69n2vxqHE6MbEv4ZR3zqRPnLVe2bFpYo', network: 'SOL', asset: 'SOL', isFavorite: false, createdAt: '05/02/2026', isWhitelisted: false },
  { id: 'addr5', label: 'Sàn OKX', address: 'TN3W4H6rK2ce4vX9YnFQHwKx8Vq9m6dxWc', network: 'TRC20', asset: 'USDT', isFavorite: false, createdAt: '01/02/2026', lastUsed: '10/02/2026', isWhitelisted: true },
];

export function AddressBookPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [addresses, setAddresses] = useState<SavedAddress[]>(MOCK_ADDRESSES);
  const [networkFilter, setNetworkFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [whitelistOnly, setWhitelistOnly] = useState(false);
  const [showWhitelistInfo, setShowWhitelistInfo] = useState(false);
  const actionToast = useActionToast();

  const filtered = addresses.filter(a => {
    const matchNet = networkFilter === 'Tất cả' || a.network === networkFilter;
    const matchSearch = !search || a.label.toLowerCase().includes(search.toLowerCase()) || a.address.toLowerCase().includes(search.toLowerCase());
    const matchWhitelist = !whitelistOnly || a.isWhitelisted;
    return matchNet && matchSearch && matchWhitelist;
  });

  const favorites = filtered.filter(a => a.isFavorite);
  const others = filtered.filter(a => !a.isFavorite);

  const handleCopy = (id: string, addr: string) => {
    navigator.clipboard.writeText(addr).catch(() => {});
    setCopiedId(id);
    actionToast.success(TOAST.COPY.ADDRESS);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFavorite = (id: string) => {
    const addr = addresses.find(a => a.id === id);
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a));
    actionToast.info(addr?.isFavorite ? TOAST.FAVORITE.removed(addr.label) : TOAST.FAVORITE.added(addr?.label ?? ''));
  };

  const handleDelete = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    actionToast.warning(TOAST.WALLET.ADDRESS_DELETED);
  };

  const AddressCard = ({ addr }: { addr: SavedAddress }) => (
    <TrCard className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <Shield size={18} color={addr.isWhitelisted ? '#10B981' : c.text3} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{addr.label}</span>
            {addr.isWhitelisted && (
              <span className="px-1.5 py-0.5 rounded-md text-xs font-bold"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>✓ Whitelist</span>
            )}
          </div>
          <div className="flex items-center gap-1 mb-1">
            <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
              style={{ background: c.chipBg, color: c.chipText, border: `1px solid ${c.chipBorder}` }}>{addr.network}</span>
            <span className="px-1.5 py-0.5 rounded text-xs"
              style={{ background: c.chipBg, color: c.chipText, border: `1px solid ${c.chipBorder}` }}>{addr.asset}</span>
          </div>
          <p style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
            {addr.address}
          </p>
          {addr.lastUsed && (
            <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>Dùng gần nhất: {addr.lastUsed}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handleCopy(addr.id, addr.address)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>
          {copiedId === addr.id ? <CheckCircle size={13} /> : <Copy size={13} />}
          {copiedId === addr.id ? 'Đã copy' : 'Sao chép'}
        </button>
        <button
          onClick={() => toggleFavorite(addr.id)}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: addr.isFavorite ? 'rgba(245,158,11,0.1)' : c.surface2, border: `1px solid ${c.borderSolid}` }}>
          {addr.isFavorite ? <Star size={15} color="#F59E0B" fill="#F59E0B" /> : <StarOff size={15} color={c.text3} />}
        </button>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <Edit3 size={14} color={c.text2} />
        </button>
        <button
          onClick={() => setDeleteTarget(addr)}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <Trash2 size={14} color="#EF4444" />
        </button>
      </div>
    </TrCard>
  );

  return (
    <PageLayout>
      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); }}
        variant="danger"
        icon={<Trash2 size={24} color="#EF4444" />}
        title="Xoá địa chỉ"
        description={deleteTarget ? (
          <span>Bạn có chắc muốn xoá địa chỉ <span style={{ fontWeight: 600, color: c.text1 }}>"{deleteTarget.label}"</span>?</span>
        ) : ''}
        confirmText="Xoá"
      />

      <Header
        title="Sổ địa chỉ"
        subtitle="Quản lý · Wallet"
        back
        right={
          <button onClick={() => navigate(`${prefix}/wallet/address-book/add`)}
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Plus size={20} color="#3B82F6" />
          </button>
        }
      />

      <PageContent gap="default">
      {/* Search */}
      <div>
        <div className="flex items-center gap-3 rounded-2xl px-4"
          style={{ background: c.searchBg, border: `1.5px solid ${c.searchBorder}`, height: 52, borderRadius: 14 }}>
          <Search size={18} color={c.text3} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm địa chỉ hoặc tên..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 14, flex: 1 }}
          />
        </div>
      </div>

      {/* Whitelist-only mode toggle */}
      <TrCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: whitelistOnly ? 'rgba(16,185,129,0.15)' : c.surface2 }}>
            <Lock size={18} color={whitelistOnly ? '#10B981' : c.text3} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Chế độ Whitelist</span>
              {whitelistOnly && (
                <span className="px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 9, fontWeight: 700 }}>
                  BẬT
                </span>
              )}
            </div>
            <p style={{ color: c.text3, fontSize: 11 }}>
              {whitelistOnly ? 'Chỉ rút tới địa chỉ whitelist' : 'Cho phép rút tới mọi địa chỉ'}
            </p>
          </div>
          <button
            onClick={() => {
              setWhitelistOnly(!whitelistOnly);
              actionToast.info(
                !whitelistOnly
                  ? { title: 'Whitelist đã bật', description: 'Chỉ rút tới địa chỉ whitelist. Địa chỉ mới cần 24h.' }
                  : { title: 'Whitelist đã tắt', description: 'Bạn có thể rút tới bất kỳ địa chỉ nào.' }
              );
            }}
            className="w-12 h-7 rounded-full transition-all relative"
            style={{
              background: whitelistOnly ? '#10B981' : c.surface2,
              border: `1.5px solid ${whitelistOnly ? '#10B981' : c.borderSolid}`,
            }}
          >
            <div
              className="w-5 h-5 rounded-full absolute top-0.5 transition-all"
              style={{
                left: whitelistOnly ? 22 : 2,
                background: whitelistOnly ? '#fff' : c.text3,
              }}
            />
          </button>
        </div>
        {whitelistOnly && (
          <div className="flex items-start gap-2 mt-3 rounded-xl px-3 py-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: '#D97706', fontSize: 10, lineHeight: 1.5 }}>
              <strong>Bảo vệ nâng cao:</strong> Địa chỉ mới thêm vào whitelist cần chờ <strong>24 giờ</strong> trước khi dùng được.
              Tắt whitelist mode cũng cần xác nhận 2FA.
            </p>
          </div>
        )}
      </TrCard>

      {/* Network filter */}
      <div className="flex gap-2 -mx-5 px-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {NETWORKS.map(n => (
          <button key={n} onClick={() => setNetworkFilter(n)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0"
            style={{
              background: networkFilter === n ? c.chipActiveBg : c.chipBg,
              color: networkFilter === n ? c.chipActiveText : c.chipText,
              border: `1px solid ${networkFilter === n ? c.chipActiveBorder : c.chipBorder}`,
            }}>
            {n}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Tổng địa chỉ', value: addresses.length.toString(), color: '#3B82F6' },
            { label: 'Yêu thích', value: addresses.filter(a => a.isFavorite).length.toString(), color: '#F59E0B' },
            { label: 'Whitelist', value: addresses.filter(a => a.isWhitelisted).length.toString(), color: '#10B981' },
          ].map(s => (
            <TrCard key={s.label} className="p-3 text-center">
              <p style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.value}</p>
              <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
            </TrCard>
          ))}
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <span style={{ color: c.text2, fontSize: 13 }}>Yêu thích</span>
            </div>
            <div className="flex flex-col gap-2">
              {favorites.map(addr => <AddressCard key={addr.id} addr={addr} />)}
            </div>
          </div>
        )}

        {/* Others */}
        {others.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: c.text2, fontSize: 13 }}>Tất cả địa chỉ</span>
            </div>
            <div className="flex flex-col gap-2">
              {others.map(addr => <AddressCard key={addr.id} addr={addr} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
              <Shield size={32} color={c.text3} />
            </div>
            <p style={{ color: c.text3, fontSize: 14 }}>Không tìm thấy địa chỉ</p>
            <button onClick={() => navigate(`${prefix}/wallet/address-book/add`)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: '#3B82F6', color: '#fff' }}>
              <Plus size={16} />
              Thêm địa chỉ mới
            </button>
          </div>
        )}

        {/* Security tip */}
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <Shield size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
            <span style={{ color: '#3B82F6', fontWeight: 600 }}>Bảo mật:</span> Địa chỉ whitelist được bảo vệ bởi 2FA. Chỉ có thể rút tới địa chỉ đã được xác minh.
          </p>
        </div>
      </div>
      </PageContent>
    </PageLayout>
  );
}