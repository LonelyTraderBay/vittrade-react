import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { CheckCircle, CreditCard, Shield, Smartphone } from 'lucide-react';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout, StickyFooter } from '@/shared/ui/layout/PageLayout';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField } from '@/shared/ui/InputField';
import { TrCard } from '@/shared/ui/TrCard';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useP2PPaymentMethodCreateMutation } from '../model/p2p-payment-method-queries';
import type { P2PPaymentMethodType } from '../model/p2p-types';

const BANK_OPTIONS = [
  'Vietcombank',
  'Techcombank',
  'VietinBank',
  'BIDV',
  'MB Bank',
  'ACB',
  'Sacombank',
  'TPBank',
];
const EWALLET_OPTIONS = ['Momo', 'ZaloPay', 'VNPay', 'ShopeePay'];

export function P2PPaymentMethodAddPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const { hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const [type, setType] = useState<P2PPaymentMethodType>(
    searchParams.get('type') === 'ewallet' ? 'ewallet' : 'bank',
  );
  const [provider, setProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const createMutation = useP2PPaymentMethodCreateMutation();
  const canWritePaymentMethods =
    hasPermission('p2p:write') || hasPermission('p2p:payment-methods:write');
  const options = type === 'bank' ? BANK_OPTIONS : EWALLET_OPTIONS;

  const changeType = (nextType: P2PPaymentMethodType) => {
    setType(nextType);
    setProvider('');
    hapticSelection();
  };

  const save = async () => {
    if (!canWritePaymentMethods || !provider || !accountNumber.trim() || !accountName.trim())
      return;
    try {
      await createMutation.mutateAsync({
        request: {
          type,
          bankName: provider,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim().toUpperCase(),
        },
        idempotencyKey: `p2p-payment-method-create-${crypto.randomUUID()}`,
      });
      hapticSuccess();
      toast.success('Đã thêm phương thức thanh toán.');
      navigate(`${prefix}/p2p/payment-methods`, { replace: true });
    } catch {
      toast.error('Không thể thêm phương thức thanh toán.');
    }
  };

  return (
    <PageLayout variant="flush">
      <Header
        title={`Thêm ${type === 'bank' ? 'ngân hàng' : 'ví điện tử'}`}
        subtitle="Thanh toán · P2P"
        back
      />
      <PageContent gap="default" grow>
        {!canWritePaymentMethods && (
          <p role="alert" style={{ color: colors.warning, fontSize: 12 }}>
            P2P payment-method write permission is required to add a payment method.
          </p>
        )}
        <div className="flex gap-2">
          <TypeButton active={type === 'bank'} onClick={() => changeType('bank')} colors={colors}>
            <CreditCard size={16} /> Ngân hàng
          </TypeButton>
          <TypeButton
            active={type === 'ewallet'}
            onClick={() => changeType('ewallet')}
            colors={colors}
            purple
          >
            <Smartphone size={16} /> Ví điện tử
          </TypeButton>
        </div>

        <div>
          <label
            style={{
              color: colors.text2,
              fontSize: 12,
              marginBottom: 8,
              display: 'block',
              fontWeight: 600,
            }}
          >
            {type === 'bank' ? 'Chọn ngân hàng' : 'Chọn ví điện tử'}
          </label>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => {
                  setProvider(option);
                  hapticSelection();
                }}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: provider === option ? colors.primaryAlpha12 : colors.surface2,
                  color: provider === option ? colors.primary : colors.text2,
                  border: `1.5px solid ${provider === option ? colors.primaryAlpha12 : colors.borderSolid}`,
                }}
              >
                {provider === option && <CheckCircle size={12} className="inline mr-1" />}
                {option}
              </button>
            ))}
          </div>
        </div>

        {provider && (
          <TrCard className="p-4" accentBorder={colors.primaryAlpha12}>
            <div className="flex items-center gap-3">
              {type === 'bank' ? (
                <CreditCard size={18} color={colors.primary} />
              ) : (
                <Smartphone size={18} color="#A855F7" />
              )}
              <div>
                <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>{provider}</p>
                <p style={{ color: colors.text3, fontSize: 11 }}>
                  {type === 'bank' ? 'Tài khoản ngân hàng' : 'Ví điện tử'}
                </p>
              </div>
              <CheckCircle size={16} color={colors.primary} className="ml-auto" />
            </div>
          </TrCard>
        )}

        <InputField
          label="Số tài khoản"
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
          placeholder={type === 'bank' ? '0071000123456' : '0901234567'}
          inputMode="numeric"
          style={{ fontFamily: 'monospace', fontWeight: 600 }}
        />
        <InputField
          label="Tên chủ tài khoản"
          value={accountName}
          onChange={(event) => setAccountName(event.target.value.toUpperCase())}
          placeholder="NGUYEN VAN A"
          style={{ textTransform: 'uppercase', fontWeight: 600 }}
        />

        <div
          className="rounded-2xl p-3"
          style={{
            background: colors.primaryAlpha08,
            border: `1px solid ${colors.primaryAlpha12}`,
          }}
        >
          <div className="flex items-start gap-2">
            <Shield size={12} color={colors.primary} className="shrink-0 mt-0.5" />
            <p style={{ color: colors.primary, fontSize: 12, lineHeight: 1.6 }}>
              Thông tin thanh toán được mã hóa và chỉ hiển thị cho đối tác khi đơn P2P được tạo.
            </p>
          </div>
        </div>
      </PageContent>
      <StickyFooter>
        <CTAButton
          onClick={() => void save()}
          loading={createMutation.isPending}
          disabled={
            !canWritePaymentMethods || !provider || !accountNumber.trim() || !accountName.trim()
          }
        >
          Thêm phương thức
        </CTAButton>
      </StickyFooter>
    </PageLayout>
  );
}

function TypeButton({
  active,
  onClick,
  colors,
  purple = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  colors: ReturnType<typeof useThemeColors>;
  purple?: boolean;
  children: React.ReactNode;
}) {
  const color = purple ? '#A855F7' : colors.primary;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center gap-2 justify-center py-3 rounded-2xl"
      style={{
        background: active
          ? purple
            ? 'rgba(168,85,247,0.1)'
            : colors.primaryAlpha12
          : colors.surface2,
        border: `1.5px solid ${active ? (purple ? 'rgba(168,85,247,0.4)' : colors.primaryAlpha12) : colors.borderSolid}`,
        color: active ? color : colors.text2,
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}
