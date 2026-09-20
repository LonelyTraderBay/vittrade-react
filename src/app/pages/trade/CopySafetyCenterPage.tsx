/**
 * ══════════════════════════════════════════════════════════════
 *  CopySafetyCenterPage — Phase 3: Trust & Safety Hub
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Provider verification explained
 * - Trust metrics breakdown (Sharpe, Max DD, slippage)
 * - Community guidelines
 * - Safety tools (block, report, emergency stop)
 * - Recent enforcement actions
 * 
 * Compliance:
 * - User education (consumer protection)
 * - Transparency in enforcement
 * - Clear reporting procedures
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Educational tone
 * - Action-oriented CTAs
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Shield, Info, AlertTriangle, BookOpen, Users, Flag, Ban,
  ChevronDown, CheckCircle, XCircle, TrendingUp, Activity
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

type TabType = 'verification' | 'metrics' | 'guidelines' | 'tools' | 'enforcement';

interface VerificationTier {
  tier: string;
  requirements: string[];
  benefits: string[];
  color: string;
}

interface TrustMetric {
  name: string;
  description: string;
  goodRange: string;
  badRange: string;
  whyMatters: string;
}

interface EnforcementAction {
  id: string;
  date: string;
  providerName: string;
  action: 'suspended' | 'warned' | 'verified';
  reason: string;
}

const VERIFICATION_TIERS: VerificationTier[] = [
  {
    tier: 'Basic',
    requirements: [
      'Email verification',
      'Phone verification',
      'KYC Level 1',
    ],
    benefits: [
      'Can become provider',
      'Basic provider features',
    ],
    color: '#6B7280',
  },
  {
    tier: 'Verified',
    requirements: [
      'All Basic requirements',
      'KYC Level 2 (ID + Selfie)',
      '6 months trading history',
      '$10,000 minimum capital',
      'Full disclosure obligations',
    ],
    benefits: [
      'Verified badge',
      'Higher trust from followers',
      'Advanced provider features',
    ],
    color: '#3B82F6',
  },
  {
    tier: 'Pro',
    requirements: [
      'All Verified requirements',
      'KYC Level 2 + Proof of Address',
      '12 months trading history',
      '$50,000 minimum capital',
      'Sharpe Ratio > 1.5',
      'Monthly performance audit',
    ],
    benefits: [
      'Pro badge',
      'Priority support',
      'Featured in leaderboard',
      'Premium analytics',
    ],
    color: '#8B5CF6',
  },
];

const TRUST_METRICS: TrustMetric[] = [
  {
    name: 'Sharpe Ratio',
    description: 'Measures risk-adjusted return. Higher is better.',
    goodRange: '> 1.5 (excellent), 1.0-1.5 (good)',
    badRange: '< 1.0 (poor)',
    whyMatters: 'Shows if provider is taking smart risks or just gambling',
  },
  {
    name: 'Max Drawdown',
    description: 'Largest peak-to-trough decline in account value.',
    goodRange: '< 15% (excellent), 15-25% (acceptable)',
    badRange: '> 25% (risky)',
    whyMatters: 'Indicates worst-case loss scenario. Can you handle it?',
  },
  {
    name: 'Slippage',
    description: 'Difference between provider\'s price and your execution price.',
    goodRange: '< 0.2% (excellent), 0.2-0.5% (acceptable)',
    badRange: '> 0.5% (poor execution)',
    whyMatters: 'High slippage eats into your returns, especially in volatile markets',
  },
  {
    name: 'Win Rate',
    description: 'Percentage of profitable trades.',
    goodRange: '> 60% (excellent), 50-60% (acceptable)',
    badRange: '< 50% (risky)',
    whyMatters: 'Combined with avg win/loss, shows strategy consistency',
  },
];

const ENFORCEMENT_ACTIONS: EnforcementAction[] = [
  {
    id: 'enf-1',
    date: '2026-03-05',
    providerName: 'Provider X',
    action: 'suspended',
    reason: 'Wash trading detected (fake volume)',
  },
  {
    id: 'enf-2',
    date: '2026-02-28',
    providerName: 'Provider Y',
    action: 'warned',
    reason: 'Undisclosed fee changes',
  },
  {
    id: 'enf-3',
    date: '2026-02-20',
    providerName: 'Provider Z',
    action: 'verified',
    reason: 'Passed Pro tier audit',
  },
];

export function CopySafetyCenterPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [activeTab, setActiveTab] = useState<TabType>('verification');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  return (
    <PageLayout>
      <Header title="Safety Center" back />

      <PageContent gap="relaxed">
        {/* Hero Banner */}
        <div className="p-4 rounded-2xl" style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}>
          <div className="flex gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: c.primary }}
            >
              <Shield size={24} color="#fff" />
            </div>
            <div>
              <h3 style={{ color: c.primary, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Your Safety is Our Priority
              </h3>
              <p style={{ color: c.primary, fontSize: 11, lineHeight: 1.5 }}>
                Learn how to identify trustworthy providers and protect yourself from scams.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'verification', label: 'Verification' },
            { id: 'metrics', label: 'Metrics' },
            { id: 'guidelines', label: 'Guidelines' },
            { id: 'tools', label: 'Tools' },
            { id: 'enforcement', label: 'Enforcement' },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* Tab Content */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
              Provider verification tiers explained:
            </p>

            {VERIFICATION_TIERS.map(tier => (
              <div
                key={tier.tier}
                className="p-4 rounded-2xl"
                style={{ background: c.surface, border: `2px solid ${tier.color}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={20} color={tier.color} />
                  <h4 style={{ color: tier.color, fontSize: 14, fontWeight: 700 }}>
                    {tier.tier}
                  </h4>
                </div>

                <div className="mb-3">
                  <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                    Requirements:
                  </p>
                  <ul className="space-y-1">
                    {tier.requirements.map((req, i) => (
                      <li key={i} style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                        • {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                    Benefits:
                  </p>
                  <ul className="space-y-1">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                        ✓ {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            <div className="p-3 rounded-xl" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
                <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.5 }}>
                  <strong>Important:</strong> Verification badges confirm identity and track record, 
                  but DO NOT guarantee future performance. Always check risk metrics before copying.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-3">
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
              Understanding trust metrics:
            </p>

            {TRUST_METRICS.map(metric => (
              <div 
                key={metric.name}
                className="rounded-2xl overflow-hidden"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <button
                  onClick={() => setExpandedMetric(expandedMetric === metric.name ? null : metric.name)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="text-left">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      {metric.name}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {metric.description}
                    </p>
                  </div>
                  <ChevronDown 
                    size={16} 
                    color={c.text3}
                    className="transition-transform shrink-0"
                    style={{ transform: expandedMetric === metric.name ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {expandedMetric === metric.name && (
                  <div className="px-4 pb-4" style={{ borderTop: `1px solid ${c.border}` }}>
                    <div className="pt-3 space-y-3">
                      <div className="p-2 rounded-lg" style={{ background: '#10B98122' }}>
                        <p style={{ color: '#10B981', fontSize: 10, fontWeight: 600, marginBottom: 2 }}>
                          ✓ Good Range
                        </p>
                        <p style={{ color: '#10B981', fontSize: 10 }}>
                          {metric.goodRange}
                        </p>
                      </div>

                      <div className="p-2 rounded-lg" style={{ background: '#EF444422' }}>
                        <p style={{ color: '#EF4444', fontSize: 10, fontWeight: 600, marginBottom: 2 }}>
                          ✗ Bad Range
                        </p>
                        <p style={{ color: '#EF4444', fontSize: 10 }}>
                          {metric.badRange}
                        </p>
                      </div>

                      <div className="p-2 rounded-lg" style={{ background: c.primary + '15' }}>
                        <p style={{ color: c.primary, fontSize: 10, fontWeight: 600, marginBottom: 2 }}>
                          Why It Matters
                        </p>
                        <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.4 }}>
                          {metric.whyMatters}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'guidelines' && (
          <div className="space-y-4">
            <PageSection label="Prohibited Provider Behaviors" accentColor="#EF4444">
              <ul className="space-y-2">
                {[
                  'Wash trading (fake volume)',
                  'Fake performance data',
                  'Undisclosed conflicts of interest',
                  'Strategy changes without 24h notice',
                  'Hidden fee structures',
                  'Market manipulation',
                  'Misleading claims (guaranteed profits)',
                ].map((item, i) => (
                  <li 
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg"
                    style={{ background: c.surface2 }}
                  >
                    <XCircle size={14} color="#EF4444" className="shrink-0 mt-0.5" />
                    <span style={{ color: c.text2, fontSize: 11 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </PageSection>

            <PageSection label="Follower Responsibilities" accentColor="#3B82F6">
              <ul className="space-y-2">
                {[
                  'Do your own research before copying',
                  'Understand all risks involved',
                  'Set appropriate stop-loss limits',
                  'Monitor your copies regularly',
                  'Report suspicious behavior immediately',
                  'Do not over-allocate to single provider',
                ].map((item, i) => (
                  <li 
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg"
                    style={{ background: c.surface2 }}
                  >
                    <CheckCircle size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
                    <span style={{ color: c.text2, fontSize: 11 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </PageSection>

            <PageSection label="Reporting Procedures" accentColor={c.primary}>
              <div className="space-y-2">
                <p style={{ color: c.text2, fontSize: 11, marginBottom: 8 }}>
                  If you suspect provider misconduct:
                </p>

                <div className="p-3 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    1. Collect Evidence
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    Screenshots, trade IDs, timestamps, chat logs
                  </p>
                </div>

                <div className="p-3 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    2. File Report
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    Use "Report Provider" form with detailed description
                  </p>
                </div>

                <div className="p-3 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    3. Investigation
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    Team reviews within 24-48 hours
                  </p>
                </div>

                <div className="p-3 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    4. Enforcement
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    Warning, suspension, or permanent ban if violation confirmed
                  </p>
                </div>
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-4">
            <PageSection label="Safety Tools" accentColor={c.primary}>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`${prefix}/trade/copy-trading`)}
                  className="w-full p-4 rounded-xl flex items-center justify-between"
                  style={{ background: c.surface2, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-3 text-left">
                    <Ban size={20} color="#F59E0B" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                        Block Provider
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        Prevent provider from appearing in your feeds
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color={c.text3} />
                </button>

                <button
                  onClick={() => navigate(`${prefix}/trade/copy-trading/safety`)}
                  className="w-full p-4 rounded-xl flex items-center justify-between"
                  style={{ background: c.surface2, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-3 text-left">
                    <Flag size={20} color="#EF4444" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                        Report Provider
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        Submit complaint to moderation team
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color={c.text3} />
                </button>

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to STOP ALL copying? This will close all positions immediately.')) {
                      alert('Emergency stop activated! All copies stopped.');
                    }
                  }}
                  className="w-full p-4 rounded-xl flex items-center justify-between"
                  style={{ background: c.dangerBg, border: `2px solid ${c.dangerText}` }}
                >
                  <div className="flex items-center gap-3 text-left">
                    <AlertTriangle size={20} color={c.dangerText} />
                    <div>
                      <p style={{ color: c.dangerText, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                        Emergency Stop All
                      </p>
                      <p style={{ color: c.dangerText, fontSize: 10 }}>
                        Immediately stop all copying and close positions
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color={c.dangerText} />
                </button>
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'enforcement' && (
          <div className="space-y-4">
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
              Recent enforcement actions taken to protect users:
            </p>

            <div className="space-y-2">
              {ENFORCEMENT_ACTIONS.map(action => (
                <div
                  key={action.id}
                  className="p-4 rounded-xl"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ 
                        background: action.action === 'suspended' ? '#EF444422' : 
                                   action.action === 'warned' ? '#F59E0B22' : '#10B98122'
                      }}
                    >
                      {action.action === 'suspended' ? (
                        <XCircle size={18} color="#EF4444" />
                      ) : action.action === 'warned' ? (
                        <AlertTriangle size={18} color="#F59E0B" />
                      ) : (
                        <CheckCircle size={18} color="#10B981" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ 
                            background: action.action === 'suspended' ? '#EF444422' : 
                                       action.action === 'warned' ? '#F59E0B22' : '#10B98122',
                            color: action.action === 'suspended' ? '#EF4444' : 
                                   action.action === 'warned' ? '#F59E0B' : '#10B981',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        >
                          {action.action}
                        </span>
                        <span style={{ color: c.text3, fontSize: 10 }}>{action.date}</span>
                      </div>

                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        {action.providerName}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                        {action.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
              <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5, textAlign: 'center' }}>
                We take enforcement seriously. All actions are logged and transparent. 
                If you believe an action was unfair, contact support.
              </p>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
