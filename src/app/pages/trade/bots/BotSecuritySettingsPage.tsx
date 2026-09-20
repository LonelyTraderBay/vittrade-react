import React, { useState } from 'react';
import { Key, Shield, Smartphone, MapPin, Activity, Plus, Trash2, Eye, EyeOff, Copy } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { BottomSheetV2 } from '../../../components/ui/BottomSheetV2';
import { toast } from 'sonner';

const API_KEYS = [
  { id: '1', name: 'Trading Bot Key #1', permissions: 'Trade + Read', lastUsed: '2 hours ago', created: '2026-01-15' },
  { id: '2', name: 'Analytics Key', permissions: 'Read Only', lastUsed: '1 day ago', created: '2026-02-20' },
];

const IP_WHITELIST = [
  { id: '1', ip: '192.168.1.100', label: 'Home Network', added: '2026-03-01' },
  { id: '2', ip: '203.0.113.42', label: 'VPS Server', added: '2026-03-05' },
];

const RECENT_ACTIVITY = [
  { id: '1', action: 'Bot created: DCA Bot #1', time: '2 hours ago', status: 'success' },
  { id: '2', action: 'API key generated', time: '1 day ago', status: 'success' },
  { id: '3', action: 'Failed login attempt', time: '3 days ago', status: 'warning' },
  { id: '4', action: 'Bot stopped: Grid Bot #2', time: '5 days ago', status: 'success' },
];

export function BotSecuritySettingsPage() {
  const c = useThemeColors();
  const [showApiSheet, setShowApiSheet] = useState(false);
  const [showIpSheet, setShowIpSheet] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');

  const handleGenerateKey = () => {
    const key = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setGeneratedKey(key);
    toast.success('API key generated successfully');
  };

  return (
    <PageLayout>
      <Header title="Security Settings" back />

      {/* Create API Key Sheet */}
      <BottomSheetV2 open={showApiSheet} onClose={() => setShowApiSheet(false)} title="Create API Key">
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Key Name</label>
            <input
              type="text"
              placeholder="e.g., Trading Bot Key"
              className="w-full p-3 rounded-xl text-sm"
              style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}
            />
          </div>
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {['Read Only', 'Trade + Read'].map(perm => (
                <button
                  key={perm}
                  className="p-3 rounded-xl text-xs font-semibold"
                  style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}>
                  {perm}
                </button>
              ))}
            </div>
          </div>
          {generatedKey ? (
            <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                ✅ API Key Generated
              </p>
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: c.surface }}>
                <code style={{ color: c.text1, fontSize: 12, flex: 1, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {showApiKey ? generatedKey : '••••••••••••••••••••••••'}
                </code>
                <button onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? <EyeOff size={16} color={c.text3} /> : <Eye size={16} color={c.text3} />}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(generatedKey); toast.success('Copied!'); }}>
                  <Copy size={16} color={c.text3} />
                </button>
              </div>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 6 }}>
                ⚠️ Save this key now - you won't be able to see it again!
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerateKey}
              className="w-full py-3 rounded-[14px] text-sm font-semibold"
              style={{ background: c.primary, color: '#FFF' }}>
              Generate API Key
            </button>
          )}
        </div>
      </BottomSheetV2>

      {/* Add IP Sheet */}
      <BottomSheetV2 open={showIpSheet} onClose={() => setShowIpSheet(false)} title="Add IP to Whitelist">
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>IP Address</label>
            <input
              type="text"
              placeholder="e.g., 192.168.1.100"
              className="w-full p-3 rounded-xl text-sm"
              style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}
            />
          </div>
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Label (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Home Network"
              className="w-full p-3 rounded-xl text-sm"
              style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}
            />
          </div>
          <button
            onClick={() => { toast.success('IP added to whitelist'); setShowIpSheet(false); }}
            className="w-full py-3 rounded-[14px] text-sm font-semibold"
            style={{ background: c.primary, color: '#FFF' }}>
            Add IP Address
          </button>
        </div>
      </BottomSheetV2>

      <PageContent>
        {/* 2FA Status */}
        <PageSection label="Two-Factor Authentication">
          <TrCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone size={24} color={twoFaEnabled ? '#10B981' : c.text3} />
                <div>
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>2FA for Bot Actions</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>Required for creating/deleting bots</p>
                </div>
              </div>
              <button
                onClick={() => setTwoFaEnabled(!twoFaEnabled)}
                className="w-12 h-6 rounded-full relative"
                style={{ background: twoFaEnabled ? '#10B981' : c.surface2 }}>
                <div
                  className="w-5 h-5 rounded-full absolute top-0.5 transition-all"
                  style={{
                    background: '#FFF',
                    left: twoFaEnabled ? '26px' : '2px',
                  }}
                />
              </button>
            </div>
          </TrCard>
        </PageSection>

        {/* API Keys */}
        <PageSection label="API Keys">
          <div className="flex flex-col gap-2">
            {API_KEYS.map(key => (
              <TrCard key={key.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{key.name}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-md text-xs font-bold"
                        style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                        {key.permissions}
                      </span>
                      <span style={{ color: c.text3, fontSize: 10 }}>Created {key.created}</span>
                    </div>
                    <p style={{ color: c.text3, fontSize: 12 }}>Last used: {key.lastUsed}</p>
                  </div>
                  <button onClick={() => toast.success('API key revoked')}>
                    <Trash2 size={18} color="#EF4444" />
                  </button>
                </div>
              </TrCard>
            ))}
            <button
              onClick={() => setShowApiSheet(true)}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: c.surface, color: c.primary, border: `1px dashed ${c.primary}` }}>
              <Plus size={18} />
              Create New API Key
            </button>
          </div>
        </PageSection>

        {/* IP Whitelist */}
        <PageSection label="IP Whitelist">
          <div className="flex flex-col gap-2">
            {IP_WHITELIST.map(ip => (
              <TrCard key={ip.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{ip.ip}</p>
                    <p style={{ color: c.text3, fontSize: 12 }}>{ip.label} • Added {ip.added}</p>
                  </div>
                  <button><Trash2 size={16} color="#EF4444" /></button>
                </div>
              </TrCard>
            ))}
            <button
              onClick={() => setShowIpSheet(true)}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: c.surface, color: c.primary, border: `1px dashed ${c.primary}` }}>
              <Plus size={18} />
              Add IP Address
            </button>
          </div>
        </PageSection>

        {/* Activity Log */}
        <PageSection label="Recent Activity">
          <TrCard className="p-4">
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((activity, idx) => (
                <div key={activity.id} className={`pb-3 ${idx < RECENT_ACTIVITY.length - 1 ? 'border-b' : ''}`} style={{ borderColor: c.borderSolid }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 12 }}>{activity.action}</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>{activity.time}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full mt-1`}
                      style={{ background: activity.status === 'success' ? '#10B981' : '#F59E0B' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Security Tips */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Security Best Practices</p>
          <ul className="space-y-2">
            {[
              'Never share your API keys with anyone',
              'Use Read-Only keys for analytics, Trade keys only for bots',
              'Restrict API access to specific IP addresses',
              'Enable 2FA for all bot-related actions',
              'Regularly review activity log for suspicious behavior',
            ].map((tip, idx) => (
              <li key={idx} className="flex gap-2">
                <span style={{ color: c.text3 }}>•</span>
                <p style={{ color: c.text3, fontSize: 12 }}>{tip}</p>
              </li>
            ))}
          </ul>
        </div>
      </PageContent>
    </PageLayout>
  );
}