import React from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  Shield, ShieldCheck, CheckCircle, Download, Share2,
  Award, Calendar, User, FileText, Info, Star,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtVnd } from '../../data/formatNumber';
import { φ, φSpace } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   P2P Insurance Certificate — Downloadable Proof of Coverage
   TIER 5.3 — Enterprise-level trust documentation
   ═══════════════════════════════════════════════════════════ */

const CERTIFICATE_DATA = {
  certId: 'CERT-PRO-2026-78400',
  holderName: 'Nguyễn Văn Minh',
  holderId: 'UID-8847291',
  tierName: 'Pro',
  coveragePct: 85,
  maxCoveragePerClaim: 100_000_000,
  maxCoveragePer30Days: 100_000_000,
  contributionRate: '0.1%',
  issueDate: '01/01/2026',
  validUntil: '31/12/2026',
  totalContributed: 238_200,
  totalTransactions: 128,
  claimWindowDays: 7,
  reviewSLA: '48 giờ',
  payoutSLA: '72 giờ',
  auditor: 'Deloitte Vietnam',
  lastAuditDate: '28/02/2026',
};

export function P2PInsuranceCertificatePage() {
  const c = useThemeColors();
  const { hapticSuccess, hapticSelection } = useHaptic();

  const handleDownload = () => {
    const certContent = `
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║              CHỨNG NHẬN BẢO HIỂM GIAO DỊCH P2P                   ║
║              P2P Trading Insurance Certificate                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────────┐
│ THÔNG TIN CHỨNG NHẬN                                              │
└───────────────────────────────────────────────────────────────────┘
  Mã chứng nhận:        ${CERTIFICATE_DATA.certId}
  Ngày cấp:             ${CERTIFICATE_DATA.issueDate}
  Hiệu lực đến:         ${CERTIFICATE_DATA.validUntil}

┌───────────────────────────────────────────────────────────────────┐
│ THÔNG TIN NGƯỜI ĐƯỢC BẢO HIỂM                                    │
└───────────────────────────────────────────────────────────────────┘
  Tên:                  ${CERTIFICATE_DATA.holderName}
  Mã người dùng:        ${CERTIFICATE_DATA.holderId}
  Tier:                 ${CERTIFICATE_DATA.tierName}

┌───────────────────────────────────────────────────────────────────┐
│ PHẠM VI BẢO HIỂM                                                 │
└───────────────────────────────────────────────────────────────────┘
  Tỷ lệ bảo hiểm:      ${CERTIFICATE_DATA.coveragePct}% giá trị giao dịch
  Hạn mức/claim:        ${fmtVnd(CERTIFICATE_DATA.maxCoveragePerClaim)} VND
  Hạn mức/30 ngày:      ${fmtVnd(CERTIFICATE_DATA.maxCoveragePer30Days)} VND
  Cửa sổ claim:         ${CERTIFICATE_DATA.claimWindowDays} ngày sau sự cố
  Phí đóng góp:         ${CERTIFICATE_DATA.contributionRate} mỗi giao dịch

┌───────────────────────────────────────────────────────────────────┐
│ CAM KẾT DỊCH VỤ (SLA)                                            │
└───────────────────────────────────────────────────────────────────┘
  Xem xét claim:        Trong ${CERTIFICATE_DATA.reviewSLA}
  Chi trả:              Trong ${CERTIFICATE_DATA.payoutSLA} sau khi duyệt
  Kiểm toán:            ${CERTIFICATE_DATA.auditor}
  Kiểm toán gần nhất:   ${CERTIFICATE_DATA.lastAuditDate}

┌───────────────────────────────────────────────────────────────────┐
│ LỊCH SỬ ĐÓNG GÓP                                                 │
└───────────────────────────────────────────────────────────────────┘
  Tổng đóng góp:        ${fmtVnd(CERTIFICATE_DATA.totalContributed)} VND
  Tổng giao dịch:       ${CERTIFICATE_DATA.totalTransactions}

┌───────────────────────────────────────────────────────────────────┐
│ PHẠM VI BẢO VỆ                                                   │
└───────────────────────────────────────────────────────────────────┘
  ✓ Gian lận (fraud) — merchant không giải phóng coin
  ✓ Chargeback — buyer hoàn tiền qua ngân hàng
  ✓ Lỗi hệ thống dispute — phân xử sai
  ✓ Các trường hợp khác — theo xem xét riêng

  ✗ KHÔNG BAO GỒM: biến động giá, lỗi nhập sai địa chỉ ví,
    giao dịch ngoài nền tảng, gian lận từ phía người claim

────────────────────────────────────────────────────────────────────
  Chứng nhận này xác nhận người dùng trên đang được bảo hiểm
  bởi Quỹ Bảo Hiểm P2P theo điều khoản và điều kiện hiện hành.
  
  Xuất ngày: ${new Date().toLocaleString('vi-VN')}
  Hệ thống P2P Insurance Fund
────────────────────────────────────────────────────────────────────
`.trim();

    const blob = new Blob([certContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `insurance-certificate-${CERTIFICATE_DATA.certId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    hapticSuccess();
    toast.success('Đã tải chứng nhận', { description: CERTIFICATE_DATA.certId });
  };

  const handleShare = () => {
    hapticSelection();
    if (navigator.share) {
      navigator.share({
        title: 'Chứng nhận Bảo hiểm P2P',
        text: `Chứng nhận bảo hiểm ${CERTIFICATE_DATA.certId} — Tier ${CERTIFICATE_DATA.tierName} (${CERTIFICATE_DATA.coveragePct}%)`,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`Chứng nhận bảo hiểm: ${CERTIFICATE_DATA.certId} — Tier ${CERTIFICATE_DATA.tierName}`);
      toast.success('Đã sao chép thông tin chứng nhận');
    }
  };

  return (
    <PageLayout>
      <Header title="Chứng nhận bảo hiểm" subtitle="Bảo hiểm · P2P" back />

      <div className="px-5 py-4 flex flex-col" style={{ gap: φSpace[5] }}>
        {/* ── Certificate Card ── */}
        <TrCard
          className="p-0 overflow-hidden"
          style={{ border: '2px solid rgba(59,130,246,0.3)' }}
        >
          {/* Header gradient */}
          <div
            className="px-5 py-5 text-center"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 50%, #3B82F6 100%)' }}
          >
            <div className="flex justify-center mb-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}
              >
                <ShieldCheck size={28} color="#fff" />
              </div>
            </div>
            <p style={{ color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, opacity: 0.8, marginBottom: 4 }}>
              CHỨNG NHẬN BẢO HIỂM
            </p>
            <p style={{ color: '#fff', fontSize: φ.base, fontWeight: 700 }}>
              Giao dịch P2P
            </p>
          </div>

          {/* Body */}
          <div className="p-5">
            {/* Cert ID */}
            <div className="text-center mb-4 pb-4" style={{ borderBottom: `1px dashed ${c.divider}` }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Mã chứng nhận</p>
              <p style={{
                color: '#3B82F6', fontSize: φ.base, fontWeight: 700,
                fontFamily: 'monospace', letterSpacing: 1,
              }}>
                {CERTIFICATE_DATA.certId}
              </p>
            </div>

            {/* Holder info */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={14} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Người được bảo hiểm</span>
                </div>
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  {CERTIFICATE_DATA.holderName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award size={14} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Tier</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star size={12} color="#3B82F6" />
                  <span style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700 }}>
                    {CERTIFICATE_DATA.tierName}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={14} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Mức bảo hiểm</span>
                </div>
                <span style={{ color: '#10B981', fontSize: φ.body, fontWeight: 700 }}>
                  {CERTIFICATE_DATA.coveragePct}%
                </span>
              </div>
            </div>

            {/* Coverage details */}
            <div className="p-3 rounded-xl mb-4" style={{ background: c.surface2 }}>
              <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 0.3 }}>
                PHẠM VI BẢO HIỂM
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Hạn mức / claim</span>
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtVnd(CERTIFICATE_DATA.maxCoveragePerClaim)} đ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Hạn mức / 30 ngày</span>
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtVnd(CERTIFICATE_DATA.maxCoveragePer30Days)} đ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Cửa sổ claim</span>
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                    {CERTIFICATE_DATA.claimWindowDays} ngày
                  </span>
                </div>
              </div>
            </div>

            {/* Validity */}
            <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <div className="flex items-center gap-2">
                <Calendar size={14} color={c.text3} />
                <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Hiệu lực</span>
              </div>
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                {CERTIFICATE_DATA.issueDate} — {CERTIFICATE_DATA.validUntil}
              </span>
            </div>

            {/* Coverage scope */}
            <div className="mb-4">
              <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 0.3 }}>
                CÁC TRƯỜNG HỢP ĐƯỢC BẢO VỆ
              </p>
              {[
                'Gian lận — merchant không giải phóng coin',
                'Chargeback — buyer hoàn tiền qua ngân hàng',
                'Lỗi hệ thống — dispute phân xử sai',
                'Trường hợp khác — xem xét riêng',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 py-1">
                  <CheckCircle size={12} color="#10B981" />
                  <span style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Audit info */}
            <div
              className="flex items-start gap-2 p-3 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.06)' }}
            >
              <ShieldCheck size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                  Kiểm toán bởi {CERTIFICATE_DATA.auditor}
                </p>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  Gần nhất: {CERTIFICATE_DATA.lastAuditDate}
                </p>
              </div>
            </div>
          </div>
        </TrCard>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <CTAButton onClick={handleDownload} variant="primary" className="flex-1">
            <Download size={16} color="#fff" />
            <span>Tải chứng nhận</span>
          </CTAButton>
          <button
            onClick={handleShare}
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
          >
            <Share2 size={18} color={c.text2} />
          </button>
        </div>

        {/* ── Disclosure ── */}
        <div
          className="flex items-start gap-2 p-3 rounded-xl"
          style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
        >
          <Info size={12} color={c.text3} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
            Chứng nhận này xác nhận quyền lợi bảo hiểm P2P của bạn theo điều khoản hiện hành.
            Mức bảo hiểm có thể thay đổi khi tier merchant thay đổi.
          </p>
        </div>

        <div style={{ height: 8 }} />
      </div>
    </PageLayout>
  );
}