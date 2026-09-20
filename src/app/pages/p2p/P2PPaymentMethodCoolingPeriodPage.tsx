/**
 * P2PPaymentMethodCoolingPeriodPage
 * /p2p/payment-methods/:id/cooling
 * CRITICAL: Cooling period explanation & countdown
 */

import React, { useEffect, useRef } from 'react';
import { Clock, Info, Calendar, Shield } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';

const COOLING_DATA = {
  addedAt: '2026-03-05 10:00',
  availableAt: '2026-03-12 10:00',
  hoursRemaining: 168,
  reason: 'New payment method',
};

export function P2PPaymentMethodCoolingPeriodPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const daysLeft = Math.floor(COOLING_DATA.hoursRemaining / 24);
  const hoursLeft = COOLING_DATA.hoursRemaining % 24;

  return (
    <PageLayout>
      <Header title="Cooling Period" subtitle="Thanh toán · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba('#F59E0B', 20) }}>
              <Clock size={24} color="#F59E0B" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                Đang cooling period
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                Phương thức thanh toán mới cần chờ 7 ngày
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl text-center" style={{ background: hexToRgba('#F59E0B', 15) }}>
            <p style={{ color: '#F59E0B', fontSize: φ.xl, fontWeight: 700, marginBottom: 4 }}>
              {daysLeft}d {hoursLeft}h
            </p>
            <p style={{ color: c.text2, fontSize: 11 }}>Còn lại</p>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Thêm lúc</p>
              <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{COOLING_DATA.addedAt}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Sẵn sàng lúc</p>
              <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{COOLING_DATA.availableAt}</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <Info size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
            <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Tại sao có cooling period?</h4>
          </div>
          <div className="flex flex-col gap-2">
            {[
              'Bảo vệ khỏi fraud và scam',
              'Thời gian xác minh ownership',
              'Tuân thủ quy định AML/CTF',
              'Giảm thiểu dispute',
            ].map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <Shield size={12} color="#10B981" className="shrink-0 mt-1" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{reason}</p>
              </div>
            ))}
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <Calendar size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Trong thời gian chờ</p>
            <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
              Bạn vẫn có thể dùng các phương thức khác đã verify. Phương thức này sẽ tự động khả dụng sau 7 ngày.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}