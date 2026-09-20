/**
 * ══════════════════════════════════════════════════════════════
 *  WalletTokenApprovalPage — Wallet Advanced Feature 3/4
 * ══════════════════════════════════════════════════════════════
 *  Token approval management: View all approvals, Revoke permissions,
 *  Risk assessment, Unlimited approval warnings, Approval history
 *  Pattern B — Page with Tabs (Active/History/Settings)
 *  Compliance: §14.1 Security Center, §14.3 High-risk actions
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
  Shield, AlertTriangle, CheckCircle, Trash2, Eye,
  Clock, DollarSign, Info, XCircle, RefreshCw,
  Infinity as InfinityIcon, TrendingUp,
} from 'lucide-react';

const TABS = ['Hoạt động', 'Lịch sử', 'Cài đặt'] as const;
type Tab = typeof TABS[number];

interface TokenApproval {
  id: string;
  token: string;
  tokenAddress: string;
  spender: string;
  spenderName: string;
  amount: 'unlimited' | number;
  approvedAt: Date;
  lastUsed?: Date;
  usageCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  verified: boolean;
  category: 'dex' | 'lending' | 'nft' | 'gaming' | 'unknown';
}

const MOCK_APPROVALS: TokenApproval[] = [
  {
    id: 'a1',
    token: 'USDT',
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    spender: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    spenderName: 'Uniswap V2 Router',
    amount: 'unlimited',
    approvedAt: new Date(Date.now() - 90 * 86400000),
    lastUsed: new Date(Date.now() - 7 * 86400000),
    usageCount: 45,
    riskLevel: 'medium',
    verified: true,
    category: 'dex',
  },
  {
    id: 'a2',
    token: 'DAI',
    tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    spender: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
    spenderName: 'Aave Lending Pool',
    amount: 50000,
    approvedAt: new Date(Date.now() - 60 * 86400000),
    lastUsed: new Date(Date.now() - 14 * 86400000),
    usageCount: 12,
    riskLevel: 'low',
    verified: true,
    category: 'lending',
  },
  {
    id: 'a3',
    token: 'WETH',
    tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    spender: '0x1234567890123456789012345678901234567890',
    spenderName: 'Unknown Contract',
    amount: 'unlimited',
    approvedAt: new Date(Date.now() - 180 * 86400000),
    usageCount: 0,
    riskLevel: 'critical',
    verified: false,
    category: 'unknown',
  },
  {
    id: 'a4',
    token: 'USDC',
    tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    spender: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    spenderName: '0x Exchange Proxy',
    amount: 100000,
    approvedAt: new Date(Date.now() - 30 * 86400000),
    lastUsed: new Date(Date.now() - 3 * 86400000),
    usageCount: 28,
    riskLevel: 'low',
    verified: true,
    category: 'dex',
  },
  {
    id: 'a5',
    token: 'UNI',
    tokenAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    spender: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    spenderName: 'Uniswap V3 Router',
    amount: 'unlimited',
    approvedAt: new Date(Date.now() - 120 * 86400000),
    lastUsed: new Date(Date.now() - 45 * 86400000),
    usageCount: 8,
    riskLevel: 'high',
    verified: true,
    category: 'dex',
  },
];

const REVOKED_APPROVALS = [
  {
    id: 'r1',
    token: 'SHIB',
    spenderName: 'Suspicious Contract',
    revokedAt: new Date(Date.now() - 5 * 86400000),
    reason: 'Security risk detected',
  },
  {
    id: 'r2',
    token: 'LINK',
    spenderName: 'Old DeFi Protocol',
    revokedAt: new Date(Date.now() - 20 * 86400000),
    reason: 'No longer using',
  },
];

export function WalletTokenApprovalPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Hoạt động');
  const [autoRevokeUnused, setAutoRevokeUnused] = useState(true);
  const [warnUnlimited, setWarnUnlimited] = useState(true);

  const criticalApprovals = MOCK_APPROVALS.filter((a) => a.riskLevel === 'critical').length;
  const highRiskApprovals = MOCK_APPROVALS.filter((a) => a.riskLevel === 'high').length;
  const unlimitedApprovals = MOCK_APPROVALS.filter((a) => a.amount === 'unlimited').length;
  const unusedApprovals = MOCK_APPROVALS.filter((a) => a.usageCount === 0).length;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'high':
        return '#F97316';
      case 'critical':
        return '#EF4444';
      default:
        return c.text3;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dex':
        return TrendingUp;
      case 'lending':
        return DollarSign;
      default:
        return Shield;
    }
  };

  const maskAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <PageLayout>
      <Header title="Token Approvals" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Hoạt động' && (
          <>
            {/* Security Overview */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(139,92,246,0.08)',
                  }}
                >
                  <Shield size={24} color="#8B5CF6" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Token Approvals</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>{MOCK_APPROVALS.length} active approvals</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Critical Risk</p>
                  <p style={{ color: '#EF4444', fontSize: 18, fontWeight: 700 }}>{criticalApprovals}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>High Risk</p>
                  <p style={{ color: '#F97316', fontSize: 18, fontWeight: 700 }}>{highRiskApprovals}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Unlimited</p>
                  <p style={{ color: '#F59E0B', fontSize: 18, fontWeight: 700 }}>{unlimitedApprovals}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Unused</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{unusedApprovals}</p>
                </div>
              </div>
            </div>

            {/* Critical Alert */}
            {criticalApprovals > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      Critical Security Risk
                    </p>
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                      You have {criticalApprovals} approval(s) to unverified contracts. Revoke immediately to protect your funds.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Active Approvals */}
            <PageSection label="Active Approvals">
              <div className="space-y-3">
                {MOCK_APPROVALS.sort((a, b) => {
                  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                  return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
                }).map((approval) => {
                  const CategoryIcon = getCategoryIcon(approval.category);
                  return (
                    <div
                      key={approval.id}
                      className="rounded-2xl p-4"
                      style={{
                        background: c.surface,
                        border: `1px solid ${
                          approval.riskLevel === 'critical' || approval.riskLevel === 'high'
                            ? getRiskColor(approval.riskLevel)
                            : c.border
                        }`,
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-2 flex-1">
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: `${getRiskColor(approval.riskLevel)}20`,
                              flexShrink: 0,
                            }}
                          >
                            <CategoryIcon size={16} color={getRiskColor(approval.riskLevel)} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                                {approval.token}
                              </p>
                              {approval.verified ? (
                                <CheckCircle size={12} color="#10B981" />
                              ) : (
                                <XCircle size={12} color="#EF4444" />
                              )}
                              <span
                                className="px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase"
                                style={{
                                  background: `${getRiskColor(approval.riskLevel)}20`,
                                  color: getRiskColor(approval.riskLevel),
                                }}
                              >
                                {approval.riskLevel}
                              </span>
                            </div>
                            <p style={{ color: c.text2, fontSize: 12, marginBottom: 2 }}>
                              → {approval.spenderName}
                            </p>
                            <code style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                              {maskAddress(approval.spender)}
                            </code>
                          </div>
                        </div>
                        <button
                          onClick={() => alert(`Revoke approval for ${approval.token}`)}
                          className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                          style={{ background: 'rgba(239,68,68,0.08)' }}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </button>
                      </div>

                      {/* Approval Amount */}
                      <div
                        className="rounded-xl p-2 mb-3"
                        style={{
                          background: approval.amount === 'unlimited' ? 'rgba(239,68,68,0.08)' : c.bg,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <p style={{ color: c.text3, fontSize: 10 }}>Approved Amount</p>
                          <div className="flex items-center gap-1">
                            {approval.amount === 'unlimited' && (
                              <InfinityIcon size={14} color="#EF4444" />
                            )}
                            <p
                              style={{
                                color: approval.amount === 'unlimited' ? '#EF4444' : c.text1,
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {approval.amount === 'unlimited'
                                ? 'Unlimited'
                                : approval.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Approved</p>
                          <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                            {approval.approvedAt.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Last Used</p>
                          <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                            {approval.lastUsed
                              ? approval.lastUsed.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
                              : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Usage</p>
                          <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                            {approval.usageCount}x
                          </p>
                        </div>
                      </div>

                      {/* Warning for unused unlimited */}
                      {approval.amount === 'unlimited' && approval.usageCount === 0 && (
                        <div
                          className="rounded-lg p-2 mt-3 flex items-start gap-1.5"
                          style={{ background: 'rgba(239,68,68,0.06)' }}
                        >
                          <AlertTriangle size={11} color="#EF4444" style={{ marginTop: 1, flexShrink: 0 }} />
                          <p style={{ color: '#EF4444', fontSize: 10, lineHeight: 1.4 }}>
                            Unused unlimited approval - revoke to protect funds
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </PageSection>

            {/* Revoke All Button */}
            <button
              onClick={() => alert('Revoke all approvals')}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: 'rgba(239,68,68,0.1)',
                color: '#EF4444',
                fontSize: 14,
                fontWeight: 600,
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <Trash2 size={18} />
              Revoke All High-Risk Approvals
            </button>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Token approvals allow smart contracts to spend your tokens. Revoke unused or suspicious approvals to protect your assets.
              </p>
            </div>
          </>
        )}

        {tab === 'Lịch sử' && (
          <>
            {/* Revoked Approvals */}
            <PageSection label="Revoked Approvals">
              {REVOKED_APPROVALS.length === 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <Clock size={48} color={c.text3} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: c.text2, fontSize: 13 }}>No revoked approvals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {REVOKED_APPROVALS.map((revoked) => (
                    <div
                      key={revoked.id}
                      className="rounded-xl p-3"
                      style={{ background: c.surface, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                            {revoked.token} → {revoked.spenderName}
                          </p>
                          <p style={{ color: c.text3, fontSize: 11 }}>{revoked.reason}</p>
                        </div>
                        <CheckCircle size={16} color="#10B981" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={10} color={c.text3} />
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          {revoked.revokedAt.toLocaleString('vi-VN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PageSection>

            {/* Stats */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Approval Statistics
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Revoked</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{REVOKED_APPROVALS.length}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Funds Protected</p>
                  <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>$47,200</p>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'Cài đặt' && (
          <>
            {/* Settings */}
            <PageSection label="Security Settings">
              <div className="space-y-3">
                {/* Auto-revoke unused */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                        Auto-revoke Unused Approvals
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        Automatically revoke approvals unused for 90+ days
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoRevokeUnused(!autoRevokeUnused)}
                      className="relative ml-3"
                      style={{
                        width: 48,
                        height: 28,
                        borderRadius: 14,
                        background: autoRevokeUnused ? c.primary : '#6B7280',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        className="absolute top-1 transition-all"
                        style={{
                          left: autoRevokeUnused ? 22 : 2,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: '#fff',
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Warn unlimited */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                        Warn Unlimited Approvals
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        Show warning before approving unlimited amounts
                      </p>
                    </div>
                    <button
                      onClick={() => setWarnUnlimited(!warnUnlimited)}
                      className="relative ml-3"
                      style={{
                        width: 48,
                        height: 28,
                        borderRadius: 14,
                        background: warnUnlimited ? c.primary : '#6B7280',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        className="absolute top-1 transition-all"
                        style={{
                          left: warnUnlimited ? 22 : 2,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: '#fff',
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </PageSection>

            {/* Scan Now */}
            <button
              onClick={() => alert('Scanning for risky approvals...')}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <RefreshCw size={18} />
              Scan for Risky Approvals
            </button>

            {/* Best Practices */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Best Practices
              </p>
              <ul className="space-y-2">
                {[
                  'Regularly review active approvals',
                  'Revoke unused or old approvals',
                  'Avoid unlimited approvals when possible',
                  'Only approve verified contracts',
                  'Check contract security audits',
                ].map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle size={14} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ color: c.text2, fontSize: 11 }}>{tip}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Warning */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <AlertTriangle size={14} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Revoking approvals costs gas. Monitor approvals regularly and revoke suspicious contracts immediately.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}