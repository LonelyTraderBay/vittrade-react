/**
 * P2PLargeTransactionJustificationPage
 * /p2p/compliance/large-transaction
 * CRITICAL: Justification for large transactions (>100M VND)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AlertCircle, FileText, ChevronRight } from 'lucide-react';
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
import { fmtVnd } from '../../data/formatNumber';

const PURPOSES = [
  'Mua crypto để đầu tư dài hạn',
  'Trading ngắn hạn',
  'Thanh toán quốc tế',
  'Chuyển đổi tài sản',
  'Khác (ghi rõ)',
];

export function P2PLargeTransactionJustificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();

  const amount = parseFloat(searchParams.get('amount') || '100000000');
  
  const [purpose, setPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [details, setDetails] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleSubmit = () => {
    const finalPurpose = purpose === 'Khác (ghi rõ)' ? customPurpose : purpose;
    if (!finalPurpose || !details) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    hapticSuccess();
    toast.success('Đã gửi giải trình. Đang xem xét...');
    navigate(`${prefix}/p2p/orders`);
  };

  return (
    <PageLayout>
      <Header title="Large Transaction" subtitle="Giao dịch · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba('#F59E0B', 20) }}>
              <AlertCircle size={24} color="#F59E0B" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                Giao dịch lớn: {fmtVnd(amount)}
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                Cần giải trình mục đích theo quy định AML/CTF
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Mục đích giao dịch</h3>
        <div className="flex flex-col gap-2">
          {PURPOSES.map(p => (
            <button
              key={p}
              onClick={() => { hapticSelection(); setPurpose(p); }}
              className="p-3 rounded-lg text-left"
              style={{
                background: purpose === p ? hexToRgba('#3B82F6', 12) : c.surface1,
                border: `1px solid ${purpose === p ? '#3B82F6' : c.borderSolid}`,
              }}
            >
              <p style={{ color: purpose === p ? '#3B82F6' : c.text1, fontSize: φ.xs, fontWeight: 600 }}>{p}</p>
            </button>
          ))}
        </div>
      </div>

      {purpose === 'Khác (ghi rõ)' && (
        <div className="px-5 mb-6">
          <InputField
            label="Mục đích cụ thể"
            placeholder="Nhập mục đích sử dụng"
            value={customPurpose}
            onChange={(e) => setCustomPurpose(e.target.value)}
          />
        </div>
      )}

      <div className="px-5 mb-6">
        <InputField
          label="Giải trình chi tiết"
          placeholder="VD: Mua BTC để nắm giữ dài hạn, dự kiến hold 1-2 năm..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          multiline
          rows={5}
        />
      </div>

      <div className="px-5">
        <CTAButton
          label="Gửi giải trình"
          onClick={handleSubmit}
          disabled={!purpose || (purpose === 'Khác (ghi rõ)' && !customPurpose) || !details}
          icon={ChevronRight}
        />
      </div>
    </PageLayout>
  );
}