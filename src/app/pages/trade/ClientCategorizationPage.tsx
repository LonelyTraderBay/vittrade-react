/**
 * ══════════════════════════════════════════════════════════════
 *  ClientCategorizationPage — Phase 4 Sprint 2 Day 1-2
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - MiFID II client categorization (Retail / Professional / ECP)
 * - Opt-up / opt-down request workflows
 * - Category-specific protections disclosure
 * - Regulatory compliance tracking
 * 
 * Compliance:
 * - MiFID II Art. 4: Client categorization required
 * - Annex II: Professional client criteria
 * - Different protections per category:
 *   - Retail: Maximum protection (appropriateness, best execution, investor compensation)
 *   - Professional: Reduced protection (assumed knowledge)
 *   - ECP: Minimal protection (eligible counterparty)
 * 
 * Features:
 * - Current category display
 * - Protection comparison table
 * - Opt-up request workflow (Retail → Professional)
 * - Opt-down workflow (Professional → Retail)
 * - Qualification criteria checker
 * - Category history & audit trail
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Clear protection differences
 * - Multi-step opt-up process
 * - Regulatory disclosures
 * - Trust-first transparency
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, User, CheckCircle, AlertTriangle, ChevronRight,
  Info, FileText, Award, Lock, TrendingUp, Clock, Eye,
  Settings, ExternalLink, Target, Activity
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';

type ClientCategory = 'retail' | 'professional' | 'ecp';
type TabType = 'overview' | 'protections' | 'requirements' | 'history';

interface CategoryInfo {
  id: ClientCategory;
  label: string;
  description: string;
  color: string;
  icon: any;
  protections: string[];
  requirements: string[];
}

interface CategoryHistory {
  date: string;
  action: 'categorized' | 'opt-up-requested' | 'opt-up-approved' | 'opt-down';
  from?: ClientCategory;
  to: ClientCategory;
  reason: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: 'retail',
    label: 'Retail Client',
    description: 'Individual investors with maximum regulatory protection',
    color: '#10B981',
    icon: User,
    protections: [
      'Full appropriateness test required',
      'Best execution obligation',
      'Investor compensation scheme (up to €100k)',
      'Detailed cost & charges disclosure',
      'Negative balance protection',
      'Right to complain to ombudsman',
      'Cooling-off period (14 days)',
      'Product governance protection',
    ],
    requirements: [
      'Natural person',
      'Trading for personal account',
      'Not meeting professional criteria',
    ],
  },
  {
    id: 'professional',
    label: 'Professional Client',
    description: 'Experienced investors who can waive certain protections',
    color: '#3B82F6',
    icon: Award,
    protections: [
      'Appropriateness test may be waived',
      'Best execution obligation (reduced)',
      'Limited investor compensation',
      'Simplified cost disclosure',
      'Product governance (reduced)',
    ],
    requirements: [
      'Portfolio > €500,000',
      'Trading volume > 10 transactions/quarter (last 4 quarters)',
      'Work experience in financial sector (1+ year) OR',
      'Hold position requiring financial knowledge',
    ],
  },
  {
    id: 'ecp',
    label: 'Eligible Counterparty',
    description: 'Institutional entities with minimal protection',
    color: '#F59E0B',
    icon: Lock,
    protections: [
      'No conduct of business rules',
      'No investor compensation',
      'Minimal disclosure requirements',
    ],
    requirements: [
      'Investment firms',
      'Credit institutions',
      'Insurance companies',
      'UCITS & pension funds',
      'Government entities',
    ],
  },
];

const HISTORY: CategoryHistory[] = [
  {
    date: '2026-03-08',
    action: 'categorized',
    to: 'retail',
    reason: 'Initial account registration',
  },
  {
    date: '2025-12-15',
    action: 'opt-up-requested',
    from: 'retail',
    to: 'professional',
    reason: 'User submitted qualification documents',
  },
];

export function ClientCategorizationPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<TabType>('overview');
  const [currentCategory] = useState<ClientCategory>('retail'); // Mock: current user is retail

  const current = CATEGORIES.find(cat => cat.id === currentCategory)!;
  const CurrentIcon = current.icon;

  const TABS = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'protections' as TabType, label: 'Protections' },
    { id: 'requirements' as TabType, label: 'Requirements' },
    { id: 'history' as TabType, label: 'History' },
  ];

  const handleOptUp = () => {
    navigate(`${prefix}/trade/copy-trading/client-opt-up-request`);
  };

  return (
    <PageLayout>
      <Header
        title="Client Categorization"
        subtitle="MiFID II Classification"
        back
      />

      <PageContent gap="relaxed">
        {/* Current Category Card */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: current.color + '15' }}>
              <CurrentIcon size={28} color={current.color} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                  {current.label}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                  style={{ background: current.color + '15', color: current.color }}>
                  CURRENT
                </span>
              </div>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.4 }}>
                {current.description}
              </p>
            </div>

            <CheckCircle size={20} color={current.color} />
          </div>

          {/* Protection Level */}
          <div className="rounded-lg p-3 flex items-center gap-2.5"
            style={{ background: c.successBg, border: `1px solid ${c.successBorder}` }}>
            <Shield size={16} color={c.successText} />
            <div className="flex-1">
              <p style={{ color: c.successText, fontSize: 11, fontWeight: 600 }}>
                Maximum Protection Active
              </p>
              <p style={{ color: c.successText, fontSize: 9, opacity: 0.9, marginTop: 2 }}>
                You have full MiFID II retail investor protections
              </p>
            </div>
          </div>
        </TrCard>

        {/* Info Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.infoBg, border: `1px solid ${c.infoBorder}` }}>
          <Info size={16} color={c.infoText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.infoText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              MiFID II Categorization
            </p>
            <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              Your client category determines the level of regulatory protection you receive. Retail clients have maximum protection.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'overview' && (
          <>
            {/* All Categories */}
            <PageSection label="Client Categories">
              <div className="space-y-3">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isCurrent = category.id === currentCategory;

                  return (
                    <TrCard key={category.id} className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: category.color + '15' }}>
                          <Icon size={22} color={category.color} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                              {category.label}
                            </span>
                            {isCurrent && (
                              <CheckCircle size={14} color={category.color} />
                            )}
                          </div>
                          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                            {category.description}
                          </p>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 9 }}>Protections</p>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                            {category.protections.length} active
                          </p>
                        </div>

                        <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 9 }}>Requirements</p>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                            {category.requirements.length} criteria
                          </p>
                        </div>
                      </div>
                    </TrCard>
                  );
                })}
              </div>
            </PageSection>

            {/* Opt-up CTA */}
            {currentCategory === 'retail' && (
              <PageSection label="Want Professional Status?">
                <TrCard className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: '#3B82F6' + '15' }}>
                      <TrendingUp size={22} color="#3B82F6" />
                    </div>

                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                        Request Professional Client Status
                      </p>
                      <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                        If you meet the criteria, you can request to be treated as a professional client with reduced regulatory requirements.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg p-3 mb-3" style={{ background: c.warningBg }}>
                    <div className="flex gap-2">
                      <AlertTriangle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
                      <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4 }}>
                        <strong>Warning:</strong> Opting up means you waive certain investor protections. This cannot be reversed easily.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleOptUp}
                    className="w-full rounded-xl flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: '#3B82F6',
                      color: '#fff',
                      height: 44,
                      fontWeight: 600,
                      fontSize: 13,
                    }}>
                    <FileText size={16} />
                    <span>Start Opt-Up Application</span>
                    <ChevronRight size={14} />
                  </button>
                </TrCard>
              </PageSection>
            )}
          </>
        )}

        {tab === 'protections' && (
          <PageSection label="Protection Comparison">
            <div className="space-y-3">
              {CATEGORIES.map((category) => (
                <TrCard key={category.id} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded" style={{ background: category.color }} />
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                      {category.label}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {category.protections.map((protection, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle size={12} color={category.color} className="shrink-0 mt-0.5" />
                        <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>
                          {protection}
                        </span>
                      </div>
                    ))}
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {tab === 'requirements' && (
          <PageSection label="Qualification Requirements">
            <div className="space-y-3">
              {CATEGORIES.map((category) => (
                <TrCard key={category.id} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded" style={{ background: category.color }} />
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                      {category.label}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {category.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Target size={12} color={c.text3} className="shrink-0 mt-0.5" />
                        <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>
                          {req}
                        </span>
                      </div>
                    ))}
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {tab === 'history' && (
          <PageSection label="Category History">
            <div className="space-y-3">
              {HISTORY.map((entry, idx) => (
                <TrCard key={idx} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: c.primary + '15' }}>
                      <Clock size={18} color={c.primary} />
                    </div>

                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                        {entry.action === 'categorized' && 'Initial Categorization'}
                        {entry.action === 'opt-up-requested' && 'Opt-Up Requested'}
                        {entry.action === 'opt-up-approved' && 'Opt-Up Approved'}
                        {entry.action === 'opt-down' && 'Opted Down'}
                      </p>

                      {entry.from && (
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>
                          {CATEGORIES.find(c => c.id === entry.from)?.label} → {CATEGORIES.find(c => c.id === entry.to)?.label}
                        </p>
                      )}

                      <p style={{ color: c.text3, fontSize: 10 }}>
                        {entry.reason}
                      </p>

                      <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`${prefix}/trade/copy-trading/regulatory-disclosures`)}
            className="rounded-xl p-3 flex items-center justify-between transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2">
              <FileText size={16} color={c.primary} />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Disclosures</span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>

          <button
            onClick={() => navigate(`${prefix}/settings/security`)}
            className="rounded-xl p-3 flex items-center justify-between transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2">
              <Settings size={16} color="#10B981" />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Settings</span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}
