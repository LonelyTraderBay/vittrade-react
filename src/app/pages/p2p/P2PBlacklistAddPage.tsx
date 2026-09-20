import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  UserX, Ban, AlertTriangle, Clock, MessageSquare, Info,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { InputField } from '../../components/ui/InputField';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../utils/golden';
import type { P2PBlacklistEntry } from '../../data/mockData';

const REASON_LABELS: Record<P2PBlacklistEntry['reason'], string> = {
  scam: 'Lừa đảo', unresponsive: 'Không phản hồi', fake_payment: 'Thanh toán giả',
  harassment: 'Quấy rối', other: 'Lý do khác',
};
const REASON_COLORS: Record<P2PBlacklistEntry['reason'], string> = {
  scam: '#EF4444', unresponsive: '#F59E0B', fake_payment: '#EF4444',
  harassment: '#8B5CF6', other: '#6B7280',
};
const REASON_ICONS: Record<P2PBlacklistEntry['reason'], React.ElementType> = {
  scam: AlertTriangle, unresponsive: Clock, fake_payment: Ban,
  harassment: MessageSquare, other: Info,
};

export function P2PBlacklistAddPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();

  const [username, setUsername] = useState('');
  const [reason, setReason] = useState<P2PBlacklistEntry['reason']>('scam');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim()) return;
    setIsSubmitting(true);
    hapticSuccess();
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    navigate(`${prefix}/p2p/blacklist`, { replace: true });
  };

  return (
    <PageLayout>
      <Header title="Thêm vào blacklist" subtitle="An toàn · P2P" back />

        {/* Icon Hero */}
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)' }}>
            <UserX size={28} color="#EF4444" />
          </div>
          <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>Chặn người dùng</p>
          <p style={{ color: c.text3, fontSize: 11, textAlign: 'center', maxWidth: 280 }}>
            Người dùng bị chặn sẽ không thể giao dịch P2P với bạn
          </p>
        </div>

        {/* Username */}
        <div>
          <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Tên người dùng *</p>
          <InputField
            placeholder="Nhập username..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ fontSize: 14 }}
          />
        </div>

        {/* Reason */}
        <div>
          <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Lý do chặn *</p>
          <div className="flex flex-col gap-2">
            {(Object.keys(REASON_LABELS) as P2PBlacklistEntry['reason'][]).map(r => {
              const color = REASON_COLORS[r];
              const ReasonIcon = REASON_ICONS[r];
              const selected = reason === r;
              return (
                <button
                  key={r}
                  onClick={() => { setReason(r); hapticSelection(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                  style={{
                    background: selected ? color + '0C' : c.surface2,
                    border: `1.5px solid ${selected ? color + '40' : c.borderSolid}`,
                  }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: color + '14' }}>
                    <ReasonIcon size={14} color={color} />
                  </div>
                  <span style={{ color: selected ? color : c.text2, fontSize: 13, fontWeight: selected ? 700 : 500 }}>
                    {REASON_LABELS[r]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div>
          <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Ghi chú (tùy chọn)</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Mô tả chi tiết lý do chặn..."
            rows={4}
            className="w-full rounded-2xl px-4 py-3"
            style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, color: c.text1, fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.6 }}
          />
        </div>

        {/* Warning */}
        <TrCard className="p-3" accentBorder="rgba(245,158,11,0.2)">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: '#F59E0B', fontSize: 11, lineHeight: 1.6 }}>
              Người bị chặn sẽ không thể giao dịch với bạn, gửi tin nhắn, hoặc xem quảng cáo của bạn. Bạn có thể bỏ chặn bất kỳ lúc nào.
            </p>
          </div>
        </TrCard>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <CTAButton onClick={handleSubmit} disabled={!username.trim()} loading={isSubmitting} variant="danger">
          <div className="flex items-center gap-2">
            <Ban size={16} />
            Chặn người dùng
          </div>
        </CTAButton>
        <div style={{ height: 16 }} />
    </PageLayout>
  );
}