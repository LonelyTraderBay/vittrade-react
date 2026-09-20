/**
 * ══════════════════════════════════════════════════════════
 *  P2PAntiPhishingCodePage — /p2p/security/anti-phishing
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Setup anti-phishing code for P2P emails
 *  Prevents phishing attacks via email notifications
 *  Tone: Security-focused, educational, clear
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, Mail, AlertTriangle, CheckCircle, Info,
  ChevronRight, Eye, EyeOff, RefreshCw, Copy,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { InputField } from '../../components/ui/InputField';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */
const CURRENT_CODE = 'SECURE2026';
const HAS_CODE = true;

const PHISHING_EXAMPLES = [
  {
    type: 'legitimate',
    subject: '[VitTrade] P2P Order Confirmed',
    preview: 'Anti-Phishing Code: SECURE2026\n\nYour P2P order #45892 has been confirmed...',
    isLegit: true,
  },
  {
    type: 'phishing',
    subject: '[VitTrade] Urgent: Verify Your Account',
    preview: 'Your account will be suspended. Click here immediately...\n(No anti-phishing code)',
    isLegit: false,
  },
];

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PAntiPhishingCodePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();

  const [code, setCode] = useState(HAS_CODE ? CURRENT_CODE : '');
  const [isEditing, setIsEditing] = useState(!HAS_CODE);
  const [showCode, setShowCode] = useState(false);

  const handleGenerate = () => {
    const randomCode = `SEC${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setCode(randomCode);
    hapticSuccess();
    toast.success('Code mới đã được tạo');
  };

  const handleSave = () => {
    if (code.length < 6) {
      toast.error('Code phải có ít nhất 6 ký tự');
      return;
    }
    hapticSuccess();
    toast.success('Anti-phishing code đã được lưu');
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    hapticSuccess();
    toast.success('Đã copy code');
  };

  return (
    <PageLayout>
      <Header title="Anti-Phishing Code" subtitle="Bảo mật · P2P" back />

      {/* Status Card */}
      <div className="px-5 py-4">
        <TrCard
          rounded="lg"
          className="p-4"
          style={{
            background: HAS_CODE
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : hexToRgba('#F59E0B', 10),
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: HAS_CODE ? 'rgba(255,255,255,0.2)' : hexToRgba('#F59E0B', 20),
              }}
            >
              <Shield size={24} color={HAS_CODE ? '#FFFFFF' : '#F59E0B'} />
            </div>
            <div className="flex-1">
              <h2
                style={{
                  color: HAS_CODE ? '#FFFFFF' : '#F59E0B',
                  fontSize: φ.md,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {HAS_CODE ? 'Anti-Phishing Code đã bật' : 'Chưa có Anti-Phishing Code'}
              </h2>
              <p
                style={{
                  color: HAS_CODE ? 'rgba(255,255,255,0.9)' : c.text2,
                  fontSize: φ.xs,
                  lineHeight: 1.6,
                }}
              >
                {HAS_CODE
                  ? 'Mọi email P2P chính thức sẽ chứa code này'
                  : 'Thiết lập code để bảo vệ khỏi phishing'}
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      {/* What is Anti-Phishing Code */}
      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <Info size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
            <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              Anti-Phishing Code là gì?
            </h4>
          </div>
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
            Đây là mã bảo mật cá nhân xuất hiện trong mọi email chính thức từ VitTrade. Nếu email
            không có code này, đó là email giả mạo.
          </p>
          <div className="flex flex-col gap-2">
            {[
              'Bảo vệ khỏi email phishing',
              'Xác thực email chính thức',
              'Ngăn chặn lừa đảo',
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle size={12} color="#10B981" className="shrink-0 mt-1" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{benefit}</p>
              </div>
            ))}
          </div>
        </TrCard>
      </div>

      {/* Code Setup/Display */}
      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
          {isEditing ? 'Thiết lập code' : 'Code hiện tại'}
        </h3>

        {isEditing ? (
          <div className="space-y-3">
            <InputField
              label="Anti-Phishing Code"
              placeholder="Nhập code (tối thiểu 6 ký tự)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={20}
            />

            <button
              onClick={handleGenerate}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: c.surface2, color: c.text1 }}
            >
              <RefreshCw size={16} />
              Tạo code ngẫu nhiên
            </button>

            <CTAButton label="Lưu code" onClick={handleSave} icon={CheckCircle} />
          </div>
        ) : (
          <TrCard rounded="md" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>Your Code</span>
              <button
                onClick={() => {
                  hapticSelection();
                  setShowCode(!showCode);
                }}
                className="p-2"
              >
                {showCode ? <EyeOff size={16} color={c.text3} /> : <Eye size={16} color={c.text3} />}
              </button>
            </div>

            <div
              className="p-4 rounded-lg mb-4 text-center"
              style={{ background: c.surface2 }}
            >
              <p
                style={{
                  color: c.text1,
                  fontSize: φ.lg,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                }}
              >
                {showCode ? code : '••••••••••'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                className="py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1"
                style={{ background: hexToRgba('#3B82F6', 12), color: '#3B82F6' }}
              >
                <Copy size={12} />
                Copy
              </button>
              <button
                onClick={() => {
                  hapticSelection();
                  setIsEditing(true);
                }}
                className="py-2 rounded-lg font-semibold text-xs"
                style={{ background: c.surface2, color: c.text2 }}
              >
                Đổi code
              </button>
            </div>
          </TrCard>
        )}
      </div>

      {/* Email Examples */}
      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
          Ví dụ email
        </h3>

        <div className="flex flex-col gap-3">
          {PHISHING_EXAMPLES.map((example, idx) => (
            <TrCard
              key={idx}
              rounded="md"
              className="p-4"
              accentBorder={example.isLegit ? '#10B981' : '#EF4444'}
            >
              <div className="flex items-start gap-2 mb-3">
                {example.isLegit ? (
                  <CheckCircle size={16} color="#10B981" />
                ) : (
                  <AlertTriangle size={16} color="#EF4444" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={12} color={c.text3} />
                    <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>
                      {example.subject}
                    </p>
                  </div>
                  <div
                    className="p-2 rounded text-xs font-mono"
                    style={{
                      background: example.isLegit
                        ? hexToRgba('#10B981', 10)
                        : hexToRgba('#EF4444', 10),
                      color: c.text2,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {example.preview}
                  </div>
                </div>
              </div>
              <div
                className="px-2 py-1 rounded-md inline-block text-xs font-bold"
                style={{
                  background: example.isLegit
                    ? hexToRgba('#10B981', 15)
                    : hexToRgba('#EF4444', 15),
                  color: example.isLegit ? '#10B981' : '#EF4444',
                }}
              >
                {example.isLegit ? '✓ Email chính thức' : '✗ Email lừa đảo'}
              </div>
            </TrCard>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="px-5">
        <div
          className="p-3 rounded-lg flex items-start gap-2"
          style={{ background: hexToRgba('#EF4444', 10), border: `1px solid ${hexToRgba('#EF4444', 30)}` }}
        >
          <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
              Cảnh báo quan trọng
            </p>
            <ul style={{ color: c.text2, fontSize: 10, lineHeight: 1.6, paddingLeft: 16 }}>
              <li>Không chia sẻ code này với bất kỳ ai</li>
              <li>VitTrade không bao giờ hỏi code qua email/điện thoại</li>
              <li>Nếu email không có code → đó là phishing</li>
              <li>Báo ngay cho Support nếu nhận được email lạ</li>
            </ul>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}