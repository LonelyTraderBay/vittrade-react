/**
 * P2PDisputeResolutionPage — /p2p/disputes/:id/resolution
 * HIGH: View mediator decision & appeal
 */

import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { CheckCircle, AlertTriangle, MessageCircle, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtVnd } from '../../data/formatNumber';
import { toast } from 'sonner';

const RESOLUTION = {
  decision: 'in_favor_of_buyer',
  amount: 24000000,
  reason: 'Seller không release sau khi buyer đã thanh toán. Evidence cho thấy buyer đã chuyển đúng số tiền.',
  mediator: 'Support Team #A5',
  decidedAt: '2026-03-05 16:00',
  appealDeadline: '2026-03-07 16:00',
};

export function P2PDisputeResolutionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const isFavorOfBuyer = RESOLUTION.decision === 'in_favor_of_buyer';

  return (
    <PageLayout>
      <Header title="Kết quả giải quyết" subtitle="Tranh chấp · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: isFavorOfBuyer ? hexToRgba('#10B981', 10) : hexToRgba('#EF4444', 10) }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: isFavorOfBuyer ? '#10B981' : '#EF4444' }}>
              {isFavorOfBuyer ? <CheckCircle size={24} color="#FFFFFF" /> : <AlertTriangle size={24} color="#FFFFFF" />}
            </div>
            <div className="flex-1">
              <h2 style={{ color: isFavorOfBuyer ? '#10B981' : '#EF4444', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                Quyết định: {isFavorOfBuyer ? 'Bên mua thắng' : 'Bên bán thắng'}
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Dispute #{id}</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Chi tiết quyết định</h4>
          <div className="flex flex-col gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Số tiền hoàn trả</p>
              <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{fmtVnd(RESOLUTION.amount)}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Lý do</p>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>{RESOLUTION.reason}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Mediator</p>
              <p style={{ color: c.text1, fontSize: φ.xs }}>{RESOLUTION.mediator}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Quyết định lúc</p>
              <p style={{ color: c.text1, fontSize: φ.xs }}>{RESOLUTION.decidedAt}</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
          <div className="flex items-start gap-2">
            <MessageCircle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
            <div>
              <h4 style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>Quyền kháng cáo</h4>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                Bạn có thể kháng cáo quyết định này trước {RESOLUTION.appealDeadline}
              </p>
              <button
                onClick={() => { hapticSuccess(); toast.success('Đã mở form kháng cáo'); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: '#F59E0B', color: '#FFFFFF' }}
              >
                Kháng cáo
              </button>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        <CTAButton onClick={() => navigate(`${prefix}/p2p/disputes`)}>
          Quay về danh sách tranh chấp
        </CTAButton>
      </div>
    </PageLayout>
  );
}