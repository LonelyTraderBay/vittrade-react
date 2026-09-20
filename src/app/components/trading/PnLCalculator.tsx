import React, { useState, useMemo } from 'react';
import {
  Calculator, X, ArrowUpDown, TrendingUp, TrendingDown, Info, RotateCcw,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ══════════════════════════════════════════════════════════
 *  PnLCalculator — Floating profit/loss calculator overlay
 * ══════════════════════════════════════════════════════════
 *
 *  ● Entry price, exit price, quantity inputs
 *  ● Long/Short direction toggle
 *  ● Live PnL, ROI%, break-even calculation
 *  ● Fee deduction option (maker/taker)
 *  ● Visual profit/loss indicator with color coding
 */

interface PnLCalculatorProps {
  open: boolean;
  onClose: () => void;
  livePrice: number;
  symbol: string;
  baseAsset: string;
}

type Direction = 'long' | 'short';

const FEE_RATES = [
  { label: 'Không phí', rate: 0 },
  { label: 'Maker 0.1%', rate: 0.001 },
  { label: 'Taker 0.1%', rate: 0.001 },
  { label: 'VIP 0.05%', rate: 0.0005 },
];

export function PnLCalculator({ open, onClose, livePrice, symbol, baseAsset }: PnLCalculatorProps) {
  const c = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [direction, setDirection] = useState<Direction>('long');
  const [entryPrice, setEntryPrice] = useState(livePrice.toFixed(2));
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [feeIndex, setFeeIndex] = useState(1); // Maker 0.1%

  const calc = useMemo(() => {
    const entry = parseFloat(entryPrice || '0');
    const exit = parseFloat(exitPrice || '0');
    const qty = parseFloat(quantity || '0');
    const lev = parseFloat(leverage || '1');
    const feeRate = FEE_RATES[feeIndex].rate;

    if (!entry || !exit || !qty) return null;

    const positionSize = entry * qty;
    const exitSize = exit * qty;

    // PnL before fees
    const rawPnL = direction === 'long'
      ? (exit - entry) * qty * lev
      : (entry - exit) * qty * lev;

    // Fees (entry + exit)
    const totalFee = (positionSize + exitSize) * feeRate;

    const netPnL = rawPnL - totalFee;
    const roi = positionSize > 0 ? (netPnL / positionSize) * 100 : 0;

    // Break-even price (where net PnL = 0, accounting for fees)
    const feeFactor = 1 + feeRate; // approx
    let breakEven: number;
    if (direction === 'long') {
      breakEven = entry * feeFactor / (1 - feeRate);
    } else {
      breakEven = entry * (2 - feeFactor) / (1 + feeRate);
    }

    // Liquidation price (for leveraged)
    let liquidation: number | null = null;
    if (lev > 1) {
      const maintenanceMargin = 0.005; // 0.5%
      if (direction === 'long') {
        liquidation = entry * (1 - (1 / lev) + maintenanceMargin);
      } else {
        liquidation = entry * (1 + (1 / lev) - maintenanceMargin);
      }
    }

    return {
      rawPnL,
      totalFee,
      netPnL,
      roi,
      positionSize,
      breakEven: parseFloat(breakEven.toFixed(2)),
      liquidation: liquidation ? parseFloat(liquidation.toFixed(2)) : null,
      isProfit: netPnL >= 0,
    };
  }, [entryPrice, exitPrice, quantity, leverage, direction, feeIndex]);

  const handleReset = () => {
    setEntryPrice(livePrice.toFixed(2));
    setExitPrice('');
    setQuantity('');
    setLeverage('1');
  };

  const handleSwapPrices = () => {
    const temp = entryPrice;
    setEntryPrice(exitPrice);
    setExitPrice(temp);
  };

  const panelBg = isDark ? '#13151D' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const fmt = (v: string) => v.replace(/[^\d.]/g, '');

  if (!open) return null;

  const InputField = ({ label, value, onChange, suffix, placeholder, highlight }: {
    label: string; value: string; onChange: (v: string) => void;
    suffix?: string; placeholder?: string; highlight?: boolean;
  }) => (
    <div>
      <label style={{ color: c.text3, fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 3 }}>{label}</label>
      <div className="flex items-center rounded-lg px-2.5"
        style={{
          background: inputBg,
          border: `1px solid ${highlight ? '#3B82F6' + '40' : inputBorder}`,
          height: 32,
        }}>
        <input type="number" inputMode="decimal" placeholder={placeholder || '0.00'} value={value}
          onChange={e => onChange(fmt(e.target.value))}
          className="flex-1 bg-transparent outline-none"
          style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }} />
        {suffix && <span style={{ color: c.text3, fontSize: 10, fontWeight: 600, marginLeft: 4 }}>{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="absolute right-0 top-0 z-30 flex flex-col rounded-lg shadow-xl overflow-hidden"
      style={{
        width: 320,
        background: panelBg,
        border: `1px solid ${panelBorder}`,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 shrink-0"
        style={{ borderBottom: `1px solid ${panelBorder}` }}>
        <div className="flex items-center gap-2">
          <Calculator size={14} color="#8B5CF6" />
          <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Tính lãi/lỗ</span>
          <span style={{ color: c.text3, fontSize: 10 }}>{symbol}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleReset}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ background: inputBg }} title="Reset">
            <RotateCcw size={11} color={c.text3} />
          </button>
          <button onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ background: inputBg }}>
            <X size={12} color={c.text3} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-3 py-2 flex flex-col gap-2.5">

        {/* Direction toggle */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${inputBorder}` }}>
          <button onClick={() => setDirection('long')}
            className="flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors"
            style={{
              background: direction === 'long' ? 'rgba(16,185,129,0.12)' : 'transparent',
              color: direction === 'long' ? '#10B981' : c.text3,
              fontSize: 11, fontWeight: 700,
            }}>
            <TrendingUp size={11} /> Long
          </button>
          <button onClick={() => setDirection('short')}
            className="flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors"
            style={{
              background: direction === 'short' ? 'rgba(239,68,68,0.12)' : 'transparent',
              color: direction === 'short' ? '#EF4444' : c.text3,
              fontSize: 11, fontWeight: 700,
            }}>
            <TrendingDown size={11} /> Short
          </button>
        </div>

        {/* Entry / Exit prices with swap */}
        <div className="relative flex flex-col gap-2">
          <InputField label="Giá vào lệnh (USDT)" value={entryPrice} onChange={setEntryPrice} suffix="USDT" highlight />
          <button onClick={handleSwapPrices}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-colors"
            style={{ background: panelBg, border: `1px solid ${panelBorder}`, marginTop: 2 }}>
            <ArrowUpDown size={11} color="#3B82F6" />
          </button>
          <InputField label="Giá thoát lệnh (USDT)" value={exitPrice} onChange={setExitPrice} suffix="USDT"
            placeholder={livePrice.toFixed(2)} />
        </div>

        {/* Quantity */}
        <InputField label={`Khối lượng (${baseAsset})`} value={quantity} onChange={setQuantity} suffix={baseAsset} />

        {/* Leverage + Fee row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label style={{ color: c.text3, fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 3 }}>Đòn bẩy</label>
            <div className="flex items-center gap-1">
              {['1', '2', '5', '10', '20'].map(lv => (
                <button key={lv} onClick={() => setLeverage(lv)}
                  className="flex-1 py-1 rounded text-center transition-colors"
                  style={{
                    background: leverage === lv ? 'rgba(139,92,246,0.12)' : inputBg,
                    border: `1px solid ${leverage === lv ? 'rgba(139,92,246,0.3)' : inputBorder}`,
                    color: leverage === lv ? '#8B5CF6' : c.text3,
                    fontSize: 10, fontWeight: 600,
                  }}>{lv}x</button>
              ))}
            </div>
          </div>
        </div>

        {/* Fee selector */}
        <div>
          <label style={{ color: c.text3, fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 3 }}>Phí giao dịch</label>
          <div className="flex gap-1">
            {FEE_RATES.map((f, i) => (
              <button key={i} onClick={() => setFeeIndex(i)}
                className="flex-1 py-1 rounded text-center transition-colors"
                style={{
                  background: feeIndex === i ? 'rgba(59,130,246,0.08)' : inputBg,
                  border: `1px solid ${feeIndex === i ? 'rgba(59,130,246,0.2)' : inputBorder}`,
                  color: feeIndex === i ? '#3B82F6' : c.text3,
                  fontSize: 9, fontWeight: 600,
                }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* ─── Results ─── */}
        {calc ? (
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${panelBorder}` }}>
            {/* Main PnL display */}
            <div className="px-3 py-3 text-center"
              style={{
                background: calc.isProfit
                  ? (isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.04)')
                  : (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)'),
              }}>
              <div style={{ color: c.text3, fontSize: 10, fontWeight: 600, marginBottom: 4 }}>
                Lãi / Lỗ ròng ({direction === 'long' ? 'Long' : 'Short'} {leverage}x)
              </div>
              <div style={{
                color: calc.isProfit ? '#10B981' : '#EF4444',
                fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              }}>
                {calc.isProfit ? '+' : ''}{calc.netPnL < 0 ? '-' : ''}${Math.abs(calc.netPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="px-1.5 py-0.5 rounded" style={{
                  background: calc.isProfit ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: calc.isProfit ? '#10B981' : '#EF4444',
                  fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                }}>
                  ROI: {calc.isProfit ? '+' : ''}{calc.roi.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Detail rows */}
            <div className="px-3 py-2" style={{ borderTop: `1px solid ${panelBorder}` }}>
              <div className="flex justify-between py-1">
                <span style={{ color: c.text3, fontSize: 10 }}>Vốn vào lệnh</span>
                <span style={{ color: c.text2, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                  ${calc.positionSize.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: c.text3, fontSize: 10 }}>Lãi/lỗ gộp</span>
                <span style={{
                  color: calc.rawPnL >= 0 ? '#10B981' : '#EF4444',
                  fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                }}>
                  {calc.rawPnL >= 0 ? '+' : ''}${calc.rawPnL.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="flex items-center gap-0.5" style={{ color: c.text3, fontSize: 10 }}>
                  Phí (vào+ra) <Info size={8} />
                </span>
                <span style={{ color: '#F59E0B', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                  -${calc.totalFee.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between py-1" style={{ borderTop: `1px dashed ${panelBorder}` }}>
                <span style={{ color: c.text3, fontSize: 10 }}>Giá hòa vốn</span>
                <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  ${calc.breakEven.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {calc.liquidation && (
                <div className="flex justify-between py-1">
                  <span className="flex items-center gap-0.5" style={{ color: '#EF4444', fontSize: 10 }}>
                    <AlertTriangleIcon /> Giá thanh lý
                  </span>
                  <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    ${calc.liquidation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg py-6 flex flex-col items-center justify-center gap-1.5"
            style={{ background: inputBg, border: `1px solid ${panelBorder}` }}>
            <Calculator size={18} color={c.text3} style={{ opacity: 0.3 }} />
            <span style={{ color: c.text3, fontSize: 11 }}>Nhập giá và khối lượng để tính</span>
          </div>
        )}

        {/* Use live price hint */}
        <button onClick={() => setExitPrice(livePrice.toFixed(2))}
          className="w-full py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors"
          style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>
          Dùng giá hiện tại (${livePrice.toFixed(2)}) làm giá thoát
        </button>
      </div>
    </div>
  );
}

// Inline alert triangle icon to avoid import conflict
function AlertTriangleIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  );
}