/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadMultisigPage — Multi-sig Transaction Builder (Phase 4.10)
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  Features: Safe overview, transaction queue, signature collection,
 *            create new tx, signer management, execution,
 *            transaction history
 */

import React, { useState, useMemo } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Users, Shield, ShieldCheck, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Copy, Check, AlertTriangle,
  Zap, Plus, Info, X, Lock,
  FileText, PenLine,
} from 'lucide-react';
import {
  loadMultisigTxs, saveMultisigTxs,
  MOCK_MULTISIG_SAFES,
  type MultisigTransaction, type MultisigSafe, type MultisigTxStatus,
} from './launchpadData';

const TABS = ['queue', 'history', 'safes'];

const STATUS_CONFIG: Record<MultisigTxStatus, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: '#8B95B3', icon: FileText },
  pending_signatures: { label: 'Chờ ký', color: '#F59E0B', icon: PenLine },
  ready: { label: 'San sang', color: '#10B981', icon: CheckCircle },
  executing: { label: 'Đang xử lý', color: '#3B82F6', icon: Zap },
  executed: { label: 'Da thuc hien', color: '#10B981', icon: CheckCircle },
  expired: { label: 'Het han', color: '#EF4444', icon: XCircle },
  cancelled: { label: 'Da huy', color: '#8B95B3', icon: XCircle },
};

export function LaunchpadMultisigPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState('queue');
  const [txs, setTxs] = useState<MultisigTransaction[]>(() => loadMultisigTxs());
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSafe, setSelectedSafe] = useState<string>(MOCK_MULTISIG_SAFES[0].address);

  const currentSafe = MOCK_MULTISIG_SAFES.find(s => s.address === selectedSafe)!;

  const queueTxs = useMemo(() => txs.filter(t =>
    ['draft', 'pending_signatures', 'ready', 'executing'].includes(t.status) && t.safeAddress === selectedSafe
  ), [txs, selectedSafe]);

  const historyTxs = useMemo(() => txs.filter(t =>
    ['executed', 'expired', 'cancelled'].includes(t.status) && t.safeAddress === selectedSafe
  ), [txs, selectedSafe]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSign = (txId: string) => {
    const updated = txs.map(tx => {
      if (tx.id !== txId) return tx;
      const signers = tx.signers.map(s =>
        s.address === '0x8Ba1...BA72' && !s.signed
          ? { ...s, signed: true, signedAt: new Date().toLocaleString() }
          : s
      );
      const signedCount = signers.filter(s => s.signed).length;
      const status: MultisigTxStatus = signedCount >= tx.threshold ? 'ready' : 'pending_signatures';
      return { ...tx, signers, signedCount, status };
    });
    setTxs(updated);
    saveMultisigTxs(updated);
  };

  const handleExecute = (txId: string) => {
    const updated = txs.map(tx => {
      if (tx.id !== txId) return tx;
      return {
        ...tx, status: 'executed' as MultisigTxStatus,
        executedAt: new Date().toLocaleString(),
        executeTxHash: '0xExec...' + Math.random().toString(36).slice(2, 6),
      };
    });
    setTxs(updated);
    saveMultisigTxs(updated);
  };

  return (
    <PageLayout>
      <Header title="Multi-sig" back />

      {/* Safe selector */}
      <div className="px-5 pt-2 pb-1">
        <div className="flex gap-2">
          {MOCK_MULTISIG_SAFES.map(safe => (
            <button key={safe.address} onClick={() => setSelectedSafe(safe.address)}
              className="flex-1 rounded-2xl p-3 text-left hover:opacity-90 transition-opacity active:scale-[0.98]"
              style={{
                background: selectedSafe === safe.address ? safe.chainColor + '10' : c.surface2,
                border: `1.5px solid ${selectedSafe === safe.address ? safe.chainColor + '35' : 'transparent'}`,
              }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: safe.chainColor + '18' }}>
                  <Shield size={12} color={safe.chainColor} />
                </div>
                <span style={{ color: c.text1, fontSize: 11, fontWeight: 700 }}>{safe.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: safe.chainColor, fontSize: 9, fontWeight: 600 }}>{safe.chain}</span>
                <span style={{ color: c.text3, fontSize: 9 }}>{safe.threshold}/{safe.owners.length}</span>
              </div>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 800, fontFamily: 'monospace', marginTop: 4 }}>
                {safe.balance}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Safe stats */}
      <div className="px-5 pt-1 pb-1">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(99,102,241,0.06)' }}>
            <p style={{ color: '#6366F1', fontSize: 14, fontWeight: 800, fontFamily: 'monospace' }}>{currentSafe.threshold}/{currentSafe.owners.length}</p>
            <p style={{ color: c.text3, fontSize: 9 }}>Threshold</p>
          </div>
          <div className="rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(245,158,11,0.06)' }}>
            <p style={{ color: '#F59E0B', fontSize: 14, fontWeight: 800, fontFamily: 'monospace' }}>{queueTxs.length}</p>
            <p style={{ color: c.text3, fontSize: 9 }}>Pending</p>
          </div>
          <div className="rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(16,185,129,0.06)' }}>
            <p style={{ color: '#10B981', fontSize: 14, fontWeight: 800, fontFamily: 'monospace' }}>{currentSafe.txCount}</p>
            <p style={{ color: c.text3, fontSize: 9 }}>Total Tx</p>
          </div>
        </div>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'queue' && (
          <>
            {/* Create tx button */}
            <button onClick={() => setShowCreate(true)}
              className="w-full rounded-2xl p-3 flex items-center gap-3 hover:opacity-90 transition-opacity active:scale-[0.98]"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px dashed rgba(99,102,241,0.3)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.12)' }}>
                <Plus size={18} color="#6366F1" />
              </div>
              <div className="text-left">
                <p style={{ color: '#6366F1', fontSize: 13, fontWeight: 700 }}>Tao giao dich moi</p>
                <p style={{ color: c.text3, fontSize: 11 }}>Tao tx can nhieu chu ky</p>
              </div>
            </button>

            {/* Queue */}
            <PageSection label="Hàng đợi giao dịch" accentColor="#F59E0B">
              <div className="flex flex-col gap-2">
                {queueTxs.map(tx => (
                  <TxCard key={tx.id} tx={tx}
                    expanded={expandedTx === tx.id}
                    onToggle={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                    onSign={() => handleSign(tx.id)}
                    onExecute={() => handleExecute(tx.id)}
                    copiedField={copiedField}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            </PageSection>

            {queueTxs.length === 0 && (
              <TrCard className="p-8 text-center">
                <Users size={32} color={c.text3} className="mx-auto mb-3 opacity-40" />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Khong co giao dich cho xu ly</p>
                <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>Tao giao dich moi de bat dau</p>
              </TrCard>
            )}
          </>
        )}

        {tab === 'history' && (
          <PageSection label="Giao dịch đã hoàn tất" accentColor="#10B981">
            <div className="flex flex-col gap-2">
              {historyTxs.map(tx => (
                <TxCard key={tx.id} tx={tx}
                  expanded={expandedTx === tx.id}
                  onToggle={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                  copiedField={copiedField}
                  onCopy={handleCopy}
                />
              ))}
            </div>
            {historyTxs.length === 0 && (
              <TrCard className="p-8 text-center">
                <Clock size={32} color={c.text3} className="mx-auto mb-3 opacity-40" />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Chua co lich su</p>
              </TrCard>
            )}
          </PageSection>
        )}

        {tab === 'safes' && (
          <PageSection label="Owners & Signers" accentColor="#8B5CF6">
            <div className="flex flex-col gap-2">
              {currentSafe.owners.map(owner => (
                <TrCard key={owner.address} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: owner.role === 'owner' ? 'rgba(139,92,246,0.12)' : 'rgba(59,130,246,0.12)' }}>
                      {owner.role === 'owner'
                        ? <ShieldCheck size={16} color="#8B5CF6" />
                        : <Users size={16} color="#3B82F6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{owner.label}</span>
                        <span className="px-1.5 py-px rounded"
                          style={{
                            background: owner.role === 'owner' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)',
                            color: owner.role === 'owner' ? '#8B5CF6' : '#3B82F6',
                            fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
                          }}>
                          {owner.role}
                        </span>
                      </div>
                      <p style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>{owner.address}</p>
                    </div>
                    <button onClick={() => handleCopy(owner.address, owner.label)} className="p-1">
                      {copiedField === owner.label
                        ? <Check size={12} color="#10B981" />
                        : <Copy size={12} color={c.text3} />}
                    </button>
                  </div>
                </TrCard>
              ))}
            </div>

            <TrCard className="p-3 mt-3">
              <div className="flex items-center gap-2">
                <Info size={12} color="#6366F1" />
                <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>Thong tin Safe</span>
              </div>
              <div className="flex flex-col gap-0 mt-2">
                {[
                  { label: 'Address', value: currentSafe.address, mono: true },
                  { label: 'Chain', value: currentSafe.chain },
                  { label: 'Threshold', value: `${currentSafe.threshold} of ${currentSafe.owners.length}` },
                  { label: 'Balance', value: currentSafe.balance },
                  { label: 'Total Tx', value: `${currentSafe.txCount}` },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text3, fontSize: 10 }}>{row.label}</span>
                    <span style={{ color: c.text1, fontSize: 10, fontWeight: 600, fontFamily: row.mono ? 'monospace' : undefined }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </TrCard>
          </PageSection>
        )}

        {/* Security notice */}
        <div className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
          <Lock size={13} color="#8B5CF6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Multi-sig yeu cau {currentSafe.threshold}/{currentSafe.owners.length} chu ky truoc khi thuc hien.
            Moi giao dich co thoi han 7 ngay. Dam bao tat ca signers xac nhan truoc khi het han.
          </p>
        </div>

        <div className="h-[60px]" />
      </PageContent>

      {/* Create Tx Sheet */}
      {showCreate && (
        <CreateTxSheet
          safe={currentSafe}
          onClose={() => setShowCreate(false)}
          onCreate={(newTx) => {
            const updated = [newTx, ...txs];
            setTxs(updated);
            saveMultisigTxs(updated);
            setShowCreate(false);
          }}
        />
      )}
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   TxCard — single multisig transaction
   ═══════════════════════════════════════════════════════════ */

function TxCard({ tx, expanded, onToggle, onSign, onExecute, copiedField, onCopy }: {
  tx: MultisigTransaction;
  expanded: boolean;
  onToggle: () => void;
  onSign?: () => void;
  onExecute?: () => void;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const c = useThemeColors();
  const statusCfg = STATUS_CONFIG[tx.status];
  const StatusIcon = statusCfg.icon;

  return (
    <TrCard className="overflow-hidden" style={{ borderLeft: `3px solid ${statusCfg.color}` }}>
      <button className="w-full p-3 text-left" onClick={onToggle}>
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: tx.chainColor + '12' }}>
            <StatusIcon size={14} color={statusCfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="truncate" style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{tx.label}</span>
              <span className="px-1.5 py-px rounded shrink-0"
                style={{ background: statusCfg.color + '12', color: statusCfg.color, fontSize: 8, fontWeight: 700 }}>
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: c.text3, fontSize: 10 }}>
                {tx.signedCount}/{tx.threshold} signed
              </span>
              <span className="px-1 py-px rounded" style={{ background: tx.chainColor + '10', color: tx.chainColor, fontSize: 8, fontWeight: 600 }}>
                {tx.chain}
              </span>
              <span style={{ color: c.text3, fontSize: 10 }}>#{tx.nonce}</span>
            </div>

            {/* Signature progress bar */}
            <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(tx.signedCount / tx.signers.length) * 100}%`,
                  background: tx.signedCount >= tx.threshold ? '#10B981' : '#F59E0B',
                }} />
            </div>
          </div>
          {expanded ? <ChevronUp size={14} color={c.text3} /> : <ChevronDown size={14} color={c.text3} />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3" style={{ borderTop: `1px solid ${c.border}` }}>
          <p className="mt-2 mb-2" style={{ color: c.text2, fontSize: 11 }}>{tx.description}</p>

          {/* Metadata */}
          <div className="flex flex-col gap-0 mb-2">
            {[
              { label: 'Function', value: tx.functionName, mono: true },
              { label: 'Contract', value: tx.contractAddress, mono: true },
              { label: 'Value', value: tx.value || '0' },
              { label: 'Gas', value: tx.estimatedGas },
              { label: 'Created', value: tx.createdAt },
              { label: 'Expires', value: tx.expiresAt },
              ...(tx.executedAt ? [{ label: 'Executed', value: tx.executedAt }] : []),
              ...(tx.executeTxHash ? [{ label: 'Tx Hash', value: tx.executeTxHash, mono: true }] : []),
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1"
                style={{ borderBottom: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: 10 }}>{row.label}</span>
                <span style={{ color: c.text1, fontSize: 10, fontWeight: 600, fontFamily: row.mono ? 'monospace' : undefined }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Params */}
          {Object.keys(tx.params).length > 0 && (
            <div className="mb-2">
              <p style={{ color: c.text3, fontSize: 9, marginBottom: 4 }}>Parameters</p>
              <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                {Object.entries(tx.params).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-0.5">
                    <span style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>{k}:</span>
                    <span style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signers */}
          <div className="mb-2">
            <p style={{ color: c.text3, fontSize: 9, marginBottom: 4 }}>Signers ({tx.signedCount}/{tx.threshold} required)</p>
            <div className="flex flex-col gap-1">
              {tx.signers.map(signer => (
                <div key={signer.address} className="flex items-center gap-2 py-1 px-2 rounded-lg"
                  style={{ background: signer.signed ? 'rgba(16,185,129,0.04)' : c.surface2 }}>
                  {signer.signed
                    ? <CheckCircle size={12} color="#10B981" />
                    : <Clock size={12} color={c.text3} />}
                  <span style={{ color: c.text1, fontSize: 10, fontWeight: 600 }}>{signer.label}</span>
                  <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>{signer.address}</span>
                  {signer.signedAt && (
                    <span className="ml-auto" style={{ color: '#10B981', fontSize: 8 }}>{signer.signedAt}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {tx.status === 'pending_signatures' && onSign && (
            <CTAButton variant="warning" onClick={onSign}>
              Ky giao dich
            </CTAButton>
          )}
          {tx.status === 'ready' && onExecute && (
            <CTAButton variant="success" onClick={onExecute}>
              Thuc hien giao dich
            </CTAButton>
          )}
        </div>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   CreateTxSheet — bottom sheet for creating new multisig tx
   ═══════════════════════════════════════════════════════════ */

function CreateTxSheet({ safe, onClose, onCreate }: {
  safe: MultisigSafe;
  onClose: () => void;
  onCreate: (tx: MultisigTransaction) => void;
}) {
  const c = useThemeColors();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [contractAddr, setContractAddr] = useState('');
  const [functionName, setFunctionName] = useState('');
  const [value, setValue] = useState('0');

  const canSubmit = label.trim() && contractAddr.trim() && functionName.trim();

  const handleCreate = () => {
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 3600000);
    const fmt = (d: Date) => d.toLocaleString();

    onCreate({
      id: `mtx_${Date.now()}`, label: label.trim(), description: description.trim(),
      contractAddress: contractAddr.trim(), chain: safe.chain, chainColor: safe.chainColor,
      functionName: functionName.trim(), params: {}, value: value || '0',
      estimatedGas: '$0.10', status: 'pending_signatures', threshold: safe.threshold,
      signers: safe.owners.map(o => ({ ...o, signed: false, signedAt: undefined })),
      signedCount: 0, createdAt: fmt(now), expiresAt: fmt(expires),
      nonce: safe.txCount + 1, safeAddress: safe.address,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}>
      <div className="w-full max-w-[428px] rounded-t-3xl max-h-[85vh] overflow-y-auto" style={{ background: c.bg }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.border }} />
        </div>
        <div className="px-5 pb-2 flex items-center justify-between">
          <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Tao giao dich Multi-sig</p>
          <button onClick={onClose} className="p-1"><X size={18} color={c.text3} /></button>
        </div>

        <div className="px-5 pb-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)' }}>
            <Shield size={14} color="#8B5CF6" />
            <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{safe.label}</span>
            <span style={{ color: '#8B5CF6', fontSize: 10 }}>{safe.threshold}/{safe.owners.length}</span>
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Ten giao dich</label>
            <input value={label} onChange={e => setLabel(e.target.value)}
              placeholder="VD: Withdraw rewards"
              className="w-full mt-1 rounded-xl px-3 py-2.5"
              style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}`, outline: 'none' }} />
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Mo ta</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Chi tiet giao dich..."
              rows={2}
              className="w-full mt-1 rounded-xl px-3 py-2.5 resize-none"
              style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}`, outline: 'none' }} />
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Contract Address</label>
            <input value={contractAddr} onChange={e => setContractAddr(e.target.value)}
              placeholder="0x..."
              className="w-full mt-1 rounded-xl px-3 py-2.5"
              style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}`, outline: 'none', fontFamily: 'monospace' }} />
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Function Name</label>
            <input value={functionName} onChange={e => setFunctionName(e.target.value)}
              placeholder="VD: transfer, approve, claimRewards"
              className="w-full mt-1 rounded-xl px-3 py-2.5"
              style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}`, outline: 'none', fontFamily: 'monospace' }} />
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Value (native token)</label>
            <input value={value} onChange={e => setValue(e.target.value)}
              placeholder="0"
              className="w-full mt-1 rounded-xl px-3 py-2.5"
              style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}`, outline: 'none' }} />
          </div>

          <div className="rounded-xl p-2.5 flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
              Can {safe.threshold} chu ky tu {safe.owners.length} signers. Giao dich het han sau 7 ngay.
            </p>
          </div>

          <CTAButton disabled={!canSubmit} onClick={handleCreate}>
            Tao giao dich
          </CTAButton>
        </div>
      </div>
    </div>
  );
}