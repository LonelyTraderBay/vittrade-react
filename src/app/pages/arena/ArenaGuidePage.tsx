import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  Sparkles, ChevronDown, ChevronRight, CheckCircle, Play,
  HelpCircle, BookOpen, AlertTriangle, Info, Lightbulb, Zap, Shield,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ, φRadius } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import {
  STEPS_CREATE,
  STEPS_JOIN,
  PRO_TIPS,
  SAFETY_TIPS,
  FAQ_DATA,
  EXAMPLE_CHALLENGES,
  KEY_CONCEPTS,
  CHECKLIST_ITEMS,
} from './arenaGuideData';

/* ═══════════════════════════════════════════════════════════
   Arena Guide — Migrated to Template System (§21.9)
   ─── Zero motion, pure CSS accordion, PageLayout + TabBar
   ═══════════════════════════════════════════════════════════ */

const TABS = ['Hướng dẫn', 'Mẹo hay', 'An toàn', 'FAQ'] as const;
type TabKey = (typeof TABS)[number];

export function ArenaGuidePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();

  const [tab, setTab] = useState<TabKey>('Hướng dẫn');
  const [guideMode, setGuideMode] = useState<'create' | 'join'>('create');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const [showAllTips, setShowAllTips] = useState(false);

  const steps = useMemo(
    () => (guideMode === 'create' ? STEPS_CREATE : STEPS_JOIN),
    [guideMode]
  );

  const visibleTips = useMemo(
    () => (showAllTips ? PRO_TIPS : PRO_TIPS.slice(0, 5)),
    [showAllTips]
  );

  const handleGuideModeChange = useCallback((mode: 'create' | 'join') => {
    setGuideMode(mode);
    hapticSelection();
  }, [hapticSelection]);

  const handleTipToggle = useCallback((index: number) => {
    setExpandedTip(prev => prev === index ? null : index);
    hapticSelection();
  }, [hapticSelection]);

  const handleFaqToggle = useCallback((index: number) => {
    setExpandedFaq(prev => prev === index ? null : index);
    hapticSelection();
  }, [hapticSelection]);

  return (
    <PageLayout>
      <Header title="Hướng dẫn Arena" subtitle="Hướng dẫn · Open Arena" back />

      {/* ─── TabBar — pure CSS, zero motion ─── */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} activeColor="#8B5CF6" />

      {/* ─── Content ─── */}
      <PageContent>

        {/* ═══ TAB 1: Hướng dẫn ═══ */}
        {tab === 'Hướng dẫn' && (
          <div className="flex flex-col gap-4">
            {/* Hero Banner */}
            <div
              className="relative overflow-hidden"
              style={{
                padding: 20,
                borderRadius: φRadius.lg,
                background: 'linear-gradient(135deg, #1a1040 0%, #0f1a3e 50%, #0a1628 100%)',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} color="#C4B5FD" />
                  <span style={{ color: '#C4B5FD', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Hướng dẫn nhanh
                  </span>
                </div>
                <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>
                  Tạo challenge đầu tiên trong 5 phút
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: φ.sm, lineHeight: 1.5 }}>
                  Chỉ 6 bước đơn giản — có gợi ý thông minh giúp bạn tạo challenge hấp dẫn
                </p>
              </div>
            </div>

            {/* Create / Join Toggle — segment variant */}
            <div className="flex rounded-xl p-1" style={{ background: c.surface2 }}>
              <button
                onClick={() => handleGuideModeChange('create')}
                className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5"
                style={{
                  background: guideMode === 'create' ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'transparent',
                  color: guideMode === 'create' ? '#fff' : c.text3,
                  fontWeight: 700, fontSize: 13, minHeight: 44,
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                <Sparkles size={13} /> Tạo Challenge
              </button>
              <button
                onClick={() => handleGuideModeChange('join')}
                className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5"
                style={{
                  background: guideMode === 'join' ? 'linear-gradient(135deg, #3B82F6, #1d4ed8)' : 'transparent',
                  color: guideMode === 'join' ? '#fff' : c.text3,
                  fontWeight: 700, fontSize: 13, minHeight: 44,
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                <Play size={13} /> Tham gia
              </button>
            </div>

            {/* Steps with timeline */}
            <div className="flex flex-col gap-0 relative">
              <div className="absolute left-[18px] top-6 bottom-6 w-0.5" style={{ background: c.divider }} />
              {steps.map(s => (
                <div key={`${guideMode}-${s.step}`} className="flex items-start gap-4 py-3 relative z-10">
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
                        style={{ background: s.color + '14', color: s.color, fontWeight: 700, fontSize: 9 }}
                      >
                        Bước {s.step}
                      </span>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{s.title}</span>
                    </div>
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6, marginBottom: 6 }}>{s.desc}</p>
                    {s.tip && (
                      <div
                        className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg"
                        style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}
                      >
                        <Lightbulb size={11} color="#8B5CF6" className="shrink-0 mt-0.5" />
                        <span style={{ color: '#8B5CF6', fontSize: 10, lineHeight: 1.5 }}>{s.tip}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Start CTA */}
            <TrCard className="p-4" accentBorder="rgba(139,92,246,0.2)">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(139,92,246,0.12)' }}>
                  <Zap size={18} color="#8B5CF6" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Sẵn sàng bắt đầu!</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    {guideMode === 'create' ? 'Tạo challenge đầu tiên của bạn' : 'Tham gia challenge ngay'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <CTAButton
                  onClick={() => navigate(guideMode === 'create' ? `${prefix}/arena/studio` : `${prefix}/arena`)}
                  bg="linear-gradient(135deg, #8B5CF6, #7C3AED)"
                  fullWidth
                >
                  {guideMode === 'create' ? 'Tạo challenge ngay' : 'Khám phá challenge'}
                </CTAButton>
              </div>
            </TrCard>

            {/* Example Comparison */}
            {guideMode === 'create' && (
              <div>
                <SectionHeader
                  title="So sánh challenge"
                  subtitle="Challenge tốt vs cần cải thiện"
                  accent
                  accentColor="#8B5CF6"
                />
                <div className="flex flex-col gap-3">
                  {EXAMPLE_CHALLENGES.map((ex, i) => (
                    <TrCard key={i} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{ex.title}</p>
                        <span
                          className="px-2 py-0.5 rounded-md shrink-0 ml-2"
                          style={{ background: ex.ratingColor + '14', color: ex.ratingColor, fontSize: 10, fontWeight: 700 }}
                        >
                          {ex.rating}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {[ex.template, ex.format, `${ex.entry} pts`, ex.resolution].map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md"
                            style={{ background: c.surface2, color: c.text3, fontSize: 10, fontWeight: 600 }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1">
                        {ex.reasons.map((r, ri) => (
                          <div key={ri} className="flex items-center gap-1.5">
                            {i === 0 ? (
                              <CheckCircle size={10} color="#10B981" className="shrink-0" />
                            ) : (
                              <AlertTriangle size={10} color="#F59E0B" className="shrink-0" />
                            )}
                            <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>{r}</span>
                          </div>
                        ))}
                      </div>
                    </TrCard>
                  ))}
                </div>
              </div>
            )}

            {/* Key Concepts */}
            <div>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>
                Thuật ngữ quan trọng
              </p>
              <div className="flex flex-col gap-2">
                {KEY_CONCEPTS.map(item => (
                  <div key={item.term} className="rounded-xl px-3 py-2.5" style={{ background: c.surface2 }}>
                    <span style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 700 }}>{item.term}: </span>
                    <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>{item.def}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 2: Mẹo hay ═══ */}
        {tab === 'Mẹo hay' && (
          <div className="flex flex-col gap-4">
            {/* Tips Header */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.06))',
                border: '1px solid rgba(139,92,246,0.15)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <Lightbulb size={16} color="#8B5CF6" />
                <span style={{ color: '#8B5CF6', fontSize: 14, fontWeight: 700 }}>
                  {PRO_TIPS.length} mẹo từ Top Creator
                </span>
              </div>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                Những bí quyết giúp challenge của bạn nổi bật, thu hút nhiều người chơi và giảm tranh chấp.
              </p>
            </div>

            {/* Impact Legend */}
            <div className="flex items-center gap-3">
              <span style={{ color: c.text3, fontSize: 10 }}>Mức ảnh hưởng:</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
                <span style={{ color: c.text2, fontSize: 10 }}>Cao</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                <span style={{ color: c.text2, fontSize: 10 }}>Trung bình</span>
              </div>
            </div>

            {/* Tips List — pure CSS accordion */}
            <div className="flex flex-col gap-2">
              {visibleTips.map((tip, i) => {
                const isExpanded = expandedTip === i;
                const impactColor = tip.impact === 'high' ? '#EF4444' : '#F59E0B';
                return (
                  <TrCard key={i} hover className="overflow-hidden">
                    <button
                      onClick={() => handleTipToggle(i)}
                      className="flex items-center gap-3 p-3.5 w-full text-left"
                      style={{ minHeight: 48 }}
                    >
                      <span style={{ fontSize: 20 }}>{tip.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate" style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                            {tip.title}
                          </p>
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: impactColor }} />
                        </div>
                      </div>
                      <div style={{
                        transition: 'transform 200ms ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}>
                        <ChevronDown size={14} color={c.text3} />
                      </div>
                    </button>
                    {/* CSS grid-template-rows accordion */}
                    <div style={{
                      display: 'grid',
                      gridTemplateRows: isExpanded ? '1fr' : '0fr',
                      opacity: isExpanded ? 1 : 0,
                      transition: 'grid-template-rows 250ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease',
                    }}>
                      <div style={{ overflow: 'hidden' }}>
                        <div className="px-3.5 pb-3.5 pt-0" style={{ borderTop: `1px solid ${c.divider}` }}>
                          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.7, paddingTop: 10 }}>
                            {tip.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>

            {/* Show More */}
            {!showAllTips && PRO_TIPS.length > 5 && (
              <button
                onClick={() => { setShowAllTips(true); hapticSelection(); }}
                className="flex items-center justify-center gap-1 py-2"
                style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 600, minHeight: 44 }}
              >
                Xem thêm {PRO_TIPS.length - 5} mẹo <ChevronDown size={14} />
              </button>
            )}

            {/* Checklist Card */}
            <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
              <div className="flex items-center gap-2.5 mb-3">
                <CheckCircle size={16} color="#10B981" />
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                  Checklist trước khi đăng
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div
                      className="w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center"
                      style={{ borderColor: c.border }}
                    >
                      <span style={{ color: c.text3, fontSize: 8 }}>{i + 1}</span>
                    </div>
                    <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* CTA */}
            <CTAButton
              onClick={() => navigate(`${prefix}/arena/studio`)}
              bg="linear-gradient(135deg, #8B5CF6, #7C3AED)"
              fullWidth
            >
              Áp dụng ngay — Tạo Challenge
            </CTAButton>
          </div>
        )}

        {/* ═══ TAB 3: An toàn ═══ */}
        {tab === 'An toàn' && (
          <div className="flex flex-col gap-4">
            {/* Safety Banner */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06))',
                border: '1px solid rgba(16,185,129,0.15)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <Shield size={16} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>An toàn trong Arena</span>
              </div>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                Open Arena sử dụng Arena Points (không phải tiền thật), hệ thống Trust Score, Fair Play và quy trình tranh chấp minh bạch để bảo vệ cộng đồng.
              </p>
            </div>

            {/* Points = Not Money Banner */}
            <TrCard className="p-3.5" accentBorder="rgba(59,130,246,0.2)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(59,130,246,0.12)' }}>
                  <Info size={18} color="#3B82F6" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                    Points only — Không có rủi ro tài chính
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    Arena Points không liên quan đến crypto hay fiat. Chơi thoải mái!
                  </p>
                </div>
              </div>
            </TrCard>

            {/* Safety Tips */}
            <div className="flex flex-col gap-2.5">
              {SAFETY_TIPS.map((s, i) => (
                <TrCard key={i} className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: s.color + '14' }}>
                      <s.icon size={16} color={s.color} />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                        {s.title}
                      </p>
                      <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>{s.desc}</p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>

            {/* Safety Center Link */}
            <TrCard hover className="p-4 w-full">
              <button onClick={() => navigate(`${prefix}/arena/safety`)} className="flex items-center gap-3 w-full text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)' }}>
                  <Shield size={18} color="#8B5CF6" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Safety Center</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Xem quy tắc cộng đồng đầy đủ</p>
                </div>
                <ChevronRight size={14} color={c.text3} />
              </button>
            </TrCard>
          </div>
        )}

        {/* ═══ TAB 4: FAQ — pure CSS accordion ═══ */}
        {tab === 'FAQ' && (
          <div className="flex flex-col gap-2">
            {/* FAQ Header */}
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle size={16} color="#8B5CF6" />
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                Câu hỏi thường gặp
              </span>
              <span
                className="px-1.5 py-0.5 rounded-md ml-1"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: 10, fontWeight: 700 }}
              >
                {FAQ_DATA.length}
              </span>
            </div>

            {FAQ_DATA.map((item, i) => {
              const isOpen = expandedFaq === i;
              return (
                <TrCard key={i} hover className="overflow-hidden">
                  <button
                    onClick={() => handleFaqToggle(i)}
                    className="flex items-center gap-3 p-3.5 w-full text-left"
                    style={{ minHeight: 48 }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isOpen ? 'rgba(139,92,246,0.12)' : c.surface2,
                        transition: 'background 150ms ease',
                      }}
                    >
                      <HelpCircle size={13} color={isOpen ? '#8B5CF6' : c.text3} />
                    </div>
                    <p className="flex-1 min-w-0" style={{ color: c.text1, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
                      {item.q}
                    </p>
                    <div style={{
                      transition: 'transform 200ms ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                      <ChevronDown size={14} color={isOpen ? '#8B5CF6' : c.text3} />
                    </div>
                  </button>
                  {/* CSS grid-template-rows accordion */}
                  <div style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    opacity: isOpen ? 1 : 0,
                    transition: 'grid-template-rows 250ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease',
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div className="px-3.5 pb-3.5" style={{ borderTop: `1px solid ${c.divider}` }}>
                        <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.7, paddingTop: 10 }}>
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </TrCard>
              );
            })}

            {/* Still need help */}
            <TrCard className="p-4 mt-2" accentBorder="rgba(139,92,246,0.15)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)' }}>
                  <HelpCircle size={18} color="#8B5CF6" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    Vẫn cần trợ giúp?
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    Liên hệ đội ngũ hỗ trợ 24/7
                  </p>
                </div>
                <button
                  onClick={() => navigate(`${prefix}/support`)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl active:opacity-70"
                  style={{
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    color: '#8B5CF6',
                    fontSize: 11,
                    fontWeight: 600,
                    minHeight: 44,
                  }}
                >
                  Hỗ trợ <ChevronRight size={12} />
                </button>
              </div>
            </TrCard>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}