/**
 * ══════════════════════════════════════════════════════════
 *  WEB ADDRESS BOOK PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/wallet/address-book
 *
 *  Saved withdrawal addresses management
 *  - Address list with labels
 *  - Network filtering
 *  - Add/Edit/Delete addresses
 *  - Address verification status
 *  - Whitelist management
 *  - Security notes
 *
 *  Guidelines compliance:
 *  - §8.4: Wallet patterns
 *  - §14.2: Sensitive data masking
 *  - §14.3: High-risk actions require confirm
 *  - §21.4: Header with breadcrumb
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Star,
  Info,
  MapPin,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

type AddressStatus = 'verified' | 'pending' | 'unverified';

interface SavedAddress {
  id: string;
  label: string;
  asset: string;
  network: string;
  address: string;
  status: AddressStatus;
  isWhitelisted: boolean;
  isFavorite: boolean;
  createdDate: string;
  lastUsed?: string;
  usageCount: number;
}

const SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr1',
    label: 'Binance Main Wallet',
    asset: 'USDT',
    network: 'TRC20',
    address: 'TXz9K2pL4vR8wQ3j6hF3nM9cB5dT7yS1aP',
    status: 'verified',
    isWhitelisted: true,
    isFavorite: true,
    createdDate: '2025-10-15',
    lastUsed: '2026-03-10',
    usageCount: 24,
  },
  {
    id: 'addr2',
    label: 'Personal ETH Wallet',
    asset: 'ETH',
    network: 'ERC20',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    status: 'verified',
    isWhitelisted: true,
    isFavorite: true,
    createdDate: '2025-11-20',
    lastUsed: '2026-03-12',
    usageCount: 18,
  },
  {
    id: 'addr3',
    label: 'OKX BTC',
    asset: 'BTC',
    network: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    status: 'verified',
    isWhitelisted: false,
    isFavorite: false,
    createdDate: '2026-01-05',
    lastUsed: '2026-02-28',
    usageCount: 5,
  },
  {
    id: 'addr4',
    label: 'Trust Wallet',
    asset: 'BNB',
    network: 'BSC',
    address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    status: 'pending',
    isWhitelisted: false,
    isFavorite: false,
    createdDate: '2026-03-13',
    usageCount: 0,
  },
  {
    id: 'addr5',
    label: 'Test Address',
    asset: 'USDT',
    network: 'ERC20',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    status: 'unverified',
    isWhitelisted: false,
    isFavorite: false,
    createdDate: '2026-03-01',
    usageCount: 0,
  },
];

const NETWORK_OPTIONS = ['All', 'BTC', 'ERC20', 'TRC20', 'BSC', 'Polygon'];

const STATUS_CONFIG: Record<AddressStatus, { label: string; color: string; icon: React.ElementType }> = {
  verified: { label: 'Đã xác minh', color: '#10B981', icon: ShieldCheck },
  pending: { label: 'Chờ xác minh', color: '#F59E0B', icon: Shield },
  unverified: { label: 'Chưa xác minh', color: '#94A3B8', icon: AlertTriangle },
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function AddressCard({ address }: { address: SavedAddress }) {
  const c = useThemeColors();
  const [showAddress, setShowAddress] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = STATUS_CONFIG[address.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {address.isFavorite && <Star size={14} fill="#F59E0B" color="#F59E0B" />}
            <span style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
              {address.label}
            </span>
            {address.isWhitelisted && (
              <span
                className="px-2 py-0.5 rounded-md"
                style={{
                  background: '#10B98115',
                  color: '#10B981',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Whitelist
              </span>
            )}
          </div>
          <div className="flex items-center gap-2" style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
            <span className="font-semibold">{address.asset}</span>
            <span>•</span>
            <span>{address.network}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg transition-colors"
            style={{
              color: c.text3,
              border: `1px solid ${c.border}`,
            }}
          >
            <Edit size={14} />
          </button>
          <button
            className="p-2 rounded-lg transition-colors"
            style={{
              color: '#EF4444',
              border: `1px solid #EF444440`,
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Address Display */}
      <div
        className="flex items-center gap-2 p-3 rounded-lg mb-4"
        style={{
          background: c.bg,
          border: `1px solid ${c.border}`,
        }}
      >
        <code
          className="flex-1 font-mono"
          style={{
            color: c.text1,
            fontSize: WEB_FONT.SIZE.CAPTION,
            fontWeight: 600,
            wordBreak: 'break-all',
          }}
        >
          {showAddress ? address.address : address.address.slice(0, 12) + '••••••••' + address.address.slice(-8)}
        </code>
        <button
          onClick={() => setShowAddress(!showAddress)}
          className="p-1 rounded transition-colors flex-shrink-0"
          style={{ color: c.text3 }}
        >
          {showAddress ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={handleCopy}
          className="p-1 rounded transition-colors flex-shrink-0"
          style={{ color: copied ? '#10B981' : c.text3 }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Status & Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-md"
            style={{
              background: `${statusConfig.color}15`,
              color: statusConfig.color,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <StatusIcon size={10} />
            {statusConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-4" style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
          <span>Sử dụng: {address.usageCount} lần</span>
          {address.lastUsed && (
            <>
              <span>•</span>
              <span>Gần nhất: {new Date(address.lastUsed).toLocaleDateString('vi-VN')}</span>
            </>
          )}
        </div>
      </div>

      {/* Pending Warning */}
      {address.status === 'pending' && (
        <div
          className="mt-4 p-3 rounded-lg"
          style={{
            background: '#F59E0B15',
            border: `1px solid #F59E0B40`,
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} color="#F59E0B" className="flex-shrink-0 mt-0.5" />
            <div style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
              Địa chỉ đang chờ xác minh. Kiểm tra email để hoàn tất.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebAddressBookPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAddresses = SAVED_ADDRESSES.filter((addr) => {
    const matchesNetwork = selectedNetwork === 'All' || addr.network === selectedNetwork;
    const matchesSearch =
      searchQuery === '' ||
      addr.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addr.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addr.asset.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesNetwork && matchesSearch;
  });

  const verifiedCount = SAVED_ADDRESSES.filter((a) => a.status === 'verified').length;
  const whitelistedCount = SAVED_ADDRESSES.filter((a) => a.isWhitelisted).length;

  return (
    <PageLayout>
    <div className="flex" style={{ minHeight: '100%' }}>
      {/* ═══ LEFT SIDEBAR (280px) ═══ */}
      <div
        className="flex flex-col"
        style={{
          width: 280,
          background: c.surface,
          borderRight: `1px solid ${c.divider}`,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          maxHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5"
          style={{
            height: 60,
            borderBottom: `1px solid ${c.divider}`,
          }}
        >
          <h2
            style={{
              color: c.text1,
              fontSize: WEB_FONT.SIZE.H2,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Address Book
          </h2>
        </div>

        {/* Add New Button */}
        <div className="p-4">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors"
            style={{
              background: '#3B82F6',
              color: '#fff',
              fontSize: WEB_FONT.SIZE.BODY,
              fontWeight: 600,
              border: 'none',
            }}
          >
            <Plus size={18} />
            Thêm địa chỉ
          </button>
        </div>

        {/* Stats */}
        <div className="px-4 pb-4">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 12 }}>
            Thống kê
          </div>
          <div className="flex flex-col gap-3">
            <div
              className="p-3 rounded-lg"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                Tổng địa chỉ
              </div>
              <div style={{ color: c.text1, fontSize: 20, fontWeight: 800 }}>
                {SAVED_ADDRESSES.length}
              </div>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{
                background: '#10B98115',
                border: `1px solid #10B98140`,
              }}
            >
              <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                Đã xác minh
              </div>
              <div style={{ color: '#10B981', fontSize: 20, fontWeight: 800 }}>
                {verifiedCount}
                <span style={{ fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, color: c.text3 }}>
                  /{SAVED_ADDRESSES.length}
                </span>
              </div>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                Whitelist
              </div>
              <div style={{ color: c.text1, fontSize: 20, fontWeight: 800 }}>
                {whitelistedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Network Filter */}
        <div className="px-4 pb-4">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 12 }}>
            Lọc theo mạng
          </div>
          <div className="flex flex-col gap-1">
            {NETWORK_OPTIONS.map((network) => {
              const count =
                network === 'All'
                  ? SAVED_ADDRESSES.length
                  : SAVED_ADDRESSES.filter((a) => a.network === network).length;
              const isActive = selectedNetwork === network;

              return (
                <button
                  key={network}
                  onClick={() => setSelectedNetwork(network)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
                  style={{
                    background: isActive ? '#3B82F615' : 'transparent',
                    color: isActive ? '#3B82F6' : c.text2,
                    fontSize: WEB_FONT.SIZE.CAPTION,
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  <span>{network}</span>
                  <span style={{ fontSize: 12 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Note */}
        <div className="px-4 pb-4 mt-auto">
          <div
            className="p-3 rounded-lg"
            style={{
              background: '#3B82F615',
              border: `1px solid #3B82F640`,
            }}
          >
            <div className="flex items-start gap-2">
              <Info size={14} color="#3B82F6" className="flex-shrink-0 mt-0.5" />
              <div>
                <div style={{ color: '#3B82F6', fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 4 }}>
                  Lưu ý bảo mật
                </div>
                <div style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  Luôn kiểm tra kỹ địa chỉ trước khi rút. Giao dịch blockchain không thể hoàn tác.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.H3,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Địa chỉ đã lưu
              </h3>
              <p style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, margin: 0 }}>
                {filteredAddresses.length} địa chỉ
              </p>
            </div>

            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                width: 320,
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              <Search size={16} color={c.text3} />
              <input
                type="text"
                placeholder="Tìm theo label hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.CAPTION,
                }}
              />
            </div>
          </div>

          {/* Address List */}
          {filteredAddresses.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredAddresses.map((address) => (
                <AddressCard key={address.id} address={address} />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-xl"
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              <BookOpen size={48} color={c.text3} className="mb-4" />
              <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, marginBottom: 8 }}>
                Không tìm thấy địa chỉ
              </div>
              <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </PageLayout>
  );
}