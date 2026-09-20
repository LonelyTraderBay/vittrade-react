import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  Zap, Lock, AlertTriangle, Shield, CheckCircle,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { P2P_ADS } from '../../data/mockData';
import { fmtVnd, fmtAmount } from '../../data/formatNumber';
import { φ } from '../../utils/golden';

export function P2PExpressConfirmPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const [searchParams] = useSearchParams();

  const tradeType = (searchParams.get('type') || 'buy') as 'buy' | 'sell';
  const asset = searchParams.get('asset') || 'USDT';
  const fiatAmount = parseFloat(searchParams.get('fiat') || '0');
  const cryptoAmount = parseFloat(searchParams.get('crypto') || '0');
  const adId = searchParams.get('adId') || '';
  const payment = searchParams.get('payment') || '';

  const bestAd = P2P_ADS.find(a => a.id === adId) || P2P_ADS[0];
  const tradeColor = tradeType === 'buy' ? '#10B981' : '#EF4444';
  const tradeGradient = tradeType === 'buy'
    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)';

  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    hapticSuccess();
    await new Promise(r => setTimeout(r, 1500));
    setIsProcessing(false);
    navigate(`${prefix}/p2p/order/p2p001`, { replace: true });
  };

  return (
    <PageLayout>
      <Header title={`Xác nhận ${tradeType === 'buy' ? 'mua' : 'bán'} nhanh`} subtitle="Express · P2P" back />

      {/* Hero */}
      <div className="flex items-center gap-3 py-2">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: tradeGradient }}>
          <Zap size={24} color="#fff" />
        </div>
        <div>
          <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
            Express {tradeType === 'buy' ? 'Mua' : 'Bán'}
          </p>
          <p style={{ color: c.text3, fontSize: 11 }}>Kiểm tra kỹ trước khi xác nhận</p>
        </div>
      </div>

      {/* Order Summary */}
      <TrCard className="p-4" accentBorder={tradeColor + '30'}>
        {[
          { label: 'Loại giao dịch', value: tradeType === 'buy' ? 'Mua' : 'Bán', color: tradeColor },
          { label: 'Tài sản', value: asset },
          { label: 'Số lượng', value: `${fmtAmount(cryptoAmount)} ${asset}`, bold: true },
          { label: 'Giá', value: `${fmtVnd(bestAd.price)} VND/${asset}` },
          { label: tradeType === 'buy' ? 'Cần thanh toán' : 'Sẽ nhận được', value: `${fmtVnd(Math.round(fiatAmount))} VND`, bold: true, color: tradeColor },
          { label: 'Merchant', value: bestAd.merchant },
          { label: 'Phương thức TT', value: payment || bestAd.paymentMethods[0] },
          { label: 'Phí giao dịch', value: 'Miễn phí', color: '#10B981' },
        ].map(row => (
          <div key={row.label} className="flex justify-between items-center py-2.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <span style={{ color: c.text3, fontSize: 12 }}>{row.label}</span>
            <span style={{
              color: row.color || c.text1,
              fontSize: 12,
              fontWeight: row.bold ? 700 : 500,
              fontFamily: row.bold ? 'monospace' : 'inherit',
            }}>
              {row.value}
            </span>
          </div>
        ))}
      </TrCard>

      {/* Merchant info */}
      <TrCard className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{bestAd.merchant.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{bestAd.merchant}</span>
              {bestAd.merchantVerified && <Shield size={11} color="#3B82F6" fill="rgba(59,130,246,0.2)" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span style={{ color: c.text3, fontSize: 10 }}>{bestAd.completedOrders} đơn</span>
              <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>{bestAd.completionRate}%</span>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(16,185,129,0.08)' }}>
            <CheckCircle size={10} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>Escrow</span>
          </div>
        </div>
      </TrCard>

      {/* Escrow Note */}
      <div className="rounded-2xl p-3.5 flex items-start gap-2.5"
        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <Lock size={14} color="#10B981" className="shrink-0 mt-0.5" />
        <p style={{ color: '#10B981', fontSize: 11, lineHeight: 1.6 }}>
          {fmtAmount(cryptoAmount)} {asset} sẽ được khóa trong Escrow.
          Bạn có 15 phút để hoàn tất thanh toán sau khi tạo đơn.
        </p>
      </div>

      {/* Warning */}
      <div className="rounded-2xl p-3.5 flex items-start gap-2.5"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
        <p style={{ color: '#D97706', fontSize: 11, lineHeight: 1.6 }}>
          Chỉ bấm xác nhận khi bạn đã sẵn sàng thanh toán. Hủy đơn nhiều lần sẽ ảnh hưởng đến uy tín.
        </p>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex gap-3">
        <CTAButton
          onClick={() => navigate(-1)}
          variant="ghost"
          bg={c.surface2}
          textColor={c.text2}
          fullWidth={false}
          className="flex-1"
          style={{ border: `1px solid ${c.borderSolid}`, boxShadow: 'none' }}
        >
          Hủy bỏ
        </CTAButton>
        <CTAButton
          onClick={handleConfirm}
          loading={isProcessing}
          variant={tradeType === 'buy' ? 'success' : 'danger'}
          fullWidth={false}
          className="flex-1"
        >
          {isProcessing ? 'Đang tạo đơn...' : 'Xác nhận'}
        </CTAButton>
      </div>
      <div style={{ height: 16 }} />
    </PageLayout>
  );
}