import React, { useMemo } from 'react';
import {
  Eye, Shield, Clock, CheckCircle, ChevronDown, ChevronUp,
  CreditCard, Star, Users, Radio, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fmtVnd, fmtAbsPct } from '../../data/formatNumber';
import { φ } from '../../utils/golden';
import { TrCard } from '../ui/TrCard';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
interface LivePreviewProps {
  c: Record<string, any>;
  expanded: boolean;
  onToggle: () => void;
  adType: 'buy' | 'sell';
  asset: string;
  currency: string;
  priceType: 'fixed' | 'floating';
  effectivePrice: number;
  priceDiff: number;
  priceMargin: string;
  totalAmount: string;
  minLimit: string;
  maxLimit: string;
  selectedPayments: string[];
  paymentWindow: string;
  tradingHours: string;
  termsNote: string;
  reqKyc: boolean;
  reqKycLevel: string;
  reqMinTrades: string;
  reqMinDays: string;
  isValid: boolean;
}

/* ═══════════════════════════════════════════════════════════
   Completion Score
   ═══════════════════════════════════════════════════════════ */
function useCompletionScore(props: LivePreviewProps) {
  return useMemo(() => {
    const checks = [
      { label: 'Giá', done: props.effectivePrice > 0 },
      { label: 'Số lượng', done: parseFloat(props.totalAmount || '0') > 0 },
      { label: 'Giới hạn', done: parseFloat(props.minLimit || '0') > 0 && parseFloat(props.maxLimit || '0') > 0 },
      { label: 'Thanh toán', done: props.selectedPayments.length > 0 },
    ];
    const done = checks.filter(c => c.done).length;
    return { checks, done, total: checks.length, pct: Math.round((done / checks.length) * 100) };
  }, [props.effectivePrice, props.totalAmount, props.minLimit, props.maxLimit, props.selectedPayments]);
}

/* ═══════════════════════════════════════════════════════════
   Live Preview Section Component
   Realtime marketplace card preview + completion progress
   ═══════════════════════════════════════════════════════════ */
export function LivePreviewSection(props: LivePreviewProps) {
  const { c, expanded, onToggle } = props;
  const { checks, done, total, pct } = useCompletionScore(props);

  const tradeColor = props.adType === 'buy' ? '#10B981' : '#EF4444';
  const hasAnyData = props.effectivePrice > 0 || parseFloat(props.totalAmount || '0') > 0 || props.selectedPayments.length > 0;

  return (
    <div>
      {/* ─── Header Bar ─── */}
      <button
        onClick={onToggle}
        className="w-full rounded-2xl overflow-hidden"
        style={{ border: `1.5px solid ${props.isValid ? tradeColor + '40' : c.borderSolid}`, transition: 'border-color 0.3s ease' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: c.surface2 }}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Eye size={15} color={tradeColor} />
              {/* Pulsing LIVE dot */}
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: '#10B981' }}
              />
            </div>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              Live Preview
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-xs"
              style={{
                background: '#10B981' + '18',
                color: '#10B981',
                fontWeight: 700,
                fontSize: 9,
              }}
            >
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Completion badge */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: pct === 100 ? '#10B981' + '18' : c.surface3,
                }}
              >
                <span style={{
                  color: pct === 100 ? '#10B981' : c.text3,
                  fontSize: 8,
                  fontWeight: 700,
                }}>
                  {pct}%
                </span>
              </div>
            </div>
            {expanded ? (
              <ChevronUp size={14} color={c.text3} />
            ) : (
              <ChevronDown size={14} color={c.text3} />
            )}
          </div>
        </div>

        {/* Compact summary (always visible when collapsed) */}
        {!expanded && hasAnyData && (
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: c.surface }}>
            <span
              className="px-2 py-0.5 rounded-md text-xs"
              style={{
                background: tradeColor + '15',
                color: tradeColor,
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              {props.adType === 'buy' ? 'MUA' : 'BÁN'}
            </span>
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
              {props.effectivePrice > 0 ? fmtVnd(props.effectivePrice) : '—'}
            </span>
            <span style={{ color: c.text3, fontSize: 10 }}>
              {props.currency}/{props.asset}
            </span>
            <div className="flex-1" />
            <span style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace' }}>
              {props.totalAmount || '0'} {props.asset}
            </span>
          </div>
        )}
      </button>

      {/* ─── Expanded Full Preview ─── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 flex flex-col gap-3">
              {/* Completion Checklist */}
              <div className="flex items-center gap-2">
                {checks.map(ch => (
                  <div key={ch.label} className="flex items-center gap-1">
                    <CheckCircle
                      size={10}
                      color={ch.done ? '#10B981' : c.text3}
                      fill={ch.done ? 'rgba(16,185,129,0.15)' : 'transparent'}
                    />
                    <span style={{
                      color: ch.done ? '#10B981' : c.text3,
                      fontSize: 9,
                      fontWeight: ch.done ? 600 : 400,
                    }}>
                      {ch.label}
                    </span>
                  </div>
                ))}
                <div className="flex-1" />
                <span style={{ color: pct === 100 ? '#10B981' : c.text3, fontSize: 9, fontWeight: 600 }}>
                  {done}/{total}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                <motion.div
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: pct === 100 ? '#10B981' : '#3B82F6' }}
                />
              </div>

              {/* ─── Marketplace Card Preview ─── */}
              <div className="rounded-xl p-0.5" style={{ background: `linear-gradient(135deg, ${hexToRgba(tradeColor, 30)}, ${c.borderSolid})` }}>
                <TrCard className="p-4 !rounded-[10px]">
                  {/* Merchant Row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
                    >
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>T</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Tôi</span>
                        <Shield size={12} color="#3B82F6" fill="rgba(59,130,246,0.2)" />
                        <div className="flex gap-0.5">
                          <Star size={9} fill="#F59E0B" color="#F59E0B" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ color: c.text3, fontSize: 10 }}>42 đơn</span>
                        <span style={{ color: c.text3, fontSize: 10 }}>95% HT</span>
                        <span style={{ color: '#10B981', fontSize: 10 }}>Online</span>
                      </div>
                    </div>
                    <span
                      className="px-2 py-1 rounded-lg text-xs"
                      style={{
                        background: tradeColor + '12',
                        color: tradeColor,
                        fontWeight: 700,
                      }}
                    >
                      {props.adType === 'buy' ? 'MUA' : 'BÁN'}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <motion.span
                        key={props.effectivePrice}
                        initial={{ opacity: 0.5, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          color: c.text1,
                          fontSize: 22,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}
                      >
                        {props.effectivePrice > 0 ? fmtVnd(props.effectivePrice) : '—'}
                      </motion.span>
                      <span style={{ color: c.text2, fontSize: 12 }}>
                        {props.currency}/{props.asset}
                      </span>
                    </div>
                    {props.priceType === 'floating' && (
                      <span
                        className="inline-block mt-1 px-1.5 py-0.5 rounded text-xs"
                        style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7', fontWeight: 600 }}
                      >
                        Thả nổi {props.priceMargin || '0'}%
                      </span>
                    )}
                    {props.effectivePrice > 0 && props.priceDiff !== 0 && (
                      <span
                        className="inline-block ml-2 text-xs"
                        style={{ color: props.priceDiff >= 0 ? '#10B981' : '#EF4444', fontWeight: 600, fontSize: 10 }}
                      >
                        {props.priceDiff >= 0 ? '▲' : '▼'} {fmtAbsPct(props.priceDiff)}
                      </span>
                    )}
                  </div>

                  {/* Amount & Limits */}
                  <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
                    <div>
                      <p style={{ color: c.text3, fontSize: 9 }}>Khả dụng</p>
                      <motion.p
                        key={props.totalAmount}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}
                      >
                        {props.totalAmount || '0'} {props.asset}
                      </motion.p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text3, fontSize: 9 }}>Giới hạn</p>
                      <p style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace' }}>
                        {fmtVnd(parseFloat(props.minLimit || '0'))} – {fmtVnd(parseFloat(props.maxLimit || '0'))}
                      </p>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="mb-3">
                    {props.selectedPayments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {props.selectedPayments.map(pm => (
                          <motion.span
                            key={pm}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="px-2 py-1 rounded-lg text-xs"
                            style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontWeight: 600, fontSize: 10 }}
                          >
                            {pm}
                          </motion.span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 py-1">
                        <CreditCard size={10} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: 10, fontStyle: 'italic' }}>
                          Chưa chọn thanh toán
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom info row */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock size={9} color={c.text3} />
                      <span style={{ color: c.text3, fontSize: 9 }}>{props.paymentWindow}m</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Radio size={9} color={c.text3} />
                      <span style={{ color: c.text3, fontSize: 9 }}>{props.tradingHours}</span>
                    </div>
                    {props.reqKyc && (
                      <div className="flex items-center gap-1">
                        <Shield size={9} color="#3B82F6" />
                        <span style={{ color: '#3B82F6', fontSize: 9 }}>KYC {props.reqKycLevel}+</span>
                      </div>
                    )}
                    {parseFloat(props.reqMinTrades || '0') > 0 && (
                      <div className="flex items-center gap-1">
                        <Users size={9} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: 9 }}>{props.reqMinTrades}+ đơn</span>
                      </div>
                    )}
                  </div>

                  {/* Terms note */}
                  {props.termsNote && (
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                        {props.termsNote.length > 80
                          ? props.termsNote.slice(0, 80) + '...'
                          : props.termsNote}
                      </p>
                    </div>
                  )}
                </TrCard>
              </div>

              {/* Valid indicator */}
              {props.isValid ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <CheckCircle size={12} color="#10B981" />
                  <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                    Quảng cáo sẵn sàng đăng! Nhấn nút bên dưới để tiếp tục.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <AlertTriangle size={12} color="#F59E0B" />
                  <span style={{ color: '#F59E0B', fontSize: 10 }}>
                    Điền đầy đủ: {checks.filter(ch => !ch.done).map(ch => ch.label).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
