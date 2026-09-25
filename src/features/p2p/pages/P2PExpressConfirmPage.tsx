import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, Lock, Shield, Zap } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { TrCard } from '@/shared/ui/TrCard';
import { useP2PAdQuery } from '../model/p2p-ad-queries';
import { useP2POrderMutation } from '../model/p2p-order-creation-queries';
import type { P2PAdType } from '../model/p2p-types';

export function P2PExpressConfirmPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hasPermission } = useAuth();
  const [params] = useSearchParams();
  const tradeType = (params.get('type') === 'sell' ? 'sell' : 'buy') as P2PAdType;
  const asset = params.get('asset') || 'USDT';
  const fiatAmount = Number(params.get('fiat')) || 0;
  const adId = params.get('adId') || undefined;
  const paymentMethod = params.get('payment') || '';
  const adQuery = useP2PAdQuery(adId);
  const orderMutation = useP2POrderMutation();
  const canCreateOrder = hasPermission('p2p:write') || hasPermission('p2p:order:create');
  const ad = adQuery.data;
  const cryptoAmount = useMemo(
    () => (ad && ad.price > 0 ? fiatAmount / ad.price : 0),
    [ad, fiatAmount],
  );

  const confirm = async () => {
    if (!canCreateOrder || !ad || !cryptoAmount || !paymentMethod) return;
    try {
      const receipt = await orderMutation.mutateAsync({
        request: {
          adId: ad.id,
          asset,
          currency: 'VND',
          amount: cryptoAmount,
          fiatAmount,
          paymentMethod,
        },
        idempotencyKey: `p2p-express-order-${crypto.randomUUID()}`,
      });
      navigate(`${prefix}/p2p/order/${receipt.orderId}`, { replace: true });
    } catch {
      // React Query owns the failure state rendered below.
    }
  };

  if (!adId || !fiatAmount || adQuery.isError) {
    return (
      <PageLayout>
        <Header title="Xác nhận Express" subtitle="Express · P2P" back />
        <ErrorState
          title="Không thể xác thực offer Express"
          actionLabel="Quay lại Express"
          onAction={() => navigate(`${prefix}/p2p/express`)}
        />
      </PageLayout>
    );
  }

  if (adQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Xác nhận Express" subtitle="Express · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang xác thực offer…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (!ad) {
    return (
      <PageLayout>
        <Header title="Xác nhận Express" subtitle="Express · P2P" back />
        <ErrorState
          title="Không tìm thấy offer Express"
          actionLabel="Quay lại Express"
          onAction={() => navigate(`${prefix}/p2p/express`)}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Xác nhận Express" subtitle="Express · P2P" back />
      <PageContent gap="default">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: tradeType === 'buy' ? '#10B981' : '#EF4444' }}
          >
            <Zap size={24} color="#fff" />
          </div>
          <div>
            <p style={{ color: colors.text1, fontSize: 17, fontWeight: 700 }}>
              {tradeType === 'buy' ? 'Express Mua' : 'Express Bán'}
            </p>
            <p style={{ color: colors.text3, fontSize: 11 }}>Kiểm tra trước khi tạo order</p>
          </div>
        </div>
        <TrCard className="p-4">
          {[
            ['Tài sản', asset],
            ['Số lượng', `${cryptoAmount.toFixed(8)} ${asset}`],
            ['Giá', `${ad.price.toLocaleString('vi-VN')} VND/${asset}`],
            [
              tradeType === 'buy' ? 'Cần thanh toán' : 'Sẽ nhận được',
              `${fiatAmount.toLocaleString('vi-VN')} VND`,
            ],
            ['Merchant', ad.merchant],
            ['Phương thức thanh toán', paymentMethod],
          ].map(([label, value], index) => (
            <div
              key={label}
              className="flex justify-between gap-3 py-3"
              style={{ borderBottom: index === 5 ? undefined : `1px solid ${colors.divider}` }}
            >
              <span style={{ color: colors.text3, fontSize: 12 }}>{label}</span>
              <span
                style={{ color: colors.text1, fontSize: 12, fontWeight: 600, textAlign: 'right' }}
              >
                {value}
              </span>
            </div>
          ))}
        </TrCard>
        <TrCard className="p-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
            >
              <span style={{ color: '#fff', fontWeight: 700 }}>{ad.merchant.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>{ad.merchant}</p>
              <p style={{ color: colors.text3, fontSize: 10 }}>
                {ad.completionRate}% hoàn tất · {ad.completedOrders} orders
              </p>
            </div>
            {ad.merchantVerified && <Shield size={15} color="#3B82F6" />}
            <CheckCircle size={15} color="#10B981" />
          </div>
        </TrCard>
        <div
          className="rounded-2xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
        >
          <Lock size={14} color="#10B981" className="shrink-0 mt-0.5" />
          <p style={{ color: '#10B981', fontSize: 11, lineHeight: 1.6 }}>
            Order sẽ được bảo vệ bởi escrow. Trạng thái và hướng dẫn thanh toán sẽ được lấy từ
            backend sau khi tạo thành công.
          </p>
        </div>
        {orderMutation.isError && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            Không thể tạo order. Vui lòng thử lại hoặc chọn offer khác.
          </p>
        )}
        {!canCreateOrder && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            P2P order write permission is required to create an Express order.
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 rounded-xl py-3"
            style={{ background: colors.surface2, color: colors.text2 }}
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!canCreateOrder || orderMutation.isPending || !paymentMethod}
            onClick={() => void confirm()}
            aria-label="Confirm P2P Express order"
            className="flex-1 rounded-xl py-3 font-bold"
            style={{
              background: tradeType === 'buy' ? '#10B981' : '#EF4444',
              color: '#fff',
              opacity: !canCreateOrder || orderMutation.isPending || !paymentMethod ? 0.6 : 1,
            }}
          >
            {orderMutation.isPending ? 'Đang tạo order…' : 'Xác nhận tạo order'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} color="#F59E0B" />
          <span style={{ color: colors.text3, fontSize: 10 }}>
            Chỉ xác nhận khi bạn đã sẵn sàng thực hiện thanh toán.
          </span>
        </div>
      </PageContent>
    </PageLayout>
  );
}
