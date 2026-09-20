import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Copy, CheckCircle, AlertTriangle, RefreshCw, ChevronDown, Wifi } from 'lucide-react';
import { DEPOSIT_NETWORKS } from '../../data/mockData';
import type { DepositNetwork } from '../../data/mockData';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { useHaptic } from '../../hooks/useHaptic';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ, φIcon } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';
import { useParams } from 'react-router';

function QRCodeDisplay({ address }: { address: string }) {
  const seed = address.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells: boolean[][] = Array.from({ length: 21 }, (_, r) =>
    Array.from({ length: 21 }, (_, c) => {
      if ((r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7)) return true;
      return ((seed * (r + 1) * (c + 1)) % 7) < 3;
    })
  );
  const colors = useThemeColors();
  return (
    <div className="rounded-3xl p-4 flex items-center justify-center"
      style={{ background: '#fff', width: 180, height: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <svg width="148" height="148" viewBox="0 0 21 21">
        {cells.map((row, r) => row.map((filled, c) => filled ? (
          <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#111" />
        ) : null))}
        <rect x="0" y="0" width="7" height="7" fill="none" stroke="#111" strokeWidth="0.5"/>
        <rect x="1" y="1" width="5" height="5" fill="none" stroke="#111" strokeWidth="0.5"/>
        <rect x="2" y="2" width="3" height="3" fill="#111"/>
        <rect x="14" y="0" width="7" height="7" fill="none" stroke="#111" strokeWidth="0.5"/>
        <rect x="15" y="1" width="5" height="5" fill="none" stroke="#111" strokeWidth="0.5"/>
        <rect x="16" y="2" width="3" height="3" fill="#111"/>
        <rect x="0" y="14" width="7" height="7" fill="none" stroke="#111" strokeWidth="0.5"/>
        <rect x="1" y="15" width="5" height="5" fill="none" stroke="#111" strokeWidth="0.5"/>
        <rect x="2" y="16" width="3" height="3" fill="#111"/>
      </svg>
    </div>
  );
}

/* ─── Deposit Skeleton ─── */
function DepositSkeleton() {
  const c = useThemeColors();
  const s = {
    background: `linear-gradient(90deg, ${c.surface2} 25%, ${c.borderSolid} 37%, ${c.surface2} 63%)`,
    backgroundSize: '800px 100%',
    animation: 'stateShimmer 1.8s ease-in-out infinite',
    borderRadius: 8,
  } as React.CSSProperties;
  return (
    <div className="flex flex-col gap-4">
      {/* Network selector skeleton */}
      <div className="h-14 rounded-2xl" style={s} />
      {/* Warning skeleton */}
      <div className="h-28 rounded-2xl" style={s} />
      {/* QR code area */}
      <div className="flex flex-col items-center gap-4 py-6 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.cardBorder}`, boxShadow: c.cardShadow }}>
        <div className="w-[180px] h-[180px] rounded-3xl" style={s} />
        <div className="h-3 w-40 rounded" style={s} />
        <div className="h-3 w-64 rounded" style={s} />
        <div className="h-10 w-40 rounded-2xl" style={s} />
      </div>
      {/* Info area */}
      <div className="h-44 rounded-2xl" style={s} />
    </div>
  );
}

export function DepositPage() {
  const { asset = 'USDT' } = useParams();
  const networks = DEPOSIT_NETWORKS[asset as keyof typeof DEPOSIT_NETWORKS] ?? DEPOSIT_NETWORKS.USDT;

  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [copied, setCopied] = useState(false);
  const [memoCopied, setMemoCopied] = useState(false);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const { hapticSelection, hapticLight, hapticSuccess } = useHaptic();
  const c = useThemeColors();
  const { isLoading } = useLoadingState({ loadOnly: true });
  const actionToast = useActionToast();

  const hasMemo = !!selectedNetwork.memo;
  const memoValue = selectedNetwork.memo;
  const memoLabel = selectedNetwork.memoLabel;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedNetwork.address).catch(() => {});
    setCopied(true);
    actionToast.success(TOAST.COPY.DEPOSIT_ADDRESS, { haptic: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMemo = () => {
    if (!memoValue) return;
    navigator.clipboard.writeText(memoValue).catch(() => {});
    setMemoCopied(true);
    actionToast.success({ title: `${memoLabel} đã sao chép`, description: memoValue }, { haptic: 'success' });
    setTimeout(() => setMemoCopied(false), 2000);
  };

  return (
    <PageLayout>
      {/* ═══ Vaul BottomSheet — Network Picker ═══ */}
      <BottomSheetV2
        open={showNetworkPicker}
        onClose={() => setShowNetworkPicker(false)}
        title="Chọn mạng lưới"
      >
        <div className="flex flex-col gap-1">
          {networks.map(net => (
            <button key={net.id} onClick={() => { setSelectedNetwork(net); setShowNetworkPicker(false); hapticSelection(); }}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl market-row"
              style={{ background: net.id === selectedNetwork.id ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
              <div>
                <div className="flex items-center gap-2">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, textAlign: 'left' }}>{net.name}</p>
                  {net.memo && (
                    <span className="px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: 9, fontWeight: 700 }}>
                      {net.memoLabel || 'Memo'}
                    </span>
                  )}
                </div>
                <p style={{ color: c.text3, fontSize: φ.xs }}>Phí: {net.fee} • ~{net.arrivalTime} • {net.confirmations} xác nhận</p>
              </div>
              {net.id === selectedNetwork.id && <CheckCircle size={φIcon.sm} color="#3B82F6" />}
            </button>
          ))}
        </div>
      </BottomSheetV2>

      <Header title={`Nạp ${asset}`} subtitle="Nạp tiền · Wallet" back />

      {isLoading ? (
        <PageContent><DepositSkeleton /></PageContent>
      ) : (
        <PageContent gap="default">
          {/* Network selector */}
          <div>
            <label style={{ color: c.text2, fontSize: φ.sm, marginBottom: 8, display: 'block' }}>Chọn mạng lưới</label>
            <button
              onClick={() => { setShowNetworkPicker(true); hapticSelection(); }}
              className="w-full flex items-center justify-between px-4 rounded-2xl hover-ghost"
              style={{ background: c.surface2, border: '1.5px solid #3B82F6', height: 52, borderRadius: 14 }}>
              <div className="flex flex-col items-start">
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{selectedNetwork.name}</span>
                <span style={{ color: c.text2, fontSize: φ.xs }}>
                  Phí: {selectedNetwork.fee} • Nạp tối thiểu: {selectedNetwork.minDeposit} {asset}
                </span>
              </div>
              <ChevronDown size={φIcon.md} color={c.text2} />
            </button>
            {/* Inline network status indicator */}
            <div className="flex items-center gap-1.5 mt-2 px-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
              <span style={{ color: c.text3, fontSize: 10 }}>Mạng hoạt động tốt</span>
              <span style={{ color: c.text3, fontSize: 10 }}>•</span>
              <span style={{ color: c.text3, fontSize: 10 }}>~{selectedNetwork.arrivalTime}</span>
              <span style={{ color: c.text3, fontSize: 10 }}>•</span>
              <span style={{ color: c.text3, fontSize: 10 }}>{selectedNetwork.confirmations} xác nhận</span>
            </div>
          </div>

          {/* Important warning */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={φIcon.sm} color="#EF4444" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>Quan trọng — Đọc trước khi nạp</p>
                <ul className="flex flex-col gap-1">
                  {[
                    `Chỉ gửi ${asset} qua mạng ${selectedNetwork.name}`,
                    'Gửi sai mạng sẽ mất tiền vĩnh viễn, không thể khôi phục',
                    `Nạp tối thiểu: ${selectedNetwork.minDeposit} ${asset}`,
                    `Cần ${selectedNetwork.confirmations} xác nhận blockchain`,
                    ...(hasMemo ? [
                      `BẮT BUỘC nhập đúng ${memoLabel} khi gửi. Thiếu ${memoLabel} sẽ MẤT TIỀN vĩnh viễn`,
                    ] : []),
                  ].map((msg, i) => (
                    <li key={msg} style={{ color: '#F87171', fontSize: φ.xs }}>• {msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ═══ Memo/Tag Critical Warning Banner (only for memo-required networks) ═══ */}
          {hasMemo && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.5)' }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={φIcon.md} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700 }}>
                    Mạng này yêu cầu {memoLabel}
                  </p>
                  <p style={{ color: '#D97706', fontSize: φ.xs, lineHeight: 1.5, marginTop: 4 }}>
                    Bạn phải nhập cả <strong>Địa chỉ</strong> và <strong>{memoLabel}</strong> khi gửi {asset}.
                    Thiếu {memoLabel} sẽ khiến giao dịch không được ghi nhận và <strong>không thể khôi phục</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* QR Code + Address */}
          <TrCard className="flex flex-col items-center gap-4 py-4">
            <QRCodeDisplay address={selectedNetwork.address} />
            <div className="flex flex-col items-center gap-1">
              <span style={{ color: c.text2, fontSize: φ.xs }}>Địa chỉ {asset} ({selectedNetwork.name.split(' ')[0]})</span>
              <span style={{ color: c.text1, fontSize: φ.xs, fontFamily: 'monospace', textAlign: 'center', padding: '0 16px', lineHeight: 1.6, wordBreak: 'break-all' }}>
                {selectedNetwork.address}
              </span>
            </div>

            <button onClick={handleCopy}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold ripple"
              style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: copied ? '#10B981' : '#3B82F6', fontSize: φ.sm }}>
              {copied ? <CheckCircle size={φIcon.sm} /> : <Copy size={φIcon.sm} />}
              {copied ? 'Đã sao chép địa chỉ!' : 'Sao chép địa chỉ'}
            </button>
          </TrCard>

          {/* ═══ Memo/Tag Display Card (only for memo-required networks) ═══ */}
          {hasMemo && memoValue && (
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.15)' }}>
                    <AlertTriangle size={13} color="#F59E0B" />
                  </div>
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                    {memoLabel}
                  </span>
                  <span className="px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 9, fontWeight: 700 }}>
                    BẮT BUỘC
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: c.surface2, border: `1.5px solid rgba(245,158,11,0.4)` }}>
                <span style={{
                  color: c.text1,
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
                  letterSpacing: 2,
                  flex: 1,
                }}>
                  {memoValue}
                </span>
                <button onClick={handleCopyMemo}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0"
                  style={{
                    background: memoCopied ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                    color: memoCopied ? '#10B981' : '#3B82F6',
                    fontSize: φ.xs,
                    fontWeight: 600,
                  }}>
                  {memoCopied ? <CheckCircle size={13} /> : <Copy size={13} />}
                  {memoCopied ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>

              <p style={{ color: '#D97706', fontSize: φ.xs, marginTop: 8, lineHeight: 1.5 }}>
                Sao chép {memoLabel} ở trên và dán vào trường "{memoLabel}" khi gửi từ ví/sàn khác.
              </p>
            </TrCard>
          )}

          {/* Arrival info */}
          <TrCard className="p-4 flex flex-col gap-3">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Thông tin nạp tiền</h3>
            {[
              { label: 'Thời gian xử lý', value: selectedNetwork.arrivalTime },
              { label: 'Xác nhận cần thiết', value: `${selectedNetwork.confirmations} blocks` },
              { label: 'Phí nạp', value: selectedNetwork.fee },
              { label: 'Nạp tối thiểu', value: `${selectedNetwork.minDeposit} ${asset}` },
              { label: 'Nạp nhỏ hơn tối thiểu', value: 'Không được ghi nhận' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span style={{ color: c.text2, fontSize: φ.sm }}>{row.label}</span>
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </TrCard>

          {/* Refresh button */}
          <button onClick={() => hapticLight()} className="flex items-center justify-center gap-2 h-12 rounded-2xl hover-ghost"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, color: c.text2, fontSize: φ.sm }}>
            <RefreshCw size={φIcon.sm} />
            Làm mới địa chỉ nạp
          </button>
        </PageContent>
      )}
    </PageLayout>
  );
}