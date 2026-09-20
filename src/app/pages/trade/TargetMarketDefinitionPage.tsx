/**
 * ══════════════════════════════════════════════════════════════
 *  TargetMarketDefinitionPage — Phase 4 Sprint 2 Day 5-6
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Detailed target market definition for a specific product
 * - Client categorization suitability
 * - Risk/return profile matching
 * - Distribution strategy
 * - Negative target market specification
 * 
 * Compliance:
 * - MiFID II Product Governance
 * - ESMA Guidelines target market criteria
 * - 6 key dimensions: Client type, Knowledge, Financial situation,
 *   Risk tolerance, Objectives, Needs
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Target, Users, TrendingUp, Shield, AlertCircle,
  CheckCircle, Info, ChevronLeft
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

export function TargetMarketDefinitionPage() {
  const c = useThemeColors();
  const { productId } = useParams();

  const targetDimensions = [
    {
      category: 'Client Type',
      positive: ['Retail (high knowledge)', 'Professional clients'],
      negative: ['Inexperienced retail'],
    },
    {
      category: 'Knowledge & Experience',
      positive: ['Advanced derivatives knowledge', 'Copy trading experience'],
      negative: ['No investment knowledge', 'First-time investors'],
    },
    {
      category: 'Financial Situation',
      positive: ['Portfolio > €10,000', 'Can afford to lose capital'],
      negative: ['Portfolio < €5,000', 'Dependent on capital'],
    },
    {
      category: 'Risk Tolerance',
      positive: ['High risk appetite', 'Comfortable with volatility'],
      negative: ['Risk-averse', 'Capital preservation focus'],
    },
    {
      category: 'Objectives',
      positive: ['Capital growth', 'Medium-long term (6+ months)'],
      negative: ['Capital preservation', 'Short-term (<3 months)'],
    },
    {
      category: 'Distribution Channel',
      positive: ['App', 'Web Platform', 'API'],
      negative: ['Offline', 'Telephone'],
    },
  ];

  return (
    <PageLayout>
      <Header title="Target Market Definition" subtitle="Mirror Copy Trading" back />

      <PageContent gap="relaxed">
        {/* Summary */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: c.primary + '15' }}>
              <Target size={22} color={c.primary} />
            </div>

            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                Mirror Copy Trading
              </p>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                High-risk product requiring advanced knowledge and significant capital.
              </p>
            </div>
          </div>
        </TrCard>

        {/* Target Market Dimensions */}
        <PageSection label="Target Market Criteria">
          <div className="space-y-3">
            {targetDimensions.map((dim, idx) => (
              <TrCard key={idx} className="p-4">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                  {dim.category}
                </p>

                <div className="space-y-2">
                  <div>
                    <p style={{ color: '#10B981', fontSize: 10, marginBottom: 1.5 }}>
                      ✓ Suitable for:
                    </p>
                    {dim.positive.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1">
                        <CheckCircle size={12} color="#10B981" className="shrink-0 mt-0.5" />
                        <span style={{ color: c.text2, fontSize: 11 }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p style={{ color: '#EF4444', fontSize: 10, marginBottom: 1.5 }}>
                      ✗ Not suitable for:
                    </p>
                    {dim.negative.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1">
                        <AlertCircle size={12} color="#EF4444" className="shrink-0 mt-0.5" />
                        <span style={{ color: c.text2, fontSize: 11 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>
      </PageContent>
    </PageLayout>
  );
}
