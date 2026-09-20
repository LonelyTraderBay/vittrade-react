/**
 * ══════════════════════════════════════════════════════════════
 *  CopyAuditLogPage — Phase 2: Compliance & Transparency
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Filterable event timeline (all copy actions)
 * - Trade reconciliation view (provider vs you)
 * - Slippage report generator
 * - Export audit logs (CSV/PDF/JSON)
 * 
 * Compliance (MiFID II Art. 58):
 * - Complete audit trail required
 * - 5-year retention minimum
 * - Tamper-proof logging
 * - Export capability for regulators
 * 
 * Guidelines:
 * - Reverse chronological order
 * - Filter by event type
 * - Search by keyword/ID
 * - Export with date range
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  FileText, Search, Filter, Download, Calendar, CheckCircle,
  AlertCircle, Activity, DollarSign, Settings, Shield,
  Clock, Eye, TrendingUp, TrendingDown
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

type EventType = 'all' | 'trade' | 'config' | 'risk' | 'system';
type ExportFormat = 'csv' | 'pdf' | 'json';

interface AuditEvent {
  id: string;
  type: 'trade' | 'config' | 'risk' | 'system';
  timestamp: string;
  title: string;
  description: string;
  metadata?: {
    pair?: string;
    side?: 'buy' | 'sell';
    providerPrice?: number;
    yourPrice?: number;
    slippage?: number;
    pnl?: number;
    oldValue?: string;
    newValue?: string;
  };
  severity?: 'info' | 'warning' | 'critical';
}

const MOCK_EVENTS: AuditEvent[] = [
  {
    id: 'evt-1',
    type: 'trade',
    timestamp: '2026-03-08 14:23:15',
    title: 'Trade Executed',
    description: 'BUY 0.05 BTC @ $67,835 (Provider: $67,800)',
    metadata: {
      pair: 'BTC/USDT',
      side: 'buy',
      providerPrice: 67800,
      yourPrice: 67835,
      slippage: 0.52,
    },
    severity: 'info',
  },
  {
    id: 'evt-2',
    type: 'risk',
    timestamp: '2026-03-08 14:15:42',
    title: 'Risk Alert Triggered',
    description: 'Copy approaching stop-loss: -8.5% (threshold: -10%)',
    severity: 'warning',
  },
  {
    id: 'evt-3',
    type: 'config',
    timestamp: '2026-03-08 10:30:22',
    title: 'Stop-Loss Updated',
    description: 'User adjusted stop-loss',
    metadata: {
      oldValue: '-15%',
      newValue: '-10%',
    },
    severity: 'info',
  },
  {
    id: 'evt-4',
    type: 'trade',
    timestamp: '2026-03-07 16:45:10',
    title: 'Position Closed',
    description: 'SELL 2 ETH @ $3,848 (P/L: +$45)',
    metadata: {
      pair: 'ETH/USDT',
      side: 'sell',
      providerPrice: 3850,
      yourPrice: 3848,
      slippage: 0.31,
      pnl: 45,
    },
    severity: 'info',
  },
  {
    id: 'evt-5',
    type: 'system',
    timestamp: '2026-03-05 09:00:00',
    title: 'Copy Activated',
    description: 'Cooling-off period completed, copy started',
    severity: 'info',
  },
  {
    id: 'evt-6',
    type: 'config',
    timestamp: '2026-03-04 14:30:00',
    title: 'Copy Configuration Created',
    description: 'Capital: $5,000 | Mode: Fixed 50% | SL: -10%',
    severity: 'info',
  },
  {
    id: 'evt-7',
    type: 'system',
    timestamp: '2026-03-04 14:25:00',
    title: 'Risk Assessment Completed',
    description: 'Score: 85/140 (Suitable) | Recommended allocation: 15%',
    severity: 'info',
  },
];

export function CopyAuditLogPage() {
  const { copyId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [filter, setFilter] = useState<EventType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const filteredEvents = MOCK_EVENTS.filter(event => {
    // Filter by type
    if (filter !== 'all' && event.type !== filter) return false;
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.metadata?.pair?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const getIcon = (type: AuditEvent['type']) => {
    switch (type) {
      case 'trade': return Activity;
      case 'config': return Settings;
      case 'risk': return AlertCircle;
      case 'system': return CheckCircle;
    }
  };

  const getColor = (type: AuditEvent['type'], severity?: string) => {
    if (severity === 'critical') return '#EF4444';
    if (severity === 'warning') return '#F59E0B';
    switch (type) {
      case 'trade': return '#3B82F6';
      case 'config': return '#8B5CF6';
      case 'risk': return '#EF4444';
      case 'system': return '#10B981';
    }
  };

  const handleExport = (format: ExportFormat) => {
    // TODO: Implement export logic
    console.log(`Exporting as ${format}...`);
    setShowExportModal(false);
    
    // Mock download
    alert(`Audit log exported as ${format.toUpperCase()}. In production, this would download a file.`);
  };

  return (
    <PageLayout>
      <Header 
        title="Audit Log" 
        back
        action={{
          icon: Download,
          onClick: () => setShowExportModal(true),
        }}
      />

      <PageContent gap="relaxed">
        {/* Compliance Notice */}
        <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
          <div className="flex items-start gap-2">
            <Shield size={14} color={c.primary} className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.primary, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                MiFID II Compliant Audit Trail
              </p>
              <p style={{ color: c.primary, fontSize: 9, lineHeight: 1.5 }}>
                Tất cả hành động được ghi log và lưu trữ 5 năm. Bạn có thể export bất cứ lúc nào.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} color={c.text3} className="absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm event, pair, ID..."
            className="w-full pl-10 pr-4 py-3 rounded-xl"
            style={{
              background: c.surface2,
              border: `1px solid ${c.border}`,
              color: c.text1,
              fontSize: 13,
            }}
          />
        </div>

        {/* Filter Tabs */}
        <TabBar
          variant="pill"
          tabs={[
            { id: 'all', label: 'Tất cả', badge: MOCK_EVENTS.length },
            { id: 'trade', label: 'Trades', badge: MOCK_EVENTS.filter(e => e.type === 'trade').length },
            { id: 'config', label: 'Config', badge: MOCK_EVENTS.filter(e => e.type === 'config').length },
            { id: 'risk', label: 'Risk', badge: MOCK_EVENTS.filter(e => e.type === 'risk').length },
            { id: 'system', label: 'System', badge: MOCK_EVENTS.filter(e => e.type === 'system').length },
          ]}
          active={filter}
          onChange={(id) => setFilter(id as EventType)}
        />

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText size={32} color={c.text3} className="mb-3" />
            <p style={{ color: c.text3, fontSize: 13, textAlign: 'center' }}>
              {searchQuery ? 'Không tìm thấy event phù hợp' : 'Chưa có event nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEvents.map(event => {
              const Icon = getIcon(event.type);
              const color = getColor(event.type, event.severity);
              
              return (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: color + '22' }}
                    >
                      <Icon size={18} color={color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 style={{ 
                            color: c.text1, 
                            fontSize: 13, 
                            fontWeight: 700,
                            marginBottom: 2,
                          }}>
                            {event.title}
                          </h4>
                          <p style={{ 
                            color: c.text2, 
                            fontSize: 11, 
                            lineHeight: 1.5,
                          }}>
                            {event.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Clock size={10} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: 10 }}>
                          {event.timestamp}
                        </span>
                        <span style={{ color: c.text3, fontSize: 10 }}>•</span>
                        <span 
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ 
                            background: color + '22',
                            color: color,
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        >
                          {event.type}
                        </span>
                      </div>

                      {/* Trade Metadata */}
                      {event.type === 'trade' && event.metadata && (
                        <div className="mt-3 p-2 rounded-lg" style={{ background: c.surface2 }}>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {event.metadata.providerPrice && (
                              <div>
                                <span style={{ color: c.text3, fontSize: 9 }}>Provider Price</span>
                                <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                                  ${event.metadata.providerPrice.toLocaleString()}
                                </p>
                              </div>
                            )}
                            {event.metadata.yourPrice && (
                              <div>
                                <span style={{ color: c.text3, fontSize: 9 }}>Your Price</span>
                                <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                                  ${event.metadata.yourPrice.toLocaleString()}
                                </p>
                              </div>
                            )}
                            {event.metadata.slippage !== undefined && (
                              <div>
                                <span style={{ color: c.text3, fontSize: 9 }}>Slippage</span>
                                <p style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>
                                  {event.metadata.slippage.toFixed(2)}%
                                </p>
                              </div>
                            )}
                            {event.metadata.pnl !== undefined && (
                              <div>
                                <span style={{ color: c.text3, fontSize: 9 }}>P/L</span>
                                <p style={{ 
                                  color: event.metadata.pnl >= 0 ? '#10B981' : '#EF4444',
                                  fontSize: 11,
                                  fontWeight: 600
                                }}>
                                  {event.metadata.pnl >= 0 ? '+' : ''}${event.metadata.pnl}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Config Metadata */}
                      {event.type === 'config' && event.metadata && (
                        <div className="mt-3 p-2 rounded-lg" style={{ background: c.surface2 }}>
                          <div className="flex items-center gap-2 text-xs">
                            <span style={{ color: c.text3, fontSize: 10 }}>
                              {event.metadata.oldValue} → {event.metadata.newValue}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        <PageSection label="Thống kê tổng quan" accentColor={c.primary}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl text-center" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Total Events</p>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{MOCK_EVENTS.length}</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Trades</p>
              <p style={{ color: '#3B82F6', fontSize: 18, fontWeight: 700 }}>
                {MOCK_EVENTS.filter(e => e.type === 'trade').length}
              </p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Config Changes</p>
              <p style={{ color: '#8B5CF6', fontSize: 18, fontWeight: 700 }}>
                {MOCK_EVENTS.filter(e => e.type === 'config').length}
              </p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Risk Alerts</p>
              <p style={{ color: '#EF4444', fontSize: 18, fontWeight: 700 }}>
                {MOCK_EVENTS.filter(e => e.type === 'risk').length}
              </p>
            </div>
          </div>
        </PageSection>
      </PageContent>

      {/* Export Modal */}
      {showExportModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowExportModal(false)}
        >
          <div 
            className="w-full max-w-md rounded-t-3xl p-6"
            style={{ background: c.bg }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Export Audit Log
            </h3>
            <p style={{ color: c.text3, fontSize: 12, marginBottom: 16 }}>
              Chọn định dạng export
            </p>

            <div className="space-y-2 mb-4">
              {[
                { format: 'csv' as const, label: 'CSV', desc: 'Excel-compatible spreadsheet' },
                { format: 'pdf' as const, label: 'PDF', desc: 'Printable document' },
                { format: 'json' as const, label: 'JSON', desc: 'Raw data for developers' },
              ].map(item => (
                <button
                  key={item.format}
                  onClick={() => handleExport(item.format)}
                  className="w-full p-3 rounded-xl text-left flex items-center justify-between"
                  style={{ background: c.surface2, border: `1px solid ${c.border}` }}
                >
                  <div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      {item.label}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {item.desc}
                    </p>
                  </div>
                  <Download size={16} color={c.text3} />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="w-full py-3 rounded-xl"
              style={{
                background: c.surface2,
                color: c.text1,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
