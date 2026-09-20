import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell, BellRing, Plus, Trash2, ChevronUp, ChevronDown,
  Volume2, VolumeX, X, Check,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ══════════════════════════════════════════════════════════
 *  PriceAlertPanel — Live price trigger notification system
 * ══════════════════════════════════════════════════════════
 *
 *  ● Set alerts above/below target price
 *  ● Live detection against livePrice
 *  ● Visual flash + toast when triggered
 *  ● Persistent alert list with active/triggered state
 */

interface PriceAlert {
  id: string;
  targetPrice: number;
  direction: 'above' | 'below';
  note: string;
  status: 'active' | 'triggered';
  createdAt: number;
  triggeredAt?: number;
}

interface PriceAlertPanelProps {
  open: boolean;
  onClose: () => void;
  livePrice: number;
  symbol: string;
  onAlertTriggered?: (alert: PriceAlert) => void;
}

let alertIdCounter = 0;

export function PriceAlertPanel({ open, onClose, livePrice, symbol, onAlertTriggered }: PriceAlertPanelProps) {
  const c = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [note, setNote] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [flashId, setFlashId] = useState<string | null>(null);

  const prevPriceRef = useRef(livePrice);

  // ─── Live alert detection ───
  useEffect(() => {
    const prev = prevPriceRef.current;
    prevPriceRef.current = livePrice;

    setAlerts(currentAlerts => {
      let changed = false;
      const updated = currentAlerts.map(a => {
        if (a.status !== 'active') return a;
        const triggered =
          (a.direction === 'above' && prev < a.targetPrice && livePrice >= a.targetPrice) ||
          (a.direction === 'below' && prev > a.targetPrice && livePrice <= a.targetPrice);
        if (triggered) {
          changed = true;
          setFlashId(a.id);
          setTimeout(() => setFlashId(null), 2000);
          onAlertTriggered?.(a);
          return { ...a, status: 'triggered' as const, triggeredAt: Date.now() };
        }
        return a;
      });
      return changed ? updated : currentAlerts;
    });
  }, [livePrice, onAlertTriggered]);

  const handleAdd = () => {
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) return;
    const newAlert: PriceAlert = {
      id: `alert_${++alertIdCounter}`,
      targetPrice: price,
      direction,
      note: note.trim(),
      status: 'active',
      createdAt: Date.now(),
    };
    setAlerts(prev => [newAlert, ...prev]);
    setTargetPrice('');
    setNote('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleClearTriggered = () => {
    setAlerts(prev => prev.filter(a => a.status !== 'triggered'));
  };

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const triggeredCount = alerts.filter(a => a.status === 'triggered').length;

  const panelBg = isDark ? '#13151D' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  if (!open) return null;

  return (
    <div className="absolute right-0 top-0 z-30 flex flex-col rounded-lg shadow-xl overflow-hidden"
      style={{
        width: 320, maxHeight: 480,
        background: panelBg,
        border: `1px solid ${panelBorder}`,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 shrink-0"
        style={{ borderBottom: `1px solid ${panelBorder}` }}>
        <div className="flex items-center gap-2">
          <Bell size={14} color="#F59E0B" />
          <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Cảnh báo giá</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 10, fontWeight: 700 }}>{activeCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSoundOn(!soundOn)}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ background: inputBg }}>
            {soundOn ? <Volume2 size={12} color={c.text3} /> : <VolumeX size={12} color="#EF4444" />}
          </button>
          <button onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ background: inputBg }}>
            <X size={12} color={c.text3} />
          </button>
        </div>
      </div>

      {/* Current price */}
      <div className="flex items-center justify-between px-3.5 py-2" style={{ background: inputBg }}>
        <span style={{ color: c.text3, fontSize: 11 }}>Giá hiện tại {symbol}</span>
        <span style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          ${livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Add alert form */}
      {showForm ? (
        <div className="px-3.5 py-2.5 flex flex-col gap-2" style={{ borderBottom: `1px solid ${panelBorder}` }}>
          <div className="flex gap-1.5">
            <button onClick={() => setDirection('above')}
              className="flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors"
              style={{
                background: direction === 'above' ? 'rgba(16,185,129,0.1)' : 'transparent',
                border: `1px solid ${direction === 'above' ? 'rgba(16,185,129,0.3)' : inputBorder}`,
                color: direction === 'above' ? '#10B981' : c.text3,
                fontSize: 11, fontWeight: 600,
              }}>
              <ChevronUp size={11} /> Trên
            </button>
            <button onClick={() => setDirection('below')}
              className="flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors"
              style={{
                background: direction === 'below' ? 'rgba(239,68,68,0.1)' : 'transparent',
                border: `1px solid ${direction === 'below' ? 'rgba(239,68,68,0.3)' : inputBorder}`,
                color: direction === 'below' ? '#EF4444' : c.text3,
                fontSize: 11, fontWeight: 600,
              }}>
              <ChevronDown size={11} /> Dưới
            </button>
          </div>
          <div className="flex items-center rounded-lg px-2.5"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, height: 34 }}>
            <span style={{ color: c.text3, fontSize: 11, marginRight: 4 }}>$</span>
            <input type="number" placeholder="Giá mục tiêu" value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
              autoFocus />
          </div>
          <input type="text" placeholder="Ghi chú (tùy chọn)" value={note}
            onChange={e => setNote(e.target.value)}
            className="rounded-lg px-2.5 bg-transparent outline-none"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, height: 30, color: c.text2, fontSize: 11 }} />
          <div className="flex gap-1.5">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-1.5 rounded-md transition-colors"
              style={{ background: inputBg, color: c.text3, fontSize: 11, fontWeight: 600, border: `1px solid ${inputBorder}` }}>
              Hủy
            </button>
            <button onClick={handleAdd}
              className="flex-1 py-1.5 rounded-md transition-colors"
              style={{
                background: direction === 'above' ? '#10B981' : '#EF4444',
                color: '#fff', fontSize: 11, fontWeight: 700,
              }}>
              Tạo cảnh báo
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-2" style={{ borderBottom: `1px solid ${panelBorder}` }}>
          <button onClick={() => { setShowForm(true); setTargetPrice(livePrice.toFixed(2)); }}
            className="w-full py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
            <Plus size={11} /> Thêm cảnh báo
          </button>
        </div>
      )}

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Bell size={22} color={c.text3} style={{ opacity: 0.3 }} />
            <span style={{ color: c.text3, fontSize: 12 }}>Chưa có cảnh báo nào</span>
            <span style={{ color: c.text3, fontSize: 10, opacity: 0.6 }}>Tạo cảnh báo để được thông báo khi giá đạt mục tiêu</span>
          </div>
        ) : (
          <div>
            {triggeredCount > 0 && (
              <div className="flex items-center justify-between px-3.5 py-1.5" style={{ background: 'rgba(245,158,11,0.04)' }}>
                <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>Đã kích hoạt ({triggeredCount})</span>
                <button onClick={handleClearTriggered} style={{ color: c.text3, fontSize: 10 }}>Xóa tất cả</button>
              </div>
            )}
            {alerts.map(a => {
              const isTriggered = a.status === 'triggered';
              const isAbove = a.direction === 'above';
              const dirColor = isAbove ? '#10B981' : '#EF4444';
              const isFlashing = flashId === a.id;
              return (
                <div key={a.id}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 transition-all"
                  style={{
                    borderBottom: `1px solid ${panelBorder}`,
                    background: isFlashing ? (isAbove ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)') : 'transparent',
                    opacity: isTriggered ? 0.6 : 1,
                  }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: isTriggered ? 'rgba(245,158,11,0.15)' : dirColor + '12' }}>
                    {isTriggered
                      ? <BellRing size={11} color="#F59E0B" />
                      : (isAbove ? <ChevronUp size={11} color={dirColor} /> : <ChevronDown size={11} color={dirColor} />)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: isTriggered ? '#F59E0B' : c.text1, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        ${a.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="px-1.5 py-0.5 rounded" style={{
                        background: isTriggered ? 'rgba(245,158,11,0.1)' : dirColor + '10',
                        color: isTriggered ? '#F59E0B' : dirColor,
                        fontSize: 9, fontWeight: 600,
                      }}>
                        {isTriggered ? 'TRIGGERED' : (isAbove ? '≥ TRÊN' : '≤ DƯỚI')}
                      </span>
                    </div>
                    {a.note && (
                      <span style={{ color: c.text3, fontSize: 10, display: 'block', marginTop: 1 }}
                        className="truncate">{a.note}</span>
                    )}
                  </div>
                  <button onClick={() => handleDelete(a.id)}
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors"
                    style={{ background: 'rgba(239,68,68,0.06)' }}>
                    <Trash2 size={11} color="#EF4444" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick add presets */}
      {!showForm && alerts.length > 0 && (
        <div className="flex items-center gap-1.5 px-3.5 py-2 shrink-0" style={{ borderTop: `1px solid ${panelBorder}`, background: inputBg }}>
          <span style={{ color: c.text3, fontSize: 10 }}>Nhanh:</span>
          {[
            { label: '+1%', val: livePrice * 1.01, dir: 'above' as const },
            { label: '+5%', val: livePrice * 1.05, dir: 'above' as const },
            { label: '-1%', val: livePrice * 0.99, dir: 'below' as const },
            { label: '-5%', val: livePrice * 0.95, dir: 'below' as const },
          ].map(p => (
            <button key={p.label}
              onClick={() => {
                const newAlert: PriceAlert = {
                  id: `alert_${++alertIdCounter}`,
                  targetPrice: parseFloat(p.val.toFixed(2)),
                  direction: p.dir,
                  note: `Auto: ${p.label}`,
                  status: 'active',
                  createdAt: Date.now(),
                };
                setAlerts(prev => [newAlert, ...prev]);
              }}
              className="px-2 py-0.5 rounded transition-colors"
              style={{
                border: `1px solid ${p.dir === 'above' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: p.dir === 'above' ? '#10B981' : '#EF4444',
                fontSize: 10, fontWeight: 600,
              }}>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}