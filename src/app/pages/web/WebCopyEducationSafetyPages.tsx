/**
 * WebCopyEducationSafetyPages — Enterprise Desktop versions of:
 *   - CopyEducationPage
 *   - SafetyEducationPage
 *   - DisputeResolutionPage
 *   - CopySafetyCenterPage
 *   - RegulatoryDisclosuresPage
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Target,
  Users,
  Clock,
  Zap,
  Info,
  CheckCircle,
  XCircle,
  Shield,
  Calculator,
  BarChart3,
  Activity,
  TrendingUp,
  ChevronDown,
  FileText,
  AlertOctagon,
  Eye,
  Lock,
  Scale,
  Gavel,
  HelpCircle,
  MessageSquare,
  Flag,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { COMPLIANCE_MESSAGES } from '../../constants/copyTrading';
import { WEB_FONT, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const tooltipS = (c: any) => ({
  background: c.surface,
  border: `1px solid ${c.border}`,
  borderRadius: 10,
  fontSize: 11,
});

/* ═══════════════════════════════════════════════════
   1. WebCopyEducationPage
   ═══════════════════════════════════════════════════ */

const SCENARIO_PROFIT = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 100 + i * 1.5 + Math.sin(i / 3) * 8,
}));
const SCENARIO_LOSS = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 100 - i * 0.8 - Math.abs(Math.sin(i / 4)) * 6,
}));

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Tìm Provider',
    desc: 'Duyệt danh sách providers đã xác minh, xem hiệu suất, rủi ro, và phong cách giao dịch.',
    icon: Search,
  },
  {
    step: 2,
    title: 'Đánh giá',
    desc: 'Hoàn thành bài đánh giá phù hợp (MiFID II) để đảm bảo copy trading phù hợp với bạn.',
    icon: Target,
  },
  {
    step: 3,
    title: 'Cấu hình',
    desc: 'Chọn số tiền, chế độ copy, stop loss, và giới hạn rủi ro hàng ngày.',
    icon: Settings,
  },
  {
    step: 4,
    title: 'Giám sát',
    desc: 'Theo dõi hiệu suất real-time, nhận thông báo, điều chỉnh bất kỳ lúc nào.',
    icon: Eye,
  },
];

const COMMON_MISTAKES = [
  {
    title: 'Đầu tư quá nhiều',
    desc: 'Không bao giờ đầu tư quá 20% tổng tài sản vào copy trading.',
    icon: AlertTriangle,
    color: '#EF4444',
  },
  {
    title: 'Bỏ qua Max Drawdown',
    desc: 'ROI cao không có nghĩa là an toàn. Luôn xem Max DD trước khi copy.',
    icon: TrendingDown,
    color: '#F59E0B',
  },
  {
    title: 'Copy quá nhiều providers',
    desc: 'Tập trung 2-3 providers phù hợp thay vì dàn trải quá nhiều.',
    icon: Users,
    color: '#3B82F6',
  },
  {
    title: 'Không đặt Stop Loss',
    desc: 'Luôn đặt stop loss cho mỗi copy để giới hạn tổn thất tối đa.',
    icon: Shield,
    color: '#8B5CF6',
  },
];

function Search(props: any) {
  return <Eye {...props} />;
}
function Settings(props: any) {
  return <Zap {...props} />;
}

export function WebCopyEducationPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'how' | 'scenarios' | 'fees' | 'mistakes'>('how');
  const tabs = [
    { id: 'how' as const, label: 'Cách hoạt động' },
    { id: 'scenarios' as const, label: 'Mô phỏng' },
    { id: 'fees' as const, label: 'Phí & Chi phí' },
    { id: 'mistakes' as const, label: 'Sai lầm thường gặp' },
  ];

  return (
    <PageLayout>
      <Header title="Trung tâm Giáo dục" subtitle="Education · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Tabs */}
        <div
          className="flex items-center gap-1"
          style={{
            background: c.surface2,
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            display: 'inline-flex',
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                fontSize: WEB_FONT.base,
                fontWeight: tab === t.id ? 700 : 500,
                cursor: 'pointer',
                border: 'none',
                background: tab === t.id ? c.surface : 'transparent',
                color: tab === t.id ? c.text1 : c.text3,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'how' && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {HOW_IT_WORKS.map((s) => {
              const SIcon = s.icon;
              return (
                <div
                  key={s.step}
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                    borderRadius: 16,
                    padding: '20px 24px',
                  }}
                >
                  <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: c.primary + '12',
                      }}
                    >
                      <span style={{ color: c.primary, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                        {s.step}
                      </span>
                    </div>
                    <h4
                      style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, margin: 0 }}
                    >
                      {s.title}
                    </h4>
                  </div>
                  <p
                    style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.7, margin: 0 }}
                  >
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'scenarios' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <h3
                style={{
                  color: '#10B981',
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                Kịch bản lãi
              </h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SCENARIO_PROFIT}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
                    <XAxis dataKey="day" stroke={c.text3} fontSize={10} />
                    <YAxis stroke={c.text3} fontSize={10} />
                    <Tooltip contentStyle={tooltipS(c)} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10B981"
                      fill="#10B98120"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.sm,
                  lineHeight: 1.6,
                  margin: 0,
                  marginTop: 12,
                }}
              >
                Đầu tư $100 → kết quả $145 sau 30 ngày (+45%). Tuy nhiên, kết quả này không đảm bảo
                lặp lại.
              </p>
            </div>
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <h3
                style={{
                  color: '#EF4444',
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                Kịch bản lỗ
              </h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SCENARIO_LOSS}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
                    <XAxis dataKey="day" stroke={c.text3} fontSize={10} />
                    <YAxis stroke={c.text3} fontSize={10} />
                    <Tooltip contentStyle={tooltipS(c)} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#EF4444"
                      fill="#EF444420"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.sm,
                  lineHeight: 1.6,
                  margin: 0,
                  marginTop: 12,
                }}
              >
                Đầu tư $100 → kết quả $76 sau 30 ngày (-24%). Stop loss ở 20% sẽ đóng copy ở ~$80.
              </p>
            </div>
          </div>
        )}
        {tab === 'fees' && (
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: '24px 28px',
              maxWidth: 700,
            }}
          >
            <h3
              style={{
                color: c.text1,
                fontSize: WEB_FONT.lg,
                fontWeight: 700,
                margin: 0,
                marginBottom: 20,
              }}
            >
              Cấu trúc phí
            </h3>
            <div className="flex flex-col gap-4">
              {[
                {
                  label: 'Phí nền tảng',
                  value: '0.1% trên tổng vốn copy',
                  desc: 'Thu 1 lần khi bắt đầu copy',
                  color: '#3B82F6',
                },
                {
                  label: 'Performance Fee',
                  value: '10% trên lợi nhuận (HWM)',
                  desc: 'Chỉ thu khi có lãi mới, dùng high-water mark',
                  color: '#10B981',
                },
                {
                  label: 'Phí giao dịch',
                  value: '0.25% mỗi lệnh',
                  desc: 'Phí tiêu chuẩn cho mỗi giao dịch được copy',
                  color: '#F59E0B',
                },
              ].map((fee, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4"
                  style={{
                    padding: '16px 0',
                    borderBottom: i < 2 ? `1px solid ${c.divider}` : 'none',
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: fee.color + '12',
                    }}
                  >
                    <DollarSign size={WEB_ICON.md} color={fee.color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                        {fee.label}
                      </span>
                      <span style={{ color: fee.color, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                        {fee.value}
                      </span>
                    </div>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.sm, margin: 0 }}>{fee.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'mistakes' && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {COMMON_MISTAKES.map((m, i) => {
              const MIcon = m.icon;
              return (
                <div
                  key={i}
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                    borderRadius: 16,
                    padding: '20px 24px',
                  }}
                >
                  <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: m.color + '12',
                      }}
                    >
                      <MIcon size={WEB_ICON.md} color={m.color} />
                    </div>
                    <h4
                      style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, margin: 0 }}
                    >
                      {m.title}
                    </h4>
                  </div>
                  <p
                    style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.7, margin: 0 }}
                  >
                    {m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 24 }}>
          <p
            style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.6, textAlign: 'center' }}
          >
            {COMPLIANCE_MESSAGES.PAST_PERFORMANCE}
          </p>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   2. WebCopySafetyEducationPage
   ═══════════════════════════════════════════════════ */

const SAFETY_TOPICS = [
  {
    title: 'Hiểu rủi ro Copy Trading',
    desc: 'Copy trading mang rủi ro mất vốn. Provider không phải financial advisor. Hiệu suất quá khứ không đảm bảo tương lai.',
    icon: AlertTriangle,
    color: '#EF4444',
  },
  {
    title: 'Quản lý rủi ro hiệu quả',
    desc: 'Luôn đặt stop loss, diversify providers, không đầu tư quá khả năng. Sử dụng risk analysis tools.',
    icon: Shield,
    color: '#3B82F6',
  },
  {
    title: 'Nhận biết dấu hiệu cảnh báo',
    desc: 'Cẩn thận với providers có ROI quá cao, lịch sử ngắn, hoặc max drawdown lớn. Xem xét Sharpe ratio.',
    icon: Eye,
    color: '#F59E0B',
  },
  {
    title: 'Quyền của Copier',
    desc: 'Bạn có quyền dừng copy bất kỳ lúc nào, rút vốn, và report provider vi phạm. 24h cooling-off period.',
    icon: Scale,
    color: '#10B981',
  },
];

export function WebCopySafetyEducationPage() {
  const c = useThemeColors();
  return (
    <PageLayout>
      <Header title="An toàn & Giáo dục" subtitle="Safety Education · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {SAFETY_TOPICS.map((t, i) => {
            const TIcon = t.icon;
            return (
              <div
                key={i}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '24px 28px',
                }}
              >
                <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 48, height: 48, borderRadius: 14, background: t.color + '12' }}
                  >
                    <TIcon size={WEB_ICON.xl} color={t.color} />
                  </div>
                  <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, margin: 0 }}>
                    {t.title}
                  </h3>
                </div>
                <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.7, margin: 0 }}>
                  {t.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   3. WebCopyDisputeResolutionPage
   ═══════════════════════════════════════════════════ */

const DISPUTE_STEPS = [
  {
    step: 1,
    title: 'Gửi khiếu nại',
    desc: 'Mô tả chi tiết vấn đề, đính kèm bằng chứng (screenshots, transaction IDs).',
    icon: MessageSquare,
  },
  {
    step: 2,
    title: 'Xem xét ban đầu',
    desc: 'Đội ngũ support xem xét trong 24h làm việc. Bạn nhận xác nhận qua email.',
    icon: Eye,
  },
  {
    step: 3,
    title: 'Điều tra',
    desc: 'Phân tích audit log, transaction history, và provider behavior. Thời gian: 3-5 ngày.',
    icon: BarChart3,
  },
  {
    step: 4,
    title: 'Phán quyết',
    desc: 'Kết quả được thông báo. Có thể khiếu nại lên Ombudsman nếu không đồng ý.',
    icon: Gavel,
  },
];

export function WebCopyDisputeResolutionPage() {
  const c = useThemeColors();
  return (
    <PageLayout>
      <Header title="Giải quyết Tranh chấp" subtitle="Dispute Resolution · Copy Trading" back />
      <div style={{ padding: '24px 0 40px', maxWidth: 800 }}>
        <div className="flex flex-col gap-5">
          {DISPUTE_STEPS.map((s) => {
            const SIcon = s.icon;
            return (
              <div
                key={s.step}
                className="flex items-start gap-4"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: c.primary + '12',
                  }}
                >
                  <span style={{ color: c.primary, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                    {s.step}
                  </span>
                </div>
                <div className="flex-1">
                  <h4
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.md,
                      fontWeight: 700,
                      margin: 0,
                      marginBottom: 6,
                    }}
                  >
                    {s.title}
                  </h4>
                  <p
                    style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.7, margin: 0 }}
                  >
                    {s.desc}
                  </p>
                </div>
                <SIcon size={WEB_ICON.lg} color={c.text3} className="shrink-0 mt-1" />
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   4. WebCopySafetyCenterPage
   ═══════════════════════════════════════════════════ */

const SAFETY_SECTIONS = [
  {
    title: 'Cảnh báo rủi ro',
    desc: COMPLIANCE_MESSAGES.RISK_WARNING,
    icon: AlertTriangle,
    color: '#EF4444',
    link: '/w/trade/copy-trading/safety',
  },
  {
    title: 'Giải quyết tranh chấp',
    desc: 'Quy trình 4 bước để giải quyết mọi vấn đề. Escalation đến Ombudsman nếu cần.',
    icon: Gavel,
    color: '#F59E0B',
    link: '/w/trade/copy-dispute-resolution',
  },
  {
    title: 'Quản trị Provider',
    desc: 'Quy tắc KYC, conflict of interest, audit trail, và cooling-off period cho providers.',
    icon: Shield,
    color: '#3B82F6',
    link: '/w/trade/copy-provider-governance',
  },
  {
    title: 'Công khai pháp lý',
    desc: 'Tất cả disclosures, regulatory notices, và compliance documents.',
    icon: FileText,
    color: '#8B5CF6',
    link: '/w/trade/copy-regulatory-disclosures',
  },
  {
    title: 'Khiếu nại',
    desc: 'Gửi khiếu nại, theo dõi tiến trình, liên hệ Ombudsman.',
    icon: Flag,
    color: '#10B981',
    link: '/w/trade/copy-trading/complaints-handling',
  },
  {
    title: 'Giáo dục An toàn',
    desc: 'Tài liệu giáo dục về rủi ro, quản lý vốn, và best practices.',
    icon: BookOpen,
    color: '#3B82F6',
    link: '/w/trade/copy-trading/education',
  },
];

export function WebCopySafetyCenterPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  return (
    <PageLayout>
      <Header title="Safety Center" subtitle="An toàn & Pháp lý · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {SAFETY_SECTIONS.map((s, i) => {
            const SIcon = s.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(s.link)}
                className="text-left transition-all web-cmd-btn"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 44, height: 44, borderRadius: 12, background: s.color + '12' }}
                  >
                    <SIcon size={WEB_ICON.lg} color={s.color} />
                  </div>
                  <h4 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, margin: 0 }}>
                    {s.title}
                  </h4>
                </div>
                <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0 }}>
                  {s.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   5. WebCopyRegulatoryDisclosuresPage
   ═══════════════════════════════════════════════════ */

const DISCLOSURES = [
  {
    title: 'Cảnh báo rủi ro (ESMA)',
    text: 'Theo yêu cầu ESMA, chúng tôi thông báo rằng 76% nhà đầu tư cá nhân mất tiền khi giao dịch CFDs và copy trading. Bạn nên xem xét liệu mình có hiểu cách sản phẩm hoạt động hay không.',
    icon: AlertTriangle,
    color: '#EF4444',
  },
  {
    title: 'Miễn trừ trách nhiệm',
    text: COMPLIANCE_MESSAGES.FIDUCIARY_DISCLAIMER,
    icon: Shield,
    color: '#F59E0B',
  },
  {
    title: 'Bảo vệ Nhà đầu tư',
    text: 'Tài sản khách hàng được segregated account bảo vệ. Investor Compensation Scheme lên đến €20,000. Client Money Protection theo CASS rules.',
    icon: Lock,
    color: '#3B82F6',
  },
  {
    title: 'Conflict of Interest',
    text: 'Chúng tôi duy trì chính sách conflict of interest nghiêm ngặt. Providers phải công khai mọi xung đột. Front-running bị nghiêm cấm và giám sát tự động.',
    icon: Scale,
    color: '#8B5CF6',
  },
  {
    title: 'Best Execution Policy',
    text: 'Chúng tôi cam kết thực hiện lệnh ở giá tốt nhất có thể, xét về giá, chi phí, tốc độ, và xác suất khớp lệnh.',
    icon: Zap,
    color: '#10B981',
  },
];

export function WebCopyRegulatoryDisclosuresPage() {
  const c = useThemeColors();
  return (
    <PageLayout>
      <Header title="Công khai Pháp lý" subtitle="Regulatory Disclosures · Copy Trading" back />
      <div style={{ padding: '24px 0 40px', maxWidth: 900 }}>
        <div className="flex flex-col gap-5">
          {DISCLOSURES.map((d, i) => {
            const DIcon = d.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-4"
                style={{
                  background: d.color + '06',
                  border: `1px solid ${d.color}20`,
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 44, height: 44, borderRadius: 12, background: d.color + '12' }}
                >
                  <DIcon size={WEB_ICON.lg} color={d.color} />
                </div>
                <div className="flex-1">
                  <h4
                    style={{
                      color: d.color,
                      fontSize: WEB_FONT.md,
                      fontWeight: 700,
                      margin: 0,
                      marginBottom: 8,
                    }}
                  >
                    {d.title}
                  </h4>
                  <p
                    style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.7, margin: 0 }}
                  >
                    {d.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
