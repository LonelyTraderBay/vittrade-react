import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Star, Clock, CheckCircle, Shield, X, Plus,
  CreditCard, BarChart3, MessageCircle, HelpCircle, SortDesc,
} from 'lucide-react';
import { P2P_ADS, P2PAd, P2P_ORDERS } from '../../data/mockData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { fmtVnd, fmtAmount, fmtPct } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { PageLayout } from '../../components/layout/PageLayout';
import { TabBar } from '../../components/layout/TabBar';

function AdCard({ ad, tradeType, prefix }: { ad: P2PAd; tradeType: 'buy' | 'sell'; prefix: string }) {
  const navigate = useNavigate();
  const c = useThemeColors();
  const marketPrice = 25300;
  const margin = ((ad.price - marketPrice) / marketPrice * 100);

  return (
    <TrCard hover className="p-4">
      {/* Merchant */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{ad.merchant.charAt(0)}</span>
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ background: ad.isOnline ? '#10B981' : '#4A5568', borderColor: c.surface }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{ad.merchant}</span>
            {ad.merchantVerified && <Shield size={12} color="#3B82F6" fill="rgba(59,130,246,0.2)" />}
            <div className="flex gap-0.5">
              {Array.from({ length: ad.merchantLevel }, (_, i) => (
                <Star key={i} size={10} fill="#F59E0B" color="#F59E0B" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <CheckCircle size={10} color="#10B981" />
              <span style={{ color: c.text3, fontSize: 11 }}>{ad.completionRate}%</span>
            </div>
            <span style={{ color: c.text3, fontSize: 11 }}>{ad.completedOrders} đơn</span>
            <div className="flex items-center gap-1">
              <Clock size={10} color={c.text3} />
              <span style={{ color: c.text3, fontSize: 11 }}>{ad.avgResponseTime}</span>
            </div>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-lg font-semibold"
          style={{ background: ad.isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(74,85,104,0.2)', color: ad.isOnline ? '#10B981' : c.text3 }}>
          {ad.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Price */}
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: c.text1, fontSize: 22, fontWeight: 700, fontFamily: 'monospace' }}>
          {fmtVnd(ad.price)}
        </span>
        <span style={{ color: c.text2, fontSize: 14 }}>{ad.currency}</span>
        {ad.priceType === 'floating' && (
          <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
            style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7', fontSize: 10 }}>Thả nổi</span>
        )}
        <span style={{ color: margin >= 0 ? '#10B981' : '#3B82F6', fontSize: 11, fontWeight: 600 }}>
          {fmtPct(margin)}
        </span>
      </div>

      {/* Limits */}
      <div className="flex justify-between text-xs mb-3">
        <div>
          <span style={{ color: c.text3 }}>Giới hạn: </span>
          <span style={{ color: c.text2, fontFamily: 'monospace' }}>
            {fmtVnd(ad.minLimit)} - {fmtVnd(ad.maxLimit)} {ad.currency}
          </span>
        </div>
        <div>
          <span style={{ color: c.text3 }}>Khả dụng: </span>
          <span style={{ color: c.text1, fontFamily: 'monospace', fontWeight: 600 }}>{fmtAmount(ad.available)} {ad.asset}</span>
        </div>
      </div>

      {/* Payment methods */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ad.paymentMethods.map(pm => (
          <span key={pm} className="px-2 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>
            {pm}
          </span>
        ))}
      </div>

      {/* Requirements badge */}
      {ad.counterpartyRequirements && (
        <div className="flex items-center gap-1.5 mb-3">
          <Shield size={10} color="#F59E0B" />
          <span style={{ color: '#F59E0B', fontSize: 10 }}>
            {ad.counterpartyRequirements.minKycLevel ? `KYC ${ad.counterpartyRequirements.minKycLevel}+` : ''}
            {ad.counterpartyRequirements.minCompletedTrades ? ` ${ad.counterpartyRequirements.minCompletedTrades}+ đơn` : ''}
          </span>
        </div>
      )}

      {/* Action */}
      <button
        onClick={() => navigate(`${prefix}/p2p/ad/${ad.id}`)}
        className="w-full h-11 rounded-2xl flex items-center justify-center font-semibold text-white text-sm"
        style={{
          background: tradeType === 'buy'
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)',
          boxShadow: tradeType === 'buy' ? '0 2px 12px rgba(16,185,129,0.25)' : '0 2px 12px rgba(239,68,68,0.25)',
        }}>
        {tradeType === 'buy' ? `Mua ${ad.asset}` : `Bán ${ad.asset}`}
      </button>
    </TrCard>
  );
}

/* ─── Right Panel: Filters + Help (Desktop) ─── */
function P2PRightPanel({ asset, setAsset, filterPayment, setFilterPayment, sortBy, setSortBy, allPaymentMethods, prefix }: {
  asset: string;
  setAsset: (a: string) => void;
  filterPayment: string;
  setFilterPayment: (p: string) => void;
  sortBy: 'price' | 'completion' | 'orders';
  setSortBy: (s: 'price' | 'completion' | 'orders') => void;
  allPaymentMethods: string[];
  prefix: string;
}) {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const processingCount = P2P_ORDERS.filter(o => o.status === 'pending_payment' || o.status === 'paid').length;

  return (
    <div className="flex flex-col gap-4" style={{ width: 320, flexShrink: 0 }}>
      {/* Filters */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Bộ lọc nâng cao</p>

        <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Tài sản</label>
        <div className="flex gap-2 mb-4">
          {['USDT', 'BTC', 'ETH'].map(a => (
            <button key={a} onClick={() => { setAsset(a); hapticSelection(); }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: asset === a ? c.chipActiveBg : c.surface2,
                color: asset === a ? c.chipActiveText : c.chipText,
                border: `1px solid ${asset === a ? c.chipActiveBorder : c.borderSolid}`,
              }}>
              {a}
            </button>
          ))}
        </div>

        <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>
          <SortDesc size={10} className="inline mr-1" />Sắp xếp theo
        </label>
        <div className="flex gap-2 mb-4">
          {[
            { id: 'price' as const, label: 'Giá tốt nhất' },
            { id: 'completion' as const, label: 'Tỷ lệ HT' },
            { id: 'orders' as const, label: 'Số đơn' },
          ].map(s => (
            <button key={s.id} onClick={() => { setSortBy(s.id); hapticSelection(); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: sortBy === s.id ? c.chipActiveBg : c.chipBg, color: sortBy === s.id ? c.chipActiveText : c.chipText, border: `1px solid ${sortBy === s.id ? c.chipActiveBorder : c.chipBorder}` }}>
              {s.label}
            </button>
          ))}
        </div>

        <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>
          <CreditCard size={10} className="inline mr-1" />Thanh toán
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setFilterPayment(''); hapticSelection(); }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: !filterPayment ? c.chipActiveBg : c.chipBg, color: !filterPayment ? c.chipActiveText : c.chipText, border: `1px solid ${!filterPayment ? c.chipActiveBorder : c.chipBorder}` }}>
            Tất cả
          </button>
          {allPaymentMethods.map(pm => (
            <button key={pm} onClick={() => { setFilterPayment(pm); hapticSelection(); }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: filterPayment === pm ? c.chipActiveBg : c.chipBg, color: filterPayment === pm ? c.chipActiveText : c.chipText, border: `1px solid ${filterPayment === pm ? c.chipActiveBorder : c.chipBorder}` }}>
              {pm}
            </button>
          ))}
        </div>
      </TrCard>

      {/* Quick Links */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Truy cập nhanh</p>
        {[
          { label: 'Đơn P2P', icon: MessageCircle, path: `${prefix}/p2p/my-orders`, badge: processingCount, badgeColor: '#F59E0B' },
          { label: 'Quảng cáo của tôi', icon: BarChart3, path: `${prefix}/p2p/my-ads`, badge: 0 },
          { label: 'Phương thức thanh toán', icon: CreditCard, path: `${prefix}/p2p/payment-methods`, badge: 0 },
          { label: 'Đánh giá', icon: Star, path: `${prefix}/p2p/reviews`, badge: 0 },
        ].map((item, i) => (
          <button key={item.label} onClick={() => navigate(item.path)}
            className="flex items-center gap-3 py-2.5 w-full"
            style={{ borderBottom: i < 3 ? `1px solid ${c.divider}` : 'none' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: c.surface2 }}>
              <item.icon size={16} color={c.text2} />
            </div>
            <span className="flex-1 text-left" style={{ color: c.text2, fontSize: 13 }}>{item.label}</span>
            {item.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: item.badgeColor, color: '#fff', minWidth: 18, textAlign: 'center', fontSize: 10 }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </TrCard>

      {/* Help panel */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Trợ giúp P2P</p>
        {[
          { icon: Shield, text: 'Giao dịch an toàn với Escrow', color: '#10B981' },
          { icon: HelpCircle, text: 'Hướng dẫn mua bán P2P', color: '#3B82F6' },
          { icon: MessageCircle, text: 'Liên hệ hỗ trợ', color: '#F59E0B' },
        ].map((item, i) => (
          <button key={item.text} className="flex items-center gap-3 py-2.5 w-full"
            style={{ borderBottom: i < 2 ? `1px solid ${c.divider}` : 'none' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: item.color + '18' }}>
              <item.icon size={16} color={item.color} />
            </div>
            <span style={{ color: c.text2, fontSize: 13 }}>{item.text}</span>
          </button>
        ))}
      </TrCard>
    </div>
  );
}

export function ResponsiveP2PHomePage() {
  const navigate = useNavigate();
  const { isDesktop } = useBreakpoint();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState('USDT');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'completion' | 'orders'>('price');
  const [filterPayment, setFilterPayment] = useState('');
  const [amountInput, setAmountInput] = useState('');

  const allPaymentMethods = useMemo(() => {
    const set = new Set<string>();
    P2P_ADS.forEach(ad => ad.paymentMethods.forEach(pm => set.add(pm)));
    return Array.from(set);
  }, []);

  const ads = useMemo(() => {
    let filtered = P2P_ADS
      .filter(ad => ad.type === (tab === 'buy' ? 'sell' : 'buy'))
      .filter(ad => ad.asset === asset)
      .filter(ad => ad.status === 'active');

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(ad => ad.merchant.toLowerCase().includes(q));
    }
    if (filterPayment) {
      filtered = filtered.filter(ad => ad.paymentMethods.includes(filterPayment));
    }
    if (amountInput) {
      const amt = parseFloat(amountInput);
      if (amt > 0) filtered = filtered.filter(ad => amt >= ad.minLimit && amt <= ad.maxLimit);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'price') return tab === 'buy' ? a.price - b.price : b.price - a.price;
      if (sortBy === 'completion') return b.completionRate - a.completionRate;
      return b.completedOrders - a.completedOrders;
    });

    return filtered;
  }, [tab, asset, searchText, filterPayment, sortBy, amountInput]);

  const processingCount = P2P_ORDERS.filter(o => o.status === 'pending_payment' || o.status === 'paid').length;

  const mainContent = (
    <PageLayout style={{ flex: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h1 style={{ color: c.text1, fontSize: 22, fontWeight: 700 }}>P2P Trading</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`${prefix}/p2p/my-ads`)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}` }}>
            <BarChart3 size={12} /> Ads
          </button>
          <button onClick={() => navigate(`${prefix}/p2p/create`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Plus size={14} /> Tạo QC
          </button>
        </div>
      </div>

      {/* Escrow Info */}
      <div className="mx-5 mb-3 rounded-2xl p-3"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <p style={{ color: '#10B981', fontSize: 12 }}>
          <Shield size={10} className="inline mr-1" />
          Giao dịch P2P được bảo vệ bởi hệ thống Escrow VitTrade. Tài sản an toàn cho đến khi xác nhận.
        </p>
      </div>

      {/* Buy/Sell tabs */}
      <TabBar
        variant="segment"
        tabs={[
          { id: 'buy', label: 'MUA' },
          { id: 'sell', label: 'BÁN' },
        ]}
        active={tab}
        onChange={setTab}
        colors={{ buy: '#10B981', sell: '#EF4444' }}
        className="mx-5 mb-3"
      />

      {/* Mobile-only: Asset filter + Search */}
      {!isDesktop && (
        <div className="flex flex-col gap-2 px-5 mb-3">
          <div className="flex items-center gap-2">
            {['USDT', 'BTC', 'ETH'].map(a => (
              <button key={a} onClick={() => { setAsset(a); hapticSelection(); }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: asset === a ? c.chipActiveBg : c.chipBg, color: asset === a ? c.chipActiveText : c.chipText, border: `1px solid ${asset === a ? c.chipActiveBorder : c.chipBorder}` }}>
                {a}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl px-3"
              style={{ background: c.searchBg, border: `1px solid ${c.searchBorder}`, height: 38 }}>
              <Search size={14} color={c.text3} />
              <input value={searchText} onChange={e => setSearchText(e.target.value)}
                placeholder="Tìm merchant..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 13 }} />
              {searchText && (
                <button onClick={() => setSearchText('')}><X size={14} color={c.text3} /></button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Search bar inline */}
      {isDesktop && (
        <div className="flex items-center gap-2 px-5 mb-3">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3"
            style={{ background: c.searchBg, border: `1px solid ${c.searchBorder}`, height: 38 }}>
            <Search size={14} color={c.text3} />
            <input value={searchText} onChange={e => setSearchText(e.target.value)}
              placeholder="Tìm merchant..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 13 }} />
            {searchText && (
              <button onClick={() => setSearchText('')}><X size={14} color={c.text3} /></button>
            )}
          </div>
        </div>
      )}

      {/* Amount input */}
      <div className="mx-5 mb-3 flex items-center gap-3 rounded-2xl px-4"
        style={{ background: c.searchBg, border: `1.5px solid ${c.searchBorder}`, height: 48, borderRadius: 14 }}>
        <input type="number" inputMode="decimal" placeholder="Nhập số tiền VND muốn giao dịch..."
          value={amountInput} onChange={e => setAmountInput(e.target.value)}
          style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 14, flex: 1, fontFamily: 'monospace' }} />
        <button className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: c.surface3, color: c.text2 }}>VND</button>
      </div>

      {/* Quick links (mobile only) */}
      {!isDesktop && (
        <div className="flex gap-2 px-5 mb-4">
          <button onClick={() => navigate(`${prefix}/p2p/my-orders`)}
            className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Đơn P2P</span>
            {processingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: '#F59E0B', color: '#fff', minWidth: 18, textAlign: 'center', fontSize: 10 }}>{processingCount}</span>
            )}
          </button>
          <button onClick={() => navigate(`${prefix}/p2p/payment-methods`)}
            className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Thanh toán</span>
            <CreditCard size={14} color={c.text3} />
          </button>
          <button onClick={() => navigate(`${prefix}/p2p/reviews`)}
            className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Đánh giá</span>
            <Star size={14} color={c.text3} />
          </button>
        </div>
      )}

      {/* Ads list */}
      <div className={`flex flex-col gap-3 ${isDesktop ? '' : 'px-5'}`} style={isDesktop ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 } : undefined}>
        {ads.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3 col-span-2">
            <Search size={36} color={c.borderSolid} />
            <p style={{ color: c.text2, fontSize: 15, fontWeight: 600 }}>Không tìm thấy quảng cáo</p>
            <p style={{ color: c.text3, fontSize: 13 }}>Thử thay đổi bộ lọc hoặc tiền tệ</p>
          </div>
        ) : (
          ads.map(ad => (
            <AdCard key={ad.id} ad={ad} tradeType={tab} prefix={prefix} />
          ))
        )}
      </div>
    </PageLayout>
  );

  // Desktop: 2-column (left: ads, right: filters/help)
  if (isDesktop) {
    return (
      <div className="flex gap-6 py-4">
        <div className="flex-1 min-w-0">{mainContent}</div>
        <P2PRightPanel
          asset={asset} setAsset={setAsset}
          filterPayment={filterPayment} setFilterPayment={setFilterPayment}
          sortBy={sortBy} setSortBy={setSortBy}
          allPaymentMethods={allPaymentMethods}
          prefix={prefix}
        />
      </div>
    );
  }

  return mainContent;
}