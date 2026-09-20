/**
 * ══════════════════════════════════════════════════════════
 *  07C — Prediction Markets Hardening: Shared Sheets
 * ══════════════════════════════════════════════════════════
 *  1) PredictionTradeReviewSheet — confirm before placing order
 *  2) PredictionRiskExplainerSheet — risk education
 *  3) PredictionsCommentReportDialog — report/block comment author
 */

import React, { useState } from 'react';
import {
  X, AlertTriangle, Shield, Info, ChevronRight,
  ArrowUp, ArrowDown, TrendingUp, BookOpen, Layers,
  Flag, Ban, Link2, MessageCircle, CheckCircle2,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { CTAButton } from '../ui/CTAButton';
import { TrCard } from '../ui/TrCard';
import { BottomSheetV2, BottomSheetRow } from '../ui/BottomSheetV2';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════
   1) PredictionTradeReviewSheet
   ═══════════════════════════════════════════ */

export interface TradeReviewData {
  eventTitle: string;
  outcome: string;
  outcomeColor: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  amount: number;
  price: number;
  shares: number;
  fee: number;
  potentialPayout: number;
}

interface TradeReviewSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: TradeReviewData;
}

export function PredictionTradeReviewSheet({ open, onClose, onConfirm, data }: TradeReviewSheetProps) {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const isBuy = data.side === 'buy';

  return (
    <BottomSheetV2 open={open} onClose={onClose} title="Xác nhận lệnh">
      {/* Side + Outcome */}
      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1.5 rounded-lg flex items-center gap-1"
          style={{
            background: isBuy ? c.buyAlpha10 : c.sellAlpha10,
            color: isBuy ? c.buy : c.sell,
            fontSize: φ.sm, fontWeight: 700,
          }}>
          {isBuy ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {isBuy ? 'Buy' : 'Sell'}
        </span>
        <span className="px-3 py-1.5 rounded-lg"
          style={{ background: hexToRgba(data.outcomeColor, 15), color: data.outcomeColor, fontSize: φ.sm, fontWeight: 600 }}>
          {data.outcome}
        </span>
        <span className="px-2 py-1 rounded-md"
          style={{ background: c.surface2, color: c.text3, fontSize: 10, fontWeight: 600 }}>
          {data.orderType === 'market' ? 'Market' : 'Limit'}
        </span>
      </div>

      {/* Event title */}
      <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.4, marginBottom: 12 }}>
        {data.eventTitle}
      </p>

      {/* Breakdown */}
      <TrCard className="p-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.xs }}>Số lượng shares</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>
              ~{data.shares.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.xs }}>{isBuy ? 'Chi phí ước tính' : 'Số tiền nhận'}</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>
              ${data.amount.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.xs }}>Giá</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>
              ${data.price.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.xs }}>Phí giao dịch (2%)</span>
            <span style={{ color: c.text2, fontSize: φ.sm, fontFamily: 'monospace' }}>
              ${data.fee.toFixed(2)}
            </span>
          </div>
          <div className="pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                {isBuy ? 'Tiềm năng nhận' : 'Tổng chi'}
              </span>
              <span style={{ color: c.buy, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                ${(data.potentialPayout - data.fee).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </TrCard>

      {/* Slippage / Liquidity note */}
      {data.orderType === 'market' && (
        <div className="flex items-start gap-2 mb-3 px-3 py-2.5 rounded-xl"
          style={{ background: c.warnAlpha10, border: `1px solid ${c.warnAlpha15}` }}>
          <AlertTriangle size={13} color={c.warn} className="shrink-0 mt-0.5" />
          <p style={{ color: c.warn, fontSize: 11, lineHeight: 1.4 }}>
            Lệnh market sẽ khớp ngay với giá tốt nhất hiện tại. Giá thực tế có thể chênh nhẹ do trượt giá (slippage).
          </p>
        </div>
      )}

      {/* Rule reminder */}
      <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl"
        style={{ background: c.primaryAlpha12, border: `1px solid ${c.primaryAlpha12}` }}>
        <Info size={13} color={c.primary} className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
          Mỗi share thắng trả $1.00, thua trả $0.00. Kết quả dựa trên nguồn xác minh công khai. Đây không phải lời khuyên đầu tư.
        </p>
      </div>

      {/* CTA */}
      <CTAButton
        variant={isBuy ? 'success' : 'danger'}
        onClick={() => { hapticSuccess(); onConfirm(); }}
        fullWidth
      >
        Xác nhận lệnh · ${data.amount.toFixed(2)}
      </CTAButton>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════
   2) PredictionRiskExplainerSheet
   ═══════════════════════════════════════════ */

interface RiskExplainerProps {
  open: boolean;
  onClose: () => void;
}

const RISK_ITEMS = [
  {
    icon: TrendingUp,
    title: 'Probability không phải certainty',
    desc: 'Giá thị trường dự đoán phản ánh ước lượng cộng đồng về xác suất xảy ra sự kiện. Xác suất 80% không có nghĩa là chắc chắn xảy ra.',
    colorKey: 'primary' as const,
  },
  {
    icon: Layers,
    title: 'Thanh khoản (liquidity) ảnh hưởng giá',
    desc: 'Thị trường thanh khoản thấp có thể có spread rộng và trượt giá cao hơn. Kiểm tra orderbook trước khi đặt lệnh lớn.',
    colorKey: 'warn' as const,
  },
  {
    icon: AlertTriangle,
    title: 'Giá có thể biến động mạnh',
    desc: 'Giá shares có thể thay đổi nhanh khi có tin tức mới hoặc khi gần đến ngày kết thúc. Chỉ sử dụng số tiền bạn sẵn sàng mất.',
    colorKey: 'sell' as const,
  },
  {
    icon: BookOpen,
    title: 'Nguồn xác minh quyết định kết quả',
    desc: 'Mỗi sự kiện có nguồn xác minh riêng. Đọc kỹ phần Rules để hiểu cách kết quả được quyết định.',
    colorKey: 'accent' as const,
  },
  {
    icon: Shield,
    title: 'Reward không phải lợi nhuận đảm bảo',
    desc: 'Phần thưởng cung cấp thanh khoản (rewards) phụ thuộc vào điều kiện thị trường và có thể thay đổi bất cứ lúc nào.',
    colorKey: 'buy' as const,
  },
];

export function PredictionRiskExplainerSheet({ open, onClose }: RiskExplainerProps) {
  const c = useThemeColors();

  const colorMap: Record<string, string> = {
    primary: c.primary,
    warn: c.warn,
    sell: c.sell,
    accent: '#8B5CF6',
    buy: c.buy,
  };

  return (
    <BottomSheetV2 
      open={open} 
      onClose={onClose} 
      title={
        <div className="flex items-center gap-2">
          <Shield size={18} color={c.warn} />
          <span>Hiểu rủi ro</span>
        </div>
      }
    >
      <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 16 }}>
        Trước khi giao dịch trên Prediction Markets, hãy đảm bảo bạn hiểu các rủi ro sau đây.
      </p>

      <div className="flex flex-col gap-3">
        {RISK_ITEMS.map(item => {
          const itemColor = colorMap[item.colorKey] || c.primary;
          return (
          <TrCard key={item.title} className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: hexToRgba(itemColor, 12) }}>
              <item.icon size={16} color={itemColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                {item.title}
              </p>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginTop: 2 }}>
                {item.desc}
              </p>
            </div>
          </TrCard>
          );
        })}
      </div>

      <div className="mt-4">
        <CTAButton onClick={onClose} fullWidth>
          Đã hiểu
        </CTAButton>
      </div>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════
   3) PredictionsCommentReportDialog
   ═══════════════════════════════════════════ */

const REPORT_REASONS = [
  'Spam hoặc quảng cáo',
  'Thông tin sai lệch',
  'Ngôn ngữ xúc phạm',
  'Chứa link đáng ngờ',
  'Mạo danh người khác',
  'Khác',
];

interface CommentReportDialogProps {
  open: boolean;
  onClose: () => void;
  onReport: (reason: string) => void;
  onBlock: () => void;
  commentUser?: string;
}

export function PredictionsCommentReportDialog({ open, onClose, onReport, onBlock, commentUser }: CommentReportDialogProps) {
  const c = useThemeColors();
  const [selectedReason, setSelectedReason] = useState('');
  const { hapticSelection } = useHaptic();

  const handleReport = () => {
    if (!selectedReason) return;
    hapticSelection();
    onReport(selectedReason);
    setSelectedReason('');
    onClose();
  };

  const handleBlock = () => {
    hapticSelection();
    onBlock();
    onClose();
  };

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Flag size={18} color={c.sell} />
          <span>Báo cáo bình luận</span>
        </div>
      }
    >
      {commentUser && (
        <p style={{ color: c.text2, fontSize: φ.xs, marginBottom: 12 }}>
          Báo cáo bình luận của <span style={{ fontWeight: 600, color: c.text1 }}>{commentUser}</span>
        </p>
      )}

      {/* Reasons */}
      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 8 }}>Chọn lý do</p>
      <div className="flex flex-col gap-2 mb-4">
        {REPORT_REASONS.map(reason => (
          <button
            key={reason}
            onClick={() => { setSelectedReason(reason); hapticSelection(); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left active:opacity-70"
            style={{
              background: selectedReason === reason ? c.sellAlpha10 : c.surface2,
              border: `1.5px solid ${selectedReason === reason ? c.sellAlpha15 : 'transparent'}`,
              minHeight: 44,
            }}
          >
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: selectedReason === reason ? c.sell : c.borderSolid,
                background: selectedReason === reason ? c.sell : 'transparent',
              }}>
              {selectedReason === reason && <CheckCircle2 size={12} color="#fff" />}
            </div>
            <span style={{ color: c.text1, fontSize: φ.sm }}>{reason}</span>
          </button>
        ))}
      </div>

      {/* External links warning */}
      <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl"
        style={{ background: c.warnAlpha10, border: `1px solid ${c.warnAlpha15}` }}>
        <Link2 size={13} color={c.warn} className="shrink-0 mt-0.5" />
        <p style={{ color: c.warn, fontSize: 11, lineHeight: 1.4 }}>
          Cảnh giác với link bên ngoài. Không chia sẻ thông tin cá nhân hoặc tài chính trong phần bình luận.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <CTAButton
          variant="danger"
          onClick={handleReport}
          disabled={!selectedReason}
          fullWidth
        >
          Gửi báo cáo
        </CTAButton>

        {commentUser && (
          <button
            onClick={handleBlock}
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 active:opacity-70"
            style={{ background: c.chipBg, border: `1.5px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.sm, fontWeight: 600, minHeight: 44 }}>
            <Ban size={14} />
            Chặn {commentUser}
          </button>
        )}
      </div>
    </BottomSheetV2>
  );
}