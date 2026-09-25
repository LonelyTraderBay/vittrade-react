import React from 'react';
import { motion } from 'motion/react';
import { Shield, TrendingUp, Zap, Globe, CheckCircle } from 'lucide-react';
import { WEB_FONT } from '@/shared/theme/webTokens';

/**
 * WebAuthBrandPanel — Shared left brand panel for all web auth pages.
 * Animated entrance using Motion: logo → tagline → features → trust bar.
 *
 * Props:
 *  - tagline: Custom description below "VitTrade" logo.
 */

const FEATURES = [
  {
    icon: TrendingUp,
    label: 'Giao dịch Spot & P2P',
    desc: 'Hơn 300+ cặp giao dịch với phí cạnh tranh',
  },
  { icon: Shield, label: 'Bảo mật đa lớp', desc: '2FA, Passkey, chống giả mạo, quản lý thiết bị' },
  {
    icon: Zap,
    label: 'Thị trường dự đoán',
    desc: 'Prediction Markets minh bạch, có quy tắc rõ ràng',
  },
  { icon: Globe, label: 'Open Arena', desc: 'Thử thách points-only, cộng đồng sáng tạo' },
];

const TRUST_BADGES = ['Đã xác minh', 'VASP đăng ký', 'Quỹ SAFU'];

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
const AVATAR_INITIALS = ['H', 'T', 'M', 'L'];

interface WebAuthBrandPanelProps {
  tagline?: string;
}

export function WebAuthBrandPanel({
  tagline = 'Nền tảng giao dịch thông minh — kết nối Spot, P2P, Prediction Markets và Open Arena trong một hệ sinh thái an toàn.',
}: WebAuthBrandPanelProps) {
  return (
    <div
      className="hidden lg:flex flex-col justify-between shrink-0"
      style={{
        width: '44%',
        minWidth: 480,
        maxWidth: 640,
        background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '48px 48px 40px',
      }}
    >
      {/* ─── Decorative orbs ─── */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* ─── Top: Logo + Tagline ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
              boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
              <path
                d="M6 18L14 10L20 16L28 8"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 26L14 18L20 24L30 14"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: -0.3 }}
          >
            VitTrade
          </motion.span>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: WEB_FONT.md,
            lineHeight: 1.5,
            maxWidth: 360,
          }}
        >
          {tagline}
        </motion.p>
      </motion.div>

      {/* ─── Middle: Features (staggered) ─── */}
      <div className="flex flex-col" style={{ gap: 20, position: 'relative', zIndex: 1 }}>
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
            className="flex items-start gap-3"
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <f.icon size={18} color="rgba(255,255,255,0.7)" />
            </div>
            <div style={{ paddingTop: 2 }}>
              <p style={{ color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600, marginBottom: 2 }}>
                {f.label}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: WEB_FONT.sm, lineHeight: 1.4 }}>
                {f.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── Bottom: Trust bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.95, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
          <div className="flex -space-x-2">
            {AVATAR_INITIALS.map((initial, i) => (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: AVATAR_COLORS[i],
                  border: '2px solid #0f172a',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                {initial}
              </div>
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: WEB_FONT.sm }}>
            <span style={{ color: '#fff', fontWeight: 600 }}>50,000+</span> người dùng tin tưởng
          </span>
        </div>
        <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
          {TRUST_BADGES.map((badge, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <CheckCircle size={12} color="#10B981" />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: WEB_FONT.xs }}>{badge}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * WebAuthFormShell — Shared right panel wrapper with mobile logo fallback.
 * Wraps form content in centered, scrollable layout.
 */
interface WebAuthFormShellProps {
  children: React.ReactNode;
  textColor: string;
}

export function WebAuthFormShell({ children, textColor }: WebAuthFormShellProps) {
  return (
    <div
      className="flex-1 flex items-start justify-center"
      style={{
        padding: '40px 32px',
        minHeight: '100vh',
        overflowY: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440, paddingTop: 24, paddingBottom: 40 }}>
        {/* Mobile-only logo (visible when brand panel hidden on <lg) */}
        <div className="flex lg:hidden flex-col items-center" style={{ marginBottom: 32 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
              marginBottom: 12,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <path
                d="M6 18L14 10L20 16L28 8"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 26L14 18L20 24L30 14"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ color: textColor, fontSize: 22, fontWeight: 700 }}>VitTrade</span>
        </div>
        {children}
      </div>
    </div>
  );
}
