import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TRANSACTIONS } from '../../data/mockData';
import { ChevronRight, Inbox } from 'lucide-react';
import { RefreshableSkeletonList } from '../../components/states/RefreshableSkeletonList';
import { EmptyState } from '../../components/states/EmptyState';
import { StickyDateHeader } from '../../components/mobile/StickyHeader';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtAmount } from '../../data/formatNumber';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  deposit: { label: 'Nạp', color: '#10B981', icon: '↓' },
  withdraw: { label: 'Rút', color: '#EF4444', icon: '↑' },
  trade_buy: { label: 'Mua', color: '#10B981', icon: '🔄' },
  trade_sell: { label: 'Bán', color: '#EF4444', icon: '🔄' },
  p2p_buy: { label: 'P2P Mua', color: '#10B981', icon: '🤝' },
  p2p_sell: { label: 'P2P Bán', color: '#EF4444', icon: '🤝' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Hoàn thành', color: '#10B981' },
  pending: { label: 'Đang xử lý', color: '#F59E0B' },
  failed: { label: 'Thất bại', color: '#EF4444' },
};

const FILTERS = ['Tất cả', 'Nạp', 'Rút', 'Giao dịch', 'P2P'];

/** Group transactions by date */
function groupByDate(txs: typeof TRANSACTIONS) {
  const groups: Record<string, typeof TRANSACTIONS> = {};
  txs.forEach(tx => {
    // Extract date portion (e.g., "2024-01-15" from "2024-01-15 14:32")
    const dateKey = tx.createdAt.split(' ')[0] || tx.createdAt;
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
  });
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

/** Format date string to Vietnamese display */
function formatDateVN(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return 'Hôm nay';
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/** Export transactions to CSV */
function exportToCSV(txs: typeof TRANSACTIONS, filterLabel: string) {
  const header = 'ID,Loại,Tài sản,Số lượng,Trạng thái,Mạng,TxHash,Phí,Thời gian\n';
  const rows = txs.map(tx =>
    `${tx.id},${tx.type},${tx.asset},${tx.amount},${tx.status},${tx.network || ''},${tx.txHash || ''},${tx.fee ?? ''},${tx.createdAt}`
  ).join('\n');
  const csv = '\uFEFF' + header + rows; // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_${filterLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TransactionHistoryPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const [filter, setFilter] = useState('Tất cả');
  const { hapticSelection } = useHaptic();
  const { isLoading, isRefreshing, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 600 });
  const actionToast = useActionToast();
  const [showExportSheet, setShowExportSheet] = useState(false);

  const filtered = TRANSACTIONS.filter(tx => {
    if (filter === 'Nạp') return tx.type === 'deposit';
    if (filter === 'Rút') return tx.type === 'withdraw';
    if (filter === 'Giao dịch') return tx.type.startsWith('trade');
    if (filter === 'P2P') return tx.type.startsWith('p2p');
    return true;
  });

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <PageLayout>
      <Header title="Lịch sử giao dịch" subtitle="Lịch sử · Wallet" back
        action={{ icon: ChevronRight, onClick: () => setShowExportSheet(true) }}
      />

      <PageContent padding="compact">
      {/* Export options bar */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span style={{ color: c.text3, fontSize: 11 }}>{filtered.length} giao dịch</span>
        <button
          onClick={() => {
            exportToCSV(filtered, filter);
            hapticSelection();
            actionToast.success({ title: 'Xuất thành công!', description: `${filtered.length} giao dịch đã được tải xuống dạng CSV` });
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background: c.primaryAlpha12, color: c.primary, fontSize: 11, fontWeight: 600 }}
        >
          <Inbox size={12} />
          Xuất CSV
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 -mx-5 px-5 overflow-x-auto scrollbar-none">
        {FILTERS.map(f => (
          <button key={f} onClick={() => { setFilter(f); hapticSelection(); }}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: filter === f ? c.chipActiveBg : c.chipBg,
              color: filter === f ? c.chipActiveText : c.chipText,
              border: `1px solid ${filter === f ? c.chipActiveBorder : c.chipBorder}`,
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div>
        <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount}>
          <RefreshableSkeletonList
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            rows={8}
            isEmpty={filtered.length === 0}
            emptyState={
              <EmptyState
                icon={Inbox}
                title="Chưa có giao dịch nào"
                subtitle={filter !== 'Tất cả' ? `Không có giao dịch ${filter} nào` : 'Bắt đầu giao dịch để xem lịch sử tại đây'}
                ctaLabel={filter !== 'Tất cả' ? 'Xóa bộ lọc' : undefined}
                onCta={filter !== 'Tất cả' ? () => setFilter('Tất cả') : undefined}
              />
            }
            lastRefreshedLabel={lastRefreshedLabel}
            refreshCount={refreshCount}
          >
            {grouped.map(group => (
              <div key={group.date}>
                {/* Sticky date header */}
                <StickyDateHeader date={formatDateVN(group.date)} />

                {group.items.map((tx) => {
                  const typeInfo = TYPE_LABELS[tx.type];
                  const statusInfo = STATUS_LABELS[tx.status];
                  const isDebit = tx.type === 'withdraw' || tx.type === 'trade_sell' || tx.type === 'p2p_sell';

                  return (
                    <button key={tx.id} onClick={() => navigate(`${prefix}/wallet/transaction/${tx.id}`)}
                      className="flex items-center gap-3 px-4 py-3 w-full active:opacity-70 transition-opacity market-row"
                      style={{ borderBottom: `1px solid ${c.divider}` }}>
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg"
                        style={{ background: typeInfo.color + '18' }}>
                        {typeInfo.icon}
                      </div>

                      {/* Info */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-truncate" style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                          {typeInfo.label} {tx.asset}
                        </span>
                        <span className="text-truncate" style={{ color: c.text3, fontSize: 12 }}>
                          {tx.createdAt.split(' ')[1] || tx.createdAt}
                        </span>
                        {tx.network && (
                          <span className="text-truncate" style={{ color: c.text3, fontSize: 11 }}>
                            Mạng: {tx.network}
                          </span>
                        )}
                        {tx.txHash && (
                          <span className="text-truncate" style={{ color: '#3B82F6', fontSize: 11, fontFamily: 'monospace', maxWidth: 140 }}>
                            {tx.txHash}
                          </span>
                        )}
                      </div>

                      {/* Amount & Status */}
                      <div className="flex flex-col items-end shrink-0">
                        <span style={{ color: typeInfo.color, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>
                          {isDebit ? '-' : '+'}{fmtAmount(tx.amount)} {tx.asset}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
                          style={{ background: statusInfo.color + '18', color: statusInfo.color }}>
                          {statusInfo.label}
                        </span>
                        {tx.fee !== undefined && tx.fee > 0 && (
                          <span style={{ color: c.text3, fontSize: 11 }}>Phí: ${tx.fee.toFixed(2)}</span>
                        )}
                      </div>
                      <ChevronRight size={14} color={c.text3} className="shrink-0" />
                    </button>
                  );
                })}
              </div>
            ))}
          </RefreshableSkeletonList>

          {/* End of list indicator */}
          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-center py-6 gap-2">
              <div className="w-8 h-px" style={{ background: c.borderSolid }} />
              <span style={{ color: c.text3, fontSize: 11 }}>Đã tải hết</span>
              <div className="w-8 h-px" style={{ background: c.borderSolid }} />
            </div>
          )}
        </PullToRefresh>
      </div>
      </PageContent>
    </PageLayout>
  );
}