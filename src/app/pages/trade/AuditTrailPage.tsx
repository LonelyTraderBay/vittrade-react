/**
 * ══════════════════════════════════════════════════════════════
 *  AuditTrailPage — Phase 4 Sprint 4 Day 9-10
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Complete audit trail of all copy trading actions
 * - MiFID II record-keeping requirement (5+ years)
 * - Forensic-level detail for regulatory inspection
 * - Export capabilities for compliance
 * 
 * Compliance:
 * - MiFID II Art. 16(6): Record-keeping obligations
 * - Minimum 5 years retention (7 years for UK)
 * - Must record: orders, decisions, advice, conflicts
 */

import React, { useState } from 'react';
import { FileText, Download, Filter, Search, Clock, User, TrendingUp } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

type TabType = 'all' | 'trades' | 'compliance' | 'client';

interface AuditEntry {
  id: string;
  timestamp: string;
  category: 'trade' | 'compliance' | 'client-action' | 'system';
  action: string;
  details: string;
  user?: string;
  ipAddress?: string;
}

const AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 'AUD-2026-001234',
    timestamp: '2026-03-08T14:23:15Z',
    category: 'trade',
    action: 'Order Executed',
    details: 'BUY 0.5 BTC @ $65,234.50 (Mirror copy from Provider #123)',
    user: 'user@example.com',
    ipAddress: '192.168.1.1',
  },
  {
    id: 'AUD-2026-001233',
    timestamp: '2026-03-08T14:20:00Z',
    category: 'compliance',
    action: 'Suitability Assessment Passed',
    details: 'Risk tolerance: High, Knowledge: Advanced, Portfolio: €50k+',
    user: 'user@example.com',
    ipAddress: '192.168.1.1',
  },
  {
    id: 'AUD-2026-001232',
    timestamp: '2026-03-08T14:15:30Z',
    category: 'client-action',
    action: 'Copy Trading Activated',
    details: 'Provider #123 (Conservative Crypto) - Allocation: 30%',
    user: 'user@example.com',
    ipAddress: '192.168.1.1',
  },
];

export function AuditTrailPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');

  const TABS = [
    { id: 'all' as TabType, label: 'All Events' },
    { id: 'trades' as TabType, label: 'Trades' },
    { id: 'compliance' as TabType, label: 'Compliance' },
    { id: 'client' as TabType, label: 'Client Actions' },
  ];

  const CATEGORY_CONFIG = {
    trade: { color: '#10B981', label: 'Trade', icon: TrendingUp },
    compliance: { color: '#3B82F6', label: 'Compliance', icon: FileText },
    'client-action': { color: '#F59E0B', label: 'Client Action', icon: User },
    system: { color: '#6B7280', label: 'System', icon: Clock },
  };

  return (
    <PageLayout>
      <Header
        title="Audit Trail"
        subtitle="MiFID II Record-Keeping"
        back
        action={{
          icon: Download,
          onClick: () => console.log('Export audit log'),
        }}
      />

      <PageContent gap="relaxed">
        {/* Compliance Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.successBg, border: `1px solid ${c.successBorder}` }}>
          <FileText size={16} color={c.successText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.successText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Complete Record-Keeping
            </p>
            <p style={{ color: c.successText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              All actions are logged for 7 years as required by MiFID II. This audit trail is available for regulatory inspection.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Total Events</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {AUDIT_ENTRIES.length}
            </p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Today</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>12</p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Retention</p>
            <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700, marginTop: 4 }}>7yr</p>
          </TrCard>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} color={c.text3} className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full h-10 pl-10 pr-3 rounded-xl outline-none text-xs"
              style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.border}` }}
            />
          </div>
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <Filter size={16} color={c.text3} />
          </button>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Audit Entries */}
        <PageSection label="Audit Log">
          <div className="space-y-2">
            {AUDIT_ENTRIES.map((entry) => {
              const categoryConfig = CATEGORY_CONFIG[entry.category];
              const Icon = categoryConfig.icon;

              return (
                <TrCard key={entry.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: categoryConfig.color + '15' }}>
                      <Icon size={18} color={categoryConfig.color} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {entry.action}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold"
                          style={{ background: categoryConfig.color + '15', color: categoryConfig.color }}>
                          {categoryConfig.label}
                        </span>
                      </div>

                      <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>
                        {entry.details}
                      </p>

                      <div className="flex items-center gap-3">
                        <span style={{ color: c.text3, fontSize: 9 }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        {entry.user && (
                          <span style={{ color: c.text3, fontSize: 9 }}>
                            • {entry.user}
                          </span>
                        )}
                        {entry.ipAddress && (
                          <span style={{ color: c.text3, fontSize: 9 }}>
                            • {entry.ipAddress}
                          </span>
                        )}
                      </div>

                      <p style={{ color: c.text3, fontSize: 8, marginTop: 2 }}>
                        ID: {entry.id}
                      </p>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Export Options */}
        <div className="grid grid-cols-2 gap-3">
          <button
            className="rounded-xl flex items-center justify-center gap-2 transition-all"
            style={{
              background: c.surface2,
              color: c.text1,
              height: 40,
              fontWeight: 600,
              fontSize: 12,
              border: `1px solid ${c.border}`,
            }}>
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            className="rounded-xl flex items-center justify-center gap-2 transition-all"
            style={{
              background: c.surface2,
              color: c.text1,
              height: 40,
              fontWeight: 600,
              fontSize: 12,
              border: `1px solid ${c.border}`,
            }}>
            <Download size={14} />
            <span>PDF</span>
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}
