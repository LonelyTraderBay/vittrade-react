/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadBatchClaimPage — Multi-Position Batch Claim
 * ══════════════════════════════════════════════════════════════
 *  Pattern C — Form/Wizard with Bottom CTA
 *  Features: Select multiple positions, batch claim review,
 *            gas savings comparison, multi-step claim flow,
 *            per-token breakdown, chain grouping
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Gift, CheckCircle, Clock, Lock, AlertTriangle,
  ArrowRight, X, Info, Shield, Fuel,
  TrendingUp, Layers, ChevronRight, ChevronDown,
  CheckSquare, Square, Zap, RefreshCw,
  AlertCircle, Coins, ExternalLink,
} from 'lucide-react';
import {
  getAllClaimablePositions, calculateBatchClaimSummary,
  type BatchClaimPosition, type BatchClaimSummary,
} from './launchpadData';
import { RiskDisclosure } from './LaunchpadComponents';

type ClaimStep = 'select' | 'review' | 'processing' | 'success';

export function LaunchpadBatchClaimPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  const allPositions = useMemo(() => getAllClaimablePositions(), []);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(allPositions.map(p => p.positionId)));
  const [step, setStep] = useState<ClaimStep>('select');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedPositions, setProcessedPositions] = useState<string[]>([]);
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});

  const selectedPositions = useMemo(
    () => allPositions.filter(p => selected.has(p.positionId)),
    [allPositions, selected]
  );

  const summary = useMemo(
    () => calculateBatchClaimSummary(selectedPositions),
    [selectedPositions]
  );

  const togglePosition = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allPositions.map(p => p.positionId)));
  const deselectAll = () => setSelected(new Set());

  const handleBatchClaim = useCallback(() => {
    setStep('processing');
    setProcessingProgress(0);
    setProcessedPositions([]);

    const positions = [...selectedPositions];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= positions.length) {
        clearInterval(interval);
        setTimeout(() => setStep('success'), 600);
        return;
      }
      const pos = positions[idx];
      setProcessedPositions(prev => [...prev, pos.positionId]);
      setTxHashes(prev => ({
        ...prev,
        [pos.positionId]: '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6),
      }));
      setProcessingProgress(Math.round(((idx + 1) / positions.length) * 100));
      idx++;
    }, 1200);
  }, [selectedPositions]);

  if (allPositions.length === 0) {
    return (
      <PageLayout>
        <Header title="Batch Claim" back />
        <PageContent>
          <TrCard className="p-8 text-center">
            <Gift size={40} color={c.text3} className="mx-auto mb-3" />
            <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>Không có phần thưởng</p>
            <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>
              Tất cả phần thưởng đã được nhận hoặc chưa đến kỳ mở khóa.
            </p>
            <CTAButton className="mt-4" onClick={() => navigate(`${prefix}/launchpad/staking`)}>
              Quay lại Staking
            </CTAButton>
          </TrCard>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant={step === 'select' ? 'flush' : 'default'}>
      <Header title={step === 'success' ? 'Hoàn tất' : 'Batch Claim'} back />

      <PageContent gap="default" grow>
        {/* ═══ STEP: SELECT ═══ */}
        {step === 'select' && (
          <>
            {/* Summary hero */}
            <TrCard variant="hero" className="p-5 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 65%)' }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Layers size={16} color="rgba(255,255,255,0.7)" />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}>
                    Tổng có thể nhận từ {allPositions.length} vị trí
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p style={{ color: '#fff', fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}>
                    ${summary.totalClaimableUSD.toLocaleString()}
                  </p>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>USD</span>
                </div>

                {/* Per-token breakdown */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.totalClaimable).map(([token, amount]) => (
                    <div key={token} className="px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                        {amount.toLocaleString()}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginLeft: 4 }}>{token}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TrCard>

            {/* Gas savings banner */}
            {selectedPositions.length > 1 && (
              <div className="rounded-xl p-3 flex items-center gap-3"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(16,185,129,0.12)' }}>
                  <Fuel size={16} color="#10B981" />
                </div>
                <div className="flex-1">
                  <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                    Tiết kiệm ~{summary.gasSavingsPercent}% gas
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    Batch: {summary.estimatedGasBatch} vs Riêng lẻ: {summary.estimatedGasIndividual} (tiết kiệm ~${summary.gasSavingsUSD})
                  </p>
                </div>
              </div>
            )}

            {/* Select controls */}
            <div className="flex items-center justify-between">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                Chọn vị trí ({selected.size}/{allPositions.length})
              </p>
              <div className="flex items-center gap-3">
                <button onClick={selectAll} style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                  Chọn tất cả
                </button>
                <span style={{ color: c.border }}>|</span>
                <button onClick={deselectAll} style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* Position cards */}
            <div className="flex flex-col gap-3">
              {allPositions.map(pos => (
                <PositionCard
                  key={pos.positionId}
                  position={pos}
                  selected={selected.has(pos.positionId)}
                  onToggle={() => togglePosition(pos.positionId)}
                  onViewDetail={() => navigate(`${prefix}/launchpad/claim-receipt/${pos.positionId}`)}
                />
              ))}
            </div>

            {/* Chain info */}
            {summary.chains.length > 1 && (
              <div className="rounded-xl p-3 flex items-start gap-2"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Các vị trí trên nhiều chain ({summary.chains.join(', ')}). Batch claim sẽ gửi giao dịch riêng cho mỗi chain.
                </p>
              </div>
            )}

            <RiskDisclosure />
            <div className="h-[120px]" />
          </>
        )}

        {/* ═══ STEP: REVIEW ═══ */}
        {step === 'review' && (
          <>
            <div className="text-center py-3">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)' }}>
                <Layers size={28} color="#10B981" />
              </div>
              <h3 style={{ color: c.text1, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                Xác nhận Batch Claim
              </h3>
              <p style={{ color: c.text2, fontSize: 12 }}>
                Nhận phần thưởng từ {selectedPositions.length} vị trí cùng lúc
              </p>
            </div>

            {/* Token totals */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Coins size={15} color="#10B981" />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Tổng nhận</p>
              </div>
              {Object.entries(summary.totalClaimable).map(([token, amount]) => {
                const pos = selectedPositions.find(p => p.rewardToken === token);
                const usd = pos ? Math.round(amount * pos.rewardTokenPrice * 100) / 100 : 0;
                return (
                  <div key={token} className="flex items-center justify-between py-2"
                    style={{ borderBottom: `1px solid ${c.border}` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: (pos?.projectLogoColor || '#6366F1') + '22', color: pos?.projectLogoColor || '#6366F1', fontSize: 9, fontWeight: 700 }}>
                        {token.slice(0, 2)}
                      </div>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{token}</span>
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                        {amount.toLocaleString()}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>~${usd.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between pt-3">
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Tổng giá trị</span>
                <span style={{ color: '#10B981', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                  ${summary.totalClaimableUSD.toLocaleString()}
                </span>
              </div>
            </TrCard>

            {/* Positions detail */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={15} color={c.text2} />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Vị trí ({selectedPositions.length})</p>
              </div>
              {selectedPositions.map((pos, i) => (
                <div key={pos.positionId} className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: i < selectedPositions.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: pos.projectLogoColor + '22', color: pos.projectLogoColor, fontSize: 10, fontWeight: 700 }}>
                    {pos.projectSymbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{pos.projectName}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{pos.chain} · {pos.vestingEntries.length} đợt</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                      {pos.claimableAmount.toLocaleString()} {pos.rewardToken}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>~${pos.claimableUSD.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </TrCard>

            {/* Fee breakdown */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Fuel size={15} color={c.text2} />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Gas & Phi</p>
              </div>
              <div className="flex flex-col gap-0">
                {[
                  { label: 'Gas batch (ước tính)', value: summary.estimatedGasBatch, color: c.text1 },
                  { label: 'Gas riêng lẻ', value: summary.estimatedGasIndividual, color: c.text3, strike: true },
                  { label: 'Tiết kiệm', value: `~$${summary.gasSavingsUSD} (${summary.gasSavingsPercent}%)`, color: '#10B981' },
                  { label: 'Chains', value: summary.chains.join(', ') },
                  { label: 'Số giao dịch', value: `${summary.chains.length} tx` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text3, fontSize: 12 }}>{r.label}</span>
                    <span style={{
                      color: r.color || c.text1,
                      fontSize: 12, fontWeight: 600, fontFamily: 'monospace',
                      textDecoration: (r as any).strike ? 'line-through' : 'none',
                    }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Warning */}
            <div className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Token sẽ được gửi về ví của bạn sau khi tất cả giao dịch được xác nhận. Quá trình có thể mất vài phút tùy chain.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('select')}
                className="flex-1 h-12 rounded-2xl flex items-center justify-center hover:opacity-90 transition-opacity active:scale-[0.98]"
                style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: 13, borderRadius: 14, fontWeight: 600 }}>
                Quay lại
              </button>
              <CTAButton className="flex-1" variant="success" onClick={handleBatchClaim}>
                <Zap size={14} className="inline mr-1" />
                Nhận tất cả
              </CTAButton>
            </div>

            <div className="h-[40px]" />
          </>
        )}

        {/* ═══ STEP: PROCESSING ═══ */}
        {step === 'processing' && (
          <>
            <div className="text-center py-6">
              <RefreshCw size={36} color="#10B981" className="mx-auto mb-4 animate-spin" />
              <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                Đang xử lý batch claim...
              </h3>
              <p style={{ color: c.text2, fontSize: 12 }}>
                {processedPositions.length}/{selectedPositions.length} vị trí đã xử lý
              </p>
            </div>

            {/* Progress bar */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: 12 }}>Tiến độ</span>
                <span style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                  {processingProgress}%
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${processingProgress}%`, background: '#10B981' }} />
              </div>
            </TrCard>

            {/* Processing status per position */}
            <div className="flex flex-col gap-2">
              {selectedPositions.map(pos => {
                const isDone = processedPositions.includes(pos.positionId);
                const isActive = !isDone && processedPositions.length === selectedPositions.indexOf(pos);
                return (
                  <TrCard key={pos.positionId} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: pos.projectLogoColor + '22', color: pos.projectLogoColor, fontSize: 10, fontWeight: 700 }}>
                        {pos.projectSymbol.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{pos.projectName}</p>
                        <p style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                          {pos.claimableAmount.toLocaleString()} {pos.rewardToken}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isDone && (
                          <>
                            <CheckCircle size={14} color="#10B981" />
                            <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>Done</span>
                          </>
                        )}
                        {isActive && (
                          <>
                            <RefreshCw size={12} color="#F59E0B" className="animate-spin" />
                            <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>Claiming...</span>
                          </>
                        )}
                        {!isDone && !isActive && (
                          <span style={{ color: c.text3, fontSize: 10 }}>Chờ...</span>
                        )}
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ STEP: SUCCESS ═══ */}
        {step === 'success' && (
          <>
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <CheckCircle size={40} color="#10B981" />
              </div>
              <h3 style={{ color: c.text1, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                Batch Claim thành công!
              </h3>
              <p style={{ color: c.text2, fontSize: 13 }}>
                Đã nhận phần thưởng từ {selectedPositions.length} vị trí
              </p>
            </div>

            {/* Summary */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gift size={15} color="#10B981" />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Tóm tắt</p>
              </div>
              {Object.entries(summary.totalClaimable).map(([token, amount]) => {
                const pos = selectedPositions.find(p => p.rewardToken === token);
                return (
                  <div key={token} className="flex items-center justify-between py-2"
                    style={{ borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text2, fontSize: 12 }}>{token}</span>
                    <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                      +{amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-between pt-3">
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Tổng giá trị</span>
                <span style={{ color: '#10B981', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                  ~${summary.totalClaimableUSD.toLocaleString()}
                </span>
              </div>
            </TrCard>

            {/* Tx receipts */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={15} color={c.text2} />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Giao dịch</p>
              </div>
              {selectedPositions.map((pos, i) => (
                <div key={pos.positionId} className="flex items-center justify-between py-2"
                  style={{ borderBottom: i < selectedPositions.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={12} color="#10B981" />
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{pos.projectSymbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                      {txHashes[pos.positionId] || '0x...'}
                    </span>
                    <ExternalLink size={10} color={c.text3} />
                  </div>
                </div>
              ))}
            </TrCard>

            {/* Gas saved banner */}
            <div className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Fuel size={16} color="#10B981" />
              <div>
                <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                  Đã tiết kiệm ~${summary.gasSavingsUSD} gas!
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>
                  Batch claim tiết kiệm {summary.gasSavingsPercent}% so với claim riêng lẻ
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate(`${prefix}/launchpad/staking`)}
                className="flex-1 h-12 rounded-2xl flex items-center justify-center hover:opacity-90 transition-opacity active:scale-[0.98]"
                style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: 13, borderRadius: 14, fontWeight: 600 }}>
                Staking
              </button>
              <CTAButton className="flex-1" variant="success" onClick={() => navigate(-1)}>
                Hoàn tất
              </CTAButton>
            </div>

            <div className="h-[60px]" />
          </>
        )}
      </PageContent>

      {/* Sticky footer for select step */}
      {step === 'select' && selected.size > 0 && (
        <StickyFooter>
          <CTAButton variant="success" onClick={() => setStep('review')} className="w-full">
            <Zap size={16} className="inline mr-1.5" />
            Nhận {selected.size} vị trí · ~${summary.totalClaimableUSD.toLocaleString()}
          </CTAButton>
        </StickyFooter>
      )}
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   PositionCard — selectable position card
   ═══════════════════════════════════════════════════════════ */

function PositionCard({ position, selected, onToggle, onViewDetail }: {
  position: BatchClaimPosition; selected: boolean;
  onToggle: () => void; onViewDetail: () => void;
}) {
  const c = useThemeColors();
  const CheckIcon = selected ? CheckSquare : Square;

  return (
    <TrCard className="p-4" style={{
      border: selected ? `1.5px solid ${position.projectLogoColor}40` : `1px solid ${c.border}`,
      background: selected ? `${position.projectLogoColor}04` : undefined,
    }}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button onClick={onToggle} className="shrink-0 mt-0.5">
          <CheckIcon size={20} color={selected ? position.projectLogoColor : c.text3} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: position.projectLogoColor + '22', color: position.projectLogoColor, fontSize: 10, fontWeight: 700 }}>
              {position.projectSymbol.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{position.projectName}</p>
              <p style={{ color: c.text3, fontSize: 10 }}>
                {position.chain} · APY {position.apy}% · {position.stakedAmount.toLocaleString()} {position.stakeToken} staked
              </p>
            </div>
          </div>

          {/* Claimable amount */}
          <div className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: c.surface2 }}>
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Có thể nhận</p>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                {position.claimableAmount.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 600 }}>{position.rewardToken}</span>
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>~${position.claimableUSD.toLocaleString()} USD</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="px-2 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>
                  {position.vestingEntries.length} đợt
                </span>
              </div>
              <button onClick={e => { e.stopPropagation(); onViewDetail(); }}
                className="flex items-center gap-0.5"
                style={{ color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>
                Chi tiết <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* Vesting entries preview */}
          {position.vestingEntries.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {position.vestingEntries.map(v => (
                <div key={v.id} className="px-2 py-0.5 rounded-md"
                  style={{
                    background: v.status === 'claimable' ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)',
                    border: `1px solid ${v.status === 'claimable' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)'}`,
                  }}>
                  <span style={{
                    color: v.status === 'claimable' ? '#3B82F6' : '#F59E0B',
                    fontSize: 9, fontWeight: 600,
                  }}>
                    {v.label}: {v.amount.toLocaleString()} {v.token}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TrCard>
  );
}