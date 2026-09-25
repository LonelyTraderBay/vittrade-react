/**
 * WebBotUtilityPages — Enterprise Desktop versions of:
 *   - BotTaxReportingPage
 *   - BotAPIDocumentationPage
 */
import React, { useState } from 'react';
import { FileText, Download, Code, Copy, Key, Zap } from 'lucide-react';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_ICON, WEB_BUTTON } from '@/shared/theme/webTokens';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════
   1. WebBotTaxReportingPage
   ═══════════════════════════════════════════════════ */

const TAX_YEARS = ['2026', '2025', '2024'];
const REPORT_TYPES = [
  {
    id: 'irs-8949',
    name: 'IRS Form 8949',
    desc: 'US tax form — capital gains/losses',
    format: 'PDF',
    recommended: true,
  },
  {
    id: 'csv-detailed',
    name: 'CSV Chi tiết',
    desc: 'Tất cả giao dịch + P/L từng lệnh',
    format: 'CSV',
    recommended: false,
  },
  {
    id: 'turbotax',
    name: 'TurboTax Import',
    desc: 'Tương thích TurboTax / TaxBit',
    format: 'CSV',
    recommended: false,
  },
  {
    id: 'koinly',
    name: 'Koinly Export',
    desc: 'Tương thích Koinly / CoinTracker',
    format: 'CSV',
    recommended: false,
  },
];

const TAX_SUMMARY = {
  totalGains: 745.3,
  shortTermGains: 512.1,
  longTermGains: 233.2,
  totalLosses: -89.4,
  netGain: 655.9,
  totalTrades: 479,
  taxEvents: 234,
};

export function WebBotTaxReportingPage() {
  const c = useThemeColors();
  const [year, setYear] = useState('2026');
  const [selectedReport, setSelectedReport] = useState('irs-8949');

  return (
    <PageLayout>
      <Header title="Báo cáo thuế" subtitle="Tax Reporting · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: '1fr 360px', alignItems: 'flex-start' }}
        >
          {/* Left: Summary + report types */}
          <div className="flex flex-col" style={{ gap: 20 }}>
            {/* Year selector */}
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 14 }}
              >
                Năm thuế
              </p>
              <div className="flex gap-3">
                {TAX_YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    style={{
                      height: WEB_BUTTON.md,
                      padding: '0 24px',
                      borderRadius: 10,
                      fontSize: WEB_FONT.sm,
                      fontWeight: year === y ? 700 : 500,
                      cursor: 'pointer',
                      background: year === y ? c.primary : c.surface2,
                      color: year === y ? '#fff' : c.text2,
                      border: `1px solid ${year === y ? c.primary : c.border}`,
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Tax summary */}
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}
              >
                Tóm tắt thuế {year}
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: 'Tổng lãi',
                    value: `+$${TAX_SUMMARY.totalGains.toFixed(2)}`,
                    color: '#10B981',
                  },
                  {
                    label: 'Lãi ngắn hạn',
                    value: `+$${TAX_SUMMARY.shortTermGains.toFixed(2)}`,
                    color: '#10B981',
                  },
                  {
                    label: 'Lãi dài hạn',
                    value: `+$${TAX_SUMMARY.longTermGains.toFixed(2)}`,
                    color: '#10B981',
                  },
                  {
                    label: 'Tổng lỗ',
                    value: `-$${Math.abs(TAX_SUMMARY.totalLosses).toFixed(2)}`,
                    color: '#EF4444',
                  },
                  {
                    label: 'Lãi ròng',
                    value: `+$${TAX_SUMMARY.netGain.toFixed(2)}`,
                    color: '#10B981',
                  },
                  {
                    label: 'Sự kiện thuế',
                    value: TAX_SUMMARY.taxEvents.toString(),
                    color: undefined,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{ background: c.surface2, borderRadius: 10, padding: '12px 14px' }}
                  >
                    <p
                      style={{
                        color: c.text3,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                    >
                      {s.label}
                    </p>
                    <p
                      style={{
                        color: s.color || c.text1,
                        fontSize: WEB_FONT.lg,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        margin: 0,
                      }}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Report types */}
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 14 }}
              >
                Loại báo cáo
              </p>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {REPORT_TYPES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReport(r.id)}
                    className="flex items-center gap-4 text-left w-full transition-all"
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: selectedReport === r.id ? `${c.primaryAlpha08}` : c.surface2,
                      border: `2px solid ${selectedReport === r.id ? c.primary : 'transparent'}`,
                    }}
                  >
                    <FileText
                      size={WEB_ICON.md}
                      color={selectedReport === r.id ? c.primary : c.text3}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                          {r.name}
                        </span>
                        {r.recommended && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: WEB_FONT.xs,
                              fontWeight: 700,
                              background: 'rgba(16,185,129,0.1)',
                              color: '#10B981',
                            }}
                          >
                            Khuyến nghị
                          </span>
                        )}
                      </div>
                      <p style={{ color: c.text3, fontSize: WEB_FONT.xs, margin: 0, marginTop: 2 }}>
                        {r.desc}
                      </p>
                    </div>
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 500 }}>
                      {r.format}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Download panel */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <Download size={WEB_ICON.md} color={c.primary} />
                <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  Tải báo cáo
                </span>
              </div>
              <div className="flex flex-col" style={{ gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Năm', value: year },
                  {
                    label: 'Loại',
                    value: REPORT_TYPES.find((r) => r.id === selectedReport)?.name || '',
                  },
                  {
                    label: 'Format',
                    value: REPORT_TYPES.find((r) => r.id === selectedReport)?.format || '',
                  },
                  { label: 'Giao dịch', value: `${TAX_SUMMARY.totalTrades} lệnh` },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between">
                    <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{r.label}</span>
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toast.success(`Đang tạo báo cáo ${selectedReport}...`)}
                className="flex items-center justify-center gap-2 w-full"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 12,
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: c.primary,
                  color: '#fff',
                }}
              >
                <Download size={WEB_ICON.sm} /> Tải xuống
              </button>
              {/* Disclaimer */}
              <div
                style={{
                  marginTop: 16,
                  background: 'rgba(245,158,11,0.06)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5, margin: 0 }}>
                  <span style={{ color: '#F59E0B', fontWeight: 700 }}>Lưu ý:</span> Báo cáo này chỉ
                  mang tính tham khảo. Hãy tham vấn chuyên gia thuế trước khi nộp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   2. WebBotAPIDocumentationPage
   ═══════════════════════════════════════════════════ */

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/bots', desc: 'Liệt kê tất cả bot', color: '#10B981' },
  { method: 'POST', path: '/api/v1/bots', desc: 'Tạo bot mới', color: '#3B82F6' },
  { method: 'GET', path: '/api/v1/bots/:id', desc: 'Chi tiết bot', color: '#10B981' },
  { method: 'PUT', path: '/api/v1/bots/:id', desc: 'Cập nhật bot', color: '#F59E0B' },
  { method: 'DELETE', path: '/api/v1/bots/:id', desc: 'Xóa bot', color: '#EF4444' },
  { method: 'POST', path: '/api/v1/bots/:id/start', desc: 'Khởi động bot', color: '#3B82F6' },
  { method: 'POST', path: '/api/v1/bots/:id/stop', desc: 'Dừng bot', color: '#3B82F6' },
  {
    method: 'GET',
    path: '/api/v1/bots/:id/trades',
    desc: 'Lịch sử giao dịch bot',
    color: '#10B981',
  },
  {
    method: 'GET',
    path: '/api/v1/bots/:id/performance',
    desc: 'Metrics hiệu suất',
    color: '#10B981',
  },
  { method: 'POST', path: '/api/v1/backtest', desc: 'Chạy backtest', color: '#3B82F6' },
];

const CODE_EXAMPLE = `// Tạo DCA Bot mới
const response = await fetch('/api/v1/bots', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    strategy: 'dca',
    pair: 'BTC/USDT',
    amount: 100,
    interval: 'daily',
    totalBudget: 1000,
  }),
});

const bot = await response.json();
console.log('Bot created:', bot.id);`;

export function WebBotAPIDocumentationPage() {
  const c = useThemeColors();
  const [activeTab, setActiveTab] = useState<'endpoints' | 'auth' | 'examples'>('endpoints');

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLE);
    toast.success('Đã copy code');
  };

  const tabs = [
    { id: 'endpoints' as const, label: 'Endpoints' },
    { id: 'auth' as const, label: 'Authentication' },
    { id: 'examples' as const, label: 'Code Examples' },
  ];

  return (
    <PageLayout>
      <Header title="API Documentation" subtitle="Tài liệu API · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Tabs */}
        <div
          className="flex items-center gap-1"
          style={{
            background: c.surface2,
            borderRadius: 12,
            padding: 4,
            display: 'inline-flex',
            marginBottom: 24,
          }}
        >
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="transition-all"
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  fontSize: WEB_FONT.base,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: active ? c.surface : 'transparent',
                  color: active ? c.text1 : c.text3,
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Endpoints tab */}
        {activeTab === 'endpoints' && (
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: '90px 280px 1fr',
                padding: '12px 20px',
                borderBottom: `1px solid ${c.divider}`,
                background: c.surface2,
              }}
            >
              {['Method', 'Endpoint', 'Mô tả'].map((h) => (
                <span
                  key={h}
                  style={{
                    color: c.text3,
                    fontSize: WEB_FONT.xs,
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
            {ENDPOINTS.map((ep, i) => (
              <div
                key={i}
                className="grid"
                style={{
                  gridTemplateColumns: '90px 280px 1fr',
                  padding: '12px 20px',
                  borderBottom: i < ENDPOINTS.length - 1 ? `1px solid ${c.divider}` : 'none',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: WEB_FONT.xs,
                    fontWeight: 700,
                    background: ep.color + '15',
                    color: ep.color,
                    display: 'inline-block',
                    width: 'fit-content',
                  }}
                >
                  {ep.method}
                </span>
                <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontFamily: 'monospace' }}>
                  {ep.path}
                </span>
                <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>{ep.desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* Auth tab */}
        {activeTab === 'auth' && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <Key size={WEB_ICON.md} color={c.primary} />
                <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  API Key Authentication
                </span>
              </div>
              <p
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.base,
                  lineHeight: 1.6,
                  marginBottom: 14,
                }}
              >
                Tất cả request cần header{' '}
                <code
                  style={{
                    background: c.surface2,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: WEB_FONT.sm,
                  }}
                >
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </p>
              <div
                style={{
                  background: c.surface2,
                  borderRadius: 12,
                  padding: '14px 16px',
                  fontFamily: 'monospace',
                }}
              >
                <p style={{ color: c.text1, fontSize: WEB_FONT.sm, margin: 0 }}>
                  curl -H "Authorization: Bearer sk_live_xxx..."
                  <br />
                  &nbsp;&nbsp;https://api.example.com/v1/bots
                </p>
              </div>
            </div>
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <Zap size={WEB_ICON.md} color="#F59E0B" />
                <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  Rate Limits
                </span>
              </div>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {[
                  { plan: 'Free', limit: '100 req/min', color: c.text3 },
                  { plan: 'Pro', limit: '1,000 req/min', color: '#3B82F6' },
                  { plan: 'Enterprise', limit: '10,000 req/min', color: '#10B981' },
                ].map((p) => (
                  <div
                    key={p.plan}
                    className="flex justify-between"
                    style={{ background: c.surface2, borderRadius: 10, padding: '12px 14px' }}
                  >
                    <span style={{ color: p.color, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                      {p.plan}
                    </span>
                    <span
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.sm,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {p.limit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Examples tab */}
        {activeTab === 'examples' && (
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: '20px 24px',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div className="flex items-center gap-2">
                <Code size={WEB_ICON.md} color={c.primary} />
                <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  Tạo DCA Bot — JavaScript
                </span>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-2"
                style={{
                  height: WEB_BUTTON.sm,
                  padding: '0 14px',
                  borderRadius: 8,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  cursor: 'pointer',
                  color: c.text2,
                }}
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <pre
              style={{
                background: '#1a1a2e',
                borderRadius: 12,
                padding: '20px 24px',
                color: '#e0e0e0',
                fontSize: WEB_FONT.sm,
                lineHeight: 1.7,
                overflow: 'auto',
                margin: 0,
              }}
            >
              {CODE_EXAMPLE}
            </pre>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
