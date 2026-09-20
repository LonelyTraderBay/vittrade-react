import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ, φSpace } from '../../utils/golden';
import { TrCard } from '../ui/TrCard';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════════════════════
   ClaimSLATracker — Real-time Countdown with Smooth Animations
   ═══════════════════════════════════════════════════════════ */

interface ClaimSLATrackerProps {
  status: 'pending' | 'reviewing';
  submittedAt: string;
  estimatedReview: string;
  /** Deterministic "now" for demo purposes, defaults to 2026-03-04T12:00:00 */
  nowOverride?: string;
}

interface TimeBreakdown {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function getTimeBreakdown(ms: number): TimeBreakdown {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalMs: Math.max(0, ms) };
}

function padTwo(n: number): string {
  return n.toString().padStart(2, '0');
}

/* ─── Animated Digit — pure CSS transition, no AnimatePresence ─── */
function AnimatedDigit({ value, color }: { value: string; color: string }) {
  const prevRef = useRef(value);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      setTransitioning(true);
      const t = setTimeout(() => {
        setTransitioning(false);
        prevRef.current = value;
      }, 250);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      style={{
        color,
        fontSize: 24,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'ui-monospace, monospace',
        display: 'inline-block',
        transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease',
        transform: transitioning ? 'translateY(-2px)' : 'translateY(0)',
        opacity: transitioning ? 0.7 : 1,
      }}
    >
      {value}
    </span>
  );
}

export function ClaimSLATracker({
  status,
  submittedAt,
  estimatedReview,
  nowOverride = '2026-03-04T12:00:00',
}: ClaimSLATrackerProps) {
  const c = useThemeColors();
  const [mounted, setMounted] = useState(false);

  // Use deterministic base time, then add elapsed seconds for live ticking
  const [tickOffset, setTickOffset] = useState(0);

  useEffect(() => {
    // Delay mount animation
    const mt = requestAnimationFrame(() => setMounted(true));
    const interval = setInterval(() => {
      setTickOffset(prev => prev + 1);
    }, 1000);
    return () => {
      cancelAnimationFrame(mt);
      clearInterval(interval);
    };
  }, []);

  const baseNow = new Date(nowOverride).getTime();
  const currentMs = baseNow + tickOffset * 1000;
  const submitted = new Date(submittedAt).getTime();
  const deadline = new Date(estimatedReview).getTime();

  const totalDuration = deadline - submitted;
  const elapsed = currentMs - submitted;
  const remaining = Math.max(0, deadline - currentMs);
  const progressPct = Math.min(100, (elapsed / totalDuration) * 100);

  const isOverdue = remaining <= 0;
  const isUrgent = !isOverdue && remaining <= 6 * 60 * 60 * 1000;
  const isWarning = !isOverdue && !isUrgent && remaining <= 12 * 60 * 60 * 1000;

  const time = getTimeBreakdown(remaining);

  const slaLabel = status === 'pending' ? 'Xem xét ban đầu (48h)' : 'Xử lý claim (72h)';
  const phaseColor = isOverdue ? '#EF4444' : isUrgent ? '#EF4444' : isWarning ? '#F59E0B' : '#3B82F6';
  const phaseBg = isOverdue ? 'rgba(239,68,68,0.06)' : isUrgent ? 'rgba(239,68,68,0.06)' : isWarning ? 'rgba(245,158,11,0.06)' : 'rgba(59,130,246,0.06)';
  const PhaseIcon = isOverdue ? AlertTriangle : isUrgent ? Zap : Clock;

  const statusMessage = isOverdue
    ? 'Quá hạn SLA — đang ưu tiên xử lý'
    : isUrgent
      ? 'Sắp hết hạn — đang xử lý gấp'
      : isWarning
        ? 'Cần xử lý sớm'
        : 'Đang trong thời hạn';

  const progressGradient = isOverdue
    ? 'linear-gradient(90deg, #EF4444, #DC2626)'
    : isUrgent
      ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
      : isWarning
        ? 'linear-gradient(90deg, #3B82F6, #F59E0B)'
        : 'linear-gradient(90deg, #3B82F6, #60A5FA)';

  const slaPhases = [
    { phase: 'Tiếp nhận', time: '0-2h', done: elapsed > 2 * 3600000 },
    { phase: 'Xem xét ban đầu', time: '2-24h', done: elapsed > 24 * 3600000 },
    { phase: 'Điều tra chi tiết', time: '24-48h', done: elapsed > 48 * 3600000 },
    { phase: 'Quyết định', time: '48-72h', done: elapsed > 72 * 3600000 },
  ];

  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.45s cubic-bezier(0.16,1,0.3,1), transform 0.45s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <TrCard className="p-4" style={{ border: `1.5px solid ${hexToRgba(phaseColor, 20)}` }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PhaseIcon size={14} color={phaseColor} />
            <span style={{ color: phaseColor, fontSize: φ.sm, fontWeight: 700 }}>
              SLA Tracker
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ background: phaseBg }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: phaseColor,
                animation: isOverdue || isUrgent ? 'sla-pulse 1.5s infinite ease-in-out' : 'none',
              }}
            />
            <span style={{ color: phaseColor, fontSize: 10, fontWeight: 600 }}>
              {status === 'pending' ? 'Chờ xem xét' : 'Đang xử lý'}
            </span>
          </div>
        </div>

        {/* Countdown Display */}
        <div
          className="flex items-center justify-center gap-2 py-4 rounded-xl mb-3"
          style={{ background: phaseBg }}
        >
          {isOverdue ? (
            <div className="flex flex-col items-center gap-1">
              <AlertTriangle size={24} color="#EF4444" />
              <span style={{ color: '#EF4444', fontSize: φ.base, fontWeight: 700, lineHeight: 1.3 }}>
                Quá hạn SLA
              </span>
              <span style={{ color: '#EF4444', fontSize: 11, lineHeight: 1.5 }}>
                Đang được ưu tiên xử lý
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 56,
                    height: 52,
                    background: c.surface,
                    border: `1.5px solid ${hexToRgba(phaseColor, 30)}`,
                    boxShadow: `0 2px 8px ${hexToRgba(phaseColor, 15)}`,
                  }}
                >
                  <AnimatedDigit value={padTwo(time.hours)} color={phaseColor} />
                </div>
                <span style={{ color: c.text3, fontSize: 9, marginTop: 4, fontWeight: 600 }}>GIO</span>
              </div>

              <span
                style={{
                  color: phaseColor, fontSize: 20, fontWeight: 700, marginBottom: 12,
                  animation: 'sla-blink 1s infinite',
                }}
              >
                :
              </span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 56,
                    height: 52,
                    background: c.surface,
                    border: `1.5px solid ${hexToRgba(phaseColor, 30)}`,
                    boxShadow: `0 2px 8px ${hexToRgba(phaseColor, 15)}`,
                  }}
                >
                  <AnimatedDigit value={padTwo(time.minutes)} color={phaseColor} />
                </div>
                <span style={{ color: c.text3, fontSize: 9, marginTop: 4, fontWeight: 600 }}>PHUT</span>
              </div>

              <span
                style={{
                  color: phaseColor, fontSize: 20, fontWeight: 700, marginBottom: 12,
                  animation: 'sla-blink 1s infinite',
                }}
              >
                :
              </span>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 56,
                    height: 52,
                    background: c.surface,
                    border: `1.5px solid ${hexToRgba(phaseColor, 30)}`,
                    boxShadow: `0 2px 8px ${hexToRgba(phaseColor, 15)}`,
                  }}
                >
                  <AnimatedDigit value={padTwo(time.seconds)} color={phaseColor} />
                </div>
                <span style={{ color: c.text3, fontSize: 9, marginTop: 4, fontWeight: 600 }}>GIAY</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar — CSS animated */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>
              {slaLabel}
            </span>
            <span style={{ color: phaseColor, fontSize: 10, fontWeight: 700 }}>
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: c.surface2 }}>
            <div
              className="h-full rounded-full"
              style={{
                width: mounted ? `${Math.min(100, progressPct)}%` : '0%',
                background: progressGradient,
                transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          </div>
        </div>

        {/* SLA Phases — Staggered entrance via CSS */}
        <div className="flex flex-col gap-1.5 pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
          {slaPhases.map((step, idx) => (
            <div
              key={step.phase}
              className="flex items-center justify-between py-1"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateX(0)' : 'translateX(-10px)',
                transition: `opacity 0.35s ease ${0.08 * idx}s, transform 0.35s cubic-bezier(0.16,1,0.3,1) ${0.08 * idx}s`,
              }}
            >
              <div className="flex items-center gap-2">
                {step.done ? (
                  <CheckCircle size={12} color="#10B981" />
                ) : (
                  <div
                    className="w-3 h-3 rounded-full border-2"
                    style={{ borderColor: c.text3 }}
                  />
                )}
                <span style={{
                  color: step.done ? '#10B981' : c.text2,
                  fontSize: 11,
                  fontWeight: step.done ? 600 : 500,
                  lineHeight: 1.5,
                }}>
                  {step.phase}
                </span>
              </div>
              <span style={{ color: c.text3, fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                {step.time}
              </span>
            </div>
          ))}
        </div>

        {/* Status message */}
        <div
          className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
          style={{
            background: phaseBg,
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.4s ease 0.35s',
          }}
        >
          <PhaseIcon size={12} color={phaseColor} />
          <span style={{ color: phaseColor, fontSize: 11, fontWeight: 600 }}>
            {statusMessage}
          </span>
        </div>

        {/* CSS animations */}
        <style>{`
          @keyframes sla-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(0.8); }
          }
          @keyframes sla-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </TrCard>
    </div>
  );
}