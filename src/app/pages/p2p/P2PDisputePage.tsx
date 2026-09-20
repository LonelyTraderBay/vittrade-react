/**
 * P2PDisputePage — /p2p/orders/:id/dispute
 * HIGH: File dispute with evidence upload
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertTriangle, Upload, MessageCircle, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { InputField } from '../../components/ui/InputField';
import { toast } from 'sonner';

const REASONS = [
  'Seller không release sau khi nhận tiền',
  'Buyer không thanh toán',
  'Thông tin thanh toán sai',
  'Số tiền không khớp',
  'Khác (ghi rõ)',
];

export function P2PDisputePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleSubmit = () => {
    if (!reason || !description) {
      toast.error('Vui lòng chọn lý do và mô tả chi tiết');
      return;
    }
    hapticSuccess();
    toast.success('Đã gửi tranh chấp. Support sẽ liên hệ trong 24h');
    navigate(`${prefix}/p2p/dispute/detail/${id}`);
  };

  return (
    <PageLayout>
      <Header title="Mở tranh chấp" subtitle="Tranh chấp · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#EF4444', 10) }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba('#EF4444', 20) }}>
              <AlertTriangle size={24} color="#EF4444" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#EF4444', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                Mở tranh chấp
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                Order #{id}. Vui lòng cung cấp bằng chứng đầy đủ.
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Lý do tranh chấp</h3>
        <div className="flex flex-col gap-2">
          {REASONS.map(r => (
            <button
              key={r}
              onClick={() => { hapticSelection(); setReason(r); }}
              className="p-3 rounded-lg text-left"
              style={{
                background: reason === r ? hexToRgba('#3B82F6', 12) : c.surface1,
                border: `1px solid ${reason === r ? '#3B82F6' : c.borderSolid}`,
              }}
            >
              <p style={{ color: reason === r ? '#3B82F6' : c.text1, fontSize: φ.xs, fontWeight: 600 }}>{r}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mb-6">
        <InputField
          label="Mô tả chi tiết"
          placeholder="Mô tả vấn đề, bao gồm: thời gian, số tiền, bằng chứng..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={6}
        />
      </div>

      <div className="px-5 mb-6">
        <button className="w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center gap-2" style={{ borderColor: c.borderSolid, background: c.surface1 }}>
          <Upload size={24} color={c.text3} />
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Upload bằng chứng</p>
          <p style={{ color: c.text3, fontSize: 10 }}>Screenshots, chat logs, payment receipts</p>
        </button>
      </div>

      <div className="px-5">
        <CTAButton onClick={handleSubmit} disabled={!reason || !description}>
          Gửi tranh chấp
        </CTAButton>
      </div>
    </PageLayout>
  );
}