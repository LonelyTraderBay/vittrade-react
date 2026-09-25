import React, { useState } from 'react';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField, InputWrapper } from '@/shared/ui/InputField';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import {
  Search,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  AlertTriangle,
  Copy,
  Shield,
  Zap,
  TrendingUp,
  Star,
  CheckCircle,
  Wallet,
} from 'lucide-react';

/* ──────────────── Section Wrapper ──────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full" style={{ background: '#3B82F6' }} />
        <h2 style={{ color: '#F0F4FF', fontSize: 16, fontWeight: 700 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Swatch({ label, color, border }: { label: string; color: string; border?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-12 h-12 rounded-2xl"
        style={{ background: color, border: border ?? 'none' }}
      />
      <span style={{ color: '#8B95B3', fontSize: 10 }}>{label}</span>
      <span style={{ color: '#4A5568', fontSize: 9, fontFamily: 'monospace' }}>{color}</span>
    </div>
  );
}

function TokenRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-2"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <span style={{ color: '#8B95B3', fontSize: 13 }}>{label}</span>
      <span style={{ color: '#F0F4FF', fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

export function DesignSystemPage() {
  const [inputVal, setInputVal] = useState('');
  const [pwVal, setPwVal] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(false);

  // Interactive playground state
  const [pgVariant, setPgVariant] = useState<'primary' | 'success' | 'danger' | 'ghost'>('primary');
  const [pgLabel, setPgLabel] = useState('Mua BTC');
  const [pgDisabled, setPgDisabled] = useState(false);
  const [pgLoading, setPgLoading] = useState(false);
  const [pgFullWidth, setPgFullWidth] = useState(true);
  const [pgInputLabel, setPgInputLabel] = useState('Email');
  const [pgInputPlaceholder, setPgInputPlaceholder] = useState('you@example.com');
  const [pgInputError, setPgInputError] = useState('');
  const [pgInputPrefix, setPgInputPrefix] = useState(true);
  const [pgInputSuffix, setPgInputSuffix] = useState(false);
  const [pgInputValue, setPgInputValue] = useState('');

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <PageLayout variant="immersive" style={{ background: '#0B0E17' }}>
      <Header title="Design System" subtitle="Dev · Design System" back />

      <PageContent gap="loose" padding="default">
        {/* Hero banner */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d1b3e 0%, #1a1040 100%)',
            border: '1px solid rgba(59,130,246,0.25)',
          }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: '#8B5CF6', transform: 'translate(40%, -40%)' }}
          />
          <div className="relative">
            <p
              style={{
                color: '#3B82F6',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Enterprise Design System
            </p>
            <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              VitTrade UI Kit
            </h1>
            <p style={{ color: '#8B95B3', fontSize: 13, lineHeight: 1.6 }}>
              Shared components, design tokens, và enterprise standards cho iPhone 16 Pro Max
              (440×956pt).
            </p>
          </div>
        </div>

        {/* ═══════════ DESIGN TOKENS ═══════════ */}
        <Section title="Design Tokens">
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: '#141822', border: '1px solid #2A3356' }}
          >
            <TokenRow label="--input-height" value="52px" />
            <TokenRow label="--input-radius" value="14px" />
            <TokenRow label="--cta-height" value="52px" />
            <TokenRow label="--cta-radius" value="14px" />
            <TokenRow label="--card-radius" value="16px (rounded-2xl)" />
            <TokenRow label="--card-radius-lg" value="20px (rounded-3xl)" />
            <TokenRow label="--device-content-pad" value="20px (px-5)" />
            <TokenRow label="--section-gap" value="20px" />
            <TokenRow label="--row-py" value="14px" />
          </div>
        </Section>

        {/* ═══════════ COLORS ═══════════ */}
        <Section title="Color Palette">
          <div className="grid grid-cols-5 gap-3 mb-4">
            <Swatch label="Primary" color="#3B82F6" />
            <Swatch label="Success" color="#10B981" />
            <Swatch label="Danger" color="#EF4444" />
            <Swatch label="Warning" color="#F59E0B" />
            <Swatch label="Purple" color="#8B5CF6" />
          </div>
          <div className="grid grid-cols-5 gap-3 mb-4">
            <Swatch label="BG" color="#0B0E17" border="1px solid #2A3356" />
            <Swatch label="Card" color="#141822" border="1px solid #2A3356" />
            <Swatch label="Input" color="#1C2235" border="1px solid #2A3356" />
            <Swatch label="Border" color="#2A3356" border="1px solid #4A5568" />
            <Swatch label="Text" color="#F0F4FF" border="1px solid #2A3356" />
          </div>
          <div className="grid grid-cols-5 gap-3">
            <Swatch label="Label" color="#8B95B3" border="1px solid #2A3356" />
            <Swatch label="Muted" color="#4A5568" border="1px solid #2A3356" />
            <Swatch label="Buy" color="#10B981" />
            <Swatch label="Sell" color="#EF4444" />
            <Swatch label="Link" color="#3B82F6" />
          </div>
        </Section>

        {/* ═══════════ CTA BUTTON ═══════════ */}
        <Section title="CTAButton Component">
          <div className="flex flex-col gap-3">
            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                variant="primary"
              </p>
              <CTAButton variant="primary" onClick={handleLoadingDemo}>
                Mua BTC
              </CTAButton>
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                variant="success"
              </p>
              <CTAButton variant="success">
                <CheckCircle size={18} /> Xác nhận giao dịch
              </CTAButton>
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                variant="danger"
              </p>
              <CTAButton variant="danger">
                <AlertTriangle size={18} /> Bán BTC
              </CTAButton>
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                variant="ghost" (secondary)
              </p>
              <CTAButton
                variant="ghost"
                bg="#1C2235"
                textColor="#F0F4FF"
                style={{ border: '1.5px solid #2A3356', boxShadow: 'none' }}
              >
                <Wallet size={18} color="#3B82F6" /> Đăng nhập Demo
              </CTAButton>
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                loading=true
              </p>
              <CTAButton variant="primary" loading={loading} onClick={handleLoadingDemo}>
                Đang xử lý...
              </CTAButton>
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                disabled=true
              </p>
              <CTAButton variant="primary" disabled>
                Chưa đủ điều kiện
              </CTAButton>
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Side-by-side (flex-1)
              </p>
              <div className="flex gap-3">
                <CTAButton
                  variant="success"
                  fullWidth={false}
                  className="flex-1"
                  style={{ fontSize: 14 }}
                >
                  Mua
                </CTAButton>
                <CTAButton
                  variant="danger"
                  fullWidth={false}
                  className="flex-1"
                  style={{ fontSize: 14 }}
                >
                  Bán
                </CTAButton>
              </div>
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Custom gradient (bg prop)
              </p>
              <CTAButton bg="linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)">
                <Zap size={18} /> Launchpad Subscribe
              </CTAButton>
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                density="compact" / "standard" / "hero"
              </p>
              <div className="flex flex-col gap-2">
                <CTAButton variant="primary" density="compact">
                  Compact CTA (36px)
                </CTAButton>
                <CTAButton variant="primary" density="standard">
                  Standard CTA (52px)
                </CTAButton>
                <CTAButton variant="primary" density="hero">
                  Hero CTA (56px)
                </CTAButton>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════ INPUT FIELD ═══════════ */}
        <Section title="InputField Component">
          <div className="flex flex-col gap-4">
            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Basic with label
              </p>
              <InputField
                label="Email / Số điện thoại"
                type="email"
                placeholder="you@example.com"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                With prefix + suffix icons
              </p>
              <InputField
                label="Mật khẩu"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={pwVal}
                onChange={(e) => setPwVal(e.target.value)}
                prefix={<Lock size={18} color="#4A5568" />}
                suffix={
                  <button onClick={() => setShowPw(!showPw)}>
                    {showPw ? (
                      <EyeOff size={18} color="#4A5568" />
                    ) : (
                      <Eye size={18} color="#4A5568" />
                    )}
                  </button>
                }
              />
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Search with prefix icon
              </p>
              <InputField
                placeholder="Tìm kiếm coin, token..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                prefix={<Search size={18} color="#4A5568" />}
              />
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Error state
              </p>
              <InputField
                label="Số lượng"
                type="number"
                placeholder="0.00"
                value="abc"
                onChange={() => {}}
                error="Số lượng không hợp lệ"
              />
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                InputWrapper (dropdown-like)
              </p>
              <InputWrapper label="Chọn mạng" onClick={() => {}}>
                <Shield size={18} color="#3B82F6" />
                <span style={{ color: '#F0F4FF', fontSize: 15, flex: 1 }}>BEP-20 (BSC)</span>
                <ChevronDown size={18} color="#4A5568" />
              </InputWrapper>
            </div>

            <div>
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                InputWrapper with error
              </p>
              <InputWrapper
                label="Chọn phương thức thanh toán"
                error="Vui lòng chọn phương thức thanh toán"
                onClick={() => {}}
              >
                <span style={{ color: '#4A5568', fontSize: 15, flex: 1 }}>Chọn...</span>
                <ChevronDown size={18} color="#4A5568" />
              </InputWrapper>
            </div>
          </div>
        </Section>

        {/* ═══════════ SECTION HEADER COMPONENT ═══════════ */}
        <Section title="SectionHeader Component">
          <div className="flex flex-col gap-5">
            <div
              className="rounded-2xl p-4"
              style={{ background: '#141822', border: '1px solid #2A3356' }}
            >
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Basic title
              </p>
              <SectionHeader title="Thông tin đơn hàng" />
              <div style={{ height: 32, background: '#1C2235', borderRadius: 8 }} />
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ background: '#141822', border: '1px solid #2A3356' }}
            >
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                With accent bar
              </p>
              <SectionHeader title="Giao dịch gần đây" accent />
              <div style={{ height: 32, background: '#1C2235', borderRadius: 8 }} />
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ background: '#141822', border: '1px solid #2A3356' }}
            >
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                With subtitle + right action
              </p>
              <SectionHeader
                title="Phương thức thanh toán"
                subtitle="Chọn tối đa 5 phương thức"
                accent
                accentColor="#10B981"
                right={
                  <button style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>
                    Xem tất cả
                  </button>
                }
              />
              <div style={{ height: 32, background: '#1C2235', borderRadius: 8 }} />
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ background: '#141822', border: '1px solid #2A3356' }}
            >
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Large title + badge right
              </p>
              <SectionHeader
                title="Tài sản của tôi"
                titleSize={18}
                accent
                right={
                  <span
                    className="px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}
                  >
                    +12.5%
                  </span>
                }
              />
              <div style={{ height: 32, background: '#1C2235', borderRadius: 8 }} />
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ background: '#141822', border: '1px solid #2A3356' }}
            >
              <p
                style={{
                  color: '#4A5568',
                  fontSize: 11,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Custom accent colors
              </p>
              <div className="flex flex-col gap-4">
                <SectionHeader title="Mua (Buy)" accent accentColor="#10B981" mb={4} />
                <SectionHeader title="Bán (Sell)" accent accentColor="#EF4444" mb={4} />
                <SectionHeader title="Cảnh báo" accent accentColor="#F59E0B" mb={4} />
                <SectionHeader title="Premium" accent accentColor="#8B5CF6" mb={0} />
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════ INTERACTIVE PLAYGROUND ═══════════ */}
        <Section title="Interactive Playground">
          {/* CTA Playground */}
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: '#141822', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} color="#3B82F6" />
              <p style={{ color: '#3B82F6', fontSize: 13, fontWeight: 700 }}>
                CTAButton Playground
              </p>
            </div>

            {/* Preview */}
            <div
              className="rounded-2xl p-5 mb-4 flex items-center justify-center"
              style={{ background: '#0B0E17', border: '1px dashed #2A3356', minHeight: 80 }}
            >
              <CTAButton
                variant={pgVariant}
                disabled={pgDisabled}
                loading={pgLoading}
                fullWidth={pgFullWidth}
                bg={pgVariant === 'ghost' ? '#1C2235' : undefined}
                textColor={pgVariant === 'ghost' ? '#F0F4FF' : undefined}
                style={
                  pgVariant === 'ghost'
                    ? { border: '1.5px solid #2A3356', boxShadow: 'none' }
                    : undefined
                }
              >
                {pgLabel}
              </CTAButton>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3">
              {/* Variant */}
              <div>
                <p style={{ color: '#8B95B3', fontSize: 11, marginBottom: 6 }}>variant</p>
                <div className="flex gap-2 flex-wrap">
                  {(['primary', 'success', 'danger', 'ghost'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setPgVariant(v)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        background: pgVariant === v ? '#3B82F6' : '#1C2235',
                        color: pgVariant === v ? '#fff' : '#8B95B3',
                        border: `1px solid ${pgVariant === v ? '#3B82F6' : '#2A3356'}`,
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <p style={{ color: '#8B95B3', fontSize: 11, marginBottom: 6 }}>children (text)</p>
                <input
                  type="text"
                  value={pgLabel}
                  onChange={(e) => setPgLabel(e.target.value)}
                  className="w-full rounded-xl px-3 py-2"
                  style={{
                    background: '#1C2235',
                    border: '1px solid #2A3356',
                    color: '#F0F4FF',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: 'disabled', val: pgDisabled, set: setPgDisabled },
                  { label: 'loading', val: pgLoading, set: setPgLoading },
                  { label: 'fullWidth', val: pgFullWidth, set: setPgFullWidth },
                ].map((toggle) => (
                  <button
                    key={toggle.label}
                    onClick={() => toggle.set(!toggle.val)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: toggle.val ? 'rgba(59,130,246,0.15)' : '#1C2235',
                      color: toggle.val ? '#3B82F6' : '#4A5568',
                      border: `1px solid ${toggle.val ? 'rgba(59,130,246,0.4)' : '#2A3356'}`,
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ background: toggle.val ? '#3B82F6' : '#2A3356' }}
                    >
                      {toggle.val && <CheckCircle size={12} color="#fff" />}
                    </div>
                    {toggle.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Playground */}
          <div
            className="rounded-2xl p-4"
            style={{ background: '#141822', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} color="#10B981" />
              <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>
                InputField Playground
              </p>
            </div>

            {/* Preview */}
            <div
              className="rounded-2xl p-5 mb-4"
              style={{ background: '#0B0E17', border: '1px dashed #2A3356' }}
            >
              <InputField
                label={pgInputLabel || undefined}
                placeholder={pgInputPlaceholder}
                value={pgInputValue}
                onChange={(e) => setPgInputValue(e.target.value)}
                error={pgInputError || undefined}
                prefix={pgInputPrefix ? <Mail size={18} color="#4A5568" /> : undefined}
                suffix={pgInputSuffix ? <CheckCircle size={18} color="#10B981" /> : undefined}
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p style={{ color: '#8B95B3', fontSize: 11, marginBottom: 6 }}>label</p>
                  <input
                    type="text"
                    value={pgInputLabel}
                    onChange={(e) => setPgInputLabel(e.target.value)}
                    className="w-full rounded-xl px-3 py-2"
                    style={{
                      background: '#1C2235',
                      border: '1px solid #2A3356',
                      color: '#F0F4FF',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <p style={{ color: '#8B95B3', fontSize: 11, marginBottom: 6 }}>placeholder</p>
                  <input
                    type="text"
                    value={pgInputPlaceholder}
                    onChange={(e) => setPgInputPlaceholder(e.target.value)}
                    className="w-full rounded-xl px-3 py-2"
                    style={{
                      background: '#1C2235',
                      border: '1px solid #2A3356',
                      color: '#F0F4FF',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <p style={{ color: '#8B95B3', fontSize: 11, marginBottom: 6 }}>error</p>
                <input
                  type="text"
                  value={pgInputError}
                  onChange={(e) => setPgInputError(e.target.value)}
                  placeholder="Leave empty for no error"
                  className="w-full rounded-xl px-3 py-2"
                  style={{
                    background: '#1C2235',
                    border: '1px solid #2A3356',
                    color: '#F0F4FF',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                {[
                  { label: 'prefix (Mail)', val: pgInputPrefix, set: setPgInputPrefix },
                  { label: 'suffix (Check)', val: pgInputSuffix, set: setPgInputSuffix },
                ].map((toggle) => (
                  <button
                    key={toggle.label}
                    onClick={() => toggle.set(!toggle.val)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: toggle.val ? 'rgba(16,185,129,0.15)' : '#1C2235',
                      color: toggle.val ? '#10B981' : '#4A5568',
                      border: `1px solid ${toggle.val ? 'rgba(16,185,129,0.4)' : '#2A3356'}`,
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ background: toggle.val ? '#10B981' : '#2A3356' }}
                    >
                      {toggle.val && <CheckCircle size={12} color="#fff" />}
                    </div>
                    {toggle.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center pt-4 pb-8" style={{ borderTop: '1px solid #2A3356' }}>
          <p style={{ color: '#4A5568', fontSize: 11 }}>
            VitTrade Design System v2.4 — iPhone 16 Pro Max (440×956pt)
          </p>
          <p style={{ color: '#4A5568', fontSize: 10, marginTop: 4 }}>
            Golden Ratio φ = 1.618 • Enterprise Fintech Standards
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
