import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  Shield, CheckCircle, XCircle, Clock, FileText,
  AlertTriangle, ChevronRight, Upload, Image as ImageIcon,
  Paperclip, Trash2, MessageSquare, Send, Bell, BellOff,
  Copy, ExternalLink, DollarSign, Search, Eye, Download,
  HelpCircle, ArrowRight, Scale, RotateCcw,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtVnd } from '../../data/formatNumber';
import { φ, φSpace } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { toast } from 'sonner';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { useSheetAnalytics } from '../../hooks/useSheetAnalytics';
import { ClaimExpiryWarning } from '../../components/insurance/InsuranceStates';
import { ClaimSLATracker } from '../../components/insurance/ClaimSLATracker';
import { ClaimBenchmarks } from '../../components/insurance/ClaimBenchmarks';

/* ═══════════════════════════════════════════════════════════
   P2P Claim Detail — Full Timeline + Evidence + Reviewer Notes
   ═══════════════════════════════════════════════════════════ */

type ClaimStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'paid';
type ClaimReason = 'fraud' | 'chargeback' | 'dispute_error' | 'other';

interface TimelineEvent {
  id: string;
  status: ClaimStatus | 'submitted' | 'evidence_added' | 'note_added';
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
}

interface Evidence {
  id: string;
  type: 'image' | 'document' | 'screenshot';
  name: string;
  size: string;
  uploadedAt: string;
  url?: string;
}

interface ReviewerNote {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  isInternal?: boolean;
}

interface ClaimDetail {
  id: string;
  claimCode: string;
  orderId: string;
  orderNumber: string;
  reason: ClaimReason;
  description: string;
  amount: number;
  paidAmount?: number;
  currency: string;
  status: ClaimStatus;
  submittedAt: string;
  estimatedReview: string;
  expiryDate?: string; // TIER 3.2: claim window expiry (ISO date)
  coveragePct: number;
  maxCoverage: number;
  timeline: TimelineEvent[];
  evidence: Evidence[];
  reviewerNotes: ReviewerNote[];
  notificationsEnabled: boolean;
}

const CLAIM_REASON_LABELS: Record<ClaimReason, string> = {
  fraud: 'Gian lận',
  chargeback: 'Chargeback',
  dispute_error: 'Lỗi dispute',
  other: 'Khác',
};

const CLAIM_STATUS_CONFIG: Record<ClaimStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Chờ xử lý', color: '#F59E0B', icon: Clock },
  reviewing: { label: 'Đang xem xét', color: '#3B82F6', icon: Search },
  approved: { label: 'Đã duyệt', color: '#10B981', icon: CheckCircle },
  rejected: { label: 'Từ chối', color: '#EF4444', icon: XCircle },
  paid: { label: 'Đã chi trả', color: '#10B981', icon: DollarSign },
};

/* ─── Mock Claim Detail ─── */

const MOCK_CLAIMS_DB: Record<string, ClaimDetail> = {
  'ic001': {
    id: 'ic001',
    claimCode: 'CLM-001',
    orderId: 'P2P-78400',
    orderNumber: 'VT-P2P-20260218-001',
    reason: 'fraud',
    description: 'Merchant không giải phóng coin sau khi đã xác nhận thanh toán thành công. Đã liên hệ merchant qua chat nhiều lần nhưng không phản hồi sau 6 giờ.',
    amount: 15_000_000,
    paidAmount: 12_750_000,
    currency: 'VND',
    status: 'paid',
    submittedAt: '2026-02-18 14:30',
    estimatedReview: '2026-02-20 14:30',
    coveragePct: 85,
    maxCoverage: 100_000_000,
    notificationsEnabled: true,
    timeline: [
      { id: 't1', status: 'submitted', title: 'Yêu cầu đã gửi', description: 'Hệ thống tiếp nhận yêu cầu bồi thường', timestamp: '2026-02-18 14:30', actor: 'Hệ thống' },
      { id: 't2', status: 'evidence_added', title: 'Bằng chứng bổ sung', description: 'Ảnh chụp màn hình chuyển khoản đã tải lên', timestamp: '2026-02-18 14:45', actor: 'Bạn' },
      { id: 't3', status: 'reviewing', title: 'Bắt đầu điều tra', description: 'Nhân viên hỗ trợ bắt đầu xem xét bằng chứng', timestamp: '2026-02-19 09:15', actor: 'Nguyễn Văn A' },
      { id: 't4', status: 'note_added', title: 'Ghi chú điều tra', description: 'Đã xác minh lịch sử chat và bằng chứng thanh toán', timestamp: '2026-02-19 11:30', actor: 'Nguyễn Văn A' },
      { id: 't5', status: 'approved', title: 'Đã chấp thuận', description: 'Yêu cầu bồi thường đủ điều kiện, phê duyệt chi trả 85%', timestamp: '2026-02-19 16:00', actor: 'Trưởng nhóm' },
      { id: 't6', status: 'paid', title: 'Đã chi trả', description: 'Chuyển 12.750.000 VND vào ví nội bộ', timestamp: '2026-02-20 10:00', actor: 'Hệ thống' },
    ],
    evidence: [
      { id: 'e1', type: 'screenshot', name: 'chuyen_khoan_mb.png', size: '1.2 MB', uploadedAt: '2026-02-18 14:32' },
      { id: 'e2', type: 'screenshot', name: 'chat_merchant.png', size: '850 KB', uploadedAt: '2026-02-18 14:35' },
      { id: 'e3', type: 'screenshot', name: 'order_detail.png', size: '620 KB', uploadedAt: '2026-02-18 14:45' },
      { id: 'e4', type: 'document', name: 'sao_ke_ngan_hang.pdf', size: '2.1 MB', uploadedAt: '2026-02-19 08:00' },
    ],
    reviewerNotes: [
      { id: 'rn1', author: 'Nguyễn Văn A', role: 'Chuyên viên hỗ trợ', content: 'Đã xác minh bằng chứng chuyển khoản qua MB Bank — khớp với số tiền giao dịch. Merchant không phản hồi sau 12 giờ theo quy định.', timestamp: '2026-02-19 11:30' },
      { id: 'rn2', author: 'Trần Thị B', role: 'Trưởng nhóm Claims', content: 'Phê duyệt chi trả 85% theo tier Pro. Merchant sẽ bị cảnh cáo và giảm hạng.', timestamp: '2026-02-19 16:00' },
      { id: 'rn3', author: 'Hệ thống', role: 'Tự động', content: 'Đã chuyển 12.750.000 VND vào ví nội bộ. Mã giao dịch: TXN-INS-20260220-001.', timestamp: '2026-02-20 10:00' },
    ],
  },
  'ic002': {
    id: 'ic002',
    claimCode: 'CLM-002',
    orderId: 'P2P-78412',
    orderNumber: 'VT-P2P-20260223-005',
    reason: 'chargeback',
    description: 'Buyer thực hiện chargeback qua ngân hàng sau khi đã nhận coin thành công.',
    amount: 8_000_000,
    currency: 'VND',
    status: 'reviewing',
    submittedAt: '2026-02-23 16:45',
    estimatedReview: '2026-02-25 16:45',
    expiryDate: '2026-03-02', // 7 days from submission
    coveragePct: 85,
    maxCoverage: 100_000_000,
    notificationsEnabled: true,
    timeline: [
      { id: 't1', status: 'submitted', title: 'Yêu cầu đã gửi', description: 'Hệ thống tiếp nhận yêu cầu bồi thường', timestamp: '2026-02-23 16:45', actor: 'Hệ thống' },
      { id: 't2', status: 'evidence_added', title: 'Bằng chứng bổ sung', description: 'Ảnh chụp thông báo chargeback từ ngân hàng', timestamp: '2026-02-23 17:00', actor: 'Bạn' },
      { id: 't3', status: 'reviewing', title: 'Bắt đầu điều tra', description: 'Đang xác minh với ngân hàng và buyer', timestamp: '2026-02-24 10:00', actor: 'Lê Văn C' },
    ],
    evidence: [
      { id: 'e1', type: 'screenshot', name: 'chargeback_notice.png', size: '980 KB', uploadedAt: '2026-02-23 17:00' },
      { id: 'e2', type: 'document', name: 'bank_statement.pdf', size: '1.5 MB', uploadedAt: '2026-02-23 17:15' },
    ],
    reviewerNotes: [
      { id: 'rn1', author: 'Lê Văn C', role: 'Chuyên viên hỗ trợ', content: 'Đang liên hệ buyer để xác minh. Chờ phản hồi từ ngân hàng về lệnh chargeback.', timestamp: '2026-02-24 10:15' },
    ],
  },
  'ic003': {
    id: 'ic003',
    claimCode: 'CLM-003',
    orderId: 'P2P-78415',
    orderNumber: 'VT-P2P-20260222-008',
    reason: 'dispute_error',
    description: 'Hệ thống tự động phân xử nhầm cho phía buyer trong khi seller đã cung cấp đầy đủ bằng chứng thanh toán.',
    amount: 50_000_000,
    currency: 'VND',
    status: 'approved',
    submittedAt: '2026-02-22 11:20',
    estimatedReview: '2026-02-24 11:20',
    coveragePct: 85,
    maxCoverage: 100_000_000,
    notificationsEnabled: false,
    timeline: [
      { id: 't1', status: 'submitted', title: 'Yêu cầu đã gửi', description: 'Hệ thống tiếp nhận yêu cầu bồi thường', timestamp: '2026-02-22 11:20', actor: 'Hệ thống' },
      { id: 't2', status: 'reviewing', title: 'Bắt đầu điều tra', description: 'Xem xét log hệ thống dispute', timestamp: '2026-02-22 14:00', actor: 'Phạm Văn D' },
      { id: 't3', status: 'approved', title: 'Đã chấp thuận', description: 'Xác nhận lỗi hệ thống, phê duyệt hoàn tiền 85%', timestamp: '2026-02-23 09:30', actor: 'Trưởng nhóm' },
    ],
    evidence: [
      { id: 'e1', type: 'screenshot', name: 'dispute_result.png', size: '750 KB', uploadedAt: '2026-02-22 11:25' },
    ],
    reviewerNotes: [
      { id: 'rn1', author: 'Phạm Văn D', role: 'Kỹ sư hệ thống', content: 'Xác nhận bug trong logic auto-resolve dispute. Đã tạo ticket fix #BUG-4521.', timestamp: '2026-02-22 16:00' },
      { id: 'rn2', author: 'Trần Thị B', role: 'Trưởng nhóm Claims', content: 'Phê duyệt hoàn tiền 85% = 42.500.000 VND. Đang chờ xử lý chi trả.', timestamp: '2026-02-23 09:30' },
    ],
  },
  'ic004': {
    id: 'ic004',
    claimCode: 'CLM-004',
    orderId: 'P2P-78390',
    orderNumber: 'VT-P2P-20260220-003',
    reason: 'other',
    description: 'Giao dịch bị treo do lỗi kết nối mạng, coin không được giải phóng.',
    amount: 3_000_000,
    currency: 'VND',
    status: 'rejected',
    submittedAt: '2026-02-20 08:40',
    estimatedReview: '2026-02-22 08:40',
    coveragePct: 85,
    maxCoverage: 100_000_000,
    notificationsEnabled: true,
    timeline: [
      { id: 't1', status: 'submitted', title: 'Yêu cầu đã gửi', description: 'Hệ thống tiếp nhận yêu cầu bồi thường', timestamp: '2026-02-20 08:40', actor: 'Hệ thống' },
      { id: 't2', status: 'reviewing', title: 'Bắt đầu điều tra', description: 'Xem xét log giao dịch', timestamp: '2026-02-20 14:00', actor: 'Nguyễn Văn A' },
      { id: 't3', status: 'rejected', title: 'Từ chối', description: 'Giao dịch đã được xử lý thành công sau khi kết nối lại. Coin đã giải phóng đúng hạn.', timestamp: '2026-02-21 09:00', actor: 'Nguyễn Văn A' },
    ],
    evidence: [],
    reviewerNotes: [
      { id: 'rn1', author: 'Nguyễn Văn A', role: 'Chuyên viên hỗ trợ', content: 'Kiểm tra log cho thấy giao dịch đã hoàn tất lúc 08:42 sau khi reconnect. Coin đã giải phóng cho buyer. Không phát sinh thiệt hại thực tế.', timestamp: '2026-02-21 09:00' },
    ],
  },
  'ic005': {
    id: 'ic005',
    claimCode: 'CLM-005',
    orderId: 'P2P-78425',
    orderNumber: 'VT-P2P-20260225-010',
    reason: 'fraud',
    description: 'Merchant cung cấp thông tin thanh toán giả mạo, yêu cầu chuyển khoản ngoài nền tảng.',
    amount: 25_000_000,
    currency: 'VND',
    status: 'pending',
    submittedAt: '2026-02-25 09:15',
    estimatedReview: '2026-02-27 09:15',
    expiryDate: '2026-03-06', // 7 days from submission, URGENT: only 2 days left (today is 2026-03-04)
    coveragePct: 85,
    maxCoverage: 100_000_000,
    notificationsEnabled: true,
    timeline: [
      { id: 't1', status: 'submitted', title: 'Yêu cầu đã gửi', description: 'Hệ thống tiếp nhận yêu cầu bồi thường', timestamp: '2026-02-25 09:15', actor: 'Hệ thống' },
    ],
    evidence: [
      { id: 'e1', type: 'screenshot', name: 'fake_payment_info.png', size: '1.1 MB', uploadedAt: '2026-02-25 09:18' },
      { id: 'e2', type: 'screenshot', name: 'chat_evidence.png', size: '900 KB', uploadedAt: '2026-02-25 09:20' },
    ],
    reviewerNotes: [],
  },
};

/* ═══════════════════════════════════════════════════════════ */

export function P2PClaimDetailPage() {
  const navigate = useNavigate();
  const { claimId } = useParams<{ claimId: string }>();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticWarning } = useHaptic();
  const prefix = useRoutePrefix();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const claim = MOCK_CLAIMS_DB[claimId || ''] || MOCK_CLAIMS_DB['ic001'];

  const [activeSection, setActiveSection] = useState<'timeline' | 'evidence' | 'notes'>('timeline');
  const [notiEnabled, setNotiEnabled] = useState(claim.notificationsEnabled);
  const [uploadedFiles, setUploadedFiles] = useState<Evidence[]>(claim.evidence);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAppealSheet, setShowAppealSheet] = useState(false);
  const [appealReason, setAppealReason] = useState('');

  /* ─── Sheet Analytics ─── */
  const { onAfterOpen: onCancelSheetOpen } = useSheetAnalytics('p2p-claim-cancel-confirm');
  const { onAfterOpen: onAppealSheetOpen } = useSheetAnalytics('p2p-claim-appeal');

  const [messageInput, setMessageInput] = useState('');

  const statusCfg = CLAIM_STATUS_CONFIG[claim.status];
  const StatusIcon = statusCfg.icon;

  const canUpload = claim.status === 'pending' || claim.status === 'reviewing';
  const canCancel = claim.status === 'pending';
  const canAppeal = claim.status === 'rejected';

  /* ─── Appeal deadline: 14 days from rejection ─── */
  const getAppealDeadline = (): { deadline: string; daysLeft: number; expired: boolean } => {
    if (!canAppeal) return { deadline: '', daysLeft: 0, expired: true };
    const rejectionEvent = claim.timeline.find(e => e.status === 'rejected');
    if (!rejectionEvent) return { deadline: '', daysLeft: 0, expired: true };
    const rejDate = new Date(rejectionEvent.timestamp);
    const deadlineDate = new Date(rejDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const now = new Date('2026-03-04T12:00:00'); // deterministic current date
    const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      deadline: deadlineDate.toLocaleDateString('vi-VN'),
      daysLeft: Math.max(0, daysLeft),
      expired: daysLeft <= 0,
    };
  };
  const appealInfo = getAppealDeadline();

  /* ─── Claim expiry check (TIER 3.2) ─── */
  const getExpiryInfo = (): { expiryDate: string; daysRemaining: number; shouldWarn: boolean } => {
    if (!claim.expiryDate) return { expiryDate: '', daysRemaining: 0, shouldWarn: false };
    // Only show warning for active claims (pending/reviewing)
    if (claim.status !== 'pending' && claim.status !== 'reviewing') {
      return { expiryDate: '', daysRemaining: 0, shouldWarn: false };
    }
    const expiry = new Date(claim.expiryDate);
    const now = new Date('2026-03-04T12:00:00'); // deterministic current date
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const shouldWarn = daysRemaining > 0 && daysRemaining <= 3; // warn if <= 3 days
    return { expiryDate: claim.expiryDate, daysRemaining, shouldWarn };
  };
  const expiryInfo = getExpiryInfo();

  const handleSubmitAppeal = () => {
    if (appealReason.trim().length < 20) {
      toast.error('Lý do kháng nghị quá ngắn', { description: 'Vui lòng mô tả chi tiết tối thiểu 20 ký tự' });
      return;
    }
    setShowAppealSheet(false);
    setAppealReason('');
    hapticSuccess();
    toast.success('Đã gửi kháng nghị', { description: 'Bộ phận giám sát sẽ xem xét trong 72 giờ' });
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(claim.claimCode);
    hapticSelection();
    toast.success('Đã sao chép', { description: claim.claimCode });
  };

  const handleToggleNotifications = () => {
    setNotiEnabled(!notiEnabled);
    hapticSelection();
    toast.success(
      !notiEnabled ? 'Đã bật thông báo' : 'Đã tắt thông báo',
      { description: !notiEnabled ? 'Bạn sẽ nhận thông báo khi có cập nhật' : 'Không nhận thông báo cho claim này' }
    );
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles: Evidence[] = Array.from(files).map((f, i) => ({
      id: `new-${Date.now()}-${i}`,
      type: f.type.startsWith('image/') ? 'screenshot' as const : 'document' as const,
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      uploadedAt: new Date().toLocaleString('vi-VN'),
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    hapticSuccess();
    toast.success('Đã tải lên', { description: `${newFiles.length} tệp mới` });
    e.target.value = '';
  };

  const handleRemoveEvidence = (id: string) => {
    setUploadedFiles(prev => prev.filter(e => e.id !== id));
    hapticWarning();
    toast('Đã xóa bằng chứng');
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    hapticSuccess();
    toast.success('Đã gửi tin nhắn', { description: 'Nhân viên hỗ trợ sẽ phản hồi sớm' });
    setMessageInput('');
  };

  const handleCancelClaim = () => {
    setShowCancelConfirm(false);
    hapticWarning();
    toast.success('Đã hủy yêu cầu', { description: 'Bạn có thể gửi lại yêu cầu mới bất kỳ lúc nào' });
    navigate(-1);
  };

  /* ─── Download Receipt (TIER 3.4) ─── */
  const handleDownloadReceipt = () => {
    if (claim.status !== 'paid' || !claim.paidAmount) {
      toast.error('Không thể tải biên lai', { description: 'Claim chưa được chi trả' });
      return;
    }

    // Generate receipt content
    const paidEvent = claim.timeline.find(e => e.status === 'paid');
    const paidDate = paidEvent?.timestamp || 'N/A';
    const txnRef = claim.reviewerNotes.find(n => n.content.includes('TXN-INS'))?.content.match(/TXN-INS-\d+-\d+/)?.[0] || 'TXN-INS-UNKNOWN';

    const receiptContent = `
╔══════════════════════════════════════════════════════════════╗
║                    BIÊN LAI BỒI THƯỜNG P2P                   ║
║                   P2P Insurance Fund Receipt                 ║
╚══════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────┐
│ THÔNG TIN YÊU CẦU                                            │
└──────────────────────────────────────────────────────────────┘
Mã claim:           ${claim.claimCode}
Mã đơn hàng:        ${claim.orderId}
Số tham chiếu:      ${claim.orderNumber}
Lý do:              ${CLAIM_REASON_LABELS[claim.reason]}
Ngày gửi:           ${claim.submittedAt}

┌──────────────────────────────────────────────────────────────┐
│ CHI TIẾT CHI TRẢ                                             │
└──────────────────────────────────────────────────────────────┘
Số tiền yêu cầu:    ${fmtVnd(claim.amount)} ${claim.currency}
Tỷ lệ bảo hiểm:     ${claim.coveragePct}%
Số tiền chi trả:    ${fmtVnd(claim.paidAmount)} ${claim.currency}
Ngày chi trả:       ${paidDate}
Mã giao dịch:       ${txnRef}

┌──────────────────────────────────────────────────────────────┐
│ MÔ TẢ                                                        │
└──────────────────────────────────────────────────────────────┘
${claim.description}

┌──────────────────────────────────────────────────────────────┐
│ LƯU Ý                                                        │
└──────────────────────────────────────────────────────────────┘
- Biên lai này là bằng chứng chi trả bồi thường từ Quỹ Bảo Hiểm P2P
- Số tiền đã được chuyển vào ví nội bộ của bạn
- Vui lòng kiểm tra lịch sử ví để xác nhận
- Để biết thêm chi tiết, truy cập: ${window.location.origin}/p2p/insurance/claim/${claim.id}

────────────────────────────────────────────────────────────────
Ngày xuất biên lai: ${new Date().toLocaleString('vi-VN')}
Hệ thống P2P Insurance Fund
────────────────────────────────────────────────────────────────
`.trim();

    // Create and download file
    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${claim.claimCode}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    hapticSuccess();
    toast.success('Đã tải biên lai', { description: `${claim.claimCode}.txt` });
  };

  /* ─── Timeline Step Definitions ─── */
  const PIPELINE_STEPS: { key: string; label: string; color: string }[] = [
    { key: 'submitted', label: 'Gửi', color: '#6B7280' },
    { key: 'reviewing', label: 'Xem xét', color: '#3B82F6' },
    { key: 'approved', label: 'Duyệt', color: '#10B981' },
    { key: 'paid', label: 'Chi trả', color: '#10B981' },
  ];

  const rejectedPipeline: { key: string; label: string; color: string }[] = [
    { key: 'submitted', label: 'Gửi', color: '#6B7280' },
    { key: 'reviewing', label: 'Xem xét', color: '#3B82F6' },
    { key: 'rejected', label: 'Từ chối', color: '#EF4444' },
  ];

  const activePipeline = claim.status === 'rejected' ? rejectedPipeline : PIPELINE_STEPS;

  const getStepState = (stepKey: string): 'completed' | 'active' | 'upcoming' => {
    const statusOrder = claim.status === 'rejected'
      ? ['submitted', 'reviewing', 'rejected']
      : ['submitted', 'pending', 'reviewing', 'approved', 'paid'];
    const currentIdx = statusOrder.indexOf(claim.status);
    const stepIdx = statusOrder.indexOf(stepKey);
    if (stepKey === 'submitted') return 'completed';
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'upcoming';
  };

  return (
    <PageLayout>
      <Header
        title={claim.claimCode}
        subtitle="Bảo hiểm · P2P"
        back
        right={
          <button
            onClick={handleToggleNotifications}
            className="flex items-center justify-center"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: c.searchBg, border: `1px solid ${c.border}`,
            }}
            aria-label={notiEnabled ? 'Tắt thông báo' : 'Bật thông báo'}
          >
            {notiEnabled
              ? <Bell size={18} color="#3B82F6" strokeWidth={1.8} />
              : <BellOff size={18} color={c.text3} strokeWidth={1.8} />
            }
          </button>
        }
      />

      <div className="px-5 py-4 flex flex-col" style={{ gap: φSpace[5] }}>

          {/* ── Status Hero ── */}
          <TrCard className="p-5" style={{ border: `1.5px solid ${statusCfg.color}25` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${statusCfg.color}12` }}>
                <StatusIcon size={14} color={statusCfg.color} />
                <span style={{ color: statusCfg.color, fontSize: φ.body, fontWeight: 700 }}>
                  {statusCfg.label}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2 py-1 rounded-md"
                style={{ background: c.surface2 }}
              >
                <Copy size={12} color={c.text3} />
                <span style={{ color: c.text2, fontSize: 11 }}>{claim.claimCode}</span>
              </button>
            </div>

            {/* Pipeline Progress */}
            <div className="flex items-center gap-1 mb-4">
              {activePipeline.map((step, idx) => {
                const state = getStepState(step.key);
                const isLast = idx === activePipeline.length - 1;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className="w-full rounded-full"
                        style={{
                          height: 4,
                          background: state === 'upcoming' ? c.surface2 : step.color,
                          opacity: state === 'active' ? 0.6 : 1,
                        }}
                      />
                      <span style={{
                        color: state === 'upcoming' ? c.text3 : step.color,
                        fontSize: 10, fontWeight: 600, marginTop: 4,
                      }}>
                        {step.label}
                      </span>
                    </div>
                    {!isLast && <div style={{ width: 4 }} />}
                  </div>
                );
              })}
            </div>

            {/* Summary Info */}
            <div className="flex flex-col gap-2" style={{ paddingTop: 12, borderTop: `1px solid ${c.divider}` }}>
              <div className="flex justify-between">
                <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Lệnh P2P</span>
                <button onClick={() => { hapticSelection(); }} className="flex items-center gap-1">
                  <span style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 600 }}>{claim.orderId}</span>
                  <ExternalLink size={11} color="#3B82F6" />
                </button>
              </div>
              <div className="flex justify-between">
                <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Lý do</span>
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{CLAIM_REASON_LABELS[claim.reason]}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Số tiền yêu cầu</span>
                <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtVnd(claim.amount)} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Tỷ lệ bảo hiểm</span>
                <span style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700 }}>{claim.coveragePct}%</span>
              </div>
              {claim.paidAmount && (
                <div className="flex justify-between pt-2" style={{ borderTop: `1px dashed ${c.divider}` }}>
                  <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>Đã chi trả</span>
                  <span style={{ color: '#10B981', fontSize: φ.body, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtVnd(claim.paidAmount)} đ
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Ngày gửi</span>
                <span style={{ color: c.text2, fontSize: φ.sm }}>{claim.submittedAt}</span>
              </div>
              {(claim.status === 'pending' || claim.status === 'reviewing') && (
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Dự kiến xem xét</span>
                  <span style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 600 }}>{claim.estimatedReview}</span>
                </div>
              )}
              {/* ── SLA Countdown Timer (TIER 2.3) ── */}
              {(claim.status === 'pending' || claim.status === 'reviewing') && (() => {
                const submitted = new Date(claim.submittedAt);
                const slaDeadline = new Date(claim.estimatedReview);
                const now = new Date('2026-03-04T12:00:00');
                const totalMs = slaDeadline.getTime() - submitted.getTime();
                const elapsedMs = now.getTime() - submitted.getTime();
                const remainingMs = Math.max(0, slaDeadline.getTime() - now.getTime());
                const progressPct = Math.min(100, (elapsedMs / totalMs) * 100);
                const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));
                const isOverdue = remainingMs <= 0;
                const isUrgent = !isOverdue && remainingHours <= 12;
                const barColor = isOverdue ? '#EF4444' : isUrgent ? '#F59E0B' : '#3B82F6';
                const statusText = isOverdue
                  ? 'Quá hạn SLA — đang ưu tiên xử lý'
                  : isUrgent
                    ? `Còn ${remainingHours}h — sắp hết hạn SLA`
                    : `Còn ${remainingHours}h`;
                return (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px dashed ${c.divider}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} color={barColor} />
                        <span style={{ color: barColor, fontSize: 11, fontWeight: 700 }}>
                          SLA {claim.status === 'pending' ? 'Xem xét (48h)' : 'Xử lý (72h)'}
                        </span>
                      </div>
                      <span style={{ color: barColor, fontSize: 11, fontWeight: 600 }}>
                        {statusText}
                      </span>
                    </div>
                    <div className="w-full rounded-full" style={{ height: 6, background: c.surface2 }}>
                      <div
                        className="rounded-full transition-all"
                        style={{
                          height: 6,
                          width: `${Math.min(100, progressPct)}%`,
                          background: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </TrCard>

          {/* ── Claim Expiry Warning (TIER 3.2) ── */}
          {expiryInfo.shouldWarn && (
            <ClaimExpiryWarning
              expiryDate={expiryInfo.expiryDate}
              daysRemaining={expiryInfo.daysRemaining}
            />
          )}

          {/* ── Real-time SLA Tracker (TIER 6.1) ── */}
          {(claim.status === 'pending' || claim.status === 'reviewing') && (
            <ClaimSLATracker
              status={claim.status}
              submittedAt={claim.submittedAt}
              estimatedReview={claim.estimatedReview}
            />
          )}

          {/* ── Claim Comparison Benchmarks (TIER 6.2) ── */}
          {(() => {
            const submittedTime = new Date(claim.submittedAt).getTime();
            const nowTime = new Date('2026-03-04T12:00:00').getTime();
            const processingHours = Math.round((nowTime - submittedTime) / (1000 * 60 * 60));
            
            // TIER 7.1: Enhanced prediction with merchant data
            const merchantRating = 4.2; // Mock merchant rating (1-5 scale)
            const merchantResponseTimeMinutes = 15; // Mock response time in minutes
            
            return (
              <ClaimBenchmarks
                claimAmount={claim.amount}
                claimReason={claim.reason}
                claimStatus={claim.status}
                processingHours={processingHours}
                coveragePct={claim.coveragePct}
                userTier="pro"
                evidenceCount={claim.evidence.length}
                merchantRating={merchantRating}
                merchantResponseTimeMinutes={merchantResponseTimeMinutes}
              />
            );
          })()}

          {/* ── Description ── */}
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>
              MÔ TẢ
            </p>
            <p style={{ color: c.text1, fontSize: φ.body, lineHeight: 1.6 }}>
              {claim.description}
            </p>
          </TrCard>

          {/* ── Section Tabs ── */}
          <div className="flex rounded-xl p-1" style={{ background: c.surface2 }}>
            {([
              { key: 'timeline' as const, label: 'Lịch sử', count: claim.timeline.length },
              { key: 'evidence' as const, label: 'Bằng chứng', count: uploadedFiles.length },
              { key: 'notes' as const, label: 'Ghi chú', count: claim.reviewerNotes.length },
            ]).map(tab => {
              const isActive = activeSection === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveSection(tab.key); hapticSelection(); }}
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    fontSize: φ.sm,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : c.text2,
                    background: isActive ? '#3B82F6' : 'transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                  }}
                >
                  {tab.label}
                  <span
                    className="px-1.5 py-0.5 rounded-full"
                    style={{
                      fontSize: 10, fontWeight: 700,
                      color: isActive ? '#3B82F6' : c.text3,
                      background: isActive ? 'rgba(255,255,255,0.9)' : c.surface2,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Section Content ── */}
          {activeSection === 'timeline' && (
            <TimelineSection timeline={claim.timeline} c={c} />
          )}

          {activeSection === 'evidence' && (
            <EvidenceSection
              evidence={uploadedFiles}
              c={c}
              canUpload={canUpload}
              onUpload={handleUpload}
              onRemove={handleRemoveEvidence}
              onTap={hapticSelection}
            />
          )}

          {activeSection === 'notes' && (
            <NotesSection
              notes={claim.reviewerNotes}
              c={c}
              canMessage={canUpload}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              onSendMessage={handleSendMessage}
            />
          )}

          {/* ── Notification Settings Card ── */}
          <TrCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: notiEnabled ? 'rgba(59,130,246,0.1)' : c.surface2 }}
                >
                  {notiEnabled
                    ? <Bell size={18} color="#3B82F6" />
                    : <BellOff size={18} color={c.text3} />
                  }
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, lineHeight: 1.5 }}>
                    Thông báo cập nhật
                  </p>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                    {notiEnabled ? 'Đang bật — nhận push khi có thay đổi' : 'Đã tắt — không nhận thông báo'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleNotifications}
                className="relative shrink-0"
                style={{ width: 48, height: 28 }}
              >
                <div
                  className="w-full h-full rounded-full transition-all"
                  style={{
                    background: notiEnabled ? '#3B82F6' : c.surface2,
                    border: `1.5px solid ${notiEnabled ? '#3B82F6' : c.borderSolid}`,
                  }}
                />
                <div
                  className="absolute top-1 rounded-full transition-all"
                  style={{
                    width: 20, height: 20,
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    left: notiEnabled ? 25 : 3,
                  }}
                />
              </button>
            </div>

            {notiEnabled && (
              <div className="mt-3 flex flex-col gap-1.5 pl-13" style={{ paddingLeft: 52 }}>
                {[
                  'Thay đổi trạng thái claim',
                  'Ghi chú mới từ reviewer',
                  'Yêu cầu bổ sung bằng chứng',
                  'Chi trả hoàn tất',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle size={12} color="#10B981" />
                    <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </TrCard>

          {/* ── Actions ── */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { hapticSelection(); navigate(`${prefix}/p2p/order/${claim.orderId.replace('P2P-', '')}`); }}
              className="flex items-center justify-between w-full p-4 rounded-2xl"
              style={{ background: c.surface, border: `1px solid ${c.cardBorder}` }}
            >
              <div className="flex items-center gap-3">
                <ExternalLink size={18} color={c.text2} />
                <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, lineHeight: 1.5 }}>Xem đơn hàng gốc</span>
              </div>
              <ChevronRight size={16} color={c.text3} />
            </button>

            <button
              onClick={() => { hapticSelection(); toast.info('Đang mở trung tâm hỗ trợ'); }}
              className="flex items-center justify-between w-full p-4 rounded-2xl"
              style={{ background: c.surface, border: `1px solid ${c.cardBorder}` }}
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} color={c.text2} />
                <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, lineHeight: 1.5 }}>Liên hệ hỗ trợ</span>
              </div>
              <ChevronRight size={16} color={c.text3} />
            </button>

            {canCancel && (
              <CTAButton
                variant="danger"
                onClick={() => { setShowCancelConfirm(true); hapticWarning(); }}
              >
                Hủy yêu cầu
              </CTAButton>
            )}

            {canAppeal && (
              <CTAButton
                variant="warning"
                onClick={() => { setShowAppealSheet(true); hapticWarning(); }}
              >
                Kháng nghị
              </CTAButton>
            )}

            {claim.status === 'paid' && (
              <CTAButton
                variant="success"
                onClick={handleDownloadReceipt}
              >
                <div className="flex items-center justify-center gap-2">
                  <Download size={18} strokeWidth={2} />
                  <span>Tải biên lai</span>
                </div>
              </CTAButton>
            )}
          </div>

          <div style={{ height: 24 }} />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Cancel Confirm Modal → BottomSheetV2 bottom */}
      <BottomSheetV2
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        variant="bottom"
        title="Hủy yêu cầu?"
        showCloseButton={false}
        ariaLabel="Xác nhận hủy yêu cầu bồi thường"
        onAfterOpen={onCancelSheetOpen}
      >
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <AlertTriangle size={28} color="#EF4444" />
          </div>
          <p style={{ color: c.text2, fontSize: φ.body, lineHeight: 1.6, textAlign: 'center' }}>
            Bạn sẽ mất toàn bộ bằng chứng đã nộp. Có thể gửi yêu cầu mới trong vòng 7 ngày kể từ ngày giao dịch.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowCancelConfirm(false)}
            className="flex-1 py-3.5 rounded-2xl"
            style={{ background: c.surface2, color: c.text1, fontSize: φ.body, fontWeight: 600 }}
          >
            Quay lại
          </button>
          <CTAButton
            variant="danger"
            fullWidth={false}
            className="flex-1"
            onClick={handleCancelClaim}
          >
            Xác nhận hủy
          </CTAButton>
        </div>
      </BottomSheetV2>

      {/* Appeal Sheet → BottomSheetV2 bottom */}
      <BottomSheetV2
        open={showAppealSheet}
        onClose={() => setShowAppealSheet(false)}
        variant="bottom"
        title="Kháng nghị yêu cầu"
        showCloseButton={false}
        ariaLabel="Xác nhận kháng nghị yêu cầu bồi thường"
        onAfterOpen={onAppealSheetOpen}
      >
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,193,7,0.1)' }}>
            <AlertTriangle size={28} color="#EAB308" />
          </div>
          <p style={{ color: c.text2, fontSize: φ.body, lineHeight: 1.6, textAlign: 'center' }}>
            Bạn có 14 ngày kể từ ngày từ chối để gửi kháng nghị. Hãy mô tả rõ lý do và bằng chứng của bạn.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <textarea
            rows={4}
            value={appealReason}
            onChange={e => setAppealReason(e.target.value)}
            placeholder="Mô tả lý do kháng nghị..."
            className="w-full px-4 py-3 rounded-xl resize-none outline-none"
            style={{
              background: c.surface2,
              border: `1.5px solid ${c.borderSolid}`,
              color: c.text1,
              fontSize: φ.body,
            }}
          />
          <div className="flex items-center justify-between">
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
              {appealInfo.daysLeft} ngày còn lại
            </p>
            <CTAButton
              variant="warning"
              fullWidth={false}
              className="flex-1"
              onClick={handleSubmitAppeal}
            >
              Gửi kháng nghị
            </CTAButton>
          </div>
        </div>
      </BottomSheetV2>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   TIMELINE SECTION
   ═══════════════════════════════════════════════════════════ */

interface TimelineSectionProps {
  timeline: TimelineEvent[];
  c: ReturnType<typeof useThemeColors>;
}

function TimelineSection({ timeline, c }: TimelineSectionProps) {
  const getEventIcon = (status: string): { icon: React.ElementType; color: string } => {
    switch (status) {
      case 'submitted': return { icon: Send, color: '#6B7280' };
      case 'evidence_added': return { icon: Upload, color: '#8B5CF6' };
      case 'reviewing': return { icon: Search, color: '#3B82F6' };
      case 'note_added': return { icon: MessageSquare, color: '#6366F1' };
      case 'approved': return { icon: CheckCircle, color: '#10B981' };
      case 'rejected': return { icon: XCircle, color: '#EF4444' };
      case 'paid': return { icon: DollarSign, color: '#10B981' };
      default: return { icon: Clock, color: '#6B7280' };
    }
  };

  return (
    <div className="flex flex-col">
      {timeline.map((event, idx) => {
        const { icon: EventIcon, color } = getEventIcon(event.status);
        const isLast = idx === timeline.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline Line + Dot */}
            <div className="flex flex-col items-center shrink-0" style={{ width: 32 }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${color}15`, border: `2px solid ${color}` }}
              >
                <EventIcon size={14} color={color} />
              </div>
              {!isLast && (
                <div className="flex-1 w-0.5" style={{ background: c.divider, minHeight: 24 }} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-5">
              <div className="flex items-start justify-between mb-1">
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, lineHeight: 1.5 }}>
                  {event.title}
                </p>
              </div>
              <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5, marginBottom: 4 }}>
                {event.description}
              </p>
              <div className="flex items-center gap-2">
                <span style={{ color: c.text3, fontSize: 11 }}>{event.timestamp}</span>
                {event.actor && (
                  <span style={{ color: c.text3, fontSize: 11 }}>· {event.actor}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EVIDENCE SECTION
   ═══════════════════════════════════════════════════════════ */

interface EvidenceSectionProps {
  evidence: Evidence[];
  c: ReturnType<typeof useThemeColors>;
  canUpload: boolean;
  onUpload: () => void;
  onRemove: (id: string) => void;
  onTap: () => void;
}

function EvidenceSection({ evidence, c, canUpload, onUpload, onRemove, onTap }: EvidenceSectionProps) {
  const getFileIcon = (type: Evidence['type']): React.ElementType => {
    switch (type) {
      case 'image':
      case 'screenshot': return ImageIcon;
      case 'document': return FileText;
      default: return Paperclip;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Upload button */}
      {canUpload && (
        <button
          onClick={onUpload}
          className="w-full py-4 rounded-2xl flex flex-col items-center gap-2"
          style={{
            border: `2px dashed ${c.borderSolid}`,
            background: c.surface2,
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.1)' }}
          >
            <Upload size={20} color="#3B82F6" />
          </div>
          <div className="text-center">
            <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, lineHeight: 1.5 }}>
              Tải lên bằng chứng
            </p>
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
              Hỗ trợ ảnh (PNG, JPG) và tài liệu (PDF, DOC)
            </p>
          </div>
        </button>
      )}

      {/* File list */}
      {evidence.length === 0 ? (
        <TrCard className="p-8 flex flex-col items-center gap-2">
          <Paperclip size={32} color={c.text3} />
          <p style={{ color: c.text2, fontSize: φ.body, fontWeight: 600 }}>Chưa có bằng chứng</p>
          <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5, textAlign: 'center' }}>
            Tải lên ảnh chụp màn hình, biên lai, hoặc tài liệu liên quan
          </p>
        </TrCard>
      ) : (
        evidence.map(file => {
          const FileIcon = getFileIcon(file.type);
          const isImage = file.type === 'image' || file.type === 'screenshot';
          return (
            <TrCard key={file.id} className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: isImage ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)' }}
                >
                  <FileIcon size={18} color={isImage ? '#8B5CF6' : '#3B82F6'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="truncate"
                    style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}
                  >
                    {file.name}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                    {file.size} · {file.uploadedAt}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => { onTap(); toast.info('Đang xem tệp'); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: c.surface2 }}
                  >
                    <Eye size={14} color={c.text2} />
                  </button>
                  {canUpload && (
                    <button
                      onClick={() => onRemove(file.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.08)' }}
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </button>
                  )}
                </div>
              </div>
            </TrCard>
          );
        })
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REVIEWER NOTES SECTION
   ═══════════════════════════════════════════════════════════ */

interface NotesSectionProps {
  notes: ReviewerNote[];
  c: ReturnType<typeof useThemeColors>;
  canMessage: boolean;
  messageInput: string;
  setMessageInput: (v: string) => void;
  onSendMessage: () => void;
}

function NotesSection({ notes, c, canMessage, messageInput, setMessageInput, onSendMessage }: NotesSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      {notes.length === 0 ? (
        <TrCard className="p-8 flex flex-col items-center gap-2">
          <MessageSquare size={32} color={c.text3} />
          <p style={{ color: c.text2, fontSize: φ.body, fontWeight: 600 }}>Chưa có ghi chú</p>
          <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5, textAlign: 'center' }}>
            Ghi chú từ nhân viên hỗ trợ sẽ hiển thị ở đây
          </p>
        </TrCard>
      ) : (
        notes.map(note => {
          const isSystem = note.role === 'Tự động';
          return (
            <TrCard key={note.id} className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isSystem
                      ? 'rgba(16,185,129,0.1)'
                      : 'rgba(59,130,246,0.1)',
                  }}
                >
                  <span style={{
                    fontSize: φ.sm, fontWeight: 700,
                    color: isSystem ? '#10B981' : '#3B82F6',
                  }}>
                    {isSystem ? '⚙' : note.author.charAt(0)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, lineHeight: 1.5 }}>
                      {note.author}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        fontSize: 10, fontWeight: 600,
                        color: isSystem ? '#10B981' : '#3B82F6',
                        background: isSystem ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.08)',
                      }}
                    >
                      {note.role}
                    </span>
                  </div>
                  <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6, marginBottom: 4 }}>
                    {note.content}
                  </p>
                  <span style={{ color: c.text3, fontSize: 11 }}>{note.timestamp}</span>
                </div>
              </div>
            </TrCard>
          );
        })
      )}

      {/* Message input */}
      {canMessage && (
        <div className="flex items-end gap-2 mt-1">
          <div className="flex-1">
            <textarea
              rows={2}
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder="Gửi tin nhắn cho reviewer..."
              className="w-full px-4 py-3 rounded-xl resize-none outline-none"
              style={{
                background: c.surface2,
                border: `1.5px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: φ.body,
              }}
            />
          </div>
          <button
            onClick={onSendMessage}
            disabled={!messageInput.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: messageInput.trim() ? '#3B82F6' : c.surface2,
              opacity: messageInput.trim() ? 1 : 0.5,
            }}
          >
            <Send size={18} color={messageInput.trim() ? '#fff' : c.text3} />
          </button>
        </div>
      )}
    </div>
  );
}