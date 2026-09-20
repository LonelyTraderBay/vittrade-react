/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadEventLogPage — Event Log Export to Clipboard (Phase 4.9)
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs/Filters
 *  Features: Filterable event log, level-based color coding, tag chips,
 *            detail expansion, multi-format export (Text/JSON/CSV),
 *            copy to clipboard, selection for partial export, search
 */

import React, { useState, useMemo, useCallback } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Copy, Check, Search, Filter, ChevronDown, ChevronUp,
  X, Info, AlertTriangle, CheckCircle, AlertCircle,
  Bug, Zap, FileText, FileJson, Table,
  Clipboard, ExternalLink, Hash,
} from 'lucide-react';
import {
  generateMockEventLog, formatEventLogForClipboard,
  formatEventLogAsJSON, formatEventLogAsCSV,
  type EventLogEntry, type EventLogLevel,
} from './launchpadData';

const LEVEL_CONFIG: Record<EventLogLevel, { label: string; color: string; bg: string; icon: typeof Info }> = {
  info: { label: 'Info', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: Info },
  success: { label: 'Success', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
  warning: { label: 'Warning', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: AlertTriangle },
  error: { label: 'Error', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: AlertCircle },
  debug: { label: 'Debug', color: '#8B95B3', bg: 'rgba(139,149,179,0.1)', icon: Bug },
  tx: { label: 'Transaction', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', icon: Zap },
};

type ExportFormat = 'text' | 'json' | 'csv';

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: typeof FileText }[] = [
  { value: 'text', label: 'Text', icon: FileText },
  { value: 'json', label: 'JSON', icon: FileJson },
  { value: 'csv', label: 'CSV', icon: Table },
];

export function LaunchpadEventLogPage() {
  const c = useThemeColors();

  const [allEvents] = useState<EventLogEntry[]>(() => generateMockEventLog());
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<EventLogLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<ExportFormat>('text');
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const sources = useMemo(() => {
    const s = new Set(allEvents.map(e => e.source));
    return ['all', ...Array.from(s)];
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      if (levelFilter !== 'all' && e.level !== levelFilter) return false;
      if (sourceFilter !== 'all' && e.source !== sourceFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return e.message.toLowerCase().includes(q)
          || e.source.toLowerCase().includes(q)
          || (e.details || '').toLowerCase().includes(q)
          || e.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [allEvents, levelFilter, sourceFilter, searchQuery]);

  const toggleSelectEvent = (id: string) => {
    setSelectedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filteredEvents.map(e => e.id)));
    }
  };

  const eventsToExport = useMemo(() => {
    if (selectedEvents.size === 0) return filteredEvents;
    return filteredEvents.filter(e => selectedEvents.has(e.id));
  }, [filteredEvents, selectedEvents]);

  const handleCopyToClipboard = useCallback(async () => {
    let content: string;
    switch (exportFormat) {
      case 'json': content = formatEventLogAsJSON(eventsToExport); break;
      case 'csv': content = formatEventLogAsCSV(eventsToExport); break;
      default: content = formatEventLogForClipboard(eventsToExport);
    }
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [exportFormat, eventsToExport]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allEvents.length };
    allEvents.forEach(e => { counts[e.level] = (counts[e.level] || 0) + 1; });
    return counts;
  }, [allEvents]);

  return (
    <PageLayout>
      {/* Export sheet */}
      {showExportSheet && (
        <ExportSheet
          format={exportFormat}
          setFormat={setExportFormat}
          count={eventsToExport.length}
          onCopy={handleCopyToClipboard}
          copied={copied}
          onClose={() => setShowExportSheet(false)}
        />
      )}

      <Header title="Event Log" back />

      <PageContent gap="default">
        {/* Search bar */}
        <div className="relative">
          <Search size={16} color={c.text3} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tim kiem event..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl"
            style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}` }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} color={c.text3} />
            </button>
          )}
        </div>

        {/* Level filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['all', 'info', 'success', 'warning', 'error', 'debug', 'tx'] as const).map(lv => {
            const isActive = levelFilter === lv;
            const config = lv === 'all' ? null : LEVEL_CONFIG[lv];
            const color = config?.color || '#6366F1';
            return (
              <button key={lv}
                onClick={() => setLevelFilter(lv)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full whitespace-nowrap"
                style={{
                  background: isActive ? (config?.bg || 'rgba(99,102,241,0.1)') : c.surface2,
                  border: `1px solid ${isActive ? color + '30' : 'transparent'}`,
                  color: isActive ? color : c.text3,
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                }}>
                {lv === 'all' ? 'Tat ca' : config?.label}
                <span style={{ fontSize: 9, opacity: 0.7 }}>({levelCounts[lv] || 0})</span>
              </button>
            );
          })}
        </div>

        {/* Source filter + actions bar */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <Filter size={12} color={c.text3} />
            <span style={{ color: c.text2, fontSize: 11 }}>
              {sourceFilter === 'all' ? 'Nguon' : sourceFilter}
            </span>
            <ChevronDown size={10} color={c.text3} />
          </button>

          <div className="flex-1" />

          <button onClick={toggleSelectAll}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
            style={{ background: c.surface2, fontSize: 10, color: c.text3 }}>
            {selectedEvents.size === filteredEvents.length ? 'Bỏ chọn' : 'Chọn tất cả'}
          </button>

          <button onClick={() => setShowExportSheet(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Clipboard size={12} color="#6366F1" />
            <span style={{ color: '#6366F1', fontSize: 11, fontWeight: 600 }}>
              Export ({eventsToExport.length})
            </span>
          </button>
        </div>

        {/* Source filter dropdown */}
        {showFilters && (
          <TrCard variant="inner" className="p-3">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 6 }}>Loc theo nguon</p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map(s => (
                <button key={s}
                  onClick={() => { setSourceFilter(s); setShowFilters(false); }}
                  className="px-3 py-1.5 rounded-lg"
                  style={{
                    background: sourceFilter === s ? 'rgba(99,102,241,0.1)' : c.surface,
                    border: `1px solid ${sourceFilter === s ? 'rgba(99,102,241,0.3)' : c.border}`,
                    color: sourceFilter === s ? '#6366F1' : c.text2,
                    fontSize: 11, fontWeight: sourceFilter === s ? 600 : 400,
                  }}>
                  {s === 'all' ? 'Tat ca' : s}
                </button>
              ))}
            </div>
          </TrCard>
        )}

        {/* Event list */}
        <div className="flex flex-col gap-2">
          {filteredEvents.map(event => {
            const config = LEVEL_CONFIG[event.level];
            const Icon = config.icon;
            const isExpanded = expandedEvent === event.id;
            const isSelected = selectedEvents.has(event.id);
            const time = new Date(event.timestamp);
            const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;

            return (
              <TrCard key={event.id} className="overflow-hidden"
                style={{ border: isSelected ? `1.5px solid ${config.color}40` : undefined }}>
                <div className="flex items-start gap-3 p-3">
                  {/* Checkbox */}
                  <button onClick={() => toggleSelectEvent(event.id)} className="mt-0.5 shrink-0">
                    <div className="w-4 h-4 rounded flex items-center justify-center"
                      style={{
                        background: isSelected ? config.color : 'transparent',
                        border: `1.5px solid ${isSelected ? config.color : c.borderSolid}`,
                      }}>
                      {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                  </button>

                  {/* Level icon */}
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: config.bg }}>
                    <Icon size={13} color={config.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-1.5 py-px rounded" style={{ background: config.bg, color: config.color, fontSize: 8, fontWeight: 700 }}>
                        {config.label.toUpperCase()}
                      </span>
                      <span style={{ color: c.text3, fontSize: 9 }}>{event.source}</span>
                      <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace', marginLeft: 'auto' }}>{timeStr}</span>
                    </div>
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
                      {event.message}
                    </p>

                    {/* Tags */}
                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {event.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-px rounded"
                            style={{ background: c.surface2, color: c.text3, fontSize: 8 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expand toggle */}
                  <button onClick={() => setExpandedEvent(isExpanded ? null : event.id)} className="shrink-0 mt-0.5">
                    {isExpanded
                      ? <ChevronUp size={14} color={c.text3} />
                      : <ChevronDown size={14} color={c.text3} />}
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0" style={{ borderTop: `1px solid ${c.border}` }}>
                    <div className="flex flex-col gap-0 mt-2">
                      {event.details && (
                        <DetailRow label="Chi tiet" value={event.details} />
                      )}
                      {event.txHash && (
                        <DetailRow label="TxHash" value={event.txHash} mono action={
                          <button className="p-1"><ExternalLink size={10} color="#3B82F6" /></button>
                        } />
                      )}
                      {event.chain && (
                        <DetailRow label="Chain" value={event.chain} />
                      )}
                      {event.contractAddress && (
                        <DetailRow label="Contract" value={event.contractAddress} mono />
                      )}
                      {event.gasUsed && (
                        <DetailRow label="Gas used" value={event.gasUsed} mono />
                      )}
                      {event.blockNumber && (
                        <DetailRow label="Block" value={`#${event.blockNumber.toLocaleString()}`} mono action={
                          <button className="p-1"><Hash size={10} color="#8B5CF6" /></button>
                        } />
                      )}
                    </div>
                  </div>
                )}
              </TrCard>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <TrCard className="p-8 text-center">
            <Search size={32} color={c.text3} className="mx-auto mb-3 opacity-40" />
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Khong tim thay event</p>
            <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>Thu thay doi bo loc hoac tu khoa tim kiem</p>
          </TrCard>
        )}

        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   DetailRow — key-value row in expanded event
   ═══════════════════════════════════════════════════════════ */

function DetailRow({ label, value, mono, action }: {
  label: string; value: string; mono?: boolean; action?: React.ReactNode;
}) {
  const c = useThemeColors();
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
      <span style={{ color: c.text3, fontSize: 10 }}>{label}</span>
      <div className="flex items-center gap-1">
        <span style={{
          color: c.text1, fontSize: 10, fontWeight: 500,
          fontFamily: mono ? 'monospace' : undefined,
          maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value}
        </span>
        {action}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ExportSheet — format selection + copy to clipboard
   ══════════════════════════════════════════════════════════ */

function ExportSheet({ format, setFormat, count, onCopy, copied, onClose }: {
  format: ExportFormat; setFormat: (f: ExportFormat) => void;
  count: number; onCopy: () => void; copied: boolean; onClose: () => void;
}) {
  const c = useThemeColors();

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Export Event Log</h3>
            <button onClick={onClose}><X size={20} color={c.text3} /></button>
          </div>

          {/* Count */}
          <div className="text-center py-2">
            <p style={{ color: c.text1, fontSize: 24, fontWeight: 800, fontFamily: 'monospace' }}>{count}</p>
            <p style={{ color: c.text3, fontSize: 11 }}>events se duoc export</p>
          </div>

          {/* Format selector */}
          <div>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 8 }}>Dinh dang</p>
            <div className="flex gap-2">
              {FORMAT_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isActive = format === opt.value;
                return (
                  <button key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl"
                    style={{
                      background: isActive ? 'rgba(99,102,241,0.1)' : c.surface2,
                      border: `1.5px solid ${isActive ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                    }}>
                    <Icon size={20} color={isActive ? '#6366F1' : c.text3} />
                    <span style={{ color: isActive ? '#6366F1' : c.text2, fontSize: 12, fontWeight: isActive ? 700 : 400 }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview snippet */}
          <div className="rounded-xl p-3 overflow-x-auto" style={{ background: c.surface2, maxHeight: 100 }}>
            <pre style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {format === 'json' && '{\n  "exported": "...",\n  "count": ' + count + ',\n  "entries": [...]\n}'}
              {format === 'csv' && 'timestamp,level,source,message,...\n2026-03-07T...,info,Bridge,...'}
              {format === 'text' && '=== Launchpad Event Log ===\n[...] [INFO] Bridge\n  Bridge transaction initiated'}
            </pre>
          </div>

          {/* Copy button */}
          <CTAButton onClick={onCopy} variant={copied ? 'success' : 'primary'}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Da copy vao clipboard!' : `Copy ${count} events (${format.toUpperCase()})`}
          </CTAButton>

          {/* Info */}
          <div className="rounded-xl p-2.5 flex items-start gap-2"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <Info size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
              Noi dung se duoc copy vao clipboard. Ban co the paste vao bat ky text editor nao.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}