import { useThemeColors } from '../../hooks/useThemeColors';
import { fmtAmount } from '../../data/formatNumber';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  CheckCircle, X, ChevronDown, AlertCircle, Shield, Clock,
  Zap, Info, ArrowRight,
} from 'lucide-react';
import { TrCard } from '../../components/ui/TrCard';

const CRYPTO_OPTIONS = [
  { symbol: 'USDT', name: 'Tether USD', color: '#26A17B', minBuy: 100000 },
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', minBuy: 500000 },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', minBuy: 300000 },
  { symbol: 'BNB', name: 'BNB', color: '#F3BA2F', minBuy: 200000 },
  { symbol: 'SOL', name: 'Solana', color: '#9945FF', minBuy: 200000 },
];

const PAYMENT_METHODS = [
  {
    id: 'vietcombank',
    name: 'Vietcombank',
    type: 'bank',
    logo: 'VCB',
    logoColor: '#007F3E',
    processingTime: '2-5 phút',
    fee: 0,
    daily: '1,000,000,000',
    isPopular: true,
  },
  {
    id: 'techcombank',
    name: 'Techcombank',
    type: 'bank',
    logo: 'TCB',
    logoColor: '#E02020',
    processingTime: '2-5 phút',
    fee: 0,
    daily: '1,000,000,000',
    isPopular: false,
  },
  {
    id: 'bidv',
    name: 'BIDV',
    type: 'bank',
    logo: 'BIDV',
    logoColor: '#0066CC',
    processingTime: '2-5 phút',
    fee: 0,
    daily: '500,000,000',
    isPopular: false,
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    type: 'ewallet',
    logo: 'MM',
    logoColor: '#AE2070',
    processingTime: 'Tức thì',
    fee: 0,
    daily: '100,000,000',
    isPopular: true,
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    type: 'ewallet',
    logo: 'ZP',
    logoColor: '#008FE8',
    processingTime: 'Tức thì',
    fee: 0,
    daily: '100,000,000',
    isPopular: false,
  },
  {
    id: 'vnpay',
    name: 'VNPAY QR',
    type: 'qr',
    logo: 'QR',
    logoColor: '#1A73E8',
    processingTime: '1-2 phút',
    fee: 0,
    daily: '200,000,000',
    isPopular: false,
  },
];

// Approx exchange rates
const CRYPTO_PRICES_VND: Record<string, number> = {
  USDT: 25350,
  BTC: 1713600000,
  ETH: 89323800,
  BNB: 10475000,
  SOL: 4522000,
};

const PRESET_AMOUNTS = [100000, 500000, 1000000, 5000000, 10000000];

type Step = 'input' | 'confirm' | 'success';

export function BuyCryptoPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const routePrefix = useRoutePrefix();
  const [step, setStep] = useState<Step>('input');
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [selectedPayment, setSelectedPayment] = useState('momo');
  const [vndAmount, setVndAmount] = useState('');
  const [showCryptoPicker, setShowCryptoPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const vndNum = parseFloat((vndAmount || '0').replace(/,/g, ''));
  const cryptoPrice = CRYPTO_PRICES_VND[selectedCrypto] ?? 1;
  const cryptoAmount = vndNum / cryptoPrice;
  const selectedCryptoData = CRYPTO_OPTIONS.find(c => c.symbol === selectedCrypto)!;
  const selectedPaymentData = PAYMENT_METHODS.find(p => p.id === selectedPayment)!;
  const canBuy = vndNum >= selectedCryptoData.minBuy && vndNum <= 100000000;

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsProcessing(false);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <PageLayout>
        <Header title="Mua Crypto" subtitle="Giao dịch · Wallet" back={false} />
        <PageContent>
        <div className="flex flex-col items-center justify-center flex-1 gap-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)', border: '3px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle size={48} color="#10B981" />
          </div>
          <div className="text-center">
            <h2 style={{ color: c.text1, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              Đặt lệnh thành công!
            </h2>
            <p style={{ color: c.text2, fontSize: 14, lineHeight: 1.6 }}>
              Lệnh mua {fmtAmount(cryptoAmount)} {selectedCrypto} đã được đặt.
              Tiền sẽ vào ví trong vài phút.
            </p>
          </div>

          <TrCard className="w-full p-4 flex flex-col gap-2.5">
            {[
              { label: 'Mã giao dịch', value: '#BUY7K3M9PX2' },
              { label: 'Số tiền', value: `${vndNum.toLocaleString('vi-VN')} VND` },
              { label: 'Nhận về', value: `${cryptoAmount < 1 ? cryptoAmount.toFixed(6) : cryptoAmount.toFixed(4)} ${selectedCrypto}` },
              { label: 'Trạng thái', value: 'Đang xử lý', color: '#F59E0B' },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span style={{ color: c.text2, fontSize: 13 }}>{row.label}</span>
                <span style={{ color: (row as any).color ?? c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{row.value}</span>
              </div>
            ))}
          </TrCard>

          <div className="flex flex-col gap-3 w-full">
            <CTAButton onClick={() => navigate(`${routePrefix}/wallet`)} variant="primary">
              Về Ví
            </CTAButton>
            <CTAButton
              onClick={() => { setStep('input'); setVndAmount(''); }}
              variant="ghost"
              bg={c.surface2}
              textColor={c.text2}
              style={{ border: `1px solid ${c.borderSolid}`, fontSize: 15, boxShadow: 'none' }}
            >
              Mua thêm
            </CTAButton>
          </div>
        </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (step === 'confirm') {
    return (
      <PageLayout>
        <Header title="Xác nhận mua" subtitle="Giao dịch · Wallet" back />
        <PageContent gap="default">
          {/* Summary */}
          <div className="rounded-3xl p-5"
            style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2550 100%)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <div className="text-center mb-4">
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Bạn sẽ nhận được</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: selectedCryptoData.color + '22' }}>
                  <span style={{ color: selectedCryptoData.color, fontSize: 10, fontWeight: 700 }}>{selectedCrypto.slice(0, 3)}</span>
                </div>
                <p style={{ color: '#10B981', fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}>
                  {cryptoAmount < 1 ? cryptoAmount.toFixed(6) : cryptoAmount.toFixed(4)} {selectedCrypto}
                </p>
              </div>
            </div>

            {[
              { label: 'Thanh toán', value: `${vndNum.toLocaleString('vi-VN')} VND` },
              { label: 'Tỷ giá', value: `1 ${selectedCrypto} = ${cryptoPrice.toLocaleString('vi-VN')} VND` },
              { label: 'Phương thức', value: selectedPaymentData.name },
              { label: 'Phí', value: 'Miễn phí 🎉', color: '#10B981' },
              { label: 'Thời gian xử lý', value: selectedPaymentData.processingTime },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text2, fontSize: 13 }}>{row.label}</span>
                <span style={{ color: (row as any).color ?? c.text1, fontSize: 13, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Payment instructions */}
          <TrCard className="p-4" accentBorder="rgba(245,158,11,0.2)">
            <div className="flex items-start gap-2">
              <Info size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>Hướng dẫn thanh toán</p>
                <p style={{ color: c.text2, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                  Sau khi xác nhận, bạn sẽ được chuyển đến app {selectedPaymentData.name} để hoàn tất thanh toán.
                  Lệnh mua sẽ được xử lý tự động.
                </p>
              </div>
            </div>
          </TrCard>

          <CTAButton
            onClick={handleConfirm}
            loading={isProcessing}
            variant="primary"
          >
            {isProcessing ? 'Đang xử lý...' : `Xác nhận thanh toán ${vndNum.toLocaleString('vi-VN')} VND`}
          </CTAButton>

          <CTAButton
            onClick={() => setStep('input')}
            variant="ghost"
            bg={c.surface2}
            textColor={c.text2}
            style={{ border: `1px solid ${c.borderSolid}`, fontSize: 15, boxShadow: 'none' }}
          >
            Quay lại chỉnh sửa
          </CTAButton>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Crypto picker modal */}
      {showCryptoPicker && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setShowCryptoPicker(false)}>
          <div className="w-full rounded-t-3xl p-5 flex flex-col gap-3"
            style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, maxWidth: 440, margin: '0 auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
            </div>
            <div className="flex justify-between items-center">
              <h3 style={{ color: c.text1, fontSize: 17, fontWeight: 700 }}>Chọn loại Crypto</h3>
              <button onClick={() => setShowCryptoPicker(false)}><X size={20} color={c.text2} /></button>
            </div>
            {CRYPTO_OPTIONS.map(crypto => (
              <button key={crypto.symbol}
                onClick={() => { setSelectedCrypto(crypto.symbol); setShowCryptoPicker(false); }}
                className="flex items-center gap-3 p-3 rounded-2xl w-full"
                style={{ background: selectedCrypto === crypto.symbol ? 'rgba(59,130,246,0.08)' : c.surface2, border: `1px solid ${selectedCrypto === crypto.symbol ? '#3B82F6' : c.borderSolid}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: crypto.color + '22' }}>
                  <span style={{ color: crypto.color, fontSize: 10, fontWeight: 700 }}>{crypto.symbol.slice(0, 3)}</span>
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{crypto.symbol}</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>{crypto.name}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: c.text2, fontSize: 12 }}>{CRYPTO_PRICES_VND[crypto.symbol].toLocaleString('vi-VN')} VND</p>
                </div>
                {selectedCrypto === crypto.symbol && <CheckCircle size={16} color="#3B82F6" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <Header title="Mua Crypto" subtitle="Giao dịch · Wallet" back />
      <PageContent gap="default">
        {/* Summary */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Shield size={13} color="#10B981" />
          <p style={{ color: c.text2, fontSize: 12, flex: 1 }}>
            Mua trực tiếp bằng VND — Phí 0% — Nhận USDT tức thì
          </p>
          <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>0% phí</span>
        </div>

        {/* Amount input */}
        <TrCard rounded="lg" className="p-5">
          <div className="flex justify-between items-center mb-3">
            <p style={{ color: c.text2, fontSize: 13 }}>Số tiền (VND)</p>
            <p style={{ color: c.text3, fontSize: 12 }}>Số dư: 0 VND</p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: c.text3, fontSize: 20, fontFamily: 'monospace' }}>₫</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={vndAmount ? parseFloat(vndAmount.replace(/,/g, '')).toLocaleString('vi-VN') : ''}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                setVndAmount(raw);
              }}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 28, fontWeight: 700, fontFamily: 'monospace', flex: 1 }}
            />
          </div>

          {/* Preset amounts */}
          <div className="flex gap-2 flex-wrap mb-4">
            {PRESET_AMOUNTS.map(amt => (
              <button key={amt} onClick={() => setVndAmount(amt.toString())}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: vndAmount === amt.toString() ? '#3B82F6' : c.surface2, color: vndAmount === amt.toString() ? '#fff' : c.text2, border: `1px solid ${vndAmount === amt.toString() ? '#3B82F6' : c.borderSolid}` }}>
                {(amt / 1000).toFixed(0)}K
              </button>
            ))}
          </div>

          {/* Estimated receive */}
          <div className="rounded-2xl p-3 flex items-center justify-between"
            style={{ background: c.surface2 }}>
            <div>
              <p style={{ color: c.text3, fontSize: 11 }}>Bạn sẽ nhận được</p>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                {vndNum > 0 ? (cryptoAmount < 1 ? cryptoAmount.toFixed(8) : cryptoAmount.toFixed(4)) : '0'} {selectedCrypto}
              </p>
            </div>
            <button onClick={() => setShowCryptoPicker(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: c.surface, border: `1px solid ${c.borderSolid}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: selectedCryptoData.color + '22' }}>
                <span style={{ color: selectedCryptoData.color, fontSize: 8, fontWeight: 700 }}>{selectedCrypto.slice(0, 3)}</span>
              </div>
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{selectedCrypto}</span>
              <ChevronDown size={14} color={c.text2} />
            </button>
          </div>
        </TrCard>

        {/* Validation */}
        {vndNum > 0 && vndNum < selectedCryptoData.minBuy && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={14} color="#EF4444" />
            <span style={{ color: '#EF4444', fontSize: 13 }}>
              Tối thiểu {selectedCryptoData.minBuy.toLocaleString('vi-VN')} VND
            </span>
          </div>
        )}

        {/* Payment method */}
        <div>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Phương thức thanh toán
          </p>

          {/* Banks */}
          <p style={{ color: c.text3, fontSize: 12, marginBottom: 8 }}>🏦 Chuyển khoản ngân hàng</p>
          <div className="flex flex-col gap-2 mb-4">
            {PAYMENT_METHODS.filter(p => p.type === 'bank').map(pm => (
              <button key={pm.id}
                onClick={() => setSelectedPayment(pm.id)}
                className="flex items-center gap-3 p-3 rounded-2xl w-full"
                style={{ background: selectedPayment === pm.id ? 'rgba(59,130,246,0.08)' : c.surface, border: `1.5px solid ${selectedPayment === pm.id ? '#3B82F6' : c.borderSolid}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: pm.logoColor + '22', color: pm.logoColor }}>
                  {pm.logo}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{pm.name}</p>
                    {pm.isPopular && (
                      <span className="px-1.5 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>Phổ biến</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={10} color={c.text3} />
                    <span style={{ color: c.text3, fontSize: 11 }}>{pm.processingTime}</span>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: selectedPayment === pm.id ? '#3B82F6' : c.borderSolid }}>
                  {selectedPayment === pm.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3B82F6' }} />}
                </div>
              </button>
            ))}
          </div>

          {/* E-wallets */}
          <p style={{ color: c.text3, fontSize: 12, marginBottom: 8 }}>📱 Ví điện tử</p>
          <div className="flex flex-col gap-2">
            {PAYMENT_METHODS.filter(p => p.type !== 'bank').map(pm => (
              <button key={pm.id}
                onClick={() => setSelectedPayment(pm.id)}
                className="flex items-center gap-3 p-3 rounded-2xl w-full"
                style={{ background: selectedPayment === pm.id ? 'rgba(59,130,246,0.08)' : c.surface, border: `1.5px solid ${selectedPayment === pm.id ? '#3B82F6' : c.borderSolid}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: pm.logoColor + '22', color: pm.logoColor }}>
                  {pm.logo}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{pm.name}</p>
                    {pm.isPopular && (
                      <span className="px-1.5 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>Phổ biến</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={10} color="#10B981" />
                    <span style={{ color: '#10B981', fontSize: 11 }}>{pm.processingTime}</span>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: selectedPayment === pm.id ? '#3B82F6' : c.borderSolid }}>
                  {selectedPayment === pm.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3B82F6' }} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Rate info */}
        <TrCard className="p-4 flex flex-col gap-2">
          {[
            { label: 'Tỷ giá hiện tại', value: `1 ${selectedCrypto} = ${cryptoPrice.toLocaleString('vi-VN')} VND` },
            { label: 'Phí giao dịch', value: 'Miễn phí', color: '#10B981' },
            { label: 'Hạn mức ngày', value: `${selectedPaymentData.daily} VND` },
          ].map(row => (
            <div key={row.label} className="flex justify-between">
              <span style={{ color: c.text2, fontSize: 13 }}>{row.label}</span>
              <span style={{ color: (row as any).color ?? c.text1, fontSize: 13, fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </TrCard>

        {/* Buy button */}
        <CTAButton
          onClick={() => setStep('confirm')}
          disabled={!canBuy}
          variant="success"
        >
          {canBuy ? (
            <div className="contents">Mua {selectedCrypto} <ArrowRight size={18} /></div>
          ) : (
            'Nhập số tiền mua'
          )}
        </CTAButton>
      </PageContent>
    </PageLayout>
  );
}