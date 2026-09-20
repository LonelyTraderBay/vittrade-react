/**
 * ══════════════════════════════════════════════════════════════
 *  KIDGeneratorPage — Phase 4 Sprint 3 Day 7-8
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Generate Key Information Document (KID)
 * - PRIIPs mandatory document (3 pages max)
 * - Contains: objectives, costs, risks, scenarios
 * - Must be provided BEFORE investment
 * 
 * Compliance:
 * - PRIIPs Regulation: KID mandatory
 * - Max 3 A4 pages
 * - Standardized format
 * - 7 key sections
 */

import React from 'react';
import { FileText, Download, Eye, Shield, Info, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

export function KIDGeneratorPage() {
  const c = useThemeColors();

  const kidSections = [
    { icon: Info, title: 'Product Overview', status: 'complete' },
    { icon: Target, title: 'Investment Objectives', status: 'complete' },
    { icon: AlertTriangle, title: 'Risk & Reward Profile', status: 'complete' },
    { icon: BarChart3, title: 'Performance Scenarios', status: 'complete' },
    { icon: DollarSign, title: 'Costs', status: 'complete' },
    { icon: Clock, title: 'Holding Period', status: 'complete' },
    { icon: HelpCircle, title: 'Additional Information', status: 'complete' },
  ];

  return (
    <PageLayout>
      <Header
        title="Key Information Document"
        subtitle="PRIIPs KID"
        back
        action={{
          icon: Download,
          onClick: () => console.log('Download KID PDF'),
        }}
      />

      <PageContent gap="relaxed">
        {/* Regulatory Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.infoBg, border: `1px solid ${c.infoBorder}` }}>
          <Shield size={16} color={c.infoText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.infoText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Mandatory PRIIPs Document
            </p>
            <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              This Key Information Document must be provided before you invest. It contains essential information in a standardized format (max 3 pages).
            </p>
          </div>
        </div>

        {/* KID Preview */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: c.primary + '15' }}>
              <FileText size={28} color={c.primary} />
            </div>

            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                Mirror Copy Trading - KID
              </p>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                Last updated: March 8, 2026 • Version 2.1
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 9 }}>Document Type</p>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                PRIIPs KID
              </p>
            </div>

            <div className="rounded-lg p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 9 }}>Pages</p>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                3 / 3
              </p>
            </div>
          </div>
        </TrCard>

        {/* KID Sections */}
        <PageSection label="Document Sections">
          <div className="space-y-2">
            {kidSections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <TrCard key={idx} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: c.primary + '15' }}>
                      <Icon size={18} color={c.primary} />
                    </div>

                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        {section.title}
                      </p>
                    </div>

                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: '#10B981' + '15' }}>
                      <CheckCircle size={14} color="#10B981" />
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            className="rounded-xl flex items-center justify-center gap-2 transition-all"
            style={{
              background: c.surface2,
              color: c.text1,
              height: 44,
              fontWeight: 600,
              fontSize: 13,
              border: `1px solid ${c.border}`,
            }}>
            <Eye size={16} />
            <span>Preview KID</span>
          </button>

          <button
            className="rounded-xl flex items-center justify-center gap-2 transition-all"
            style={{
              background: c.primary,
              color: '#fff',
              height: 44,
              fontWeight: 600,
              fontSize: 13,
            }}>
            <Download size={16} />
            <span>Download PDF</span>
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}

// Missing imports
import { Target, DollarSign, Clock, HelpCircle, CheckCircle } from 'lucide-react';
