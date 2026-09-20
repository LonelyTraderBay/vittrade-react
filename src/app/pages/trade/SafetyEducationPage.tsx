/**
 * ══════════════════════════════════════════════════════════════
 *  SafetyEducationPage — Phase 2: User Protection
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Common scams guide (10+ scam types)
 * - Red flags checklist (provider evaluation)
 * - Verification guide (tier system)
 * - Report provider flow
 * - Community safety tips
 * 
 * Compliance:
 * - User education requirement (ESMA)
 * - Scam prevention (consumer protection)
 * - Reporting mechanism (AML/KYC)
 * 
 * Guidelines:
 * - PageLayout + TabBar
 * - Accordion-style FAQs
 * - Action-oriented CTAs
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Shield, AlertTriangle, Eye, Flag, CheckCircle, XCircle,
  Info, AlertCircle, Users, Lock, Target, TrendingDown,
  MessageSquare, Search, FileText, ChevronDown
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

type TabType = 'scams' | 'redflags' | 'verification' | 'report';

interface ScamType {
  id: string;
  title: string;
  description: string;
  examples: string[];
  howToAvoid: string[];
}

interface RedFlag {
  id: string;
  category: 'performance' | 'behavior' | 'disclosure';
  flag: string;
  severity: 'critical' | 'warning' | 'caution';
  explanation: string;
}

const COMMON_SCAMS: ScamType[] = [
  {
    id: 'guaranteed-returns',
    title: 'Hứa hẹn lợi nhuận đảm bảo',
    description: 'Provider hứa "đảm bảo 100% lời" hoặc "không bao giờ thua"',
    examples: [
      '"Copy tôi = lời chắc chắn"',
      '"Strategy win rate 100%"',
      '"Không risk, chỉ có reward"',
    ],
    howToAvoid: [
      'KHÔNG CÓ lợi nhuận đảm bảo trong trading',
      'Win rate 100% là impossible',
      'Mọi trading đều có risk',
    ],
  },
  {
    id: 'fake-performance',
    title: 'Giả mạo hiệu suất',
    description: 'Provider edit screenshots hoặc chọn lọc trades để hiển thị',
    examples: [
      'Screenshots không có timestamps',
      'Chỉ show winning trades',
      'Performance quá khác biệt vs verified stats',
    ],
    howToAvoid: [
      'Chỉ tin verified stats trên platform',
      'Yêu cầu audit trail đầy đủ',
      'Kiểm tra Max DD và losing trades',
    ],
  },
  {
    id: 'pump-dump',
    title: 'Pump & Dump scheme',
    description: 'Provider hold coin trước, trade để pump price, rồi dump lên followers',
    examples: [
      'Trade altcoin volume thấp',
      'Entry ngay khi announce',
      'Provider sell ngay sau khi followers buy',
    ],
    howToAvoid: [
      'Kiểm tra Conflict of Interest disclosure',
      'Tránh providers trade low-liquidity coins',
      'Đọc trade history trước khi copy',
    ],
  },
  {
    id: 'identity-theft',
    title: 'Giả danh trader nổi tiếng',
    description: 'Scammer tạo tài khoản fake nhận là trader nổi tiếng',
    examples: [
      'Username gần giống (ElonMusk vs ElonMuskk)',
      'Avatar copy từ social media',
      'Claim về achievements không verify được',
    ],
    howToAvoid: [
      'Chỉ follow verified accounts',
      'Check social media links',
      'Yêu cầu video verification',
    ],
  },
  {
    id: 'exit-scam',
    title: 'Exit Scam',
    description: 'Provider tích lũy followers, rồi open positions lớn ngược xu hướng để thua lỗ chủ ý',
    examples: [
      'Đột ngột all-in vào 1 trade ngược trend',
      'Không stop-loss trong điều kiện xấu',
      'Account biến mất sau 1 trade thua lớn',
    ],
    howToAvoid: [
      'Đặt stop-loss riêng',
      'Theo dõi position sizing',
      'Dừng copy nếu behavior thay đổi đột ngột',
    ],
  },
];

const RED_FLAGS: RedFlag[] = [
  {
    id: 'rf-1',
    category: 'performance',
    flag: 'ROI quá cao so với risk (>100% với DD <10%)',
    severity: 'critical',
    explanation: 'Risk/reward ratio unrealistic. Có thể fake hoặc sắp exit scam.',
  },
  {
    id: 'rf-2',
    category: 'performance',
    flag: 'Tất cả trades đều lời (win rate 100%)',
    severity: 'critical',
    explanation: 'Impossible trong trading thực tế. Chắc chắn là scam.',
  },
  {
    id: 'rf-3',
    category: 'behavior',
    flag: 'Hứa lợi nhuận cố định (VD: 5% mỗi tuần)',
    severity: 'critical',
    explanation: 'Trading không thể có lợi nhuận cố định. Dấu hiệu Ponzi scheme.',
  },
  {
    id: 'rf-4',
    category: 'disclosure',
    flag: 'Không công khai Max Drawdown',
    severity: 'warning',
    explanation: 'Provider đang che giấu losses. Red flag lớn.',
  },
  {
    id: 'rf-5',
    category: 'behavior',
    flag: 'Trade chủ yếu low-liquidity coins',
    severity: 'warning',
    explanation: 'Có thể đang chuẩn bị pump & dump.',
  },
  {
    id: 'rf-6',
    category: 'disclosure',
    flag: 'Không tiết lộ Conflict of Interest',
    severity: 'warning',
    explanation: 'Provider có thể đang trade coins mình hold.',
  },
  {
    id: 'rf-7',
    category: 'behavior',
    flag: 'Thay đổi strategy đột ngột không announce',
    severity: 'caution',
    explanation: 'Thiếu minh bạch với followers.',
  },
  {
    id: 'rf-8',
    category: 'performance',
    flag: 'Sample size quá nhỏ (<50 trades)',
    severity: 'caution',
    explanation: 'Chưa đủ data để đánh giá. Có thể may mắn ngắn hạn.',
  },
];

export function SafetyEducationPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [activeTab, setActiveTab] = useState<TabType>('scams');
  const [expandedScam, setExpandedScam] = useState<string | null>(null);

  return (
    <PageLayout>
      <Header title="An toàn & Bảo mật" back />

      <PageContent gap="relaxed">
        {/* Hero Banner */}
        <div className="p-4 rounded-2xl" style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}>
          <div className="flex gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: c.primary }}
            >
              <Shield size={24} color="#fff" />
            </div>
            <div>
              <h3 style={{ color: c.primary, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Bảo vệ bản thân khỏi scams
              </h3>
              <p style={{ color: c.primary, fontSize: 11, lineHeight: 1.5 }}>
                Copy trading có nhiều rủi ro từ scammers. Đọc kỹ guide này trước khi copy bất kỳ ai.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'scams', label: 'Scams phổ biến' },
            { id: 'redflags', label: 'Red Flags' },
            { id: 'verification', label: 'Verification' },
            { id: 'report', label: 'Report' },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* Tab Content */}
        {activeTab === 'scams' && (
          <div className="space-y-3">
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
              {COMMON_SCAMS.length} loại scam phổ biến trong copy trading. Tap để xem chi tiết.
            </p>

            {COMMON_SCAMS.map(scam => (
              <div 
                key={scam.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <button
                  onClick={() => setExpandedScam(expandedScam === scam.id ? null : scam.id)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 text-left flex-1">
                    <AlertTriangle size={20} color="#EF4444" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                        {scam.title}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                        {scam.description}
                      </p>
                    </div>
                  </div>
                  <ChevronDown 
                    size={16} 
                    color={c.text3}
                    className="transition-transform shrink-0"
                    style={{ transform: expandedScam === scam.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {expandedScam === scam.id && (
                  <div className="px-4 pb-4" style={{ borderTop: `1px solid ${c.border}` }}>
                    <div className="pt-4 space-y-3">
                      <div>
                        <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                          Ví dụ:
                        </p>
                        <ul className="space-y-1">
                          {scam.examples.map((example, i) => (
                            <li key={i} style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                              • {example}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                          Cách tránh:
                        </p>
                        <ul className="space-y-1">
                          {scam.howToAvoid.map((tip, i) => (
                            <li key={i} style={{ color: '#10B981', fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                              ✓ {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'redflags' && (
          <div className="space-y-4">
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
              Checklist để đánh giá provider trước khi copy. Nếu có ≥2 red flags nghiêm trọng, KHÔNG nên copy.
            </p>

            {/* Critical Flags */}
            <PageSection label="🚨 Critical (Tuyệt đối không copy)" accentColor="#EF4444">
              <div className="space-y-2">
                {RED_FLAGS.filter(f => f.severity === 'critical').map(flag => (
                  <div 
                    key={flag.id}
                    className="p-3 rounded-xl"
                    style={{ background: '#FEF2F2', border: '1px solid #EF4444' }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <XCircle size={14} color="#EF4444" className="shrink-0 mt-0.5" />
                      <p style={{ color: '#991B1B', fontSize: 11, fontWeight: 600, lineHeight: 1.4 }}>
                        {flag.flag}
                      </p>
                    </div>
                    <p style={{ color: '#991B1B', fontSize: 9, lineHeight: 1.4 }}>
                      {flag.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Warning Flags */}
            <PageSection label="⚠️ Warning (Cần thận trọng)" accentColor="#F59E0B">
              <div className="space-y-2">
                {RED_FLAGS.filter(f => f.severity === 'warning').map(flag => (
                  <div 
                    key={flag.id}
                    className="p-3 rounded-xl"
                    style={{ background: '#FFFBEB', border: '1px solid #F59E0B' }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
                      <p style={{ color: '#92400E', fontSize: 11, fontWeight: 600, lineHeight: 1.4 }}>
                        {flag.flag}
                      </p>
                    </div>
                    <p style={{ color: '#92400E', fontSize: 9, lineHeight: 1.4 }}>
                      {flag.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Caution Flags */}
            <PageSection label="ℹ️ Caution (Kiểm tra kỹ)" accentColor="#3B82F6">
              <div className="space-y-2">
                {RED_FLAGS.filter(f => f.severity === 'caution').map(flag => (
                  <div 
                    key={flag.id}
                    className="p-3 rounded-xl"
                    style={{ background: '#EFF6FF', border: '1px solid #3B82F6' }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
                      <p style={{ color: '#1E3A8A', fontSize: 11, fontWeight: 600, lineHeight: 1.4 }}>
                        {flag.flag}
                      </p>
                    </div>
                    <p style={{ color: '#1E3A8A', fontSize: 9, lineHeight: 1.4 }}>
                      {flag.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
              <div className="flex items-start gap-2">
                <Shield size={14} color={c.primary} className="shrink-0 mt-0.5" />
                <p style={{ color: c.primary, fontSize: 11, lineHeight: 1.5 }}>
                  Verification là cơ chế bảo vệ user. Provider verified đã qua kiểm tra KYC và performance audit.
                </p>
              </div>
            </div>

            {/* Verification Tiers */}
            <PageSection label="Verification Tiers" accentColor={c.primary}>
              <div className="space-y-3">
                {[
                  { 
                    tier: 'Pro', 
                    color: '#8B5CF6',
                    requirements: [
                      'KYC Level 2 (ID + Selfie + PoA)',
                      'Trading history ≥12 tháng verified',
                      'Vốn tối thiểu $50,000',
                      'Sharpe Ratio >1.5',
                      'Performance audit hàng tháng',
                    ],
                  },
                  { 
                    tier: 'Verified', 
                    color: c.primary,
                    requirements: [
                      'KYC Level 2',
                      'Trading history ≥6 tháng',
                      'Vốn tối thiểu $10,000',
                      'Sharpe Ratio >1.0',
                      'Disclosure requirements đầy đủ',
                    ],
                  },
                  { 
                    tier: 'Basic', 
                    color: '#6B7280',
                    requirements: [
                      'KYC Level 1 (Email + Phone)',
                      'Không có performance audit',
                      'KHÔNG khuyến nghị copy',
                    ],
                  },
                ].map(({ tier, color, requirements }) => (
                  <div 
                    key={tier}
                    className="p-4 rounded-xl"
                    style={{ background: c.surface, border: `2px solid ${color}` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={16} color={color} />
                      <span style={{ color, fontSize: 14, fontWeight: 700 }}>{tier}</span>
                    </div>
                    <ul className="space-y-1">
                      {requirements.map((req, i) => (
                        <li key={i} style={{ color: c.text2, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                          • {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </PageSection>

            <div className="p-3 rounded-xl" style={{ background: c.warningBg }}>
              <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.5, textAlign: 'center' }}>
                <strong>Lưu ý:</strong> Verification chỉ xác nhận identity và quá khứ. 
                KHÔNG đảm bảo provider sẽ tiếp tục thành công trong tương lai.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl" style={{ background: c.dangerBg, border: `1px solid ${c.dangerBorder}` }}>
              <div className="flex items-start gap-2">
                <Flag size={14} color={c.dangerText} className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.dangerText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                    Khi nào nên report?
                  </p>
                  <ul className="space-y-1">
                    {[
                      'Provider hứa lợi nhuận đảm bảo',
                      'Phát hiện fake performance',
                      'Bị lừa đảo hoặc scam',
                      'Provider có hành vi market manipulation',
                      'Vi phạm Terms of Service',
                    ].map((reason, i) => (
                      <li key={i} style={{ color: c.dangerText, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Report Form Preview */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <h4 style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                Report Provider
              </h4>

              <div className="space-y-3">
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                    Provider ID hoặc tên
                  </label>
                  <input
                    type="text"
                    placeholder="VD: CryptoKing hoặc trader-1"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                    Lý do report
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 13,
                    }}
                  >
                    <option>Scam / Lừa đảo</option>
                    <option>Fake performance</option>
                    <option>Market manipulation</option>
                    <option>Hứa lợi nhuận đảm bảo</option>
                    <option>Vi phạm ToS</option>
                    <option>Khác</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                    Mô tả chi tiết
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Mô tả chi tiết vấn đề, cung cấp bằng chứng nếu có..."
                    className="w-full px-4 py-3 rounded-xl"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 12,
                      resize: 'none',
                    }}
                  />
                </div>

                <button
                  onClick={() => alert('Report submitted! Team sẽ review trong 24-48h.')}
                  className="w-full py-3 rounded-xl"
                  style={{
                    background: c.dangerText,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Submit Report
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.5, textAlign: 'center' }}>
                Báo cáo của bạn sẽ được review trong 24-48h. Nếu report hợp lệ, provider sẽ bị đình chỉ 
                và investigation. Reports giả mạo có thể dẫn đến tài khoản của bạn bị khóa.
              </p>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
