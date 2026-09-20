/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadWebhooksPage — Contract Event Subscriptions (Phase 4.10)
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  Features: Webhook subscription list, create/edit subscription,
 *            delivery history, event type picker, status management,
 *            retry policy config, filter builder
 */

import React, { useState, useMemo } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Webhook, Plus, Pause, Play, CheckCircle,
  XCircle, Clock, ChevronDown, ChevronUp, Copy, Check,
  Zap, Trash2,
  Info, X,
} from 'lucide-react';
import {
  loadWebhookSubs, saveWebhookSubs,
  ALL_WEBHOOK_EVENTS, MOCK_WEBHOOK_DELIVERIES,
  type WebhookSubscription, type WebhookEventType,
} from './launchpadData';

const TABS = ['subscriptions', 'deliveries'];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: '#10B981', icon: CheckCircle },
  paused: { label: 'Paused', color: '#F59E0B', icon: Pause },
  error: { label: 'Error', color: '#EF4444', icon: XCircle },
  pending: { label: 'Pending', color: '#8B95B3', icon: Clock },
};

const DELIVERY_STATUS: Record<string, { label: string; color: string }> = {
  delivered: { label: 'Delivered', color: '#10B981' },
  failed: { label: 'Failed', color: '#EF4444' },
  retrying: { label: 'Retrying', color: '#F59E0B' },
  pending: { label: 'Pending', color: '#8B95B3' },
};

export function LaunchpadWebhooksPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState('subscriptions');
  const [subs, setSubs] = useState<WebhookSubscription[]>(() => loadWebhookSubs());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const deliveries = MOCK_WEBHOOK_DELIVERIES;

  const stats = useMemo(() => ({
    total: subs.length,
    active: subs.filter(s => s.status === 'active').length,
    errors: subs.filter(s => s.status === 'error').length,
    totalDelivered: deliveries.filter(d => d.status === 'delivered').length,
  }), [subs, deliveries]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const toggleStatus = (id: string) => {
    const updated = subs.map(s => {
      if (s.id !== id) return s;
      return { ...s, status: (s.status === 'active' ? 'paused' : 'active') as WebhookSubscription['status'] };
    });
    setSubs(updated);
    saveWebhookSubs(updated);
  };

  const deleteSub = (id: string) => {
    const updated = subs.filter(s => s.id !== id);
    setSubs(updated);
    saveWebhookSubs(updated);
  };

  return (
    <PageLayout>
      <Header title="Webhooks" back />

      {/* Stats bar */}
      <div className="px-5 pt-2 pb-1">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Tong', value: stats.total, color: '#6366F1' },
            { label: 'Active', value: stats.active, color: '#10B981' },
            { label: 'Errors', value: stats.errors, color: '#EF4444' },
            { label: 'Delivered', value: stats.totalDelivered, color: '#3B82F6' },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-2 py-2 text-center"
              style={{ background: s.color + '08' }}>
              <p style={{ color: s.color, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>{s.value}</p>
              <p style={{ color: c.text3, fontSize: 9 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'subscriptions' && (
          <>
            {/* Create button */}
            <button onClick={() => setShowCreate(true)}
              className="w-full rounded-2xl p-3 flex items-center gap-3 hover:opacity-90 transition-opacity active:scale-[0.98]"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px dashed rgba(99,102,241,0.3)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.12)' }}>
                <Plus size={18} color="#6366F1" />
              </div>
              <div className="text-left">
                <p style={{ color: '#6366F1', fontSize: 13, fontWeight: 700 }}>Tao webhook moi</p>
                <p style={{ color: c.text3, fontSize: 11 }}>Dang ky nhan event tu smart contract</p>
              </div>
            </button>

            {/* Subscription list */}
            <PageSection label="Active Subscriptions" accentColor="#10B981">
              <div className="flex flex-col gap-2">
                {subs.map(sub => {
                  const statusCfg = STATUS_CONFIG[sub.status];
                  const StatusIcon = statusCfg.icon;
                  const isExpanded = expandedId === sub.id;

                  return (
                    <TrCard key={sub.id} className="overflow-hidden"
                      style={{ borderLeft: `3px solid ${statusCfg.color}` }}>
                      <button className="w-full p-3 text-left" onClick={() => setExpandedId(isExpanded ? null : sub.id)}>
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: sub.chainColor + '15' }}>
                            <Webhook size={16} color={sub.chainColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }} className="truncate">
                                {sub.label}
                              </span>
                              <span className="flex items-center gap-0.5 px-1.5 py-px rounded shrink-0"
                                style={{ background: statusCfg.color + '15', color: statusCfg.color, fontSize: 9, fontWeight: 600 }}>
                                <StatusIcon size={8} />
                                {statusCfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-px rounded" style={{ background: sub.chainColor + '12', color: sub.chainColor, fontSize: 9, fontWeight: 600 }}>
                                {sub.chain}
                              </span>
                              <span style={{ color: c.text3, fontSize: 10 }}>
                                {sub.eventTypes.length} events
                              </span>
                              <span style={{ color: c.text3, fontSize: 10 }}>
                                {sub.triggerCount} triggers
                              </span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={14} color={c.text3} /> : <ChevronDown size={14} color={c.text3} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3" style={{ borderTop: `1px solid ${c.border}` }}>
                          {/* Event types */}
                          <div className="mt-2 mb-2">
                            <p style={{ color: c.text3, fontSize: 9, marginBottom: 4 }}>Events</p>
                            <div className="flex flex-wrap gap-1">
                              {sub.eventTypes.map(et => {
                                const evtCfg = ALL_WEBHOOK_EVENTS.find(e => e.type === et);
                                return (
                                  <span key={et} className="px-2 py-0.5 rounded-md"
                                    style={{ background: (evtCfg?.color || '#8B95B3') + '12', color: evtCfg?.color || c.text2, fontSize: 10, fontWeight: 600 }}>
                                    {et}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-col gap-0 mb-2">
                            {[
                              { label: 'URL', value: sub.webhookUrl, copyable: sub.webhookUrl },
                              { label: 'Contract', value: sub.contractAddress.slice(0, 10) + '...' + sub.contractAddress.slice(-4), copyable: sub.contractAddress },
                              { label: 'Retry', value: `${sub.retryPolicy} (max ${sub.maxRetries})` },
                              { label: 'Created', value: sub.createdAt },
                              ...(sub.lastTriggered ? [{ label: 'Last triggered', value: sub.lastTriggered }] : []),
                              ...(sub.lastError ? [{ label: 'Last error', value: sub.lastError }] : []),
                            ].map(row => (
                              <div key={row.label} className="flex items-center justify-between py-1.5"
                                style={{ borderBottom: `1px solid ${c.border}` }}>
                                <span style={{ color: c.text3, fontSize: 10 }}>{row.label}</span>
                                <div className="flex items-center gap-1 max-w-[60%]">
                                  <span className="truncate" style={{
                                    color: row.label === 'Last error' ? '#EF4444' : c.text1,
                                    fontSize: 10, fontWeight: 600,
                                    fontFamily: row.copyable ? 'monospace' : undefined,
                                  }}>
                                    {row.value}
                                  </span>
                                  {row.copyable && (
                                    <button onClick={() => handleCopy(row.copyable!, row.label)} className="p-0.5 shrink-0">
                                      {copiedField === row.label
                                        ? <Check size={10} color="#10B981" />
                                        : <Copy size={10} color={c.text3} />}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleStatus(sub.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 hover:opacity-90 transition-opacity"
                              style={{
                                background: sub.status === 'active' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                color: sub.status === 'active' ? '#F59E0B' : '#10B981',
                                fontSize: 11, fontWeight: 600,
                              }}>
                              {sub.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                            </button>
                            <button onClick={() => deleteSub(sub.id)}
                              className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-4 hover:opacity-90 transition-opacity"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 11, fontWeight: 600 }}>
                              <Trash2 size={12} /> Xoa
                            </button>
                          </div>
                        </div>
                      )}
                    </TrCard>
                  );
                })}
              </div>
            </PageSection>

            {subs.length === 0 && (
              <TrCard className="p-8 text-center">
                <Webhook size={32} color={c.text3} className="mx-auto mb-3 opacity-40" />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Chua co webhook nao</p>
                <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>Tao webhook de nhan thong bao event tu contract</p>
              </TrCard>
            )}
          </>
        )}

        {tab === 'deliveries' && (
          <PageSection label="Delivery History" accentColor="#3B82F6">
            <div className="flex flex-col gap-2">
              {deliveries.map(d => {
                const dStatus = DELIVERY_STATUS[d.status];
                const evtCfg = ALL_WEBHOOK_EVENTS.find(e => e.type === d.eventType);
                return (
                  <TrCard key={d.id} className="p-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: (evtCfg?.color || '#8B95B3') + '12' }}>
                        <Zap size={12} color={evtCfg?.color || '#8B95B3'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{d.eventType}</span>
                          <span className="px-1.5 py-px rounded"
                            style={{ background: dStatus.color + '12', color: dStatus.color, fontSize: 8, fontWeight: 700 }}>
                            {dStatus.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text3, fontSize: 10 }}>{d.timestamp}</span>
                          {d.statusCode && (
                            <span style={{ color: d.statusCode < 300 ? '#10B981' : '#EF4444', fontSize: 10, fontFamily: 'monospace' }}>
                              {d.statusCode}
                            </span>
                          )}
                          {d.responseTime && (
                            <span style={{ color: c.text3, fontSize: 10 }}>{d.responseTime}ms</span>
                          )}
                        </div>
                        {d.txHash && (
                          <div className="flex items-center gap-1 mt-1">
                            <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>tx: {d.txHash}</span>
                            <button onClick={() => handleCopy(d.txHash!, d.id)} className="p-0.5">
                              {copiedField === d.id
                                ? <Check size={8} color="#10B981" />
                                : <Copy size={8} color={c.text3} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </PageSection>
        )}

        {/* Info banner */}
        <div className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <Info size={13} color="#6366F1" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Webhooks gui HTTP POST den URL cua ban moi khi event xay ra tren blockchain.
            Dam bao endpoint co the xu ly payload va tra ve 2xx status code.
          </p>
        </div>

        <div className="h-[60px]" />
      </PageContent>

      {/* Create Sheet Overlay */}
      {showCreate && (
        <CreateWebhookSheet
          onClose={() => setShowCreate(false)}
          onCreate={(newSub) => {
            const updated = [...subs, newSub];
            setSubs(updated);
            saveWebhookSubs(updated);
            setShowCreate(false);
          }}
        />
      )}
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   CreateWebhookSheet — bottom sheet for creating new webhook
   ═══════════════════════════════════════════════════════════ */

function CreateWebhookSheet({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (sub: WebhookSubscription) => void;
}) {
  const c = useThemeColors();
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [contract, setContract] = useState('');
  const [chain, setChain] = useState('BSC');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([]);
  const [retryPolicy, setRetryPolicy] = useState<'none' | 'linear' | 'exponential'>('exponential');

  const chainOptions = [
    { value: 'BSC', color: '#F0B90B' },
    { value: 'Ethereum', color: '#627EEA' },
    { value: 'Polygon', color: '#8247E5' },
    { value: 'Arbitrum', color: '#28A0F0' },
  ];

  const toggleEvent = (type: WebhookEventType) => {
    setSelectedEvents(prev => prev.includes(type) ? prev.filter(e => e !== type) : [...prev, type]);
  };

  const canSubmit = label.trim() && url.trim() && contract.trim() && selectedEvents.length > 0;

  const handleCreate = () => {
    const chainColor = chainOptions.find(c => c.value === chain)?.color || '#8B95B3';
    onCreate({
      id: `wh_${Date.now()}`, label: label.trim(), contractAddress: contract.trim(),
      chain, chainColor, eventTypes: selectedEvents,
      webhookUrl: url.trim(), status: 'pending', createdAt: new Date().toLocaleDateString(),
      triggerCount: 0, errorCount: 0, filters: [],
      retryPolicy, maxRetries: retryPolicy === 'none' ? 0 : 3,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}>
      <div className="w-full max-w-[428px] rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{ background: c.bg }}
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.border }} />
        </div>

        <div className="px-5 pb-2 flex items-center justify-between">
          <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Tao Webhook moi</p>
          <button onClick={onClose} className="p-1"><X size={18} color={c.text3} /></button>
        </div>

        <div className="px-5 pb-6 flex flex-col gap-4">
          {/* Label */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Ten webhook</label>
            <input value={label} onChange={e => setLabel(e.target.value)}
              placeholder="VD: Staking Monitor"
              className="w-full mt-1 rounded-xl px-3 py-2.5"
              style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}`, outline: 'none' }} />
          </div>

          {/* URL */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Webhook URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://api.example.com/webhooks"
              className="w-full mt-1 rounded-xl px-3 py-2.5"
              style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}`, outline: 'none', fontFamily: 'monospace' }} />
          </div>

          {/* Contract */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Contract Address</label>
            <input value={contract} onChange={e => setContract(e.target.value)}
              placeholder="0x..."
              className="w-full mt-1 rounded-xl px-3 py-2.5"
              style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}`, outline: 'none', fontFamily: 'monospace' }} />
          </div>

          {/* Chain */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Chain</label>
            <div className="flex gap-2 mt-1">
              {chainOptions.map(ch => (
                <button key={ch.value} onClick={() => setChain(ch.value)}
                  className="flex-1 rounded-xl py-2 text-center"
                  style={{
                    background: chain === ch.value ? ch.color + '15' : c.surface2,
                    border: `1.5px solid ${chain === ch.value ? ch.color + '40' : 'transparent'}`,
                    color: chain === ch.value ? ch.color : c.text3,
                    fontSize: 11, fontWeight: 600,
                  }}>
                  {ch.value}
                </button>
              ))}
            </div>
          </div>

          {/* Events */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Events ({selectedEvents.length})</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {ALL_WEBHOOK_EVENTS.map(evt => {
                const selected = selectedEvents.includes(evt.type);
                return (
                  <button key={evt.type} onClick={() => toggleEvent(evt.type)}
                    className="px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: selected ? evt.color + '15' : c.surface2,
                      border: `1px solid ${selected ? evt.color + '30' : 'transparent'}`,
                      color: selected ? evt.color : c.text3,
                      fontSize: 10, fontWeight: 600,
                    }}>
                    {evt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Retry */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Retry Policy</label>
            <div className="flex gap-2 mt-1">
              {(['none', 'linear', 'exponential'] as const).map(rp => (
                <button key={rp} onClick={() => setRetryPolicy(rp)}
                  className="flex-1 rounded-xl py-2 text-center"
                  style={{
                    background: retryPolicy === rp ? 'rgba(99,102,241,0.1)' : c.surface2,
                    border: `1.5px solid ${retryPolicy === rp ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                    color: retryPolicy === rp ? '#6366F1' : c.text3,
                    fontSize: 10, fontWeight: 600, textTransform: 'capitalize',
                  }}>
                  {rp}
                </button>
              ))}
            </div>
          </div>

          <CTAButton disabled={!canSubmit} onClick={handleCreate}>
            Tao Webhook
          </CTAButton>
        </div>
      </div>
    </div>
  );
}