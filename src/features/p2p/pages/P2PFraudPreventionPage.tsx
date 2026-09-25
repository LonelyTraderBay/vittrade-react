import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Phone,
  Flag,
  AlertOctagon,
  Info,
  BookOpen,
  CircleAlert,
  ShieldCheck,
} from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { φ, φSpace } from '@/shared/lib/golden';
import { TrCard } from '@/shared/ui/TrCard';
import { toast } from 'sonner';
import {
  CATEGORY_LABELS,
  DEFAULT_CHECKLIST,
  SCAM_PATTERNS,
  SEVERITY_CONFIG,
  type ChecklistItem,
} from '@/features/p2p/model/p2p-fraud-prevention-content';

/* ═══════════════════════════════════════════════════════════
   P2P Fraud Prevention Center — Enterprise Safety Education
   TIER 5.2 — Scam patterns, prevention, self-assessment
   ═══════════════════════════════════════════════════════════ */

export function P2PFraudPreventionPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();

  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [activeChecklistTab, setActiveChecklistTab] = useState<ChecklistItem['category']>('before');

  const checkedCount = checklist.filter((i) => i.checked).length;
  const totalCount = checklist.length;
  const safetyScore = Math.round((checkedCount / totalCount) * 100);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
    hapticSelection();
  };

  const togglePattern = (id: string) => {
    setExpandedPattern((prev) => (prev === id ? null : id));
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
              <ShieldCheck
                size={20}
                color={safetyScore >= 80 ? '#10B981' : safetyScore >= 50 ? '#F59E0B' : '#EF4444'}
              />
              <span style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>
                Chỉ số an toàn
              </span>
            </div>
            <span
              style={{
                color: safetyScore >= 80 ? '#10B981' : safetyScore >= 50 ? '#F59E0B' : '#EF4444',
                fontSize: 28,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {safetyScore}%
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: c.surface2 }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${safetyScore}%`,
                background:
                  safetyScore >= 80 ? '#10B981' : safetyScore >= 50 ? '#F59E0B' : '#EF4444',
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
            {SCAM_PATTERNS.map((pattern) => {
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
                        <span
                          style={{
                            color: c.text1,
                            fontSize: φ.body,
                            fontWeight: 700,
                            lineHeight: 1.5,
                          }}
                        >
                          {pattern.title}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            background: `${sevCfg.color}12`,
                            color: sevCfg.color,
                            fontSize: 9,
                            fontWeight: 700,
                          }}
                        >
                          {sevCfg.label}
                        </span>
                      </div>
                      <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>
                        {pattern.description}
                      </p>
                    </div>
                    <ChevronDown
                      size={16}
                      color={c.text3}
                      className="shrink-0 mt-1 transition-transform"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4" style={{ borderTop: `1px solid ${c.divider}` }}>
                      {/* How it works */}
                      <div className="pt-4 mb-4">
                        <p
                          style={{
                            color: c.text2,
                            fontSize: 11,
                            fontWeight: 700,
                            marginBottom: 8,
                            letterSpacing: 0.3,
                          }}
                        >
                          CÁCH THỨC HOẠT ĐỘNG
                        </p>
                        <div className="flex flex-col gap-2">
                          {pattern.howItWorks.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                style={{
                                  background: c.surface2,
                                  color: c.text3,
                                  fontSize: 10,
                                  fontWeight: 700,
                                }}
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
                        <p
                          style={{
                            color: '#EF4444',
                            fontSize: 11,
                            fontWeight: 700,
                            marginBottom: 8,
                            letterSpacing: 0.3,
                          }}
                        >
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
                        <p
                          style={{
                            color: '#10B981',
                            fontSize: 11,
                            fontWeight: 700,
                            marginBottom: 8,
                            letterSpacing: 0.3,
                          }}
                        >
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
            {(['before', 'during', 'after'] as const).map((cat) => {
              const isActive = activeChecklistTab === cat;
              const catItems = checklist.filter((i) => i.category === cat);
              const catChecked = catItems.filter((i) => i.checked).length;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveChecklistTab(cat);
                    hapticSelection();
                  }}
                  className="flex-1 py-2 rounded-lg text-center"
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : c.text2,
                    background: isActive ? '#3B82F6' : c.surface2,
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                  <span
                    style={{
                      display: 'block',
                      fontSize: 9,
                      marginTop: 2,
                      color: isActive ? 'rgba(255,255,255,0.7)' : c.text3,
                    }}
                  >
                    {catChecked}/{catItems.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Items */}
          <div className="flex flex-col">
            {checklist
              .filter((i) => i.category === activeChecklistTab)
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
                      <p
                        style={{
                          color: item.checked ? '#10B981' : c.text1,
                          fontSize: φ.sm,
                          fontWeight: 600,
                          lineHeight: 1.5,
                          textDecoration: item.checked ? 'line-through' : 'none',
                        }}
                      >
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
              onClick={() => {
                hapticSelection();
                navigate(`${prefix}/p2p/insurance-fund`);
              }}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <Shield size={16} color="#EF4444" />
                <span
                  style={{ color: '#DC2626', fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}
                >
                  Gửi yêu cầu bồi thường bảo hiểm
                </span>
              </div>
              <ChevronRight size={16} color="#EF4444" />
            </button>

            <button
              onClick={() => {
                hapticSelection();
                navigate(`${prefix}/support`);
              }}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <Phone size={16} color="#F59E0B" />
                <span
                  style={{ color: '#D97706', fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}
                >
                  Liên hệ hỗ trợ khẩn cấp
                </span>
              </div>
              <ChevronRight size={16} color="#F59E0B" />
            </button>

            <button
              onClick={() => {
                hapticSelection();
                toast.info('Đang mở form report');
              }}
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
            Thông tin phòng chống gian lận mang tính chất giáo dục. Nếu bạn đã bị lừa đảo, hãy gửi
            claim bảo hiểm trong vòng 7 ngày và liên hệ hỗ trợ ngay.
          </p>
        </div>

        <div style={{ height: 8 }} />
      </div>
    </PageLayout>
  );
}
