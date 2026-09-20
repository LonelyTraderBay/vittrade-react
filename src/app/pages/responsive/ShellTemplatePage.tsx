import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Home, BarChart2, ArrowLeftRight, Wallet, User, Smartphone, Tablet, Monitor, ChevronRight, Settings, Bell, HelpCircle } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';

/* ─── Mini Preview Components ─── */

function MiniBottomNav({ scale = 1 }: { scale?: number }) {
  const items = [
    { icon: Home, label: 'Home', active: true },
    { icon: BarChart2, label: 'Market' },
    { icon: ArrowLeftRight, label: 'Trade', isCenter: true },
    { icon: Wallet, label: 'Ví' },
    { icon: User, label: 'Tôi' },
  ];
  return (
    <div className="flex items-end justify-around px-1 py-1.5"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,14,23,0.95)' }}>
      {items.map((item, i) => {
        const Icon = item.icon;
        if (item.isCenter) {
          return (
            <div key={i} className="flex flex-col items-center -mt-2">
              <div className="rounded-lg flex items-center justify-center"
                style={{ width: 24 * scale, height: 24 * scale, background: 'linear-gradient(135deg, #3B82F6, #1d4ed8)' }}>
                <Icon size={12 * scale} color="#fff" />
              </div>
            </div>
          );
        }
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <Icon size={10 * scale} color={item.active ? '#3B82F6' : '#4A5568'} />
            <span style={{ fontSize: 6 * scale, color: item.active ? '#3B82F6' : '#4A5568' }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MiniLeftRail({ height }: { height: number }) {
  const items = [Home, BarChart2, ArrowLeftRight, Wallet, User];
  return (
    <div className="flex flex-col items-center py-2 gap-2 shrink-0"
      style={{ width: 28, background: 'rgba(11,14,23,0.98)', borderRight: '1px solid rgba(255,255,255,0.06)', height }}>
      <div className="w-4 h-4 rounded flex items-center justify-center mb-2"
        style={{ background: 'linear-gradient(135deg, #3B82F6, #1d4ed8)' }}>
        <svg width="8" height="8" viewBox="0 0 20 20" fill="none">
          <path d="M3 10L8 5L12 9L17 4" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
      {items.map((Icon, i) => (
        <div key={i} className="flex items-center justify-center rounded"
          style={{ width: 20, height: 20, background: i === 0 ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
          <Icon size={10} color={i === 0 ? '#3B82F6' : '#4A5568'} />
        </div>
      ))}
    </div>
  );
}

const SKELETON_WIDTHS = [85, 72, 95, 78, 88, 70, 92, 76, 82, 90];

function MiniContent({ lines = 5 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-1 p-2 flex-1">
      <div className="h-2 rounded" style={{ background: '#1C2235', width: '60%' }} />
      <div className="h-5 rounded-lg" style={{ background: 'linear-gradient(135deg, #1a2550, #0d1b3e)', border: '1px solid rgba(59,130,246,0.2)' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-2 rounded" style={{ background: '#1C2235', width: `${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%` }} />
      ))}
    </div>
  );
}

function MiniStatusBar() {
  return (
    <div className="flex items-center justify-between px-2 py-0.5">
      <span style={{ fontSize: 6, color: '#F0F4FF', fontWeight: 600 }}>9:41</span>
      <div className="flex gap-0.5">
        <div className="w-2 h-1 rounded-sm" style={{ background: '#F0F4FF' }} />
        <div className="w-3 h-1 rounded-sm" style={{ background: 'rgba(240,244,255,0.4)' }} />
      </div>
    </div>
  );
}

/* ─── Frame Wrapper ─── */
function ShellFrame({ label, width, height, children, badge }: {
  label: string; width: number; height: number; children: React.ReactNode; badge?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700 }}>{label}</span>
        {badge && (
          <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}>
            {badge}
          </span>
        )}
      </div>
      <span style={{ color: '#4A5568', fontSize: 11 }}>{width} × {height}</span>
      <div
        className="relative overflow-hidden"
        style={{
          width: width * 0.35,
          height: height * 0.35,
          background: '#0B0E17',
          borderRadius: Math.min(width * 0.02, 12),
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ShellTemplatePage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'templates' | 'applied'>('templates');

  const hubPages = [
    { name: 'HomePage', path: '/r/home', icon: Home },
    { name: 'MarketListPage', path: '/r/markets', icon: BarChart2 },
    { name: 'PairDetailPage', path: '/r/pair/btcusdt', icon: BarChart2 },
    { name: 'TradePage', path: '/r/trade/btcusdt', icon: ArrowLeftRight },
    { name: 'WalletPage', path: '/r/wallet', icon: Wallet },
    { name: 'TxHistoryPage', path: '/r/wallet/history', icon: Wallet },
    { name: 'ProfilePage', path: '/r/profile', icon: User },
    { name: 'P2PHomePage', path: '/r/p2p', icon: ArrowLeftRight },
  ];

  return (
    <PageLayout variant="immersive" style={{ background: '#0B0E17' }}>
      {/* Page title */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
            <Monitor size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 700 }}>01 – Responsive Shell</h1>
            <p style={{ color: '#8B95B3', fontSize: 13 }}>No Redesign — Chỉ reflow, giữ nguyên visual style</p>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex mx-6 mb-6 rounded-2xl p-1" style={{ background: '#1C2235' }}>
        {[
          { id: 'templates', label: 'A — Shell Templates' },
          { id: 'applied', label: 'B — Applied Hub Pages' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id as any)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: activeSection === tab.id ? '#3B82F6' : 'transparent',
              color: activeSection === tab.id ? '#fff' : '#8B95B3',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── SECTION A: Shell Templates ─── */}
      {activeSection === 'templates' && (
        <div className="px-6">
          <p style={{ color: '#8B95B3', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            4 shell templates cho breakpoints khác nhau. Mobile/Tablet dùng BottomNav. Desktop có 2 phương án:
            Desktop Centered (BottomNav, max-width 480) và Desktop Adaptive (LeftRail sidebar, max-width 1200).
          </p>

          {/* Row 1: Mobile shells */}
          <div className="flex flex-wrap gap-8 mb-8 justify-center">
            {/* Shell – Mobile S */}
            <ShellFrame label="Shell – Mobile S" width={360} height={800}>
              <div className="flex flex-col h-full">
                <MiniStatusBar />
                <MiniContent lines={6} />
                <MiniBottomNav scale={0.8} />
              </div>
            </ShellFrame>

            {/* Shell – Mobile L */}
            <ShellFrame label="Shell – Mobile L" width={390} height={844}>
              <div className="flex flex-col h-full">
                <MiniStatusBar />
                <MiniContent lines={7} />
                <MiniBottomNav />
              </div>
            </ShellFrame>
          </div>

          {/* Row 2: Tablet */}
          <div className="flex flex-wrap gap-8 mb-8 justify-center">
            <ShellFrame label="Shell – Tablet" width={834} height={1194}>
              <div className="flex flex-col h-full">
                <MiniStatusBar />
                <div className="flex-1 flex items-start justify-center p-2">
                  <div style={{ maxWidth: '80%', width: '100%' }}>
                    <MiniContent lines={10} />
                  </div>
                </div>
                <MiniBottomNav scale={1.2} />
              </div>
            </ShellFrame>
          </div>

          {/* Row 3: Desktop variants */}
          <p style={{ color: '#F0F4FF', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Desktop — 2 phương án</p>
          <div className="flex flex-wrap gap-8 mb-8 justify-center">
            {/* Desktop Centered */}
            <ShellFrame label="Desktop – Centered" width={1440} height={900} badge="Phương án A">
              <div className="flex items-center justify-center h-full" style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d1b3e 0%, #050810 70%)' }}>
                <div style={{ width: '35%', height: '85%', background: '#0B0E17', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div className="flex flex-col h-full">
                    <MiniStatusBar />
                    <MiniContent lines={4} />
                    <MiniBottomNav scale={0.7} />
                  </div>
                </div>
              </div>
            </ShellFrame>

            {/* Desktop Adaptive */}
            <ShellFrame label="Desktop – Adaptive" width={1440} height={900} badge="Phương án B">
              <div className="flex h-full">
                <MiniLeftRail height={height} />
                <div className="flex-1 flex flex-col">
                  <div className="h-3 shrink-0" style={{ background: 'rgba(11,14,23,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 5, color: '#8B95B3', marginLeft: 4 }}>VitTrade Desktop</span>
                  </div>
                  <div className="flex-1 flex justify-center p-2">
                    <div style={{ maxWidth: '80%', width: '100%' }}>
                      <MiniContent lines={8} />
                    </div>
                  </div>
                </div>
              </div>
            </ShellFrame>
          </div>

          {/* Legend */}
          <div className="rounded-2xl p-4" style={{ background: '#141822', border: '1px solid #2A3356' }}>
            <p style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Quy tắc Shell</p>
            {[
              { bp: 'Mobile S (360)', rule: 'BottomNav, content full-width' },
              { bp: 'Mobile L (390)', rule: 'BottomNav, content full-width' },
              { bp: 'Tablet (834)', rule: 'BottomNav, content max-width 720, centered' },
              { bp: 'Desktop Centered', rule: 'BottomNav kept, content max-width 480, phone-like frame' },
              { bp: 'Desktop Adaptive', rule: 'LeftRail sidebar, content max-width 1200, multi-column layouts' },
            ].map((r, i) => (
              <div key={r.bp} className="flex items-center gap-3 py-2"
                style={{ borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600, width: 140 }}>{r.bp}</span>
                <span style={{ color: '#8B95B3', fontSize: 12 }}>{r.rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SECTION B: Applied Hub Pages ─── */}
      {activeSection === 'applied' && (
        <div className="px-6">
          <p style={{ color: '#8B95B3', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            8 màn hub đã được áp dụng shell responsive. Mỗi màn tự động reflow theo breakpoint: Mobile L → Tablet → Desktop Adaptive.
            Click vào bất kỳ màn nào để xem live responsive.
          </p>

          {/* Hub page cards */}
          <div className="grid grid-cols-1 gap-4" style={{ maxWidth: 800 }}>
            {hubPages.map((page, i) => {
              const Icon = page.icon;
              const desktopLayouts: Record<string, string> = {
                'HomePage': '1 cột centered (max-w 720)',
                'MarketListPage': '2 cột (list + Top Movers/Watchlist)',
                'PairDetailPage': '2 cột (chart + quick actions)',
                'TradePage': '2 cột (chart/orderbook + order form)',
                'WalletPage': '2 cột (balances + recent activity)',
                'TxHistoryPage': 'Table-like list + extra columns',
                'ProfilePage': '1 cột, shortcuts 2-col grid',
                'P2PHomePage': '2 cột (ads + filters/help)',
              };

              return (
                <button key={page.name} onClick={() => navigate(page.path)}
                  className="flex items-center gap-4 p-4 rounded-2xl w-full active:opacity-80 transition-opacity"
                  style={{ background: '#141822', border: '1px solid #2A3356' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <Icon size={22} color="#3B82F6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: '#F0F4FF', fontSize: 15, fontWeight: 700 }}>{page.name}</p>
                    <p style={{ color: '#8B95B3', fontSize: 12 }}>{page.path}</p>
                    <p style={{ color: '#4A5568', fontSize: 11, marginTop: 2 }}>
                      Desktop: {desktopLayouts[page.name]}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Smartphone size={14} color="#10B981" />
                    <Tablet size={14} color="#3B82F6" />
                    <Monitor size={14} color="#8B5CF6" />
                  </div>
                  <ChevronRight size={16} color="#4A5568" />
                </button>
              );
            })}
          </div>

          {/* Per-page desktop layout spec */}
          <div className="mt-6 rounded-2xl p-4" style={{ background: '#141822', border: '1px solid #2A3356' }}>
            <p style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Desktop Adaptive Layout Spec</p>
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ color: '#4A5568', fontSize: 11, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Page</th>
                    <th style={{ color: '#4A5568', fontSize: 11, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Columns</th>
                    <th style={{ color: '#4A5568', fontSize: 11, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Left Panel</th>
                    <th style={{ color: '#4A5568', fontSize: 11, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Right Panel</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { page: 'Home', cols: '1', left: 'Full content (centered)', right: '—' },
                    { page: 'MarketList', cols: '2', left: 'Market list + search', right: 'Top Movers + Watchlist' },
                    { page: 'PairDetail', cols: '2', left: 'Chart / Orderbook / Trades', right: 'Quick Buy/Sell + Alerts' },
                    { page: 'Trade', cols: '2', left: 'Chart + Orderbook', right: 'Order Form' },
                    { page: 'Wallet', cols: '2', left: 'Balances + Assets', right: 'Recent Activity + Stats' },
                    { page: 'TxHistory', cols: '1 (wide)', left: 'Table-like list (extra cols)', right: '—' },
                    { page: 'Profile', cols: '1', left: 'Full content, 2-col grid items', right: '—' },
                    { page: 'P2P', cols: '2', left: 'Ads list', right: 'Filters + Help + Stats' },
                  ].map((row, i) => (
                    <tr key={row.page}>
                      <td style={{ color: '#F0F4FF', fontSize: 12, fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.page}</td>
                      <td style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.cols}</td>
                      <td style={{ color: '#8B95B3', fontSize: 12, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.left}</td>
                      <td style={{ color: '#8B95B3', fontSize: 12, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.right}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

// height variable used in MiniLeftRail - need to define it at module level
const height = 315; // 900 * 0.35