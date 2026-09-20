/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadDetailPage — Full Project Detail (Phase 1)
 * ══════════════════════════════════════════════════════════════
 *  Pattern A — Standard Page with tabs
 *  Sections: Overview, Tokenomics, Vesting, Team, Audit, Safety
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtAmount } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Rocket, Clock, Users, CheckCircle, Star, AlertCircle,
  ExternalLink, Shield, Lock, ChevronRight, Award,
  Globe, FileText, AlertTriangle, Copy, Briefcase,
  Bell, Coins, ArrowUpDown, Code2,
} from 'lucide-react';
import { getProject, TYPE_LABELS, STATUS_LABELS, MOCK_USER, type LaunchProject } from './launchpadData';
import {
  SubscribeSheet, CountdownTimer, EligibilityBanner,
  RiskDisclosure, ErrorState, CopyButton,
  KYCGateSheet, VipTiersOverview,
  NotificationPrefsSheet, WhitelistApplicationSheet,
} from './LaunchpadComponents';
import type { Subscription } from './launchpadData';

const DETAIL_TABS = ['Tổng quan', 'Tokenomics', 'Vesting', 'Team & Audit'] as const;
type DetailTab = typeof DETAIL_TABS[number];

export function LaunchpadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const c = useThemeColors();
  const [tab, setTab] = useState<DetailTab>('Tổng quan');
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showKYCGate, setShowKYCGate] = useState(false);
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [showWhitelist, setShowWhitelist] = useState(false);
  const [loading, setLoading] = useState(true);

  const project = getProject(id || '');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  if (!loading && !project) {
    return (
      <PageLayout>
        <Header title="Launchpad" back />
        <PageContent>
          <ErrorState />
        </PageContent>
      </PageLayout>
    );
  }

  if (loading || !project) {
    return (
      <PageLayout>
        <Header title="Launchpad" back />
        <PageContent>
          <LoadingSkeleton />
        </PageContent>
      </PageLayout>
    );
  }

  const type = TYPE_LABELS[project.type];
  const status = STATUS_LABELS[project.status];
  const canSubscribe = project.status === 'active';
  const userNeedsKYC = project.kyc && MOCK_USER.kycLevel < project.kycLevel;

  const handleSubscribeClick = () => {
    if (userNeedsKYC) {
      setShowKYCGate(true);
    } else {
      setShowSubscribe(true);
    }
  };

  const handleSubscribeSuccess = (sub: Omit<Subscription, 'id'>) => {
    setShowSubscribe(false);
    navigate(`${prefix}/launchpad/receipt/new`, {
      state: { subscription: { ...sub, id: `sub_${Date.now()}` } },
    });
  };

  return (
    <PageLayout variant={canSubscribe ? 'flush' : 'default'}>
      {showSubscribe && (
        <SubscribeSheet
          project={project}
          onClose={() => setShowSubscribe(false)}
          onSuccess={handleSubscribeSuccess}
        />
      )}
      {showKYCGate && project && (
        <KYCGateSheet
          project={project}
          userKycLevel={MOCK_USER.kycLevel}
          onClose={() => setShowKYCGate(false)}
        />
      )}
      {showNotifPrefs && project && (
        <NotificationPrefsSheet
          projectName={project.name}
          onClose={() => setShowNotifPrefs(false)}
        />
      )}
      {showWhitelist && project && (
        <WhitelistApplicationSheet
          project={project}
          onClose={() => setShowWhitelist(false)}
          onSuccess={() => setShowWhitelist(false)}
        />
      )}

      <Header title={project.name} back />

      <TabBar tabs={DETAIL_TABS} active={tab} onChange={setTab} />

      <PageContent gap="default" style={canSubscribe ? { paddingBottom: 100 } : undefined}>
        {/* Hero card */}
        <TrCard variant="hero" className="p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full"
            style={{ background: `radial-gradient(circle, ${project.logoColor}30 0%, transparent 65%)` }} />

          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{
                background: project.logoColor + '22',
                border: `2px solid ${project.logoColor}44`,
                color: project.logoColor,
              }}>
              {project.logo}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{project.name}</span>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{ background: type.bg, color: type.color }}>{type.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>${project.symbol}</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                  <span style={{ color: status.color, fontSize: 12 }}>{status.label}</span>
                </div>
              </div>
            </div>
            {project.roi && (
              <div className="rounded-xl px-3 py-2 text-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <p style={{ color: '#10B981', fontSize: 18, fontWeight: 800 }}>+{project.roi}%</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>ROI</p>
              </div>
            )}
          </div>

          {/* Countdown */}
          <div className="relative z-10">
            {project.status === 'active' && (
              <CountdownTimer targetDate={project.endDate} label="Kết thúc sau" color={project.logoColor} />
            )}
            {project.status === 'upcoming' && (
              <CountdownTimer targetDate={project.startDate} label="Bắt đầu sau" color="#F59E0B" />
            )}
          </div>
        </TrCard>

        {/* Eligibility gate */}
        <EligibilityBanner project={project} />

        {/* Phase 4: Advanced actions */}
        <div className="flex gap-2">
          {project.type === 'launchpool' && (
            <button onClick={() => navigate(`${prefix}/launchpad/staking`)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <Coins size={14} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>Launchpool</span>
            </button>
          )}
          {project.type === 'ido' && (
            <button onClick={() => navigate(`${prefix}/launchpad/idobridge/${project.id}`)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
              <ArrowUpDown size={14} color="#8B5CF6" />
              <span style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 600 }}>DEX Bridge</span>
            </button>
          )}
          <button onClick={() => navigate(`${prefix}/launchpad/contract/${project.id}`)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
            <Code2 size={14} color="#3B82F6" />
            <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>Contract</span>
          </button>
        </div>

        {/* Tab content */}
        {tab === 'Tổng quan' && <OverviewTab project={project} />}
        {tab === 'Tokenomics' && <TokenomicsTab project={project} />}
        {tab === 'Vesting' && <VestingTab project={project} />}
        {tab === 'Team & Audit' && <TeamAuditTab project={project} />}

        {/* Phase 2: VIP Tiers overview */}
        {tab === 'Tổng quan' && canSubscribe && (
          <VipTiersOverview currentLevel={MOCK_USER.vipLevel} />
        )}

        {/* Risk disclosure */}
        <RiskDisclosure />

        {/* Anti-scam */}
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={16} color="#EF4444" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Chỉ tham gia qua app chính thức. Kiểm tra contract address trước khi tương tác. Không gửi token cho bất kỳ ai.
          </p>
        </div>
      </PageContent>

      {/* Sticky CTA for active projects */}
      {canSubscribe && (
        <StickyFooter>
          <CTAButton onClick={handleSubscribeClick} bg={project.logoColor}>
            <Rocket size={18} />
            {userNeedsKYC ? 'Xác minh KYC để tham gia' : `Tham gia ngay — ${project.name}`}
          </CTAButton>
        </StickyFooter>
      )}
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab: Overview
   ═══════════════════════════════════════════════════════════ */

function OverviewTab({ project }: { project: LaunchProject }) {
  const c = useThemeColors();

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Mô tả dự án</p>
        <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6 }}>{project.longDescription}</p>
      </TrCard>

      {/* Key metrics */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Thông tin chính</p>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Giá token', value: `$${project.price} ${project.priceUnit}`, mono: true },
            { label: 'Hard Cap', value: project.hardCap, mono: true },
            { label: 'Đã huy động', value: project.totalRaise, mono: true },
            { label: 'Giới hạn đầu tư', value: `$${project.minBuy} – $${project.maxBuy}`, mono: true },
            { label: 'Người tham gia', value: project.participants > 0 ? project.participants.toLocaleString() : '—', mono: true },
            { label: 'Bắt đầu', value: project.startDate },
            { label: 'Kết thúc', value: project.endDate },
            { label: 'Ngày listing', value: project.listingDate },
            { label: 'Blockchain', value: project.chain },
            { label: 'Phí nền tảng', value: project.platformFee > 0 ? `${project.platformFee}%` : 'Miễn phí' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-1"
              style={{ borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ color: c.text3, fontSize: 12 }}>{row.label}</span>
              <span style={{
                color: c.text1, fontSize: 12, fontWeight: 600,
                fontFamily: row.mono ? 'monospace' : 'inherit',
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Progress */}
      {project.status !== 'upcoming' && (
        <TrCard className="p-4">
          <div className="flex justify-between mb-2">
            <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Tiến trình huy động</span>
            <span style={{
              color: project.progress >= 100 ? '#10B981' : project.logoColor,
              fontSize: 16, fontWeight: 800,
            }}>
              {project.progress}%
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: c.borderSolid }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(project.progress, 100)}%`,
                background: project.progress >= 100
                  ? 'linear-gradient(90deg, #10B981, #059669)'
                  : `linear-gradient(90deg, ${project.logoColor}, ${project.logoColor}99)`,
              }} />
          </div>
          <div className="flex justify-between mt-2">
            <span style={{ color: c.text3, fontSize: 11 }}>
              {fmtAmount(project.subscribed, 0)} / {project.hardCap}
            </span>
            <span style={{ color: c.text3, fontSize: 11 }}>
              {project.participants.toLocaleString()} người
            </span>
          </div>
        </TrCard>
      )}

      {/* Contract & links */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Thông tin liên kết</p>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span style={{ color: c.text3, fontSize: 12 }}>Contract</span>
            <CopyButton text={project.contractAddress} />
          </div>
          {[
            { label: 'Website', value: project.website, icon: Globe },
            { label: 'Twitter', value: project.twitter, icon: ExternalLink },
            { label: 'Telegram', value: project.telegram, icon: ExternalLink },
          ].map(link => (
            <div key={link.label} className="flex justify-between items-center">
              <span style={{ color: c.text3, fontSize: 12 }}>{link.label}</span>
              <button className="flex items-center gap-1.5">
                <span style={{ color: '#3B82F6', fontSize: 12 }}>{link.value}</span>
                <link.icon size={12} color="#3B82F6" />
              </button>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {project.kyc && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <Shield size={14} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>KYC cấp {project.kycLevel} yêu cầu</span>
          </div>
        )}
        {project.whitelist && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <Star size={14} color="#F59E0B" />
            <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 600 }}>Whitelist bắt buộc</span>
          </div>
        )}
        {project.audit.status === 'passed' && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
            <Award size={14} color="#3B82F6" />
            <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>Audit: {project.audit.auditor}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab: Tokenomics (with Recharts donut)
   ═══════════════════════════════════════════════════════════ */

function TokenomicsTab({ project }: { project: LaunchProject }) {
  const c = useThemeColors();
  const total = project.tokenomics.reduce((s, t) => s + t.percent, 0);

  return (
    <div className="flex flex-col gap-4">
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Phân bổ token</p>

        {/* Donut chart */}
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                key="pie-tk"
                data={project.tokenomics}
                dataKey="percent"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                strokeWidth={0}
              >
                {project.tokenomics.map((entry, i) => (
                  <Cell key={`tk-cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                key="tooltip-tk"
                contentStyle={{
                  background: c.surface,
                  border: `1px solid ${c.borderSolid}`,
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {project.tokenomics.map(t => (
            <div key={t.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: t.color }} />
              <span style={{ color: c.text2, fontSize: 11, flex: 1 }}>{t.label}</span>
              <span style={{ color: c.text1, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                {t.percent}%
              </span>
            </div>
          ))}
        </div>
      </TrCard>

      <TrCard variant="inner" className="p-3">
        <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
          Phân bổ token có thể thay đổi theo quyết định của dự án. Kiểm tra whitepaper mới nhất để cập nhật.
        </p>
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab: Vesting Schedule
   ═══════════════════════════════════════════════════════════ */

function VestingTab({ project }: { project: LaunchProject }) {
  const c = useThemeColors();
  let cumulative = 0;

  return (
    <div className="flex flex-col gap-4">
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Lịch mở khóa token</p>
        <p style={{ color: c.text3, fontSize: 12, marginBottom: 16 }}>
          {project.vesting[0]?.percent || 0}% mở khóa tại TGE, còn lại vest {project.vesting.length - 1} giai đoạn
        </p>

        {/* Timeline */}
        <div className="flex flex-col">
          {project.vesting.map((step, i) => {
            cumulative += step.percent;
            const isLast = i === project.vesting.length - 1;
            const statusColor = step.status === 'claimed' ? '#10B981'
              : step.status === 'claimable' ? '#3B82F6'
              : c.text3;
            const statusLabel = step.status === 'claimed' ? 'Đã nhận'
              : step.status === 'claimable' ? 'Sẵn sàng nhận'
              : 'Khóa';

            return (
              <div key={`vest-${i}`} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full border-2 shrink-0"
                    style={{
                      borderColor: statusColor,
                      background: step.status !== 'locked' ? statusColor : 'transparent',
                    }} />
                  {!isLast && (
                    <div className="w-0.5 flex-1 min-h-[32px]" style={{ background: c.divider }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{step.label}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{step.date}</p>
                    </div>
                    <div className="text-right">
                      <p style={{
                        color: step.percent > 0 ? c.text1 : c.text3,
                        fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                      }}>
                        {step.percent > 0 ? `${step.percent}%` : 'Cliff'}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>Tổng: {cumulative.toFixed(1)}%</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-xs"
                    style={{
                      background: `${statusColor}15`,
                      color: statusColor,
                      fontWeight: 600,
                    }}>
                    {statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab: Team & Audit
   ═══════════════════════════════════════════════════════════ */

function TeamAuditTab({ project }: { project: LaunchProject }) {
  const c = useThemeColors();
  const audit = project.audit;
  const auditStatusColor = audit.status === 'passed' ? '#10B981'
    : audit.status === 'pending' ? '#F59E0B' : '#EF4444';
  const auditStatusLabel = audit.status === 'passed' ? 'Đã pass'
    : audit.status === 'pending' ? 'Đang review' : 'Có vấn đề';

  return (
    <div className="flex flex-col gap-4">
      {/* Team */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Đội ngũ</p>
        <div className="flex flex-col gap-3">
          {project.team.map(member => (
            <div key={member.name} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: c.surface2 }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background: project.logoColor + '22',
                  color: project.logoColor,
                  border: `1.5px solid ${project.logoColor}44`,
                }}>
                {member.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{member.name}</span>
                  {member.verified && <CheckCircle size={13} color="#3B82F6" />}
                </div>
                <span style={{ color: c.text3, fontSize: 12 }}>{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Audit */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Audit bảo mật</p>
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={18} color={auditStatusColor} />
              <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{audit.auditor}</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ background: `${auditStatusColor}15`, color: auditStatusColor }}>
              {auditStatusLabel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Critical', value: audit.critical, color: '#EF4444' },
              { label: 'High', value: audit.high, color: '#F59E0B' },
              { label: 'Medium', value: audit.medium, color: '#3B82F6' },
            ].map(f => (
              <div key={f.label} className="rounded-xl p-2.5 text-center"
                style={{ background: `${f.color}08`, border: `1px solid ${f.color}20` }}>
                <p style={{ color: f.color, fontSize: 18, fontWeight: 800 }}>{f.value}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{f.label}</p>
              </div>
            ))}
          </div>

          <button className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl"
            style={{ background: c.surface, border: `1px solid ${c.borderSolid}` }}>
            <FileText size={14} color="#3B82F6" />
            <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>Xem báo cáo audit</span>
          </button>
        </div>
      </TrCard>

      {/* Restrictions */}
      {project.restrictions.length > 0 && (
        <TrCard variant="inner" className="p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#F59E0B', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                Hạn chế vùng lãnh thổ
              </p>
              {project.restrictions.map((r, i) => (
                <p key={i} style={{ color: c.text2, fontSize: 11 }}>{r}</p>
              ))}
            </div>
          </div>
        </TrCard>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LoadingSkeleton
   ═══════════════════════════════════════════════════════════ */

function LoadingSkeleton() {
  const c = useThemeColors();
  const shimmer = {
    background: `linear-gradient(90deg, ${c.surface2} 25%, ${c.border} 50%, ${c.surface2} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl h-48" style={shimmer} />
      <div className="h-12 rounded-2xl" style={shimmer} />
      <div className="h-64 rounded-2xl" style={shimmer} />
      <div className="h-32 rounded-2xl" style={shimmer} />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}