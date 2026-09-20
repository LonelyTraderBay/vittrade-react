/**
 * ══════════════════════════════════════════════════════════════
 *  WalletMultiManagerPage — Wallet Advanced Feature 1/4
 * ══════════════════════════════════════════════════════════════
 *  Multi-wallet management: Manage multiple wallets in one interface,
 *  Wallet groups, Quick switching, Aggregated portfolio view
 *  Pattern B — Page with Tabs (All/Groups/Activity)
 *  Compliance: §14 Security & Privacy UX
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  Wallet, Plus, MoreVertical, Eye, EyeOff, Copy, CheckCircle,
  TrendingUp, DollarSign, Shield, AlertCircle, Folder,
  Star, Clock, ArrowUpRight, ArrowDownRight, Info,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const TABS = ['Tất cả', 'Nhóm', 'Hoạt động'] as const;
type Tab = typeof TABS[number];

interface WalletItem {
  id: string;
  name: string;
  address: string;
  type: 'hot' | 'cold' | 'hardware' | 'imported';
  balance: number;
  balanceChange24h: number;
  lastActive: Date;
  isDefault: boolean;
  isFavorite: boolean;
  groupId?: string;
  assets: { symbol: string; balance: number; value: number }[];
}

interface WalletGroup {
  id: string;
  name: string;
  color: string;
  walletIds: string[];
  totalValue: number;
}

const MOCK_WALLETS: WalletItem[] = [
  {
    id: 'w1',
    name: 'Main Wallet',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    type: 'hot',
    balance: 45280,
    balanceChange24h: 3.2,
    lastActive: new Date(Date.now() - 300000),
    isDefault: true,
    isFavorite: true,
    groupId: 'g1',
    assets: [
      { symbol: 'BTC', balance: 0.45, value: 28500 },
      { symbol: 'ETH', balance: 5.2, value: 13000 },
      { symbol: 'USDT', balance: 3780, value: 3780 },
    ],
  },
  {
    id: 'w2',
    name: 'Trading Wallet',
    address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    type: 'hot',
    balance: 28900,
    balanceChange24h: -1.5,
    lastActive: new Date(Date.now() - 3600000),
    isDefault: false,
    isFavorite: true,
    groupId: 'g1',
    assets: [
      { symbol: 'ETH', balance: 8.5, value: 21250 },
      { symbol: 'BNB', balance: 15, value: 7650 },
    ],
  },
  {
    id: 'w3',
    name: 'Cold Storage',
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    type: 'cold',
    balance: 125000,
    balanceChange24h: 0.8,
    lastActive: new Date(Date.now() - 86400000 * 7),
    isDefault: false,
    isFavorite: false,
    groupId: 'g2',
    assets: [
      { symbol: 'BTC', balance: 1.5, value: 95000 },
      { symbol: 'ETH', balance: 12, value: 30000 },
    ],
  },
  {
    id: 'w4',
    name: 'Hardware Ledger',
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    type: 'hardware',
    balance: 68500,
    balanceChange24h: 2.1,
    lastActive: new Date(Date.now() - 86400000 * 2),
    isDefault: false,
    isFavorite: false,
    groupId: 'g2',
    assets: [
      { symbol: 'BTC', balance: 0.85, value: 53900 },
      { symbol: 'USDT', balance: 14600, value: 14600 },
    ],
  },
];

const MOCK_GROUPS: WalletGroup[] = [
  { id: 'g1', name: 'Active Trading', color: '#10B981', walletIds: ['w1', 'w2'], totalValue: 74180 },
  { id: 'g2', name: 'Long Term Hold', color: '#3B82F6', walletIds: ['w3', 'w4'], totalValue: 193500 },
];

const WALLET_TYPE_COLORS = {
  hot: '#F59E0B',
  cold: '#3B82F6',
  hardware: '#10B981',
  imported: '#8B5CF6',
};

export function WalletMultiManagerPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Tất cả');
  const [selectedWallet, setSelectedWallet] = useState<string | null>('w1');
  const [revealedAddresses, setRevealedAddresses] = useState<Set<string>>(new Set());
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const totalBalance = MOCK_WALLETS.reduce((sum, w) => sum + w.balance, 0);
  const totalChange = MOCK_WALLETS.reduce((sum, w) => sum + (w.balance * w.balanceChange24h / 100), 0);
  const totalChangePercent = (totalChange / totalBalance) * 100;

  const pieData = MOCK_WALLETS.map((w) => ({
    name: w.name,
    value: w.balance,
  }));

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];

  const toggleReveal = (walletId: string) => {
    setRevealedAddresses((prev) => {
      const next = new Set(prev);
      if (next.has(walletId)) {
        next.delete(walletId);
      } else {
        next.add(walletId);
      }
      return next;
    });
  };

  const copyAddress = (walletId: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(walletId);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const maskAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hardware':
        return Shield;
      case 'cold':
        return Shield;
      default:
        return Wallet;
    }
  };

  return (
    <PageLayout>
      <Header title="Multi-Wallet Manager" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Tất cả' && (
          <>
            {/* Total Portfolio */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Portfolio Value</p>
              <div className="flex items-baseline gap-2 mb-3">
                <p style={{ color: c.text1, fontSize: 28, fontWeight: 700 }}>
                  ${totalBalance.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  {totalChangePercent >= 0 ? (
                    <ArrowUpRight size={16} color="#10B981" />
                  ) : (
                    <ArrowDownRight size={16} color="#EF4444" />
                  )}
                  <p
                    style={{
                      color: totalChangePercent >= 0 ? '#10B981' : '#EF4444',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Wallets</p>
                  <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{MOCK_WALLETS.length}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>24h Change</p>
                  <p
                    style={{
                      color: totalChange >= 0 ? '#10B981' : '#EF4444',
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {totalChange >= 0 ? '+' : ''}${totalChange.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Groups</p>
                  <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{MOCK_GROUPS.length}</p>
                </div>
              </div>
            </div>

            {/* Distribution Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Portfolio Distribution
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    label={(entry) => `${((entry.value / totalBalance) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Wallets List */}
            <PageSection label="Tất cả ví">
              <div className="space-y-3">
                {MOCK_WALLETS.map((wallet, idx) => {
                  const TypeIcon = getTypeIcon(wallet.type);
                  const isRevealed = revealedAddresses.has(wallet.id);
                  const isCopied = copiedAddress === wallet.id;

                  return (
                    <div
                      key={wallet.id}
                      onClick={() => setSelectedWallet(wallet.id)}
                      className="rounded-2xl p-4 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        background: selectedWallet === wallet.id ? `${COLORS[idx % COLORS.length]}08` : c.surface,
                        border: `1px solid ${selectedWallet === wallet.id ? COLORS[idx % COLORS.length] : c.border}`,
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: `${WALLET_TYPE_COLORS[wallet.type]}20`,
                            }}
                          >
                            <TypeIcon size={18} color={WALLET_TYPE_COLORS[wallet.type]} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                                {wallet.name}
                              </p>
                              {wallet.isDefault && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
                                >
                                  DEFAULT
                                </span>
                              )}
                              {wallet.isFavorite && <Star size={12} color="#F59E0B" fill="#F59E0B" />}
                            </div>
                            <div className="flex items-center gap-2">
                              <code style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                                {isRevealed ? wallet.address : maskAddress(wallet.address)}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleReveal(wallet.id);
                                }}
                                className="p-1 rounded hover:opacity-70"
                              >
                                {isRevealed ? (
                                  <EyeOff size={11} color={c.text3} />
                                ) : (
                                  <Eye size={11} color={c.text3} />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyAddress(wallet.id, wallet.address);
                                }}
                                className="p-1 rounded hover:opacity-70"
                              >
                                {isCopied ? (
                                  <CheckCircle size={11} color="#10B981" />
                                ) : (
                                  <Copy size={11} color={c.text3} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Wallet options: ${wallet.name}`);
                          }}
                          className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                        >
                          <MoreVertical size={16} color={c.text3} />
                        </button>
                      </div>

                      {/* Balance */}
                      <div className="mb-3">
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Balance</p>
                        <div className="flex items-baseline gap-2">
                          <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                            ${wallet.balance.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1">
                            {wallet.balanceChange24h >= 0 ? (
                              <TrendingUp size={12} color="#10B981" />
                            ) : (
                              <ArrowDownRight size={12} color="#EF4444" />
                            )}
                            <p
                              style={{
                                color: wallet.balanceChange24h >= 0 ? '#10B981' : '#EF4444',
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              {wallet.balanceChange24h >= 0 ? '+' : ''}{wallet.balanceChange24h}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Assets */}
                      <div className="flex items-center gap-1.5 mb-2">
                        {wallet.assets.slice(0, 3).map((asset) => (
                          <span
                            key={asset.symbol}
                            className="px-2 py-0.5 rounded text-[9px] font-semibold"
                            style={{ background: c.chipBg, color: c.chipText }}
                          >
                            {asset.symbol}
                          </span>
                        ))}
                        {wallet.assets.length > 3 && (
                          <span style={{ color: c.text3, fontSize: 10 }}>
                            +{wallet.assets.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${c.border}` }}>
                        <div className="flex items-center gap-1.5">
                          <Clock size={10} color={c.text3} />
                          <p style={{ color: c.text3, fontSize: 10 }}>
                            {wallet.lastActive.toLocaleString('vi-VN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase"
                          style={{
                            background: `${WALLET_TYPE_COLORS[wallet.type]}20`,
                            color: WALLET_TYPE_COLORS[wallet.type],
                          }}
                        >
                          {wallet.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PageSection>

            {/* Add Wallet Button */}
            <button
              onClick={() => alert('Add new wallet')}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Plus size={18} />
              Add Wallet
            </button>

            {/* Security Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Shield size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Addresses are masked by default. Click eye icon to reveal. Never share your private keys.
              </p>
            </div>
          </>
        )}

        {tab === 'Nhóm' && (
          <>
            {/* Groups List */}
            <PageSection label="Wallet Groups">
              {MOCK_GROUPS.map((group) => {
                const groupWallets = MOCK_WALLETS.filter((w) => w.groupId === group.id);
                return (
                  <div
                    key={group.id}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 3,
                            background: group.color,
                          }}
                        />
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{group.name}</p>
                      </div>
                      <button className="p-2 rounded-lg hover:opacity-70">
                        <MoreVertical size={16} color={c.text3} />
                      </button>
                    </div>

                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>
                      {groupWallets.length} wallets
                    </p>

                    <div className="mb-3">
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Total Value</p>
                      <p style={{ color: group.color, fontSize: 20, fontWeight: 700 }}>
                        ${group.totalValue.toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {groupWallets.map((wallet) => (
                        <div
                          key={wallet.id}
                          className="rounded-xl p-2 flex items-center justify-between"
                          style={{ background: c.bg }}
                        >
                          <div>
                            <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                              {wallet.name}
                            </p>
                            <p style={{ color: c.text3, fontSize: 10 }}>
                              {maskAddress(wallet.address)}
                            </p>
                          </div>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                            ${wallet.balance.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </PageSection>

            {/* Create Group Button */}
            <button
              onClick={() => alert('Create wallet group')}
              className="w-full rounded-xl py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text1,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Folder size={16} />
              Create Group
            </button>
          </>
        )}

        {tab === 'Hoạt động' && (
          <>
            {/* Activity by Wallet */}
            <PageSection label="Recent Activity">
              {MOCK_WALLETS.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime()).map((wallet) => (
                <div
                  key={wallet.id}
                  className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${WALLET_TYPE_COLORS[wallet.type]}20`,
                      }}
                    >
                      <Wallet size={16} color={WALLET_TYPE_COLORS[wallet.type]} />
                    </div>
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{wallet.name}</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>{maskAddress(wallet.address)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p style={{ color: c.text2, fontSize: 11 }}>
                      {wallet.lastActive.toLocaleString('vi-VN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {wallet.lastActive.toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </PageSection>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}