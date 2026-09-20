import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Shield, ShieldCheck, ShieldAlert, ShieldOff,
  CheckCircle, XCircle, AlertTriangle, Info, ChevronRight,
  Lock, Fingerprint, Smartphone, Key, Mail, Eye,
  Globe, Monitor, Clock, RefreshCw, TrendingUp,
  UserCheck, FileKey, Wallet, Bell, ExternalLink,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebSecurityAuditPage — Security overview, checklist & score
 *
 * Route: /w/profile/security/audit
 *
 * Features:
 *   - Overall security score (0-100) with visual gauge
 *   - Categorized checklist (authentication, account protection, withdrawal safety, activity monitoring)
 *   - Each item: status, description, quick action to fix/enable
 *   - Risk level assessment
 *   - Recommendations with priority order
 *   - Last audit timestamp
 *   - Re-scan button
 *
 * Guidelines:
 *   - §14.1: Security Center features
 *   - Priority: Trust → Safety → Boundary Clarity
 *   - §6: No dark patterns, honest assessment
 */

/* ═══ Types ═══ */
type CheckStatus = 'pass' | 'fail' | 'warning' | 'info';
type RiskLevel = 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';

interface AuditItem {
  id: string;
  title: string;
  description: string;
  status: CheckStatus;
  statusLabel: string;
  weight: number; // how much it contributes to score
  fixRoute?: string;
  fixLabel?: string;
  icon: React.ElementType;
}

interface AuditCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  items: AuditItem[];
}

/* ═══ Mock audit data ═══ */
const AUDIT_CATEGORIES: AuditCategory[] = [
  {
    id: 'auth',
    title: 'Xác thực & Đăng nhập',
    icon: Key,
    color: '#3B82F6',
    items: [
      { id: 'password-strength', title: 'Độ mạnh mật khẩu', description: 'Mật khẩu mạnh, đủ độ dài và phức tạp', status: 'pass', statusLabel: 'Tốt', weight: 12, icon: Lock },
      { id: 'password-age', title: 'Tuổi mật khẩu', description: 'Đổi mật khẩu lần cuối 45 ngày trước', status: 'warning', statusLabel: 'Nên đổi', weight: 8, fixRoute: '/w/profile/security/change-password', fixLabel: 'Đổi mật khẩu', icon: Clock },
      { id: '2fa-enabled', title: 'Xác thực 2 bước (2FA)', description: 'Google Authenticator đã kích hoạt', status: 'pass', statusLabel: 'Đã bật', weight: 20, icon: Shield },
      { id: 'passkey', title: 'Passkey / Sinh trắc học', description: '2 passkey đã đăng ký (MacBook + iPhone)', status: 'pass', statusLabel: 'Đã bật', weight: 10, icon: Fingerprint },
      { id: 'sms-2fa', title: 'Xác thực SMS backup', description: 'SMS backup đã cấu hình (+84 ••• 1234)', status: 'pass', statusLabel: 'Đã bật', weight: 5, icon: Smartphone },
    ],
  },
  {
    id: 'account',
    title: 'Bảo vệ tài khoản',
    icon: ShieldCheck,
    color: '#10B981',
    items: [
      { id: 'anti-phishing', title: 'Mã chống giả mạo', description: 'Mã anti-phishing đã được cài đặt trong email', status: 'pass', statusLabel: 'Đã bật', weight: 10, icon: Mail },
      { id: 'kyc', title: 'Xác minh danh tính (KYC)', description: 'KYC Level 2 đã hoàn thành', status: 'pass', statusLabel: 'Đã xác minh', weight: 8, icon: UserCheck },
      { id: 'device-management', title: 'Quản lý thiết bị', description: '2 thiết bị tin tưởng — nên kiểm tra định kỳ', status: 'warning', statusLabel: 'Kiểm tra', weight: 5, fixRoute: '/w/profile/devices', fixLabel: 'Xem thiết bị', icon: Monitor },
      { id: 'login-notifications', title: 'Thông báo đăng nhập', description: 'Chưa bật thông báo khi đăng nhập từ thiết bị mới', status: 'fail', statusLabel: 'Chưa bật', weight: 5, fixRoute: '/w/profile/settings', fixLabel: 'Bật ngay', icon: Bell },
    ],
  },
  {
    id: 'withdrawal',
    title: 'An toàn rút tiền',
    icon: Wallet,
    color: '#F59E0B',
    items: [
      { id: 'whitelist', title: 'Whitelist rút tiền', description: '4 địa chỉ đã whitelist, whitelist đang bật', status: 'pass', statusLabel: 'Đã bật', weight: 15, icon: FileKey },
      { id: 'withdrawal-2fa', title: '2FA cho rút tiền', description: 'Mỗi lệnh rút đều yêu cầu xác nhận 2FA', status: 'pass', statusLabel: 'Đã bật', weight: 10, icon: Shield },
      { id: 'api-withdrawal', title: 'API rút tiền', description: 'Không có API key nào có quyền rút tiền', status: 'pass', statusLabel: 'An toàn', weight: 5, icon: Key },
    ],
  },
  {
    id: 'monitoring',
    title: 'Giám sát hoạt động',
    icon: Eye,
    color: '#8B5CF6',
    items: [
      { id: 'login-activity', title: 'Hoạt động đăng nhập', description: '2 lần đáng ngờ trong 7 ngày qua — cần kiểm tra', status: 'warning', statusLabel: 'Cần kiểm tra', weight: 5, fixRoute: '/w/profile/security/login-activity', fixLabel: 'Xem chi tiết', icon: Globe },
      { id: 'api-keys', title: 'Quản lý API Keys', description: '1 API key đang hoạt động, không có quyền rút tiền', status: 'info', statusLabel: 'Ổn', weight: 3, fixRoute: '/w/profile/api', fixLabel: 'Kiểm tra', icon: Key },
      { id: 'session-timeout', title: 'Tự động đăng xuất', description: 'Session timeout: 30 phút không hoạt động', status: 'pass', statusLabel: 'Đã bật', weight: 4, icon: Clock },
    ],
  },
];

/* ═══ Scoring ═══ */
function calculateScore(categories: AuditCategory[]): { score: number; maxScore: number; items: { pass: number; fail: number; warning: number; total: number } } {
  let score = 0;
  let maxScore = 0;
  let pass = 0, fail = 0, warning = 0, total = 0;

  for (const cat of categories) {
    for (const item of cat.items) {
      maxScore += item.weight;
      total++;
      if (item.status === 'pass') { score += item.weight; pass++; }
      else if (item.status === 'warning') { score += Math.round(item.weight * 0.5); warning++; }
      else if (item.status === 'info') { score += Math.round(item.weight * 0.8); }
      else { fail++; }
    }
  }
  return { score: Math.round((score / maxScore) * 100), maxScore, items: { pass, fail, warning, total } };
}

function getRiskLevel(score: number): { level: RiskLevel; label: string; color: string; bg: string; border: string; description: string } {
  if (score >= 90) return { level: 'excellent', label: 'Xuất sắc', color: '#10B981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)', description: 'Tài khoản được bảo vệ tốt nhất. Tiếp tục duy trì.' };
  if (score >= 75) return { level: 'good', label: 'Tốt', color: '#3B82F6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)', description: 'Tài khoản khá an toàn. Hoàn thành các mục còn lại để đạt mức xuất sắc.' };
  if (score >= 55) return { level: 'moderate', label: 'Trung bình', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', description: 'Một số biện pháp bảo mật quan trọng chưa được bật. Nên xử lý sớm.' };
  if (score >= 30) return { level: 'poor', label: 'Yếu', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', description: 'Tài khoản có nguy cơ cao. Cần bật 2FA và whitelist ngay lập tức.' };
  return { level: 'critical', label: 'Nguy hiểm', color: '#DC2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)', description: 'Tài khoản gần như không có bảo mật. Cần hành động NGAY.' };
}

const STATUS_CONFIG: Record<CheckStatus, { color: string; bg: string; icon: React.ElementType }> = {
  pass: { color: '#10B981', bg: 'rgba(16,185,129,0.06)', icon: CheckCircle },
  fail: { color: '#EF4444', bg: 'rgba(239,68,68,0.06)', icon: XCircle },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', icon: AlertTriangle },
  info: { color: '#6B7280', bg: 'rgba(107,114,128,0.06)', icon: Info },
};

export function WebSecurityAuditPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [isScanning, setIsScanning] = useState(false);
  const [lastScan] = useState('13/03/2026, 14:35');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('auth');

  const { score, items } = calculateScore(AUDIT_CATEGORIES);
  const risk = getRiskLevel(score);

  const failedItems = AUDIT_CATEGORIES.flatMap(cat => cat.items.filter(i => i.status === 'fail'));
  const warningItems = AUDIT_CATEGORIES.flatMap(cat => cat.items.filter(i => i.status === 'warning'));

  const handleRescan = async () => {
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsScanning(false);
  };

  /* ─── Card helper ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault, borderRadius: 14,
    background: c.surface, border: `1px solid ${c.borderSolid}`, ...extra,
  });

  /* ─── Score ring SVG ─── */
  const ScoreRing = ({ size = 160, strokeWidth = 10 }: { size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - score / 100);

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={c.borderSolid} strokeWidth={strokeWidth} />
        {/* Score ring */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={risk.color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        {/* Score text */}
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" dominantBaseline="middle"
          fill={risk.color} fontSize={36} fontWeight={800}>{score}</text>
        <text x={size / 2} y={size / 2 + 16} textAnchor="middle" dominantBaseline="middle"
          fill={c.text3} fontSize={12} fontWeight={500}>/ 100</text>
      </svg>
    );
  };

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ height: 56, padding: '0 24px', borderBottom: `1px solid ${c.borderSolid}`, background: c.surface }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/w/profile/security')} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, border: `1px solid ${c.borderSolid}`, cursor: 'pointer' }}>
            <ArrowLeft size={16} color={c.text1} />
          </button>
          <div>
            <h1 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>Đánh giá bảo mật</h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Bảo mật &gt; Kiểm tra bảo mật tài khoản</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Quét lần cuối: {lastScan}</span>
          <button onClick={handleRescan} disabled={isScanning}
            className="flex items-center gap-1.5"
            style={{
              padding: '6px 14px', borderRadius: 8,
              background: '#3B82F6', color: '#fff', fontSize: WEB_FONT.sm, fontWeight: 600,
              border: 'none', cursor: isScanning ? 'not-allowed' : 'pointer',
              opacity: isScanning ? 0.7 : 1,
            }}>
            <RefreshCw size={13} style={{ animation: isScanning ? 'spin 1s linear infinite' : 'none' }} />
            {isScanning ? 'Đang quét...' : 'Quét lại'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 24px' }}>
        <div className="flex flex-col" style={{ gap: 24 }}>

          {/* ═══ Score hero ═══ */}
          <div style={card()}>
            <div className="flex items-center" style={{ gap: 32 }}>
              {/* Ring */}
              <div className="shrink-0">
                <ScoreRing />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                  <div style={{ padding: '4px 14px', borderRadius: 20, background: risk.bg, border: `1px solid ${risk.border}` }}>
                    <span style={{ color: risk.color, fontSize: WEB_FONT.md, fontWeight: 700 }}>{risk.label}</span>
                  </div>
                </div>
                <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.6, marginBottom: 16 }}>
                  {risk.description}
                </p>

                {/* Mini stats */}
                <div className="flex" style={{ gap: 16 }}>
                  {[
                    { label: 'Đạt', value: items.pass, color: '#10B981', icon: CheckCircle },
                    { label: 'Cảnh báo', value: items.warning, color: '#F59E0B', icon: AlertTriangle },
                    { label: 'Chưa đạt', value: items.fail, color: '#EF4444', icon: XCircle },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <s.icon size={14} color={s.color} />
                      <span style={{ color: s.color, fontSize: WEB_FONT.md, fontWeight: 700 }}>{s.value}</span>
                      <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Priority actions (failures + warnings) ═══ */}
          {(failedItems.length > 0 || warningItems.length > 0) && (
            <div style={card({ borderColor: failedItems.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)' })}>
              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <AlertTriangle size={16} color={failedItems.length > 0 ? '#EF4444' : '#F59E0B'} />
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                  Hành động ưu tiên ({failedItems.length + warningItems.length})
                </h3>
              </div>

              <div className="flex flex-col" style={{ gap: 8 }}>
                {[...failedItems, ...warningItems].map(item => {
                  const sc = STATUS_CONFIG[item.status];
                  return (
                    <div key={item.id} className="flex items-center" style={{ padding: '10px 14px', borderRadius: 10, background: sc.bg, gap: 12, border: `1px solid ${sc.color}15` }}>
                      <div className="flex items-center justify-center shrink-0" style={{ width: 34, height: 34, borderRadius: 9, background: `${sc.color}10` }}>
                        <item.icon size={16} color={sc.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 1 }}>{item.title}</p>
                        <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{item.description}</p>
                      </div>
                      {item.fixRoute && (
                        <button onClick={() => navigate(item.fixRoute!)}
                          className="flex items-center gap-1 shrink-0"
                          style={{
                            padding: '5px 12px', borderRadius: 6,
                            background: sc.color, color: '#fff',
                            fontSize: WEB_FONT.xs, fontWeight: 600,
                            border: 'none', cursor: 'pointer',
                          }}>
                          {item.fixLabel} <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ Detailed checklist by category ═══ */}
          {AUDIT_CATEGORIES.map(cat => {
            const isExpanded = expandedCategory === cat.id;
            const catPassed = cat.items.filter(i => i.status === 'pass').length;
            const catTotal = cat.items.length;

            return (
              <div key={cat.id} style={card()}>
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  className="flex items-center justify-between"
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 10, background: `${cat.color}08` }}>
                      <cat.icon size={18} color={cat.color} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, marginBottom: 2 }}>{cat.title}</p>
                      <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{catPassed}/{catTotal} đạt yêu cầu</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mini progress */}
                    <div style={{ width: 80, height: 4, borderRadius: 2, background: c.borderSolid }}>
                      <div style={{
                        width: `${(catPassed / catTotal) * 100}%`, height: '100%', borderRadius: 2,
                        background: catPassed === catTotal ? '#10B981' : cat.color,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    {isExpanded ? <ChevronRight size={16} color={c.text3} style={{ transform: 'rotate(90deg)', transition: 'transform 0.2s' }} /> : <ChevronRight size={16} color={c.text3} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="flex flex-col" style={{ marginTop: 16, gap: 0 }}>
                    {cat.items.map((item, idx) => {
                      const sc = STATUS_CONFIG[item.status];
                      const StatusIcon = sc.icon;

                      return (
                        <div key={item.id}>
                          {idx > 0 && <div style={{ height: 1, background: c.borderSolid }} />}
                          <div className="flex items-center" style={{ padding: '12px 0', gap: 14 }}>
                            {/* Status icon */}
                            <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: 8, background: sc.bg }}>
                              <StatusIcon size={15} color={sc.color} />
                            </div>

                            {/* Item info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2" style={{ marginBottom: 1 }}>
                                <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>{item.title}</p>
                                <span style={{ padding: '1px 6px', borderRadius: 6, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 600 }}>
                                  {item.statusLabel}
                                </span>
                              </div>
                              <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{item.description}</p>
                            </div>

                            {/* Fix action */}
                            {item.fixRoute && (
                              <button onClick={() => navigate(item.fixRoute!)}
                                className="flex items-center gap-1 shrink-0 hover:underline"
                                style={{
                                  color: '#3B82F6', fontSize: WEB_FONT.xs, fontWeight: 500,
                                  background: 'none', border: 'none', cursor: 'pointer',
                                }}>
                                {item.fixLabel} <ExternalLink size={11} />
                              </button>
                            )}

                            {/* Weight indicator */}
                            <div className="shrink-0" style={{ minWidth: 40, textAlign: 'right' }}>
                              <span style={{ color: c.text3, fontSize: 10 }}>+{item.weight}pt</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* ═══ Recommendations ═══ */}
          <div style={card()}>
            <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
              <TrendingUp size={16} color="#3B82F6" />
              <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>Khuyến nghị nâng cao</h3>
            </div>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {[
                { title: 'Đổi mật khẩu định kỳ', desc: 'Nên đổi mật khẩu mỗi 60-90 ngày để giảm rủi ro', priority: 'Trung bình', color: '#F59E0B' },
                { title: 'Bật thông báo đăng nhập', desc: 'Nhận email/push khi có đăng nhập mới từ thiết bị lạ', priority: 'Cao', color: '#EF4444' },
                { title: 'Kiểm tra thiết bị tin tưởng', desc: 'Xem lại danh sách thiết bị, gỡ bỏ thiết bị không còn sử dụng', priority: 'Thấp', color: '#6B7280' },
                { title: 'Sử dụng Passkey cho mọi thiết bị', desc: 'Đăng ký passkey trên tất cả thiết bị thường dùng', priority: 'Thấp', color: '#6B7280' },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-3" style={{ padding: '10px 14px', borderRadius: 10, background: c.bg }}>
                  <div className="shrink-0" style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, marginTop: 6 }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                      <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>{r.title}</p>
                      <span style={{ padding: '1px 6px', borderRadius: 6, background: `${r.color}10`, color: r.color, fontSize: 10, fontWeight: 600 }}>
                        {r.priority}
                      </span>
                    </div>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ Score breakdown ═══ */}
          <div style={card()}>
            <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, marginBottom: 14 }}>Phân tích điểm số</h3>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {AUDIT_CATEGORIES.map(cat => {
                const catMax = cat.items.reduce((s, i) => s + i.weight, 0);
                const catScore = cat.items.reduce((s, i) => {
                  if (i.status === 'pass') return s + i.weight;
                  if (i.status === 'warning') return s + Math.round(i.weight * 0.5);
                  if (i.status === 'info') return s + Math.round(i.weight * 0.8);
                  return s;
                }, 0);
                const pct = Math.round((catScore / catMax) * 100);

                return (
                  <div key={cat.id} className="flex items-center" style={{ gap: 14 }}>
                    <div className="flex items-center gap-2 shrink-0" style={{ width: 180 }}>
                      <cat.icon size={14} color={cat.color} />
                      <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>{cat.title}</span>
                    </div>
                    <div className="flex-1" style={{ height: 6, borderRadius: 3, background: c.borderSolid }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 3,
                        background: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: 48, textAlign: 'right' }}>
                      {catScore}/{catMax}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3" style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)' }}>
            <Info size={14} color="#3B82F6" className="shrink-0" style={{ marginTop: 2 }} />
            <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              Điểm bảo mật được tính dựa trên trọng số của từng biện pháp bảo mật. Các mục như{' '}
              <span style={{ color: c.text1, fontWeight: 500 }}>2FA (+20pt)</span> và{' '}
              <span style={{ color: c.text1, fontWeight: 500 }}>Whitelist (+15pt)</span>{' '}
              có ảnh hưởng lớn nhất. Quét định kỳ để đảm bảo tài khoản luôn an toàn.
            </p>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}