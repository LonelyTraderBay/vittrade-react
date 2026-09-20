/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadRiskAnalyticsPage — Phase 4.11 (Feature 4/4)
 * ══════════════════════════════════════════════════════════════
 *  Project risk scoring, due diligence metrics, security analysis
 *  Pattern A — Standard Page with tabs
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, FileText,
  Users, Lock, Code2, TrendingUp, ExternalLink, Info,
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const TABS = ['Tổng quan', 'Due Diligence', 'Báo cáo'] as const;
type Tab = typeof TABS[number];

interface RiskScore {
  overall: number;
  teamTransparency: number;
  auditScore: number;
  tokenomics: number;
  communityTrust: number;
  techSecurity: number;
  liquidityRisk: number;
}

interface ProjectRisk {
  id: string;
  name: string;
  symbol: string;
  riskScore: RiskScore;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  auditStatus: 'verified' | 'pending' | 'failed' | 'none';
  teamDoxxed: boolean;
  contractVerified: boolean;
  liquidityLocked: boolean;
  warnings: string[];
  strengths: string[];
}

const MOCK_PROJECT: ProjectRisk = {
  id: 'proj1',
  name: 'VitToken',
  symbol: 'VIT',
  riskScore: {
    overall: 78,
    teamTransparency: 85,
    auditScore: 92,
    tokenomics: 68,
    communityTrust: 75,
    techSecurity: 88,
    liquidityRisk: 62,
  },
  riskLevel: 'medium',
  auditStatus: 'verified',
  teamDoxxed: true,
  contractVerified: true,
  liquidityLocked: true,
  warnings: [
    'High token concentration in top 10 wallets (45%)',
    'Liquidity unlock scheduled in 3 months',
    'Limited trading history (< 30 days)',
  ],
  strengths: [
    'Multiple security audits passed',
    'Doxxed team with verifiable LinkedIn profiles',
    'Active community engagement (10K+ members)',
    'Transparent tokenomics documentation',
  ],
};

const MOCK_PROJECTS: Array<{ name: string; symbol: string; score: number; level: ProjectRisk['riskLevel'] }> = [
  { name: 'SafeToken', symbol: 'SAFE', score: 92, level: 'low' },
  { name: 'VitToken', symbol: 'VIT', score: 78, level: 'medium' },
  { name: 'MoonCoin', symbol: 'MOON', score: 45, level: 'high' },
  { name: 'RugToken', symbol: 'RUG', score: 18, level: 'critical' },
];

export function LaunchpadRiskAnalyticsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Tổng quan');
  const [selectedProject, setSelectedProject] = useState(MOCK_PROJECT);

  const radarData = [
    { metric: 'Team', value: selectedProject.riskScore.teamTransparency },
    { metric: 'Audit', value: selectedProject.riskScore.auditScore },
    { metric: 'Tokenomics', value: selectedProject.riskScore.tokenomics },
    { metric: 'Community', value: selectedProject.riskScore.communityTrust },
    { metric: 'Security', value: selectedProject.riskScore.techSecurity },
    { metric: 'Liquidity', value: selectedProject.riskScore.liquidityRisk },
  ];

  const pieData = [
    { name: 'Low Risk', value: 1, color: '#10B981' },
    { name: 'Medium Risk', value: 1, color: '#F59E0B' },
    { name: 'High Risk', value: 1, color: '#EF4444' },
    { name: 'Critical', value: 1, color: '#991B1B' },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      case 'critical': return '#991B1B';
      default: return c.text3;
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'low': return 'rgba(16,185,129,0.08)';
      case 'medium': return 'rgba(245,158,11,0.08)';
      case 'high': return 'rgba(239,68,68,0.08)';
      case 'critical': return 'rgba(153,27,27,0.08)';
      default: return c.bg;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#EF4444';
    return '#991B1B';
  };

  return (
    <PageLayout>
      <Header title="Risk Analytics" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Tổng quan' && (
          <>
            {/* Overall Risk Score */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>Overall Risk Score</p>
                  <p style={{ color: c.text1, fontSize: 28, fontWeight: 700 }}>
                    {selectedProject.riskScore.overall}/100
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="px-2 py-1 rounded-lg text-xs font-semibold"
                      style={{
                        background: getRiskBg(selectedProject.riskLevel),
                        color: getRiskColor(selectedProject.riskLevel),
                      }}
                    >
                      {selectedProject.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: getRiskBg(selectedProject.riskLevel),
                  }}
                >
                  <Shield size={32} color={getRiskColor(selectedProject.riskLevel)} />
                </div>
              </div>

              <div
                className="w-full rounded-full overflow-hidden mb-2"
                style={{ height: 8, background: c.bg }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${selectedProject.riskScore.overall}%`,
                    background: getScoreColor(selectedProject.riskScore.overall),
                  }}
                />
              </div>

              <p style={{ color: c.text3, fontSize: 11 }}>
                Based on 6 metrics: Team, Audit, Tokenomics, Community, Security, Liquidity
              </p>
            </div>

            {/* Radar Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Risk Breakdown
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid key="polar-grid" stroke={c.border} />
                  <PolarAngleAxis key="polar-angle" dataKey="metric" tick={{ fill: c.text3, fontSize: 11 }} />
                  <Radar
                    key="radar"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Checks */}
            <PageSection label="Kiểm tra nhanh">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Audit Verified', status: selectedProject.auditStatus === 'verified', icon: FileText },
                  { label: 'Team Doxxed', status: selectedProject.teamDoxxed, icon: Users },
                  { label: 'Contract Verified', status: selectedProject.contractVerified, icon: Code2 },
                  { label: 'Liquidity Locked', status: selectedProject.liquidityLocked, icon: Lock },
                ].map((check) => (
                  <div
                    key={check.label}
                    className="rounded-xl p-3"
                    style={{
                      background: check.status ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                      border: `1px solid ${check.status ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <check.icon size={16} color={check.status ? '#10B981' : '#EF4444'} />
                      {check.status ? (
                        <CheckCircle size={14} color="#10B981" />
                      ) : (
                        <XCircle size={14} color="#EF4444" />
                      )}
                    </div>
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{check.label}</p>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Warnings */}
            {selectedProject.warnings.length > 0 && (
              <PageSection label="Cảnh báo" accentColor="#EF4444">
                {selectedProject.warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-3 flex items-start gap-2"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    <AlertTriangle size={14} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ color: c.text1, fontSize: 12, lineHeight: 1.5 }}>{warning}</p>
                  </div>
                ))}
              </PageSection>
            )}

            {/* Strengths */}
            {selectedProject.strengths.length > 0 && (
              <PageSection label="Điểm mạnh" accentColor="#10B981">
                {selectedProject.strengths.map((strength, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-3 flex items-start gap-2"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
                  >
                    <CheckCircle size={14} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ color: c.text1, fontSize: 12, lineHeight: 1.5 }}>{strength}</p>
                  </div>
                ))}
              </PageSection>
            )}
          </>
        )}

        {tab === 'Due Diligence' && (
          <>
            {/* Team Info */}
            <PageSection label="Team & Governance">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Team Transparency</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-2 rounded-full overflow-hidden"
                      style={{ background: c.bg }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${selectedProject.riskScore.teamTransparency}%`,
                          background: getScoreColor(selectedProject.riskScore.teamTransparency),
                        }}
                      />
                    </div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                      {selectedProject.riskScore.teamTransparency}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text3, fontSize: 12 }}>Doxxed Team</p>
                    {selectedProject.teamDoxxed ? (
                      <CheckCircle size={14} color="#10B981" />
                    ) : (
                      <XCircle size={14} color="#EF4444" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text3, fontSize: 12 }}>LinkedIn Profiles</p>
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>5/5 verified</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text3, fontSize: 12 }}>Previous Projects</p>
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>2 successful</p>
                  </div>
                </div>
              </div>
            </PageSection>

            {/* Audit Info */}
            <PageSection label="Security Audit">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Audit Score</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-2 rounded-full overflow-hidden"
                      style={{ background: c.bg }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${selectedProject.riskScore.auditScore}%`,
                          background: getScoreColor(selectedProject.riskScore.auditScore),
                        }}
                      />
                    </div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                      {selectedProject.riskScore.auditScore}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { firm: 'CertiK', date: '2025-02-15', status: 'Passed', issues: 0 },
                    { firm: 'Quantstamp', date: '2025-03-01', status: 'Passed', issues: 2 },
                  ].map((audit, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-3"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Shield size={14} color="#10B981" />
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{audit.firm}</p>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                          style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981' }}
                        >
                          {audit.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p style={{ color: c.text3, fontSize: 11 }}>{audit.date}</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          {audit.issues} critical issues
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PageSection>

            {/* Tokenomics */}
            <PageSection label="Tokenomics Analysis">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Tokenomics Health</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-2 rounded-full overflow-hidden"
                      style={{ background: c.bg }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${selectedProject.riskScore.tokenomics}%`,
                          background: getScoreColor(selectedProject.riskScore.tokenomics),
                        }}
                      />
                    </div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                      {selectedProject.riskScore.tokenomics}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Supply</p>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>1B VIT</p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Circulating</p>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>250M (25%)</p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Team Tokens</p>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>15% (locked)</p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Top 10 Holders</p>
                    <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>45%</p>
                  </div>
                </div>
              </div>
            </PageSection>
          </>
        )}

        {tab === 'Báo cáo' && (
          <>
            {/* Project Comparison */}
            <PageSection label="So sánh dự án">
              {MOCK_PROJECTS.map((project) => (
                <div
                  key={project.symbol}
                  className="rounded-2xl p-4"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{project.name}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{project.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: getScoreColor(project.score), fontSize: 16, fontWeight: 700 }}>
                        {project.score}
                      </p>
                      <span
                        className="px-2 py-0.5 rounded-md text-[9px] font-semibold inline-block mt-1"
                        style={{
                          background: getRiskBg(project.level),
                          color: getRiskColor(project.level),
                        }}
                      >
                        {project.level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: 6, background: c.bg }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${project.score}%`,
                        background: getScoreColor(project.score),
                      }}
                    />
                  </div>
                </div>
              ))}
            </PageSection>

            {/* Distribution Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Risk Distribution (Market)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    key="pie"
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: item.color,
                      }}
                    />
                    <p style={{ color: c.text3, fontSize: 11 }}>{item.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <PageSection label="Tài liệu tham khảo">
              <div className="space-y-2">
                {[
                  { label: 'Official Website', url: 'https://vittoken.io' },
                  { label: 'Whitepaper', url: 'https://docs.vittoken.io' },
                  { label: 'CertiK Audit Report', url: 'https://certik.com/projects/vit' },
                  { label: 'Token Contract', url: 'https://etherscan.io/token/0x...' },
                ].map((resource) => (
                  <a
                    key={resource.label}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl p-3 hover:opacity-80 transition-opacity"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}
                  >
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{resource.label}</p>
                    <ExternalLink size={14} color={c.text3} />
                  </a>
                ))}
              </div>
            </PageSection>

            {/* Disclaimer */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Risk analysis is for reference only. Always do your own research (DYOR) before investing. Past performance does not guarantee future results.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}