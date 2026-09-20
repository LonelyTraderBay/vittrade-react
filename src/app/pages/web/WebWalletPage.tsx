import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Eye, EyeOff, ChevronRight, Download, Upload, ShoppingCart, ArrowDownUp,
  Clock, PieChart, Search, Star, BookOpen, Shield, X, TrendingUp, TrendingDown,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useUI } from '../../contexts/UIContext';
import { WEB_FONT, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';
import { USER_ASSETS, TRANSACTIONS } from '../../data/mockData';
import { fmtUsd, fmtPrice, fmtPct, fmtAmount } from '../../data/formatNumber';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  completed: { label: 'Hoàn thành', color: '#10B981' },
  pending: { label: 'Đang xử lý', color: '#F59E0B' },
  failed: { label: 'Thất bại', color: '#EF4444' },
};

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  deposit: { label: 'Nạp', color: '#10B981' },
  withdraw: { label: 'Rút', color: '#EF4444' },
  trade_buy: { label: 'Mua', color: '#10B981' },
  trade_sell: { label: 'Bán', color: '#EF4444' },
  p2p_buy: { label: 'P2P Mua', color: '#10B981' },
  p2p_sell: { label: 'P2P Bán', color: '#EF4444' },
};

/* ─── Portfolio Summary Bar ─── */
function PortfolioSummaryBar({ totalUSD, isHidden, onToggle }: {
  totalUSD: number; isHidden: boolean; onToggle: () => void;
}) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const totalBTC = totalUSD / 67543.21;
  const dailyChange = 1842.31;
  const dailyPct = 3.52;

  return (
    <div className="rounded-xl p-5" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: c.text3, fontSize: WEB_FONT.sm, fontWeight: 500 }}>Tổng giá trị tài sản</span>
            <button onClick={onToggle} className="flex items-center justify-center" style={{ width: 20, height: 20 }}>
              {isHidden ? <EyeOff size={13} color={c.text3} /> : <Eye size={13} color={c.text3} />}
            </button>
          </div>
          <p style={{ color: c.text1, fontSize: 32, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>
            {isHidden ? '••••••••' : fmtUsd(totalUSD)}
          </p>
          <p style={{ color: c.text3, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
            {isHidden ? '•••••• BTC' : `≈ ${totalBTC.toFixed(8)} BTC`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ background: 'rgba(16,185,129,0.08)' }}>
            <TrendingUp size={13} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: WEB_FONT.base, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {isHidden ? '••••' : `+${fmtUsd(dailyChange)} (+${dailyPct}%)`}
            </span>
            <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginLeft: 4 }}>24h</span>
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="flex items-center gap-3 mt-5">
        {[
          { icon: Download, label: 'Nạp tiền', color: '#10B981', path: '/w/wallet/deposit/USDT' },
          { icon: Upload, label: 'Rút tiền', color: '#EF4444', path: '/w/wallet/withdraw/USDT' },
          { icon: ShoppingCart, label: 'Mua Crypto', color: '#3B82F6', path: '/w/wallet/buy-crypto' },
          { icon: ArrowDownUp, label: 'Chuyển', color: '#8B5CF6', path: '/w/wallet/transfer' },
        ].map(btn => {
          const Icon = btn.icon;
          return (
            <button key={btn.label} onClick={() => navigate(btn.path)}
              className="web-cmd-btn flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ border: `1px solid ${c.border}` }}>
              <Icon size={15} color={btn.color} />
              <span style={{ color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 600 }}>{btn.label}</span>
            </button>
          );
        })}
        <div className="flex-1" />
        <button onClick={() => navigate('/w/wallet/portfolio-analytics')}
          className="web-cmd-btn flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{ border: `1px solid ${c.border}` }}>
          <PieChart size={15} color={c.text3} />
          <span style={{ color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 600 }}>Phân tích</span>
        </button>
        <button onClick={() => navigate('/w/wallet/address-book')}
          className="web-cmd-btn flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{ border: `1px solid ${c.border}` }}>
          <BookOpen size={15} color={c.text3} />
          <span style={{ color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 600 }}>Sổ địa chỉ</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export function WebWalletPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { isBalanceHidden, toggleBalanceHidden } = useUI();
  const [searchAsset, setSearchAsset] = useState('');
  const [hideSmall, setHideSmall] = useState(false);

  const totalUSD = USER_ASSETS.reduce((s, a) => s + a.usdValue, 0);

  const filteredAssets = USER_ASSETS.filter(a => {
    if (hideSmall && a.usdValue < 1) return false;
    if (searchAsset) {
      const q = searchAsset.toLowerCase();
      return a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Ví tài sản"
        back
        right={
          <button onClick={() => navigate('/w/wallet/history')}
            className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: `1px solid ${c.border}`, fontSize: WEB_FONT.sm, fontWeight: 600, color: c.text2 }}>
            <Clock size={13} /> Lịch sử giao dịch
          </button>
        }
      />
      <div className="flex flex-col gap-6 py-6 px-6" style={{ maxWidth: 1200 }}>
        {/* Portfolio Summary */}
        <PortfolioSummaryBar totalUSD={totalUSD} isHidden={isBalanceHidden} onToggle={toggleBalanceHidden} />

        {/* Content: Asset Table + Activity */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 360px' }}>
          {/* Left: Assets Table */}
          <div className="rounded-xl overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <div className="flex items-center gap-3">
                <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>Tài sản ({filteredAssets.length})</span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={hideSmall} onChange={e => setHideSmall(e.target.checked)}
                    className="rounded" style={{ width: 14, height: 14 }} />
                  <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Ẩn số dư nhỏ</span>
                </label>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-3"
                style={{ background: c.searchBg, border: `1px solid ${c.searchBorder}`, height: 36 }}>
                <Search size={14} color={c.text3} />
                <input placeholder="Tìm tài sản..." value={searchAsset}
                  onChange={e => setSearchAsset(e.target.value)}
                  className="bg-transparent outline-none"
                  style={{ color: c.text1, fontSize: WEB_FONT.base, width: 130 }} />
              </div>
            </div>

            {/* Table header */}
            <div className="grid items-center px-5 py-2"
              style={{ gridTemplateColumns: '2fr 1.2fr 1fr 80px 80px 24px', borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600 }}>Tài sản</span>
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}>Số dư</span>
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}>Giá trị (USD)</span>
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}>Giá</span>
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}>24h</span>
              <span />
            </div>

            {/* Rows */}
            {filteredAssets.map((asset, i) => (
              <button key={asset.id} onClick={() => navigate(`/w/wallet/asset/${asset.id}`)}
                className="web-cmd-btn grid items-center px-5 py-2.5 w-full transition-colors"
                style={{
                  gridTemplateColumns: '2fr 1.2fr 1fr 80px 80px 24px',
                  borderBottom: i < filteredAssets.length - 1 ? `1px solid ${c.divider}` : 'none',
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: asset.logoColor + '15', border: `1px solid ${asset.logoColor}25` }}>
                    <span style={{ color: asset.logoColor, fontSize: WEB_FONT.xs, fontWeight: 700 }}>{asset.symbol.slice(0, 3)}</span>
                  </div>
                  <div className="text-left">
                    <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600 }}>{asset.symbol}</span>
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginLeft: 6 }}>{asset.name}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {isBalanceHidden ? '••••' : fmtAmount(asset.balance)}
                  </span>
                  {asset.frozen > 0 && (
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs, display: 'block' }}>
                      Khóa: {fmtAmount(asset.frozen)}
                    </span>
                  )}
                </div>
                <span style={{ color: c.text2, fontSize: WEB_FONT.base, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {isBalanceHidden ? '••••' : fmtUsd(asset.usdValue)}
                </span>
                <span style={{ color: c.text2, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {/* Derive price from usdValue/balance */}
                  {asset.balance > 0 ? `$${fmtPrice(asset.usdValue / asset.balance)}` : '—'}
                </span>
                <div style={{ textAlign: 'right' }}>
                  <span className="inline-block rounded px-1.5 py-0.5"
                    style={{
                      background: asset.change24h >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: asset.change24h >= 0 ? '#10B981' : '#EF4444',
                      fontSize: WEB_FONT.xs, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    }}>
                    {fmtPct(asset.change24h)}
                  </span>
                </div>
                <ChevronRight size={WEB_ICON.xs} color={c.text3} />
              </button>
            ))}
          </div>

          {/* Right: Recent Activity */}
          <div className="rounded-xl overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>Lịch sử gần đây</span>
              <button onClick={() => navigate('/w/wallet/history')}
                style={{ color: '#3B82F6', fontSize: WEB_FONT.sm, fontWeight: 600 }}>Tất cả</button>
            </div>
            {TRANSACTIONS.slice(0, 10).map((tx, i) => {
              const type = TYPE_MAP[tx.type] || { label: tx.type, color: '#8B95B3' };
              const status = STATUS_MAP[tx.status] || { label: tx.status, color: '#8B95B3' };
              return (
                <div key={tx.id} className="flex items-center gap-2.5 px-4 py-2.5"
                  style={{ borderBottom: i < 9 ? `1px solid ${c.divider}` : 'none' }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: type.color }} />
                  <div className="flex-1 min-w-0">
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>{type.label}</span>
                    <span style={{ color: c.text3, fontSize: WEB_FONT.sm, marginLeft: 4 }}>{tx.asset}</span>
                  </div>
                  <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {isBalanceHidden ? '••••' : `${fmtAmount(tx.amount)} ${tx.asset}`}
                  </span>
                  <span className="rounded px-1.5 py-0.5"
                    style={{ background: status.color + '12', color: status.color, fontSize: 10, fontWeight: 600 }}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}