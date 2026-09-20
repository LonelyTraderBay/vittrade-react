import React, { useState } from 'react';
import { History, Filter, Download, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { TabBar } from '../../../components/layout/TabBar';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { toast } from 'sonner';

interface Trade {
  id: string;
  timestamp: string;
  botName: string;
  strategy: string;
  pair: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  fee: number;
  pnl: number;
  status: 'filled' | 'partial' | 'cancelled';
}

const TRADES: Trade[] = [
  { id: 't1', timestamp: '2026-03-08 14:32:15', botName: 'DCA Bot #1', strategy: 'DCA', pair: 'BTC/USDT', side: 'buy', qty: 0.001, price: 68450, fee: 0.034, pnl: 0, status: 'filled' },
  { id: 't2', timestamp: '2026-03-08 13:15:08', botName: 'Grid Bot #1', strategy: 'Grid', pair: 'ETH/USDT', side: 'sell', qty: 0.05, price: 3850, fee: 0.096, pnl: 12.50, status: 'filled' },
  { id: 't3', timestamp: '2026-03-08 12:00:42', botName: 'Grid Bot #1', strategy: 'Grid', pair: 'ETH/USDT', side: 'buy', qty: 0.05, price: 3800, fee: 0.095, pnl: 0, status: 'filled' },
  { id: 't4', timestamp: '2026-03-08 10:45:30', botName: 'Momentum Bot #1', strategy: 'Momentum', pair: 'SOL/USDT', side: 'buy', qty: 5, price: 142.30, fee: 0.356, pnl: 0, status: 'filled' },
  { id: 't5', timestamp: '2026-03-08 09:20:15', botName: 'DCA Bot #1', strategy: 'DCA', pair: 'BTC/USDT', side: 'buy', qty: 0.001, price: 68200, fee: 0.034, pnl: 0, status: 'filled' },
  { id: 't6', timestamp: '2026-03-07 18:30:22', botName: 'Grid Bot #1', strategy: 'Grid', pair: 'ETH/USDT', side: 'sell', qty: 0.05, price: 3820, fee: 0.096, pnl: 8.75, status: 'filled' },
  { id: 't7', timestamp: '2026-03-07 16:15:10', botName: 'Momentum Bot #1', strategy: 'Momentum', pair: 'SOL/USDT', side: 'sell', qty: 5, price: 138.50, fee: 0.346, pnl: -19.75, status: 'filled' },
];

export function BotHistoryPage() {
  const c = useThemeColors();
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrades = TRADES.filter(t => {
    const matchesFilter = filter === 'all' || t.side === filter;
    const matchesSearch = searchQuery === '' || 
      t.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pair.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPnL = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalFees = filteredTrades.reduce((sum, t) => sum + t.fee, 0);

  const handleExport = () => {
    toast.success('Exporting trade history to CSV...');
  };

  return (
    <PageLayout>
      <Header 
        title="Trade History" 
        back 
        action={{ icon: Download, onClick: handleExport }}
      />

      <PageContent>
        {/* Stats */}
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p style={{ color: c.text3, fontSize: 10 }}>Total Trades</p>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{filteredTrades.length}</p>
            </div>
            <div className="text-center">
              <p style={{ color: c.text3, fontSize: 10 }}>Total PnL</p>
              <p style={{ color: totalPnL >= 0 ? '#10B981' : '#EF4444', fontSize: 20, fontWeight: 700 }}>
                {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p style={{ color: c.text3, fontSize: 10 }}>Total Fees</p>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{totalFees.toFixed(2)}</p>
            </div>
          </div>
        </TrCard>

        {/* Search */}
        <div className="relative">
          <Search size={18} color={c.text3} className="absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by bot name or pair..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
            style={{ background: c.surface, color: c.text1, border: `1px solid ${c.borderSolid}` }}
          />
        </div>

        {/* Filter Tabs */}
        <TabBar
          variant="pill"
          tabs={[
            { id: 'all', label: `All (${TRADES.length})` },
            { id: 'buy', label: `Buy (${TRADES.filter(t => t.side === 'buy').length})` },
            { id: 'sell', label: `Sell (${TRADES.filter(t => t.side === 'sell').length})` },
          ]}
          active={filter}
          onChange={setFilter as any}
        />

        {/* Trade List */}
        <PageSection label={`Trades (${filteredTrades.length})`}>
          {filteredTrades.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <History size={48} color={c.text3} />
              <p style={{ color: c.text3, fontSize: 14 }}>No trades found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredTrades.map(trade => (
                <TrCard key={trade.id} className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          {trade.side === 'buy' ? (
                            <TrendingUp size={14} color="#10B981" />
                          ) : (
                            <TrendingDown size={14} color="#EF4444" />
                          )}
                          <span className="px-2 py-1 rounded-md text-xs font-bold"
                            style={{
                              background: trade.side === 'buy' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: trade.side === 'buy' ? '#10B981' : '#EF4444',
                            }}>
                            {trade.side.toUpperCase()}
                          </span>
                          <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{trade.pair}</span>
                        </div>
                      </div>
                      <p style={{ color: c.text3, fontSize: 10 }}>{trade.botName} • {trade.strategy}</p>
                    </div>
                    {trade.pnl !== 0 && (
                      <div className="text-right">
                        <p style={{ color: trade.pnl >= 0 ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: 700 }}>
                          {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>PnL</p>
                      </div>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10 }}>Qty</p>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                        {trade.qty}
                      </p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10 }}>Price</p>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                        ${trade.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10 }}>Fee</p>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                        ${trade.fee.toFixed(3)}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: c.borderSolid }}>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {trade.timestamp}
                    </p>
                    <span className="px-2 py-1 rounded-md text-xs font-bold"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                      {trade.status}
                    </span>
                  </div>
                </TrCard>
              ))}
            </div>
          )}
        </PageSection>

        {/* Export Note */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Export Options
          </p>
          <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
            Download your complete trade history for tax reporting, accounting, or analysis. Available formats: CSV, PDF, Excel.
          </p>
          <button
            onClick={handleExport}
            className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
            style={{ background: c.primary, color: '#FFF' }}>
            <Download size={14} />
            Export All Trades
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}