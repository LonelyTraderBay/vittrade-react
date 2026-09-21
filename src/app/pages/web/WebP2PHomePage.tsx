import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  Star,
  Shield,
  X,
  Plus,
  CreditCard,
  BarChart3,
  MessageCircle,
  HelpCircle,
  SortDesc,
  CheckCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { P2P_ADS, P2PAd, P2P_ORDERS } from '../../data/mockData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';
import { fmtVnd, fmtAmount, fmtPct } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════
   WEB P2P HOME — Enterprise Marketplace Layout
   Data table format, professional density
   ═══════════════════════════════════════════════════════════ */

export function WebP2PHomePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState('USDT');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'completion' | 'orders'>('price');
  const [filterPayment, setFilterPayment] = useState('');
  const [amountInput, setAmountInput] = useState('');

  const allPaymentMethods = useMemo(() => {
    const set = new Set<string>();
    P2P_ADS.forEach((ad) => ad.paymentMethods.forEach((pm) => set.add(pm)));
    return Array.from(set);
  }, []);

  const ads = useMemo(() => {
    let filtered = P2P_ADS.filter((ad) => ad.type === (tab === 'buy' ? 'sell' : 'buy'))
      .filter((ad) => ad.asset === asset)
      .filter((ad) => ad.status === 'active');

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter((ad) => ad.merchant.toLowerCase().includes(q));
    }
    if (filterPayment) {
      filtered = filtered.filter((ad) => ad.paymentMethods.includes(filterPayment));
    }
    if (amountInput) {
      const amt = parseFloat(amountInput);
      if (amt > 0) filtered = filtered.filter((ad) => amt >= ad.minLimit && amt <= ad.maxLimit);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'price') return tab === 'buy' ? a.price - b.price : b.price - a.price;
      if (sortBy === 'completion') return b.completionRate - a.completionRate;
      return b.completedOrders - a.completedOrders;
    });
    return filtered;
  }, [tab, asset, searchText, filterPayment, sortBy, amountInput]);

  const processingCount = P2P_ORDERS.filter(
    (o) => o.status === 'pending_payment' || o.status === 'paid',
  ).length;
  const marketPrice = 25300;

  return (
    <PageLayout>
      <Header
        variant="page"
        title="P2P Trading"
        subtitle="Mua bán crypto trực tiếp — Bảo vệ bởi Escrow"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/w/p2p/my-orders')}
              className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
              style={{
                border: `1px solid ${c.border}`,
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
                color: c.text2,
              }}
            >
              <MessageCircle size={13} /> Đơn hàng
              {processingCount > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5"
                  style={{ background: '#F59E0B', color: '#fff', fontSize: 10, fontWeight: 700 }}
                >
                  {processingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/w/p2p/create')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{
                background: '#3B82F6',
                color: '#fff',
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
              }}
            >
              <Plus size={13} /> Tạo quảng cáo
            </button>
          </div>
        }
      />
      <div className="flex gap-6 py-6 px-6" style={{ maxWidth: 1200 }}>
        {/* ─── Main Content ─── */}
        <div className="flex-1 min-w-0">
          {/* Escrow info */}
          <div
            className="rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2"
            style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.15)',
            }}
          >
            <Shield size={13} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: WEB_FONT.sm }}>
              Giao dịch P2P được bảo vệ bởi hệ thống Escrow. Tài sản an toàn cho đến khi xác nhận.
            </span>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3 mb-4">
            {/* Buy/Sell toggle */}
            <div className="flex rounded-lg p-0.5" style={{ background: c.hoverBg }}>
              {(['buy', 'sell'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-5 py-1.5 rounded-md transition-colors"
                  style={{
                    background: tab === t ? (t === 'buy' ? '#10B981' : '#EF4444') : 'transparent',
                    color: tab === t ? '#fff' : c.text3,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {t === 'buy' ? 'MUA' : 'BÁN'}
                </button>
              ))}
            </div>

            {/* Asset selector */}
            <div className="flex gap-1">
              {['USDT', 'BTC', 'ETH'].map((a) => (
                <button
                  key={a}
                  onClick={() => setAsset(a)}
                  className="px-3 py-1.5 rounded-md transition-colors"
                  style={{
                    background: asset === a ? c.chipActiveBg : 'transparent',
                    color: asset === a ? c.chipActiveText : c.text3,
                    fontSize: WEB_FONT.sm,
                    fontWeight: asset === a ? 600 : 500,
                    border:
                      asset === a ? `1px solid ${c.chipActiveBorder}` : '1px solid transparent',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div
              className="flex items-center gap-2 rounded-lg px-3 flex-1"
              style={{ background: c.searchBg, border: `1px solid ${c.searchBorder}`, height: 38 }}
            >
              <input
                type="number"
                inputMode="decimal"
                placeholder="Nhập số tiền VND..."
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.base,
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
              <span style={{ color: c.text3, fontSize: WEB_FONT.sm, fontWeight: 600 }}>VND</span>
            </div>

            {/* Search merchant */}
            <div
              className="flex items-center gap-2 rounded-lg px-3"
              style={{
                background: c.searchBg,
                border: `1px solid ${c.searchBorder}`,
                height: 38,
                width: 180,
              }}
            >
              <Search size={14} color={c.text3} />
              <input
                placeholder="Tìm merchant..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{ color: c.text1, fontSize: WEB_FONT.base }}
              />
            </div>
          </div>

          {/* Data table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: c.surface, border: `1px solid ${c.border}` }}
          >
            {/* Header */}
            <div
              className="grid items-center px-5 py-2.5"
              style={{
                gridTemplateColumns: '2fr 1fr 1.5fr 1fr 120px',
                borderBottom: `1px solid ${c.divider}`,
              }}
            >
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                Merchant
              </span>
              <span
                style={{
                  color: c.text3,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  textAlign: 'right',
                }}
              >
                Giá / {asset}
              </span>
              <span
                style={{
                  color: c.text3,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  textAlign: 'right',
                }}
              >
                Giới hạn
              </span>
              <span
                style={{
                  color: c.text3,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                Thanh toán
              </span>
              <span />
            </div>

            {/* Rows */}
            {ads.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2">
                <Search size={32} color={c.text3} style={{ opacity: 0.4 }} />
                <p style={{ color: c.text3, fontSize: WEB_FONT.base }}>
                  Không tìm thấy quảng cáo phù hợp
                </p>
              </div>
            ) : (
              ads.map((ad, i) => {
                const margin = ((ad.price - marketPrice) / marketPrice) * 100;
                return (
                  <div
                    key={ad.id}
                    className="grid items-center px-5 py-3"
                    style={{
                      gridTemplateColumns: '2fr 1fr 1.5fr 1fr 120px',
                      borderBottom: i < ads.length - 1 ? `1px solid ${c.divider}` : 'none',
                    }}
                  >
                    {/* Merchant */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                          }}
                        >
                          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                            {ad.merchant.charAt(0)}
                          </span>
                        </div>
                        {ad.isOnline && (
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                            style={{ background: '#10B981', border: '2px solid var(--tr-surface)' }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600 }}
                          >
                            {ad.merchant}
                          </span>
                          {ad.merchantVerified && <CheckCircle size={12} color="#3B82F6" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            style={{
                              color: c.text3,
                              fontSize: 10,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {ad.completedOrders} đơn · {ad.completionRate}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          color: c.text1,
                          fontSize: WEB_FONT.md,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmtVnd(ad.price)}
                      </p>
                      <p
                        style={{
                          color: margin > 0 ? '#EF4444' : '#10B981',
                          fontSize: WEB_FONT.xs,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {margin > 0 ? '+' : ''}
                        {margin.toFixed(2)}%
                      </p>
                    </div>

                    {/* Limits */}
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          color: c.text2,
                          fontSize: WEB_FONT.sm,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmtVnd(ad.minLimit)} - {fmtVnd(ad.maxLimit)} VND
                      </p>
                      <p
                        style={{
                          color: c.text3,
                          fontSize: WEB_FONT.xs,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        Khả dụng: {fmtAmount(ad.available)} {ad.asset}
                      </p>
                    </div>

                    {/* Payment */}
                    <div className="flex flex-wrap justify-center gap-1">
                      {ad.paymentMethods.slice(0, 2).map((pm) => (
                        <span
                          key={pm}
                          className="px-2 py-0.5 rounded text-center"
                          style={{
                            background: 'rgba(59,130,246,0.08)',
                            color: '#3B82F6',
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {pm}
                        </span>
                      ))}
                      {ad.paymentMethods.length > 2 && (
                        <span style={{ color: c.text3, fontSize: 10 }}>
                          +{ad.paymentMethods.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => navigate(`/w/p2p/ad/${ad.id}`)}
                        className="px-4 py-1.5 rounded-lg font-semibold text-white text-xs"
                        style={{
                          background: tab === 'buy' ? '#10B981' : '#EF4444',
                          minWidth: 80,
                        }}
                      >
                        {tab === 'buy' ? `Mua ${ad.asset}` : `Bán ${ad.asset}`}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Right Sidebar ─── */}
        <div className="flex flex-col gap-4" style={{ width: 300, flexShrink: 0 }}>
          {/* Filters */}
          <div
            className="rounded-xl p-4"
            style={{ background: c.surface, border: `1px solid ${c.border}` }}
          >
            <p
              style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700, marginBottom: 12 }}
            >
              Bộ lọc
            </p>

            <label
              style={{
                color: c.text3,
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Sắp xếp
            </label>
            <div className="flex gap-1.5 mb-4">
              {[
                { id: 'price' as const, label: 'Giá tốt' },
                { id: 'completion' as const, label: 'Tỷ lệ HT' },
                { id: 'orders' as const, label: 'Số đơn' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className="px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: sortBy === s.id ? c.chipActiveBg : 'transparent',
                    color: sortBy === s.id ? c.chipActiveText : c.text3,
                    fontSize: 12,
                    fontWeight: sortBy === s.id ? 600 : 500,
                    border: `1px solid ${sortBy === s.id ? c.chipActiveBorder : c.border}`,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <label
              style={{
                color: c.text3,
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Thanh toán
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterPayment('')}
                className="px-2.5 py-1 rounded-lg"
                style={{
                  background: !filterPayment ? c.chipActiveBg : 'transparent',
                  color: !filterPayment ? c.chipActiveText : c.text3,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1px solid ${!filterPayment ? c.chipActiveBorder : c.border}`,
                }}
              >
                Tất cả
              </button>
              {allPaymentMethods.map((pm) => (
                <button
                  key={pm}
                  onClick={() => setFilterPayment(pm)}
                  className="px-2.5 py-1 rounded-lg"
                  style={{
                    background: filterPayment === pm ? c.chipActiveBg : 'transparent',
                    color: filterPayment === pm ? c.chipActiveText : c.text3,
                    fontSize: 11,
                    fontWeight: 600,
                    border: `1px solid ${filterPayment === pm ? c.chipActiveBorder : c.border}`,
                  }}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: c.surface, border: `1px solid ${c.border}` }}
          >
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>
                Truy cập nhanh
              </span>
            </div>
            {[
              {
                label: 'Đơn P2P',
                icon: MessageCircle,
                path: '/w/p2p/my-orders',
                badge: processingCount,
              },
              { label: 'Quảng cáo của tôi', icon: BarChart3, path: '/w/p2p/my-ads' },
              { label: 'Thanh toán', icon: CreditCard, path: '/w/p2p/payment-methods' },
              { label: 'Hướng dẫn P2P', icon: HelpCircle, path: '/w/p2p/guide' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="web-cmd-btn flex items-center gap-3 px-4 py-2.5 w-full transition-colors"
                  style={{ borderBottom: i < 3 ? `1px solid ${c.divider}` : 'none' }}
                >
                  <Icon size={14} color={c.text3} />
                  <span
                    className="flex-1 text-left"
                    style={{ color: c.text2, fontSize: WEB_FONT.sm }}
                  >
                    {item.label}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span
                      className="rounded-full px-1.5 py-0.5"
                      style={{
                        background: '#F59E0B',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        minWidth: 18,
                        textAlign: 'center',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight size={12} color={c.text3} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
