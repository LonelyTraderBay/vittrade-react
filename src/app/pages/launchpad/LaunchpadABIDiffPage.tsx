/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadABIDiffPage — ABI Diff View for Proxy Upgrades (Phase 4.9)
 * ══════════════════════════════════════════════════════════════
 *  Pattern A — Standard Page
 *  Features: Side-by-side ABI comparison, change type highlighting,
 *            risk level indicators, diff summary, signature comparison,
 *            risk score gauge, filter by change type, detail expansion
 */

import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import {
  Plus, Minus, RefreshCw, Check,
  AlertTriangle, Shield, ShieldAlert, ShieldX, ShieldCheck,
  ChevronDown, ChevronUp, Copy,
  Code2, Zap, GitCompare,
} from 'lucide-react';
import {
  generateMockABIDiff, truncateAddress,
  type ABIDiffResult, type ABIDiffEntry, type ABIDiffChangeType,
} from './launchpadData';

const CHANGE_CONFIG: Record<ABIDiffChangeType, { label: string; color: string; bg: string; icon: typeof Plus }> = {
  added: { label: 'Added', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: Plus },
  removed: { label: 'Removed', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: Minus },
  modified: { label: 'Modified', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: RefreshCw },
  unchanged: { label: 'Unchanged', color: '#8B95B3', bg: 'rgba(139,149,179,0.06)', icon: Check },
};

const RISK_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  none: { label: 'None', color: '#8B95B3', icon: Shield },
  low: { label: 'Low', color: '#10B981', icon: ShieldCheck },
  medium: { label: 'Medium', color: '#F59E0B', icon: Shield },
  high: { label: 'High', color: '#EF4444', icon: ShieldAlert },
  critical: { label: 'Critical', color: '#DC2626', icon: ShieldX },
};

type FilterMode = 'all' | ABIDiffChangeType;

export function LaunchpadABIDiffPage() {
  const c = useThemeColors();
  const { contractId } = useParams<{ contractId: string }>();

  const [diff] = useState<ABIDiffResult>(() => generateMockABIDiff(contractId || ''));
  const [filter, setFilter] = useState<FilterMode>('all');
  const [showFunctionsOnly, setShowFunctionsOnly] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    let entries = diff.entries;
    if (filter !== 'all') entries = entries.filter(e => e.changeType === filter);
    if (showFunctionsOnly) entries = entries.filter(e => e.type === 'function');
    return entries;
  }, [diff.entries, filter, showFunctionsOnly]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const riskColor = diff.riskScore >= 80 ? '#EF4444' : diff.riskScore >= 60 ? '#F59E0B' : diff.riskScore >= 40 ? '#3B82F6' : '#10B981';

  return (
    <PageLayout>
      <Header title="ABI Diff" back />

      <PageContent gap="default">
        {/* Upgrade Summary Hero */}
        <TrCard variant="hero" className="p-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
            style={{ background: `radial-gradient(circle, ${riskColor}20 0%, transparent 65%)` }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <GitCompare size={16} color="rgba(255,255,255,0.6)" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Proxy Upgrade Detected</span>
            </div>

            {/* Risk score gauge */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke={riskColor} strokeWidth="4"
                    strokeDasharray={`${(diff.riskScore / 100) * 175.9} 175.9`}
                    strokeLinecap="round" transform="rotate(-90 32 32)" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ color: riskColor, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                    {diff.riskScore}
                  </span>
                </div>
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Risk Score</p>
                <p style={{ color: riskColor, fontSize: 12, fontWeight: 600 }}>
                  {diff.riskScore >= 80 ? 'Cao — Can xem xet ky' : diff.riskScore >= 60 ? 'Trung binh — Co thay doi dang chu y' : 'Thap — Thay doi nho'}
                </p>
              </div>
            </div>

            {/* Version comparison */}
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8 }}>OLD</p>
                <p style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{diff.oldImplLabel}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}>
                  {truncateAddress(diff.oldImpl)}
                </p>
              </div>
              <Zap size={14} color="rgba(255,255,255,0.3)" />
              <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8 }}>NEW</p>
                <p style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>{diff.newImplLabel}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}>
                  {truncateAddress(diff.newImpl)}
                </p>
              </div>
            </div>
          </div>
        </TrCard>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          {([
            { key: 'added', count: diff.summary.added },
            { key: 'removed', count: diff.summary.removed },
            { key: 'modified', count: diff.summary.modified },
            { key: 'unchanged', count: diff.summary.unchanged },
          ] as const).map(item => {
            const cfg = CHANGE_CONFIG[item.key];
            const Icon = cfg.icon;
            return (
              <TrCard key={item.key} as="button"
                onClick={() => setFilter(filter === item.key ? 'all' : item.key)}
                className="p-3 text-center"
                style={{ border: filter === item.key ? `1.5px solid ${cfg.color}40` : undefined }}>
                <Icon size={14} color={cfg.color} className="mx-auto mb-1" />
                <p style={{ color: c.text1, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>{item.count}</p>
                <p style={{ color: cfg.color, fontSize: 9, fontWeight: 600 }}>{cfg.label}</p>
              </TrCard>
            );
          })}
        </div>

        {/* Upgrade metadata */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={14} color="#6366F1" />
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Thong tin upgrade</p>
          </div>
          <div className="flex flex-col gap-0">
            {[
              { label: 'Contract', value: truncateAddress(diff.contractAddress), mono: true, copyable: diff.contractAddress },
              { label: 'Chain', value: diff.chain },
              { label: 'Block', value: `#${diff.upgradeBlock.toLocaleString()}` },
              { label: 'Thời gian', value: diff.upgradeTimestamp },
              { label: 'Tx Hash', value: truncateAddress(diff.upgradeTxHash), mono: true, copyable: diff.upgradeTxHash },
              { label: 'Functions', value: `${diff.totalFunctions.old} → ${diff.totalFunctions.new}` },
              { label: 'Events', value: `${diff.totalEvents.old} → ${diff.totalEvents.new}` },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: 11 }}>{row.label}</span>
                <div className="flex items-center gap-1">
                  <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: row.mono ? 'monospace' : undefined }}>
                    {row.value}
                  </span>
                  {row.copyable && (
                    <button onClick={() => handleCopy(row.copyable!, row.label)} className="p-0.5">
                      {copiedField === row.label
                        ? <Check size={10} color="#10B981" />
                        : <Copy size={10} color={c.text3} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFunctionsOnly(!showFunctionsOnly)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
            style={{
              background: showFunctionsOnly ? 'rgba(99,102,241,0.1)' : c.surface2,
              border: `1px solid ${showFunctionsOnly ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
              color: showFunctionsOnly ? '#6366F1' : c.text3,
              fontSize: 11,
            }}>
            <Code2 size={11} />
            Functions only
          </button>
          <div className="flex-1" />
          <span style={{ color: c.text3, fontSize: 10 }}>
            {filteredEntries.length} entries
          </span>
        </div>

        {/* Diff entries */}
        <PageSection label="ABI Changes" accentColor="#8B5CF6">
          <div className="flex flex-col gap-2">
            {filteredEntries.map(entry => (
              <DiffEntryCard
                key={entry.name + entry.type}
                entry={entry}
                expanded={expandedEntry === entry.name}
                onToggle={() => setExpandedEntry(expandedEntry === entry.name ? null : entry.name)}
              />
            ))}
          </div>
        </PageSection>

        {filteredEntries.length === 0 && (
          <TrCard className="p-8 text-center">
            <Code2 size={32} color={c.text3} className="mx-auto mb-3 opacity-40" />
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Khong co thay doi nao</p>
            <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>Thu thay doi bo loc</p>
          </TrCard>
        )}

        {/* Warning banner */}
        <div className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Day la so sanh ABI tu dong. Can kiem tra source code thuc te de hieu day du anh huong cua cac thay doi.
            Lien he doi bao mat neu phat hien rui ro cao.
          </p>
        </div>

        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   DiffEntryCard — single ABI diff entry
   ═══════════════════════════════════════════════════════════ */

function DiffEntryCard({ entry, expanded, onToggle }: {
  entry: ABIDiffEntry; expanded: boolean; onToggle: () => void;
}) {
  const c = useThemeColors();
  const changeCfg = CHANGE_CONFIG[entry.changeType];
  const riskCfg = RISK_CONFIG[entry.riskLevel];
  const ChangeIcon = changeCfg.icon;
  const RiskIcon = riskCfg.icon;

  return (
    <TrCard className="overflow-hidden"
      style={{ borderLeft: `3px solid ${changeCfg.color}` }}>
      <button className="w-full p-3 text-left" onClick={onToggle}>
        <div className="flex items-start gap-2.5">
          {/* Change type indicator */}
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: changeCfg.bg }}>
            <ChangeIcon size={11} color={changeCfg.color} />
          </div>

          {/* Function info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                {entry.name}
              </span>
              <span className="px-1.5 py-px rounded"
                style={{ background: c.surface2, color: c.text3, fontSize: 8, fontWeight: 600 }}>
                {entry.type}
              </span>
            </div>

            {/* Tags row */}
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-px rounded"
                style={{ background: changeCfg.bg, color: changeCfg.color, fontSize: 8, fontWeight: 700 }}>
                {changeCfg.label.toUpperCase()}
              </span>
              {entry.riskLevel !== 'none' && (
                <span className="flex items-center gap-0.5 px-1.5 py-px rounded"
                  style={{ background: riskCfg.color + '12', color: riskCfg.color, fontSize: 8, fontWeight: 600 }}>
                  <RiskIcon size={8} />
                  {riskCfg.label}
                </span>
              )}
            </div>
          </div>

          {/* Expand */}
          {expanded
            ? <ChevronUp size={14} color={c.text3} />
            : <ChevronDown size={14} color={c.text3} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3" style={{ borderTop: `1px solid ${c.border}` }}>
          {/* Signatures */}
          {entry.oldSignature && (
            <div className="mt-2 mb-1">
              <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Old signature</p>
              <div className="rounded-lg px-2.5 py-1.5"
                style={{ background: entry.changeType === 'removed' ? 'rgba(239,68,68,0.06)' : c.surface2 }}>
                <code style={{
                  color: entry.changeType === 'removed' ? '#EF4444' : c.text2,
                  fontSize: 10, fontFamily: 'monospace',
                  textDecoration: entry.changeType === 'removed' ? 'line-through' : undefined,
                }}>
                  {entry.oldSignature}
                </code>
              </div>
            </div>
          )}
          {entry.newSignature && (
            <div className="mb-2">
              <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>New signature</p>
              <div className="rounded-lg px-2.5 py-1.5"
                style={{ background: entry.changeType === 'added' ? 'rgba(16,185,129,0.06)' : c.surface2 }}>
                <code style={{
                  color: entry.changeType === 'added' ? '#10B981' : c.text1,
                  fontSize: 10, fontFamily: 'monospace',
                }}>
                  {entry.newSignature}
                </code>
              </div>
            </div>
          )}

          {/* Metadata rows */}
          <div className="flex flex-col gap-0">
            {entry.oldVisibility && (
              <div className="flex justify-between py-1" style={{ borderBottom: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: 10 }}>Visibility</span>
                <span style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace' }}>
                  {entry.oldVisibility}{entry.newVisibility && entry.oldVisibility !== entry.newVisibility ? ` → ${entry.newVisibility}` : ''}
                </span>
              </div>
            )}
            {entry.newVisibility && !entry.oldVisibility && (
              <div className="flex justify-between py-1" style={{ borderBottom: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: 10 }}>Visibility</span>
                <span style={{ color: '#10B981', fontSize: 10, fontFamily: 'monospace' }}>{entry.newVisibility}</span>
              </div>
            )}
            {entry.oldStateMutability && (
              <div className="flex justify-between py-1" style={{ borderBottom: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: 10 }}>State mutability</span>
                <span style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace' }}>
                  {entry.oldStateMutability}{entry.newStateMutability && entry.oldStateMutability !== entry.newStateMutability ? ` → ${entry.newStateMutability}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Risk note */}
          {entry.riskNote && (
            <div className="rounded-xl p-2.5 mt-2 flex items-start gap-2"
              style={{ background: riskCfg.color + '08', border: `1px solid ${riskCfg.color}15` }}>
              <RiskIcon size={12} color={riskCfg.color} className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>{entry.riskNote}</p>
            </div>
          )}
        </div>
      )}
    </TrCard>
  );
}