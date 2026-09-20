/**
 * ══════════════════════════════════════════════════════════════
 *  PredictionDataIntegrationPage — Prediction Markets Advanced Feature 4/4
 * ══════════════════════════════════════════════════════════════
 *  API Integration: External data sources, Oracle settings,
 *  Data feed status, API key management, Webhook notifications
 *  Pattern B — Page with Tabs (Sources/API/Webhooks)
 *  Compliance: Security-first, clear data providence
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  Database, Key, Webhook, CheckCircle, AlertCircle,
  RefreshCw, Copy, Eye, EyeOff, Plus, Trash2,
  Activity, Globe, Shield, Info, Clock, Link2,
} from 'lucide-react';

const TABS = ['Nguon du lieu', 'API Keys', 'Webhooks'] as const;
type Tab = typeof TABS[number];

interface DataSource {
  id: string;
  name: string;
  provider: string;
  category: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: Date;
  eventsResolved: number;
  reliability: number;
  apiUrl?: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed?: Date;
  permissions: string[];
  status: 'active' | 'revoked';
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastTriggered?: Date;
  successRate: number;
}

const MOCK_DATA_SOURCES: DataSource[] = [
  {
    id: 'ds1',
    name: 'CoinGecko Price Oracle',
    provider: 'CoinGecko',
    category: 'Crypto',
    status: 'active',
    lastSync: new Date(Date.now() - 300000),
    eventsResolved: 1247,
    reliability: 99.8,
    apiUrl: 'https://api.coingecko.com/api/v3',
  },
  {
    id: 'ds2',
    name: 'Chainlink Oracle Network',
    provider: 'Chainlink',
    category: 'Crypto',
    status: 'active',
    lastSync: new Date(Date.now() - 120000),
    eventsResolved: 892,
    reliability: 99.9,
    apiUrl: 'https://data.chain.link',
  },
  {
    id: 'ds3',
    name: 'Election Results API',
    provider: 'Associated Press',
    category: 'Politics',
    status: 'active',
    lastSync: new Date(Date.now() - 3600000),
    eventsResolved: 145,
    reliability: 100,
  },
  {
    id: 'ds4',
    name: 'Sports Scores Feed',
    provider: 'ESPN',
    category: 'Sports',
    status: 'inactive',
    lastSync: new Date(Date.now() - 86400000),
    eventsResolved: 523,
    reliability: 98.5,
  },
];

const MOCK_API_KEYS: ApiKey[] = [
  {
    id: 'key1',
    name: 'Production API',
    key: 'pk_live_abc123xyz789def456',
    createdAt: new Date(Date.now() - 30 * 86400000),
    lastUsed: new Date(Date.now() - 3600000),
    permissions: ['read:events', 'write:predictions', 'read:portfolio'],
    status: 'active',
  },
  {
    id: 'key2',
    name: 'Development API',
    key: 'pk_test_xyz789abc123ghi456',
    createdAt: new Date(Date.now() - 60 * 86400000),
    lastUsed: new Date(Date.now() - 86400000),
    permissions: ['read:events', 'read:portfolio'],
    status: 'active',
  },
];

const MOCK_WEBHOOKS: WebhookConfig[] = [
  {
    id: 'wh1',
    url: 'https://example.com/webhooks/prediction-resolved',
    events: ['event.resolved', 'position.settled'],
    status: 'active',
    lastTriggered: new Date(Date.now() - 7200000),
    successRate: 98.5,
  },
  {
    id: 'wh2',
    url: 'https://example.com/webhooks/price-alert',
    events: ['price.changed', 'probability.threshold'],
    status: 'active',
    lastTriggered: new Date(Date.now() - 600000),
    successRate: 99.2,
  },
];

export function PredictionDataIntegrationPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Nguon du lieu');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleKeyVisibility = (keyId: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const copyKey = (keyId: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    const parts = key.split('_');
    if (parts.length >= 3) {
      return `${parts[0]}_${parts[1]}_${'*'.repeat(parts[2].length)}`;
    }
    return '*'.repeat(key.length);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'inactive':
        return '#6B7280';
      case 'error':
        return '#EF4444';
      case 'revoked':
        return '#EF4444';
      default:
        return c.text3;
    }
  };

  const getTimeSince = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <PageLayout>
      <Header title="Data Integration" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Nguon du lieu' && (
          <>
            {/* Overview */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(16,185,129,0.08)',
                  }}
                >
                  <Database size={24} color="#10B981" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Oracle Data Sources</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>External data feeds for event resolution</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Active</p>
                  <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                    {MOCK_DATA_SOURCES.filter((s) => s.status === 'active').length}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Avg Reliability</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                    {(
                      MOCK_DATA_SOURCES.reduce((sum, s) => sum + s.reliability, 0) /
                      MOCK_DATA_SOURCES.length
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Events Resolved</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                    {MOCK_DATA_SOURCES.reduce((sum, s) => sum + s.eventsResolved, 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Sources List */}
            <PageSection label="Configured Sources">
              <div className="space-y-3">
                {MOCK_DATA_SOURCES.map((source) => (
                  <div
                    key={source.id}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                            {source.name}
                          </p>
                          <span
                            className="px-2 py-0.5 rounded-lg text-[9px] font-semibold"
                            style={{
                              background: `${getStatusColor(source.status)}20`,
                              color: getStatusColor(source.status),
                            }}
                          >
                            {source.status.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          {source.provider} · {source.category}
                        </p>
                      </div>
                      <button
                        onClick={() => alert(`Sync ${source.name}`)}
                        className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                        style={{ background: c.bg }}
                      >
                        <RefreshCw size={14} color={c.text3} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Last Sync</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {getTimeSince(source.lastSync)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Events</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {source.eventsResolved}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Reliability</p>
                        <p style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                          {source.reliability}%
                        </p>
                      </div>
                    </div>

                    {source.apiUrl && (
                      <div className="flex items-center gap-2">
                        <Link2 size={11} color={c.text3} />
                        <p style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                          {source.apiUrl}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Add Source Button */}
            <button
              onClick={() => alert('Add new data source')}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Plus size={18} />
              Add Data Source
            </button>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Shield size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Oracle data sources are used for automatic event resolution. All sources are verified and monitored.
              </p>
            </div>
          </>
        )}

        {tab === 'API Keys' && (
          <>
            {/* API Keys List */}
            <PageSection label="Your API Keys">
              <div className="space-y-3">
                {MOCK_API_KEYS.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                            {apiKey.name}
                          </p>
                          <span
                            className="px-2 py-0.5 rounded-lg text-[9px] font-semibold"
                            style={{
                              background: `${getStatusColor(apiKey.status)}20`,
                              color: getStatusColor(apiKey.status),
                            }}
                          >
                            {apiKey.status.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          Created {apiKey.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => alert(`Revoke ${apiKey.name}`)}
                        className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                        style={{ background: 'rgba(239,68,68,0.08)' }}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </button>
                    </div>

                    {/* API Key Display */}
                    <div
                      className="rounded-xl p-3 mb-3 flex items-center gap-2"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}
                    >
                      <Key size={14} color={c.text3} />
                      <code
                        style={{
                          flex: 1,
                          color: c.text1,
                          fontSize: 11,
                          fontFamily: 'monospace',
                        }}
                      >
                        {revealedKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="p-1.5 rounded hover:opacity-70"
                        >
                          {revealedKeys.has(apiKey.id) ? (
                            <EyeOff size={14} color={c.text3} />
                          ) : (
                            <Eye size={14} color={c.text3} />
                          )}
                        </button>
                        <button
                          onClick={() => copyKey(apiKey.id, apiKey.key)}
                          className="p-1.5 rounded hover:opacity-70"
                        >
                          {copiedKey === apiKey.id ? (
                            <CheckCircle size={14} color="#10B981" />
                          ) : (
                            <Copy size={14} color={c.text3} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="mb-3">
                      <p style={{ color: c.text3, fontSize: 11, marginBottom: 6 }}>Permissions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {apiKey.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-0.5 rounded-lg text-[10px]"
                            style={{ background: c.chipBg, color: c.chipText }}
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Last Used */}
                    {apiKey.lastUsed && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} color={c.text3} />
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          Last used {getTimeSince(apiKey.lastUsed)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Create New Key */}
            <button
              onClick={() => alert('Create new API key')}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Plus size={18} />
              Create API Key
            </button>

            {/* Security Warning */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <AlertCircle size={14} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Keep your API keys secret. Never share them or commit to version control. Revoke immediately if compromised.
              </p>
            </div>
          </>
        )}

        {tab === 'Webhooks' && (
          <>
            {/* Webhooks List */}
            <PageSection label="Webhook Endpoints">
              <div className="space-y-3">
                {MOCK_WEBHOOKS.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Webhook size={14} color={c.text3} />
                          <span
                            className="px-2 py-0.5 rounded-lg text-[9px] font-semibold"
                            style={{
                              background: `${getStatusColor(webhook.status)}20`,
                              color: getStatusColor(webhook.status),
                            }}
                          >
                            {webhook.status.toUpperCase()}
                          </span>
                        </div>
                        <code
                          style={{
                            color: c.text1,
                            fontSize: 11,
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                          }}
                        >
                          {webhook.url}
                        </code>
                      </div>
                      <button
                        onClick={() => alert(`Delete webhook ${webhook.id}`)}
                        className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                        style={{ background: 'rgba(239,68,68,0.08)' }}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </button>
                    </div>

                    {/* Events */}
                    <div className="mb-3">
                      <p style={{ color: c.text3, fontSize: 11, marginBottom: 6 }}>Events</p>
                      <div className="flex flex-wrap gap-1.5">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="px-2 py-0.5 rounded-lg text-[10px]"
                            style={{ background: c.chipBg, color: c.chipText }}
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Success Rate</p>
                        <div className="flex items-center gap-2">
                          <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>
                            {webhook.successRate}%
                          </p>
                          {webhook.successRate >= 95 && (
                            <CheckCircle size={12} color="#10B981" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Last Triggered</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {webhook.lastTriggered ? getTimeSince(webhook.lastTriggered) : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Add Webhook */}
            <button
              onClick={() => alert('Add new webhook')}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Plus size={18} />
              Add Webhook
            </button>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Webhooks allow you to receive real-time notifications when events occur. Configure your endpoint to handle POST requests.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}