import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  Flag, UserX, AlertTriangle, Users, ChevronRight,
  Shield, MessageSquare, Ban, DollarSign, Eye, Send,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { P2P_ADS, P2P_MERCHANTS } from '../../data/mockData';
import { φ } from '../../utils/golden';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';

const REPORT_REASONS = [
  { id: 'scam', label: 'Lừa đảo / Gian lận', icon: AlertTriangle, color: '#EF4444', desc: 'Cố gắng lừa đảo hoặc chiếm đoạt tài sản' },
  { id: 'fake_payment', label: 'Thanh toán giả', icon: Ban, color: '#EF4444', desc: 'Gửi biên lai giả hoặc thanh toán không hợp lệ' },
  { id: 'harassment', label: 'Quấy rối / Đe dọa', icon: MessageSquare, color: '#8B5CF6', desc: 'Ngôn ngữ xúc phạm, đe dọa trong giao tiếp' },
  { id: 'price_manipulation', label: 'Thao túng giá', icon: DollarSign, color: '#F59E0B', desc: 'Cố tình đặt giá bất hợp lý để thao túng' },
  { id: 'identity', label: 'Giả mạo danh tính', icon: Eye, color: '#3B82F6', desc: 'Sử dụng tài khoản người khác hoặc thông tin giả' },
  { id: 'other', label: 'Lý do khác', icon: Flag, color: '#6B7280', desc: 'Hành vi vi phạm quy định khác' },
] as const;

export function P2PReportMerchantPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const { merchantId } = useParams();

  const merchant = P2P_MERCHANTS.find(m => m.id === merchantId);
  const ad = P2P_ADS.find(a => a.merchantId === merchantId);
  const merchantName = merchant?.name || ad?.merchant || 'Người dùng';

  const [selectedReason, setSelectedReason] = useState('');
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);
    actionToast.success(TOAST.P2P.REPORT_SUBMITTED(merchantName), { haptic: 'success' });
    navigate(-1);
  };

  return (
    <PageLayout>
      <Header title="Báo cáo & Chặn" subtitle="An toàn · P2P" back />

      {/* Merchant Info */}
      <TrCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{merchantName.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>{merchantName}</p>
            <p style={{ color: c.text3, fontSize: 11 }}>ID: {merchantId}</p>
          </div>
        </div>
      </TrCard>

      {/* Quick Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => { navigate(`${prefix}/p2p/blacklist/add`); hapticSelection(); }}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <UserX size={18} color="#EF4444" />
          <div className="flex-1 text-left">
            <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>Chặn người dùng</p>
            <p style={{ color: c.text3, fontSize: 10 }}>Không thể giao dịch với bạn</p>
          </div>
          <ChevronRight size={14} color={c.text3} />
        </button>

        <button
          onClick={() => { navigate(`${prefix}/p2p/merchant/${merchantId}`); hapticSelection(); }}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
        >
          <Users size={18} color={c.text2} />
          <div className="flex-1 text-left">
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Xem profile Merchant</p>
            <p style={{ color: c.text3, fontSize: 10 }}>Đánh giá, lịch sử, thông tin chi tiết</p>
          </div>
          <ChevronRight size={14} color={c.text3} />
        </button>
      </div>

      {/* Report Reason Selection */}
      <div>
        <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginBottom: 4 }}>Báo cáo vi phạm</p>
        <p style={{ color: c.text3, fontSize: 11, marginBottom: 12 }}>
          Chọn lý do báo cáo. Đội ngũ VitTrade sẽ xem xét trong 24-48h.
        </p>

        <div className="flex flex-col gap-2">
          {REPORT_REASONS.map(reason => {
            const selected = selectedReason === reason.id;
            return (
              <button
                key={reason.id}
                onClick={() => { setSelectedReason(reason.id); hapticSelection(); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
                style={{
                  background: selected ? reason.color + '0C' : c.surface2,
                  border: `1.5px solid ${selected ? reason.color + '40' : c.borderSolid}`,
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: reason.color + '14' }}>
                  <reason.icon size={15} color={reason.color} />
                </div>
                <div className="flex-1">
                  <p style={{ color: selected ? reason.color : c.text1, fontSize: 13, fontWeight: 700 }}>
                    {reason.label}
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>{reason.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      {selectedReason && (
        <div>
          <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Chi tiết bổ sung (tùy chọn)</p>
          <textarea
            value={detail}
            onChange={e => setDetail(e.target.value)}
            placeholder="Mô tả chi tiết sự việc..."
            rows={4}
            className="w-full rounded-2xl px-4 py-3"
            style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, color: c.text1, fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.6 }}
          />
        </div>
      )}

      {/* Info */}
      <TrCard className="p-3">
        <div className="flex items-start gap-2">
          <Shield size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.6 }}>
            Báo cáo sẽ được đội ngũ VitTrade xem xét nghiêm túc. Báo cáo sai sự thật có thể ảnh hưởng đến tài khoản của bạn.
          </p>
        </div>
      </TrCard>

      <div className="flex-1" />

      <CTAButton onClick={handleSubmit} disabled={!selectedReason} loading={isSubmitting} variant="danger">
        <div className="flex items-center gap-2">
          <Send size={16} />
          Gửi báo cáo
        </div>
      </CTAButton>
      <div style={{ height: 16 }} />
    </PageLayout>
  );
}