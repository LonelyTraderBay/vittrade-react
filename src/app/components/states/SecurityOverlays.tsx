import React, { useState } from 'react';
import { X, LogIn, KeyRound, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { BottomSheetV2 } from '../ui/BottomSheetV2';

/* ═══════════════════════════════════════════════════
   1) Session Expired Modal
   ═══════════════════════════════════════════════════ */
interface SessionExpiredModalProps {
  open: boolean;
  onLogin: () => void;
  onClose?: () => void;
}

export function SessionExpiredModal({ open, onLogin, onClose }: SessionExpiredModalProps) {
  const c = useThemeColors();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full rounded-3xl p-6 flex flex-col items-center gap-5 relative"
        style={{
          maxWidth: 360,
          background: c.surface,
          border: `1px solid ${c.borderSolid}`,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X size={16} color={c.text2} />
          </button>
        )}

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <LogIn size={28} color="#EF4444" />
        </div>

        {/* Text */}
        <div className="text-center">
          <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Phiên đăng nhập đã hết hạn
          </p>
          <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.5 }}>
            Phiên làm việc đã hết hiệu lực vì lý do bảo mật. Vui lòng đăng nhập lại để tiếp tục.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onLogin}
          className="w-full h-13 rounded-2xl flex items-center justify-center gap-2 font-semibold"
          style={{
            height: 52,
            background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
            color: '#fff',
            fontSize: 16,
            boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
          }}
        >
          <LogIn size={18} />
          Đăng nhập lại
        </button>

        <div className="flex items-center gap-1.5">
          <Lock size={10} color={c.text3} />
          <span style={{ color: c.text3, fontSize: 11 }}>Dữ liệu của bạn vẫn an toàn</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   2) Re-auth Bottom Sheet
   ═══════════════════════════════════════════════════ */
interface ReauthSheetProps {
  open: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export function ReauthSheet({ open, onSubmit, onClose }: ReauthSheetProps) {
  const c = useThemeColors();
  const [showPassword, setShowPassword] = useState(false);
  const [method, setMethod] = useState<'password' | '2fa'>('password');

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <KeyRound size={20} color="#3B82F6" />
          </div>
          <div>
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
              Xác thực lại để tiếp tục
            </p>
            <p style={{ color: c.text2, fontSize: 12 }}>
              Hành động này cần xác nhận danh tính
            </p>
          </div>
        </div>
      }
    >
      {/* Method toggle */}
      <div className="flex rounded-xl p-1 mb-5" style={{ background: c.surface2 }}>
        {[
          { id: 'password', label: 'Mật khẩu' },
          { id: '2fa', label: 'Mã 2FA' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMethod(tab.id as any)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: method === tab.id ? c.chipActiveBg : 'transparent',
              color: method === tab.id ? c.chipActiveText : c.text3,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input */}
      {method === 'password' ? (
        <div>
          <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>
            Nhập mật khẩu
          </label>
          <div
            className="flex items-center rounded-xl px-4"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 52 }}
          >
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu của bạn"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: c.text1,
                fontSize: 15,
                flex: 1,
              }}
            />
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} color={c.text3} /> : <Eye size={18} color={c.text3} />}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>
            Mã xác thực 6 chữ số
          </label>
          <div
            className="flex items-center rounded-xl px-4"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 52 }}
          >
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: c.text1,
                fontSize: 24,
                flex: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: 8,
                textAlign: 'center',
              }}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={onSubmit}
        className="w-full h-13 rounded-2xl flex items-center justify-center font-semibold mt-5"
        style={{
          height: 52,
          background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
          color: '#fff',
          fontSize: 16,
          boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
        }}
      >
        Xác nhận
      </button>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════════════
   3 & 4) KYC & 2FA Gate Panels (inline)
   Exported from GatePanel.tsx — re-export convenience
   ═══════════════════════════════════════════════════ */
export { GatePanel } from './GatePanel';