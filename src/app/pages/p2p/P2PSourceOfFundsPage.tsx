/**
 * P2PSourceOfFundsPage — /p2p/compliance/source-of-funds
 * CRITICAL: Declare source of funds for compliance
 */

import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Briefcase, TrendingUp, Home, Gift, CheckCircle, ChevronRight } from 'lucide-react';
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
import { useNavigate } from 'react-router';

const FUND_SOURCES = [
  { id: 'salary', label: 'Lương/Thu nhập', icon: Briefcase },
  { id: 'business', label: 'Kinh doanh', icon: TrendingUp },
  { id: 'investment', label: 'Đầu tư', icon: DollarSign },
  { id: 'property', label: 'Bất động sản', icon: Home },
  { id: 'gift', label: 'Quà tặng/Thừa kế', icon: Gift },
];

export function P2PSourceOfFundsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleSubmit = () => {
    if (!selectedSource || !details) {
      toast.error('Vui lòng chọn nguồn tiền và nhập chi tiết');
      return;
    }
    hapticSuccess();
    toast.success('Đã gửi thông tin nguồn vốn');
    navigate(`${prefix}/p2p/kyc/status`);
  };

  return (
    <PageLayout>
      <Header title="Source of Funds" subtitle="Tuân thủ · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#3B82F6' }}>
              <DollarSign size={24} color="#FFFFFF" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                Khai báo nguồn vốn
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                Yêu cầu cho giao dịch lớn hoặc Tier 3. Thông tin được bảo mật.
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Nguồn tiền chính</h3>
        <div className="flex flex-col gap-3">
          {FUND_SOURCES.map(source => {
            const SourceIcon = source.icon;
            const isSelected = selectedSource === source.id;
            return (
              <button
                key={source.id}
                onClick={() => { hapticSelection(); setSelectedSource(source.id); }}
                className="p-4 rounded-xl text-left"
                style={{
                  background: isSelected ? hexToRgba('#3B82F6', 12) : c.surface1,
                  border: `1px solid ${isSelected ? '#3B82F6' : c.borderSolid}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: isSelected ? hexToRgba('#3B82F6', 20) : c.surface2 }}>
                    <SourceIcon size={18} color={isSelected ? '#3B82F6' : c.text3} />
                  </div>
                  <p style={{ color: isSelected ? '#3B82F6' : c.text1, fontSize: φ.sm, fontWeight: 700, flex: 1 }}>
                    {source.label}
                  </p>
                  {isSelected && <CheckCircle size={18} color="#3B82F6" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mb-6">
        <InputField
          label="Chi tiết bổ sung"
          placeholder="VD: Lương từ công ty ABC, vị trí Senior Engineer"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          multiline
          rows={4}
        />
      </div>

      <div className="px-5">
        <CTAButton
          label="Gửi khai báo"
          onClick={handleSubmit}
          disabled={!selectedSource || !details}
          icon={ChevronRight}
        />
      </div>
    </PageLayout>
  );
}