/**
 * ══════════════════════════════════════════════════════════════════
 *  TOKEN UNLOCKS PAGE — P3 Vesting Schedule & Unlock Tracker
 * ══════════════════════════════════════════════════════════════════
 *  Upcoming unlocks timeline, impact analysis, vesting schedule
 *  visualization, supply dilution warnings. Route: /markets/unlocks
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar, AlertTriangle, Clock, ArrowDownRight,
  Lock, Unlock, TrendingDown, ChevronDown,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtCompact, fmtPct, fmtPrice, fmtNum } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import {
  TOKEN_UNLOCKS, VESTING_CATEGORY_CONFIG, IMPACT_CONFIG,
  type TokenUnlock,
} from '../../data/marketP3Data';

const TABS = ['Sắp mở khóa', 'Phân tích', 'Lịch trình'];
const SORT_OPTIONS = ['Gần nhất', 'Giá trị cao', 'Tác động lớn'];
const IMPACT_FILTERS = ['all', 'high', 'medium', 'low'] as const;

export function TokenUnlocksPage() {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  const [tab, setTab] = useState('Sắp mở khóa');
  const [sortBy, setSortBy] = useState('Gần nhất');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...TOKEN_UNLOCKS];
    if (impactFilter !== 'all') {
      items = items.filter(u => u.impactLevel === impactFilter);
    }
    switch (sortBy) {
      case 'Gần nhất': return items.sort((a, b) => a.daysUntil - b.daysUntil);
      case 'Giá trị cao': return items.sort((a, b) => b.unlockValueUsd - a.unlockValueUsd);
      case 'Tác động lớn': return items.sort((a, b) => b.unlockPctCirculating - a.unlockPctCirculating);
      default: return items;
    }
  }, [sortBy, impactFilter]);

  // Summary stats
  const totalValueNext30d = TOKEN_UNLOCKS.reduce((s, u) => s + u.unlockValueUsd, 0);
  const highImpactCount = TOKEN_UNLOCKS.filter(u => u.impactLevel === 'high').length;
  const avgDilution = TOKEN_UNLOCKS.reduce((s, u) => s + u.unlockPctCirculating, 0) / TOKEN_UNLOCKS.length;

  return (
    <PageLayout>
      <Header title="Token Unlock" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* ═══ Upcoming tab ═══ */}
        {tab === 'Sắp mở khóa' && (
          <>
            {/* Summary banner */}
            <TrCard variant="hero" className="p-4">
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, marginBottom: 4 }}>
                Tổng giá trị mở khóa sắp tới
              </p>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold }}>
                {fmtCompact(totalValueNext30d, { prefix: '$' })}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span style={{ color: '#EF4444', fontSize: FONT_SCALE.micro }}>
                  {highImpactCount} tác động cao
                </span>
                <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                  TB dilution: {avgDilution.toFixed(1)}%
                </span>
              </div>
            </TrCard>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-none">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setSortBy(opt); hapticSelection(); }}
                    className="shrink-0 px-2.5 py-1 rounded-lg"
                    style={{
                      background: sortBy === opt ? c.chipActiveBg : c.surface2,
                      color: sortBy === opt ? c.chipActiveText : c.text3,
                      fontSize: FONT_SCALE.micro,
                      fontWeight: FONT_WEIGHT.medium,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {IMPACT_FILTERS.map(f => {
                  const cfg = f === 'all' ? { label: 'Tất cả', color: '#6B7280' } : IMPACT_CONFIG[f as TokenUnlock['impactLevel']];
                  return (
                    <button
                      key={f}
                      onClick={() => { setImpactFilter(f); hapticSelection(); }}
                      className="px-2 py-1 rounded-lg"
                      style={{
                        background: impactFilter === f ? `${cfg.color}12` : 'transparent',
                        color: impactFilter === f ? cfg.color : c.text3,
                        border: `1px solid ${impactFilter === f ? `${cfg.color}30` : 'transparent'}`,
                        fontSize: 9,
                        fontWeight: FONT_WEIGHT.medium,
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unlock cards */}
            <div className="flex flex-col" style={{ gap: 4 }}>
              {filtered.map(unlock => (
                <UnlockCard
                  key={unlock.id}
                  unlock={unlock}
                  expanded={expandedId === unlock.id}
                  onToggle={() => { setExpandedId(expandedId === unlock.id ? null : unlock.id); hapticSelection(); }}
                  c={c}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Lock size={32} color={c.text3} style={{ opacity: 0.3 }} />
                <p style={{ color: c.text3, fontSize: FONT_SCALE.sm, marginTop: 12 }}>
                  Không có unlock phù hợp
                </p>
              </div>
            )}
          </>
        )}

        {/* ═══ Analysis tab ═══ */}
        {tab === 'Phân tích' && (
          <>
            {/* Impact overview */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 12 }}>
                Phân bổ theo tác động
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as const).map(level => {
                  const cfg = IMPACT_CONFIG[level];
                  const count = TOKEN_UNLOCKS.filter(u => u.impactLevel === level).length;
                  const totalValue = TOKEN_UNLOCKS
                    .filter(u => u.impactLevel === level)
                    .reduce((s, u) => s + u.unlockValueUsd, 0);
                  return (
                    <div key={level} className="text-center py-3 rounded-xl" style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}15` }}>
                      <p style={{ color: cfg.color, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>{count}</p>
                      <p style={{ color: cfg.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>{cfg.label}</p>
                      <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                        {fmtCompact(totalValue, { prefix: '$' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </TrCard>

            {/* Category breakdown */}
            <PageSection label="Theo loại" accentColor="#8B5CF6">
              <TrCard className="p-4">
                <div className="flex flex-col gap-3">
                  {Object.entries(VESTING_CATEGORY_CONFIG).map(([key, cfg]) => {
                    const items = TOKEN_UNLOCKS.filter(u => u.category === key);
                    const totalValue = items.reduce((s, u) => s + u.unlockValueUsd, 0);
                    const maxTotal = Math.max(
                      ...Object.keys(VESTING_CATEGORY_CONFIG).map(k =>
                        TOKEN_UNLOCKS.filter(u => u.category === k).reduce((s, u) => s + u.unlockValueUsd, 0)
                      )
                    );
                    const barWidth = totalValue > 0 ? (totalValue / maxTotal) * 100 : 0;

                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.color }} />
                            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>{cfg.label}</span>
                          </div>
                          <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                            {fmtCompact(totalValue, { prefix: '$' })}
                          </span>
                        </div>
                        <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: c.surface2 }}>
                          <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: cfg.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TrCard>
            </PageSection>

            {/* Dilution rankings */}
            <PageSection label="Rủi ro pha loãng cao nhất" accentColor="#EF4444">
              <div className="flex flex-col" style={{ gap: 2 }}>
                {[...TOKEN_UNLOCKS]
                  .sort((a, b) => b.unlockPctCirculating - a.unlockPctCirculating)
                  .map((unlock, idx) => (
                    <div key={unlock.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: c.surface }}>
                      <span style={{ color: c.text3, fontSize: 10, width: 12 }}>{idx + 1}</span>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${unlock.color}18` }}
                      >
                        <span style={{ color: unlock.color, fontSize: 10, fontWeight: FONT_WEIGHT.bold }}>
                          {unlock.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                          {unlock.symbol}
                        </span>
                        <p style={{ color: c.text3, fontSize: 10 }}>{unlock.daysUntil} ngày nữa</p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                          {unlock.unlockPctCirculating.toFixed(1)}%
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>lưu thông</p>
                      </div>
                    </div>
                  ))}
              </div>
            </PageSection>

            {/* Warning */}
            <TrCard className="p-4" accentBorder="rgba(245,158,11,0.15)">
              <div className="flex gap-3">
                <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 2 }}>
                    Lưu ý quan trọng
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
                    Token unlock không đồng nghĩa token sẽ bị bán. Tuy nhiên, unlock lớn thường tạo áp lực bán tiềm ẩn. 
                    Dữ liệu chỉ mang tính tham khảo. Hãy kết hợp với các yếu tố khác khi ra quyết định.
                  </p>
                </div>
              </div>
            </TrCard>
          </>
        )}

        {/* ═══ Schedule tab ═══ */}
        {tab === 'Lịch trình' && (
          <>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {TOKEN_UNLOCKS.sort((a, b) => a.daysUntil - b.daysUntil).map(unlock => (
                <TrCard key={unlock.id} className="p-4">
                  {/* Token header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${unlock.color}18` }}
                    >
                      <span style={{ color: unlock.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                        {unlock.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                          {unlock.symbol}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            background: VESTING_CATEGORY_CONFIG[unlock.category].color + '12',
                            color: VESTING_CATEGORY_CONFIG[unlock.category].color,
                            fontSize: 8,
                          }}
                        >
                          {unlock.vestingType === 'cliff' ? 'Cliff' : unlock.vestingType === 'linear' ? 'Linear' : 'Milestone'}
                        </span>
                      </div>
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{unlock.name}</span>
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                        ${fmtPrice(unlock.currentPrice)}
                      </p>
                      <span style={{
                        color: unlock.priceChange7d >= 0 ? '#10B981' : '#EF4444',
                        fontSize: FONT_SCALE.micro,
                      }}>
                        {fmtPct(unlock.priceChange7d)} 7d
                      </span>
                    </div>
                  </div>

                  {/* Supply bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Lưu thông / Tổng cung</span>
                      <span style={{ color: c.text1, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>
                        {((unlock.circulatingSupply / unlock.totalSupply) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: c.surface2 }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(unlock.circulatingSupply / unlock.totalSupply) * 100}%`,
                          background: unlock.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Vesting timeline */}
                  <div>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8 }}>
                      Lịch mở khóa
                    </p>
                    <div className="flex flex-col relative">
                      {/* Vertical line */}
                      <div
                        className="absolute left-[11px] top-2 bottom-2"
                        style={{ width: 2, background: `${unlock.color}20` }}
                      />
                      {unlock.vestingSchedule.map((event, idx) => (
                        <div key={idx} className="flex items-start gap-3 pb-3 relative">
                          {/* Dot */}
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 relative z-10"
                            style={{
                              background: idx === 0 ? unlock.color : `${unlock.color}20`,
                              border: idx === 0 ? 'none' : `2px solid ${unlock.color}40`,
                            }}
                          >
                            {idx === 0
                              ? <Unlock size={12} color="#fff" />
                              : <Lock size={8} color={unlock.color} />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                                {event.date}
                              </span>
                              <span style={{
                                color: event.pct > 5 ? '#EF4444' : event.pct > 2 ? '#F59E0B' : '#10B981',
                                fontSize: FONT_SCALE.xs,
                                fontWeight: FONT_WEIGHT.bold,
                              }}>
                                {event.pct.toFixed(1)}%
                              </span>
                            </div>
                            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{event.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ─── Sub-components ─── */

function UnlockCard({ unlock, expanded, onToggle, c }: {
  unlock: TokenUnlock;
  expanded: boolean;
  onToggle: () => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  const impactCfg = IMPACT_CONFIG[unlock.impactLevel];
  const catCfg = VESTING_CATEGORY_CONFIG[unlock.category];

  return (
    <TrCard className="overflow-hidden" accentBorder={unlock.impactLevel === 'high' ? 'rgba(239,68,68,0.12)' : undefined}>
      <button onClick={onToggle} className="w-full text-left px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Token icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${unlock.color}18` }}
          >
            <span style={{ color: unlock.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
              {unlock.symbol.slice(0, 2)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Tags */}
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                {unlock.symbol}
              </span>
              <span
                className="px-1.5 py-0.5 rounded"
                style={{ background: `${impactCfg.color}10`, color: impactCfg.color, fontSize: 8, fontWeight: FONT_WEIGHT.semibold }}
              >
                {impactCfg.label}
              </span>
              <span
                className="px-1.5 py-0.5 rounded"
                style={{ background: `${catCfg.color}10`, color: catCfg.color, fontSize: 8 }}
              >
                {catCfg.label}
              </span>
            </div>
            {/* Date + countdown */}
            <div className="flex items-center gap-2">
              <Clock size={12} color={c.text3} />
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                {unlock.unlockDateLabel}
              </span>
              <span style={{
                color: unlock.daysUntil <= 3 ? '#EF4444' : unlock.daysUntil <= 7 ? '#F59E0B' : c.text2,
                fontSize: FONT_SCALE.micro,
                fontWeight: FONT_WEIGHT.semibold,
              }}>
                ({unlock.daysUntil === 0 ? 'Hôm nay' : `${unlock.daysUntil} ngày`})
              </span>
            </div>
          </div>

          {/* Value */}
          <div className="text-right shrink-0">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {fmtCompact(unlock.unlockValueUsd, { prefix: '$' })}
            </p>
            <span style={{ color: '#EF4444', fontSize: FONT_SCALE.micro }}>
              {unlock.unlockPctCirculating.toFixed(1)}% supply
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-3 pt-1" style={{ borderTop: `1px solid ${c.borderSolid}` }}>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Số token mở khóa</p>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                {fmtCompact(unlock.unlockAmount)} {unlock.symbol}
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Giá hiện tại</p>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                ${fmtPrice(unlock.currentPrice)}
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tổng đang khóa</p>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                {fmtCompact(unlock.totalLockedValueUsd, { prefix: '$' })}
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Loại vesting</p>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                {unlock.vestingType === 'cliff' ? 'Cliff (gộp)' : unlock.vestingType === 'linear' ? 'Linear (dần)' : 'Milestone'}
              </p>
            </div>
          </div>

          {/* Price change warning */}
          {unlock.priceChange7d < -3 && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)' }}>
              <TrendingDown size={12} color="#EF4444" />
              <span style={{ color: '#EF4444', fontSize: FONT_SCALE.micro }}>
                Giá giảm {fmtPct(unlock.priceChange7d)} trong 7 ngày — có thể liên quan đến unlock sắp tới
              </span>
            </div>
          )}
        </div>
      )}
    </TrCard>
  );
}