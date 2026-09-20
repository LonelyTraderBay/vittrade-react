import React, { useState } from 'react';
import { History, Download, Filter, Search, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';

type TransactionType = 'stake' | 'unstake' | 'claim' | 'compound' | 'penalty';
type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  type: TransactionType;
  asset: string;
  amount: number;
  usdValue: number;
  product: string;
  date: string;
  time: string;
  status: TransactionStatus;
  txHash?: string;
  note?: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: 'tx1', type: 'stake', asset: 'BTC', amount: 0.05, usdValue: 3377, product: 'BTC Fixed 90D', date: '01/01/2026', time: '14:23', status: 'completed', txHash: '0x1234...5678' },
  { id: 'tx2', type: 'stake', asset: 'USDT', amount: 2500, usdValue: 2500, product: 'USDT Flexible', date: '15/01/2026', time: '09:45', status: 'completed', txHash: '0xabcd...ef12' },
  { id: 'tx3', type: 'claim', asset: 'BTC', amount: 0.00015, usdValue: 10.13, product: 'BTC Fixed 90D', date: '01/02/2026', time: '00:00', status: 'completed', note: 'Nhận lãi tự động' },
  { id: 'tx4', type: 'stake', asset: 'ETH', amount: 1.5, usdValue: 4200, product: 'ETH Fixed 60D', date: '20/01/2026', time: '16:12', status: 'completed', txHash: '0x9876...5432' },
  { id: 'tx5', type: 'claim', asset: 'USDT', amount: 8.5, usdValue: 8.5, product: 'USDT Flexible', date: '15/02/2026', time: '00:00', status: 'completed', note: 'Nhận lãi tự động' },
  { id: 'tx6', type: 'stake', asset: 'SOL', amount: 50, usdValue: 6500, product: 'SOL Fixed 30D', date: '01/02/2026', time: '11:30', status: 'completed', txHash: '0xdef0...9abc' },
  { id: 'tx7', type: 'compound', asset: 'USDT', amount: 10.24, usdValue: 10.24, product: 'USDT Flexible', date: '01/03/2026', time: '00:00', status: 'completed', note: 'Tái đầu tư tự động' },
  { id: 'tx8', type: 'stake', asset: 'LP', amount: 1000, usdValue: 1000, product: 'ETH-USDT LP', date: '10/02/2026', time: '13:45', status: 'completed', txHash: '0x1111...2222' },
  { id: 'tx9', type: 'claim', asset: 'ETH', amount: 0.018, usdValue: 50.4, product: 'ETH Fixed 60D', date: '20/02/2026', time: '00:00', status: 'completed', note: 'Nhận lãi tự động' },
  { id: 'tx10', type: 'unstake', asset: 'SOL', amount: 51.2, usdValue: 6656, product: 'SOL Fixed 30D', date: '03/03/2026', time: '10:15', status: 'pending', note: 'Đang xử lý unbonding' },
  { id: 'tx11', type: 'penalty', asset: 'BTC', amount: 0.00005, usdValue: 3.38, product: 'BTC Fixed 90D', date: '05/02/2026', time: '14:20', status: 'completed', note: 'Phí rút sớm' },
  { id: 'tx12', type: 'claim', asset: 'LP', amount: 12.8, usdValue: 12.8, product: 'ETH-USDT LP', date: '25/02/2026', time: '00:00', status: 'completed', note: 'Nhận lãi hàng tuần' },
];

const TYPE_CONFIG = {
  stake: { label: 'Stake', icon: ArrowUpRight, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  unstake: { label: 'Unstake', icon: ArrowDownRight, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  claim: { label: 'Nhận lãi', icon: DollarSign, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  compound: { label: 'Tái đầu tư', icon: ArrowUpRight, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  penalty: { label: 'Phí phạt', icon: XCircle, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
};

const STATUS_CONFIG = {
  completed: { label: 'Hoàn thành', color: '#10B981' },
  pending: { label: 'Đang xử lý', color: '#F59E0B' },
  failed: { label: 'Thất bại', color: '#EF4444' },
};

export function StakingHistoryPage() {
  const c = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('all');

  const filtered = TRANSACTIONS.filter(tx => {
    const matchSearch = tx.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       tx.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'all' || tx.type === typeFilter;
    const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
    
    let matchDate = true;
    if (dateRange !== 'all') {
      const txDate = new Date(tx.date.split('/').reverse().join('-'));
      const now = new Date();
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      matchDate = txDate >= cutoff;
    }
    
    return matchSearch && matchType && matchStatus && matchDate;
  });

  const totalStaked = TRANSACTIONS.filter(tx => tx.type === 'stake').reduce((sum, tx) => sum + tx.usdValue, 0);
  const totalEarned = TRANSACTIONS.filter(tx => tx.type === 'claim' || tx.type === 'compound').reduce((sum, tx) => sum + tx.usdValue, 0);
  const totalUnstaked = TRANSACTIONS.filter(tx => tx.type === 'unstake').reduce((sum, tx) => sum + tx.usdValue, 0);

  const handleExport = () => {
    const csv = [
      'Date,Time,Type,Asset,Amount,USD Value,Product,Status,Tx Hash,Note',
      ...filtered.map(tx => 
        `${tx.date},${tx.time},${TYPE_CONFIG[tx.type].label},${tx.asset},${tx.amount},${tx.usdValue},${tx.product},${STATUS_CONFIG[tx.status].label},${tx.txHash || ''},${tx.note || ''}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staking-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageLayout>
      <Header title="Lịch sử Staking" back />

      {/* Filter Bottom Sheet */}
      <BottomSheetV2
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Bộ lọc">
        <div className="flex flex-col gap-4">
          <div>
            <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Loại giao dịch</p>
            <div className="flex flex-wrap gap-2">
              {(['all', 'stake', 'unstake', 'claim', 'compound', 'penalty'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: typeFilter === type ? c.chipActiveBg : c.chipBg,
                    color: typeFilter === type ? c.chipActiveText : c.chipText,
                    border: `1px solid ${typeFilter === type ? c.chipActiveBorder : c.chipBorder}`,
                  }}>
                  {type === 'all' ? 'Tất cả' : TYPE_CONFIG[type].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Trạng thái</p>
            <div className="flex gap-2">
              {(['all', 'completed', 'pending', 'failed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: statusFilter === status ? c.chipActiveBg : c.chipBg,
                    color: statusFilter === status ? c.chipActiveText : c.chipText,
                    border: `1px solid ${statusFilter === status ? c.chipActiveBorder : c.chipBorder}`,
                  }}>
                  {status === 'all' ? 'Tất cả' : STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Khoảng thời gian</p>
            <div className="flex gap-2">
              {[
                { id: '7d' as const, label: '7 ngày' },
                { id: '30d' as const, label: '30 ngày' },
                { id: '90d' as const, label: '90 ngày' },
                { id: 'all' as const, label: 'Tất cả' },
              ].map(range => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: dateRange === range.id ? c.chipActiveBg : c.chipBg,
                    color: dateRange === range.id ? c.chipActiveText : c.chipText,
                    border: `1px solid ${dateRange === range.id ? c.chipActiveBorder : c.chipBorder}`,
                  }}>
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheetV2>

      {/* Transaction Detail Bottom Sheet */}
      <BottomSheetV2
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Chi tiết Giao dịch">
        {selectedTx && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: TYPE_CONFIG[selectedTx.type].bg }}>
                {React.createElement(TYPE_CONFIG[selectedTx.type].icon, { size: 24, color: TYPE_CONFIG[selectedTx.type].color })}
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                  {TYPE_CONFIG[selectedTx.type].label}
                </p>
                <p style={{ color: c.text3, fontSize: 12 }}>{selectedTx.product}</p>
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: 13 }}>Số lượng</span>
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                    {selectedTx.type === 'unstake' || selectedTx.type === 'claim' ? '+' : ''}
                    {fmtAmount(selectedTx.amount)} {selectedTx.asset}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: 13 }}>Giá trị USD</span>
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtUsd(selectedTx.usdValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: 13 }}>Thời gian</span>
                  <span style={{ color: c.text1, fontSize: 14 }}>
                    {selectedTx.date} {selectedTx.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: 13 }}>Trạng thái</span>
                  <span
                    className="px-2 py-1 rounded-lg text-xs font-bold"
                    style={{
                      background: `${STATUS_CONFIG[selectedTx.status].color}22`,
                      color: STATUS_CONFIG[selectedTx.status].color,
                    }}>
                    {STATUS_CONFIG[selectedTx.status].label}
                  </span>
                </div>
                {selectedTx.txHash && (
                  <div className="flex justify-between">
                    <span style={{ color: c.text3, fontSize: 13 }}>Tx Hash</span>
                    <button
                      className="text-xs font-mono"
                      style={{ color: '#3B82F6' }}
                      onClick={() => navigator.clipboard.writeText(selectedTx.txHash!)}>
                      {selectedTx.txHash}
                    </button>
                  </div>
                )}
                {selectedTx.note && (
                  <div>
                    <span style={{ color: c.text3, fontSize: 13, display: 'block', marginBottom: 4 }}>Ghi chú</span>
                    <span style={{ color: c.text2, fontSize: 13 }}>{selectedTx.note}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </BottomSheetV2>

      <PageContent>
        {/* Summary */}
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Đã stake</p>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtUsd(totalStaked)}
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Đã nhận</p>
              <p style={{ color: '#3B82F6', fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                +{fmtUsd(totalEarned)}
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Đã rút</p>
              <p style={{ color: '#F59E0B', fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtUsd(totalUnstaked)}
              </p>
            </div>
          </div>
        </TrCard>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 rounded-xl" style={{ background: c.surface2, height: 44 }}>
            <Search size={18} color={c.text3} />
            <input
              type="text"
              placeholder="Tìm asset, sản phẩm, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: 14 }}
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: (typeFilter !== 'all' || statusFilter !== 'all' || dateRange !== 'all') ? c.primary : c.surface2,
              color: (typeFilter !== 'all' || statusFilter !== 'all' || dateRange !== 'all') ? '#FFF' : c.text1,
            }}>
            <Filter size={18} />
          </button>
          <button
            onClick={handleExport}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: c.surface2, color: c.text1 }}>
            <Download size={18} />
          </button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p style={{ color: c.text2, fontSize: 13 }}>
            {filtered.length} giao dịch
            {(typeFilter !== 'all' || statusFilter !== 'all' || dateRange !== 'all') && 
              ` (đã lọc từ ${TRANSACTIONS.length})`}
          </p>
          {(typeFilter !== 'all' || statusFilter !== 'all' || dateRange !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setDateRange('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold"
              style={{ color: '#3B82F6' }}>
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Transaction List */}
        <PageSection label="">
          {filtered.length === 0 ? (
            <TrCard className="p-8">
              <div className="flex flex-col items-center gap-3">
                <History size={48} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 14, textAlign: 'center' }}>
                  Không tìm thấy giao dịch
                </p>
                <button
                  onClick={() => {
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setDateRange('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: c.primary, color: '#FFF' }}>
                  Xóa bộ lọc
                </button>
              </div>
            </TrCard>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(tx => {
                const config = TYPE_CONFIG[tx.type];
                const Icon = config.icon;
                return (
                  <TrCard
                    key={tx.id}
                    hover
                    className="p-3"
                    onClick={() => setSelectedTx(tx)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: config.bg }}>
                        <Icon size={18} color={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }} className="text-truncate">
                            {config.label}
                          </p>
                          <span
                            className="px-1.5 py-0.5 rounded-md text-xs font-bold shrink-0"
                            style={{
                              background: `${STATUS_CONFIG[tx.status].color}22`,
                              color: STATUS_CONFIG[tx.status].color,
                            }}>
                            {STATUS_CONFIG[tx.status].label}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: 11 }} className="text-truncate">
                          {tx.product} • {tx.date} {tx.time}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{
                          color: tx.type === 'unstake' || tx.type === 'claim' || tx.type === 'compound' ? '#10B981' : 
                                 tx.type === 'penalty' ? '#EF4444' : c.text1,
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}>
                          {tx.type === 'unstake' || tx.type === 'claim' || tx.type === 'compound' ? '+' : 
                           tx.type === 'penalty' ? '-' : ''}
                          {fmtAmount(tx.amount)} {tx.asset}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          {fmtUsd(tx.usdValue)}
                        </p>
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          )}
        </PageSection>

        {/* Footer Info */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Lịch sử giao dịch được lưu trữ vĩnh viễn. Bạn có thể xuất CSV để lưu trữ hoặc khai báo thuế. Giá trị USD tính theo tỷ giá tại thời điểm giao dịch.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
