/**
 * ══════════════════════════════════════════════════════════════
 *  QRScannerOverlay — P3: Camera QR Scanner Placeholder
 * ══════════════════════════════════════════════════════════════
 *  Simulated QR scanner overlay for web prototype.
 *  Shows camera-like frame with animated scan line and
 *  "paste from clipboard" fallback action.
 *  §7.4 Feedback, §4.3 States
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { X, Camera, ClipboardPaste, AlertTriangle } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';

interface QRScannerOverlayProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

export function QRScannerOverlay({ open, onClose, onScan, title = 'Quét mã QR' }: QRScannerOverlayProps) {
  const c = useThemeColors();
  const { hapticMedium, hapticSuccess } = useHaptic();
  const [scanLineY, setScanLineY] = useState(0);
  const [pasteError, setPasteError] = useState('');

  // Animate scan line
  useEffect(() => {
    if (!open) return;
    let frame: number;
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) % 2400;
      setScanLineY((elapsed / 2400) * 100);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.length >= 10) {
        hapticSuccess();
        onScan(text.trim());
        onClose();
      } else {
        setPasteError('Clipboard trống hoặc không hợp lệ');
        setTimeout(() => setPasteError(''), 3000);
      }
    } catch {
      setPasteError('Không thể đọc clipboard. Vui lòng dán thủ công.');
      setTimeout(() => setPasteError(''), 3000);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
        <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <X size={20} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontSize: φ.body, fontWeight: 700 }}>{title}</span>
        <div className="w-10" />
      </div>

      {/* Scanner viewport */}
      <div className="flex-1 flex items-center justify-center relative" style={{ background: '#111' }}>
        {/* Dimmed corners */}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />

        {/* Clear scan window */}
        <div className="relative" style={{ width: 260, height: 260 }}>
          {/* Transparent cutout */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{ background: 'rgba(30,30,30,0.3)', border: '2px solid rgba(255,255,255,0.15)' }}>
            {/* Scan line */}
            <div
              className="absolute left-3 right-3 h-0.5 rounded-full"
              style={{
                top: `${scanLineY}%`,
                background: 'linear-gradient(90deg, transparent 0%, #3B82F6 30%, #3B82F6 70%, transparent 100%)',
                boxShadow: '0 0 12px rgba(59,130,246,0.6)',
                transition: 'none',
              }}
            />

            {/* Grid pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
              {Array.from({ length: 10 }).map((_, i) => (
                <React.Fragment key={i}>
                  <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke="#fff" strokeWidth={0.3} />
                  <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="#fff" strokeWidth={0.3} />
                </React.Fragment>
              ))}
            </svg>
          </div>

          {/* Corner brackets */}
          {[
            { top: -2, left: -2 },
            { top: -2, right: -2 },
            { bottom: -2, left: -2 },
            { bottom: -2, right: -2 },
          ].map((pos, i) => (
            <div key={i} className="absolute w-8 h-8" style={pos as any}>
              <div className="absolute rounded-sm"
                style={{
                  ...(pos.top !== undefined ? { top: 0, height: 3 } : { bottom: 0, height: 3 }),
                  ...(pos.left !== undefined ? { left: 0 } : { right: 0 }),
                  width: 24,
                  background: '#3B82F6',
                }} />
              <div className="absolute rounded-sm"
                style={{
                  ...(pos.left !== undefined ? { left: 0, width: 3 } : { right: 0, width: 3 }),
                  ...(pos.top !== undefined ? { top: 0 } : { bottom: 0 }),
                  height: 24,
                  background: '#3B82F6',
                }} />
            </div>
          ))}
        </div>

        {/* Prototype notice */}
        <div className="absolute bottom-8 left-6 right-6">
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Camera size={16} color="#F59E0B" />
            <p style={{ color: '#FCD34D', fontSize: 12, lineHeight: 1.5 }}>
              Camera QR không khả dụng trong bản prototype web. Sử dụng nút dán bên dưới.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-6 pb-10 pt-5 flex flex-col gap-3" style={{ background: 'rgba(0,0,0,0.9)' }}>
        {pasteError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.12)' }}>
            <AlertTriangle size={13} color="#EF4444" />
            <span style={{ color: '#F87171', fontSize: 12 }}>{pasteError}</span>
          </div>
        )}
        <button
          onClick={handlePasteClipboard}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl"
          style={{ background: '#3B82F6', color: '#fff', fontSize: 15, fontWeight: 700 }}>
          <ClipboardPaste size={18} />
          Dán địa chỉ từ clipboard
        </button>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center' }}>
          Hoặc quay lại để nhập địa chỉ thủ công
        </p>
      </div>
    </div>
  );
}
