import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  Download,
  ArrowUpDown,
  RefreshCw,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { WEB_FONT, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';
import { TRANSACTIONS } from '../../data/mockData';
import { fmtAmount, fmtFee, fmtUsd } from '../../data/formatNumber';

/**
 * ══════════════════════════════════════════════════════════
 *  WebTxHistoryPage — Enterprise Transaction History
 * ══════════════════════════════════════════════════════════
 *
 *  Full-width data table with:
 *  - Type filter tabs
 *  - Status filter chips
 *  - Search by asset/txHash
 *  - Sortable columns
 *  - Pagination controls
 *  - Export functionality
 */

const TYPE_MAP: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  deposit: { label: 'Nạp', color: '#10B981', icon: ArrowDownLeft },
  withdraw: { label: 'Rút', color: '#EF4444', icon: ArrowUpRight },
  trade_buy: { label: 'Mua', color: '#10B981', icon: ArrowLeftRight },
  trade_sell: { label: 'Bán', color: '#EF4444', icon: ArrowLeftRight },
  p2p_buy: { label: 'P2P Mua', color: '#10B981', icon: Users },
  p2p_sell: { label: 'P2P Bán', color: '#EF4444', icon: Users },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  completed: { label: 'Hoàn thành', color: '#10B981' },
  pending: { label: 'Đang xử lý', color: '#F59E0B' },
  failed: { label: 'Thất bại', color: '#EF4444' },
};

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'deposit', label: 'Nạp' },
  { id: 'withdraw', label: 'Rút' },
  { id: 'trade', label: 'Giao dịch' },
  { id: 'p2p', label: 'P2P' },
];

const STATUS_FILTERS = ['Tất cả', 'Hoàn thành', 'Đang xử lý', 'Thất bại'];

type SortKey = 'time' | 'amount' | 'type';
type SortDir = 'asc' | 'desc';

export function WebTxHistoryPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let list = [...TRANSACTIONS];

    // Type filter
    if (typeFilter === 'deposit') list = list.filter((tx) => tx.type === 'deposit');
    else if (typeFilter === 'withdraw') list = list.filter((tx) => tx.type === 'withdraw');
    else if (typeFilter === 'trade') list = list.filter((tx) => tx.type.startsWith('trade'));
    else if (typeFilter === 'p2p') list = list.filter((tx) => tx.type.startsWith('p2p'));

    // Status filter
    if (statusFilter === 'Hoàn thành') list = list.filter((tx) => tx.status === 'completed');
    else if (statusFilter === 'Đang xử lý') list = list.filter((tx) => tx.status === 'pending');
    else if (statusFilter === 'Thất bại') list = list.filter((tx) => tx.status === 'failed');

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (tx) =>
          tx.asset.toLowerCase().includes(q) ||
          (tx.txHash && tx.txHash.toLowerCase().includes(q)) ||
          (tx.network && tx.network.toLowerCase().includes(q)),
      );
    }

    // Sort
    list.sort((a, b) => {
      let diff = 0;
      if (sortKey === 'time')
        diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortKey === 'amount') diff = a.amount - b.amount;
      else if (sortKey === 'type') diff = a.type.localeCompare(b.type);
      return sortDir === 'asc' ? diff : -diff;
    });

    return list;
  }, [typeFilter, statusFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const totalDeposits = TRANSACTIONS.filter(
    (tx) => tx.type === 'deposit' && tx.status === 'completed',
  ).reduce((s, tx) => s + tx.amount, 0);
  const totalWithdraws = TRANSACTIONS.filter(
    (tx) => tx.type === 'withdraw' && tx.status === 'completed',
  ).reduce((s, tx) => s + tx.amount, 0);
  const pendingCount = TRANSACTIONS.filter((tx) => tx.status === 'pending').length;

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Lịch sử giao dịch"
        subtitle={`${TRANSACTIONS.length} giao dịch`}
        back
        right={
          <button
            className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
            style={{
              border: `1px solid ${c.border}`,
              fontSize: WEB_FONT.sm,
              fontWeight: 600,
              color: c.text2,
            }}
          >
            <Download size={13} /> Xuất CSV
          </button>
        }
      />
      <div className="flex flex-col gap-5 py-6 px-6" style={{ maxWidth: 1200 }}>
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Tổng nạp (USDT)',
              value: `${fmtAmount(totalDeposits, 2)} USDT`,
              color: '#10B981',
            },
            {
              label: 'Tổng rút (USDT)',
              value: `${fmtAmount(totalWithdraws, 2)} USDT`,
              color: '#EF4444',
            },
            { label: 'Đang xử lý', value: `${pendingCount} giao dịch`, color: '#F59E0B' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p
                style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, marginBottom: 4 }}
              >
                {s.label}
              </p>
              <p
                style={{
                  color: s.color,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex items-center gap-3">
          {/* Type filter */}
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setTypeFilter(f.id);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-md transition-colors"
                style={{
                  background: typeFilter === f.id ? c.chipActiveBg : 'transparent',
                  color: typeFilter === f.id ? c.chipActiveText : c.text3,
                  fontSize: WEB_FONT.sm,
                  fontWeight: typeFilter === f.id ? 600 : 500,
                  border: `1px solid ${typeFilter === f.id ? c.chipActiveBorder : 'transparent'}`,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6" style={{ background: c.divider }} />

          {/* Status filter */}
          <div className="flex gap-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-md transition-colors"
                style={{
                  background: statusFilter === s ? c.chipActiveBg : 'transparent',
                  color: statusFilter === s ? c.chipActiveText : c.text3,
                  fontSize: WEB_FONT.xs,
                  fontWeight: statusFilter === s ? 600 : 500,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-lg px-3"
            style={{
              background: c.searchBg,
              border: `1px solid ${c.searchBorder}`,
              height: 34,
              width: 220,
            }}
          >
            <Search size={13} color={c.text3} />
            <input
              placeholder="Tìm asset, txHash..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="flex-1 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: WEB_FONT.sm }}
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={12} color={c.text3} />
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: c.surface, border: `1px solid ${c.border}` }}
        >
          {/* Table header */}
          <div
            className="grid items-center px-5 py-2.5"
            style={{
              gridTemplateColumns: '36px 1.5fr 1fr 1fr 1.2fr 1fr 80px 80px',
              borderBottom: `1px solid ${c.divider}`,
            }}
          >
            <span />
            <button
              onClick={() => handleSort('type')}
              className="flex items-center gap-1"
              style={{
                color: sortKey === 'type' ? '#3B82F6' : c.text3,
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
              }}
            >
              Loại {sortKey === 'type' && <ArrowUpDown size={9} />}
            </button>
            <span
              style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}
            >
              Tài sản
            </span>
            <button
              onClick={() => handleSort('amount')}
              className="flex items-center gap-1 justify-end"
              style={{
                color: sortKey === 'amount' ? '#3B82F6' : c.text3,
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
              }}
            >
              Số lượng {sortKey === 'amount' && <ArrowUpDown size={9} />}
            </button>
            <button
              onClick={() => handleSort('time')}
              className="flex items-center gap-1 justify-end"
              style={{
                color: sortKey === 'time' ? '#3B82F6' : c.text3,
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
              }}
            >
              Thời gian {sortKey === 'time' && <ArrowUpDown size={9} />}
            </button>
            <span
              style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}
            >
              Mạng
            </span>
            <span
              style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}
            >
              Phí
            </span>
            <span
              style={{
                color: c.text3,
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Trạng thái
            </span>
          </div>

          {/* Rows */}
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <RefreshCw size={32} color={c.text3} style={{ opacity: 0.3 }} />
              <p style={{ color: c.text3, fontSize: WEB_FONT.base }}>Không tìm thấy giao dịch</p>
            </div>
          ) : (
            paginated.map((tx, i) => {
              const type = TYPE_MAP[tx.type] || { label: tx.type, color: '#8B95B3', icon: Clock };
              const status = STATUS_MAP[tx.status] || { label: tx.status, color: '#8B95B3' };
              const Icon = type.icon;
              const isDebit =
                tx.type === 'withdraw' || tx.type === 'trade_sell' || tx.type === 'p2p_sell';

              return (
                <div
                  key={tx.id}
                  className="web-cmd-btn grid items-center px-5 py-2.5 transition-colors cursor-pointer"
                  style={{
                    gridTemplateColumns: '36px 1.5fr 1fr 1fr 1.2fr 1fr 80px 80px',
                    borderBottom: i < paginated.length - 1 ? `1px solid ${c.divider}` : 'none',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: type.color + '12' }}
                  >
                    <Icon size={13} color={type.color} />
                  </div>

                  {/* Type */}
                  <div className="flex items-center gap-2">
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                      {type.label}
                    </span>
                    {tx.txHash && (
                      <span style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                        {tx.txHash}
                      </span>
                    )}
                  </div>

                  {/* Asset */}
                  <span
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      textAlign: 'right',
                    }}
                  >
                    {tx.asset}
                  </span>

                  {/* Amount */}
                  <span
                    style={{
                      color: isDebit ? '#EF4444' : '#10B981',
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                    }}
                  >
                    {isDebit ? '-' : '+'}
                    {fmtAmount(tx.amount)} {tx.asset}
                  </span>

                  {/* Time */}
                  <span
                    style={{
                      color: c.text2,
                      fontSize: WEB_FONT.xs,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                    }}
                  >
                    {tx.createdAt}
                  </span>

                  {/* Network */}
                  <span style={{ color: c.text3, fontSize: WEB_FONT.xs, textAlign: 'right' }}>
                    {tx.network || '—'}
                  </span>

                  {/* Fee */}
                  <span
                    style={{
                      color: c.text3,
                      fontSize: WEB_FONT.xs,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                    }}
                  >
                    {tx.fee ? fmtFee(tx.fee) : '—'}
                  </span>

                  {/* Status */}
                  <div className="flex justify-center">
                    <span
                      className="rounded px-1.5 py-0.5"
                      style={{
                        background: status.color + '12',
                        color: status.color,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
              Trang {page}/{totalPages} · {filtered.length} kết quả
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="web-cmd-btn w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ border: `1px solid ${c.border}`, opacity: page <= 1 ? 0.3 : 1 }}
              >
                <ChevronLeft size={14} color={c.text2} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: page === p ? '#3B82F6' : 'transparent',
                      color: page === p ? '#fff' : c.text2,
                      fontSize: WEB_FONT.sm,
                      fontWeight: page === p ? 700 : 500,
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="web-cmd-btn w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ border: `1px solid ${c.border}`, opacity: page >= totalPages ? 0.3 : 1 }}
              >
                <ChevronRight size={14} color={c.text2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
