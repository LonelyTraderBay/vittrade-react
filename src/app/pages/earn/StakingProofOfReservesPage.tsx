import React, { useState } from 'react';
import { Shield, ExternalLink, CheckCircle2, AlertTriangle, Eye, Copy, TrendingUp } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { fmtUsd } from '../../data/formatNumber';
import { toast } from 'sonner';

interface AssetReserve {
  asset: string;
  onChainBalance: number;
  userLiabilities: number;
  reserveRatio: number;
  lastUpdated: string;
  walletAddress: string;
  explorer: string;
}

const POR_DATA: Record<string, AssetReserve> = {
  ETH: {
    asset: 'ETH',
    onChainBalance: 125430.50,
    userLiabilities: 122000.00,
    reserveRatio: 102.8,
    lastUpdated: '2026-03-07T14:30:00Z',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    explorer: 'etherscan.io',
  },
  BTC: {
    asset: 'BTC',
    onChainBalance: 2100.25,
    userLiabilities: 2050.00,
    reserveRatio: 102.5,
    lastUpdated: '2026-03-07T14:30:00Z',
    walletAddress: 'bc1q...xyz',
    explorer: 'blockchain.com',
  },
  SOL: {
    asset: 'SOL',
    onChainBalance: 850000.00,
    userLiabilities: 820000.00,
    reserveRatio: 103.7,
    lastUpdated: '2026-03-07T14:30:00Z',
    walletAddress: 'DYw8...ABC',
    explorer: 'solscan.io',
  },
};

const OVERALL_DATA = {
  totalAssetsUSD: 350000000,
  totalLiabilitiesUSD: 340000000,
  reserveRatio: 102.9,
  lastAudit: '2026-03-01',
};

const AUDIT_REPORTS = [
  {
    id: 'por-202603',
    auditor: 'Armanino LLP',
    date: '2026-03-01',
    status: 'verified' as const,
    reportUrl: '/por/armanino-march-2026.pdf',
    findings: 'All liabilities covered. Reserve ratio: 102.9%. No discrepancies found.',
  },
  {
    id: 'por-202602',
    auditor: 'Armanino LLP',
    date: '2026-02-01',
    status: 'verified' as const,
    reportUrl: '/por/armanino-feb-2026.pdf',
    findings: 'Reserve ratio: 102.5%. All balances verified on-chain.',
  },
  {
    id: 'por-202601',
    auditor: 'Armanino LLP',
    date: '2026-01-01',
    status: 'verified' as const,
    reportUrl: '/por/armanino-jan-2026.pdf',
    findings: 'Reserve ratio: 101.8%. Surplus increased by 3.2% MoM.',
  },
];

const POR_HISTORY = [
  { month: 'Apr 2025', ratio: 101.2 },
  { month: 'May 2025', ratio: 101.5 },
  { month: 'Jun 2025', ratio: 101.7 },
  { month: 'Jul 2025', ratio: 101.8 },
  { month: 'Aug 2025', ratio: 102.0 },
  { month: 'Sep 2025', ratio: 102.1 },
  { month: 'Oct 2025', ratio: 102.3 },
  { month: 'Nov 2025', ratio: 102.4 },
  { month: 'Dec 2025', ratio: 102.5 },
  { month: 'Jan 2026', ratio: 101.8 },
  { month: 'Feb 2026', ratio: 102.5 },
  { month: 'Mar 2026', ratio: 102.9 },
];

// Mock Merkle Tree verification
interface MerkleProof {
  userId: string;
  balance: number;
  leaf: string;
  siblings: string[];
  root: string;
  verified: boolean;
}

function generateMockMerkleProof(userId: string, balance: number): MerkleProof {
  return {
    userId,
    balance,
    leaf: `0x${Math.random().toString(16).substr(2, 64)}`,
    siblings: [
      `0x${Math.random().toString(16).substr(2, 64)}`,
      `0x${Math.random().toString(16).substr(2, 64)}`,
      `0x${Math.random().toString(16).substr(2, 64)}`,
    ],
    root: '0xabc123def456789012345678901234567890123456789012345678901234567890',
    verified: true,
  };
}

export function StakingProofOfReservesPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'overview' | 'assets' | 'verify'>('overview');
  const [showVerifySheet, setShowVerifySheet] = useState(false);
  const [merkleProof, setMerkleProof] = useState<MerkleProof | null>(null);
  const [verifyUserId, setVerifyUserId] = useState('');
  const [verifyBalance, setVerifyBalance] = useState('');

  const overallRatio = OVERALL_DATA.reserveRatio;
  const circleProgress = Math.min((overallRatio / 150) * 100, 100);

  const handleVerify = () => {
    if (!verifyUserId || !verifyBalance) {
      toast.error('Please enter both User ID and Balance');
      return;
    }

    const proof = generateMockMerkleProof(verifyUserId, parseFloat(verifyBalance));
    setMerkleProof(proof);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <PageLayout>
      <Header title="Proof of Reserves" back />

      {/* Merkle Verification Sheet */}
      <BottomSheetV2
        open={showVerifySheet}
        onClose={() => {
          setShowVerifySheet(false);
          setMerkleProof(null);
          setVerifyUserId('');
          setVerifyBalance('');
        }}
        title="Verify Your Balance">
        {!merkleProof ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Enter your User ID and staked balance to verify inclusion in the Merkle tree. This proves your balance is included in our Proof of Reserves.
              </p>
            </div>

            <div>
              <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>
                User ID
              </label>
              <input
                type="text"
                value={verifyUserId}
                onChange={e => setVerifyUserId(e.target.value)}
                placeholder="e.g., user_12345"
                className="w-full p-3 rounded-xl text-sm"
                style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}
              />
            </div>

            <div>
              <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>
                Staked Balance (ETH)
              </label>
              <input
                type="number"
                value={verifyBalance}
                onChange={e => setVerifyBalance(e.target.value)}
                placeholder="e.g., 10.5"
                step="0.01"
                className="w-full p-3 rounded-xl text-sm"
                style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}
              />
            </div>

            <button
              onClick={handleVerify}
              className="w-full py-3 rounded-[14px] text-sm font-semibold"
              style={{ background: c.primary, color: '#FFF' }}>
              Verify Inclusion
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {merkleProof.verified ? (
              <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle2 size={48} color="#10B981" className="mx-auto mb-3" />
                <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  Verification Successful
                </p>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                  Your balance of <strong>{merkleProof.balance} ETH</strong> is included in the Proof of Reserves Merkle tree.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={48} color="#EF4444" className="mx-auto mb-3" />
                <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  Verification Failed
                </p>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                  Balance not found in Merkle tree. Please check your inputs.
                </p>
              </div>
            )}

            <div>
              <p style={{ color: c.text2, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Merkle Proof
              </p>
              <div className="space-y-2">
                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Leaf Hash</p>
                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {merkleProof.leaf.substring(0, 20)}...{merkleProof.leaf.substring(merkleProof.leaf.length - 10)}
                    </p>
                    <Copy size={12} color={c.text3} className="cursor-pointer shrink-0 ml-2" onClick={() => handleCopy(merkleProof.leaf)} />
                  </div>
                </div>

                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Merkle Root</p>
                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {merkleProof.root.substring(0, 20)}...{merkleProof.root.substring(merkleProof.root.length - 10)}
                    </p>
                    <Copy size={12} color={c.text3} className="cursor-pointer shrink-0 ml-2" onClick={() => handleCopy(merkleProof.root)} />
                  </div>
                </div>

                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Sibling Hashes ({merkleProof.siblings.length})</p>
                  {merkleProof.siblings.map((sibling, idx) => (
                    <p key={idx} style={{ color: c.text2, fontSize: 9, fontFamily: 'monospace', marginBottom: 2 }}>
                      {idx + 1}. {sibling.substring(0, 16)}...{sibling.substring(sibling.length - 8)}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowVerifySheet(false);
                setMerkleProof(null);
                setVerifyUserId('');
                setVerifyBalance('');
              }}
              className="w-full py-3 rounded-[14px] text-sm font-semibold"
              style={{ background: c.surface2, color: c.text1 }}>
              Close
            </button>
          </div>
        )}
      </BottomSheetV2>

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
          <div className="flex gap-3">
            <Shield size={20} color="#10B981" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Cryptographic Proof of Reserves
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                All reserves are verifiable on-chain. Third-party audited monthly. Users can verify their balance inclusion via Merkle tree proofs.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'assets', label: 'By Asset' },
            { id: 'verify', label: 'Verify' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'overview' && (
          <>
            {/* Overall Reserve Ratio */}
            <PageSection label="Overall Reserve Status">
              <TrCard className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>Total Assets (USD)</p>
                    <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                      {fmtUsd(OVERALL_DATA.totalAssetsUSD)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>Reserve Ratio</p>
                    <div className="flex items-baseline gap-1">
                      <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                        {OVERALL_DATA.reserveRatio}%
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>≥ 100%</p>
                    </div>
                  </div>
                </div>

                {/* Circular Progress */}
                <div className="relative mx-auto" style={{ width: 160, height: 160 }}>
                  <svg width="160" height="160" className="transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={c.surface2}
                      strokeWidth="14"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#10B981"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - circleProgress / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <CheckCircle2 size={32} color="#10B981" className="mb-2" />
                    <p style={{ color: '#10B981', fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
                      {OVERALL_DATA.reserveRatio}%
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>Covered</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>User Liabilities</p>
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                      {fmtUsd(OVERALL_DATA.totalLiabilitiesUSD)}
                    </p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Surplus</p>
                    <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                      {fmtUsd(OVERALL_DATA.totalAssetsUSD - OVERALL_DATA.totalLiabilitiesUSD)}
                    </p>
                  </div>
                </div>

                <p style={{ color: c.text3, fontSize: 10, textAlign: 'center', marginTop: 12 }}>
                  Last updated: {new Date().toLocaleString('en-GB')} • Live data
                </p>
              </TrCard>
            </PageSection>

            {/* Historical Trend */}
            <PageSection label="Reserve Ratio Trend (12 Months)">
              <TrCard className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={POR_HISTORY}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.borderSolid} />
                    <XAxis key="x-axis" dataKey="month" tick={{ fill: c.text3, fontSize: 10 }} />
                    <YAxis key="y-axis" tick={{ fill: c.text3, fontSize: 10 }} domain={[100, 104]} />
                    <Tooltip
                      key="tooltip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.borderSolid}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => `${value}%`}
                    />
                    <Line
                      key="line-ratio"
                      type="monotone"
                      dataKey="ratio"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: '#10B981', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} color="#10B981" />
                    <p style={{ color: c.text2, fontSize: 11 }}>
                      +1.7% YoY
                    </p>
                  </div>
                  <div className="w-1 h-1 rounded-full" style={{ background: c.borderSolid }} />
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    Always ≥ 100%
                  </p>
                </div>
              </TrCard>
            </PageSection>

            {/* Third-party Audits */}
            <PageSection label="Third-Party Audit Reports">
              <div className="flex flex-col gap-2">
                {AUDIT_REPORTS.map(report => (
                  <TrCard key={report.id} hover className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                          {report.auditor}
                        </p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          {new Date(report.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                        Verified
                      </span>
                    </div>

                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                      {report.findings}
                    </p>

                    <button
                      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: c.surface2, color: c.text1 }}>
                      <ExternalLink size={16} />
                      Download Report (PDF)
                    </button>
                  </TrCard>
                ))}
              </div>
            </PageSection>
          </>
        )}

        {tab === 'assets' && (
          <PageSection label="Reserve Ratio by Asset">
            <div className="flex flex-col gap-3">
              {Object.values(POR_DATA).map(asset => {
                const progress = Math.min((asset.reserveRatio / 150) * 100, 100);
                return (
                  <TrCard key={asset.asset} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                          {asset.asset}
                        </p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          Updated: {new Date(asset.lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                          {asset.reserveRatio}%
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>Reserve Ratio</p>
                      </div>
                    </div>

                    <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: c.surface2 }}>
                      <div
                        className="h-full transition-all duration-500"
                        style={{ background: '#10B981', width: `${progress}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>On-Chain Balance</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                          {asset.onChainBalance.toLocaleString()} {asset.asset}
                        </p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>User Liabilities</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                          {asset.userLiabilities.toLocaleString()} {asset.asset}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-2">
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Wallet Address</p>
                          <p style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {asset.walletAddress}
                          </p>
                        </div>
                        <a
                          href={`https://${asset.explorer}/address/${asset.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold shrink-0"
                          style={{ background: c.bg, color: '#3B82F6' }}>
                          <ExternalLink size={12} />
                          Verify
                        </a>
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </PageSection>
        )}

        {tab === 'verify' && (
          <>
            <PageSection label="Verify Your Balance">
              <TrCard className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <Eye size={24} color="#3B82F6" />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                      Merkle Tree Verification
                    </p>
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                      Prove your staked balance is included in our Proof of Reserves using cryptographic Merkle tree proofs.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowVerifySheet(true)}
                  className="w-full py-3 rounded-[14px] text-sm font-semibold"
                  style={{ background: c.primary, color: '#FFF' }}>
                  Verify My Balance
                </button>
              </TrCard>
            </PageSection>

            <PageSection label="How Verification Works">
              <div className="flex flex-col gap-3">
                {[
                  {
                    step: 1,
                    title: 'Merkle Tree Generation',
                    desc: 'All user balances are hashed and organized into a Merkle tree. The root hash represents the entire set of balances.',
                  },
                  {
                    step: 2,
                    title: 'Proof Generation',
                    desc: 'When you verify, you receive a cryptographic proof (sibling hashes) that links your balance to the Merkle root.',
                  },
                  {
                    step: 3,
                    title: 'Independent Verification',
                    desc: 'You can verify the proof independently without revealing other users\' data. The Merkle root is published publicly.',
                  },
                  {
                    step: 4,
                    title: 'Audit Confirmation',
                    desc: 'Third-party auditors verify the Merkle root matches on-chain balances, ensuring 100% coverage.',
                  },
                ].map(item => (
                  <TrCard key={item.step} className="p-4">
                    <div className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: c.primary, color: '#FFF', fontSize: 14, fontWeight: 700 }}>
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                          {item.title}
                        </p>
                        <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.6 }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                💡 <strong>Privacy Note:</strong> Merkle tree verification allows you to prove inclusion without revealing your exact balance to others. Only the hash of your balance is used in the tree.
              </p>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Proof of Reserves is updated in real-time. On-chain balances are verified every 10 minutes. Third-party audits conducted monthly by Armanino LLP. Merkle root published publicly at por.platform.com.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}