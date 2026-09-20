import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import {
  Layers, BarChart2, Star, Clock, Wallet, ShoppingCart, Bell,
  ChevronRight, ChevronDown, ArrowLeftRight, Search,
  Download, WifiOff, AlertTriangle, ShieldCheck, KeyRound, LogIn,
  TrendingUp, TrendingDown, CheckCircle, XCircle, Filter,
  RefreshCw, Trash2
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { SkeletonList, SkeletonCard, SkeletonPageList } from '../../components/states/SkeletonBlock';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { OfflineBanner, Banner } from '../../components/states/OfflineBanner';
import { GatePanel } from '../../components/states/GatePanel';
import { SessionExpiredModal, ReauthSheet } from '../../components/states/SecurityOverlays';
import { PageLayout } from '../../components/layout/PageLayout';
import { TabBar } from '../../components/layout/TabBar';

/* ═══════════════════════════════════════════════════════════
   Section selector
   ═══════════════════════════════════════════════════════════ */
type Section = 'statekit' | 'applied' | 'security';
type AppliedPage = 'market' | 'watchlist' | 'orders' | 'transactions' | 'p2p' | 'notifications';
type StateType = 'loading' | 'empty' | 'error' | 'offline' | 'gate';

/* ═══════════════════════════════════════════════════════════
   SECTION A — State Kit Preview
   ═══════════════════════════════════════════════════════════ */
function StateKitSection() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [activeState, setActiveState] = useState<'loading' | 'empty' | 'error' | 'offline' | 'gate'>('loading');

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="px-5">
        <p style={{ color: '#8B95B3', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          5 state pattern chuẩn enterprise, match 100% visual style hiện tại. Chọn state để xem preview.
        </p>

        {/* State selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'loading', label: '⏳ Loading', color: '#3B82F6' },
            { id: 'empty', label: '📭 Empty', color: '#8B95B3' },
            { id: 'error', label: '❌ Error', color: '#EF4444' },
            { id: 'offline', label: '📡 Offline', color: '#F59E0B' },
            { id: 'gate', label: '🔒 Gate', color: '#8B5CF6' },
          ].map(s => (
            <button key={s.id} onClick={() => setActiveState(s.id as any)}
              className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: activeState === s.id ? s.color + '22' : '#1C2235',
                color: activeState === s.id ? s.color : '#8B95B3',
                border: `1px solid ${activeState === s.id ? s.color + '55' : '#2A3356'}`,
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview frame */}
      <div className="mx-5 rounded-2xl overflow-hidden"
        style={{ background: '#0B0E17', border: '1px solid #2A3356', minHeight: 360 }}>
        {/* Mock header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: 'rgba(11,14,23,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ color: '#F0F4FF', fontSize: 15, fontWeight: 600 }}>Preview — {activeState}</span>
          <div className="w-8" />
        </div>

        {activeState === 'loading' && (
          <SkeletonPageList title="Thị trường" rows={5} />
        )}

        {activeState === 'empty' && (
          <EmptyState
            icon={Star}
            title="Bạn chưa theo dõi cặp nào"
            subtitle="Thêm cặp giao dịch vào danh sách theo dõi để không bỏ lỡ biến động giá."
            ctaLabel="Thêm vào Watchlist"
            onCta={() => navigate(`${prefix}/markets`)}
          />
        )}

        {activeState === 'error' && (
          <ErrorState
            title="Có lỗi xảy ra"
            subtitle="Vui lòng thử lại. Nếu lỗi tiếp tục, hãy kiểm tra kết nối mạng."
            onRetry={() => {}}
          />
        )}

        {activeState === 'offline' && (
          <div className="flex flex-col gap-3 py-4">
            <OfflineBanner showStaleHint />
            {/* Stale content preview */}
            <div className="px-4">
              <div className="rounded-2xl p-4" style={{ background: '#141822', border: '1px solid #2A3356', opacity: 0.6 }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F7931A22' }}>
                    <span style={{ color: '#F7931A', fontSize: 11, fontWeight: 700 }}>BTC</span>
                  </div>
                  <div className="flex-1">
                    <span style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 600 }}>BTC/USDT</span>
                    <span style={{ color: '#4A5568', fontSize: 11, marginLeft: 8 }}>Dữ liệu cũ</span>
                  </div>
                  <span style={{ color: '#F0F4FF', fontSize: 14, fontFamily: 'monospace' }}>$67,543.21</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#627EEA22' }}>
                    <span style={{ color: '#627EEA', fontSize: 11, fontWeight: 700 }}>ETH</span>
                  </div>
                  <div className="flex-1">
                    <span style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 600 }}>ETH/USDT</span>
                    <span style={{ color: '#4A5568', fontSize: 11, marginLeft: 8 }}>Dữ liệu cũ</span>
                  </div>
                  <span style={{ color: '#F0F4FF', fontSize: 14, fontFamily: 'monospace' }}>$3,456.78</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeState === 'gate' && (
          <div className="flex flex-col">
            <GatePanel type="kyc" onCta={() => navigate(`${prefix}/profile/kyc`)} />
          </div>
        )}
      </div>

      {/* Banners showcase */}
      <div className="px-5">
        <p style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Banner Variants</p>
        <div className="flex flex-col gap-3">
          <Banner variant="info" icon={<BarChart2 size={14} color="#3B82F6" />}
            message="Thị trường sẽ bảo trì từ 02:00 – 04:00 UTC." />
          <Banner variant="warn" icon={<AlertTriangle size={14} color="#F59E0B" />}
            message="Biến động giá mạnh. Hãy cẩn thận khi giao dịch."
            detail="BTC đã thay đổi >5% trong 1 giờ qua." />
          <Banner variant="error" icon={<AlertTriangle size={14} color="#EF4444" />}
            message="Hệ thống rút tiền tạm ngưng hoạt động." />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION B — Applied States per Page
   ══════════════════════════════════════════════════════════ */

const PAGE_CONFIG: Record<AppliedPage, {
  label: string;
  icon: typeof BarChart2;
  path: string;
  empty: { title: string; subtitle: string; cta: string; emoji: string };
}> = {
  market: {
    label: 'MarketListPage',
    icon: BarChart2,
    path: '/markets',
    empty: { title: 'Không tìm thấy kết quả', subtitle: 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.', cta: 'Xóa bộ lọc', emoji: '🔍' },
  },
  watchlist: {
    label: 'WatchlistPage',
    icon: Star,
    path: '/markets/watchlist',
    empty: { title: 'Bạn chưa theo dõi cặp nào', subtitle: 'Thêm cặp giao dịch yêu thích để theo dõi biến động giá dễ dàng hơn.', cta: 'Thêm vào Watchlist', emoji: '⭐' },
  },
  orders: {
    label: 'OrdersHistoryPage',
    icon: Clock,
    path: '/trade/orders',
    empty: { title: 'Chưa có lệnh nào', subtitle: 'Bạn chưa đặt lệnh giao dịch nào. Bắt đầu ngay để tham gia thị trường!', cta: 'Bắt đầu giao dịch', emoji: '📊' },
  },
  transactions: {
    label: 'TransactionHistoryPage',
    icon: Wallet,
    path: '/wallet/history',
    empty: { title: 'Chưa có giao dịch', subtitle: 'Lịch sử giao dịch sẽ hiển thị ở đây sau khi bạn nạp, rút hoặc giao dịch.', cta: 'Nạp tiền', emoji: '💰' },
  },
  p2p: {
    label: 'P2PMyOrdersPage',
    icon: ShoppingCart,
    path: '/p2p/my-orders',
    empty: { title: 'Bạn chưa có đơn P2P nào', subtitle: 'Mua bán crypto trực tiếp với người dùng khác — an toàn, nhanh chóng.', cta: 'Khám phá P2P', emoji: '🤝' },
  },
  notifications: {
    label: 'NotificationsPage',
    icon: Bell,
    path: '/notifications',
    empty: { title: 'Chưa có thông báo', subtitle: 'Thông báo về giao dịch, bảo mật và cập nhật sẽ xuất hiện ở đây.', cta: 'Cài đặt thông báo', emoji: '🔔' },
  },
};

function AppliedStatesSection() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<AppliedPage>('market');
  const [activeState, setActiveState] = useState<StateType>('loading');

  const config = PAGE_CONFIG[activePage];
  const Icon = config.icon;

  // Determine if gate state makes sense for this page
  const hasGate = activePage === 'orders' || activePage === 'transactions' || activePage === 'p2p';

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="px-5">
        <p style={{ color: '#8B95B3', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
          6 màn dữ liệu × 4–5 states. Chọn page và state để preview.
        </p>

        {/* Page selector */}
        <p style={{ color: '#4A5568', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Chọn màn hình
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
          {(Object.keys(PAGE_CONFIG) as AppliedPage[]).map(key => {
            const cfg = PAGE_CONFIG[key];
            const PageIcon = cfg.icon;
            return (
              <button key={key} onClick={() => { setActivePage(key); setActiveState('loading'); }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: activePage === key ? '#3B82F6' : '#1C2235',
                  color: activePage === key ? '#fff' : '#8B95B3',
                  border: `1px solid ${activePage === key ? '#3B82F6' : '#2A3356'}`,
                }}>
                <PageIcon size={12} />
                {cfg.label.replace('Page', '')}
              </button>
            );
          })}
        </div>

        {/* State selector */}
        <p style={{ color: '#4A5568', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Chọn trạng thái
        </p>
        <div className="flex gap-2 mb-4">
          {([
            { id: 'loading', label: 'Loading', color: '#3B82F6' },
            { id: 'empty', label: 'Empty', color: '#8B95B3' },
            { id: 'error', label: 'Error', color: '#EF4444' },
            { id: 'offline', label: 'Offline', color: '#F59E0B' },
            ...(hasGate ? [{ id: 'gate', label: 'Gate', color: '#8B5CF6' }] : []),
          ] as { id: StateType; label: string; color: string }[]).map(s => (
            <button key={s.id} onClick={() => setActiveState(s.id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: activeState === s.id ? s.color + '22' : '#1C2235',
                color: activeState === s.id ? s.color : '#4A5568',
                border: `1px solid ${activeState === s.id ? s.color + '55' : '#2A3356'}`,
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview frame */}
      <div className="mx-5 rounded-2xl overflow-hidden"
        style={{ background: '#0B0E17', border: '1px solid #2A3356', minHeight: 400 }}>
        {/* Page header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: 'rgba(11,14,23,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#F0F4FF', fontSize: 16 }}>←</span>
            </div>
          </div>
          <span style={{ color: '#F0F4FF', fontSize: 15, fontWeight: 600 }}>{config.label.replace('Page', '')}</span>
          <div className="w-8" />
        </div>

        {/* Filter tabs (contextual) */}
        {(activePage === 'market' || activePage === 'transactions' || activePage === 'orders' || activePage === 'notifications') && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
            {(activePage === 'transactions'
              ? ['Tất cả', 'Nạp', 'Rút', 'Giao dịch']
              : activePage === 'orders'
                ? ['Lệnh mở', 'Lịch sử']
                : activePage === 'notifications'
                  ? ['Tất cả', 'Chưa đọc']
                  : ['Tất cả', 'Layer 1', 'DeFi', 'Meme']
            ).map((f, i) => (
              <div key={f} className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  background: i === 0 ? '#3B82F6' : '#1C2235',
                  color: i === 0 ? '#fff' : '#8B95B3',
                  border: `1px solid ${i === 0 ? '#3B82F6' : '#2A3356'}`,
                  opacity: activeState === 'loading' ? 0.5 : 1,
                }}>
                {f}
              </div>
            ))}
          </div>
        )}

        {/* ─── STATE CONTENT ─── */}
        {activeState === 'loading' && (
          <SkeletonList rows={6} />
        )}

        {activeState === 'empty' && (
          <EmptyState
            icon={Icon}
            emoji={config.empty.emoji}
            title={config.empty.title}
            subtitle={config.empty.subtitle}
            ctaLabel={config.empty.cta}
            onCta={() => {}}
          />
        )}

        {activeState === 'error' && (
          <ErrorState
            title="Có lỗi xảy ra"
            subtitle="Vui lòng thử lại. Nếu lỗi tiếp tục, liên hệ hỗ trợ."
            onRetry={() => {}}
          />
        )}

        {activeState === 'offline' && (
          <div className="flex flex-col">
            <div className="py-3">
              <OfflineBanner
                message="Mất kết nối. Đang hiển thị dữ liệu gần nhất."
                showStaleHint
              />
            </div>
            {/* Stale content — dimmed list items */}
            <div style={{ opacity: 0.5 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: '#1C2235' }}>
                    <span style={{ color: '#4A5568', fontSize: 11 }}>---</span>
                  </div>
                  <div className="flex-1">
                    <p style={{ color: '#8B95B3', fontSize: 14, fontWeight: 600 }}>
                      {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'][i - 1]}
                    </p>
                    <p style={{ color: '#4A5568', fontSize: 11 }}>Dữ liệu không cập nhật</p>
                  </div>
                  <span style={{ color: '#4A5568', fontSize: 13, fontFamily: 'monospace' }}>—</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeState === 'gate' && (
          <GatePanel
            type={activePage === 'p2p' ? 'kyc' : activePage === 'orders' ? '2fa' : 'kyc'}
            onCta={() => {}}
          />
        )}
      </div>

      {/* Frame naming spec */}
      <div className="mx-5 rounded-2xl p-4" style={{ background: '#141822', border: '1px solid #2A3356' }}>
        <p style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Naming Convention</p>
        <div className="flex flex-col gap-1">
          {['Loading', 'Empty', 'Error', 'Offline', ...(hasGate ? ['Gate'] : [])].map(state => (
            <div key={state} className="flex items-center gap-2 py-1">
              <span style={{ color: '#3B82F6', fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                {config.label} – {state}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION C — Security Overlays
   ═══════════════════════════════════════════════════════════ */
function SecurityOverlaysSection() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [activeOverlay, setActiveOverlay] = useState<'session' | 'reauth' | 'kyc' | '2fa'>('session');
  const [showModal, setShowModal] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="px-5">
        <p style={{ color: '#8B95B3', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          4 security overlay chuẩn enterprise. Click "Xem Live" để mở overlay tương ứng.
        </p>

        {/* Overlay cards */}
        <div className="flex flex-col gap-4">
          {/* 1: Session Expired Modal */}
          <div className="rounded-2xl p-4" style={{ background: '#141822', border: '1px solid #2A3356' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.12)' }}>
                <LogIn size={20} color="#EF4444" />
              </div>
              <div className="flex-1">
                <p style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700 }}>Session Expired Modal</p>
                <p style={{ color: '#8B95B3', fontSize: 12 }}>Phiên đăng nhập đã hết hạn</p>
              </div>
              <button onClick={() => setShowModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                Xem Live
              </button>
            </div>
            <p style={{ color: '#4A5568', fontSize: 12 }}>
              CTA: "Đăng nhập lại" → Redirect to /auth/login
            </p>
          </div>

          {/* 2: Re-auth Bottom Sheet */}
          <div className="rounded-2xl p-4" style={{ background: '#141822', border: '1px solid #2A3356' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.12)' }}>
                <KeyRound size={20} color="#3B82F6" />
              </div>
              <div className="flex-1">
                <p style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700 }}>Re-auth Bottom Sheet</p>
                <p style={{ color: '#8B95B3', fontSize: 12 }}>Xác thực lại để tiếp tục</p>
              </div>
              <button onClick={() => setShowSheet(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}>
                Xem Live
              </button>
            </div>
            <p style={{ color: '#4A5568', fontSize: 12 }}>
              Input: Password hoặc mã 2FA (toggle)
            </p>
          </div>

          {/* 3: KYC Gate */}
          <div className="rounded-2xl p-4" style={{ background: '#141822', border: '1px solid #2A3356' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.12)' }}>
                <ShieldCheck size={20} color="#F59E0B" />
              </div>
              <div className="flex-1">
                <p style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700 }}>KYC Gate Panel</p>
                <p style={{ color: '#8B95B3', fontSize: 12 }}>Cần KYC để tiếp tục</p>
              </div>
              <button onClick={() => setActiveOverlay('kyc')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  background: activeOverlay === 'kyc' ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.08)',
                  color: '#F59E0B',
                  border: `1px solid rgba(245,158,11,${activeOverlay === 'kyc' ? 0.4 : 0.2})`,
                }}>
                {activeOverlay === 'kyc' ? 'Đang hiển thị' : 'Xem preview'}
              </button>
            </div>
            <p style={{ color: '#4A5568', fontSize: 12 }}>
              CTA: "Đi tới KYC" → /profile/kyc
            </p>
          </div>

          {/* 4: 2FA Gate */}
          <div className="rounded-2xl p-4" style={{ background: '#141822', border: '1px solid #2A3356' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.12)' }}>
                <KeyRound size={20} color="#3B82F6" />
              </div>
              <div className="flex-1">
                <p style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700 }}>2FA Gate Panel</p>
                <p style={{ color: '#8B95B3', fontSize: 12 }}>Bật 2FA để tiếp tục</p>
              </div>
              <button onClick={() => setActiveOverlay('2fa')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  background: activeOverlay === '2fa' ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.08)',
                  color: '#3B82F6',
                  border: `1px solid rgba(59,130,246,${activeOverlay === '2fa' ? 0.4 : 0.2})`,
                }}>
                {activeOverlay === '2fa' ? 'Đang hiển thị' : 'Xem preview'}
              </button>
            </div>
            <p style={{ color: '#4A5568', fontSize: 12 }}>
              CTA: "Thiết lập 2FA" → /profile/security
            </p>
          </div>
        </div>
      </div>

      {/* Gate Panel Preview */}
      {(activeOverlay === 'kyc' || activeOverlay === '2fa') && (
        <div className="mx-5 rounded-2xl overflow-hidden"
          style={{ background: '#0B0E17', border: '1px solid #2A3356' }}>
          <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#4A5568', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Preview — {activeOverlay === 'kyc' ? 'KYC Gate' : '2FA Gate'}
            </span>
          </div>
          <GatePanel
            type={activeOverlay}
            onCta={() => navigate(`${prefix}${activeOverlay === 'kyc' ? '/profile/kyc' : '/profile/security'}`)}
          />
        </div>
      )}

      {/* Live overlays */}
      <SessionExpiredModal
        open={showModal}
        onLogin={() => { setShowModal(false); navigate(`${prefix}/auth/login`); }}
        onClose={() => setShowModal(false)}
      />
      <ReauthSheet
        open={showSheet}
        onSubmit={() => setShowSheet(false)}
        onClose={() => setShowSheet(false)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export function EnterpriseStatesPage() {
  const [section, setSection] = useState<Section>('statekit');

  return (
    <PageLayout variant="immersive" style={{ background: '#0B0E17' }}>
      {/* Page header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            <Layers size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#F0F4FF', fontSize: 20, fontWeight: 700 }}>02 – Enterprise UI States</h1>
            <p style={{ color: '#8B95B3', fontSize: 12 }}>UI-only • Không redesign • Match 100% style hiện tại</p>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <TabBar
        variant="segment"
        tabs={[
          { id: 'statekit', label: 'A — State Kit' },
          { id: 'applied', label: 'B — Applied' },
          { id: 'security', label: 'C — Security' },
        ]}
        active={section}
        onChange={setSection}
        className="mx-5 mb-4"
      />

      {/* Section content */}
      {section === 'statekit' && <StateKitSection />}
      {section === 'applied' && <AppliedStatesSection />}
      {section === 'security' && <SecurityOverlaysSection />}
    </PageLayout>
  );
}