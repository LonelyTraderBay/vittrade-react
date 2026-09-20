import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Layers, Lock, ShoppingCart, Receipt, ArrowRight, ChevronRight,
  ShieldCheck, ClipboardList, Activity, Clock, CheckCircle,
  BarChart2, Wallet, Eye
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';

/* ═══════════════════════════════════════════════════════════
   Flow connection type
   ═══════════════════════════════════════════════════════════ */
interface FlowLink {
  from: string;
  fromRoute: string;
  to: string;
  toRoute: string;
  trigger: string;
  color: string;
}

const FLOW_CONNECTIONS: FlowLink[] = [
  { from: 'OTPPage', fromRoute: '/auth/otp', to: 'ResetPasswordPage', toRoute: '/auth/reset-password', trigger: 'OTP verified (purpose=verify)', color: '#3B82F6' },
  { from: 'ResetPasswordPage', fromRoute: '/auth/reset-password', to: 'LoginPage', toRoute: '/auth/login', trigger: 'Success → "Đăng nhập"', color: '#10B981' },
  { from: 'P2PHomePage', fromRoute: '/p2p', to: 'P2PMyOrdersPage', toRoute: '/p2p/my-orders', trigger: 'Tap "Đơn P2P của tôi"', color: '#8B5CF6' },
  { from: 'P2PMyOrdersPage', fromRoute: '/p2p/my-orders', to: 'P2POrderPage', toRoute: '/p2p/order/:id', trigger: 'Tap order card', color: '#F59E0B' },
  { from: 'TransactionHistory', fromRoute: '/wallet/history', to: 'TransactionDetail', toRoute: '/wallet/tx/:id', trigger: 'Tap transaction row', color: '#10B981' },
  { from: 'SecurityPage', fromRoute: '/profile/security', to: 'ActivityLogPage', toRoute: '/profile/activity', trigger: 'Tap "Nhật ký hoạt động"', color: '#3B82F6' },
  { from: 'SecurityPage', fromRoute: '/profile/security', to: 'OrdersHistoryPage', toRoute: '/trade/orders', trigger: 'Tap "Lịch sử lệnh"', color: '#F59E0B' },
];

/* ═══════════════════════════════════════════════════════════
   SECTION: New Screens
   ═══════════════════════════════════════════════════════════ */
function NewScreensSection() {
  const navigate = useNavigate();

  const screens = [
    {
      icon: Lock,
      title: 'Auth – Reset Password',
      route: '/auth/reset-password',
      description: 'Form đặt lại mật khẩu với password rules, loading state, error handling, và success toast.',
      states: ['Idle', 'Loading (CTA disabled)', 'Error (mật khẩu yếu)', 'Success (toast + CTA Đăng nhập)'],
      color: '#3B82F6',
    },
    {
      icon: ShoppingCart,
      title: 'P2P – My Orders',
      route: '/p2p/my-orders',
      description: 'Danh sách đơn P2P với tabs (Đang xử lý / Hoàn tất / Tranh chấp) và enterprise state variants.',
      states: ['Loading (skeleton)', 'Ready (data)', 'Empty (CTA Khám phá P2P)', 'Error (retry)', 'Offline (stale data)'],
      color: '#10B981',
    },
    {
      icon: Receipt,
      title: 'Wallet – Transaction Detail',
      route: '/wallet/tx/tx001',
      description: 'Chi tiết giao dịch với summary card, timeline steps, detail rows (copyable), và action buttons.',
      states: ['Ready', 'Not Found (error)', 'Explorer link', 'Contact support'],
      color: '#8B5CF6',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p style={{ color: '#8B95B3', fontSize: 13, lineHeight: 1.6 }}>
        3 màn hình mới tạo hoàn chỉnh, match 100% UI style hiện có. Tap để mở live preview.
      </p>

      {screens.map((screen, i) => {
        const Icon = screen.icon;
        return (
          <button key={screen.route}
            onClick={() => navigate(screen.route)}
            className="rounded-2xl p-4 text-left active:opacity-70 transition-opacity"
            style={{ background: '#141822', border: '1px solid #2A3356' }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: screen.color + '15', border: `1px solid ${screen.color}33` }}>
                <Icon size={22} color={screen.color} />
              </div>
              <div className="flex-1">
                <p style={{ color: '#F0F4FF', fontSize: 15, fontWeight: 700 }}>{screen.title}</p>
                <p style={{ color: '#4A5568', fontSize: 11, fontFamily: 'monospace' }}>{screen.route}</p>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                style={{ background: screen.color + '18', border: `1px solid ${screen.color}33` }}>
                <Eye size={12} color={screen.color} />
                <span style={{ color: screen.color, fontSize: 11, fontWeight: 600 }}>Preview</span>
              </div>
            </div>

            {/* Description */}
            <p style={{ color: '#8B95B3', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
              {screen.description}
            </p>

            {/* States */}
            <div className="flex flex-wrap gap-1.5">
              {screen.states.map(state => (
                <span key={state} className="px-2 py-0.5 rounded-lg text-xs"
                  style={{ background: '#1C2235', color: '#8B95B3', border: '1px solid #2A3356' }}>
                  {state}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: v2 Screens + Prototype Links
   ═══════════════════════════════════════════════════════════ */
function V2ScreensSection() {
  const navigate = useNavigate();

  const v2Pages = [
    {
      icon: ShieldCheck,
      title: 'OTPPage (consolidated)',
      route: '/auth/otp',
      changes: ['Purpose badge hiển thị loại xác minh', 'Nút "Quên mật khẩu? Đặt lại" → /auth/reset-password'],
      color: '#3B82F6',
    },
    {
      icon: ShoppingCart,
      title: 'P2PHomePage (consolidated)',
      route: '/p2p',
      changes: ['Card "Đơn P2P của tôi" nổi bật với badge count', 'Navigate → /p2p/my-orders'],
      color: '#10B981',
    },
    {
      icon: Activity,
      title: 'SecurityPage (consolidated)',
      route: '/profile/security',
      changes: ['"Nhật ký hoạt động" với badge count → /profile/activity', '"Lịch sử lệnh" entry → /trade/orders'],
      color: '#F59E0B',
    },
    {
      icon: Wallet,
      title: 'TransactionHistoryPage (consolidated)',
      route: '/wallet/history',
      changes: ['Enterprise states: Loading/Error/Offline', 'Tap row → /wallet/tx/:txId (detail page)'],
      color: '#8B5CF6',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p style={{ color: '#8B95B3', fontSize: 13, lineHeight: 1.6 }}>
        v2 features consolidated into main routes. All flow connections now use primary paths.
      </p>

      {/* v2 Page cards */}
      {v2Pages.map((page, i) => {
        const Icon = page.icon;
        return (
          <button key={page.route}
            onClick={() => navigate(page.route)}
            className="rounded-2xl p-4 text-left active:opacity-70 transition-opacity"
            style={{ background: '#141822', border: '1px solid #2A3356' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: page.color + '15' }}>
                <Icon size={18} color={page.color} />
              </div>
              <div className="flex-1">
                <p style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700 }}>{page.title}</p>
                <p style={{ color: '#4A5568', fontSize: 11, fontFamily: 'monospace' }}>{page.route}</p>
              </div>
              <ChevronRight size={16} color="#4A5568" />
            </div>
            <div className="flex flex-col gap-1.5">
              {page.changes.map((change, j) => (
                <div key={j} className="flex items-start gap-2">
                  <span style={{ color: '#10B981', fontSize: 11, marginTop: 1 }}>✦</span>
                  <span style={{ color: '#8B95B3', fontSize: 12, lineHeight: 1.4 }}>{change}</span>
                </div>
              ))}
            </div>
          </button>
        );
      })}

      {/* Flow map */}
      <div className="mt-4">
        <p style={{ color: '#F0F4FF', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          Prototype Connections (On Tap → Navigate)
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#141822', border: '1px solid #2A3356' }}>
          {FLOW_CONNECTIONS.map((flow, i) => (
            <button key={flow.fromRoute + '-' + flow.toRoute}
              onClick={() => navigate(flow.fromRoute)}
              className="flex items-start gap-3 px-4 py-3 w-full text-left active:opacity-70"
              style={{ borderBottom: i < FLOW_CONNECTIONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              {/* Flow indicator */}
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: flow.color }} />
                <div className="w-0.5 h-4 my-0.5" style={{ background: flow.color + '44' }} />
                <ArrowRight size={10} color={flow.color} />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span style={{ color: '#F0F4FF', fontSize: 12, fontWeight: 600 }}>{flow.from}</span>
                  <ArrowRight size={10} color="#4A5568" />
                  <span style={{ color: flow.color, fontSize: 12, fontWeight: 600 }}>{flow.to}</span>
                </div>
                <p style={{ color: '#4A5568', fontSize: 11 }}>{flow.trigger}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Header back note */}
      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3B82F6', fontSize: 12, lineHeight: 1.5 }}>
          ℹ️ Tất cả header back button sử dụng <span style={{ fontFamily: 'monospace' }}>navigate(-1)</span> theo pattern hiện có.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export function MissingScreensShowcasePage() {
  const [section, setSection] = useState<'new' | 'v2'>('new');

  return (
    <PageLayout variant="immersive" style={{ background: '#0B0E17' }}>
      <PageContent gap="default" padding="default">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6d28d9 100%)' }}>
            <Layers size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#F0F4FF', fontSize: 18, fontWeight: 700 }}>03 – Missing Screens & Flow Fix</h1>
            <p style={{ color: '#8B95B3', fontSize: 12 }}>No redesign • Chỉ tạo mới + v2 entry points</p>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex rounded-xl p-1" style={{ background: '#1C2235' }}>
        {[
          { id: 'new', label: 'New Screens (3)' },
          { id: 'v2', label: 'v2 + Prototype Links' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setSection(tab.id as any)}
            className="flex-1 py-2.5 rounded-lg text-center"
            style={{
              background: section === tab.id ? '#3B82F6' : 'transparent',
              color: section === tab.id ? '#fff' : '#4A5568',
              fontSize: 13,
              fontWeight: section === tab.id ? 700 : 500,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      {section === 'new' && <NewScreensSection />}
      {section === 'v2' && <V2ScreensSection />}
      </PageContent>
    </PageLayout>
  );
}