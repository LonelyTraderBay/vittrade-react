/**
 * ══════════════════════════════════════════════════════════════════
 *  POSITION DASHBOARD PAGE — Sprint 3
 * ══════════════════════════════════════════════════════════════════
 *  Unified view of all open positions across Spot + Futures + Margin
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, TrendingDown, Target, Shield, ChevronRight,
  Filter, RefreshCw, BarChart3, PieChart, AlertTriangle,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtSignedUsd, fmtPct, fmtAmount, fmtCompact } from '../../data/formatNumber';

interface Position {
  id: string;
  symbol: string;
  type: 'spot' | 'futures' | 'margin';
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  leverage?: number;
  liquidPrice?: number;
  tp?: number;
  sl?: number;
  margin?: number;
  unrealizedFee?: number;
}

const MOCK_POSITIONS: Position[] = [
  { id: 'sp1', symbol: 'BTC/USDT', type: 'spot', side: 'long', size: 0.045, entryPrice: 65200, currentPrice: 67543.21, pnl: 105.44, pnlPct: 3.59, tp: 72000, sl: 63000 },
  { id: 'sp2', symbol: 'ETH/USDT', type: 'spot', side: 'long', size: 1.2, entryPrice: 3380, currentPrice: 3521.45, pnl: 169.74, pnlPct: 4.18 },
  { id: 'sp3', symbol: 'SOL/USDT', type: 'spot', side: 'long', size: 25, entryPrice: 192, currentPrice: 185.32, pnl: -167.00, pnlPct: -3.48 },
  { id: 'ft1', symbol: 'ETH/USDT', type: 'futures', side: 'long', size: 0.5, entryPrice: 3480, currentPrice: 3521.45, pnl: 20.73, pnlPct: 1.19, leverage: 10, liquidPrice: 3150, margin: 174, tp: 3800, sl: 3300 },
  { id: 'ft2', symbol: 'SOL/USDT', type: 'futures', side: 'short', size: 10, entryPrice: 185, currentPrice: 178.32, pnl: 66.80, pnlPct: 3.61, leverage: 5, liquidPrice: 222, margin: 370 },
  { id: 'mg1', symbol: 'BTC/USDT', type: 'margin', side: 'long', size: 0.02, entryPrice: 66800, currentPrice: 67543.21, pnl: 14.86, pnlPct: 1.11, leverage: 3, margin: 445.33 },
];

const TYPE_LABELS: Record<string, string> = {
  spot: 'Spot',
  futures: 'Futures',
  margin: 'Margin',
};

const TYPE_COLORS: Record<string, string> = {
  spot: '#3B82F6',
  futures: '#F59E0B',
  margin: '#8B5CF6',
};

export function PositionDashboardPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState('all');
  const [sortBy, setSortBy] = useState<'pnl' | 'size' | 'pnlPct'>('pnl');

  const filtered = useMemo(() => {
    let list = tab === 'all' ? MOCK_POSITIONS : MOCK_POSITIONS.filter(p => p.type === tab);
    list = [...list].sort((a, b) => {
      if (sortBy === 'pnl') return Math.abs(b.pnl) - Math.abs(a.pnl);
      if (sortBy === 'pnlPct') return Math.abs(b.pnlPct) - Math.abs(a.pnlPct);
      return (b.size * b.currentPrice) - (a.size * a.currentPrice);
    });
    return list;
  }, [tab, sortBy]);

  const totals = useMemo(() => {
    const totalPnl = MOCK_POSITIONS.reduce((s, p) => s + p.pnl, 0);
    const totalValue = MOCK_POSITIONS.reduce((s, p) => s + p.size * p.currentPrice, 0);
    const totalMargin = MOCK_POSITIONS.filter(p => p.margin).reduce((s, p) => s + (p.margin ?? 0), 0);
    return { totalPnl, totalValue, totalMargin, count: MOCK_POSITIONS.length };
  }, []);

  return (
    <PageLayout>
      <Header title="Vị thế đang mở" back />

      {/* Summary cards */}
      <div className="px-5 pt-2 pb-3">
        <TrCard rounded="md" className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Tổng P/L</p>
              <p style={{
                color: totals.totalPnl >= 0 ? '#10B981' : '#EF4444',
                fontSize: 18, fontWeight: 700, fontFamily: 'monospace',
              }}>
                {fmtSignedUsd(totals.totalPnl)}
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Tổng giá trị</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtCompact(totals.totalValue, { prefix: '$' })}
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Ký quỹ đang dùng</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtUsd(totals.totalMargin)}
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      {/* Tabs */}
      <div className="px-5 pb-3">
        <TabBar
          variant="pill"
          tabs={[
            { id: 'all', label: `Tất cả (${MOCK_POSITIONS.length})` },
            { id: 'spot', label: `Spot (${MOCK_POSITIONS.filter(p => p.type === 'spot').length})` },
            { id: 'futures', label: `Futures (${MOCK_POSITIONS.filter(p => p.type === 'futures').length})` },
            { id: 'margin', label: `Margin (${MOCK_POSITIONS.filter(p => p.type === 'margin').length})` },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* Sort chips */}
      <div className="flex items-center gap-2 px-5 pb-3">
        <span style={{ color: c.text3, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' as const, marginRight: 2 }}>Sắp xếp</span>
        {([['pnl', 'P/L'], ['pnlPct', '%P/L'], ['size', 'Kích thước']] as const).map(([key, label]) => (
          <button key={key}
            onClick={() => setSortBy(key as any)}
            className="px-3 py-1.5 rounded-lg"
            style={{
              background: sortBy === key ? c.chipActiveBg : c.surface2,
              color: sortBy === key ? c.chipActiveText : c.text3,
              fontSize: 11, fontWeight: 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <PageContent gap="default">
        {filtered.map(pos => {
          const isProfit = pos.pnl >= 0;
          const value = pos.size * pos.currentPrice;
          return (
            <TrCard key={pos.id} rounded="sm" hover className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-center"
                    style={{
                      background: TYPE_COLORS[pos.type] + '15',
                      color: TYPE_COLORS[pos.type],
                      fontSize: 9, fontWeight: 700,
                    }}>
                    {TYPE_LABELS[pos.type]}
                  </span>
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{pos.symbol}</span>
                  <span className="px-1.5 py-0.5 rounded"
                    style={{
                      background: pos.side === 'long' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: pos.side === 'long' ? '#10B981' : '#EF4444',
                      fontSize: 10, fontWeight: 700,
                    }}>
                    {pos.side === 'long' ? 'LONG' : 'SHORT'}
                    {pos.leverage && ` ${pos.leverage}x`}
                  </span>
                </div>
                <span style={{
                  color: isProfit ? '#10B981' : '#EF4444',
                  fontSize: 14, fontWeight: 700, fontFamily: 'monospace',
                }}>
                  {fmtSignedUsd(pos.pnl)}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <p style={{ color: c.text3, fontSize: 10 }}>KL</p>
                  <p style={{ color: c.text1, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                    {fmtAmount(pos.size)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10 }}>Giá vào</p>
                  <p style={{ color: c.text1, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                    {fmtUsd(pos.entryPrice, { prefix: false })}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10 }}>Giá hiện tại</p>
                  <p style={{ color: c.text1, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                    {fmtUsd(pos.currentPrice, { prefix: false })}
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ color: c.text3, fontSize: 10 }}>%P/L</p>
                  <p style={{
                    color: isProfit ? '#10B981' : '#EF4444',
                    fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
                  }}>
                    {fmtPct(pos.pnlPct)}
                  </p>
                </div>
              </div>

              {/* TP/SL row */}
              {(pos.tp || pos.sl) && (
                <div className="flex gap-2 mt-2">
                  {pos.tp && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded"
                      style={{ background: 'rgba(16,185,129,0.06)' }}>
                      <Target size={9} color="#10B981" />
                      <span style={{ color: '#10B981', fontSize: 10, fontFamily: 'monospace' }}>
                        TP {fmtUsd(pos.tp, { prefix: false })}
                      </span>
                    </div>
                  )}
                  {pos.sl && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded"
                      style={{ background: 'rgba(239,68,68,0.06)' }}>
                      <Shield size={9} color="#EF4444" />
                      <span style={{ color: '#EF4444', fontSize: 10, fontFamily: 'monospace' }}>
                        SL {fmtUsd(pos.sl, { prefix: false })}
                      </span>
                    </div>
                  )}
                  {pos.liquidPrice && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded"
                      style={{ background: 'rgba(245,158,11,0.06)' }}>
                      <AlertTriangle size={9} color="#F59E0B" />
                      <span style={{ color: '#F59E0B', fontSize: 10, fontFamily: 'monospace' }}>
                        Liq {fmtUsd(pos.liquidPrice, { prefix: false })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </TrCard>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
              <BarChart3 size={28} color={c.borderSolid} />
            </div>
            <p style={{ color: c.text3, fontSize: 14 }}>Không có vị thế nào</p>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}