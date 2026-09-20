import React, { useState } from 'react';
import { Code, Key, Activity, Terminal } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

const API_KEYS = [
  { id: 'key1', name: 'Production API', key: 'sk_live_4f8b...2a3c', created: '2026-01-15', lastUsed: '2 mins ago', requests: 12543 },
  { id: 'key2', name: 'Test Environment', key: 'sk_test_9d1e...7b4f', created: '2025-12-01', lastUsed: '1 day ago', requests: 892 },
];

const RECENT_REQUESTS = [
  { endpoint: 'POST /staking/stake', status: 200, time: '45ms', timestamp: '14:32:15' },
  { endpoint: 'GET /staking/positions', status: 200, time: '23ms', timestamp: '14:30:02' },
  { endpoint: 'GET /staking/rewards', status: 200, time: '18ms', timestamp: '14:28:47' },
];

export function StakingDeveloperConsolePage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'keys' | 'logs' | 'docs'>('keys');

  return (
    <PageLayout>
      <Header title="Developer Console" back />

      <PageContent>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)' }}>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            API Management
          </p>
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
            Manage API keys, monitor usage, and access documentation.
          </p>
        </div>

        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-xl" style={{ background: c.surface2 }}>
              <Activity size={16} color={c.text3} className="mx-auto mb-1" />
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>13.4K</p>
              <p style={{ color: c.text3, fontSize: 9 }}>Requests/day</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>99.9%</p>
              <p style={{ color: c.text3, fontSize: 9 }}>Uptime</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>12ms</p>
              <p style={{ color: c.text3, fontSize: 9 }}>Avg latency</p>
            </div>
          </div>
        </TrCard>

        <TabBar
          tabs={[
            { id: 'keys', label: 'API Keys' },
            { id: 'logs', label: 'Logs' },
            { id: 'docs', label: 'Docs' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'keys' && (
          <PageSection label="API Keys">
            <div className="flex flex-col gap-2">
              {API_KEYS.map(key => (
                <TrCard key={key.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                        {key.name}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace' }}>
                        {key.key}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: c.text3 }}>
                    <div>
                      <p className="mb-1">Created</p>
                      <p style={{ color: c.text2 }}>{key.created}</p>
                    </div>
                    <div>
                      <p className="mb-1">Last Used</p>
                      <p style={{ color: c.text2 }}>{key.lastUsed}</p>
                    </div>
                    <div>
                      <p className="mb-1">Requests</p>
                      <p style={{ color: c.text2 }}>{key.requests.toLocaleString()}</p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
            <button className="w-full py-3 rounded-[14px] text-sm font-semibold" style={{ background: c.primary, color: '#FFF' }}>
              Create New API Key
            </button>
          </PageSection>
        )}

        {tab === 'logs' && (
          <PageSection label="Recent API Requests">
            <div className="flex flex-col gap-1">
              {RECENT_REQUESTS.map((req, idx) => (
                <TrCard key={idx} className="p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-xs font-bold" style={{ color: '#10B981' }}>
                        {req.status}
                      </span>
                      <p style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace' }}>
                        {req.endpoint}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: c.text3 }}>
                      <span>{req.time}</span>
                      <span>{req.timestamp}</span>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {tab === 'docs' && (
          <PageSection label="Quick Links">
            <div className="flex flex-col gap-2">
              {[
                { title: 'API Reference', desc: 'Complete endpoint documentation' },
                { title: 'Authentication', desc: 'API key setup and security' },
                { title: 'Rate Limits', desc: 'Request quotas and throttling' },
                { title: 'Webhooks Guide', desc: 'Real-time event notifications' },
              ].map((doc, idx) => (
                <TrCard key={idx} hover className="p-3">
                  <div className="flex items-center gap-3">
                    <Code size={20} color="#3B82F6" />
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 1 }}>
                        {doc.title}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{doc.desc}</p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}
      </PageContent>
    </PageLayout>
  );
}
