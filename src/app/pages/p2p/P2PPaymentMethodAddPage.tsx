import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import {
  CreditCard, Smartphone, CheckCircle, Shield,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { InputField } from '../../components/ui/InputField';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../utils/golden';

const BANK_OPTIONS = ['Vietcombank', 'Techcombank', 'VietinBank', 'BIDV', 'MB Bank', 'ACB', 'Sacombank', 'TPBank'];
const EWALLET_OPTIONS = ['Momo', 'ZaloPay', 'VNPay', 'ShopeePay'];

export function P2PPaymentMethodAddPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const [searchParams] = useSearchParams();

  const initialType = (searchParams.get('type') as 'bank' | 'ewallet') || 'bank';

  const [addType, setAddType] = useState<'bank' | 'ewallet'>(initialType);
  const [formBank, setFormBank] = useState('');
  const [formAccount, setFormAccount] = useState('');
  const [formName, setFormName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formBank || !formAccount || !formName) return;
    setIsSaving(true);
    hapticSuccess();
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    navigate(`${prefix}/p2p/payment-methods`, { replace: true });
  };

  return (
    <PageLayout variant="flush">
      <Header title={`Thêm ${addType === 'bank' ? 'ngân hàng' : 'ví điện tử'}`} subtitle="Thanh toán · P2P" back />

      <PageContent gap="default" grow>
        {/* Type Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => { setAddType('bank'); setFormBank(''); hapticSelection(); }}
            className="flex-1 flex items-center gap-2 justify-center py-3 rounded-2xl"
            style={{
              background: addType === 'bank' ? c.primaryAlpha12 : c.surface2,
              border: `1.5px solid ${addType === 'bank' ? c.primaryAlpha12 : c.borderSolid}`,
              color: addType === 'bank' ? c.primary : c.text2,
              fontWeight: 700, fontSize: 13,
            }}>
            <CreditCard size={16} />
            Ngân hàng
          </button>
          <button
            onClick={() => { setAddType('ewallet'); setFormBank(''); hapticSelection(); }}
            className="flex-1 flex items-center gap-2 justify-center py-3 rounded-2xl"
            style={{
              background: addType === 'ewallet' ? 'rgba(168,85,247,0.1)' : c.surface2,
              border: `1.5px solid ${addType === 'ewallet' ? 'rgba(168,85,247,0.4)' : c.borderSolid}`,
              color: addType === 'ewallet' ? '#A855F7' : c.text2,
              fontWeight: 700, fontSize: 13,
            }}>
            <Smartphone size={16} />
            Ví điện tử
          </button>
        </div>

        {/* Bank/Wallet Selector */}
        <div>
          <label style={{ color: c.text2, fontSize: φ.xs, marginBottom: 8, display: 'block', fontWeight: 600 }}>
            {addType === 'bank' ? 'Chọn ngân hàng' : 'Chọn ví điện tử'}
          </label>
          <div className="flex flex-wrap gap-2">
            {(addType === 'bank' ? BANK_OPTIONS : EWALLET_OPTIONS).map(opt => (
              <button key={opt} onClick={() => { setFormBank(opt); hapticSelection(); }}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: formBank === opt ? c.primaryAlpha12 : c.surface2,
                  color: formBank === opt ? c.primary : c.text2,
                  border: `1.5px solid ${formBank === opt ? c.primaryAlpha12 : c.borderSolid}`,
                }}>
                {formBank === opt && <CheckCircle size={12} className="inline mr-1" />}
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Selected preview */}
        {formBank && (
          <TrCard className="p-4" accentBorder={c.primaryAlpha12}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: addType === 'bank' ? c.primaryAlpha12 : 'rgba(168,85,247,0.1)' }}>
                {addType === 'bank' ? <CreditCard size={18} color={c.primary} /> : <Smartphone size={18} color="#A855F7" />}
              </div>
              <div>
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{formBank}</p>
                <p style={{ color: c.text3, fontSize: 11 }}>
                  {addType === 'bank' ? 'Tài khoản ngân hàng' : 'Ví điện tử'}
                </p>
              </div>
              <CheckCircle size={16} color={c.primary} className="ml-auto" />
            </div>
          </TrCard>
        )}

        {/* Form */}
        <InputField
          label="Số tài khoản"
          value={formAccount}
          onChange={e => setFormAccount(e.target.value)}
          placeholder={addType === 'bank' ? '0071000123456' : '0901234567'}
          type="text"
          inputMode="numeric"
          style={{ fontFamily: 'monospace', fontWeight: 600 }}
        />

        <InputField
          label="Tên chủ tài khoản"
          value={formName}
          onChange={e => setFormName(e.target.value.toUpperCase())}
          placeholder="NGUYEN VAN A"
          style={{ textTransform: 'uppercase', fontWeight: 600 }}
        />

        {/* Security note */}
        <div className="rounded-2xl p-3" style={{ background: c.primaryAlpha08, border: `1px solid ${c.primaryAlpha12}` }}>
          <div className="flex items-start gap-2">
            <Shield size={12} color={c.primary} className="shrink-0 mt-0.5" />
            <p style={{ color: c.primary, fontSize: φ.xs, lineHeight: 1.6 }}>
              Thông tin thanh toán được mã hóa và chỉ hiển thị cho đối tác khi đơn P2P được tạo.
            </p>
          </div>
        </div>
      </PageContent>

      <StickyFooter>
        <CTAButton
          onClick={handleSave}
          loading={isSaving}
          disabled={!formBank || !formAccount || !formName}
        >
          {isSaving ? 'Đang lưu...' : 'Thêm phương thức'}
        </CTAButton>
      </StickyFooter>
    </PageLayout>
  );
}