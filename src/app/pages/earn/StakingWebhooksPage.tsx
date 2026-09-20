import React, { useState } from 'react';
import { Webhook, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';

const WEBHOOKS = [
  { id: 'w1', url: 'https://api.myapp.com/staking/rewards', events: ['reward_received'], status: 'active', lastTriggered: '2 mins ago' },
  { id: 'w2', url: 'https://hooks.slack.com/services/...', events: ['stake_completed', 'unstake_completed'], status: 'active', lastTriggered: '1 hour ago' },
  { id: 'w3', url: 'https://discord.com/api/webhooks/...', events: ['slashing_detected'], status: 'inactive', lastTriggered: 'Never' },
];

const EVENT_TYPES = [
  'stake_completed', 'unstake_completed', 'reward_received', 'validator_changed', 'slashing_detected', 'apy_changed',
];

export function StakingWebhooksPage() {
  const c = useThemeColors();
  const [showAddSheet, setShowAddSheet] = useState(false);

  return (
    <PageLayout>
      <Header title="Webhooks" back />

      <BottomSheetV2 open={showAddSheet} onClose={() => setShowAddSheet(false)} title="Create Webhook">
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Webhook URL</label>
            <input type="url" placeholder="https://..." className="w-full p-3 rounded-xl text-sm"
              style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }} />
          </div>
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Events</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.slice(0, 4).map(event => (
                <button key={event} className="px-2 py-1 rounded-lg text-xs" style={{ background: c.surface2, color: c.text2 }}>
                  {event}
                </button>
              ))}
            </div>
          </div>
          <button className="w-full py-3 rounded-[14px] text-sm font-semibold" style={{ background: c.primary, color: '#FFF' }}>
            Create Webhook
          </button>
        </div>
      </BottomSheetV2>

      <PageContent>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)' }}>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Real-time Event Notifications
          </p>
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
            Receive instant HTTP callbacks when staking events occur. Perfect for automation and integrations.
          </p>
        </div>

        <button
          onClick={() => setShowAddSheet(true)}
          className="w-full py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: c.primary, color: '#FFF' }}>
          <Plus size={18} />
          Create Webhook
        </button>

        <PageSection label="Active Webhooks">
          <div className="flex flex-col gap-2">
            {WEBHOOKS.map(webhook => (
              <TrCard key={webhook.id} className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {webhook.url}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      {webhook.status === 'active' ? (
                        <CheckCircle2 size={12} color="#10B981" />
                      ) : (
                        <XCircle size={12} color="#EF4444" />
                      )}
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        Last: {webhook.lastTriggered}
                      </p>
                    </div>
                  </div>
                  <button className="shrink-0">
                    <Trash2 size={16} color="#EF4444" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map(event => (
                    <span key={event} className="px-2 py-0.5 rounded-md text-xs" style={{ background: c.surface2, color: c.text3 }}>
                      {event}
                    </span>
                  ))}
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        <PageSection label="Available Events">
          <TrCard className="p-4">
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(event => (
                <span key={event} className="px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                  {event}
                </span>
              ))}
            </div>
          </TrCard>
        </PageSection>
      </PageContent>
    </PageLayout>
  );
}
