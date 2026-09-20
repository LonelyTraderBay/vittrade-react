/**
 * ══════════════════════════════════════════════════════════════
 *  CASSReconciliationPage — Phase 4 Sprint 2 Day 9-10
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Daily CASS reconciliation statements
 * - Client money vs. bank balance matching
 * - Discrepancy alerts & resolution
 * - Historical reconciliation records
 * - Regulatory audit trail
 * 
 * Compliance:
 * - CASS 7.15: Daily reconciliation mandatory
 * - Discrepancies must be identified & resolved
 * - Records retained for 6 years (UK)
 * - External audit requirements
 */

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Calendar, Download, TrendingUp } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd } from '../../data/formatNumber';

type TabType = 'recent' | 'history';

interface ReconciliationRecord {
  date: string;
  clientLedger: number;
  bankBalance: number;
  difference: number;
  status: 'matched' | 'discrepancy-resolved' | 'discrepancy';
  notes?: string;
}

const RECORDS: ReconciliationRecord[] = [
  { date: '2026-03-08', clientLedger: 45230.50, bankBalance: 45230.50, difference: 0, status: 'matched' },
  { date: '2026-03-07', clientLedger: 44890.25, bankBalance: 44890.25, difference: 0, status: 'matched' },
  { date: '2026-03-06', clientLedger: 43500.00, bankBalance: 43520.00, difference: 20, status: 'discrepancy-resolved', notes: 'Pending deposit cleared' },
  { date: '2026-03-05', clientLedger: 42100.75, bankBalance: 42100.75, difference: 0, status: 'matched' },
];

export function CASSReconciliationPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<TabType>('recent');

  const TABS = [
    { id: 'recent' as TabType, label: 'Recent (7 Days)' },
    { id: 'history' as TabType, label: 'History' },
  ];

  const STATUS_CONFIG = {
    matched: { color: '#10B981', label: 'Matched', icon: CheckCircle },
    'discrepancy-resolved': { color: '#F59E0B', label: 'Resolved', icon: CheckCircle },
    discrepancy: { color: '#EF4444', label: 'Discrepancy', icon: AlertTriangle },
  };

  return (
    <PageLayout>
      <Header title="CASS Reconciliation" subtitle="Daily Client Money Matching" back />

      <PageContent gap="relaxed">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Reconciled</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {RECORDS.filter(r => r.status === 'matched').length}
            </p>
            <p style={{ color: '#10B981', fontSize: 9, marginTop: 2 }}>Last 7 days</p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Resolved</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {RECORDS.filter(r => r.status === 'discrepancy-resolved').length}
            </p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>Discrepancies</p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Outstanding</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>0</p>
            <p style={{ color: '#10B981', fontSize: 9, marginTop: 2 }}>None</p>
          </TrCard>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Records */}
        <PageSection label="Reconciliation Records">
          <div className="space-y-3">
            {RECORDS.map((record, idx) => {
              const statusCfg = STATUS_CONFIG[record.status];
              const StatusIcon = statusCfg.icon;

              return (
                <TrCard key={idx} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: statusCfg.color + '15' }}>
                      <StatusIcon size={18} color={statusCfg.color} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {new Date(record.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold"
                          style={{ background: statusCfg.color + '15', color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                      </div>

                      {record.notes && (
                        <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Client Ledger</p>
                      <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                        {fmtUsd(record.clientLedger)}
                      </p>
                    </div>

                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Bank Balance</p>
                      <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                        {fmtUsd(record.bankBalance)}
                      </p>
                    </div>

                    <div className="rounded-lg p-2" style={{
                      background: record.difference === 0 ? '#10B981' + '15' : statusCfg.color + '15'
                    }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Difference</p>
                      <p style={{
                        color: record.difference === 0 ? '#10B981' : statusCfg.color,
                        fontSize: 11,
                        fontWeight: 700,
                        marginTop: 1
                      }}>
                        {fmtUsd(Math.abs(record.difference))}
                      </p>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Export */}
        <button
          className="w-full rounded-xl flex items-center justify-center gap-2 transition-all"
          style={{
            background: c.surface2,
            color: c.text1,
            height: 44,
            fontWeight: 600,
            fontSize: 13,
            border: `1px solid ${c.border}`,
          }}>
          <Download size={16} />
          <span>Export Reconciliation Report (CSV)</span>
        </button>
      </PageContent>
    </PageLayout>
  );
}
