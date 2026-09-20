import React, { useState } from 'react';
import { Code, Copy, CheckCircle2, ExternalLink, Key, Zap, Shield } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { toast } from 'sonner';

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/staking/stake',
    name: 'Create Stake Position',
    desc: 'Stake assets to a specific product',
    params: [
      { name: 'asset', type: 'string', required: true, desc: 'ETH, BTC, SOL, etc.' },
      { name: 'amount', type: 'number', required: true, desc: 'Amount to stake' },
      { name: 'product', type: 'string', required: true, desc: 'flexible, fixed-30, fixed-60, etc.' },
      { name: 'validator', type: 'string', required: false, desc: 'Optional validator address' },
    ],
    response: {
      positionId: 'pos_abc123',
      asset: 'ETH',
      amount: 1.5,
      product: 'flexible',
      apy: 4.2,
      status: 'active',
      createdAt: '2026-03-07T14:30:00Z',
    },
  },
  {
    method: 'GET',
    path: '/staking/positions',
    name: 'Get Staking Positions',
    desc: 'Retrieve all staking positions for authenticated user',
    params: [
      { name: 'asset', type: 'string', required: false, desc: 'Filter by asset' },
      { name: 'status', type: 'string', required: false, desc: 'active, unstaking, completed' },
      { name: 'limit', type: 'number', required: false, desc: 'Max 100' },
      { name: 'offset', type: 'number', required: false, desc: 'Pagination offset' },
    ],
    response: {
      positions: [
        {
          positionId: 'pos_abc123',
          asset: 'ETH',
          amount: 1.5,
          product: 'flexible',
          apy: 4.2,
          earnedRewards: 0.05,
          status: 'active',
        },
      ],
      total: 1,
    },
  },
  {
    method: 'POST',
    path: '/staking/unstake',
    name: 'Unstake Position',
    desc: 'Unstake assets from a position',
    params: [
      { name: 'positionId', type: 'string', required: true, desc: 'Position ID to unstake' },
      { name: 'amount', type: 'number', required: false, desc: 'Partial unstake amount (optional)' },
    ],
    response: {
      unstakeId: 'uns_xyz789',
      positionId: 'pos_abc123',
      amount: 1.5,
      estimatedCompletion: '2026-03-09T14:30:00Z',
      status: 'unstaking',
    },
  },
  {
    method: 'GET',
    path: '/staking/rewards',
    name: 'Get Rewards History',
    desc: 'Retrieve rewards history with filters',
    params: [
      { name: 'asset', type: 'string', required: false, desc: 'Filter by asset' },
      { name: 'startDate', type: 'string', required: false, desc: 'ISO 8601 date' },
      { name: 'endDate', type: 'string', required: false, desc: 'ISO 8601 date' },
      { name: 'limit', type: 'number', required: false, desc: 'Max 100' },
    ],
    response: {
      rewards: [
        {
          rewardId: 'rew_123',
          asset: 'ETH',
          amount: 0.001,
          usdValue: 2.8,
          timestamp: '2026-03-07T00:00:00Z',
        },
      ],
      total: 50,
    },
  },
  {
    method: 'GET',
    path: '/staking/validators',
    name: 'Get Validators List',
    desc: 'Get available validators with performance metrics',
    params: [
      { name: 'asset', type: 'string', required: true, desc: 'ETH, SOL, etc.' },
      { name: 'sortBy', type: 'string', required: false, desc: 'apy, uptime, commission' },
    ],
    response: {
      validators: [
        {
          address: '0x1234...5678',
          name: 'Validator A',
          apy: 4.5,
          commission: 10,
          uptime: 99.8,
          totalStaked: 125000,
        },
      ],
      total: 25,
    },
  },
];

const CODE_EXAMPLES: Record<string, string> = {
  javascript: `// JavaScript/Node.js
const response = await fetch('https://api.platform.com/v1/staking/stake', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    asset: 'ETH',
    amount: 1.5,
    product: 'flexible'
  })
});
const data = await response.json();
console.log(data);`,
  python: `# Python
import requests

url = 'https://api.platform.com/v1/staking/stake'
headers = {
    'X-API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
}
body = {
    'asset': 'ETH',
    'amount': 1.5,
    'product': 'flexible'
}

response = requests.post(url, headers=headers, json=body)
data = response.json()
print(data)`,
  curl: `# cURL
curl -X POST https://api.platform.com/v1/staking/stake \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "asset": "ETH",
    "amount": 1.5,
    "product": "flexible"
  }'`,
};

const RATE_LIMITS = [
  { tier: 'Free', requests: 100, window: '1 hour', price: '$0' },
  { tier: 'Pro', requests: 1000, window: '1 hour', price: '$29/mo' },
  { tier: 'Enterprise', requests: 10000, window: '1 hour', price: 'Custom' },
];

export function StakingAPIDocumentationPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'endpoints' | 'examples' | 'auth'>('endpoints');
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [codeLanguage, setCodeLanguage] = useState<'javascript' | 'python' | 'curl'>('javascript');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const endpoint = ENDPOINTS[selectedEndpoint];

  return (
    <PageLayout>
      <Header title="API Documentation" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)' }}>
          <div className="flex gap-3">
            <Code size={20} color="#8B5CF6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Programmatic Staking API
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                RESTful API with JSON payloads. Rate limits apply. API key authentication required. Test in sandbox environment before production.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard className="p-3">
            <Zap size={16} color="#F59E0B" className="mb-2" />
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>99.9%</p>
            <p style={{ color: c.text3, fontSize: 10 }}>Uptime</p>
          </TrCard>
          <TrCard className="p-3">
            <Key size={16} color="#3B82F6" className="mb-2" />
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>5</p>
            <p style={{ color: c.text3, fontSize: 10 }}>Endpoints</p>
          </TrCard>
          <TrCard className="p-3">
            <Shield size={16} color="#10B981" className="mb-2" />
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>v1.0</p>
            <p style={{ color: c.text3, fontSize: 10 }}>API Version</p>
          </TrCard>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'endpoints', label: 'Endpoints' },
            { id: 'examples', label: 'Examples' },
            { id: 'auth', label: 'Auth & Limits' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'endpoints' && (
          <>
            <PageSection label="API Endpoints">
              <div className="flex flex-col gap-2">
                {ENDPOINTS.map((ep, idx) => (
                  <TrCard
                    key={idx}
                    hover
                    className="p-3"
                    onClick={() => setSelectedEndpoint(idx)}
                    style={{
                      border: selectedEndpoint === idx ? `2px solid ${c.primary}` : undefined,
                    }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{
                          background: ep.method === 'POST' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                          color: ep.method === 'POST' ? '#10B981' : '#3B82F6',
                        }}>
                        {ep.method}
                      </span>
                      <p style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                        {ep.path}
                      </p>
                    </div>
                    <p style={{ color: c.text3, fontSize: 11 }}>{ep.desc}</p>
                  </TrCard>
                ))}
              </div>
            </PageSection>

            <PageSection label="Endpoint Detail">
              <TrCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="px-3 py-1 rounded-lg text-sm font-bold"
                    style={{
                      background: endpoint.method === 'POST' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                      color: endpoint.method === 'POST' ? '#10B981' : '#3B82F6',
                    }}>
                    {endpoint.method}
                  </span>
                  <p style={{ color: c.text1, fontSize: 14, fontFamily: 'monospace', fontWeight: 700 }}>
                    {endpoint.path}
                  </p>
                </div>

                <p style={{ color: c.text2, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                  {endpoint.desc}
                </p>

                {/* Parameters */}
                <div className="mb-4">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    Parameters
                  </p>
                  <div className="space-y-2">
                    {endpoint.params.map((param, idx) => (
                      <div key={idx} className="rounded-lg p-3" style={{ background: c.surface2 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ color: c.text1, fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}>
                            {param.name}
                          </p>
                          <span style={{ color: c.text3, fontSize: 10 }}>
                            {param.type}
                          </span>
                          {param.required && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                              required
                            </span>
                          )}
                        </div>
                        <p style={{ color: c.text3, fontSize: 11 }}>{param.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Example */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                      Response Example
                    </p>
                    <button
                      onClick={() => handleCopy(JSON.stringify(endpoint.response, null, 2))}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                      style={{ background: c.surface2, color: c.text2 }}>
                      <Copy size={12} />
                      Copy
                    </button>
                  </div>
                  <div className="rounded-lg p-3 overflow-x-auto" style={{ background: '#1E1E1E' }}>
                    <pre style={{ fontSize: 11, color: '#D4D4D4', margin: 0, fontFamily: 'monospace' }}>
                      {JSON.stringify(endpoint.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {tab === 'examples' && (
          <>
            <PageSection label="Code Examples">
              <div className="flex gap-2 mb-3">
                {(['javascript', 'python', 'curl'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setCodeLanguage(lang)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: codeLanguage === lang ? c.primary : c.surface2,
                      color: codeLanguage === lang ? '#FFF' : c.text2,
                    }}>
                    {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>

              <TrCard className="p-0 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: c.borderSolid }}>
                  <p style={{ color: c.text2, fontSize: 12, fontWeight: 700 }}>
                    Create Stake Position
                  </p>
                  <button
                    onClick={() => handleCopy(CODE_EXAMPLES[codeLanguage])}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{ background: c.surface2, color: c.text2 }}>
                    <Copy size={12} />
                    Copy
                  </button>
                </div>
                <div className="p-3 overflow-x-auto" style={{ background: '#1E1E1E' }}>
                  <pre style={{ fontSize: 11, color: '#D4D4D4', margin: 0, fontFamily: 'monospace', lineHeight: 1.6 }}>
                    {CODE_EXAMPLES[codeLanguage]}
                  </pre>
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Try in Sandbox">
              <TrCard className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <Zap size={24} color="#F59E0B" />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                      Sandbox Environment
                    </p>
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                      Test your integration with fake data before going live. No real funds involved.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Sandbox Base URL</p>
                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text1, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                      https://sandbox.platform.com/v1
                    </p>
                    <Copy
                      size={14}
                      color={c.text3}
                      className="cursor-pointer"
                      onClick={() => handleCopy('https://sandbox.platform.com/v1')}
                    />
                  </div>
                </div>

                <button
                  className="w-full py-3 rounded-[14px] text-center text-sm font-semibold"
                  style={{ background: c.primary, color: '#FFF' }}>
                  Get Sandbox API Key
                </button>
              </TrCard>
            </PageSection>
          </>
        )}

        {tab === 'auth' && (
          <>
            <PageSection label="Authentication">
              <TrCard className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <Key size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
                  <div>
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                      API Key Authentication
                    </p>
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                      Include your API key in the <code style={{ background: c.surface2, padding: '2px 6px', borderRadius: 4 }}>X-API-Key</code> header with every request.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg p-3" style={{ background: '#1E1E1E' }}>
                  <pre style={{ fontSize: 11, color: '#D4D4D4', margin: 0, fontFamily: 'monospace' }}>
                    {`curl -H "X-API-Key: YOUR_API_KEY" \\
  https://api.platform.com/v1/staking/positions`}
                  </pre>
                </div>

                <button
                  className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: c.surface2, color: c.text1 }}>
                  Generate API Key in Settings →
                </button>
              </TrCard>
            </PageSection>

            <PageSection label="Rate Limits">
              <div className="flex flex-col gap-3">
                {RATE_LIMITS.map((tier, idx) => (
                  <TrCard
                    key={idx}
                    className="p-4"
                    style={{
                      border: tier.tier === 'Pro' ? `2px solid ${c.primary}` : undefined,
                    }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                          {tier.tier}
                        </p>
                        <p style={{ color: c.text3, fontSize: 11 }}>{tier.price}</p>
                      </div>
                      {tier.tier === 'Pro' && (
                        <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: `${c.primary}22`, color: c.primary }}>
                          Recommended
                        </span>
                      )}
                    </div>

                    <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                      <div className="flex items-baseline gap-1 mb-1">
                        <p style={{ color: c.text1, fontSize: 24, fontWeight: 700 }}>
                          {tier.requests.toLocaleString()}
                        </p>
                        <p style={{ color: c.text3, fontSize: 12 }}>requests</p>
                      </div>
                      <p style={{ color: c.text3, fontSize: 11 }}>per {tier.window}</p>
                    </div>

                    {tier.tier === 'Enterprise' && (
                      <button
                        className="w-full mt-3 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: c.primary, color: '#FFF' }}>
                        Contact Sales
                      </button>
                    )}
                  </TrCard>
                ))}
              </div>
            </PageSection>

            <PageSection label="Error Codes">
              <TrCard className="p-4">
                <div className="space-y-2">
                  {[
                    { code: 401, message: 'Unauthorized - Invalid API key' },
                    { code: 403, message: 'Forbidden - Rate limit exceeded' },
                    { code: 400, message: 'Bad Request - Invalid parameters' },
                    { code: 404, message: 'Not Found - Endpoint does not exist' },
                    { code: 500, message: 'Internal Server Error' },
                  ].map((error, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: c.surface2 }}>
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold shrink-0"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                        {error.code}
                      </span>
                      <p style={{ color: c.text2, fontSize: 12 }}>{error.message}</p>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {/* Footer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            API documentation last updated: March 7, 2026. For enterprise support, contact api-support@platform.com. Join our Discord for community help.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
