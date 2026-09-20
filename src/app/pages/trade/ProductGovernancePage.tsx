/**
 * ══════════════════════════════════════════════════════════════
 *  ProductGovernancePage — Phase 4 Sprint 2 Day 3-4
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - MiFID II Product Governance framework
 * - Target market definition per strategy
 * - Negative target market identification
 * - Distribution strategy oversight
 * - Product monitoring & review
 * 
 * Compliance:
 * - MiFID II Art. 16(3): Product governance
 * - ESMA Guidelines on Product Governance
 * - Manufacturer vs. Distributor obligations
 * - Regular product review (at least annually)
 * 
 * Features:
 * - Product approval status
 * - Target market matrix
 * - Distribution channels
 * - Review schedule & history
 * - Risk classification
 * - Remedial actions tracker
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, Target, AlertTriangle, CheckCircle, TrendingUp,
  Users, BarChart3, Clock, FileText, Eye, ChevronRight,
  Award, Activity, Calendar, Filter
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';

type TabType = 'products' | 'reviews' | 'distribution';

interface CopyProduct {
  id: string;
  name: string;
  type: 'mirror' | 'fixed-ratio' | 'smart-allocation';
  status: 'approved' | 'under-review' | 'restricted';
  targetMarket: string[];
  negativeTarget: string[];
  riskLevel: 'low' | 'medium' | 'high';
  lastReview: string;
  nextReview: string;
  distributionChannels: string[];
}

const PRODUCTS: CopyProduct[] = [
  {
    id: 'prod-1',
    name: 'Mirror Copy Trading',
    type: 'mirror',
    status: 'approved',
    targetMarket: ['Professional clients', 'Retail with high knowledge', 'Portfolio > €10k'],
    negativeTarget: ['Inexperienced retail', 'Risk-averse investors', 'Portfolio < €5k'],
    riskLevel: 'high',
    lastReview: '2026-01-15',
    nextReview: '2027-01-15',
    distributionChannels: ['App', 'Web Platform', 'API'],
  },
  {
    id: 'prod-2',
    name: 'Fixed Ratio Copy',
    type: 'fixed-ratio',
    status: 'approved',
    targetMarket: ['All client categories', 'Moderate risk tolerance', 'Portfolio > €1k'],
    negativeTarget: ['Ultra-high-net-worth seeking bespoke', 'Day traders'],
    riskLevel: 'medium',
    lastReview: '2026-02-10',
    nextReview: '2027-02-10',
    distributionChannels: ['App', 'Web Platform'],
  },
  {
    id: 'prod-3',
    name: 'Smart Allocation Copy',
    type: 'smart-allocation',
    status: 'under-review',
    targetMarket: ['Professional clients', 'Sophisticated retail', 'Portfolio > €25k'],
    negativeTarget: ['Beginners', 'Conservative investors', 'Short-term traders'],
    riskLevel: 'high',
    lastReview: '2026-03-01',
    nextReview: '2026-06-01',
    distributionChannels: ['App (Beta)', 'API (Limited)'],
  },
];

export function ProductGovernancePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<TabType>('products');

  const TABS = [
    { id: 'products' as TabType, label: 'Products' },
    { id: 'reviews' as TabType, label: 'Reviews' },
    { id: 'distribution' as TabType, label: 'Distribution' },
  ];

  const STATUS_CONFIG = {
    approved: { color: '#10B981', label: 'Approved' },
    'under-review': { color: '#F59E0B', label: 'Under Review' },
    restricted: { color: '#EF4444', label: 'Restricted' },
  };

  const RISK_CONFIG = {
    low: { color: '#10B981', label: 'Low Risk' },
    medium: { color: '#F59E0B', label: 'Medium Risk' },
    high: { color: '#EF4444', label: 'High Risk' },
  };

  return (
    <PageLayout>
      <Header title="Product Governance" subtitle="MiFID II Oversight" back />

      <PageContent gap="relaxed">
        {/* Compliance Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.successBg, border: `1px solid ${c.successBorder}` }}>
          <CheckCircle size={16} color={c.successText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.successText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              All Products Compliant
            </p>
            <p style={{ color: c.successText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              3/3 products have approved target markets. Next review: June 2026.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Total Products</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>3</p>
            <p style={{ color: '#10B981', fontSize: 9, marginTop: 2 }}>2 approved</p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Reviews Due</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>1</p>
            <p style={{ color: '#F59E0B', fontSize: 9, marginTop: 2 }}>Within 3 months</p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Channels</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>3</p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>Active</p>
          </TrCard>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'products' && (
          <PageSection label="Copy Trading Products">
            <div className="space-y-3">
              {PRODUCTS.map((product) => {
                const statusCfg = STATUS_CONFIG[product.status];
                const riskCfg = RISK_CONFIG[product.riskLevel];

                return (
                  <TrCard key={product.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold"
                            style={{ background: statusCfg.color + '15', color: statusCfg.color }}>
                            {statusCfg.label}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold"
                            style={{ background: riskCfg.color + '15', color: riskCfg.color }}>
                            {riskCfg.label}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`${prefix}/trade/copy-trading/target-market-definition/${product.id}`)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: c.surface2 }}>
                        <ChevronRight size={16} color={c.text3} />
                      </button>
                    </div>

                    {/* Target Market */}
                    <div className="mb-3">
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Target Market:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {product.targetMarket.map((target, idx) => (
                          <span key={idx} className="px-2 py-1 rounded text-[9px]"
                            style={{ background: c.surface2, color: c.text2 }}>
                            {target}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Negative Target */}
                    <div className="mb-3">
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Negative Target:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {product.negativeTarget.map((target, idx) => (
                          <span key={idx} className="px-2 py-1 rounded text-[9px]"
                            style={{ background: c.errorBg, color: c.errorText }}>
                            {target}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Review Dates */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 9 }}>Last Review</p>
                        <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                          {new Date(product.lastReview).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 9 }}>Next Review</p>
                        <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                          {new Date(product.nextReview).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </PageSection>
        )}

        {tab === 'reviews' && (
          <PageSection label="Review Schedule">
            <TrCard className="p-4">
              <div className="space-y-3">
                {PRODUCTS.map((product) => {
                  const nextReviewDate = new Date(product.nextReview);
                  const daysUntil = Math.ceil((nextReviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntil < 90;

                  return (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: c.surface2 }}>
                      <div>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {product.name}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
                          Due: {nextReviewDate.toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p style={{
                          color: isUrgent ? '#F59E0B' : c.text2,
                          fontSize: 14,
                          fontWeight: 700
                        }}>
                          {daysUntil} days
                        </p>
                        {isUrgent && (
                          <p style={{ color: '#F59E0B', fontSize: 9, marginTop: 1 }}>
                            Action needed
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TrCard>
          </PageSection>
        )}

        {tab === 'distribution' && (
          <PageSection label="Distribution Channels">
            <div className="space-y-3">
              {['App', 'Web Platform', 'API'].map((channel) => {
                const productCount = PRODUCTS.filter(p =>
                  p.distributionChannels.some(c => c.includes(channel))
                ).length;

                return (
                  <TrCard key={channel} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: c.primary + '15' }}>
                          <Activity size={18} color={c.primary} />
                        </div>
                        <div>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                            {channel}
                          </p>
                          <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
                            {productCount} products
                          </p>
                        </div>
                      </div>

                      <CheckCircle size={18} color="#10B981" />
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </PageSection>
        )}
      </PageContent>
    </PageLayout>
  );
}
