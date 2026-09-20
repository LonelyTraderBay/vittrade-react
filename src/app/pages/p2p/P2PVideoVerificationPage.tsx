/**
 * P2PVideoVerificationPage — /p2p/kyc/video
 * CRITICAL: Video KYC for Tier 3+, live video call with agent
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Video, Calendar, Clock, CheckCircle, Info, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { toast } from 'sonner';

const TIME_SLOTS = [
  { id: '1', time: '09:00 - 09:30', date: '2026-03-06', available: true },
  { id: '2', time: '10:00 - 10:30', date: '2026-03-06', available: true },
  { id: '3', time: '14:00 - 14:30', date: '2026-03-06', available: false },
  { id: '4', time: '15:00 - 15:30', date: '2026-03-07', available: true },
];

export function P2PVideoVerificationPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleBook = () => {
    if (!selectedSlot) return;
    hapticSuccess();
    toast.success('Đã đặt lịch video KYC');
    navigate(`${prefix}/p2p/kyc/status`);
  };

  return (
    <PageLayout>
      <Header title="Video Verification" subtitle="KYC · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 8) }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#8B5CF6' }}>
              <Video size={24} color="#FFFFFF" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                Video KYC Call
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                Gọi video với agent để xác minh danh tính. Yêu cầu cho Tier 3.
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <Info size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
            <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Chuẩn bị</h4>
          </div>
          <div className="flex flex-col gap-2">
            {['CMND/CCCD gốc', 'Môi trường đủ sáng', 'Camera và mic hoạt động', 'Thời gian 10-15 phút'].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={12} color="#10B981" className="shrink-0 mt-1" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Chọn khung giờ</h3>
        <div className="flex flex-col gap-3">
          {TIME_SLOTS.map(slot => (
            <button
              key={slot.id}
              onClick={() => { hapticSelection(); setSelectedSlot(slot.id); }}
              disabled={!slot.available}
              className="p-4 rounded-xl text-left"
              style={{
                background: selectedSlot === slot.id ? hexToRgba('#8B5CF6', 12) : c.surface1,
                border: `1px solid ${selectedSlot === slot.id ? '#8B5CF6' : c.borderSolid}`,
                opacity: slot.available ? 1 : 0.5,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} color={selectedSlot === slot.id ? '#8B5CF6' : c.text3} />
                <p style={{ color: selectedSlot === slot.id ? '#8B5CF6' : c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  {slot.date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} color={c.text3} />
                <p style={{ color: c.text2, fontSize: 11 }}>{slot.time}</p>
                {!slot.available && (
                  <span className="ml-auto px-2 py-0.5 rounded-md text-xs" style={{ background: c.surface2, color: c.text3 }}>
                    Hết chỗ
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5">
        <CTAButton label="Đặt lịch" onClick={handleBook} disabled={!selectedSlot} icon={ChevronRight} />
      </div>
    </PageLayout>
  );
}