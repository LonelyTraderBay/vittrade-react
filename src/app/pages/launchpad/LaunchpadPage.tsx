/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadPage — Enterprise Index Page (Phase 1 Refactor)
 * ══════════════════════════════════════════════════════════════
 *  Pattern E — Module Index
 *  Compliance: PageLayout + PageContent + TabBar + CTAButton
 *  Enterprise states: skeleton, empty, error
 */

import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { fmtAmount } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import {
  Rocket, Clock, Users, ChevronRight, CheckCircle,
  Star, Zap, AlertCircle, X, TrendingUp, Award,
  Briefcase, Search, BarChart3, SlidersHorizontal, Coins,
  Bell, ScrollText, GitCompare, BookOpen,
  Webhook, Fuel, PieChart, Lock,
  ArrowLeftRight, Clock4, DollarSign, Shield,
} from 'lucide-react';
import {
  PROJECTS, TYPE_LABELS, STATUS_LABELS, MOCK_USER,
  type LaunchProject,
  type FilterCriteria, DEFAULT_FILTER, applyFilters,
} from './launchpadData';
import {
  SubscribeSheet, SkeletonCard, EmptyState, ErrorState, CountdownTimer,
  KYCGateSheet, AdvancedFilterSheet,
} from './LaunchpadComponents';
import type { Subscription } from './launchpadData';

const TABS = ['Tất cả', 'Đang mở', 'Sắp tới', 'Đã kết thúc'] as const;
type TabType = typeof TABS[number];

const TAB_TO_STATUS: Record<TabType, string | null> = {
  'Tất cả': null,
  'Đang mở': 'active',
  'Sắp tới': 'upcoming',
  'Đã kết thúc': 'ended',
};

export function LaunchpadPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<TabType>('Tất cả');
  const [selectedProject, setSelectedProject] = useState<LaunchProject | null>(null);
  const [kycGateProject, setKycGateProject] = useState<LaunchProject | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successProject, setSuccessProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterCriteria>(DEFAULT_FILTER);

  // Simulate loading
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const statusFilter = TAB_TO_STATUS[tab];
  const tabFiltered = statusFilter
    ? PROJECTS.filter(p => p.status === statusFilter)
    : PROJECTS;
  const filtered = applyFilters(tabFiltered, filter);
  const activeCount = PROJECTS.filter(p => p.status === 'active').length;
  const hasActiveFilters = filter.types.length > 0 || filter.statuses.length > 0 || filter.chains.length > 0
    || filter.hasWhitelist !== null || filter.auditPassed !== null || filter.sortBy !== 'newest' || filter.searchQuery.trim() !== '';

  const handleSubscribeSuccess = (sub: Omit<Subscription, 'id'>) => {
    setSuccessProject(sub.projectName);
    setShowSuccess(true);
    setSelectedProject(null);
    // Navigate to receipt after brief delay
    setTimeout(() => {
      setShowSuccess(false);
      navigate(`${prefix}/launchpad/receipt/new`, {
        state: { subscription: { ...sub, id: `sub_${Date.now()}` } },
      });
    }, 1500);
  };

  return (
    <PageLayout>
      {/* Subscribe sheet */}
      {selectedProject && (
        <SubscribeSheet
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onSuccess={handleSubscribeSuccess}
        />
      )}

      {/* KYC gate sheet */}
      {kycGateProject && (
        <KYCGateSheet
          project={kycGateProject}
          userKycLevel={MOCK_USER.kycLevel}
          onClose={() => setKycGateProject(null)}
        />
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: c.surface, border: '1px solid #10B981',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: 440, margin: '0 auto',
          }}>
          <CheckCircle size={20} color="#10B981" />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Đăng ký thành công!</p>
            <p style={{ color: c.text2, fontSize: 12 }}>Bạn đã tham gia {successProject}</p>
          </div>
          <button onClick={() => setShowSuccess(false)}><X size={16} color={c.text3} /></button>
        </div>
      )}

      {/* Advanced filter sheet */}
      {showFilter && (
        <AdvancedFilterSheet
          filter={filter}
          onApply={setFilter}
          onClose={() => setShowFilter(false)}
        />
      )}

      <Header
        title="Launchpad"
        subtitle="Dự án mới · Token Launch"
        back
        right={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowFilter(true)}
              className="flex items-center justify-center hover-ghost relative"
              style={{ width: 36, height: 36, borderRadius: 10, background: c.searchBg, border: `1px solid ${c.border}` }}
              aria-label="Bộ lọc">
              <SlidersHorizontal size={18} color={c.text1} strokeWidth={1.8} />
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: '#3B82F6', border: `2px solid ${c.surface}` }} />
              )}
            </button>
            <button
              onClick={() => navigate(`${prefix}/launchpad/performance`)}
              className="flex items-center justify-center hover-ghost"
              style={{ width: 36, height: 36, borderRadius: 10, background: c.searchBg, border: `1px solid ${c.border}` }}
              aria-label="Hiệu suất">
              <BarChart3 size={18} color={c.text1} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => navigate(`${prefix}/launchpad/portfolio`)}
              className="flex items-center justify-center hover-ghost"
              style={{ width: 36, height: 36, borderRadius: 10, background: c.searchBg, border: `1px solid ${c.border}` }}
              aria-label="Portfolio">
              <Briefcase size={18} color={c.text1} strokeWidth={1.8} />
            </button>
          </div>
        }
      />

      <PageContent gap="default">
        {/* Hero stats */}
        <div className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: c.portfolioBg,
            border: `1px solid ${c.portfolioBorder}`,
            boxShadow: c.portfolioShadow,
          }}>
          <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 65%)' }} />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)' }} />

          <div className="flex items-center gap-4 mb-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.2) 100%)',
                border: '1px solid rgba(139,92,246,0.3)',
              }}>
              <Rocket size={26} color="#A78BFA" />
            </div>
            <div>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>VitLaunch</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Ra mắt token an toàn & uy tín</p>
            </div>
          </div>

          <div className="flex gap-3 relative z-10">
            {[
              { icon: Rocket, label: 'Dự án', value: '47' },
              { icon: Users, label: 'Người tham gia', value: '280K+' },
              { icon: TrendingUp, label: 'Đang hoạt động', value: `${activeCount}` },
            ].map(s => (
              <div key={s.label} className="flex-1 rounded-2xl p-3 text-center"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                }}>
                <s.icon size={16} color="#A78BFA" className="mx-auto mb-1.5" />
                <p style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer — no hype per §9.6, §1.6 */}
          <p style={{
            color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 12,
            textAlign: 'center', lineHeight: 1.4,
          }}>
            Hiệu suất quá khứ không đảm bảo kết quả tương lai. Nghiên cứu kỹ trước khi tham gia.
          </p>
        </div>

        {/* Tab filter */}
        <TabBar
          variant="pill"
          tabs={TABS}
          active={tab}
          onChange={setTab}
        />

        {/* Active filter indicator */}
        {hasActiveFilters && !loading && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal size={12} color="#3B82F6" />
              <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                Bộ lọc đang bật · {filtered.length} dự án
              </span>
            </div>
            <button onClick={() => setFilter(DEFAULT_FILTER)}
              className="px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>
              Xóa lọc
            </button>
          </div>
        )}

        {/* Content states */}
        {loading ? (
          <div className="flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => { setError(false); setLoading(true); setTimeout(() => setLoading(false), 800); }} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={40} color={c.text3} />}
            title="Không có dự án nào"
            description={hasActiveFilters ? 'Không có dự án phù hợp với bộ lọc hiện tại.' : `Hiện không có dự án nào ${tab !== 'Tất cả' ? 'trong mục này' : ''}. Quay lại sau nhé!`}
            action={hasActiveFilters
              ? { label: 'Xóa bộ lọc', onClick: () => setFilter(DEFAULT_FILTER) }
              : tab !== 'Tất cả' ? { label: 'Xem tất cả', onClick: () => setTab('Tất cả') } : undefined}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onSubscribe={() => {
                  const needsKyc = project.kyc && MOCK_USER.kycLevel < project.kycLevel;
                  if (needsKyc) setKycGateProject(project);
                  else setSelectedProject(project);
                }}
                onDetail={() => navigate(`${prefix}/launchpad/${project.id}`)}
              />
            ))}
          </div>
        )}

        {/* Phase 4: Launchpool Staking entry */}
        <button onClick={() => navigate(`${prefix}/launchpad/staking`)}
          className="w-full rounded-2xl p-4 flex items-center gap-4 hover:opacity-90 transition-opacity active:scale-[0.98]"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.15)' }}>
            <Coins size={22} color="#10B981" />
          </div>
          <div className="flex-1 text-left">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Launchpool Staking</p>
            <p style={{ color: c.text3, fontSize: 12 }}>Stake token để nhận phần thưởng dự án mới</p>
          </div>
          <ChevronRight size={18} color={c.text3} />
        </button>

        {/* Phase 4.9: Tools grid */}
        <PageSection label="Công cụ nâng cao" accentColor="#6366F1">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Bell, label: 'Âm thanh thông báo', desc: 'Cài đặt âm thanh & rung', color: '#8B5CF6', route: `${prefix}/launchpad/notif-sound` },
              { icon: ScrollText, label: 'Event Log', desc: 'Xuất log giao dịch', color: '#3B82F6', route: `${prefix}/launchpad/event-log` },
              { icon: GitCompare, label: 'ABI Diff', desc: 'So sánh proxy upgrade', color: '#F59E0B', route: `${prefix}/launchpad/abi-diff/default` },
              { icon: BookOpen, label: 'Sổ địa chỉ', desc: 'Quản lý ví đa mạng', color: '#10B981', route: `${prefix}/launchpad/address-book` },
              { icon: Webhook, label: 'Webhooks', desc: 'Đăng ký event contract', color: '#EC4899', route: `${prefix}/launchpad/webhooks` },
              { icon: Fuel, label: 'Gas Tracker', desc: 'Theo dõi gas đa mạng', color: '#F97316', route: `${prefix}/launchpad/gas-tracker` },
              { icon: PieChart, label: 'Rebalance', desc: 'Cân bằng portfolio', color: '#06B6D4', route: `${prefix}/launchpad/rebalance` },
              { icon: Lock, label: 'Multi-sig', desc: 'Giao dịch nhiều chữ ký', color: '#8B5CF6', route: `${prefix}/launchpad/multisig` },
            ].map(tool => (
              <button key={tool.label}
                onClick={() => navigate(tool.route)}
                className="rounded-2xl p-3.5 flex flex-col gap-2 text-left hover:opacity-90 transition-opacity active:scale-[0.98]"
                style={{ background: tool.color + '08', border: `1px solid ${tool.color}18` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: tool.color + '15' }}>
                  <tool.icon size={18} color={tool.color} />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{tool.label}</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </PageSection>

        {/* Phase 4.11: Trading & Risk Tools */}
        <PageSection label="Trading & Risk Management" accentColor="#3B82F6">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: ArrowLeftRight, label: 'Swap Aggregator', desc: 'So sánh giá DEX', color: '#3B82F6', route: `${prefix}/launchpad/swap-aggregator` },
              { icon: Clock4, label: 'Limit Orders', desc: 'Lệnh tự động', color: '#10B981', route: `${prefix}/launchpad/limit-orders` },
              { icon: DollarSign, label: 'DCA Builder', desc: 'Chiến lược DCA', color: '#F59E0B', route: `${prefix}/launchpad/dca-builder` },
              { icon: Shield, label: 'Risk Analytics', desc: 'Phân tích rủi ro', color: '#EF4444', route: `${prefix}/launchpad/risk-analytics` },
            ].map(tool => (
              <button key={tool.label}
                onClick={() => navigate(tool.route)}
                className="rounded-2xl p-3.5 flex flex-col gap-2 text-left hover:opacity-90 transition-opacity active:scale-[0.98]"
                style={{ background: tool.color + '08', border: `1px solid ${tool.color}18` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: tool.color + '15' }}>
                  <tool.icon size={18} color={tool.color} />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{tool.label}</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </PageSection>

        {/* Anti-scam banner */}
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={16} color="#EF4444" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
              Cảnh báo an toàn
            </p>
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              Chỉ tham gia qua app chính thức. Không gửi token cho bất kỳ ai yêu cầu.
              Kiểm tra contract address trước khi tương tác.
            </p>
          </div>
        </div>

        {/* Bottom spacer for nav */}
        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   ProjectCard — individual project in list
   ═══════════════════════════════════════════════════════════ */

function ProjectCard({ project, onSubscribe, onDetail }: {
  project: LaunchProject;
  onSubscribe: () => void;
  onDetail: () => void;
}) {
  const c = useThemeColors();
  const type = TYPE_LABELS[project.type];
  const status = STATUS_LABELS[project.status];

  return (
    <TrCard overflow hover>
      {/* Tappable detail area */}
      <button className="w-full text-left p-4" onClick={onDetail}>
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold"
            style={{
              background: project.logoColor + '22',
              border: `2px solid ${project.logoColor}44`,
              color: project.logoColor,
            }}>
            {project.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{project.name}</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                style={{ background: type.bg, color: type.color }}>{type.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
              <span style={{ color: status.color, fontSize: 12 }}>{status.label}</span>
            </div>
          </div>
          {project.roi && (
            <div className="rounded-xl px-2.5 py-1.5 text-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p style={{ color: '#10B981', fontSize: 15, fontWeight: 800 }}>+{project.roi}%</p>
              <p style={{ color: c.text3, fontSize: 10 }}>ROI</p>
            </div>
          )}
        </div>

        {/* Description */}
        <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
          {project.description}
        </p>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {project.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-lg text-xs"
              style={{ background: c.chipBg, color: c.chipText, border: `1px solid ${c.chipBorder}` }}>
              {tag}
            </span>
          ))}
          <span className="px-2 py-0.5 rounded-lg text-xs"
            style={{ background: project.logoColor + '15', color: project.logoColor }}>
            {project.chain}
          </span>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Giá token', value: `$${project.price} ${project.priceUnit}` },
            { label: 'Hard Cap', value: project.hardCap },
            { label: 'Đã huy động', value: project.totalRaise },
            { label: 'Người tham gia', value: project.participants > 0 ? project.participants.toLocaleString() : '—' },
          ].map(r => (
            <div key={r.label} className="rounded-xl p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10 }}>{r.label}</p>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{r.value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {project.status !== 'upcoming' && (
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span style={{ color: c.text3, fontSize: 11 }}>Tiến trình</span>
              <span style={{
                color: project.progress >= 100 ? '#10B981' : c.text1,
                fontSize: 11, fontWeight: 600,
              }}>
                {project.progress}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: c.borderSolid }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(project.progress, 100)}%`,
                  background: project.progress >= 100
                    ? 'linear-gradient(90deg, #10B981, #059669)'
                    : `linear-gradient(90deg, ${project.logoColor}, ${project.logoColor}99)`,
                }} />
            </div>
          </div>
        )}

        {/* Countdown or date */}
        {project.status === 'active' && (
          <CountdownTimer
            targetDate={project.endDate}
            label="Kết thúc sau"
            color={project.logoColor}
          />
        )}
        {project.status === 'upcoming' && (
          <CountdownTimer
            targetDate={project.startDate}
            label="Bắt đầu sau"
            color="#F59E0B"
          />
        )}
        {project.status === 'ended' && (
          <div className="flex items-center gap-2">
            <Clock size={12} color={c.text3} />
            <span style={{ color: c.text3, fontSize: 12 }}>Đã kết thúc: {project.endDate}</span>
          </div>
        )}

        {/* Badges */}
        <div className="flex gap-2 mt-3">
          {project.kyc && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={11} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: 11 }}>KYC cấp {project.kycLevel}</span>
            </div>
          )}
          {project.whitelist && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Star size={11} color="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: 11 }}>Whitelist</span>
            </div>
          )}
          {project.audit.status === 'passed' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Award size={11} color="#3B82F6" />
              <span style={{ color: '#3B82F6', fontSize: 11 }}>{project.audit.auditor}</span>
            </div>
          )}
        </div>
      </button>

      {/* Action buttons */}
      <div className="px-5 pb-4 flex gap-3">
        {project.status === 'active' && (
          <>
            <button onClick={onDetail}
              className="flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-2"
              style={{
                background: c.surface2, color: c.text2,
                border: `1px solid ${c.borderSolid}`,
                fontSize: 14, borderRadius: 14,
              }}>
              Chi tiết
            </button>
            <button onClick={onSubscribe}
              className="flex-1 h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{
                background: project.logoColor,
                fontSize: 14, borderRadius: 14,
              }}>
              <Rocket size={16} />
              Tham gia
            </button>
          </>
        )}
        {project.status === 'upcoming' && (
          <button onClick={onDetail}
            className="w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2"
            style={{
              background: 'rgba(245,158,11,0.1)', color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.3)',
              fontSize: 14, borderRadius: 14,
            }}>
            <Clock size={16} />
            Xem chi tiết
          </button>
        )}
        {project.status === 'ended' && (
          <button onClick={onDetail}
            className="w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2"
            style={{
              background: c.surface2, color: c.text2,
              border: `1px solid ${c.borderSolid}`,
              fontSize: 14, borderRadius: 14,
            }}>
            <ChevronRight size={16} />
            Xem chi tiết
          </button>
        )}
      </div>
    </TrCard>
  );
}