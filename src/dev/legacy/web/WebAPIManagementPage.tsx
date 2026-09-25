/**
 * ══════════════════════════════════════════════════════════
 *  WEB API MANAGEMENT PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/profile/api
 *
 *  API key management for programmatic trading
 *  - API key list with permissions
 *  - Create/Delete/Edit keys
 *  - IP whitelist management
 *  - Permission scopes (Read, Trade, Withdraw)
 *  - Usage statistics & rate limits
 *  - Security best practices
 *
 *  Guidelines compliance:
 *  - §14.1: Security Center patterns
 *  - §14.2: Sensitive data masking
 *  - §14.3: High-risk actions require confirm
 *  - §21.4: Header with breadcrumb
 */

import React, { useState } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Edit,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Unlock,
  Activity,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT } from '@/shared/theme/webTokens';
import { PageLayout } from '@/shared/ui/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

type APIPermission = 'read' | 'trade' | 'withdraw';
type APIKeyStatus = 'active' | 'expired' | 'disabled';

interface APIKey {
  id: string;
  name: string;
  key: string;
  secret?: string;
  permissions: APIPermission[];
  ipWhitelist: string[];
  createdDate: string;
  lastUsed?: string;
  status: APIKeyStatus;
  requestCount30d: number;
  rateLimit: number;
}

const API_KEYS: APIKey[] = [
  {
    id: 'api1',
    name: 'Trading Bot — Production',
    key: 'ak_prod_xK9mN2pL4vR8wQ3j',
    permissions: ['read', 'trade'],
    ipWhitelist: ['203.45.67.89', '45.123.78.90'],
    createdDate: '2026-01-15',
    lastUsed: '2026-03-13 09:45',
    status: 'active',
    requestCount30d: 145230,
    rateLimit: 1200,
  },
  {
    id: 'api2',
    name: 'Portfolio Tracker',
    key: 'ak_read_8hF3nK2mP9vL4wQ5',
    permissions: ['read'],
    ipWhitelist: [],
    createdDate: '2025-11-20',
    lastUsed: '2026-03-13 10:12',
    status: 'active',
    requestCount30d: 8420,
    rateLimit: 600,
  },
  {
    id: 'api3',
    name: 'Old Trading Script',
    key: 'ak_old_2vR8wQ3jK9mN4pL7',
    permissions: ['read', 'trade', 'withdraw'],
    ipWhitelist: ['192.168.1.100'],
    createdDate: '2025-08-10',
    lastUsed: '2025-12-15 14:30',
    status: 'disabled',
    requestCount30d: 0,
    rateLimit: 1200,
  },
];

const PERMISSION_CONFIG: Record<
  APIPermission,
  { label: string; color: string; icon: React.ElementType }
> = {
  read: { label: 'Read', color: '#3B82F6', icon: Eye },
  trade: { label: 'Trade', color: '#10B981', icon: Activity },
  withdraw: { label: 'Withdraw', color: '#EF4444', icon: Unlock },
};

const BEST_PRACTICES = [
  'Không chia sẻ API Secret với bất kỳ ai',
  'Luôn sử dụng IP Whitelist cho môi trường production',
  'Tạo API key riêng cho mỗi ứng dụng/bot',
  'Chỉ cấp quyền tối thiểu cần thiết',
  'Xóa API key không dùng để giảm rủi ro',
  'Định kỳ rotate API keys (3-6 tháng)',
];

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function APIKeyCard({ apiKey }: { apiKey: APIKey }) {
  const c = useThemeColors();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = () => {
    switch (apiKey.status) {
      case 'active':
        return '#10B981';
      case 'expired':
        return '#F59E0B';
      case 'disabled':
        return '#94A3B8';
    }
  };

  const getStatusLabel = () => {
    switch (apiKey.status) {
      case 'active':
        return 'Hoạt động';
      case 'expired':
        return 'Hết hạn';
      case 'disabled':
        return 'Vô hiệu';
    }
  };

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 40,
                height: 40,
                background: `${getStatusColor()}15`,
              }}
            >
              <Key size={20} color={getStatusColor()} />
            </div>
            <div>
              <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
                {apiKey.name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded-md"
                  style={{
                    background: `${getStatusColor()}15`,
                    color: getStatusColor(),
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {getStatusLabel()}
                </span>
                <span style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
                  Tạo: {new Date(apiKey.createdDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* API Key Display */}
          <div
            className="flex items-center gap-2 p-3 rounded-lg mt-3"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
            }}
          >
            <Key size={14} color={c.text3} />
            <code
              className="flex-1 font-mono"
              style={{
                color: c.text1,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
              }}
            >
              {showKey ? apiKey.key : '••••••••••••••••••••••••'}
            </code>
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-1 rounded transition-colors"
              style={{ color: c.text3 }}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={handleCopy}
              className="p-1 rounded transition-colors"
              style={{ color: copied ? '#10B981' : c.text3 }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            className="p-2 rounded-lg transition-colors"
            style={{
              color: c.text3,
              border: `1px solid ${c.border}`,
            }}
          >
            <Edit size={16} />
          </button>
          <button
            className="p-2 rounded-lg transition-colors"
            style={{
              color: '#EF4444',
              border: `1px solid #EF444440`,
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Permissions */}
      <div className="mb-4">
        <div
          style={{
            color: c.text2,
            fontSize: WEB_FONT.SIZE.CAPTION,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Quyền truy cập
        </div>
        <div className="flex items-center gap-2">
          {apiKey.permissions.map((perm) => {
            const config = PERMISSION_CONFIG[perm];
            const Icon = config.icon;
            return (
              <span
                key={perm}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                style={{
                  background: `${config.color}15`,
                  color: config.color,
                  fontSize: WEB_FONT.SIZE.CAPTION,
                  fontWeight: 600,
                }}
              >
                <Icon size={12} />
                {config.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* IP Whitelist */}
      <div className="mb-4">
        <div
          style={{
            color: c.text2,
            fontSize: WEB_FONT.SIZE.CAPTION,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          IP Whitelist
        </div>
        {apiKey.ipWhitelist.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {apiKey.ipWhitelist.map((ip, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded font-mono"
                style={{
                  background: `${c.text3}10`,
                  color: c.text2,
                  fontSize: WEB_FONT.SIZE.CAPTION,
                  fontWeight: 600,
                }}
              >
                {ip}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
            Không giới hạn (không khuyến nghị)
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="pt-4 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${c.divider}` }}>
        <div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Requests (30d)
          </div>
          <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {apiKey.requestCount30d.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Rate Limit
          </div>
          <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {apiKey.rateLimit}/min
          </div>
        </div>
        <div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Sử dụng gần nhất
          </div>
          <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {apiKey.lastUsed
              ? new Date(apiKey.lastUsed).toLocaleString('vi-VN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebAPIManagementPage() {
  const c = useThemeColors();

  const activeKeys = API_KEYS.filter((k) => k.status === 'active');
  const totalRequests = API_KEYS.reduce((sum, k) => sum + k.requestCount30d, 0);

  return (
    <PageLayout>
      <div className="flex" style={{ minHeight: '100%' }}>
        {/* ═══ LEFT SIDEBAR (300px) ═══ */}
        <div
          className="flex flex-col"
          style={{
            width: 300,
            background: c.surface,
            borderRight: `1px solid ${c.divider}`,
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            maxHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5"
            style={{
              height: 60,
              borderBottom: `1px solid ${c.divider}`,
            }}
          >
            <h2
              style={{
                color: c.text1,
                fontSize: WEB_FONT.SIZE.H2,
                fontWeight: 700,
                margin: 0,
              }}
            >
              API Management
            </h2>
          </div>

          {/* Create New Button */}
          <div className="p-4">
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors"
              style={{
                background: '#3B82F6',
                color: '#fff',
                fontSize: WEB_FONT.SIZE.BODY,
                fontWeight: 600,
                border: 'none',
              }}
            >
              <Plus size={18} />
              Tạo API Key mới
            </button>
          </div>

          {/* Stats */}
          <div className="px-4 pb-4">
            <div
              style={{
                color: c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Thống kê
            </div>
            <div className="flex flex-col gap-3">
              <div
                className="p-3 rounded-lg"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                  API Keys hoạt động
                </div>
                <div style={{ color: '#10B981', fontSize: 20, fontWeight: 800 }}>
                  {activeKeys.length}
                  <span
                    style={{ fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, color: c.text3 }}
                  >
                    /{API_KEYS.length}
                  </span>
                </div>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                  Requests (30 ngày)
                </div>
                <div style={{ color: c.text1, fontSize: 20, fontWeight: 800 }}>
                  {totalRequests.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="px-4 pb-4">
            <div
              className="p-4 rounded-lg"
              style={{
                background: '#3B82F615',
                border: `1px solid #3B82F640`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} color="#3B82F6" />
                <span
                  style={{ color: '#3B82F6', fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 700 }}
                >
                  Best Practices
                </span>
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  color: c.text2,
                  fontSize: 11,
                  lineHeight: 1.6,
                }}
              >
                {BEST_PRACTICES.slice(0, 3).map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Documentation Link */}
          <div className="px-4 pb-4 mt-auto">
            <button
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
              }}
            >
              <span className="flex items-center gap-2">
                <Info size={14} />
                API Documentation
              </span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto p-8">
            {/* Page Header */}
            <div className="mb-6">
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.H3,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                API Keys của bạn
              </h3>
              <p style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, margin: 0 }}>
                Quản lý API keys để truy cập dữ liệu và giao dịch theo chương trình
              </p>
            </div>

            {/* API Keys List */}
            <div className="flex flex-col gap-4">
              {API_KEYS.map((apiKey) => (
                <APIKeyCard key={apiKey.id} apiKey={apiKey} />
              ))}
            </div>

            {/* Security Notice */}
            <div
              className="mt-6 p-5 rounded-xl"
              style={{
                background: '#EF444415',
                border: `1px solid #EF444440`,
              }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                <div>
                  <div
                    style={{
                      color: '#EF4444',
                      fontSize: WEB_FONT.SIZE.BODY,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Cảnh báo bảo mật
                  </div>
                  <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, lineHeight: 1.6 }}>
                    API Secret chỉ hiển thị 1 lần khi tạo. Lưu trữ an toàn và không chia sẻ với bất
                    kỳ ai. Nếu API key bị lộ, hãy xóa ngay lập tức và tạo key mới. Chúng tôi không
                    thể khôi phục API Secret đã mất.
                  </div>
                </div>
              </div>
            </div>

            {/* Full Best Practices */}
            <div className="mt-6">
              <h4
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.BODY,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Khuyến nghị bảo mật
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {BEST_PRACTICES.map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 rounded-lg"
                    style={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                    }}
                  >
                    <CheckCircle2 size={16} color="#10B981" className="flex-shrink-0 mt-0.5" />
                    <span
                      style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, lineHeight: 1.5 }}
                    >
                      {tip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
