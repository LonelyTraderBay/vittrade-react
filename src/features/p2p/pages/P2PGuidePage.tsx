import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { Header } from '@/shared/ui/layout/Header';
import { TabBar } from '@/shared/ui/TabBar';
import {
  BookOpen,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
  Zap,
  HelpCircle,
  FileText,
  Wallet,
  Eye,
} from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { TrCard } from '@/shared/ui/TrCard';
import { CTAButton } from '@/shared/ui/CTAButton';
import {
  FAQ_DATA,
  LEVEL_COLORS,
  SAFETY_TIPS,
  STEPS_BUY,
  STEPS_SELL,
  TABS,
  VIDEOS,
  type TabKey,
} from '@/features/p2p/model/p2p-guide-content';

/* ═══════════════════════════════════════════════════════════
   P2P Guide & Onboarding Page
   ─── Performance-optimized: zero motion, zero useEffect,
   pure CSS transitions, instant render ───
   ═══════════════════════════════════════════════════════════ */

export function P2PGuidePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();

  const [tab, setTab] = useState<TabKey>('FAQ');
  const [guideMode, setGuideMode] = useState<'buy' | 'sell'>('buy');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const steps = guideMode === 'buy' ? STEPS_BUY : STEPS_SELL;

  const handleTabChange = useCallback(
    (t: TabKey) => {
      setTab(t);
      hapticSelection();
    },
    [hapticSelection],
  );

  return (
    <PageLayout>
      <Header title="Hướng dẫn P2P" subtitle="Hướng dẫn · P2P" back />

      {/* ─── Tab Bar — Pure CSS indicator, zero motion ─── */}
      <TabBar tabs={TABS} active={tab} onChange={handleTabChange} />

      {/* ─── Content ─── */}
      <PageContent>
        {/* ═══ TAB 1: How it Works ═══ */}
        {tab === 'Hướng dẫn' && (
          <div className="flex flex-col gap-4">
            {/* Buy/Sell Toggle */}
            <div className="flex rounded-xl p-1" style={{ background: c.surface2 }}>
              <button
                onClick={() => {
                  setGuideMode('buy');
                  hapticSelection();
                }}
                className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5"
                style={{
                  background: guideMode === 'buy' ? '#10B981' : 'transparent',
                  color: guideMode === 'buy' ? '#fff' : c.text3,
                  fontWeight: 700,
                  fontSize: 13,
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                <Wallet size={13} /> Mua Crypto
              </button>
              <button
                onClick={() => {
                  setGuideMode('sell');
                  hapticSelection();
                }}
                className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5"
                style={{
                  background: guideMode === 'sell' ? '#EF4444' : 'transparent',
                  color: guideMode === 'sell' ? '#fff' : c.text3,
                  fontWeight: 700,
                  fontSize: 13,
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                <FileText size={13} /> Bán Crypto
              </button>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-0 relative">
              <div
                className="absolute left-[18px] top-6 bottom-6 w-0.5"
                style={{ background: c.divider }}
              />
              {steps.map((s) => (
                <div key={s.step} className="flex items-start gap-4 py-3 relative z-10">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: s.color + '18', border: `2px solid ${s.color}` }}
                  >
                    <s.icon size={14} color={s.color} />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          background: s.color + '14',
                          color: s.color,
                          fontWeight: 700,
                          fontSize: 9,
                        }}
                      >
                        Bước {s.step}
                      </span>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                        {s.title}
                      </span>
                    </div>
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Start CTA */}
            <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.12)' }}
                >
                  <Zap size={18} color="#10B981" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Bắt đầu ngay!</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Thực hiện giao dịch đầu tiên</p>
                </div>
              </div>
              <div className="flex gap-2">
                <CTAButton onClick={() => navigate(`${prefix}/p2p`)} variant="success" fullWidth>
                  Mua crypto ngay
                </CTAButton>
              </div>
            </TrCard>

            {/* Key Concepts */}
            <div>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Thuật ngữ quan trọng
              </p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    term: 'Escrow',
                    def: 'Hệ thống ký quỹ tự động khóa crypto cho đến khi giao dịch hoàn tất.',
                  },
                  { term: 'Maker', def: 'Người tạo quảng cáo (đăng offer) — miễn phí giao dịch.' },
                  { term: 'Taker', def: 'Người đặt đơn theo quảng cáo có sẵn — phí 0.1%.' },
                  {
                    term: 'KYC',
                    def: 'Know Your Customer — xác minh danh tính để tăng giới hạn giao dịch.',
                  },
                ].map((item) => (
                  <div
                    key={item.term}
                    className="rounded-xl px-3 py-2.5"
                    style={{ background: c.surface2 }}
                  >
                    <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700 }}>
                      {item.term}:{' '}
                    </span>
                    <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                      {item.def}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 2: Safety Tips ═══ */}
        {tab === 'An toàn' && (
          <div className="flex flex-col gap-4">
            {/* Warning Banner */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.08))',
                border: '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <Shield size={16} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>
                  An toàn giao dịch
                </span>
              </div>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                VitTrade bảo vệ giao dịch của bạn qua Escrow. Tuy nhiên, hãy luôn cẩn thận và tuân
                thủ các nguyên tắc an toàn.
              </p>
            </div>

            {/* Tips */}
            {SAFETY_TIPS.map((tip) => (
              <TrCard key={tip.title} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: tip.color + '14' }}
                  >
                    <tip.icon size={16} color={tip.color} />
                  </div>
                  <div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                      {tip.title}
                    </p>
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>{tip.desc}</p>
                  </div>
                </div>
              </TrCard>
            ))}

            {/* Emergency */}
            <TrCard className="p-4" accentBorder="rgba(239,68,68,0.3)">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>
                  Nghi ngờ lừa đảo?
                </span>
              </div>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6, marginBottom: 10 }}>
                Nếu bạn nghi ngờ giao dịch có dấu hiệu lừa đảo, hãy mở tranh chấp ngay lập tức.
                Không giải phóng crypto cho đến khi đã nhận đủ tiền.
              </p>
              <CTAButton onClick={() => navigate(`${prefix}/support/help`)} variant="danger">
                Liên hệ hỗ trợ khẩn cấp
              </CTAButton>
            </TrCard>
          </div>
        )}

        {/* ═══ TAB 3: FAQ — Pure CSS accordion ═══ */}
        {tab === 'FAQ' && (
          <div className="flex flex-col gap-2">
            <div className="mb-2">
              <h3 style={{ color: c.text1, fontSize: 21, fontWeight: 700, marginBottom: 4 }}>
                Câu hỏi thường gặp
              </h3>
              <p style={{ color: c.text3, fontSize: 11 }}>{FAQ_DATA.length} câu hỏi</p>
            </div>

            {FAQ_DATA.map((faq, i) => (
              <FaqItem
                key={i}
                faq={faq}
                isOpen={expandedFaq === i}
                onToggle={() => {
                  setExpandedFaq(expandedFaq === i ? null : i);
                  hapticSelection();
                }}
              />
            ))}
          </div>
        )}

        {/* ═══ TAB 4: Video Tutorials ═══ */}
        {tab === 'Video' && (
          <div className="flex flex-col gap-3">
            <div className="mb-1">
              <h3 style={{ color: c.text1, fontSize: 21, fontWeight: 700, marginBottom: 4 }}>
                Video hướng dẫn
              </h3>
              <p style={{ color: c.text3, fontSize: 11 }}>{VIDEOS.length} video</p>
            </div>

            {VIDEOS.map((v) => {
              const levelStyle = LEVEL_COLORS[v.level];
              return (
                <TrCard
                  key={v.title}
                  as="button"
                  hover
                  className="w-full p-3.5"
                  onClick={() => hapticSelection()}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-16 h-11 rounded-lg flex items-center justify-center shrink-0 relative"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#3B82F6',
                          letterSpacing: 0.5,
                        }}
                      >
                        {v.thumb}
                      </span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.45)' }}
                        >
                          <Play size={10} color="#fff" fill="#fff" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p
                        className="truncate"
                        style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 3 }}
                      >
                        {v.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Clock size={9} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: 9 }}>{v.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={9} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: 9 }}>{v.views}</span>
                        </div>
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            background: levelStyle.bg,
                            color: levelStyle.color,
                            fontSize: 8,
                            fontWeight: 700,
                          }}
                        >
                          {v.level}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} color={c.text3} />
                  </div>
                </TrCard>
              );
            })}

            <div
              className="rounded-xl py-4 flex flex-col items-center gap-2"
              style={{ background: c.surface2 }}
            >
              <BookOpen size={18} color={c.text3} />
              <p style={{ color: c.text3, fontSize: 11 }}>Thêm video đang được cập nhật...</p>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════
   FAQ Item — Pure CSS grid-row accordion
   Zero useEffect, zero scrollHeight measurement
   Uses CSS grid-template-rows: 0fr → 1fr trick
   ═══════════════════════════════════════════════════════ */
function FaqItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  const c = useThemeColors();

  return (
    <TrCard className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5"
        style={{ minHeight: 44 }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: isOpen ? 'rgba(59,130,246,0.12)' : c.surface2,
            transition: 'background 150ms ease',
          }}
        >
          <HelpCircle size={13} color={isOpen ? '#3B82F6' : c.text3} />
        </div>
        <span
          className="flex-1 text-left"
          style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}
        >
          {faq.q}
        </span>
        <div
          style={{
            transition: 'transform 200ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDown size={14} color={c.text3} />
        </div>
      </button>
      {/* CSS grid-template-rows trick: 0fr → 1fr, no JS measurement */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          opacity: isOpen ? 1 : 0,
          transition: 'grid-template-rows 250ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="px-4 pb-3.5 pl-14">
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.7 }}>{faq.a}</p>
          </div>
        </div>
      </div>
    </TrCard>
  );
}
