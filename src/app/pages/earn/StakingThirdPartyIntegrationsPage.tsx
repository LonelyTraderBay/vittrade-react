import React from 'react';
import { Link, CheckCircle2, ExternalLink } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

const INTEGRATIONS = [
  { name: 'TurboTax', desc: 'Automatic tax import', status: 'connected', logo: '💼' },
  { name: 'CoinTracker', desc: 'Portfolio tracking', status: 'connected', logo: '📊' },
  { name: 'Ledger Live', desc: 'Hardware wallet sync', status: 'available', logo: '🔐' },
  { name: 'MetaMask', desc: 'Wallet integration', status: 'connected', logo: '🦊' },
  { name: 'Zapier', desc: 'Automation workflows', status: 'available', logo: '⚡' },
  { name: 'Discord Bot', desc: 'Notifications', status: 'available', logo: '🤖' },
];

export function StakingThirdPartyIntegrationsPage() {
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Integrations" back />

      <PageContent>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)' }}>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Connect Your Tools
          </p>
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
            Sync your staking data with tax software, portfolio trackers, and automation tools.
          </p>
        </div>

        <PageSection label="Available Integrations">
          <div className="flex flex-col gap-2">
            {INTEGRATIONS.map((integration, idx) => (
              <TrCard key={idx} hover className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: c.surface2 }}>
                    {integration.logo}
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                      {integration.name}
                    </p>
                    <p style={{ color: c.text3, fontSize: 11 }}>{integration.desc}</p>
                  </div>
                  {integration.status === 'connected' ? (
                    <CheckCircle2 size={20} color="#10B981" />
                  ) : (
                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: c.primary, color: '#FFF' }}>
                      Connect
                    </button>
                  )}
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        <TrCard className="p-4">
          <div className="flex items-start gap-3">
            <Link size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                API Access
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
                Build custom integrations using our API. Full documentation available.
              </p>
              <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#3B82F6' }}>
                View API Docs
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}
