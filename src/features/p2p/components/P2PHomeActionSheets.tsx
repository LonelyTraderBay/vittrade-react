import React from 'react';
import { useNavigate } from 'react-router';
import {
  Award,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  Flag,
  GitCompare,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  ListOrdered,
  Scale,
  Share2,
  ShieldCheck,
  Star,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { fmtAmount, fmtVnd } from '@/shared/lib/formatNumber';
import type { P2PAd, P2PTradingLevel, P2PUserLevel } from '../model/p2p-types';
export function ContextMenuSheet({
  ad,
  isOpen,
  onClose,
  tradeType,
  onShare,
  onCompare,
  onQuickAction,
  onViewMerchant,
  prefix,
  onAfterOpen,
}: {
  ad: P2PAd | null;
  isOpen: boolean;
  onClose: () => void;
  tradeType: 'buy' | 'sell';
  onShare: () => void;
  onCompare: () => void;
  onQuickAction: () => void;
  onViewMerchant: () => void;
  prefix: string;
  onAfterOpen?: () => void;
}) {
  const c = useThemeColors();
  const navigate = useNavigate();

  if (!ad) return null;

  const menuItems = [
    {
      icon: Zap,
      label: tradeType === 'buy' ? `Mua nhanh ${ad.asset}` : `Bán nhanh ${ad.asset}`,
      color: tradeType === 'buy' ? c.buy : c.sell,
      action: onQuickAction,
    },
    {
      icon: Share2,
      label: 'Chia sẻ offer',
      color: c.primary,
      action: onShare,
    },
    {
      icon: GitCompare,
      label: 'So sánh giá',
      color: '#8B5CF6',
      action: onCompare,
    },
    {
      icon: Eye,
      label: 'Xem hồ sơ merchant',
      color: c.text2,
      action: onViewMerchant,
    },
    {
      icon: Flag,
      label: 'Báo cáo offer',
      color: c.sell,
      action: () => {
        onClose();
        navigate(`${prefix}/p2p/report/${ad.merchantId}`);
      },
    },
  ];

  const customHeader = (
    <div className="flex items-center gap-3 mb-5 px-1">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background:
            ad.merchantBadge === 'elite'
              ? 'linear-gradient(135deg, #F59E0B, #FBBF24)'
              : ad.merchantBadge === 'pro'
                ? 'linear-gradient(135deg, #8B5CF6, #A78BFA)'
                : 'linear-gradient(135deg, #3B82F6, #60A5FA)',
        }}
      >
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
          {ad.merchant.charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate" style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
          {ad.merchant}
        </p>
        <p style={{ color: c.text3, fontSize: 11 }}>
          {fmtVnd(ad.price)} {ad.currency} · {fmtAmount(ad.available)} {ad.asset}
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: c.surface2 }}
        aria-label="Đóng"
      >
        <X size={14} color={c.text3} />
      </button>
    </div>
  );

  return (
    <BottomSheetV2
      open={isOpen}
      onClose={onClose}
      variant="center"
      customHeader={customHeader}
      showCloseButton={false}
      ariaLabel={`Tuỳ chọn ${ad.merchant}`}
      onAfterOpen={onAfterOpen}
    >
      {/* Menu items */}
      <div className="flex flex-col gap-1">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={() => {
              item.action();
              onClose();
            }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl active:opacity-70"
            style={{
              background: c.surface2,
              minHeight: 48,
              borderBottom: i === menuItems.length - 2 ? `1px solid ${c.divider}` : 'none',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${item.color}15` }}
            >
              <item.icon size={16} color={item.color} />
            </div>
            <span
              style={{
                color: item.label.includes('Báo cáo') ? c.sell : c.text1,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {item.label}
            </span>
            <ChevronRight size={14} color={c.text3} className="ml-auto" />
          </button>
        ))}
      </div>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════════════════════
   CompareBar — Floating comparison bar
   ═══════════════════════════════════════════════════════════ */

export function P2PQuickActionsSheet({
  isOpen,
  onClose,
  userLevel,
  currentLevelData,
  onAfterOpen,
}: {
  isOpen: boolean;
  onClose: () => void;
  userLevel: P2PUserLevel;
  currentLevelData: P2PTradingLevel;
  onAfterOpen?: () => void;
}) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <BottomSheetV2
      open={isOpen}
      onClose={onClose}
      variant="center"
      title="Tuỳ chọn P2P"
      maxHeight="calc(100vh - 24px)"
      ariaLabel="Tuỳ chọn P2P"
      onAfterOpen={onAfterOpen}
    >
      {/* User Level Summary */}
      <button
        onClick={() => {
          navigate(`${prefix}/p2p/trading-level`);
          onClose();
        }}
        className="flex items-center gap-3 w-full mb-5 p-3 rounded-2xl"
        style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: currentLevelData?.gradient || 'linear-gradient(135deg, #3B82F6, #60A5FA)',
          }}
        >
          <Award size={18} color="#fff" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
              Lv.{userLevel.currentLevel} Nâng cao
            </span>
            <span
              className="px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(59,130,246,0.1)',
                color: '#3B82F6',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              Phí 0.15%
            </span>
          </div>
          <p style={{ color: '#10B981', fontSize: 11, marginTop: 2 }}>
            Hạn mức: 45,000,000 VND / 500,000,000 VND
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>Lên Lv.4</span>
          <ChevronRight size={12} color="#3B82F6" />
        </div>
      </button>

      {/* ─── Giao dịch ─── */}
      <div className="flex items-center gap-1.5 mb-2">
        <div
          className="w-1 h-3.5 rounded-full"
          style={{ background: 'linear-gradient(180deg, #3B82F6, #60A5FA)' }}
        />
        <span style={{ color: c.text2, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
          Giao dịch
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          {
            icon: CreditCard,
            label: 'Thanh toán',
            color: '#8B5CF6',
            path: `${prefix}/p2p/payment-methods`,
          },
          {
            icon: ListOrdered,
            label: 'Sổ lệnh',
            color: '#3B82F6',
            path: `${prefix}/p2p/order-book`,
          },
          { icon: Clock, label: 'Lịch sử', color: '#6B7280', path: `${prefix}/p2p/my-orders` },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => {
              navigate(item.path);
              onClose();
              hapticSelection();
            }}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl active:scale-[0.97]"
            style={{
              background: c.surface2,
              border: `1px solid ${c.borderSolid}`,
              minHeight: 80,
              transition: 'transform 0.15s ease',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${item.color}12` }}
            >
              <item.icon size={20} color={item.color} />
            </div>
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Phân tích ─── */}
      <div className="flex items-center gap-1.5 mb-2">
        <div
          className="w-1 h-3.5 rounded-full"
          style={{ background: 'linear-gradient(180deg, #F59E0B, #FBBF24)' }}
        />
        <span style={{ color: c.text2, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
          Phân tích
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          {
            icon: LayoutDashboard,
            label: 'Dashboard',
            color: '#F59E0B',
            path: `${prefix}/p2p/dashboard`,
          },
          { icon: Star, label: 'Xếp hạng', color: '#F59E0B', path: `${prefix}/p2p/reviews` },
          {
            icon: Trophy,
            label: 'Thành tích',
            color: '#F59E0B',
            path: `${prefix}/p2p/achievements`,
          },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => {
              navigate(item.path);
              onClose();
              hapticSelection();
            }}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl active:scale-[0.97]"
            style={{
              background: c.surface2,
              border: `1px solid ${c.borderSolid}`,
              minHeight: 80,
              transition: 'transform 0.15s ease',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${item.color}12` }}
            >
              <item.icon size={20} color={item.color} />
            </div>
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ─── An toàn & Hỗ trợ ─── */}
      <div className="flex items-center gap-1.5 mb-2">
        <div
          className="w-1 h-3.5 rounded-full"
          style={{ background: 'linear-gradient(180deg, #10B981, #34D399)' }}
        />
        <span style={{ color: c.text2, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
          An toàn & Hỗ trợ
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: ShieldCheck,
            label: 'Bảo hiểm',
            color: '#10B981',
            path: `${prefix}/p2p/insurance-fund`,
          },
          { icon: Scale, label: 'Tranh chấp', color: '#EF4444', path: `${prefix}/p2p/disputes` },
          {
            icon: GraduationCap,
            label: 'Cấp bậc',
            color: '#6B7280',
            path: `${prefix}/p2p/trading-level`,
          },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => {
              navigate(item.path);
              onClose();
              hapticSelection();
            }}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl active:scale-[0.97]"
            style={{
              background: c.surface2,
              border: `1px solid ${c.borderSolid}`,
              minHeight: 80,
              transition: 'transform 0.15s ease',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${item.color}12` }}
            >
              <item.icon size={20} color={item.color} />
            </div>
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ─── FAQ Banner ─── */}
      <button
        onClick={() => {
          navigate(`${prefix}/p2p/guide`);
          onClose();
          hapticSelection();
        }}
        className="flex items-center gap-3 w-full mt-4 px-4 py-3 rounded-xl active:scale-[0.98]"
        style={{
          background:
            'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.04) 100%)',
          border: `1px solid rgba(139,92,246,0.12)`,
          transition: 'transform 0.15s ease',
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,0.1)' }}
        >
          <HelpCircle size={16} color="#8B5CF6" />
        </div>
        <div className="flex-1 text-left">
          <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Câu hỏi thường gặp</span>
          <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
            Hướng dẫn giao dịch P2P an toàn
          </p>
        </div>
        <ChevronRight size={14} color={c.text3} />
      </button>
    </BottomSheetV2>
  );
}
