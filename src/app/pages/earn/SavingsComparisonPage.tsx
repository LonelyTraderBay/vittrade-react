import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight, Check, X, Plus, Lock, Unlock, TrendingUp, Shield,
  Users, AlertTriangle, ChevronRight, Info, Sparkles, BarChart3,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { SAVINGS_PRODUCTS, type SavingsProduct } from '../../data/mockData';
import { fmtAmount } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════
   Extended mock data for comparison
   ═══════════════════════════════════════════════════════════ */

const PRODUCT_DETAILS: Record<string, {
  risk: 'low' | 'medium' | 'high';
  capacity: number;
  participants: number;
  earlyWithdrawal: string;
  interestPayout: string;
  compounding: string;
  insurance: boolean;
  minTerm: string;
  maxDeposit: string;
  features: string[];
}> = {
  sav001: {
    risk: 'low', capacity: 62, participants: 45230,
    earlyWithdrawal: 'Bất kỳ lúc nào', interestPayout: 'Hàng ngày',
    compounding: 'Tự động', insurance: true, minTerm: 'Không có',
    maxDeposit: 'Không giới hạn',
    features: ['Auto-compound', 'Rút bất kỳ lúc nào', 'Bảo hiểm quỹ'],
  },
  sav002: {
    risk: 'low', capacity: 90, participants: 12480,
    earlyWithdrawal: 'Mất toàn bộ lãi', interestPayout: 'Cuối kỳ',
    compounding: 'Không', insurance: true, minTerm: '30 ngày',
    maxDeposit: '$50,000',
    features: ['APY cao', 'VIP bonus', 'Bảo hiểm quỹ'],
  },
  sav003: {
    risk: 'medium', capacity: 93, participants: 6720,
    earlyWithdrawal: 'Mất toàn bộ lãi', interestPayout: 'Cuối kỳ',
    compounding: 'Không', insurance: true, minTerm: '90 ngày',
    maxDeposit: '$100,000',
    features: ['APY cao nhất', 'Bảo hiểm quỹ', 'Priority support'],
  },
  sav004: {
    risk: 'low', capacity: 48, participants: 18340,
    earlyWithdrawal: 'Bất kỳ lúc nào', interestPayout: 'Hàng ngày',
    compounding: 'Tự động', insurance: true, minTerm: 'Không có',
    maxDeposit: 'Không giới hạn',
    features: ['Auto-compound', 'Rút bất kỳ lúc nào', 'BTC exposure'],
  },
  sav005: {
    risk: 'low', capacity: 82, participants: 9120,
    earlyWithdrawal: 'Mất toàn bộ lãi', interestPayout: 'Cuối kỳ',
    compounding: 'Không', insurance: true, minTerm: '60 ngày',
    maxDeposit: '5 BTC',
    features: ['VIP bonus', 'Bảo hiểm quỹ', 'BTC exposure'],
  },
  sav006: {
    risk: 'low', capacity: 55, participants: 15670,
    earlyWithdrawal: 'Bất kỳ lúc nào', interestPayout: 'Hàng ngày',
    compounding: 'Tự động', insurance: true, minTerm: 'Không có',
    maxDeposit: 'Không giới hạn',
    features: ['Auto-compound', 'ETH exposure', 'Rút tức thì'],
  },
  sav007: {
    risk: 'medium', capacity: 35, participants: 4890,
    earlyWithdrawal: 'Mất toàn bộ lãi', interestPayout: 'Cuối kỳ',
    compounding: 'Không', insurance: true, minTerm: '30 ngày',
    maxDeposit: '50K SOL',
    features: ['APY cao', 'SOL ecosystem', 'Quota thấp'],
  },
};

const RISK_LABELS: Record<string, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
const RISK_COLORS: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

const MAX_COMPARE = 3;

/* ═══════════════════════════════════════════════════════════
   Comparison Row Component
   ═══════════════════════════════════════════════════════════ */

function ComparisonRow({
  label,
  values,
  highlight,
  highlightBest,
}: {
  label: string;
  values: (string | React.ReactNode)[];
  highlight?: boolean;
  highlightBest?: 'highest' | 'lowest' | null;
}) {
  const c = useThemeColors();

  return (
    <div
      className="flex items-stretch"
      style={{
        background: highlight ? c.surface2 : 'transparent',
        borderBottom: `1px solid ${c.divider}`,
      }}
    >
      <div
        className="flex items-center px-3 py-3 shrink-0"
        style={{ width: 100, color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}
      >
        {label}
      </div>
      {values.map((val, i) => (
        <div
          key={i}
          className="flex-1 flex items-center justify-center px-2 py-3 text-center"
          style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, borderLeft: `1px solid ${c.divider}` }}
        >
          {val}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Product Selector Chip
   ═══════════════════════════════════════════════════════════ */

function ProductChip({
  product,
  onRemove,
}: {
  product: SavingsProduct;
  onRemove: () => void;
}) {
  const c = useThemeColors();
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: product.color + '15', border: `1px solid ${product.color}33` }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ background: product.color + '22' }}
      >
        <span style={{ color: product.color, fontSize: 8, fontWeight: 700 }}>
          {product.asset.slice(0, 3)}
        </span>
      </div>
      <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }} className="truncate">
        {product.name}
      </span>
      <button onClick={onRemove} className="ml-auto shrink-0">
        <X size={14} color={c.text3} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */

export function SavingsComparisonPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight } = useHaptic();

  const [selectedIds, setSelectedIds] = useState<string[]>(['sav001', 'sav002']);
  const [showPicker, setShowPicker] = useState(false);

  const selectedProducts = useMemo(
    () => selectedIds.map(id => SAVINGS_PRODUCTS.find(p => p.id === id)!).filter(Boolean),
    [selectedIds],
  );

  const availableToAdd = useMemo(
    () => SAVINGS_PRODUCTS.filter(p => !selectedIds.includes(p.id)),
    [selectedIds],
  );

  const addProduct = (id: string) => {
    if (selectedIds.length < MAX_COMPARE && !selectedIds.includes(id)) {
      hapticSelection();
      setSelectedIds(prev => [...prev, id]);
      setShowPicker(false);
    }
  };

  const removeProduct = (id: string) => {
    hapticLight();
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  /* Best value helpers */
  const bestAPY = Math.max(...selectedProducts.map(p => p.apy));
  const lowestMin = Math.min(...selectedProducts.map(p => p.minAmount));

  return (
    <PageLayout>
      {/* ─── Product Picker Sheet ─── */}
      <BottomSheetV2 open={showPicker} onClose={() => setShowPicker(false)} title="Chọn sản phẩm so sánh">
        <div className="flex flex-col gap-2">
          {availableToAdd.map(product => (
            <button
              key={product.id}
              onClick={() => addProduct(product.id)}
              className="flex items-center gap-3 p-3 rounded-2xl text-left"
              style={{ background: c.surface2 }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: product.color + '22', border: `1.5px solid ${product.color}44` }}
              >
                <span style={{ color: product.color, fontSize: 10, fontWeight: 700 }}>
                  {product.asset.slice(0, 3)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span style={{ color: c.text3, fontSize: 11 }}>
                    {product.type === 'flexible' ? 'Linh hoạt' : `Cố định ${product.lockDays} ngày`}
                  </span>
                  <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                    {product.apy}% APY
                  </span>
                </div>
              </div>
              <Plus size={18} color={c.primary} />
            </button>
          ))}
          {availableToAdd.length === 0 && (
            <div className="text-center py-6">
              <p style={{ color: c.text3, fontSize: 13 }}>Đã chọn hết sản phẩm</p>
            </div>
          )}
        </div>
      </BottomSheetV2>

      {/* ─── Header ─── */}
      <Header title="So sánh sản phẩm" back />

      <PageContent gap="default">
        {/* ─── Selected Products ─── */}
        <PageSection label="Sản phẩm đã chọn" accentColor="#3B82F6">
          <div className="flex flex-col gap-2">
            {selectedProducts.map(product => (
              <ProductChip
                key={product.id}
                product={product}
                onRemove={() => removeProduct(product.id)}
              />
            ))}
            {selectedIds.length < MAX_COMPARE && (
              <button
                onClick={() => { setShowPicker(true); hapticSelection(); }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
                style={{
                  border: `1.5px dashed ${c.borderSolid}`,
                  color: c.text3, fontSize: 12, fontWeight: 500,
                }}
              >
                <Plus size={14} />
                Thêm sản phẩm ({selectedIds.length}/{MAX_COMPARE})
              </button>
            )}
          </div>
        </PageSection>

        {/* ─── Comparison Table ─── */}
        {selectedProducts.length >= 2 && (
          <PageSection label="So sánh chi tiết" accentColor="#10B981">
            <TrCard className="overflow-hidden">
              {/* Header row */}
              <div className="flex" style={{ background: c.surface2 }}>
                <div className="px-3 py-3 shrink-0" style={{ width: 100 }}>
                  <ArrowLeftRight size={14} color={c.text3} />
                </div>
                {selectedProducts.map(p => (
                  <div
                    key={p.id}
                    className="flex-1 flex flex-col items-center justify-center px-2 py-3 text-center"
                    style={{ borderLeft: `1px solid ${c.divider}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                      style={{ background: p.color + '22' }}
                    >
                      <span style={{ color: p.color, fontSize: 8, fontWeight: 700 }}>
                        {p.asset.slice(0, 3)}
                      </span>
                    </div>
                    <span style={{ color: c.text1, fontSize: 10, fontWeight: 600 }} className="truncate w-full px-1">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* APY */}
              <ComparisonRow
                label="APY"
                highlight
                values={selectedProducts.map(p => (
                  <div key={p.id}>
                    <span style={{
                      color: p.apy === bestAPY ? '#10B981' : c.text1,
                      fontSize: 14, fontWeight: 800,
                    }}>
                      {p.apy}%
                    </span>
                    {p.apy === bestAPY && selectedProducts.length > 1 && (
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        <TrendingUp size={9} color="#10B981" />
                        <span style={{ color: '#10B981', fontSize: 8, fontWeight: 600 }}>Cao nhất</span>
                      </div>
                    )}
                    {p.apyBonus && (
                      <div className="mt-0.5">
                        <span style={{ color: '#F59E0B', fontSize: 9, fontWeight: 600 }}>
                          VIP: {p.apyBonus}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              />

              {/* Type */}
              <ComparisonRow
                label="Loại"
                values={selectedProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-1">
                    {p.type === 'flexible'
                      ? <Unlock size={11} color="#10B981" />
                      : <Lock size={11} color="#F59E0B" />}
                    <span style={{ fontSize: 11 }}>
                      {p.type === 'flexible' ? 'Linh hoạt' : `Cố định`}
                    </span>
                  </div>
                ))}
              />

              {/* Lock period */}
              <ComparisonRow
                label="Kỳ hạn"
                values={selectedProducts.map(p =>
                  p.lockDays ? `${p.lockDays} ngày` : 'Không kỳ hạn'
                )}
              />

              {/* Min amount */}
              <ComparisonRow
                label="Tối thiểu"
                highlight
                values={selectedProducts.map(p => (
                  <span key={p.id} style={{
                    color: p.minAmount === lowestMin && selectedProducts.length > 1 ? '#10B981' : c.text1,
                    fontWeight: p.minAmount === lowestMin && selectedProducts.length > 1 ? 700 : 500,
                    fontFamily: 'monospace', fontSize: 11,
                  }}>
                    {fmtAmount(p.minAmount)} {p.asset}
                  </span>
                ))}
              />

              {/* Risk */}
              <ComparisonRow
                label="Rủi ro"
                values={selectedProducts.map(p => {
                  const risk = PRODUCT_DETAILS[p.id]?.risk ?? 'low';
                  return (
                    <span key={p.id} className="flex items-center gap-1">
                      <Shield size={10} color={RISK_COLORS[risk]} />
                      <span style={{ color: RISK_COLORS[risk], fontSize: 11, fontWeight: 600 }}>
                        {RISK_LABELS[risk]}
                      </span>
                    </span>
                  );
                })}
              />

              {/* Capacity */}
              <ComparisonRow
                label="Dung lượng"
                highlight
                values={selectedProducts.map(p => {
                  const cap = PRODUCT_DETAILS[p.id]?.capacity ?? 50;
                  return (
                    <div key={p.id} className="w-full px-1">
                      <div className="h-1.5 rounded-full overflow-hidden mb-0.5" style={{ background: c.surface2 }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${cap}%`,
                            background: cap > 85 ? '#EF4444' : cap > 60 ? '#F59E0B' : '#10B981',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 9, color: c.text3 }}>{cap}% đã đăng ký</span>
                    </div>
                  );
                })}
              />

              {/* Participants */}
              <ComparisonRow
                label="Người tham gia"
                values={selectedProducts.map(p => {
                  const parts = PRODUCT_DETAILS[p.id]?.participants ?? 0;
                  return (
                    <span key={p.id} className="flex items-center gap-1">
                      <Users size={10} color={c.text3} />
                      <span style={{ fontSize: 11 }}>{parts.toLocaleString()}</span>
                    </span>
                  );
                })}
              />

              {/* Early withdrawal */}
              <ComparisonRow
                label="Rút sớm"
                highlight
                values={selectedProducts.map(p => {
                  const detail = PRODUCT_DETAILS[p.id];
                  const isGood = detail?.earlyWithdrawal === 'Bất kỳ lúc nào';
                  return (
                    <span key={p.id} style={{
                      color: isGood ? '#10B981' : '#F59E0B',
                      fontSize: 10, fontWeight: 600,
                    }}>
                      {detail?.earlyWithdrawal ?? '—'}
                    </span>
                  );
                })}
              />

              {/* Interest payout */}
              <ComparisonRow
                label="Trả lãi"
                values={selectedProducts.map(p =>
                  PRODUCT_DETAILS[p.id]?.interestPayout ?? '—'
                )}
              />

              {/* Auto-compound */}
              <ComparisonRow
                label="Lãi kép"
                values={selectedProducts.map(p => {
                  const val = PRODUCT_DETAILS[p.id]?.compounding ?? 'Không';
                  return val === 'Tự động'
                    ? <Check size={14} color="#10B981" key={p.id} />
                    : <X size={14} color={c.text3} key={p.id} />;
                })}
              />

              {/* Insurance */}
              <ComparisonRow
                label="Bảo hiểm"
                highlight
                values={selectedProducts.map(p => {
                  const ins = PRODUCT_DETAILS[p.id]?.insurance ?? false;
                  return ins
                    ? <Shield size={14} color="#3B82F6" key={p.id} />
                    : <X size={14} color={c.text3} key={p.id} />;
                })}
              />

              {/* Quota */}
              <ComparisonRow
                label="Quota còn lại"
                values={selectedProducts.map(p => (
                  <span key={p.id} style={{ fontSize: 10, fontWeight: 500 }}>
                    {p.remainingQuota}
                  </span>
                ))}
              />

              {/* Total subscribed */}
              <ComparisonRow
                label="Tổng đã ký"
                highlight
                values={selectedProducts.map(p => (
                  <span key={p.id} style={{ fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }}>
                    {p.totalSubscribed}
                  </span>
                ))}
              />
            </TrCard>
          </PageSection>
        )}

        {/* ─── Feature Comparison ─── */}
        {selectedProducts.length >= 2 && (
          <PageSection label="Tính năng nổi bật" accentColor="#8B5CF6">
            <div className="flex flex-col gap-2">
              {selectedProducts.map(product => {
                const detail = PRODUCT_DETAILS[product.id];
                return (
                  <TrCard key={product.id} className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: product.color + '22' }}
                      >
                        <span style={{ color: product.color, fontSize: 7, fontWeight: 700 }}>
                          {product.asset.slice(0, 3)}
                        </span>
                      </div>
                      <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        {product.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {detail?.features.map((feat, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg"
                          style={{ background: c.surface2, fontSize: 10, color: c.text2, fontWeight: 500 }}
                        >
                          <Check size={9} color="#10B981" />
                          {feat}
                        </span>
                      ))}
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </PageSection>
        )}

        {/* ─── Empty State ─── */}
        {selectedProducts.length < 2 && (
          <TrCard className="p-6 text-center">
            <ArrowLeftRight size={32} color={c.text3} className="mx-auto mb-3" />
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
              Chọn ít nhất 2 sản phẩm
            </p>
            <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>
              Thêm sản phẩm để bắt đầu so sánh chi tiết các chỉ số
            </p>
            <button
              onClick={() => { setShowPicker(true); hapticSelection(); }}
              className="mx-auto mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 12, fontWeight: 600 }}
            >
              <Plus size={14} />
              Thêm sản phẩm
            </button>
          </TrCard>
        )}

        {/* ─── Disclaimer ─── */}
        <div
          className="flex items-start gap-2 rounded-xl p-3"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <Info size={13} color="#3B82F6" className="mt-0.5 shrink-0" />
          <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            APY có thể thay đổi theo điều kiện thị trường. Dữ liệu so sánh mang tính tham khảo,
            không phải cam kết lợi nhuận. Vui lòng đọc kỹ điều khoản từng sản phẩm trước khi đăng ký.
          </span>
        </div>
      </PageContent>
    </PageLayout>
  );
}