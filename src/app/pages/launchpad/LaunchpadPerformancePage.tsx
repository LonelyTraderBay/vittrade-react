/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadPerformancePage — Historical Performance Dashboard
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  ROI chart, summary stats, past projects table
 *  §9.6 compliant: no hype, disclaimer on past performance
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtAmount } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, BarChart3, Award, Users,
  AlertCircle, ChevronRight, Rocket,
} from 'lucide-react';
import {
  HISTORICAL_PROJECTS, PERFORMANCE_CHART_DATA, PERFORMANCE_SUMMARY,
  type HistoricalProject,
} from './launchpadData';

/* ─── Local dark mode detection (MutationObserver) ─── */
function useIsDark(): boolean {
  const [isDark, setIsDark] = React.useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  React.useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

const PERF_TABS = ['Tổng quan', 'Dự án', 'ROI Chart'] as const;
type PerfTab = typeof PERF_TABS[number];

export function LaunchpadPerformancePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<PerfTab>('Tổng quan');

  return (
    <PageLayout>
      <Header title="Hiệu suất Launchpad" subtitle="Lịch sử · Thống kê" back />
      <TabBar tabs={PERF_TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Tổng quan' && <OverviewTab />}
        {tab === 'Dự án' && <ProjectsTab />}
        {tab === 'ROI Chart' && <ChartTab />}

        {/* Disclaimer — §9.6 no hype, §1.6 no dark patterns */}
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <AlertCircle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Hiệu suất quá khu không đảm bảo kết quả tương lai. Dữ liệu chỉ mang tính tham khảo.
            ROI được tính từ giá launch đến giá hiện tại hoặc ATH, chưa trừ phí và slippage.
            Nghiên cứu kỹ trước khi tham gia bất kỳ dự án nào.
          </p>
        </div>

        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab: Overview — summary stats
   ═══════════════════════════════════════════════════════════ */

function OverviewTab() {
  const c = useThemeColors();
  const s = PERFORMANCE_SUMMARY;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero stats */}
      <TrCard variant="hero" className="p-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 65%)' }} />

        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>ROI trung bình (ATH)</p>
        <p style={{ color: '#10B981', fontSize: 36, fontWeight: 800, fontFamily: 'monospace' }}>
          +{s.avgROI}%
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
          Trung vị: +{s.medianROI}% · Tỷ lệ dương: {s.positiveRate}%
        </p>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Tổng dự án', value: s.totalProjects.toString(), icon: Rocket, color: '#8B5CF6' },
            { label: 'Tổng huy động', value: s.totalRaised, icon: BarChart3, color: '#3B82F6' },
            { label: 'Người tham gia', value: s.totalParticipants, icon: Users, color: '#F59E0B' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <stat.icon size={16} color={stat.color} className="mx-auto mb-1.5" />
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{stat.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, marginTop: 2 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Best / Worst */}
      <div className="grid grid-cols-2 gap-3">
        <TrCard className="p-4 text-center">
          <TrendingUp size={20} color="#10B981" className="mx-auto mb-2" />
          <p style={{ color: c.text3, fontSize: 11 }}>Tốt nhất</p>
          <p style={{ color: '#10B981', fontSize: 20, fontWeight: 800, fontFamily: 'monospace' }}>
            +{s.bestProject.roi}%
          </p>
          <p style={{ color: c.text2, fontSize: 11 }}>{s.bestProject.name}</p>
        </TrCard>
        <TrCard className="p-4 text-center">
          <TrendingDown size={20} color="#EF4444" className="mx-auto mb-2" />
          <p style={{ color: c.text3, fontSize: 11 }}>Kém nhất</p>
          <p style={{ color: '#EF4444', fontSize: 20, fontWeight: 800, fontFamily: 'monospace' }}>
            {s.worstProject.roi}%
          </p>
          <p style={{ color: c.text2, fontSize: 11 }}>{s.worstProject.name}</p>
        </TrCard>
      </div>

      {/* ROI distribution */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Phân bổ ROI (ATH)</p>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={HISTORICAL_PROJECTS.sort((a, b) => b.roiATH - a.roiATH)}>
              <XAxis key="x-axis" dataKey="symbol" tick={{ fontSize: 10, fill: c.text3 }} axisLine={false} tickLine={false} />
              <YAxis key="y-axis" tick={{ fontSize: 10, fill: c.text3 }} axisLine={false} tickLine={false} width={40}
                tickFormatter={v => `${v}%`} />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  background: c.surface, border: `1px solid ${c.borderSolid}`,
                  borderRadius: 12, fontSize: 12,
                }}
                formatter={(value: number) => [`+${value}%`, 'ROI ATH']}
              />
              <Bar key="bar-roi" dataKey="roiATH" radius={[6, 6, 0, 0]}>
                {HISTORICAL_PROJECTS.sort((a, b) => b.roiATH - a.roiATH).map((p, i) => (
                  <Cell key={`overview-roi-bar-${i}`} fill={p.roiATH >= 0 ? '#10B981' : '#EF4444'} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab: Projects — past projects table
   ═══════════════════════════════════════════════════════════ */

function ProjectsTab() {
  const c = useThemeColors();
  const [sortBy, setSortBy] = useState<'roiATH' | 'roiCurrent' | 'launchDate'>('roiATH');

  const sorted = [...HISTORICAL_PROJECTS].sort((a, b) => {
    if (sortBy === 'roiATH') return b.roiATH - a.roiATH;
    if (sortBy === 'roiCurrent') return b.roiCurrent - a.roiCurrent;
    return 0; // keep original order for date
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Sort pills */}
      <div className="flex gap-2">
        {([
          { key: 'roiATH', label: 'ROI ATH' },
          { key: 'roiCurrent', label: 'ROI hiện tại' },
          { key: 'launchDate', label: 'Mới nhất' },
        ] as const).map(s => (
          <button key={s.key} onClick={() => setSortBy(s.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: sortBy === s.key ? c.chipActiveBg : c.chipBg,
              color: sortBy === s.key ? c.chipActiveText : c.chipText,
              border: `1px solid ${sortBy === s.key ? c.chipActiveBorder : c.chipBorder}`,
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Project cards */}
      {sorted.map(project => (
        <ProjectPerformanceCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectPerformanceCard({ project }: { project: HistoricalProject }) {
  const c = useThemeColors();
  const roiColor = project.roiCurrent >= 0 ? '#10B981' : '#EF4444';
  const athColor = project.roiATH >= 0 ? '#10B981' : '#EF4444';

  return (
    <TrCard hover className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: project.logoColor + '22',
            border: `1.5px solid ${project.logoColor}44`,
            color: project.logoColor,
          }}>
          {project.symbol.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{project.name}</span>
            <span className="px-1.5 py-0.5 rounded text-xs"
              style={{ background: `${project.logoColor}15`, color: project.logoColor, fontWeight: 600 }}>
              {project.type}
            </span>
          </div>
          <span style={{ color: c.text3, fontSize: 11 }}>${project.symbol} · {project.launchDate}</span>
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 9 }}>Giá launch</p>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>${project.launchPrice}</p>
        </div>
        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 9 }}>ATH</p>
          <p style={{ color: athColor, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>${project.athPrice}</p>
        </div>
        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 9 }}>Hiện tại</p>
          <p style={{ color: roiColor, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>${project.currentPrice}</p>
        </div>
      </div>

      {/* ROI bars */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl p-2" style={{ background: `${athColor}08`, border: `1px solid ${athColor}20` }}>
          <p style={{ color: c.text3, fontSize: 9 }}>ROI ATH</p>
          <p style={{ color: athColor, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
            {project.roiATH >= 0 ? '+' : ''}{project.roiATH}%
          </p>
        </div>
        <div className="flex-1 rounded-xl p-2" style={{ background: `${roiColor}08`, border: `1px solid ${roiColor}20` }}>
          <p style={{ color: c.text3, fontSize: 9 }}>ROI hiện tại</p>
          <p style={{ color: roiColor, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
            {project.roiCurrent >= 0 ? '+' : ''}{project.roiCurrent}%
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
        <span style={{ color: c.text3, fontSize: 10 }}>
          {project.participants.toLocaleString()} người · {project.totalRaised}
        </span>
        <span className="px-2 py-0.5 rounded text-xs"
          style={{
            background: project.status === 'trading' ? 'rgba(16,185,129,0.1)' : 'rgba(139,148,179,0.1)',
            color: project.status === 'trading' ? '#10B981' : '#8B95B3',
            fontWeight: 600,
          }}>
          {project.status === 'trading' ? 'Đang giao dịch' : 'Đã hủy niêm yết'}
        </span>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab: ROI Chart — area chart over time
   ═══════════════════════════════════════════════════════════ */

function ChartTab() {
  const c = useThemeColors();
  const isDark = useIsDark();

  return (
    <div className="flex flex-col gap-4">
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          ROI trung bình theo tháng (ATH)
        </p>
        <p style={{ color: c.text3, fontSize: 11, marginBottom: 16 }}>
          Chỉ tính các tháng có dự án launch. Tháng không có dự án hiện 0%.
        </p>

        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PERFORMANCE_CHART_DATA}>
              <defs key="gradient-defs">
                <linearGradient id="chart-tab-perf-roi-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis key="x-axis" dataKey="month" tick={{ fontSize: 10, fill: c.text3 }}
                axisLine={false} tickLine={false} />
              <YAxis key="y-axis" tick={{ fontSize: 10, fill: c.text3 }} axisLine={false} tickLine={false}
                width={40} tickFormatter={v => `${v}%`} />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  background: c.surface, border: `1px solid ${c.borderSolid}`,
                  borderRadius: 12, fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'avgROI') return [`+${value}%`, 'Avg ROI (ATH)'];
                  return [value, name];
                }}
              />
              <Area key="area-roi" type="monotone" dataKey="avgROI" stroke="#10B981" strokeWidth={2.5}
                fill="url(#chart-tab-perf-roi-gradient)" dot={{ r: 3, fill: '#10B981', stroke: isDark ? '#1a1a2e' : '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </TrCard>

      {/* Volume chart */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          Khối lượng huy động theo tháng
        </p>
        <p style={{ color: c.text3, fontSize: 11, marginBottom: 16 }}>
          Tổng số USDT huy động qua tất cả dự án trong tháng ($K)
        </p>

        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PERFORMANCE_CHART_DATA}>
              <XAxis key="x-axis" dataKey="month" tick={{ fontSize: 10, fill: c.text3 }}
                axisLine={false} tickLine={false} />
              <YAxis key="y-axis" tick={{ fontSize: 10, fill: c.text3 }} axisLine={false} tickLine={false}
                width={40} tickFormatter={v => `${v / 1000}K`} />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  background: c.surface, border: `1px solid ${c.borderSolid}`,
                  borderRadius: 12, fontSize: 12,
                }}
                formatter={(value: number) => [`$${fmtAmount(value, 0)}`, 'Volume']}
              />
              <Bar key="bar-volume" dataKey="volume" radius={[6, 6, 0, 0]} fill="#3B82F6" opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </TrCard>

      {/* Projects per month */}
      <TrCard variant="inner" className="p-3">
        <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
          Số liệu chỉ mang tính tham khảo. ROI ATH là mức cao nhất đạt được — không phải tất cả người dùng đều bán được ở giá ATH.
          Giá hiện tại có thể thay đổi bất kỳ lúc nào.
        </p>
      </TrCard>
    </div>
  );
}