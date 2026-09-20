/**
 * ══════════════════════════════════════════════════════════
 *  WEB P2P CREATE OFFER PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/p2p/create
 *
 *  Create new P2P offer (merchant interface)
 *  - Buy/Sell selector
 *  - Asset & Currency selection
 *  - Price configuration
 *  - Amount limits
 *  - Payment methods
 *  - Time limits
 *  - Terms & conditions
 *  - Preview & Publish
 *
 *  Guidelines compliance:
 *  - §13: P2P safety patterns
 *  - §13.3: Offer card clarity
 *  - §14.3: High-risk actions require confirm
 *  - §21.4: Header with breadcrumb
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Clock,
  CreditCard,
  AlertTriangle,
  Info,
  CheckCircle2,
  Eye,
  Edit,
  Shield,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & CONFIG
   ═══════════════════════════════════════════════════════════ */

type OfferSide = 'buy' | 'sell';
type PriceType = 'fixed' | 'floating';

const ASSETS = ['USDT', 'BTC', 'ETH', 'USDC'];
const CURRENCIES = ['VND', 'USD', 'THB', 'PHP'];
const PAYMENT_METHODS = [
  'Chuyển khoản ngân hàng',
  'MoMo',
  'ZaloPay',
  'ViettelPay',
  'PayPal',
  'Wise',
];
const TIME_LIMITS = [15, 30, 45, 60]; // minutes

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <div className="mb-6">
      <h4
        style={{
          color: c.text1,
          fontSize: WEB_FONT.SIZE.BODY,
          fontWeight: 700,
          marginBottom: 16,
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  type = 'text',
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  type?: string;
  helperText?: string;
}) {
  const c = useThemeColors();
  return (
    <div className="mb-4">
      <label
        style={{
          color: c.text2,
          fontSize: WEB_FONT.SIZE.CAPTION,
          fontWeight: 600,
          marginBottom: 8,
          display: 'block',
        }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-lg pr-20"
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            color: c.text1,
            fontSize: WEB_FONT.SIZE.BODY,
            outline: 'none',
          }}
        />
        {suffix && (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600 }}
          >
            {suffix}
          </div>
        )}
      </div>
      {helperText && <div style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>{helperText}</div>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const c = useThemeColors();
  return (
    <div className="mb-4">
      <label
        style={{
          color: c.text2,
          fontSize: WEB_FONT.SIZE.CAPTION,
          fontWeight: 600,
          marginBottom: 8,
          display: 'block',
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg"
        style={{
          background: c.bg,
          border: `1px solid ${c.border}`,
          color: c.text1,
          fontSize: WEB_FONT.SIZE.BODY,
          outline: 'none',
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebP2PCreateOfferPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  // Form state
  const [side, setSide] = useState<OfferSide>('buy');
  const [asset, setAsset] = useState('USDT');
  const [currency, setCurrency] = useState('VND');
  const [priceType, setPriceType] = useState<PriceType>('fixed');
  const [fixedPrice, setFixedPrice] = useState('25000');
  const [floatingMargin, setFloatingMargin] = useState('0');
  const [minAmount, setMinAmount] = useState('50');
  const [maxAmount, setMaxAmount] = useState('1000');
  const [timeLimit, setTimeLimit] = useState(15);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([
    'Chuyển khoản ngân hàng',
  ]);
  const [terms, setTerms] = useState('');

  const togglePaymentMethod = (method: string) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  };

  const isValid =
    asset &&
    currency &&
    (priceType === 'fixed' ? parseFloat(fixedPrice) > 0 : true) &&
    parseFloat(minAmount) > 0 &&
    parseFloat(maxAmount) > parseFloat(minAmount) &&
    selectedPaymentMethods.length > 0;

  return (
    <PageLayout>
      <div className="flex" style={{ minHeight: '100%' }}>
        {/* ═══ LEFT SIDEBAR (320px) ═══ */}
        <div
          className="flex flex-col"
          style={{
            width: 320,
            background: c.surface,
            borderRight: `1px solid ${c.divider}`,
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            maxHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5"
            style={{
              height: 60,
              borderBottom: `1px solid ${c.divider}`,
            }}
          >
            <h2
              style={{
                color: c.text1,
                fontSize: WEB_FONT.SIZE.H2,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Tạo Offer
            </h2>
          </div>

          {/* Preview Card */}
          <div className="p-4">
            <div
              style={{
                color: c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Xem trước
            </div>
            <div
              className="p-4 rounded-xl"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: 32,
                    height: 32,
                    background: side === 'buy' ? '#10B98115' : '#EF444415',
                  }}
                >
                  {side === 'buy' ? (
                    <TrendingUp size={16} color="#10B981" />
                  ) : (
                    <TrendingDown size={16} color="#EF4444" />
                  )}
                </div>
                <span
                  style={{
                    color: side === 'buy' ? '#10B981' : '#EF4444',
                    fontSize: WEB_FONT.SIZE.BODY,
                    fontWeight: 800,
                  }}
                >
                  {side === 'buy' ? 'MUA' : 'BÁN'} {asset}
                </span>
              </div>

              <div className="mb-3">
                <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                  Giá
                </div>
                <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.H4, fontWeight: 800 }}>
                  {priceType === 'fixed'
                    ? `${parseFloat(fixedPrice || '0').toLocaleString()} ${currency}`
                    : `Market ${floatingMargin !== '0' ? `${floatingMargin > '0' ? '+' : ''}${floatingMargin}%` : ''}`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                    Tối thiểu
                  </div>
                  <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 700 }}>
                    {parseFloat(minAmount || '0').toLocaleString()} {asset}
                  </div>
                </div>
                <div>
                  <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                    Tối đa
                  </div>
                  <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 700 }}>
                    {parseFloat(maxAmount || '0').toLocaleString()} {asset}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                  Thời hạn
                </div>
                <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 700 }}>
                  {timeLimit} phút
                </div>
              </div>

              <div>
                <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                  Thanh toán
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedPaymentMethods.map((method) => (
                    <span
                      key={method}
                      className="px-2 py-0.5 rounded"
                      style={{
                        background: `${c.text3}15`,
                        color: c.text2,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="px-4 pb-4 mt-auto">
            <div
              className="p-3 rounded-lg"
              style={{
                background: '#3B82F615',
                border: `1px solid #3B82F640`,
              }}
            >
              <div className="flex items-start gap-2">
                <Info size={14} color="#3B82F6" className="flex-shrink-0 mt-0.5" />
                <div>
                  <div
                    style={{
                      color: '#3B82F6',
                      fontSize: WEB_FONT.SIZE.CAPTION,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Lưu ý quan trọng
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 16,
                      color: c.text3,
                      fontSize: 11,
                      lineHeight: 1.6,
                    }}
                  >
                    <li>Chỉ chấp nhận thanh toán theo đúng phương thức đã chọn</li>
                    <li>Không giao dịch ngoài nền tảng</li>
                    <li>Giải ngân ngay sau khi xác nhận thanh toán</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto p-8">
            {/* Page Header */}
            <div className="mb-8">
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.H3,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Tạo offer P2P mới
              </h3>
              <p style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, margin: 0 }}>
                Điền thông tin để tạo offer mua/bán tiền mã hóa
              </p>
            </div>

            {/* Form */}
            <div
              className="p-6 rounded-xl mb-6"
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              {/* Side Selector */}
              <FormSection title="Loại giao dịch">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSide('buy')}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all"
                    style={{
                      background: side === 'buy' ? '#10B98115' : c.bg,
                      border: side === 'buy' ? '2px solid #10B981' : `1px solid ${c.border}`,
                      color: side === 'buy' ? '#10B981' : c.text2,
                      fontSize: WEB_FONT.SIZE.BODY,
                      fontWeight: 700,
                    }}
                  >
                    <TrendingUp size={18} />
                    MUA
                  </button>
                  <button
                    onClick={() => setSide('sell')}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all"
                    style={{
                      background: side === 'sell' ? '#EF444415' : c.bg,
                      border: side === 'sell' ? '2px solid #EF4444' : `1px solid ${c.border}`,
                      color: side === 'sell' ? '#EF4444' : c.text2,
                      fontSize: WEB_FONT.SIZE.BODY,
                      fontWeight: 700,
                    }}
                  >
                    <TrendingDown size={18} />
                    BÁN
                  </button>
                </div>
              </FormSection>

              {/* Asset & Currency */}
              <FormSection title="Tài sản & Tiền tệ">
                <div className="grid grid-cols-2 gap-4">
                  <SelectField label="Tài sản" value={asset} onChange={setAsset} options={ASSETS} />
                  <SelectField
                    label="Tiền tệ"
                    value={currency}
                    onChange={setCurrency}
                    options={CURRENCIES}
                  />
                </div>
              </FormSection>

              {/* Price Configuration */}
              <FormSection title="Cấu hình giá">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setPriceType('fixed')}
                    className="px-4 py-2 rounded-lg transition-all"
                    style={{
                      background: priceType === 'fixed' ? '#3B82F6' : c.bg,
                      color: priceType === 'fixed' ? '#fff' : c.text2,
                      fontSize: WEB_FONT.SIZE.CAPTION,
                      fontWeight: 600,
                      border: priceType === 'fixed' ? 'none' : `1px solid ${c.border}`,
                    }}
                  >
                    Giá cố định
                  </button>
                  <button
                    onClick={() => setPriceType('floating')}
                    className="px-4 py-2 rounded-lg transition-all"
                    style={{
                      background: priceType === 'floating' ? '#3B82F6' : c.bg,
                      color: priceType === 'floating' ? '#fff' : c.text2,
                      fontSize: WEB_FONT.SIZE.CAPTION,
                      fontWeight: 600,
                      border: priceType === 'floating' ? 'none' : `1px solid ${c.border}`,
                    }}
                  >
                    Theo thị trường
                  </button>
                </div>

                {priceType === 'fixed' ? (
                  <InputField
                    label="Giá cố định"
                    value={fixedPrice}
                    onChange={setFixedPrice}
                    placeholder="25000"
                    suffix={currency}
                    type="number"
                    helperText="Giá bạn muốn mua/bán"
                  />
                ) : (
                  <InputField
                    label="Margin"
                    value={floatingMargin}
                    onChange={setFloatingMargin}
                    placeholder="0"
                    suffix="%"
                    type="number"
                    helperText="Chênh lệch so với giá thị trường (+ hoặc -)"
                  />
                )}
              </FormSection>

              {/* Amount Limits */}
              <FormSection title="Giới hạn số lượng">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Số lượng tối thiểu"
                    value={minAmount}
                    onChange={setMinAmount}
                    placeholder="50"
                    suffix={asset}
                    type="number"
                  />
                  <InputField
                    label="Số lượng tối đa"
                    value={maxAmount}
                    onChange={setMaxAmount}
                    placeholder="1000"
                    suffix={asset}
                    type="number"
                  />
                </div>
              </FormSection>

              {/* Time Limit */}
              <FormSection title="Thời hạn thanh toán">
                <div className="grid grid-cols-4 gap-2">
                  {TIME_LIMITS.map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setTimeLimit(minutes)}
                      className="px-3 py-2 rounded-lg transition-all"
                      style={{
                        background: timeLimit === minutes ? '#3B82F6' : c.bg,
                        color: timeLimit === minutes ? '#fff' : c.text2,
                        fontSize: WEB_FONT.SIZE.CAPTION,
                        fontWeight: 600,
                        border: timeLimit === minutes ? 'none' : `1px solid ${c.border}`,
                      }}
                    >
                      {minutes} phút
                    </button>
                  ))}
                </div>
              </FormSection>

              {/* Payment Methods */}
              <FormSection title="Phương thức thanh toán">
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedPaymentMethods.includes(method);
                    return (
                      <button
                        key={method}
                        onClick={() => togglePaymentMethod(method)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left"
                        style={{
                          background: isSelected ? '#10B98115' : c.bg,
                          border: isSelected ? '1px solid #10B981' : `1px solid ${c.border}`,
                          color: isSelected ? '#10B981' : c.text2,
                          fontSize: WEB_FONT.SIZE.CAPTION,
                          fontWeight: 600,
                        }}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                        {method}
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              {/* Terms */}
              <FormSection title="Điều khoản (tùy chọn)">
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Ví dụ: Chỉ nhận thanh toán từ tài khoản cùng tên..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text1,
                    fontSize: WEB_FONT.SIZE.CAPTION,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </FormSection>
            </div>

            {/* Warning */}
            <div
              className="p-5 rounded-xl mb-6"
              style={{
                background: '#EF444415',
                border: `1px solid #EF444440`,
              }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                <div>
                  <div
                    style={{
                      color: '#EF4444',
                      fontSize: WEB_FONT.SIZE.BODY,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Cam kết merchant
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 16,
                      color: c.text2,
                      fontSize: WEB_FONT.SIZE.CAPTION,
                      lineHeight: 1.6,
                    }}
                  >
                    <li>Tôi cam kết có đủ tài sản để thực hiện giao dịch</li>
                    <li>Tôi sẽ giải ngân ngay sau khi xác nhận thanh toán hợp lệ</li>
                    <li>Tôi hiểu rằng vi phạm sẽ dẫn đến khóa tài khoản</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/w/p2p')}
                className="flex-1 px-6 py-3 rounded-lg transition-colors"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.SIZE.BODY,
                  fontWeight: 600,
                }}
              >
                Hủy
              </button>
              <button
                disabled={!isValid}
                className="flex-1 px-6 py-3 rounded-lg transition-all"
                style={{
                  background: isValid ? '#3B82F6' : c.bg,
                  color: isValid ? '#fff' : c.text3,
                  fontSize: WEB_FONT.SIZE.BODY,
                  fontWeight: 600,
                  border: isValid ? 'none' : `1px solid ${c.border}`,
                  cursor: isValid ? 'pointer' : 'not-allowed',
                }}
              >
                Đăng offer
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
