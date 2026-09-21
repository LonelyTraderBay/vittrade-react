/**
 * ══════════════════════════════════════════════════════════
 *  WebCopyTradingPages — Simplified Web Versions
 * ══════════════════════════════════════════════════════════
 *
 *  Stub pages for Copy Trading flows on desktop.
 *  These are simplified versions that maintain routing structure.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronRight, CheckCircle, Settings, Activity } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON } from '../../components/layout/webConstants';
import { COPY_TRADERS } from '../../data/mockData';

/* ═══════════════════════════════════════════
   WebCopyConfigurationPage
   ═══════════════════════════════════════════ */

export function WebCopyConfigurationPage() {
  const { providerId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();
  const [capital, setCapital] = useState(1000);
  const [stopLoss, setStopLoss] = useState(10);

  const provider = COPY_TRADERS.find((t) => t.id === providerId);

  return (
    <PageLayout variant="flush">
      <Header title="Cấu hình Copy" back />

      <div style={{ padding: '24px 0 0', flex: 1 }}>
        <div
          className="rounded-2xl p-8 mb-8"
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
          }}
        >
          <h3 style={{ fontSize: WEB_FONT.lg, fontWeight: 700, color: c.text1, marginBottom: 24 }}>
            Cấu hình chiến lược copy
          </h3>

          <div className="space-y-6">
            <div>
              <label
                style={{ color: c.text2, fontSize: WEB_FONT.sm, display: 'block', marginBottom: 8 }}
              >
                Số tiền copy (USDT)
              </label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  color: c.text1,
                  fontSize: WEB_FONT.md,
                }}
              />
            </div>

            <div>
              <label
                style={{ color: c.text2, fontSize: WEB_FONT.sm, display: 'block', marginBottom: 8 }}
              >
                Stop Loss (%)
              </label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  color: c.text1,
                  fontSize: WEB_FONT.md,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <StickyFooter>
        <button
          onClick={() => navigate(`/w/trade/copy/provider/${providerId}/confirmation`)}
          className="w-full rounded-2xl flex items-center justify-center gap-3"
          style={{
            background: c.primary,
            color: '#fff',
            height: 48,
            fontWeight: 600,
            fontSize: WEB_FONT.lg,
          }}
        >
          <span>Xác nhận cấu hình</span>
          <ChevronRight size={WEB_ICON.lg} />
        </button>
      </StickyFooter>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════
   WebCopyConfirmationPage
   ═══════════════════════════════════════════ */

export function WebCopyConfirmationPage() {
  const { providerId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();

  const provider = COPY_TRADERS.find((t) => t.id === providerId);

  return (
    <PageLayout variant="flush">
      <Header title="Xác nhận Copy" back />

      <div style={{ padding: '24px 0 0', flex: 1 }}>
        <div
          className="rounded-2xl p-8 mb-8"
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: c.primary }}
            >
              <CheckCircle size={WEB_ICON.xl} color="#fff" />
            </div>
            <div>
              <h3
                style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1, marginBottom: 8 }}
              >
                Copy thành công
              </h3>
              <p style={{ fontSize: WEB_FONT.sm, color: c.text2 }}>
                Bạn sắp sao chép trader: {provider?.name}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Số tiền copy</span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                1,000 USDT
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Stop Loss</span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>10%</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Performance Fee</span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>10%</span>
            </div>
          </div>
        </div>
      </div>

      <StickyFooter>
        <button
          onClick={() => {
            // Simulate success and navigate to active copies
            navigate('/w/trade/copy/active');
          }}
          className="w-full rounded-2xl flex items-center justify-center gap-3"
          style={{
            background: c.primary,
            color: '#fff',
            height: 48,
            fontWeight: 600,
            fontSize: WEB_FONT.lg,
          }}
        >
          <span>Xem chi tiết</span>
          <ChevronRight size={WEB_ICON.lg} />
        </button>
      </StickyFooter>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════
   WebActiveCopiesPage
   ═══════════════════════════════════════════ */

export function WebActiveCopiesPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  return (
    <PageLayout>
      <Header title="Copy đang hoạt động" back />

      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
          }}
        >
          <Activity size={WEB_ICON.xl} color={c.text3} className="mx-auto mb-4" />
          <h3 style={{ fontSize: WEB_FONT.lg, fontWeight: 700, color: c.text1, marginBottom: 8 }}>
            Chưa có hoạt động
          </h3>
          <p style={{ fontSize: WEB_FONT.sm, color: c.text2, marginBottom: 24 }}>
            Bắt đầu copy trader để theo dõi hiệu suất tại đây
          </p>
          <button
            onClick={() => navigate('/w/trade/copy')}
            className="px-6 py-3 rounded-xl"
            style={{
              background: c.primary,
              color: '#fff',
              fontSize: WEB_FONT.md,
              fontWeight: 600,
            }}
          >
            Khám phá Traders
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════
   WebCopyPerformancePage
   ═══════════════════════════════════════════ */

export function WebCopyPerformancePage() {
  const { copyId } = useParams();
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Hiệu suất Copy" back />

      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="rounded-2xl p-8"
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
          }}
        >
          <h3 style={{ fontSize: WEB_FONT.lg, fontWeight: 700, color: c.text1, marginBottom: 24 }}>
            Thống kê hiệu suất
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p style={{ color: '#10B981', fontSize: WEB_FONT['2xl'], fontWeight: 700 }}>+12.5%</p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.sm }}>P/L</p>
            </div>
            <div className="text-center">
              <p style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700 }}>45</p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Trades</p>
            </div>
            <div className="text-center">
              <p style={{ color: '#10B981', fontSize: WEB_FONT['2xl'], fontWeight: 700 }}>65%</p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Win Rate</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════
   WebCopyEducationPage
   ═══════════════════════════════════════════ */

export function WebCopyEducationPage() {
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Học Copy Trading" back />

      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="rounded-2xl p-8"
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
          }}
        >
          <h3 style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1, marginBottom: 24 }}>
            Copy Trading là gì?
          </h3>
          <p style={{ fontSize: WEB_FONT.md, color: c.text2, lineHeight: 1.6, marginBottom: 24 }}>
            Copy Trading cho phép bạn tự động sao chép các lệnh giao dịch của các trader có kinh
            nghiệm.
          </p>
          <h4 style={{ fontSize: WEB_FONT.lg, fontWeight: 700, color: c.text1, marginBottom: 16 }}>
            Rủi ro chính
          </h4>
          <ul style={{ fontSize: WEB_FONT.md, color: c.text2, lineHeight: 1.8, paddingLeft: 24 }}>
            <li>Tiết kiệm thời gian phân tích thị trường</li>
            <li>Học hỏi từ trader có kinh nghiệm</li>
            <li>Đa dạng hóa chiến lược đầu tư</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
