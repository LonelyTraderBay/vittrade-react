import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { fmtAmount, fmtUsd } from '@/shared/lib/formatNumber';
import { ORDER_TYPE_ADVANCED, ORDER_TYPE_BASIC, PCT_BUTTONS } from './trading-order-config';
import { TradingFeeNotice } from './TradingFeeNotice';
import { OCOOrderForm, type OCOOrderParams } from './OCOOrderForm';
import { TPSLForm, type TPSLValues } from './TPSLForm';
import type { MarketPair } from '@/features/market';

interface TradingOrderEntryPanelProps {
  pair: MarketPair;
  available: number;
  availableLabel: string;
  side: 'buy' | 'sell';
  setSide: (side: 'buy' | 'sell') => void;
  orderTypeId: string;
  setOrderTypeId: (orderTypeId: string) => void;
  isMarket: boolean;
  limitPrice: string;
  setLimitPrice: (price: string) => void;
  amount: string;
  amountNum: number;
  setAmount: (amount: string) => void;
  activePct: number | null;
  setActivePct: (percentage: number | null) => void;
  handlePct: (percentage: number) => void;
  tpsl: TPSLValues;
  setTpsl: (values: TPSLValues) => void;
  livePrice: number;
  effectivePrice: number;
  defaultBracketMode: boolean;
  total: number;
  canPlace: boolean;
  canWriteTrading: boolean;
  onRequestConfirmation: () => void;
  onSubmitOco: (params: OCOOrderParams) => void | Promise<void>;
  onCancelOco: () => void;
}

export function TradingOrderEntryPanel({
  pair,
  available,
  availableLabel,
  side,
  setSide,
  orderTypeId,
  setOrderTypeId,
  isMarket,
  limitPrice,
  setLimitPrice,
  amount,
  amountNum,
  setAmount,
  activePct,
  setActivePct,
  handlePct,
  tpsl,
  setTpsl,
  livePrice,
  effectivePrice,
  defaultBracketMode,
  total,
  canPlace,
  canWriteTrading,
  onRequestConfirmation,
  onSubmitOco,
  onCancelOco,
}: TradingOrderEntryPanelProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [showAdvancedTypes, setShowAdvancedTypes] = useState(false);
  const [trailingDelta, setTrailingDelta] = useState('2');
  const sideColor = side === 'buy' ? '#10B981' : '#EF4444';
  const formatNum = (value: string) => value.replace(/[^\d.]/g, '');
  return (
    <PageContent gap="default">
      {/* Buy / Sell Toggle */}
      <div
        className="flex rounded-xl overflow-hidden"
        style={{ border: `1px solid ${c.borderSolid}` }}
      >
        <button
          onClick={() => {
            setSide('buy');
            hapticSelection();
          }}
          className="flex-1 h-11 flex items-center justify-center font-bold transition-all"
          style={{
            background: side === 'buy' ? '#10B981' : c.surface2,
            color: side === 'buy' ? '#fff' : c.text2,
            fontSize: 14,
          }}
        >
          MUA
        </button>
        <button
          onClick={() => {
            setSide('sell');
            hapticSelection();
          }}
          className="flex-1 h-11 flex items-center justify-center font-bold transition-all"
          style={{
            background: side === 'sell' ? '#EF4444' : c.surface2,
            color: side === 'sell' ? '#fff' : c.text2,
            fontSize: 14,
          }}
        >
          BÁN
        </button>
      </div>

      {/* Order Type Chips — Basic + Advanced toggle (Sprint 2B) */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {ORDER_TYPE_BASIC.map((type) => {
            const isActive = orderTypeId === type.id;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setOrderTypeId(type.id);
                  hapticSelection();
                }}
                className="px-4 py-2 rounded-lg transition-all hover-chip"
                style={{
                  background: isActive ? sideColor + '1A' : c.surface2,
                  color: isActive ? sideColor : c.text2,
                  border: `1px solid ${isActive ? sideColor + '66' : c.borderSolid}`,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {type.label}
              </button>
            );
          })}
          <button
            aria-label={showAdvancedTypes ? 'Ẩn loại lệnh nâng cao' : 'Hiện loại lệnh nâng cao'}
            aria-expanded={showAdvancedTypes}
            aria-controls="advanced-order-types"
            onClick={() => {
              setShowAdvancedTypes(!showAdvancedTypes);
              hapticSelection();
            }}
            className="px-3 py-2 rounded-lg"
            style={{
              background: showAdvancedTypes ? 'rgba(139,92,246,0.1)' : c.surface2,
              color: showAdvancedTypes ? '#8B5CF6' : c.text3,
              border: `1px solid ${showAdvancedTypes ? 'rgba(139,92,246,0.3)' : c.borderSolid}`,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {showAdvancedTypes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Advanced order types row */}
        {showAdvancedTypes && (
          <div id="advanced-order-types" className="flex gap-2">
            {ORDER_TYPE_ADVANCED.map((type) => {
              const isActive = orderTypeId === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setOrderTypeId(type.id);
                    hapticSelection();
                  }}
                  className="px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: isActive ? 'rgba(139,92,246,0.15)' : c.surface2,
                    color: isActive ? '#8B5CF6' : c.text2,
                    border: `1px solid ${isActive ? 'rgba(139,92,246,0.4)' : c.borderSolid}`,
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Balance */}
      <div className="flex items-center justify-between">
        <span style={{ color: c.text2, fontSize: 13 }}>Khả dụng</span>
        <span style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
          {fmtAmount(available, side === 'buy' ? 2 : 6)}{' '}
          <span style={{ color: c.text2 }}>{availableLabel}</span>
        </span>
      </div>

      {/* ═══ OCO ORDER FORM — replaces standard form when OCO selected ═══ */}
      {orderTypeId === 'oco' ? (
        <OCOOrderForm
          side={side}
          symbol={pair.symbol}
          baseAsset={pair.baseAsset}
          currentPrice={livePrice}
          available={available}
          canWriteTrading={canWriteTrading}
          onSubmit={onSubmitOco}
          onCancel={onCancelOco}
        />
      ) : (
        <>
          {/* Limit Price Input (non-market orders) */}
          {!isMarket && orderTypeId !== 'trailing' && (
            <div>
              <label
                htmlFor="trade-limit-price"
                style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}
              >
                {orderTypeId === 'stop' || orderTypeId === 'stop-limit'
                  ? 'Giá kích hoạt'
                  : 'Giá đặt'}{' '}
                (USDT)
              </label>
              <div
                className="flex items-center rounded-xl px-4"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.borderSolid}`,
                  height: 52,
                }}
              >
                <input
                  id="trade-limit-price"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(formatNum(e.target.value))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: c.text1,
                    fontSize: 20,
                    flex: 1,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                />
                <span style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>USDT</span>
              </div>
            </div>
          )}

          {/* Stop-Limit: second price input */}
          {orderTypeId === 'stop-limit' && (
            <div>
              <label
                htmlFor="trade-stop-limit-price"
                style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}
              >
                Giá đặt (USDT)
              </label>
              <div
                className="flex items-center rounded-xl px-4"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.borderSolid}`,
                  height: 52,
                }}
              >
                <input
                  id="trade-stop-limit-price"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(formatNum(e.target.value))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: c.text1,
                    fontSize: 20,
                    flex: 1,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                />
                <span style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>USDT</span>
              </div>
            </div>
          )}

          {/* Trailing Stop: Delta input (Sprint 2B) */}
          {orderTypeId === 'trailing' && (
            <div>
              <label
                htmlFor="trade-trailing-delta"
                style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}
              >
                Trailing Delta (%)
              </label>
              <div
                className="flex items-center rounded-xl px-4"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.borderSolid}`,
                  height: 52,
                }}
              >
                <input
                  id="trade-trailing-delta"
                  type="number"
                  inputMode="decimal"
                  placeholder="2.0"
                  value={trailingDelta}
                  onChange={(e) => setTrailingDelta(formatNum(e.target.value))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: c.text1,
                    fontSize: 20,
                    flex: 1,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                />
                <span style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>%</span>
              </div>
              <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>
                Stop sẽ tự động điều chỉnh theo giá tốt nhất, kích hoạt khi giá đảo chiều{' '}
                {trailingDelta}%.
              </p>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label
              htmlFor="trade-amount"
              style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}
            >
              Khối lượng ({pair.baseAsset})
            </label>
            <div
              className="flex items-center rounded-xl px-4"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                height: 52,
              }}
            >
              <input
                id="trade-amount"
                data-testid="trade-amount"
                type="number"
                inputMode="decimal"
                placeholder="0.000000"
                value={amount}
                onChange={(e) => {
                  setAmount(formatNum(e.target.value));
                  setActivePct(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: c.text1,
                  fontSize: 20,
                  flex: 1,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              />
              <span style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>
                {pair.baseAsset}
              </span>
            </div>
          </div>

          {/* Percentage Quick Buttons */}
          <div className="flex gap-2">
            {PCT_BUTTONS.map((pct) => (
              <button
                key={pct}
                onClick={() => handlePct(pct)}
                className="flex-1 py-2 rounded-lg transition-all hover-chip"
                style={{
                  background: activePct === pct ? sideColor + '1A' : c.surface2,
                  color: activePct === pct ? sideColor : c.text2,
                  border: `1px solid ${activePct === pct ? sideColor + '66' : c.borderSolid}`,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* TP/SL Form (Sprint 1B) */}
          <TPSLForm
            side={side}
            entryPrice={effectivePrice}
            amount={amountNum}
            values={tpsl}
            onChange={setTpsl}
            defaultBracketMode={defaultBracketMode}
          />

          {/* Total + Fee Summary — Dynamic Fee Tier (Sprint 2B) */}
          <TrCard rounded="sm" className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span style={{ color: c.text2, fontSize: 13 }}>Thành tiền</span>
              <span
                style={{
                  color: c.text1,
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                {fmtUsd(total)}
              </span>
            </div>
            <TradingFeeNotice />
          </TrCard>

          {/* Place Order Button */}
          <button
            onClick={onRequestConfirmation}
            disabled={!canPlace}
            className="w-full h-13 rounded-xl flex items-center justify-center font-bold text-white transition-all ripple"
            style={{
              height: 52,
              background: !canPlace
                ? c.surface2
                : side === 'buy'
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)',
              color: !canPlace ? c.text3 : '#fff',
              boxShadow: !canPlace
                ? 'none'
                : side === 'buy'
                  ? '0 4px 16px rgba(16,185,129,0.25)'
                  : '0 4px 16px rgba(239,68,68,0.25)',
              fontSize: 16,
            }}
            aria-label={`Đặt lệnh ${side === 'buy' ? 'mua' : 'bán'} ${pair.symbol}`}
          >
            {!canPlace
              ? 'Nhập thông tin lệnh'
              : `${side === 'buy' ? 'Mua' : 'Bán'} ${pair.baseAsset}`}
          </button>

          {!canWriteTrading && (
            <p role="alert" style={{ color: c.warning, fontSize: 12, textAlign: 'center' }}>
              Trading permission is required to place an order.
            </p>
          )}

          <p style={{ color: c.text3, fontSize: 12, textAlign: 'center', lineHeight: 1.5 }}>
            Kiểm tra kỹ trước khi xác nhận.
          </p>
        </>
      )}
    </PageContent>
  );
}
