/**
 * ══════════════════════════════════════════════════════════
 *  Arena Moderation Components
 * ══════════════════════════════════════════════════════════
 *  Section 3 of 06E: Report, Block, Community Rules, Banners
 *  Uses ConfirmationDialog pattern, semantic colors, φ scale.
 */

import React, { useState } from 'react';
import {
  Flag, Ban, BookOpen, Shield, AlertTriangle,
  Info, ChevronRight, CheckCircle2,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { TrCard } from '../ui/TrCard';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';

/* ═══════════════════════════════════════════
   Report Dialog
   ═══════════════════════════════════════════ */

const REPORT_REASONS = [
  'Nội dung lừa đảo / scam',
  'Spam hoặc quảng cáo',
  'Ngôn ngữ xúc phạm',
  'Giao dịch ngoài nền tảng',
  'Thao túng kết quả',
  'Vi phạm luật chơi',
  'Khác',
] as const;

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetName: string;
  targetType?: 'user' | 'challenge' | 'mode';
}

export function ReportDialog({ open, onClose, targetName, targetType = 'user' }: ReportDialogProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const typeLabel = targetType === 'challenge' ? 'challenge' : targetType === 'mode' ? 'mode' : 'người dùng';

  const handleConfirm = () => {
    actionToast.success(TOAST.ARENA.USER_REPORTED);
    setSelectedReason(null);
    onClose();
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={() => { setSelectedReason(null); onClose(); }}
      onConfirm={handleConfirm}
      variant="danger"
      icon={<Flag size={28} color="#EF4444" />}
      title={`Báo cáo ${typeLabel}`}
      description={`Bạn đang báo cáo "${targetName}". Chọn lý do bên dưới.`}
      confirmText="Gửi báo cáo"
      cancelText="Huỷ"
    >
      <div className="flex flex-col gap-1.5 mt-2">
        {REPORT_REASONS.map(reason => (
          <button
            key={reason}
            onClick={() => { setSelectedReason(reason); hapticSelection(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left active:opacity-70"
            style={{
              background: selectedReason === reason ? 'rgba(239,68,68,0.08)' : c.surface2,
              border: `1.5px solid ${selectedReason === reason ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
              minHeight: 44,
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{
                border: `2px solid ${selectedReason === reason ? '#EF4444' : c.borderSolid}`,
                background: selectedReason === reason ? '#EF4444' : 'transparent',
              }}
            >
              {selectedReason === reason && <CheckCircle2 size={10} color="#fff" />}
            </div>
            <span style={{ color: c.text1, fontSize: φ.sm }}>{reason}</span>
          </button>
        ))}
      </div>
    </ConfirmationDialog>
  );
}

/* ═══════════════════════════════════════════
   Block User Dialog
   ═══════════════════════════════════════════ */

interface BlockUserDialogProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
}

export function BlockUserDialog({ open, onClose, userName, userAvatar }: BlockUserDialogProps) {
  const actionToast = useActionToast();

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      onConfirm={() => actionToast.success(TOAST.ARENA.USER_BLOCKED)}
      variant="warning"
      icon={<Ban size={28} color="#F59E0B" />}
      title={`Chặn ${userName}?`}
      description={
        <div className="flex flex-col gap-2">
          <p>Sau khi chặn, bạn sẽ không thể:</p>
          <ul className="text-left" style={{ paddingLeft: 16, listStyleType: 'disc' }}>
            <li>Thấy challenge do người này tạo</li>
            <li>Nhận lời mời từ người này</li>
            <li>Chat với người này trong phòng</li>
          </ul>
          <p>Bạn có thể bỏ chặn bất cứ lúc nào.</p>
        </div>
      }
      confirmText="Chặn"
      cancelText="Huỷ"
    />
  );
}

/* ═══════════════════════════════════════════
   Community Rules Dialog
   ═══════════════════════════════════════════ */

const COMMUNITY_RULES = [
  { title: 'Không giao dịch ngoài nền tảng', desc: 'Mọi thỏa thuận phải diễn ra trong Open Arena.' },
  { title: 'Tôn trọng kết quả', desc: 'Không thao túng hoặc từ chối kết quả hợp lệ.' },
  { title: 'Không spam / quảng cáo', desc: 'Không gửi link, quảng cáo trong chat.' },
  { title: 'Ngôn ngữ văn minh', desc: 'Không xúc phạm, đe doạ người chơi khác.' },
  { title: 'Points chỉ dùng trong Arena', desc: 'Arena Points không có giá trị tiền tệ, không rút được.' },
  { title: 'Báo cáo vi phạm', desc: 'Nếu phát hiện gian lận, hãy báo cáo ngay.' },
] as const;

interface CommunityRulesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CommunityRulesDialog({ open, onClose }: CommunityRulesDialogProps) {
  const c = useThemeColors();

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      onConfirm={onClose}
      variant="info"
      icon={<BookOpen size={28} color="#3B82F6" />}
      title="Quy tắc cộng đồng"
      description="Open Arena là sân chơi lành mạnh. Vui lòng tuân thủ các quy tắc sau:"
      confirmText="Đã hiểu"
      cancelText="Đóng"
    >
      <div className="flex flex-col gap-2 mt-2">
        {COMMUNITY_RULES.map((rule, i) => (
          <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-xl"
            style={{ background: c.surface2 }}>
            <span style={{ color: '#3B82F6', fontSize: φ.xs, fontWeight: 700, minWidth: 16, marginTop: 1 }}>{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{rule.title}</p>
              <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4 }}>{rule.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </ConfirmationDialog>
  );
}

/* ═══════════════════════════════════════════
   Moderation Banners (inline, not modal)
   ═══════════════════════════════════════════ */

interface ModerationBannerProps {
  className?: string;
}

export function UnderReviewBanner({ className }: ModerationBannerProps) {
  return (
    <TrCard className={`p-3 flex items-start gap-2.5 ${className ?? ''}`}
      accentBorder="rgba(245,158,11,0.25)">
      <Shield size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>
          Đang được xem xét
        </p>
        <p style={{ color: '#F59E0B', fontSize: φ.xs, lineHeight: 1.5, opacity: 0.8 }}>
          Challenge này đang được đội ngũ kiểm duyệt xem xét. Kết quả có thể bị tạm giữ.
        </p>
      </div>
    </TrCard>
  );
}

export function ReportedContentBanner({ className }: ModerationBannerProps) {
  return (
    <TrCard className={`p-3 flex items-start gap-2.5 ${className ?? ''}`}
      accentBorder="rgba(239,68,68,0.25)">
      <Flag size={14} color="#EF4444" className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>
          Nội dung đã bị báo cáo
        </p>
        <p style={{ color: '#EF4444', fontSize: φ.xs, lineHeight: 1.5, opacity: 0.8 }}>
          Nội dung này đã nhận được báo cáo vi phạm. Đội ngũ đang xem xét trong 24h.
        </p>
      </div>
    </TrCard>
  );
}

export function AntiScamBanner({ className }: ModerationBannerProps) {
  return (
    <TrCard className={`p-3 flex items-start gap-2.5 ${className ?? ''}`}
      accentBorder="rgba(59,130,246,0.2)">
      <AlertTriangle size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
      <p style={{ color: '#3B82F6', fontSize: φ.xs, lineHeight: 1.5 }}>
        Không thỏa thuận giao dịch ngoài nền tảng. Arena Points không phải tài sản tài chính.
      </p>
    </TrCard>
  );
}

export function PointsOnlyBanner({ className }: ModerationBannerProps) {
  return (
    <TrCard className={`p-3 flex items-start gap-2.5 ${className ?? ''}`}
      accentBorder="rgba(245,158,11,0.2)">
      <Info size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
      <p style={{ color: '#F59E0B', fontSize: φ.xs, lineHeight: 1.5 }}>
        Arena Points chỉ dùng trong Open Arena. Không có giá trị tiền tệ và không thể rút ra ngoài.
      </p>
    </TrCard>
  );
}
