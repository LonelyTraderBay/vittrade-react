import React, { useState, useMemo } from 'react';
import {
  Search, Filter, ArrowDownToLine, ArrowUpFromLine, TrendingUp,
  Clock, CheckCircle, XCircle, ChevronRight, Download, Copy,
  Calendar, Info, Zap, AlertTriangle, X,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════
   Types & Config
   ═══════════════════════════════════════════════════════════ */
type TxType = 'subscribe' | 'redeem' | 'interest' | 'compound' | 'early_redeem';
type TxStatus = 'completed' | 'pending' | 'failed';

interface SavingsTx {
  id: string;
  type: TxType;
  asset: string;
  amount: number;
  usdValue: number;
  product: string;
  date: string;
  time: string;
  status: TxStatus;
  refId: string;
  note?: string;
  fee?: number;
  lockDays?: number | null;
  apy?: number;
}

const TYPE_CONFIG: Record<TxType, { label: string; icon: typeof ArrowDownToLine; color: string; bg: string }> = {
  subscribe: { label: 'Gửi tiết kiệm', icon: ArrowDownToLine, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  redeem: { label: 'Rút tiết kiệm', icon: ArrowUpFromLine, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  interest: { label: 'Nhận lãi', icon: TrendingUp, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  compound: { label: 'Tái đầu tư', icon: Zap, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  early_redeem: { label: 'Rút sớm', icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

const STATUS_CONFIG: Record<TxStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  completed: { label: 'Hoàn thành', color: '#10B981', icon: CheckCircle },
  pending: { label: 'Đang xử lý', color: '#F59E0B', icon: Clock },
  failed: { label: 'Thất bại', color: '#EF4444', icon: XCircle },
};

/* ═══════════════════════════════════════════════════════════
   Mock Transaction Data (deterministic)
   ═══════════════════════════════════════════════════════════ */
const TRANSACTIONS: SavingsTx[] = [
  {
    id: 'stx01', type: 'subscribe', asset: 'USDT', amount: 3500, usdValue: 3500,
    product: 'USDT Linh hoạt', date: '01/02/2026', time: '10:15',
    status: 'completed', refId: 'SAV-DJKL-7823-MNPQ', apy: 4.5, lockDays: null,
  },
  {
    id: 'stx02', type: 'subscribe', asset: 'BTC', amount: 0.02, usdValue: 1350.86,
    product: 'BTC Cố định 60D', date: '15/01/2026', time: '14:32',
    status: 'completed', refId: 'SAV-BKLM-4521-WXYZ', apy: 3.5, lockDays: 60,
  },
  {
    id: 'stx03', type: 'interest', asset: 'USDT', amount: 4.38, usdValue: 4.38,
    product: 'USDT Linh hoạt', date: '15/02/2026', time: '00:00',
    status: 'completed', refId: 'INT-USDT-0215-AUTO', note: 'Lãi tự động phân phối',
  },
  {
    id: 'stx04', type: 'subscribe', asset: 'SOL', amount: 25, usdValue: 3250,
    product: 'SOL Cố định 30D', date: '20/02/2026', time: '09:45',
    status: 'completed', refId: 'SAV-SOLQ-8834-RTYU', apy: 6.5, lockDays: 30,
  },
  {
    id: 'stx05', type: 'compound', asset: 'USDT', amount: 4.38, usdValue: 4.38,
    product: 'USDT Linh hoạt', date: '15/02/2026', time: '00:01',
    status: 'completed', refId: 'CMP-USDT-0215-AUTO', note: 'Tái đầu tư tự động vào gốc',
  },
  {
    id: 'stx06', type: 'subscribe', asset: 'ETH', amount: 0.8, usdValue: 2240,
    product: 'ETH Linh hoạt', date: '05/02/2026', time: '16:20',
    status: 'completed', refId: 'SAV-ETHF-6612-JKLM', apy: 2.8, lockDays: null,
  },
  {
    id: 'stx07', type: 'interest', asset: 'USDT', amount: 5.10, usdValue: 5.10,
    product: 'USDT Linh hoạt', date: '01/03/2026', time: '00:00',
    status: 'completed', refId: 'INT-USDT-0301-AUTO', note: 'Lãi tự động phân phối',
  },
  {
    id: 'stx08', type: 'compound', asset: 'USDT', amount: 5.10, usdValue: 5.10,
    product: 'USDT Linh hoạt', date: '01/03/2026', time: '00:01',
    status: 'completed', refId: 'CMP-USDT-0301-AUTO', note: 'Tái đầu tư tự động vào gốc',
  },
  {
    id: 'stx09', type: 'interest', asset: 'BTC', amount: 0.000019, usdValue: 1.28,
    product: 'BTC Cố định 60D', date: '01/03/2026', time: '00:00',
    status: 'completed', refId: 'INT-BTC-0301-AUTO', note: 'Lãi cố định phân phối',
  },
  {
    id: 'stx10', type: 'interest', asset: 'SOL', amount: 0.45, usdValue: 58.50,
    product: 'SOL Cố định 30D', date: '05/03/2026', time: '00:00',
    status: 'completed', refId: 'INT-SOL-0305-AUTO', note: 'Lãi cố định phân phối',
  },
  {
    id: 'stx11', type: 'interest', asset: 'ETH', amount: 0.0012, usdValue: 3.36,
    product: 'ETH Linh hoạt', date: '05/03/2026', time: '00:00',
    status: 'completed', refId: 'INT-ETH-0305-AUTO', note: 'Lãi tự động phân phối',
  },
  {
    id: 'stx12', type: 'early_redeem', asset: 'SOL', amount: 10, usdValue: 1300,
    product: 'SOL Cố định 30D', date: '08/03/2026', time: '11:30',
    status: 'pending', refId: 'RDM-SOLE-0308-ABCD',
    fee: 0.12, note: 'Rút sớm — phí phạt 1.2%',
  },
];

/* ─── Skeleton ─── */
function SkeletonList({ rows }: { rows: number }) {
  const c = useThemeColors();
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: c.surface2 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl" style={{ background: c.borderSolid }} />
            <div className="flex-1">
              <div className="h-3 rounded mb-1.5" style={{ background: c.borderSolid, width: '55%' }} />
              <div className="h-2.5 rounded" style={{ background: c.borderSolid, width: '35%' }} />
            </div>
            <div className="h-4 w-16 rounded" style={{ background: c.borderSolid }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export function SavingsHistoryPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight, hapticSuccess } = useHaptic();
  const { isLoading } = useLoadingState({ loadOnly: true, initialDelay: 500 });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TxType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TxStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [selectedTx, setSelectedTx] = useState<SavingsTx | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* ─── Filtering ─── */
  const filtered = useMemo(() => {
    return TRANSACTIONS.filter(tx => {
      // Text search
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || tx.asset.toLowerCase().includes(q) ||
        tx.product.toLowerCase().includes(q) ||
        tx.refId.toLowerCase().includes(q);

      // Type filter
      const matchType = typeFilter === 'all' || tx.type === typeFilter;

      // Status filter
      const matchStatus = statusFilter === 'all' || tx.status === statusFilter;

      // Date range
      let matchDate = true;
      if (dateRange !== 'all') {
        const txDate = new Date(tx.date.split('/').reverse().join('-'));
        const now = new Date('2026-03-09');
        const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        matchDate = txDate >= cutoff;
      }

      return matchSearch && matchType && matchStatus && matchDate;
    }).sort((a, b) => {
      const da = new Date(a.date.split('/').reverse().join('-') + 'T' + a.time);
      const db = new Date(b.date.split('/').reverse().join('-') + 'T' + b.time);
      return db.getTime() - da.getTime(); // newest first
    });
  }, [searchQuery, typeFilter, statusFilter, dateRange]);

  /* ─── Summary stats ─── */
  const totalSubscribed = TRANSACTIONS.filter(t => t.type === 'subscribe' && t.status === 'completed')
    .reduce((s, t) => s + t.usdValue, 0);
  const totalInterest = TRANSACTIONS.filter(t => t.type === 'interest' && t.status === 'completed')
    .reduce((s, t) => s + t.usdValue, 0);
  const totalRedeemed = TRANSACTIONS.filter(t => (t.type === 'redeem' || t.type === 'early_redeem') && t.status === 'completed')
    .reduce((s, t) => s + t.usdValue, 0);

  const hasActiveFilters = typeFilter !== 'all' || statusFilter !== 'all' || dateRange !== 'all';

  /* ─── Copy ref ID ─── */
  const handleCopy = (refId: string) => {
    navigator.clipboard?.writeText(refId).catch(() => {});
    setCopiedId(refId);
    hapticSuccess();
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ─── Group by date ─── */
  const grouped = useMemo(() => {
    const map = new Map<string, SavingsTx[]>();
    for (const tx of filtered) {
      if (!map.has(tx.date)) map.set(tx.date, []);
      map.get(tx.date)!.push(tx);
    }
    return Array.from(map.entries());
  }, [filtered]);

  /* ─── Type filter chips ─── */
  const typeChips: { key: TxType | 'all'; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'subscribe', label: 'Gửi' },
    { key: 'redeem', label: 'Rút' },
    { key: 'interest', label: 'Lãi' },
    { key: 'compound', label: 'Tái ĐT' },
    { key: 'early_redeem', label: 'Rút sớm' },
  ];

  return (
    <PageLayout>
      <Header title="Lịch sử Tiết kiệm" back />
      <PageContent gap="default">
        {isLoading ? (
          <SkeletonList rows={6} />
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <TrCardStat>
                <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Tổng gửi</span>
                <span style={{ color: c.success, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                  {fmtUsd(totalSubscribed)}
                </span>
              </TrCardStat>
              <TrCardStat>
                <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Tổng lãi</span>
                <span style={{ color: c.accent, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                  {fmtUsd(totalInterest)}
                </span>
              </TrCardStat>
              <TrCardStat>
                <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Đã rút</span>
                <span style={{ color: c.primary, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                  {fmtUsd(totalRedeemed)}
                </span>
              </TrCardStat>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search size={ICON_SIZE.sm} color={c.text3}
                className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tài sản, sản phẩm, mã GD..."
                className="w-full h-10 pl-10 pr-10 rounded-xl outline-none"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  color: c.text,
                  fontSize: FONT_SCALE.sm,
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={ICON_SIZE.base} color={c.text3} strokeWidth={ICON_STROKE.standard} />
                </button>
              )}
            </div>

            {/* Type filter chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5">
              {typeChips.map(chip => {
                const isActive = typeFilter === chip.key;
                return (
                  <button key={chip.key}
                    onClick={() => { setTypeFilter(chip.key); hapticLight(); }}
                    className="shrink-0 px-3 py-1.5 rounded-lg"
                    style={{
                      background: isActive ? c.chipActiveBg : c.surface2,
                      color: isActive ? c.chipActiveText : c.text3,
                      border: `1px solid ${isActive ? c.chipActiveBorder : c.border}`,
                      fontSize: FONT_SCALE.xs, fontWeight: isActive ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular,
                    }}>
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Date range + status filter row */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {([
                  { key: '7d', label: '7N' },
                  { key: '30d', label: '30N' },
                  { key: '90d', label: '90N' },
                  { key: 'all', label: 'Tất cả' },
                ] as const).map(opt => (
                  <button key={opt.key}
                    onClick={() => { setDateRange(opt.key); hapticLight(); }}
                    className="flex-1 py-1.5 rounded-lg text-center"
                    style={{
                      background: dateRange === opt.key ? withAlpha(c.primary, ALPHA.muted) : c.portfolioBtnGhost,
                      color: dateRange === opt.key ? c.primary : c.text3,
                      fontSize: FONT_SCALE.micro, fontWeight: dateRange === opt.key ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular,
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowFilters(true); hapticLight(); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
                <Filter size={ICON_SIZE.base} color={hasActiveFilters ? c.primary : c.text3} strokeWidth={ICON_STROKE.standard} />
                {hasActiveFilters && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: c.primary }} />
                )}
              </button>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between px-1">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                {filtered.length} giao dịch
                {hasActiveFilters && ' (đã lọc)'}
              </span>
              <button
                onClick={() => hapticLight()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                style={{ background: c.portfolioBtnGhost }}>
                <Download size={ICON_SIZE.sm} color={c.text3} strokeWidth={ICON_STROKE.standard} />
                <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Xuất CSV</span>
              </button>
            </div>

            {/* Transaction list grouped by date */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: c.surface2 }}>
                  <Search size={ICON_SIZE.lg} color={c.text3} />
                </div>
                <span style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.medium }}>
                  Không tìm thấy giao dịch
                </span>
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </span>
                {hasActiveFilters && (
                  <button onClick={() => {
                    setTypeFilter('all'); setStatusFilter('all');
                    setDateRange('all'); setSearchQuery('');
                  }}
                    className="px-4 py-2 rounded-xl mt-1"
                    style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              grouped.map(([date, txs]) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={ICON_SIZE.sm} color={c.text3} />
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{date}</span>
                    <div className="flex-1 h-px" style={{ background: c.divider }} />
                  </div>

                  {/* Transactions for this date */}
                  <div className="flex flex-col gap-1.5">
                    {txs.map(tx => {
                      const cfg = TYPE_CONFIG[tx.type];
                      const statusCfg = STATUS_CONFIG[tx.status];
                      const Icon = cfg.icon;
                      const isIncome = tx.type === 'interest' || tx.type === 'compound';
                      const isOutgoing = tx.type === 'redeem' || tx.type === 'early_redeem';

                      return (
                        <button key={tx.id}
                          onClick={() => { setSelectedTx(tx); hapticSelection(); }}
                          className="w-full rounded-2xl p-3 flex items-center gap-3"
                          style={{ background: c.surface2 }}>
                          {/* Icon */}
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: cfg.bg }}>
                            <Icon size={ICON_SIZE.base} color={cfg.color} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span style={{ color: c.text, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                                {cfg.label}
                              </span>
                              {tx.status !== 'completed' && (
                                <div className="px-1.5 py-0.5 rounded"
                                  style={{ background: `${statusCfg.color}18`, fontSize: 9, color: statusCfg.color, fontWeight: FONT_WEIGHT.medium }}>
                                  {statusCfg.label}
                                </div>
                              )}
                            </div>
                            <div style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginTop: 1 }}>
                              {tx.product} · {tx.time}
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right shrink-0">
                            <div style={{
                              color: isIncome ? '#10B981' : isOutgoing ? '#EF4444' : c.text,
                              fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold,
                            }}>
                              {isIncome ? '+' : isOutgoing ? '-' : ''}{fmtAmount(tx.amount)} {tx.asset}
                            </div>
                            <div style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                              ≈ {fmtUsd(tx.usdValue)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </PageContent>

      {/* ═══ Filter Bottom Sheet ═══ */}
      <BottomSheetV2 open={showFilters} onClose={() => setShowFilters(false)} title="Bộ lọc nâng cao">
        <div className="px-5 pb-8 flex flex-col gap-4">
          {/* Status filter */}
          <div>
            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8, display: 'block' }}>
              Trạng thái
            </span>
            <div className="flex gap-2">
              {([
                { key: 'all' as const, label: 'Tất cả' },
                { key: 'completed' as const, label: 'Hoàn thành' },
                { key: 'pending' as const, label: 'Đang xử lý' },
                { key: 'failed' as const, label: 'Thất bại' },
              ]).map(opt => (
                <button key={opt.key}
                  onClick={() => { setStatusFilter(opt.key); hapticLight(); }}
                  className="flex-1 py-2 rounded-xl text-center"
                  style={{
                    background: statusFilter === opt.key ? 'rgba(59,130,246,0.15)' : c.surface2,
                    color: statusFilter === opt.key ? '#3B82F6' : c.text3,
                    border: `1px solid ${statusFilter === opt.key ? 'rgba(59,130,246,0.3)' : c.border}`,
                    fontSize: FONT_SCALE.xs, fontWeight: statusFilter === opt.key ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular,
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div className="flex gap-3 mt-2">
            <button onClick={() => {
              setTypeFilter('all'); setStatusFilter('all');
              setDateRange('all'); setSearchQuery('');
              setShowFilters(false);
            }}
              className="flex-1 py-3 rounded-2xl"
              style={{ background: c.surface2, color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              Xóa bộ lọc
            </button>
            <button onClick={() => setShowFilters(false)}
              className="flex-1 py-3 rounded-2xl"
              style={{ background: c.primary, color: '#FFF', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              Áp dụng
            </button>
          </div>
        </div>
      </BottomSheetV2>

      {/* ═══ Transaction Detail Bottom Sheet ═══ */}
      <BottomSheetV2
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Chi tiết giao dịch"
      >
        {selectedTx && (() => {
          const cfg = TYPE_CONFIG[selectedTx.type];
          const statusCfg = STATUS_CONFIG[selectedTx.status];
          const Icon = cfg.icon;
          const StatusIcon = statusCfg.icon;
          const isIncome = selectedTx.type === 'interest' || selectedTx.type === 'compound';

          return (
            <div className="px-5 pb-8 flex flex-col gap-4">
              {/* Hero */}
              <div className="flex flex-col items-center py-4 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: cfg.bg }}>
                  <Icon size={ICON_SIZE.lg} color={cfg.color} />
                </div>
                <div className="text-center">
                  <div style={{ color: c.text, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.semibold }}>{cfg.label}</div>
                  <div style={{
                    color: isIncome ? '#10B981' : cfg.color,
                    fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, marginTop: 4,
                  }}>
                    {isIncome ? '+' : ''}{fmtAmount(selectedTx.amount)} {selectedTx.asset}
                  </div>
                  <div style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginTop: 2 }}>
                    ≈ {fmtUsd(selectedTx.usdValue)}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 py-2 rounded-xl"
                style={{ background: `${statusCfg.color}12` }}>
                <StatusIcon size={ICON_SIZE.sm} color={statusCfg.color} />
                <span style={{ color: statusCfg.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  {statusCfg.label}
                </span>
              </div>

              {/* Detail rows */}
              <TrCard>
                <div className="flex flex-col gap-0">
                  <BottomSheetRow label="Sản phẩm" value={selectedTx.product} />
                  <BottomSheetRow label="Thời gian" value={`${selectedTx.date} ${selectedTx.time}`} />
                  {selectedTx.apy != null && (
                    <BottomSheetRow label="APY" value={`${selectedTx.apy}%`} valueColor="#10B981" />
                  )}
                  {selectedTx.lockDays != null && (
                    <BottomSheetRow label="Thời hạn" value={selectedTx.lockDays ? `${selectedTx.lockDays} ngày` : 'Linh hoạt'} />
                  )}
                  {selectedTx.fee != null && selectedTx.fee > 0 && (
                    <BottomSheetRow label="Phí" value={`${fmtAmount(selectedTx.fee)} ${selectedTx.asset}`} valueColor="#EF4444" />
                  )}
                  {selectedTx.note && (
                    <BottomSheetRow label="Ghi chú" value={selectedTx.note} />
                  )}
                </div>
              </TrCard>

              {/* Reference ID */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Mã GD:</span>
                <span style={{ color: c.text, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, flex: 1, fontFamily: 'monospace' }}>
                  {selectedTx.refId}
                </span>
                <button onClick={() => handleCopy(selectedTx.refId)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: c.portfolioBtnGhost }}>
                  {copiedId === selectedTx.refId ? (
                    <CheckCircle size={ICON_SIZE.sm} color="#10B981" />
                  ) : (
                    <Copy size={ICON_SIZE.sm} color={c.text3} />
                  )}
                </button>
              </div>

              {/* View receipt */}
              <button
                onClick={() => {
                  setSelectedTx(null);
                  navigate(`${prefix}/earn/savings/receipt`, {
                    state: {
                      type: selectedTx.type === 'subscribe' ? 'subscribe' : 'redeem',
                      product: selectedTx.product,
                      asset: selectedTx.asset,
                      amount: selectedTx.amount,
                      apy: selectedTx.apy,
                      lockDays: selectedTx.lockDays,
                      fee: selectedTx.fee,
                    },
                  });
                  hapticSelection();
                }}
                className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
                style={{ background: c.primary, color: '#FFF', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Xem biên nhận
                <ChevronRight size={ICON_SIZE.sm} />
              </button>
            </div>
          );
        })()}
      </BottomSheetV2>
    </PageLayout>
  );
}