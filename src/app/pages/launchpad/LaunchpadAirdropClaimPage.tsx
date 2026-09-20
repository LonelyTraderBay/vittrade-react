/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadAirdropClaimPage — Airdrop Claim Center (Phase 4.11)
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  Features: Claim airdrops, view eligibility, track claimed history,
 *            expiring alerts, airdrop types, claim conditions
 */

import React, { useState, useMemo } from 'react';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Gift, CheckCircle, XCircle, Clock, AlertCircle,
  ChevronRight, TrendingUp, Calendar, Award, ExternalLink,
  Info,
} from 'lucide-react';
import {
  MOCK_AIRDROP_CLAIMS, calculateAirdropStats,
  type AirdropClaim,
} from './launchpadData';

const TABS = [
  { key: 'claimable', label: 'Claimable' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'all', label: 'All' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle; bg: string }> = {
  claimable: { label: 'Claimable', color: '#10B981', icon: Gift, bg: 'rgba(16,185,129,0.08)' },
  claimed: { label: 'Claimed', color: '#8B95B3', icon: CheckCircle, bg: 'rgba(139,149,179,0.08)' },
  expired: { label: 'Expired', color: '#EF4444', icon: XCircle, bg: 'rgba(239,68,68,0.08)' },
  pending: { label: 'Pending', color: '#F59E0B', icon: Clock, bg: 'rgba(245,158,11,0.08)' },
  ineligible: { label: 'Ineligible', color: '#8B95B3', icon: XCircle, bg: 'rgba(139,149,179,0.08)' },
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  retroactive: { label: 'Retroactive', color: '#8B5CF6' },
  holder: { label: 'Holder', color: '#3B82F6' },
  staker: { label: 'Staker', color: '#10B981' },
  participant: { label: 'Participant', color: '#F59E0B' },
  referral: { label: 'Referral', color: '#EC4899' },
};

export function LaunchpadAirdropClaimPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState('claimable');
  const [selectedClaim, setSelectedClaim] = useState<AirdropClaim | null>(null);

  const claims = MOCK_AIRDROP_CLAIMS;
  const stats = useMemo(() => calculateAirdropStats(claims), [claims]);

  const filtered = tab === 'claimable' ? claims.filter(c => c.status === 'claimable')
    : tab === 'claimed' ? claims.filter(c => c.status === 'claimed')
      : claims;

  return (
    <PageLayout>
      <Header title="Airdrop Claims" back />

      {/* Claim detail sheet */}
      {selectedClaim && (
        <ClaimDetailSheet
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
        />
      )}

      <PageContent gap="default">
        {/* Stats Hero */}
        <div className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: c.portfolioBg,
            border: `1px solid ${c.portfolioBorder}`,
            boxShadow: c.portfolioShadow,
          }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 65%)' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Gift size={22} color="#10B981" />
              </div>
              <div>
                <h2 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>Airdrop Claims</h2>
                <p style={{ color: c.text3, fontSize: 12 }}>Claim token airdrops</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Claimable', value: stats.totalClaimable + ' tokens', sublabel: stats.totalClaimableUSD, color: '#10B981' },
                { label: 'Claimed', value: stats.totalClaimed + ' tokens', sublabel: stats.totalClaimedUSD, color: '#3B82F6' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
                  <p style={{ color: s.color, fontSize: 13, fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>
                    {s.value}
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{s.sublabel}</p>
                </div>
              ))}
            </div>

            {stats.expiringSoon > 0 && (
              <div className="mt-3 rounded-2xl p-3 flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={14} color="#EF4444" className="shrink-0" />
                <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}>
                  {stats.expiringSoon} airdrop{stats.expiringSoon > 1 ? 's' : ''} hết hạn trong 7 ngày
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <TabBar variant="underline" tabs={TABS.map(t => t.label)} active={TABS.find(t => t.key === tab)?.label || TABS[0].label}
          onChange={(label) => setTab(TABS.find(t => t.label === label)?.key || 'claimable')} />

        {/* List */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: c.surface2 }}>
              <Gift size={40} color={c.text3} className="mx-auto mb-3" />
              <p style={{ color: c.text2, fontSize: 14 }}>
                {tab === 'claimable' ? 'Không có airdrop nào để claim' : 'Không có airdrop nào'}
              </p>
            </div>
          ) : (
            filtered.map(claim => (
              <AirdropClaimCard key={claim.id} claim={claim} onSelect={setSelectedClaim} />
            ))
          )}
        </div>

        {/* Bottom spacer */}
        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   Airdrop Claim Card
   ═══════════════════════════════════════════════════════════ */

function AirdropClaimCard({ claim, onSelect }: {
  claim: AirdropClaim;
  onSelect: (c: AirdropClaim) => void;
}) {
  const c = useThemeColors();
  const statusConfig = STATUS_CONFIG[claim.status];
  const typeConfig = TYPE_LABELS[claim.airdropType];

  // Check if expiring soon (within 7 days)
  const now = new Date();
  const deadline = new Date(claim.claimDeadline);
  const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const expiringSoon = claim.status === 'claimable' && daysUntil <= 7;

  return (
    <TrCard overflow hover>
      <button className="w-full text-left p-4" onClick={() => onSelect(claim)}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold"
            style={{ background: claim.projectLogoColor + '22', border: `2px solid ${claim.projectLogoColor}44`, color: claim.projectLogoColor }}>
            {claim.projectLogo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{claim.projectName}</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                style={{ background: typeConfig.color + '15', color: typeConfig.color }}>
                {typeConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <statusConfig.icon size={12} color={statusConfig.color} />
              <span style={{ color: statusConfig.color, fontSize: 11 }}>{statusConfig.label}</span>
              <span style={{ color: c.text3, fontSize: 11 }}>· {claim.chain}</span>
            </div>
          </div>
          <ChevronRight size={18} color={c.text3} className="shrink-0 mt-2" />
        </div>

        {/* Amount */}
        <div className="rounded-2xl p-3 mb-3" style={{ background: c.surface2 }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Claimable amount</p>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>
                {claim.claimableAmount.toLocaleString()} {claim.projectSymbol}
              </p>
            </div>
            <div className="text-right">
              <p style={{ color: c.text3, fontSize: 10 }}>Value</p>
              <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, marginTop: 2 }}>{claim.usdValue}</p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5, marginBottom: 12 }}>
          {claim.eligibilityReason}
        </p>

        {/* Deadline */}
        {claim.status === 'claimable' && (
          <div className="flex items-center gap-2 p-2 rounded-xl"
            style={{ background: expiringSoon ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)' }}>
            <Calendar size={12} color={expiringSoon ? '#EF4444' : '#F59E0B'} />
            <span style={{ color: expiringSoon ? '#EF4444' : c.text2, fontSize: 11 }}>
              <strong>Deadline:</strong> {claim.claimDeadline}
              {expiringSoon && ' · Sắp hết hạn!'}
            </span>
          </div>
        )}

        {/* Claimed info */}
        {claim.status === 'claimed' && claim.claimedAt && (
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)' }}>
            <CheckCircle size={12} color="#10B981" />
            <span style={{ color: c.text2, fontSize: 11 }}>Claimed: {claim.claimedAt}</span>
          </div>
        )}
      </button>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Claim Detail Sheet
   ═══════════════════════════════════════════════════════════ */

function ClaimDetailSheet({ claim, onClose }: {
  claim: AirdropClaim;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const statusConfig = STATUS_CONFIG[claim.status];

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div className="relative w-full max-h-[85vh] rounded-t-3xl overflow-y-auto"
        style={{ background: c.bg, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 z-10 p-5 flex items-center justify-between"
          style={{ background: c.bg, borderBottom: `1px solid ${c.borderSolid}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold"
              style={{ background: claim.projectLogoColor + '22', color: claim.projectLogoColor }}>
              {claim.projectLogo}
            </div>
            <div>
              <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{claim.projectName}</h3>
              <p style={{ color: c.text3, fontSize: 12 }}>Airdrop Claim</p>
            </div>
          </div>
          <button onClick={onClose} className="hover-ghost" style={{ width: 32, height: 32, borderRadius: 10 }}>
            <CheckCircle size={18} color={c.text3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {/* Status */}
          <div className="rounded-2xl p-4 text-center" style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.color}33` }}>
            <statusConfig.icon size={32} color={statusConfig.color} className="mx-auto mb-2" />
            <p style={{ color: statusConfig.color, fontSize: 16, fontWeight: 700 }}>{statusConfig.label}</p>
          </div>

          {/* Amount */}
          <PageSection label="Claim Details" accentColor={claim.projectLogoColor}>
            <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text3, fontSize: 11 }}>Claimable</span>
                <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                  {claim.claimableAmount.toLocaleString()} {claim.projectSymbol}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text3, fontSize: 11 }}>USD Value</span>
                <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>{claim.usdValue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: 11 }}>Deadline</span>
                <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{claim.claimDeadline}</span>
              </div>
            </div>
          </PageSection>

          {/* Conditions */}
          <PageSection label="Claim Conditions" accentColor="#3B82F6">
            <div className="flex flex-col gap-2">
              {claim.claimConditions.map(cond => (
                <div key={cond.id} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: c.surface2 }}>
                  {cond.met ? <CheckCircle size={14} color="#10B981" /> : <XCircle size={14} color="#8B95B3" />}
                  <div className="flex-1">
                    <p style={{ color: cond.met ? c.text1 : c.text3, fontSize: 12, fontWeight: 600 }}>
                      {cond.label} {cond.required && '*'}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{cond.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </PageSection>

          {/* Info */}
          {claim.status === 'claimable' && (
            <>
              <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <Info size={14} color="#10B981" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Tất cả conditions đã được thỏa. Bạn có thể claim airdrop này trước {claim.claimDeadline}.
                </p>
              </div>

              <CTAButton>Claim {claim.claimableAmount.toLocaleString()} {claim.projectSymbol}</CTAButton>
            </>
          )}

          {claim.status === 'claimed' && claim.claimTxHash && (
            <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 6 }}>Transaction Hash</p>
              <div className="flex items-center gap-2">
                <code style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace', flex: 1 }}>
                  {claim.claimTxHash}
                </code>
                <ExternalLink size={14} color={c.text3} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}