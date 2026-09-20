/**
 * ══════════════════════════════════════════════════════════
 *  ArenaPageFooter — Shared footer for all Arena pages
 * ══════════════════════════════════════════════════════════
 *  Includes:
 *  - "Quy tắc cộng đồng" button → CommunityRulesDialog
 *  - Points-only disclaimer banner
 *  - Optional ArenaOfflineBanner (when isOnline=false)
 *
 *  Enterprise compliance: anti-scam + no dark patterns + clear rules
 */

import React, { useState } from 'react';
import { BookOpen, Shield } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { TrCard } from '../ui/TrCard';
import { CommunityRulesDialog } from './ArenaModeration';
import { ArenaOfflineBanner } from './ArenaStates';
import { φ } from '../../utils/golden';

interface ArenaPageFooterProps {
  /** Hide the points-only disclaimer */
  hideDisclaimer?: boolean;
  /** Additional className */
  className?: string;
}

export function ArenaPageFooter({ hideDisclaimer, className }: ArenaPageFooterProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const { isOnline, isReconnecting } = useOnlineStatus();
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className={`flex flex-col gap-3 px-5 mt-4 ${className ?? ''}`}>

      {/* ─── Offline Banner ─── */}
      {(!isOnline || isReconnecting) && (
        <ArenaOfflineBanner isReconnecting={isReconnecting} />
      )}

      {/* ─── Community Rules Button ─── */}
      <button
        onClick={() => { setRulesOpen(true); hapticSelection(); }}
        className="flex items-center justify-center gap-2 py-3 rounded-xl w-full active:opacity-70"
        style={{
          background: c.chipBg,
          border: `1px solid ${c.chipBorder}`,
          minHeight: 44,
        }}
      >
        <BookOpen size={14} color="#3B82F6" />
        <span style={{ color: '#3B82F6', fontSize: φ.xs, fontWeight: 600 }}>
          Quy tắc cộng đồng
        </span>
      </button>

      {/* ─── Points-only Disclaimer ─── */}
      {!hideDisclaimer && (
        <TrCard className="p-3 flex items-start gap-2">
          <Shield size={14} color={c.accent} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
            Arena Points chỉ dùng trong Open Arena, không phải tài sản tài chính. Không thỏa thuận giao dịch ngoài nền tảng.
          </p>
        </TrCard>
      )}

      {/* ─── Dialog ─── */}
      <CommunityRulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}