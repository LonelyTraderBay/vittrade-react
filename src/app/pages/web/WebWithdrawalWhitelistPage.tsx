import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Plus, Trash2, CheckCircle, AlertTriangle,
  ShieldCheck, ShieldAlert, Lock, Eye, EyeOff, Copy,
  Check, Search, Info, Globe, Clock, Edit3,
  XCircle, ChevronDown, ChevronUp, Wallet, Coins,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebWithdrawalWhitelistPage — Manage withdrawal address whitelist
 *
 * Route: /w/profile/security/withdrawal-whitelist
 *
 * Features:
 *   - View whitelisted addresses (coin, network, address, label, date)
 *   - Add new address (with 24h activation delay)
 *   - Remove address (password confirm + 2FA)
 *   - Toggle whitelist feature on/off
 *   - Search & filter by coin/network
 *   - Pending addresses (awaiting activation)
 *
 * Guidelines:
 *   - §14.3: High-risk actions require preview + confirm + step-up auth
 *   - §8.4: Wallet — address/network clarity
 *   - §6: No dark patterns, fee/delay transparency
 */

/* ═══ Types ═══ */
interface WhitelistAddress {
  id: string;
  label: string;
  coin: string;
  coinIcon: string;
  network: string;
  networkFull: string;
  address: string;
  addedAt: string;
  lastUsed: string;
  status: 'active' | 'pending';
  activatesAt?: string;
}

/* ═══ Mock data ═══ */
const COINS_COLOR: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', USDT: '#26A17B', BNB: '#F3BA2F', SOL: '#9945FF', XRP: '#0085FF',
};

const MOCK_ADDRESSES: WhitelistAddress[] = [
  {
    id: 'w1', label: 'Ledger chính', coin: 'BTC', coinIcon: '₿',
    network: 'Bitcoin', networkFull: 'Bitcoin Network',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    addedAt: '2025-12-15', lastUsed: '2026-03-10', status: 'active',
  },
  {
    id: 'w2', label: 'Metamask ETH', coin: 'ETH', coinIcon: 'Ξ',
    network: 'ERC-20', networkFull: 'Ethereum (ERC-20)',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    addedAt: '2026-01-20', lastUsed: '2026-03-08', status: 'active',
  },
  {
    id: 'w3', label: 'Binance USDT', coin: 'USDT', coinIcon: '₮',
    network: 'TRC-20', networkFull: 'Tron (TRC-20)',
    address: 'TMuA6YqfCeX8EhbfYEbMC4Ng8FbVLrVF8N',
    addedAt: '2026-02-05', lastUsed: '2026-03-12', status: 'active',
  },
  {
    id: 'w4', label: 'Phantom SOL', coin: 'SOL', coinIcon: '◎',
    network: 'Solana', networkFull: 'Solana Network',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    addedAt: '2026-03-01', lastUsed: 'Chưa sử dụng', status: 'active',
  },
  {
    id: 'w5', label: 'Cold wallet BNB', coin: 'BNB', coinIcon: 'B',
    network: 'BEP-20', networkFull: 'BNB Chain (BEP-20)',
    address: '0x8894E0a0c962CB723c1ef8c61453B2a78F5bd6f8',
    addedAt: '2026-03-13', lastUsed: 'Chưa sử dụng', status: 'pending',
    activatesAt: '2026-03-14 14:32',
  },
];

const NETWORK_OPTIONS = [
  { value: 'Bitcoin', label: 'Bitcoin Network' },
  { value: 'ERC-20', label: 'Ethereum (ERC-20)' },
  { value: 'TRC-20', label: 'Tron (TRC-20)' },
  { value: 'BEP-20', label: 'BNB Chain (BEP-20)' },
  { value: 'Solana', label: 'Solana Network' },
  { value: 'Polygon', label: 'Polygon (MATIC)' },
  { value: 'Arbitrum', label: 'Arbitrum One' },
  { value: 'TON', label: 'TON Network' },
];

const COIN_OPTIONS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'MATIC', 'TON'];

type ViewMode = 'list' | 'add' | 'delete-confirm';

export function WebWithdrawalWhitelistPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [addresses, setAddresses] = useState(MOCK_ADDRESSES);
  const [whitelistEnabled, setWhitelistEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filterCoin, setFilterCoin] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add form
  const [newLabel, setNewLabel] = useState('');
  const [newCoin, setNewCoin] = useState('BTC');
  const [newNetwork, setNewNetwork] = useState('Bitcoin');
  const [newAddress, setNewAddress] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<WhitelistAddress | null>(null);
  const [delPassword, setDelPassword] = useState('');
  const [delOtp, setDelOtp] = useState('');
  const [showDelPw, setShowDelPw] = useState(false);
  const [delError, setDelError] = useState('');
  const [delLoading, setDelLoading] = useState(false);

  const [expandedInfo, setExpandedInfo] = useState(false);

  /* ─── Filtering ─── */
  const filtered = addresses.filter(a => {
    if (filterCoin !== 'all' && a.coin !== filterCoin) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.label.toLowerCase().includes(q) || a.address.toLowerCase().includes(q) || a.coin.toLowerCase().includes(q);
    }
    return true;
  });

  /* ─── Copy address ─── */
  const handleCopy = (id: string, addr: string) => {
    navigator.clipboard.writeText(addr).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ─── Mask address ─── */
  const maskAddr = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  /* ─── Add new address ─── */
  const handleAdd = async () => {
    if (!newLabel.trim()) { setAddError('Nhập tên gợi nhớ'); return; }
    if (!newAddress.trim()) { setAddError('Nhập địa chỉ ví'); return; }
    if (newAddress.trim().length < 20) { setAddError('Địa chỉ ví không hợp lệ'); return; }
    setAddError('');
    setAddLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    const newItem: WhitelistAddress = {
      id: `w-${Date.now()}`, label: newLabel.trim(), coin: newCoin,
      coinIcon: newCoin.charAt(0), network: newNetwork,
      networkFull: NETWORK_OPTIONS.find(n => n.value === newNetwork)?.label || newNetwork,
      address: newAddress.trim(), addedAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Chưa sử dụng', status: 'pending',
      activatesAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('vi-VN'),
    };
    setAddresses(prev => [newItem, ...prev]);
    setAddLoading(false);
    setAddSuccess(true);
  };

  /* ─── Delete address ─── */
  const handleDelete = async () => {
    if (!delPassword) { setDelError('Nhập mật khẩu'); return; }
    if (delOtp.length < 6) { setDelError('Nhập mã 2FA 6 chữ số'); return; }
    setDelError('');
    setDelLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    if (deleteTarget) {
      setAddresses(prev => prev.filter(a => a.id !== deleteTarget.id));
    }
    setDelLoading(false);
    setDeleteTarget(null);
    setDelPassword('');
    setDelOtp('');
    setViewMode('list');
  };

  /* ─── Card helper ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault, borderRadius: 14,
    background: c.surface, border: `1px solid ${c.borderSolid}`, ...extra,
  });

  const activeCount = addresses.filter(a => a.status === 'active').length;
  const pendingCount = addresses.filter(a => a.status === 'pending').length;

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ height: 56, padding: '0 24px', borderBottom: `1px solid ${c.borderSolid}`, background: c.surface }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/w/profile/security')} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, border: `1px solid ${c.borderSolid}`, cursor: 'pointer' }}>
            <ArrowLeft size={16} color={c.text1} />
          </button>
          <div>
            <h1 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>Whitelist rút tiền</h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Bảo mật &gt; Whitelist địa chỉ rút tiền</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle whitelist on/off */}
          <div className="flex items-center gap-2">
            <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>Whitelist</span>
            <button
              onClick={() => setWhitelistEnabled(!whitelistEnabled)}
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: 'pointer', border: 'none',
                background: whitelistEnabled ? '#3B82F6' : c.borderSolid,
                position: 'relative', transition: 'background 0.2s ease',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: whitelistEnabled ? 23 : 3,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            </button>
          </div>
          <div style={{ width: 1, height: 24, background: c.borderSolid }} />
          <div className="flex items-center gap-2" style={{ padding: '4px 12px', borderRadius: 16, background: whitelistEnabled ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${whitelistEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
            {whitelistEnabled
              ? <><ShieldCheck size={13} color="#10B981" /><span style={{ color: '#10B981', fontSize: WEB_FONT.xs, fontWeight: 600 }}>Đang bật</span></>
              : <><ShieldAlert size={13} color="#F59E0B" /><span style={{ color: '#F59E0B', fontSize: WEB_FONT.xs, fontWeight: 600 }}>Đã tắt</span></>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 24px' }}>
        <div className="flex flex-col" style={{ gap: 24 }}>

          {/* Whitelist disabled warning */}
          {!whitelistEnabled && (
            <div className="flex items-start gap-3" style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <AlertTriangle size={18} color="#F59E0B" className="shrink-0" style={{ marginTop: 1 }} />
              <div>
                <p style={{ color: '#F59E0B', fontSize: WEB_FONT.md, fontWeight: 600, marginBottom: 3 }}>Whitelist đang tắt</p>
                <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                  Bạn có thể rút tiền đến bất kỳ địa chỉ nào. Bật whitelist để chỉ cho phép rút đến các địa chỉ đã xác minh, giảm rủi ro mất tài sản.
                </p>
              </div>
            </div>
          )}

          {/* Info expandable */}
          <div style={card()}>
            <button onClick={() => setExpandedInfo(!expandedInfo)} className="flex items-center justify-between" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div className="flex items-center gap-2">
                <Info size={16} color="#3B82F6" />
                <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>Whitelist rút tiền hoạt động thế nào?</span>
              </div>
              {expandedInfo ? <ChevronUp size={16} color={c.text3} /> : <ChevronDown size={16} color={c.text3} />}
            </button>
            {expandedInfo && (
              <div style={{ marginTop: 14 }}>
                <div className="flex flex-col" style={{ gap: 8 }}>
                  {[
                    { icon: ShieldCheck, text: 'Khi whitelist bật, bạn chỉ rút tiền đến các địa chỉ đã được phê duyệt', color: '#10B981' },
                    { icon: Clock, text: 'Địa chỉ mới thêm cần 24 giờ để kích hoạt (delay bảo mật)', color: '#F59E0B' },
                    { icon: Lock, text: 'Xóa địa chỉ yêu cầu mật khẩu + mã 2FA', color: '#EF4444' },
                    { icon: AlertTriangle, text: 'Nếu tắt whitelist, bất kỳ ai truy cập tài khoản đều có thể rút tài sản', color: '#EF4444' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <item.icon size={13} color={item.color} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ LIST VIEW ═══ */}
          {viewMode === 'list' && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3" style={{ gap: 12 }}>
                {[
                  { label: 'Đã kích hoạt', value: activeCount, color: '#10B981' },
                  { label: 'Đang chờ', value: pendingCount, color: '#F59E0B' },
                  { label: 'Tổng', value: addresses.length, color: '#3B82F6' },
                ].map(s => (
                  <div key={s.label} style={card({ textAlign: 'center' as const, padding: 14 })}>
                    <p style={{ color: s.color, fontSize: WEB_FONT.xl, fontWeight: 700, marginBottom: 2 }}>{s.value}</p>
                    <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Search + Add */}
              <div className="flex items-center" style={{ gap: 10 }}>
                <div className="flex-1 flex items-center" style={{ height: 40, borderRadius: 8, border: `1px solid ${c.borderSolid}`, background: c.surface, padding: '0 12px', gap: 8 }}>
                  <Search size={14} color={c.text3} />
                  <input type="text" placeholder="Tìm theo tên, coin, địa chỉ..." value={search} onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none min-w-0" style={{ color: c.text1, fontSize: WEB_FONT.sm, height: '100%' }} />
                </div>
                <select
                  value={filterCoin} onChange={e => setFilterCoin(e.target.value)}
                  className="outline-none"
                  style={{
                    height: 40, borderRadius: 8, border: `1px solid ${c.borderSolid}`, background: c.surface,
                    padding: '0 12px', color: c.text1, fontSize: WEB_FONT.sm, cursor: 'pointer', minWidth: 100,
                  }}
                >
                  <option value="all">Tất cả coin</option>
                  {[...new Set(addresses.map(a => a.coin))].map(coin => (
                    <option key={coin} value={coin}>{coin}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setViewMode('add'); setAddSuccess(false); setNewLabel(''); setNewAddress(''); setAddError(''); }}
                  className="flex items-center gap-1.5 shrink-0"
                  style={{
                    height: 40, padding: '0 16px', borderRadius: 8,
                    background: '#3B82F6', color: '#fff', fontSize: WEB_FONT.sm, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  <Plus size={14} /> Thêm địa chỉ
                </button>
              </div>

              {/* Address list */}
              <div style={card()}>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center" style={{ padding: '32px 0' }}>
                    <Wallet size={28} color={c.text3} style={{ marginBottom: 10 }} />
                    <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>Không có địa chỉ nào</p>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.xs, marginTop: 4 }}>Thêm địa chỉ rút tiền để bảo vệ tài sản</p>
                  </div>
                ) : (
                  <div className="flex flex-col" style={{ gap: 0 }}>
                    {filtered.map((addr, idx) => {
                      const coinColor = COINS_COLOR[addr.coin] || '#6B7280';
                      const isPending = addr.status === 'pending';

                      return (
                        <div key={addr.id}>
                          {idx > 0 && <div style={{ height: 1, background: c.borderSolid }} />}
                          <div className="flex items-center" style={{ padding: '14px 0', gap: 14 }}>
                            {/* Coin icon */}
                            <div className="flex items-center justify-center shrink-0" style={{
                              width: 42, height: 42, borderRadius: 12,
                              background: `${coinColor}10`, border: `1px solid ${coinColor}20`,
                            }}>
                              <span style={{ color: coinColor, fontSize: 16, fontWeight: 700 }}>{addr.coinIcon}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                                <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 500 }}>{addr.label}</p>
                                <span style={{
                                  padding: '1px 8px', borderRadius: 8, fontSize: WEB_FONT.xs, fontWeight: 600,
                                  background: `${coinColor}10`, color: coinColor,
                                }}>{addr.coin}</span>
                                <span style={{
                                  padding: '1px 6px', borderRadius: 6, fontSize: 10, fontWeight: 500,
                                  background: c.bg, color: c.text3, border: `1px solid ${c.borderSolid}`,
                                }}>{addr.network}</span>
                                {isPending && (
                                  <span style={{
                                    padding: '1px 8px', borderRadius: 8,
                                    background: 'rgba(245,158,11,0.08)', color: '#F59E0B',
                                    fontSize: WEB_FONT.xs, fontWeight: 600,
                                  }}>
                                    <Clock size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                                    Chờ kích hoạt
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <code style={{ color: c.text2, fontSize: WEB_FONT.xs, fontFamily: 'monospace' }}>
                                  {maskAddr(addr.address)}
                                </code>
                                <button
                                  onClick={() => handleCopy(addr.id, addr.address)}
                                  className="shrink-0"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                                >
                                  {copiedId === addr.id ? <Check size={12} color="#10B981" /> : <Copy size={12} color={c.text3} />}
                                </button>
                              </div>
                              <div className="flex items-center gap-3" style={{ marginTop: 2 }}>
                                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Thêm: {addr.addedAt}</span>
                                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Dùng cuối: {addr.lastUsed}</span>
                                {isPending && addr.activatesAt && (
                                  <span style={{ color: '#F59E0B', fontSize: WEB_FONT.xs, fontWeight: 500 }}>Kích hoạt: {addr.activatesAt}</span>
                                )}
                              </div>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => { setDeleteTarget(addr); setViewMode('delete-confirm'); setDelPassword(''); setDelOtp(''); setDelError(''); }}
                              className="flex items-center justify-center shrink-0"
                              title="Xóa địa chỉ"
                              style={{ width: 34, height: 34, borderRadius: 8, background: 'transparent', border: `1px solid transparent`, cursor: 'pointer' }}
                            >
                              <Trash2 size={15} color={c.text3} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ ADD VIEW ═══ */}
          {viewMode === 'add' && !addSuccess && (
            <div style={card()}>
              <button onClick={() => setViewMode('list')} className="flex items-center hover:underline" style={{ gap: 6, color: c.text2, fontSize: WEB_FONT.sm, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer' }}>
                <ArrowLeft size={16} /> Quay lại danh sách
              </button>

              <h2 style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700, marginBottom: 6 }}>Thêm địa chỉ rút tiền</h2>
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5, marginBottom: 24 }}>
                Địa chỉ mới sẽ cần <span style={{ color: '#F59E0B', fontWeight: 600 }}>24 giờ</span> để kích hoạt. Đây là biện pháp bảo mật để bảo vệ tài sản.
              </p>

              <div className="flex flex-col" style={{ gap: 18 }}>
                {/* Label */}
                <div>
                  <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>Tên gợi nhớ</label>
                  <input type="text" placeholder="VD: Ledger chính, Metamask ETH..."
                    value={newLabel} onChange={e => { setNewLabel(e.target.value); setAddError(''); }} maxLength={30}
                    className="outline-none" style={{ width: '100%', height: WEB_BUTTON.lg, borderRadius: 10, border: `1.5px solid ${c.borderSolid}`, background: c.bg, padding: '0 14px', color: c.text1, fontSize: WEB_FONT.md }} />
                </div>

                {/* Coin & Network row */}
                <div className="grid grid-cols-2" style={{ gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>Coin</label>
                    <select value={newCoin} onChange={e => setNewCoin(e.target.value)} className="outline-none"
                      style={{ width: '100%', height: WEB_BUTTON.lg, borderRadius: 10, border: `1.5px solid ${c.borderSolid}`, background: c.bg, padding: '0 14px', color: c.text1, fontSize: WEB_FONT.md, cursor: 'pointer' }}>
                      {COIN_OPTIONS.map(coin => <option key={coin} value={coin}>{coin}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>Network</label>
                    <select value={newNetwork} onChange={e => setNewNetwork(e.target.value)} className="outline-none"
                      style={{ width: '100%', height: WEB_BUTTON.lg, borderRadius: 10, border: `1.5px solid ${c.borderSolid}`, background: c.bg, padding: '0 14px', color: c.text1, fontSize: WEB_FONT.md, cursor: 'pointer' }}>
                      {NETWORK_OPTIONS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>Địa chỉ ví</label>
                  <textarea
                    placeholder="Dán địa chỉ ví tại đây..."
                    value={newAddress} onChange={e => { setNewAddress(e.target.value); setAddError(''); }}
                    rows={3} className="outline-none resize-none"
                    style={{ width: '100%', borderRadius: 10, border: `1.5px solid ${c.borderSolid}`, background: c.bg, padding: '12px 14px', color: c.text1, fontSize: WEB_FONT.sm, fontFamily: 'monospace' }}
                  />
                </div>

                {/* Error */}
                {addError && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={13} color="#EF4444" />
                    <span style={{ color: '#EF4444', fontSize: WEB_FONT.sm }}>{addError}</span>
                  </div>
                )}

                {/* Warning */}
                <div className="flex items-start gap-3" style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                  <AlertTriangle size={14} color="#F59E0B" className="shrink-0" style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600, marginBottom: 2 }}>Kiểm tra kỹ trước khi thêm</p>
                    <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                      Đảm bảo địa chỉ đúng coin và đúng network. Gửi nhầm coin hoặc sai network có thể làm <strong>mất vĩnh viễn</strong> tài sản.
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <button onClick={handleAdd} disabled={addLoading}
                  className="flex items-center justify-center gap-2"
                  style={{
                    height: WEB_BUTTON.lg, borderRadius: 10, width: '100%',
                    background: addLoading ? c.surface2 : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                    color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
                    cursor: addLoading ? 'not-allowed' : 'pointer', border: 'none',
                    boxShadow: addLoading ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
                  }}>
                  {addLoading ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> : 'Thêm địa chỉ'}
                </button>
              </div>
            </div>
          )}

          {/* ═══ ADD SUCCESS ═══ */}
          {viewMode === 'add' && addSuccess && (
            <div style={card()}>
              <div className="flex flex-col items-center" style={{ padding: '24px 0' }}>
                <div className="flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(16,185,129,0.08)', border: '2px solid rgba(16,185,129,0.15)', marginBottom: 20 }}>
                  <CheckCircle size={32} color="#10B981" />
                </div>
                <h2 style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700, marginBottom: 6 }}>Địa chỉ đã được thêm!</h2>
                <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5, textAlign: 'center', maxWidth: 380, marginBottom: 20 }}>
                  Địa chỉ mới sẽ được kích hoạt sau <span style={{ color: '#F59E0B', fontWeight: 600 }}>24 giờ</span>. Bạn sẽ nhận thông báo khi địa chỉ sẵn sàng sử dụng.
                </p>

                <div style={{ padding: '12px 16px', borderRadius: 10, background: c.bg, border: `1px solid ${c.borderSolid}`, width: '100%', maxWidth: 400, marginBottom: 20 }}>
                  <div className="flex flex-col" style={{ gap: 6 }}>
                    <div className="flex justify-between">
                      <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Tên:</span>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>{newLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Coin / Network:</span>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>{newCoin} / {newNetwork}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Trạng thái:</span>
                      <span style={{ color: '#F59E0B', fontSize: WEB_FONT.sm, fontWeight: 600 }}>Chờ kích hoạt (24h)</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => { setViewMode('list'); setAddSuccess(false); }}
                  className="flex items-center justify-center gap-2"
                  style={{
                    height: WEB_BUTTON.lg, borderRadius: 10, width: '100%', maxWidth: 400,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                    color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
                    cursor: 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
                  }}>
                  Quay lại danh sách
                </button>
              </div>
            </div>
          )}

          {/* ═══ DELETE CONFIRM ═══ */}
          {viewMode === 'delete-confirm' && deleteTarget && (
            <div style={card()}>
              <button onClick={() => { setViewMode('list'); setDeleteTarget(null); }} className="flex items-center hover:underline" style={{ gap: 6, color: c.text2, fontSize: WEB_FONT.sm, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer' }}>
                <ArrowLeft size={16} /> Hủy
              </button>

              <div className="flex flex-col items-center" style={{ marginBottom: 24 }}>
                <div className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(239,68,68,0.06)', marginBottom: 16 }}>
                  <Trash2 size={28} color="#EF4444" />
                </div>
                <h2 style={{ color: '#EF4444', fontSize: WEB_FONT.xl, fontWeight: 700, marginBottom: 6 }}>Xóa địa chỉ</h2>
                <p style={{ color: c.text2, fontSize: WEB_FONT.sm, textAlign: 'center', maxWidth: 380 }}>
                  Bạn sắp xóa địa chỉ <span style={{ fontWeight: 600, color: c.text1 }}>"{deleteTarget.label}"</span>. Hành động này không thể hoàn tác.
                </p>
              </div>

              {/* Address summary */}
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.1)', marginBottom: 20 }}>
                <div className="flex flex-col" style={{ gap: 6 }}>
                  <div className="flex justify-between"><span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Coin / Network:</span><span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>{deleteTarget.coin} / {deleteTarget.network}</span></div>
                  <div className="flex justify-between"><span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Địa chỉ:</span><code style={{ color: c.text1, fontSize: WEB_FONT.xs, fontFamily: 'monospace' }}>{maskAddr(deleteTarget.address)}</code></div>
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>Mật khẩu</label>
                <div className="flex items-center" style={{ height: WEB_BUTTON.lg, borderRadius: 10, border: `1.5px solid ${c.borderSolid}`, background: c.bg, padding: '0 14px', gap: 10 }}>
                  <Lock size={15} color={c.text3} />
                  <input type={showDelPw ? 'text' : 'password'} placeholder="Nhập mật khẩu..." value={delPassword}
                    onChange={e => { setDelPassword(e.target.value); setDelError(''); }}
                    className="flex-1 bg-transparent outline-none min-w-0" style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }} />
                  <button onClick={() => setShowDelPw(!showDelPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    {showDelPw ? <EyeOff size={15} color={c.text3} /> : <Eye size={15} color={c.text3} />}
                  </button>
                </div>
              </div>

              {/* 2FA OTP */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>Mã 2FA (Authenticator)</label>
                <input type="text" inputMode="numeric" placeholder="6 chữ số..." maxLength={6}
                  value={delOtp} onChange={e => { setDelOtp(e.target.value.replace(/\D/g, '')); setDelError(''); }}
                  className="outline-none"
                  style={{ width: '100%', height: WEB_BUTTON.lg, borderRadius: 10, border: `1.5px solid ${c.borderSolid}`, background: c.bg, padding: '0 14px', color: c.text1, fontSize: WEB_FONT.md, fontFamily: 'monospace', letterSpacing: 4 }} />
              </div>

              {delError && <div className="flex items-center gap-1.5" style={{ marginBottom: 12 }}><AlertTriangle size={13} color="#EF4444" /><span style={{ color: '#EF4444', fontSize: WEB_FONT.sm }}>{delError}</span></div>}

              <button onClick={handleDelete} disabled={delLoading}
                className="flex items-center justify-center gap-2"
                style={{
                  height: WEB_BUTTON.lg, borderRadius: 10, width: '100%',
                  background: delLoading ? c.surface2 : '#EF4444',
                  color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
                  cursor: delLoading ? 'not-allowed' : 'pointer', border: 'none',
                }}>
                {delLoading ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> : <><Trash2 size={16} /> Xóa địa chỉ</>}
              </button>

              <p style={{ color: c.text3, fontSize: 10, marginTop: 10, textAlign: 'center', fontStyle: 'italic' }}>Demo: nhập bất kỳ mật khẩu + 6 số bất kỳ</p>
            </div>
          )}

        </div>
      </div>
    </PageLayout>
  );
}
