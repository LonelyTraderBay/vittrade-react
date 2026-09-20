/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadReceiptPage — Subscription Confirmation Receipt
 * ══════════════════════════════════════════════════════════════
 *  Pattern A — Standard Detail Page
 *  Shows after successful subscription with full receipt details
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtAmount } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  CheckCircle, Clock, Copy, Share2, Download, ChevronRight,
  AlertCircle, Briefcase,
} from 'lucide-react';
import { CopyButton, ErrorState, ShareReceiptCard } from './LaunchpadComponents';
import { SUB_STATUS_LABELS, type Subscription } from './launchpadData';

export function LaunchpadReceiptPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const c = useThemeColors();

  const sub = (location.state as any)?.subscription as Subscription | undefined;

  if (!sub) {
    return (
      <PageLayout>
        <Header title="Biên lai" back />
        <PageContent>
          <ErrorState />
        </PageContent>
      </PageLayout>
    );
  }

  const statusInfo = SUB_STATUS_LABELS[sub.status] || SUB_STATUS_LABELS.pending;

  return (
    <PageLayout>
      <Header title="Biên lai đăng ký" back />

      <PageContent gap="default">
        {/* Success hero */}
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '2px solid rgba(16,185,129,0.3)',
            }}>
            <CheckCircle size={32} color="#10B981" />
          </div>
          <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
            Đăng ký thành công!
          </h2>
          <p style={{ color: c.text2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
            Đơn đăng ký của bạn đã được ghi nhận. Token sẽ được phân bổ sau khi kết thúc.
          </p>
        </div>

        {/* Project card */}
        <TrCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0"
              style={{
                background: sub.projectLogoColor + '22',
                border: `2px solid ${sub.projectLogoColor}44`,
                color: sub.projectLogoColor,
              }}>
              {sub.projectLogo}
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{sub.projectName}</p>
              <p style={{ color: c.text2, fontSize: 13 }}>${sub.projectSymbol}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
              {statusInfo.label}
            </span>
          </div>
        </TrCard>

        {/* Receipt details */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Chi tiết đơn đăng ký</p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Mã đăng ký', value: sub.id, mono: true },
              { label: 'Thời gian', value: sub.timestamp },
              { label: 'Số tiền', value: `${fmtAmount(sub.amount, 2)} USDT`, mono: true, highlight: true },
              { label: 'Dự kiến nhận', value: `${fmtAmount(sub.tokensExpected, 0)} ${sub.projectSymbol}`, mono: true },
              { label: 'Trạng thái', value: statusInfo.label, color: statusInfo.color },
              { label: 'Mở khóa tiếp theo', value: sub.nextUnlockDate },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-1.5"
                style={{ borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text3, fontSize: 12 }}>{row.label}</span>
                <span style={{
                  color: (row as any).color || ((row as any).highlight ? c.text1 : c.text2),
                  fontSize: 12,
                  fontWeight: (row as any).highlight ? 700 : 500,
                  fontFamily: (row as any).mono ? 'monospace' : 'inherit',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Tx hash */}
          <div className="flex justify-between items-center mt-3">
            <span style={{ color: c.text3, fontSize: 12 }}>Tx Hash</span>
            <CopyButton text={sub.txHash} />
          </div>
        </TrCard>

        {/* What's next */}
        <TrCard variant="inner" className="p-4">
          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            <Clock size={13} className="inline mr-1.5" color="#3B82F6" />
            Tiếp theo là gì?
          </p>
          <div className="flex flex-col gap-2">
            {[
              'Đơn đăng ký đã được ghi nhận thành công.',
              'Token sẽ được phân bổ theo tỷ lệ sau khi kết thúc vòng mở bán.',
              'Phần USDT không được phân bổ (nếu có) sẽ được hoàn trả tự động.',
              'Token mở khóa theo lịch vesting — kiểm tra tab Portfolio để theo dõi.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 700, width: 16, shrinkX: 0 }}>
                  {i + 1}.
                </span>
                <span style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-1">
          <AlertCircle size={13} color={c.text3} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
            Phân bổ thực tế có thể khác dự kiến nếu tổng đăng ký vượt hard cap.
            Hiệu suất quá khứ không đảm bảo kết quả tương lai.
          </p>
        </div>

        {/* Phase 3: Share card */}
        <ShareReceiptCard sub={sub} />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <CTAButton onClick={() => navigate(`${prefix}/launchpad/portfolio`)}>
            <Briefcase size={16} />
            Xem portfolio
          </CTAButton>
          <button onClick={() => navigate(`${prefix}/launchpad`)}
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
            style={{
              background: c.surface2, color: c.text2,
              border: `1px solid ${c.borderSolid}`,
              fontSize: 14, fontWeight: 600, borderRadius: 14,
            }}>
            Quay lại Launchpad
          </button>
        </div>

        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}