/**
 * ══════════════════════════════════════════════════════════════════
 *  TP/SL FORM — Sprint 1B: Take Profit / Stop Loss Integration
 * ══════════════════════════════════════════════════════════════════
 *  Collapsible TP/SL inputs for Spot order form
 *  - Take Profit price + estimated gain
 *  - Stop Loss price + estimated loss
 *  - Risk:Reward ratio visualization
 *  - Bracket order mode (TP + SL as package)
 */

import React, { useState, useMemo } from 'react';
import { Target, Shield, ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { fmtPrice, fmtUsd, fmtPct } from '../../data/formatNumber';

export interface TPSLValues {
  enabled: boolean;
  tpPrice: string;
  slPrice: string;
  tpTriggerType: 'last' | 'mark';
  slTriggerType: 'last' | 'mark';
  bracketMode?: boolean;
}

interface TPSLFormProps {
  side: 'buy' | 'sell';
  currentPrice: number;
  entryPrice: number; // limit price or market price
  amount: number;
  baseAsset: string;
  values: TPSLValues;
  onChange: (values: TPSLValues) => void;
  defaultBracketMode?: boolean;
}

export function TPSLForm({
  side,
  currentPrice,
  entryPrice,
  amount,
  baseAsset,
  values,
  onChange,
  defaultBracketMode = false,
}: TPSLFormProps) {
  const c = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const isBracket = values.bracketMode ?? defaultBracketMode;

  const tpNum = parseFloat(values.tpPrice || '0');
  const slNum = parseFloat(values.slPrice || '0');

  const calc = useMemo(() => {
    if (!entryPrice || !amount) return null;

    const tpPnl = side === 'buy'
      ? (tpNum - entryPrice) * amount
      : (entryPrice - tpNum) * amount;
    const slPnl = side === 'buy'
      ? (slNum - entryPrice) * amount
      : (entryPrice - slNum) * amount;

    const tpPct = entryPrice > 0 ? ((tpNum - entryPrice) / entryPrice) * 100 * (side === 'buy' ? 1 : -1) : 0;
    const slPct = entryPrice > 0 ? ((slNum - entryPrice) / entryPrice) * 100 * (side === 'buy' ? 1 : -1) : 0;

    const reward = Math.abs(tpPnl);
    const risk = Math.abs(slPnl);
    const rrRatio = risk > 0 ? reward / risk : 0;

    return { tpPnl, slPnl, tpPct, slPct, rrRatio, reward, risk };
  }, [side, entryPrice, amount, tpNum, slNum]);

  // Validation
  const tpValid = tpNum === 0 || (side === 'buy' ? tpNum > entryPrice : tpNum < entryPrice);
  const slValid = slNum === 0 || (side === 'buy' ? slNum < entryPrice : slNum > entryPrice);

  const handleToggle = () => {
    if (values.enabled) {
      onChange({ ...values, enabled: false, tpPrice: '', slPrice: '', bracketMode: false });
      setExpanded(false);
    } else {
      onChange({ ...values, enabled: true, bracketMode: defaultBracketMode });
      setExpanded(true);
    }
  };

  const toggleBracket = () => {
    onChange({ ...values, bracketMode: !isBracket });
  };

  const sideColor = side === 'buy' ? '#10B981' : '#EF4444';

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle header */}
      <button
        onClick={handleToggle}
        className="flex items-center justify-between py-2 px-3 rounded-xl transition-all"
        style={{
          background: values.enabled ? `${sideColor}0D` : c.surface2,
          border: `1px solid ${values.enabled ? `${sideColor}33` : c.borderSolid}`,
        }}
      >
        <div className="flex items-center gap-2">
          <Shield size={14} color={values.enabled ? sideColor : c.text3} />
          <span style={{ color: values.enabled ? sideColor : c.text2, fontSize: 13, fontWeight: 600 }}>
            {isBracket ? 'Bracket Order' : 'TP/SL'}
          </span>
          <span style={{ color: c.text3, fontSize: 11 }}>
            {isBracket ? 'TP + SL bắt buộc' : 'Take Profit / Stop Loss'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {values.enabled && calc && calc.rrRatio > 0 && (
            <span style={{
              color: calc.rrRatio >= 2 ? '#10B981' : calc.rrRatio >= 1 ? '#F59E0B' : '#EF4444',
              fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
            }}>
              R:R {calc.rrRatio.toFixed(1)}
            </span>
          )}
          <div
            className="w-9 h-5 rounded-full relative transition-all"
            style={{
              background: values.enabled ? sideColor : c.surface3,
            }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: values.enabled ? 18 : 2 }}
            />
          </div>
        </div>
      </button>

      {/* Expanded form */}
      {values.enabled && (
        <div className="flex flex-col gap-3">
          {/* Bracket mode toggle */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1"
              style={{ color: c.text3, fontSize: 12 }}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Thu gọn' : 'Mở rộng'}
            </button>
            <button
              onClick={toggleBracket}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all"
              style={{
                background: isBracket ? 'rgba(139,92,246,0.12)' : c.surface2,
                border: `1px solid ${isBracket ? 'rgba(139,92,246,0.3)' : c.borderSolid}`,
                color: isBracket ? '#8B5CF6' : c.text3,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Shield size={10} />
              Bracket {isBracket ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Bracket mode info */}
          {isBracket && (
            <div className="flex items-start gap-1.5 rounded-lg px-2.5 py-2"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <Info size={11} color="#8B5CF6" className="shrink-0 mt-0.5" />
              <span style={{ color: '#8B5CF6', fontSize: 11, lineHeight: 1.4 }}>
                Bracket Order: cả Take Profit và Stop Loss sẽ được đặt đồng thời. Khi một lệnh khớp, lệnh còn lại tự hủy.
              </span>
            </div>
          )}

          {/* Bracket validation warning */}
          {isBracket && values.enabled && (tpNum === 0 || slNum === 0) && (
            <div className="flex items-start gap-1.5 rounded-lg px-2.5 py-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <AlertTriangle size={11} color="#F59E0B" className="shrink-0 mt-0.5" />
              <span style={{ color: '#F59E0B', fontSize: 11, lineHeight: 1.4 }}>
                Bracket mode yêu cầu cả TP và SL. {tpNum === 0 && 'Thiếu Take Profit. '}{slNum === 0 && 'Thiếu Stop Loss.'}
              </span>
            </div>
          )}

          {/* TP Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1" style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                <Target size={12} />
                Take Profit (USDT)
              </label>
              {calc && tpNum > 0 && (
                <span style={{ color: '#10B981', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>
                  {fmtPct(calc.tpPct)} ({fmtUsd(calc.tpPnl, { prefix: true })})
                </span>
              )}
            </div>
            <div
              className="flex items-center rounded-xl px-3"
              style={{
                background: c.surface2,
                border: `1px solid ${!tpValid ? '#EF4444' : c.borderSolid}`,
                height: 44,
              }}
            >
              <input
                type="number"
                inputMode="decimal"
                placeholder={side === 'buy' ? `> ${fmtPrice(entryPrice)}` : `< ${fmtPrice(entryPrice)}`}
                value={values.tpPrice}
                onChange={e => onChange({ ...values, tpPrice: e.target.value.replace(/[^\d.]/g, '') })}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: c.text1, fontSize: 16, flex: 1,
                  fontFamily: 'monospace', fontWeight: 600,
                }}
              />
              <span style={{ color: c.text3, fontSize: 12 }}>USDT</span>
            </div>
            {!tpValid && (
              <p style={{ color: '#EF4444', fontSize: 11, marginTop: 2 }}>
                TP phải {side === 'buy' ? 'cao hơn' : 'thấp hơn'} giá vào
              </p>
            )}
          </div>

          {/* SL Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1" style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>
                <Shield size={12} />
                Stop Loss (USDT)
              </label>
              {calc && slNum > 0 && (
                <span style={{ color: '#EF4444', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>
                  {fmtPct(calc.slPct)} ({fmtUsd(calc.slPnl, { prefix: true })})
                </span>
              )}
            </div>
            <div
              className="flex items-center rounded-xl px-3"
              style={{
                background: c.surface2,
                border: `1px solid ${!slValid ? '#EF4444' : c.borderSolid}`,
                height: 44,
              }}
            >
              <input
                type="number"
                inputMode="decimal"
                placeholder={side === 'buy' ? `< ${fmtPrice(entryPrice)}` : `> ${fmtPrice(entryPrice)}`}
                value={values.slPrice}
                onChange={e => onChange({ ...values, slPrice: e.target.value.replace(/[^\d.]/g, '') })}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: c.text1, fontSize: 16, flex: 1,
                  fontFamily: 'monospace', fontWeight: 600,
                }}
              />
              <span style={{ color: c.text3, fontSize: 12 }}>USDT</span>
            </div>
            {!slValid && (
              <p style={{ color: '#EF4444', fontSize: 11, marginTop: 2 }}>
                SL phải {side === 'buy' ? 'thấp hơn' : 'cao hơn'} giá vào
              </p>
            )}
          </div>

          {/* R:R Visualization (expanded only) */}
          {expanded && calc && tpNum > 0 && slNum > 0 && (
            <TrCard rounded="sm" className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: 12 }}>Risk : Reward</span>
                <span style={{
                  color: calc.rrRatio >= 2 ? '#10B981' : calc.rrRatio >= 1 ? '#F59E0B' : '#EF4444',
                  fontSize: 14, fontWeight: 700, fontFamily: 'monospace',
                }}>
                  1 : {calc.rrRatio.toFixed(2)}
                </span>
              </div>
              {/* Visual bar */}
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                <div
                  className="rounded-l-full"
                  style={{
                    background: '#EF4444',
                    flex: calc.risk,
                    minWidth: 4,
                  }}
                />
                <div
                  className="rounded-r-full"
                  style={{
                    background: '#10B981',
                    flex: calc.reward,
                    minWidth: 4,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span style={{ color: '#EF4444', fontSize: 10 }}>
                  Risk: {fmtUsd(calc.risk)}
                </span>
                <span style={{ color: '#10B981', fontSize: 10 }}>
                  Reward: {fmtUsd(calc.reward)}
                </span>
              </div>

              {/* Guidance */}
              {calc.rrRatio < 1 && (
                <div className="flex items-start gap-1.5 mt-2 px-2 py-1.5 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <AlertTriangle size={11} color="#EF4444" className="mt-0.5 shrink-0" />
                  <span style={{ color: '#EF4444', fontSize: 10, lineHeight: 1.4 }}>
                    R:R thấp hơn 1:1. Rủi ro cao hơn phần thưởng tiềm năng.
                  </span>
                </div>
              )}
            </TrCard>
          )}

          {/* Quick presets (expanded only) */}
          {expanded && entryPrice > 0 && (
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Preset nhanh</p>
              <div className="flex gap-2">
                {[
                  { label: '1:1', tp: 1, sl: 1 },
                  { label: '1:2', tp: 2, sl: 1 },
                  { label: '1:3', tp: 3, sl: 1 },
                ].map(preset => {
                  const diff = entryPrice * 0.02; // 2% base
                  const tpTarget = side === 'buy'
                    ? entryPrice + diff * preset.tp
                    : entryPrice - diff * preset.tp;
                  const slTarget = side === 'buy'
                    ? entryPrice - diff * preset.sl
                    : entryPrice + diff * preset.sl;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => onChange({
                        ...values,
                        tpPrice: tpTarget.toFixed(2),
                        slPrice: slTarget.toFixed(2),
                      })}
                      className="flex-1 py-1.5 rounded-lg text-center transition-all"
                      style={{
                        background: c.surface2,
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text2,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      R:R {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}