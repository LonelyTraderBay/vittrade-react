import React, { useState, useMemo } from 'react';
import {
  X, Info, AlertTriangle, Clock, Layers, Split,
  TrendingUp, TrendingDown, Check, ChevronDown, Shield,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ══════════════════════════════════════════════════════════
 *  WebAdvancedOrders — OCO + TWAP + Iceberg Panel
 * ══════════════════════════════════════════════════════════
 *
 *  Advanced order types for the Web Trading Terminal:
 *  ● OCO (One-Cancels-Other): TP + SL linked pair
 *  ● TWAP (Time-Weighted Average Price): split into slices
 *  ● Iceberg: hidden total qty, visible portion only
 */

type AdvancedOrderType = 'oco' | 'twap' | 'iceberg';

interface WebAdvancedOrdersProps {
  open: boolean;
  onClose: () => void;
  livePrice: number;
  symbol: string;
  baseAsset: string;
}

export function WebAdvancedOrders({ open, onClose, livePrice, symbol, baseAsset }: WebAdvancedOrdersProps) {
  const c = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [orderType, setOrderType] = useState<AdvancedOrderType>('oco');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');

  // OCO state
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [ocoAmount, setOcoAmount] = useState('');

  // TWAP state
  const [twapTotal, setTwapTotal] = useState('');
  const [twapSlices, setTwapSlices] = useState('5');
  const [twapDuration, setTwapDuration] = useState('30'); // minutes
  const [twapVariance, setTwapVariance] = useState('0.1'); // % price variance

  // Iceberg state
  const [iceTotal, setIceTotal] = useState('');
  const [iceVisible, setIceVisible] = useState('');
  const [icePrice, setIcePrice] = useState('');

  // Submission state
  const [submitted, setSubmitted] = useState(false);

  const panelBg = isDark ? '#13151D' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const sideColor = side === 'buy' ? '#10B981' : '#EF4444';
  const fmt = (v: string) => v.replace(/[^\d.]/g, '');

  // OCO calculations
  const ocoCalc = useMemo(() => {
    const tp = parseFloat(tpPrice || '0');
    const sl = parseFloat(slPrice || '0');
    const amt = parseFloat(ocoAmount || '0');
    if (!tp || !sl || !amt) return null;
    const tpPnl = side === 'buy' ? (tp - livePrice) * amt : (livePrice - tp) * amt;
    const slPnl = side === 'buy' ? (sl - livePrice) * amt : (livePrice - sl) * amt;
    const rr = Math.abs(tpPnl / slPnl);
    return { tpPnl, slPnl, rr, tpDist: ((tp - livePrice) / livePrice * 100), slDist: ((sl - livePrice) / livePrice * 100) };
  }, [tpPrice, slPrice, ocoAmount, livePrice, side]);

  // TWAP calculations
  const twapCalc = useMemo(() => {
    const total = parseFloat(twapTotal || '0');
    const slices = parseInt(twapSlices || '1');
    const dur = parseInt(twapDuration || '1');
    if (!total || !slices) return null;
    const perSlice = total / slices;
    const intervalMin = dur / slices;
    return { perSlice, intervalMin, estCost: total * livePrice, slices, dur };
  }, [twapTotal, twapSlices, twapDuration, livePrice]);

  // Iceberg calculations
  const iceCalc = useMemo(() => {
    const total = parseFloat(iceTotal || '0');
    const visible = parseFloat(iceVisible || '0');
    const price = parseFloat(icePrice || '0');
    if (!total || !visible || !price) return null;
    const waves = Math.ceil(total / visible);
    return { waves, hiddenPct: ((total - visible) / total * 100), estTotal: total * price };
  }, [iceTotal, iceVisible, icePrice]);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  if (!open) return null;

  const InputField = ({ label, value, onChange, suffix, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string;
  }) => (
    <div>
      <label style={{ color: c.text3, fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 3 }}>{label}</label>
      <div className="flex items-center rounded-lg px-2.5"
        style={{ background: inputBg, border: `1px solid ${inputBorder}`, height: 32 }}>
        <input type="number" inputMode="decimal" placeholder={placeholder || '0.00'} value={value}
          onChange={e => onChange(fmt(e.target.value))}
          className="flex-1 bg-transparent outline-none"
          style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }} />
        {suffix && <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>{suffix}</span>}
      </div>
    </div>
  );

  const TypeTab = ({ id, label, icon: Icon }: { id: AdvancedOrderType; label: string; icon: React.ComponentType<any> }) => (
    <button onClick={() => setOrderType(id)}
      className="flex-1 py-1.5 flex items-center justify-center gap-1 rounded-md transition-colors"
      style={{
        background: orderType === id ? 'rgba(59,130,246,0.1)' : 'transparent',
        border: `1px solid ${orderType === id ? 'rgba(59,130,246,0.25)' : inputBorder}`,
        color: orderType === id ? '#3B82F6' : c.text3,
        fontSize: 10, fontWeight: 600,
      }}>
      <Icon size={10} /> {label}
    </button>
  );

  return (
    <div className="absolute right-0 top-0 z-30 flex flex-col rounded-lg shadow-xl overflow-hidden"
      style={{
        width: 340, maxHeight: 520,
        background: panelBg, border: `1px solid ${panelBorder}`,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${panelBorder}` }}>
        <div className="flex items-center gap-2">
          <Layers size={14} color="#3B82F6" />
          <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Lệnh nâng cao</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: inputBg }}>
          <X size={12} color={c.text3} />
        </button>
      </div>

      {/* Submitted overlay */}
      {submitted && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2"
          style={{ background: isDark ? 'rgba(15,17,23,0.95)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: sideColor + '15' }}>
            <Check size={24} color={sideColor} />
          </div>
          <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
            Lệnh {orderType.toUpperCase()} đã gửi
          </span>
          <span style={{ color: c.text3, fontSize: 11 }}>{symbol} · {side === 'buy' ? 'MUA' : 'BÁN'}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-none px-3 py-2 flex flex-col gap-2.5">

        {/* Type tabs */}
        <div className="flex gap-1">
          <TypeTab id="oco" label="OCO" icon={Split} />
          <TypeTab id="twap" label="TWAP" icon={Clock} />
          <TypeTab id="iceberg" label="Iceberg" icon={Layers} />
        </div>

        {/* Side toggle */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${inputBorder}` }}>
          <button onClick={() => setSide('buy')}
            className="flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors"
            style={{ background: side === 'buy' ? '#10B981' : 'transparent', color: side === 'buy' ? '#fff' : c.text3, fontSize: 11, fontWeight: 700 }}>
            <TrendingUp size={10} /> MUA
          </button>
          <button onClick={() => setSide('sell')}
            className="flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors"
            style={{ background: side === 'sell' ? '#EF4444' : 'transparent', color: side === 'sell' ? '#fff' : c.text3, fontSize: 11, fontWeight: 700 }}>
            <TrendingDown size={10} /> BÁN
          </button>
        </div>

        {/* Current price */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md" style={{ background: inputBg }}>
          <span style={{ color: c.text3, fontSize: 10 }}>Giá hiện tại</span>
          <span style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            ${livePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* ═══ OCO Form ═══ */}
        {orderType === 'oco' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-md"
              style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <Info size={10} color="#3B82F6" className="shrink-0 mt-0.5" />
              <span style={{ color: c.text3, fontSize: 9 }}>
                OCO: Khi một lệnh khớp, lệnh còn lại tự hủy. Đặt Take Profit + Stop Loss cùng lúc.
              </span>
            </div>

            <InputField label="Khối lượng" value={ocoAmount} onChange={setOcoAmount} suffix={baseAsset} />

            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid rgba(16,185,129,0.15)` }}>
              <div className="flex items-center gap-1 px-2 py-1" style={{ background: 'rgba(16,185,129,0.04)' }}>
                <TrendingUp size={10} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>Take Profit</span>
              </div>
              <div className="px-2 py-1.5">
                <InputField label="Giá TP (USDT)" value={tpPrice} onChange={setTpPrice} suffix="USDT"
                  placeholder={(livePrice * (side === 'buy' ? 1.05 : 0.95)).toFixed(2)} />
              </div>
            </div>

            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid rgba(239,68,68,0.15)` }}>
              <div className="flex items-center gap-1 px-2 py-1" style={{ background: 'rgba(239,68,68,0.04)' }}>
                <TrendingDown size={10} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 700 }}>Stop Loss</span>
              </div>
              <div className="px-2 py-1.5">
                <InputField label="Giá SL (USDT)" value={slPrice} onChange={setSlPrice} suffix="USDT"
                  placeholder={(livePrice * (side === 'buy' ? 0.97 : 1.03)).toFixed(2)} />
              </div>
            </div>

            {/* OCO Summary */}
            {ocoCalc && (
              <div className="rounded-lg p-2" style={{ background: inputBg, border: `1px solid ${panelBorder}` }}>
                <div className="flex justify-between py-0.5">
                  <span style={{ color: c.text3, fontSize: 10 }}>TP Profit</span>
                  <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    +${Math.abs(ocoCalc.tpPnl).toFixed(2)} ({ocoCalc.tpDist > 0 ? '+' : ''}{ocoCalc.tpDist.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span style={{ color: c.text3, fontSize: 10 }}>SL Loss</span>
                  <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    -${Math.abs(ocoCalc.slPnl).toFixed(2)} ({ocoCalc.slDist > 0 ? '+' : ''}{ocoCalc.slDist.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex justify-between py-0.5" style={{ borderTop: `1px dashed ${panelBorder}` }}>
                  <span style={{ color: c.text3, fontSize: 10 }}>Risk/Reward</span>
                  <span style={{
                    color: ocoCalc.rr >= 2 ? '#10B981' : ocoCalc.rr >= 1 ? '#F59E0B' : '#EF4444',
                    fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                  }}>1:{ocoCalc.rr.toFixed(2)}</span>
                </div>
                {ocoCalc.rr < 1 && (
                  <div className="flex items-center gap-1 mt-1 px-1.5 py-1 rounded"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <AlertTriangle size={8} color="#F59E0B" />
                    <span style={{ color: '#F59E0B', fontSize: 9 }}>R/R &lt; 1:1 — rủi ro cao hơn lợi nhuận kỳ vọng</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ TWAP Form ═══ */}
        {orderType === 'twap' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-md"
              style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <Clock size={10} color="#3B82F6" className="shrink-0 mt-0.5" />
              <span style={{ color: c.text3, fontSize: 8 }}>
                TWAP: Chia lệnh lớn thành nhiều phần nhỏ, thực hiện đều trong khoảng thời gian để giảm tác động giá.
              </span>
            </div>

            <InputField label={`Tổng khối lượng (${baseAsset})`} value={twapTotal} onChange={setTwapTotal} suffix={baseAsset} />

            <div className="flex gap-2">
              <div className="flex-1">
                <label style={{ color: c.text3, fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 3 }}>Số phần</label>
                <div className="flex gap-0.5">
                  {['3', '5', '10', '20'].map(n => (
                    <button key={n} onClick={() => setTwapSlices(n)}
                      className="flex-1 py-1 rounded text-center transition-colors"
                      style={{
                        background: twapSlices === n ? 'rgba(59,130,246,0.1)' : inputBg,
                        border: `1px solid ${twapSlices === n ? 'rgba(59,130,246,0.2)' : inputBorder}`,
                        color: twapSlices === n ? '#3B82F6' : c.text3,
                        fontSize: 10, fontWeight: 600,
                      }}>{n}</button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ color: c.text3, fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 3 }}>Thời gian (phút)</label>
              <div className="flex gap-0.5">
                {['15', '30', '60', '120', '240'].map(m => (
                  <button key={m} onClick={() => setTwapDuration(m)}
                    className="flex-1 py-1 rounded text-center transition-colors"
                    style={{
                      background: twapDuration === m ? 'rgba(59,130,246,0.1)' : inputBg,
                      border: `1px solid ${twapDuration === m ? 'rgba(59,130,246,0.2)' : inputBorder}`,
                      color: twapDuration === m ? '#3B82F6' : c.text3,
                      fontSize: 10, fontWeight: 600,
                    }}>{parseInt(m) >= 60 ? `${parseInt(m) / 60}h` : `${m}m`}</button>
                ))}
              </div>
            </div>

            <InputField label="Biên độ giá tối đa (%)" value={twapVariance} onChange={setTwapVariance} suffix="%" placeholder="0.1" />

            {/* TWAP Summary */}
            {twapCalc && (
              <div className="rounded-lg p-2" style={{ background: inputBg, border: `1px solid ${panelBorder}` }}>
                <div className="flex justify-between py-0.5">
                  <span style={{ color: c.text3, fontSize: 10 }}>Mỗi phần</span>
                  <span style={{ color: c.text1, fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {twapCalc.perSlice.toFixed(6)} {baseAsset}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span style={{ color: c.text3, fontSize: 10 }}>Khoảng cách</span>
                  <span style={{ color: c.text2, fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                    {twapCalc.intervalMin.toFixed(1)} phút/phần
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span style={{ color: c.text3, fontSize: 10 }}>Ước tính tổng</span>
                  <span style={{ color: c.text1, fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    ≈ ${twapCalc.estCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Visual timeline */}
                <div className="mt-2 pt-2" style={{ borderTop: `1px dashed ${panelBorder}` }}>
                  <span style={{ color: c.text3, fontSize: 8, fontWeight: 600 }}>Timeline</span>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: Math.min(twapCalc.slices, 10) }).map((_, i) => (
                      <div key={i} className="flex-1 h-1.5 rounded-full" style={{
                        background: `rgba(59,130,246,${0.15 + (i / twapCalc.slices) * 0.5})`,
                      }} />
                    ))}
                    {twapCalc.slices > 10 && (
                      <span style={{ color: c.text3, fontSize: 7 }}>+{twapCalc.slices - 10}</span>
                    )}
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span style={{ color: c.text3, fontSize: 7 }}>Bắt đầu</span>
                    <span style={{ color: c.text3, fontSize: 7 }}>
                      {twapCalc.dur >= 60 ? `${(twapCalc.dur / 60).toFixed(1)}h` : `${twapCalc.dur}m`} sau
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Iceberg Form ═══ */}
        {orderType === 'iceberg' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-md"
              style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <Layers size={10} color="#3B82F6" className="shrink-0 mt-0.5" />
              <span style={{ color: c.text3, fontSize: 8 }}>
                Iceberg: Ẩn tổng khối lượng thực, chỉ hiện một phần trên sổ lệnh. Giảm tác động thị trường cho lệnh lớn.
              </span>
            </div>

            <InputField label="Giá giới hạn (USDT)" value={icePrice} onChange={setIcePrice} suffix="USDT"
              placeholder={livePrice.toFixed(2)} />
            <InputField label={`Tổng khối lượng thực (${baseAsset})`} value={iceTotal} onChange={setIceTotal} suffix={baseAsset} />
            <InputField label={`Khối lượng hiển thị (${baseAsset})`} value={iceVisible} onChange={setIceVisible} suffix={baseAsset} />

            {/* Iceberg Summary */}
            {iceCalc && (
              <div className="rounded-lg p-2" style={{ background: inputBg, border: `1px solid ${panelBorder}` }}>
                <div className="flex justify-between py-0.5">
                  <span style={{ color: c.text3, fontSize: 10 }}>Số đợt hiển thị</span>
                  <span style={{ color: c.text1, fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {iceCalc.waves} waves
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span style={{ color: c.text3, fontSize: 10 }}>Phần ẩn</span>
                  <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {iceCalc.hiddenPct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-0.5" style={{ borderTop: `1px dashed ${panelBorder}` }}>
                  <span style={{ color: c.text3, fontSize: 10 }}>Ước tính tổng</span>
                  <span style={{ color: c.text1, fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    ${iceCalc.estTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Visual iceberg */}
                <div className="mt-2 flex items-end gap-0.5 h-8">
                  <div className="flex-1 rounded-t" style={{ height: '40%', background: 'rgba(59,130,246,0.3)' }} />
                  <div className="flex-1 rounded-t relative" style={{ height: '100%' }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-t"
                      style={{ height: `${100 - iceCalc.hiddenPct}%`, background: 'rgba(59,130,246,0.3)' }} />
                    <div className="absolute bottom-0 left-0 right-0 rounded-t"
                      style={{ height: '100%', background: 'rgba(59,130,246,0.08)', borderTop: '1px dashed rgba(59,130,246,0.3)' }} />
                  </div>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span style={{ color: '#3B82F6', fontSize: 8 }}>Hiển thị</span>
                  <span style={{ color: c.text3, fontSize: 8 }}>Ẩn</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit button */}
        <button onClick={handleSubmit}
          disabled={
            (orderType === 'oco' && !ocoCalc) ||
            (orderType === 'twap' && !twapCalc) ||
            (orderType === 'iceberg' && !iceCalc)
          }
          className="w-full py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
          style={{
            background: (
              (orderType === 'oco' && !ocoCalc) ||
              (orderType === 'twap' && !twapCalc) ||
              (orderType === 'iceberg' && !iceCalc)
            ) ? inputBg : (side === 'buy'
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)'),
            color: (
              (orderType === 'oco' && !ocoCalc) ||
              (orderType === 'twap' && !twapCalc) ||
              (orderType === 'iceberg' && !iceCalc)
            ) ? c.text3 : '#fff',
            fontSize: 12, fontWeight: 700,
            boxShadow: sideColor + '30 0 4px 12px',
          }}>
          <Shield size={12} />
          {side === 'buy' ? 'MUA' : 'BÁN'} {orderType.toUpperCase()} · {symbol}
        </button>
      </div>
    </div>
  );
}