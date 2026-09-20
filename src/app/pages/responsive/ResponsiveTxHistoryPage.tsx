import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { TRANSACTIONS } from '../../data/mockData';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useThemeColors } from '../../hooks/useThemeColors';
import { fmtAmount, fmtFee } from '../../data/formatNumber';

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

export function ResponsiveTxHistoryPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { isDesktop, isTablet } = useBreakpoint();
  const [filter, setFilter] = useState('Tất cả');

  const filtered = TRANSACTIONS.filter(tx => {
    if (filter === 'Nạp') return tx.type === 'deposit';
    if (filter === 'Rút') return tx.type === 'withdraw';
    if (filter === 'Giao dịch') return tx.type.startsWith('trade');
    if (filter === 'P2P') return tx.type.startsWith('p2p');
    return true;
  });

  const showExtendedColumns = isDesktop || isTablet;

  return (
    <PageLayout>
      <Header title="Lịch sử giao dịch" subtitle="Lịch sử · Wallet" back />

      {/* Filter tabs */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-none">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: filter === f ? c.chipActiveBg : c.chipBg, color: filter === f ? c.chipActiveText : c.chipText, border: `1px solid ${filter === f ? c.chipActiveBorder : c.chipBorder}` }}>
            {f}
          </button>
        ))}
      </div>

      {/* Desktop/Tablet: table header */}
      {showExtendedColumns && (
        <div className="flex items-center px-5 py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
          <span style={{ color: c.text3, fontSize: 11, width: 40 }}></span>
          <span style={{ color: c.text3, fontSize: 11, flex: 2 }}>Loại / Tài sản</span>
          <span style={{ color: c.text3, fontSize: 11, flex: 1 }}>Thời gian</span>
          {isDesktop && <span style={{ color: c.text3, fontSize: 11, flex: 1 }}>Mạng</span>}
          {isDesktop && <span style={{ color: c.text3, fontSize: 11, flex: 1.5 }}>TxHash</span>}
          <span style={{ color: c.text3, fontSize: 11, flex: 1, textAlign: 'right' }}>Số lượng</span>
          {isDesktop && <span style={{ color: c.text3, fontSize: 11, flex: 0.5, textAlign: 'right' }}>Phí</span>}
          <span style={{ color: c.text3, fontSize: 11, width: 80, textAlign: 'right' }}>Trạng thái</span>
          <span style={{ width: 24 }}></span>
        </div>
      )}

      {/* List */}
      <div className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <RefreshCw size={36} color={c.borderSolid} />
            <p style={{ color: c.text3, fontSize: 14 }}>Chưa có giao dịch nào</p>
          </div>
        ) : (
          filtered.map((tx, i) => {
            const typeInfo = TYPE_LABELS[tx.type];
            const statusInfo = STATUS_LABELS[tx.status];
            const isDebit = tx.type === 'withdraw' || tx.type === 'trade_sell' || tx.type === 'p2p_sell';

            if (showExtendedColumns) {
              // Desktop/Tablet: table-like row with more columns
              return (
                <button key={tx.id} onClick={() => navigate(`/r/wallet/transaction/${tx.id}`)}
                  className="flex items-center px-5 py-3 w-full active:opacity-70 transition-opacity"
                  style={{ borderBottom: `1px solid ${c.divider}` }}>
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base mr-3"
                    style={{ background: typeInfo.color + '18' }}>
                    {typeInfo.icon}
                  </div>
                  {/* Type + Asset */}
                  <div className="flex flex-col text-left" style={{ flex: 2 }}>
                    <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{typeInfo.label} {tx.asset}</span>
                    <span style={{ color: c.text3, fontSize: 12 }}>{tx.createdAt}</span>
                  </div>
                  {/* Time */}
                  <div style={{ flex: 1 }}>
                    <span style={{ color: c.text2, fontSize: 12 }}>{tx.createdAt}</span>
                  </div>
                  {/* Network (desktop only) */}
                  {isDesktop && (
                    <div style={{ flex: 1 }}>
                      <span style={{ color: c.text3, fontSize: 12 }}>{tx.network || '—'}</span>
                    </div>
                  )}
                  {/* TxHash (desktop only) */}
                  {isDesktop && (
                    <div style={{ flex: 1.5 }}>
                      {tx.txHash ? (
                        <span style={{ color: '#3B82F6', fontSize: 11, fontFamily: 'monospace' }}>{tx.txHash}</span>
                      ) : (
                        <span style={{ color: c.text3, fontSize: 11 }}>—</span>
                      )}
                    </div>
                  )}
                  {/* Amount */}
                  <div className="text-right" style={{ flex: 1 }}>
                    <span style={{ color: typeInfo.color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                      {isDebit ? '-' : '+'}{fmtAmount(tx.amount)} {tx.asset}
                    </span>
                  </div>
                  {/* Fee (desktop) */}
                  {isDesktop && (
                    <div className="text-right" style={{ flex: 0.5 }}>
                      <span style={{ color: c.text3, fontSize: 12 }}>
                        {tx.fee !== undefined && tx.fee > 0 ? fmtFee(tx.fee) : '—'}
                      </span>
                    </div>
                  )}
                  {/* Status */}
                  <div className="text-right" style={{ width: 80 }}>
                    <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
                      style={{ background: statusInfo.color + '18', color: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <ChevronRight size={14} color={c.text3} className="shrink-0 ml-2" />
                </button>
              );
            }

            // Mobile: compact row (same as original)
            return (
              <button key={tx.id} onClick={() => navigate(`/r/wallet/transaction/${tx.id}`)}
                className="flex items-center gap-3 px-5 py-3 w-full active:opacity-70"
                style={{ borderBottom: `1px solid ${c.divider}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg"
                  style={{ background: typeInfo.color + '18' }}>
                  {typeInfo.icon}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{typeInfo.label} {tx.asset}</span>
                  <span style={{ color: c.text3, fontSize: 12 }}>{tx.createdAt}</span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span style={{ color: typeInfo.color, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>
                    {isDebit ? '-' : '+'}{fmtAmount(tx.amount)} {tx.asset}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
                    style={{ background: statusInfo.color + '18', color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
                <ChevronRight size={14} color={c.text3} className="shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </PageLayout>
  );
}