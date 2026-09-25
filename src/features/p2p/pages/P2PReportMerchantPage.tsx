import {
  AlertTriangle,
  Ban,
  DollarSign,
  Eye,
  Flag,
  MessageSquare,
  Send,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { CTAButton } from '@/shared/ui/CTAButton';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useP2PMerchantProfileQuery,
  useP2PMerchantReportMutation,
} from '../model/p2p-trust-queries';
import type { P2PReportReason } from '../model/p2p-types';

const reasons: Array<{
  id: P2PReportReason;
  label: string;
  description: string;
  color: string;
  icon: typeof Flag;
}> = [
  {
    id: 'scam',
    label: 'Lừa đảo / Gian lận',
    description: 'Cố gắng chiếm đoạt tài sản hoặc lừa đảo',
    color: '#EF4444',
    icon: AlertTriangle,
  },
  {
    id: 'fake_payment',
    label: 'Thanh toán giả',
    description: 'Biên lai giả hoặc thanh toán không hợp lệ',
    color: '#EF4444',
    icon: Ban,
  },
  {
    id: 'harassment',
    label: 'Quấy rối / Đe dọa',
    description: 'Ngôn ngữ xúc phạm hoặc đe dọa',
    color: '#8B5CF6',
    icon: MessageSquare,
  },
  {
    id: 'price_manipulation',
    label: 'Thao túng giá',
    description: 'Cố tình đặt giá bất hợp lý',
    color: '#F59E0B',
    icon: DollarSign,
  },
  {
    id: 'identity',
    label: 'Giả mạo danh tính',
    description: 'Sử dụng thông tin hoặc tài khoản giả',
    color: '#3B82F6',
    icon: Eye,
  },
  {
    id: 'other',
    label: 'Lý do khác',
    description: 'Hành vi vi phạm quy định khác',
    color: '#6B7280',
    icon: Flag,
  },
];

export function P2PReportMerchantPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { merchantId } = useParams<{ merchantId: string }>();
  const { hasPermission } = useAuth();
  const profileQuery = useP2PMerchantProfileQuery(merchantId);
  const reportMutation = useP2PMerchantReportMutation();
  const canReport = hasPermission('p2p:write') || hasPermission('p2p:report');
  const [reason, setReason] = useState<P2PReportReason | null>(null);
  const [detail, setDetail] = useState('');

  if (profileQuery.isPending)
    return (
      <PageLayout>
        <Header title="Báo cáo Merchant" subtitle="An toàn · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải thông tin merchant…</p>
        </PageContent>
      </PageLayout>
    );
  if (profileQuery.isError || !profileQuery.data)
    return (
      <PageLayout>
        <Header title="Báo cáo Merchant" subtitle="An toàn · P2P" back />
        <ErrorState
          title="Không thể tải thông tin merchant"
          actionLabel="Thử lại"
          onAction={() => void profileQuery.refetch()}
        />
      </PageLayout>
    );

  const submit = async () => {
    if (!canReport || !reason || !merchantId || reportMutation.isPending) return;
    try {
      await reportMutation.mutateAsync({
        request: { merchantId, reason, detail: detail.trim() || undefined },
        idempotencyKey: `p2p-report-${merchantId}-${crypto.randomUUID()}`,
      });
      navigate(-1);
    } catch {
      // React Query owns the error state rendered below.
    }
  };
  const merchant = profileQuery.data.merchant;

  return (
    <PageLayout>
      <Header title="Báo cáo Merchant" subtitle="An toàn · P2P" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
            >
              <span style={{ color: '#fff', fontWeight: 700 }}>{merchant.name.charAt(0)}</span>
            </div>
            <div>
              <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>{merchant.name}</p>
              <p style={{ color: colors.text3, fontSize: 10 }}>ID: {merchant.id}</p>
            </div>
          </div>
        </TrCard>
        <div>
          <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>Chọn lý do báo cáo</p>
          <p style={{ color: colors.text3, fontSize: 11, marginTop: 4 }}>
            Đội ngũ compliance sẽ xem xét và phản hồi theo quy trình.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {reasons.map((item) => {
            const selected = reason === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setReason(item.id)}
                aria-label={`Report reason: ${item.id}`}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
                style={{
                  background: selected ? `${item.color}12` : colors.surface2,
                  border: `1px solid ${selected ? `${item.color}70` : colors.borderSolid}`,
                }}
              >
                <item.icon size={17} color={item.color} />
                <div className="flex-1">
                  <p
                    style={{
                      color: selected ? item.color : colors.text1,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {item.label}
                  </p>
                  <p style={{ color: colors.text3, fontSize: 10, marginTop: 2 }}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {reason && (
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            maxLength={4000}
            rows={4}
            placeholder="Mô tả chi tiết (tùy chọn)…"
            aria-label="Report details"
            className="w-full rounded-2xl px-4 py-3 resize-none outline-none"
            style={{
              background: colors.surface2,
              border: `1px solid ${colors.borderSolid}`,
              color: colors.text1,
              fontSize: 12,
            }}
          />
        )}
        <TrCard className="p-3">
          <div className="flex items-start gap-2">
            <Shield size={13} color="#3B82F6" />
            <p style={{ color: colors.text3, fontSize: 10, lineHeight: 1.6 }}>
              Chỉ gửi thông tin chính xác. Báo cáo sẽ tạo audit event cho đội ngũ compliance.
            </p>
          </div>
        </TrCard>
        {reportMutation.isError && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 11 }}>
            Không thể gửi báo cáo. Vui lòng kiểm tra và thử lại.
          </p>
        )}
        {!canReport && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 11 }}>
            P2P report permission is required to submit a merchant report.
          </p>
        )}
        <CTAButton
          onClick={() => void submit()}
          disabled={!canReport || !reason}
          loading={reportMutation.isPending}
          variant="danger"
          aria-label="Submit P2P merchant report"
        >
          <span className="flex items-center justify-center gap-2">
            <Send size={15} /> Gửi báo cáo
          </span>
        </CTAButton>
      </PageContent>
    </PageLayout>
  );
}
