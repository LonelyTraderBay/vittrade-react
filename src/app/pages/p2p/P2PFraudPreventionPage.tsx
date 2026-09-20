import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  Shield, ShieldAlert, AlertTriangle, CheckCircle, XCircle,
  ChevronRight, ChevronDown, Eye, EyeOff, Phone, MessageSquare,
  CreditCard, Ban, Flag, Lock, UserX, Banknote, Globe,
  AlertOctagon, Info, ExternalLink, BookOpen, FileWarning,
  CircleAlert, ShieldCheck, Smartphone,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ, φSpace } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   P2P Fraud Prevention Center — Enterprise Safety Education
   TIER 5.2 — Scam patterns, prevention, self-assessment
   ═══════════════════════════════════════════════════════════ */

interface ScamPattern {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  howItWorks: string[];
  redFlags: string[];
  prevention: string[];
  icon: React.ElementType;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  category: 'before' | 'during' | 'after';
}

/* ─── Data ─── */

const SCAM_PATTERNS: ScamPattern[] = [
  {
    id: 'fake_payment',
    title: 'Bằng chứng thanh toán giả',
    severity: 'critical',
    description: 'Đối tác gửi screenshot chuyển khoản giả để lừa bạn giải phóng coin',
    howItWorks: [
      'Tạo đơn mua coin trên P2P',
      'Gửi ảnh chuyển khoản chỉnh sửa/giả mạo',
      'Yêu cầu bạn giải phóng coin ngay',
      'Coin bị mất, tiền không bao giờ đến',
    ],
    redFlags: [
      'Thúc giục giải phóng coin nhanh bất thường',
      'Screenshot thanh toán mờ hoặc bị crop',
      'Số tiền trên screenshot không khớp',
      'Tên người chuyển không khớp với tài khoản P2P',
    ],
    prevention: [
      'Luôn kiểm tra tài khoản ngân hàng trước khi giải phóng',
      'Chờ tiền "có" trong tài khoản, không chỉ nhìn SMS/screenshot',
      'So sánh tên, số tiền, mã giao dịch chính xác',
      'Bấm "Đã nhận" chỉ khi tiền thực sự đã vào tài khoản',
    ],
    icon: CreditCard,
  },
  {
    id: 'off_platform',
    title: 'Giao dịch ngoài nền tảng',
    severity: 'critical',
    description: 'Đối tác dụ giao dịch ngoài hệ thống để tránh escrow bảo vệ',
    howItWorks: [
      'Liên hệ qua Zalo/Telegram ngoài chat P2P',
      'Đưa ra mức giá "tốt hơn" để dụ giao dịch trực tiếp',
      'Khi chuyển tiền/coin, đối phương biến mất',
      'Không có escrow → không thể dispute/claim bảo hiểm',
    ],
    redFlags: [
      'Yêu cầu liên hệ qua kênh ngoài',
      'Đề nghị giá tốt hơn thị trường',
      'Yêu cầu chuyển coin/tiền trực tiếp',
      'Hứa hẹn nhanh hơn, không cần quy trình',
    ],
    prevention: [
      'KHÔNG BAO GIỜ giao dịch ngoài nền tảng',
      'Mọi thanh toán phải qua flow P2P có escrow',
      'Report ngay nếu bị yêu cầu giao dịch ngoài',
      'Chỉ chat trong hệ thống — tin nhắn ngoài không được bảo vệ',
    ],
    icon: Globe,
  },
  {
    id: 'chargeback',
    title: 'Chargeback sau giao dịch',
    severity: 'high',
    description: 'Buyer chuyển tiền rồi làm chargeback qua ngân hàng sau khi nhận coin',
    howItWorks: [
      'Buyer chuyển khoản thật sự qua ngân hàng',
      'Seller xác nhận nhận tiền và giải phóng coin',
      'Buyer liên hệ ngân hàng yêu cầu hoàn tiền (chargeback)',
      'Seller mất cả coin lẫn tiền',
    ],
    redFlags: [
      'Buyer mới, ít giao dịch nhưng order lớn',
      'Thúc giục giải phóng coin rất nhanh',
      'Completion rate thấp bất thường',
      'Không chịu dùng phương thức thanh toán thông thường',
    ],
    prevention: [
      'Chỉ giao dịch với buyer có rating và lịch sử tốt',
      'Cẩn thận với đơn giá trị lớn từ tài khoản mới',
      'Lưu trữ mọi bằng chứng giao dịch',
      'Nếu bị chargeback, gửi claim bảo hiểm ngay trong 7 ngày',
    ],
    icon: Banknote,
  },
  {
    id: 'impersonation',
    title: 'Mạo danh nhân viên sàn',
    severity: 'high',
    description: 'Kẻ lừa đảo giả danh admin/nhân viên sàn để lừa lấy thông tin',
    howItWorks: [
      'Liên hệ qua Telegram/Zalo giả danh nhân viên hỗ trợ',
      'Thông báo "tài khoản bị khóa" hoặc "cần xác minh"',
      'Yêu cầu cung cấp mật khẩu, mã OTP, seed phrase',
      'Chiếm quyền tài khoản hoặc rút hết coin',
    ],
    redFlags: [
      'Nhân viên liên hệ qua kênh ngoài (Telegram, Zalo, email cá nhân)',
      'Yêu cầu mật khẩu hoặc mã OTP',
      'Tạo cảm giác khẩn cấp "phải làm ngay"',
      'Link lạ yêu cầu đăng nhập',
    ],
    prevention: [
      'Nhân viên sàn KHÔNG BAO GIỜ yêu cầu mật khẩu/OTP',
      'Chỉ liên hệ hỗ trợ qua kênh chính thức trong app',
      'Thiết lập Anti-Phishing Code để nhận diện email thật',
      'Không bấm link lạ, kiểm tra domain chính xác',
    ],
    icon: UserX,
  },
  {
    id: 'triangle_scam',
    title: 'Gian lận tam giác',
    severity: 'medium',
    description: 'Kẻ lừa đảo dùng tiền từ nạn nhân khác để thanh toán đơn P2P của bạn',
    howItWorks: [
      'Kẻ lừa đảo (A) tạo đơn mua coin từ Seller (B)',
      'A dụ nạn nhân (C) chuyển tiền vào tài khoản B',
      'B nhận tiền từ C, tưởng A đã thanh toán, giải phóng coin',
      'C là nạn nhân thật sự — report ngân hàng → B bị đóng tài khoản',
    ],
    redFlags: [
      'Tên người chuyển không khớp với tên tài khoản P2P',
      'Lý do chuyển khoản ghi lạ/không liên quan',
      'Yêu cầu xác nhận bằng mã ngoài hệ thống',
    ],
    prevention: [
      'Kiểm tra tên người chuyển PHẢT khớp với tên P2P',
      'Nếu tên không khớp, KHÔNG giải phóng, mở dispute',
      'Lưu trữ sao kê ngân hàng mọi giao dịch P2P',
    ],
    icon: AlertOctagon,
  },
];

const SEVERITY_CONFIG: Record<ScamPattern['severity'], { label: string; color: string }> = {
  critical: { label: 'Nguy hiểm', color: '#EF4444' },
  high: { label: 'Cao', color: '#F59E0B' },
  medium: { label: 'Trung bình', color: '#3B82F6' },
};

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Before
  { id: 'ck1', label: '2FA đã bật', description: 'Bảo vệ tài khoản bằng 2FA', checked: true, category: 'before' },
  { id: 'ck2', label: 'Anti-Phishing Code đã thiết lập', description: 'Nhận diện email thật từ sàn', checked: false, category: 'before' },
  { id: 'ck3', label: 'Kiểm tra rating đối tác', description: 'Chỉ giao dịch với merchant uy tín', checked: true, category: 'before' },
  { id: 'ck4', label: 'Xác nhận payment method hợp lệ', description: 'Phương thức thanh toán được hỗ trợ', checked: true, category: 'before' },
  // During
  { id: 'ck5', label: 'Kiểm tra tên người chuyển', description: 'Tên phải khớp với tên P2P', checked: false, category: 'during' },
  { id: 'ck6', label: 'Chỉ bấm "Đã nhận" khi tiền thật vào TK', description: 'Không tin screenshot', checked: true, category: 'during' },
  { id: 'ck7', label: 'Không giao dịch ngoài nền tảng', description: 'Mọi thao tác trong app', checked: true, category: 'during' },
  { id: 'ck8', label: 'Lưu bằng chứng giao dịch', description: 'Screenshot chat, sao kê ngân hàng', checked: false, category: 'during' },
  // After
  { id: 'ck9', label: 'Review đối tác sau giao dịch', description: 'Giúp cộng đồng nhận diện scam', checked: true, category: 'after' },
  { id: 'ck10', label: 'Biết cách gửi claim bảo hiểm', description: 'Nắm rõ quy trình trong 7 ngày', checked: false, category: 'after' },
];

const CATEGORY_LABELS: Record<ChecklistItem['category'], string> = {
  before: 'Trước giao dịch',
  during: 'Trong giao dịch',
  after: 'Sau giao dịch',
};

/* ═══════════════════════════════════════════════════════════ */

export function P2PFraudPreventionPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();

  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [activeChecklistTab, setActiveChecklistTab] = useState<ChecklistItem['category']>('before');

  const checkedCount = checklist.filter(i => i.checked).length;
  const totalCount = checklist.length;
  const safetyScore = Math.round(checkedCount / totalCount * 100);

  const toggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    hapticSelection();
  };

  const togglePattern = (id: string) => {
    setExpandedPattern(prev => prev === id ? null : id);
    hapticSelection();
  };

  return (
    <PageLayout>
      <Header title="Phòng chống gian lận" subtitle="An toàn · P2P" back />

      <div className="px-5 py-4 flex flex-col" style={{ gap: φSpace[5] }}>
        {/* ── Safety Score Banner ── */}
        <TrCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} color={safetyScore >= 80 ? '#10B981' : safetyScore >= 50 ? '#F59E0B' : '#EF4444'} />
              <span style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>
                Chỉ số an toàn
              </span>
            </div>
            <span style={{
              color: safetyScore >= 80 ? '#10B981' : safetyScore >= 50 ? '#F59E0B' : '#EF4444',
              fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            }}>
              {safetyScore}%
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: c.surface2 }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${safetyScore}%`,
                background: safetyScore >= 80 ? '#10B981' : safetyScore >= 50 ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
            {checkedCount}/{totalCount} biện pháp bảo vệ đã áp dụng
          </p>

          {safetyScore < 100 && (
            <div
              className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(245,158,11,0.06)' }}
            >
              <AlertTriangle size={12} color="#F59E0B" />
              <span style={{ color: '#D97706', fontSize: 11, lineHeight: 1.5 }}>
                Hoàn thành checklist bên dưới để tăng chỉ số an toàn
              </span>
            </div>
          )}
        </TrCard>

        {/* ── Common Scam Patterns ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={16} color="#EF4444" />
            <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
              Các hình thức gian lận phổ biến
            </span>
          </div>

          <div className="flex flex-col" style={{ gap: φSpace[2] }}>
            {SCAM_PATTERNS.map(pattern => {
              const Icon = pattern.icon;
              const sevCfg = SEVERITY_CONFIG[pattern.severity];
              const isExpanded = expandedPattern === pattern.id;

              return (
                <TrCard key={pattern.id} className="overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => togglePattern(pattern.id)}
                    className="w-full p-4 flex items-start gap-3 text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${sevCfg.color}12` }}
                    >
                      <Icon size={18} color={sevCfg.color} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, lineHeight: 1.5 }}>
                          {pattern.title}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{ background: `${sevCfg.color}12`, color: sevCfg.color, fontSize: 9, fontWeight: 700 }}
                        >
                          {sevCfg.label}
                        </span>
                      </div>
                      <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>
                        {pattern.description}
                      </p>
                    </div>
                    <ChevronDown
                      size={16} color={c.text3}
                      className="shrink-0 mt-1 transition-transform"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4" style={{ borderTop: `1px solid ${c.divider}` }}>
                      {/* How it works */}
                      <div className="pt-4 mb-4">
                        <p style={{ color: c.text2, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.3 }}>
                          CÁCH THỨC HOẠT ĐỘNG
                        </p>
                        <div className="flex flex-col gap-2">
                          {pattern.howItWorks.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: c.surface2, color: c.text3, fontSize: 10, fontWeight: 700 }}
                              >
                                {i + 1}
                              </span>
                              <span style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Red flags */}
                      <div className="mb-4">
                        <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.3 }}>
                          DẤU HIỆU NHẬN BIẾT
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {pattern.redFlags.map((flag, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CircleAlert size={12} color="#EF4444" className="shrink-0 mt-0.5" />
                              <span style={{ color: '#DC2626', fontSize: φ.sm, lineHeight: 1.5 }}>
                                {flag}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prevention */}
                      <div>
                        <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.3 }}>
                          CÁCH PHÒNG TRÁNH
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {pattern.prevention.map((prev, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle size={12} color="#10B981" className="shrink-0 mt-0.5" />
                              <span style={{ color: '#059669', fontSize: φ.sm, lineHeight: 1.5 }}>
                                {prev}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </TrCard>
              );
            })}
          </div>
        </div>

        {/* ── Safety Checklist ── */}
        <TrCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} color="#3B82F6" />
            <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
              Checklist an toàn
            </span>
          </div>

          {/* Tab selector */}
          <div className="flex gap-1.5 mb-4">
            {(['before', 'during', 'after'] as const).map(cat => {
              const isActive = activeChecklistTab === cat;
              const catItems = checklist.filter(i => i.category === cat);
              const catChecked = catItems.filter(i => i.checked).length;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveChecklistTab(cat); hapticSelection(); }}
                  className="flex-1 py-2 rounded-lg text-center"
                  style={{
                    fontSize: 11, fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : c.text2,
                    background: isActive ? '#3B82F6' : c.surface2,
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                  <span style={{
                    display: 'block', fontSize: 9, marginTop: 2,
                    color: isActive ? 'rgba(255,255,255,0.7)' : c.text3,
                  }}>
                    {catChecked}/{catItems.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Items */}
          <div className="flex flex-col">
            {checklist
              .filter(i => i.category === activeChecklistTab)
              .map((item, idx, arr) => {
                const isLast = idx === arr.length - 1;
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className="flex items-start gap-3 py-3 text-left"
                    style={{ borderBottom: isLast ? 'none' : `1px solid ${c.divider}` }}
                  >
                    <div
                      className="w-5 h-5 rounded shrink-0 flex items-center justify-center mt-0.5"
                      style={{
                        border: `1.5px solid ${item.checked ? '#10B981' : c.borderSolid}`,
                        background: item.checked ? '#10B981' : 'transparent',
                      }}
                    >
                      {item.checked && <CheckCircle size={12} color="#fff" />}
                    </div>
                    <div className="flex-1">
                      <p style={{
                        color: item.checked ? '#10B981' : c.text1,
                        fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5,
                        textDecoration: item.checked ? 'line-through' : 'none',
                      }}>
                        {item.label}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </TrCard>

        {/* ── Emergency Actions ── */}
        <TrCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon size={16} color="#EF4444" />
            <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
              Bạn đang bị lừa đảo?
            </span>
          </div>

          <div className="flex flex-col" style={{ gap: φSpace[2] }}>
            <button
              onClick={() => { hapticSelection(); navigate(`${prefix}/p2p/insurance-fund`); }}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <div className="flex items-center gap-2.5">
                <Shield size={16} color="#EF4444" />
                <span style={{ color: '#DC2626', fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                  Gửi yêu cầu bồi thường bảo hiểm
                </span>
              </div>
              <ChevronRight size={16} color="#EF4444" />
            </button>

            <button
              onClick={() => { hapticSelection(); navigate(`${prefix}/support`); }}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <div className="flex items-center gap-2.5">
                <Phone size={16} color="#F59E0B" />
                <span style={{ color: '#D97706', fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                  Liên hệ hỗ trợ khẩn cấp
                </span>
              </div>
              <ChevronRight size={16} color="#F59E0B" />
            </button>

            <button
              onClick={() => { hapticSelection(); toast.info('Đang mở form report'); }}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: c.surface2 }}
            >
              <div className="flex items-center gap-2.5">
                <Flag size={16} color={c.text2} />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                  Report merchant gian lận
                </span>
              </div>
              <ChevronRight size={16} color={c.text3} />
            </button>
          </div>
        </TrCard>

        {/* ── Disclosure ── */}
        <div
          className="flex items-start gap-2 p-3 rounded-xl"
          style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
        >
          <Info size={12} color={c.text3} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
            Thông tin phòng chống gian lận mang tính chất giáo dục.
            Nếu bạn đã bị lừa đảo, hãy gửi claim bảo hiểm trong vòng 7 ngày và liên hệ hỗ trợ ngay.
          </p>
        </div>

        <div style={{ height: 8 }} />
      </div>
    </PageLayout>
  );
}