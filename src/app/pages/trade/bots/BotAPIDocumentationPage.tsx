import React, { useState } from 'react';
import { Code, Copy, CheckCircle2, Key, Zap, BookOpen } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { TabBar } from '../../../components/layout/TabBar';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { toast } from 'sonner';

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/bots',
    description: 'List all user bots',
    params: [
      { name: 'status', type: 'string', required: false, description: 'Filter by status (running, stopped, paused)' },
      { name: 'limit', type: 'number', required: false, description: 'Max results (default: 20)' },
    ],
    response: `{
  "bots": [
    {
      "id": "bot_abc123",
      "name": "DCA Bot #1",
      "strategy": "dca",
      "status": "running",
      "profit": 84.20,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "total": 3
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/bots',
    description: 'Create a new bot',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Bot name' },
      { name: 'strategy', type: 'string', required: true, description: 'dca | grid | momentum | martingale' },
      { name: 'pair', type: 'string', required: true, description: 'Trading pair (e.g., BTC/USDT)' },
      { name: 'config', type: 'object', required: true, description: 'Strategy-specific parameters' },
    ],
    response: `{
  "bot": {
    "id": "bot_xyz789",
    "name": "My Grid Bot",
    "strategy": "grid",
    "status": "running",
    "createdAt": "2026-03-08T14:23:00Z"
  }
}`,
  },
  {
    method: 'DELETE',
    path: '/api/v1/bots/:botId',
    description: 'Stop and delete a bot',
    params: [],
    response: `{
  "success": true,
  "message": "Bot stopped and deleted"
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/bots/:botId/history',
    description: 'Get bot trade history',
    params: [
      { name: 'startDate', type: 'string', required: false, description: 'ISO date' },
      { name: 'endDate', type: 'string', required: false, description: 'ISO date' },
      { name: 'limit', type: 'number', required: false, description: 'Max results' },
    ],
    response: `{
  "trades": [
    {
      "id": "trade_123",
      "side": "buy",
      "price": 68450,
      "qty": 0.001,
      "fee": 0.034,
      "timestamp": "2026-03-08T14:32:15Z"
    }
  ],
  "total": 247
}`,
  },
];

const WEBSOCKET_EVENTS = [
  {
    event: 'bot.status',
    description: 'Bot status changed',
    payload: `{
  "botId": "bot_abc123",
  "status": "stopped",
  "reason": "manual_stop",
  "timestamp": "2026-03-08T15:00:00Z"
}`,
  },
  {
    event: 'bot.trade',
    description: 'New trade executed',
    payload: `{
  "botId": "bot_abc123",
  "tradeId": "trade_xyz",
  "side": "buy",
  "price": 68450,
  "qty": 0.001,
  "fee": 0.034
}`,
  },
  {
    event: 'bot.profit',
    description: 'Profit/loss update',
    payload: `{
  "botId": "bot_abc123",
  "profit": 127.40,
  "profitPercent": 12.74,
  "totalTrades": 156
}`,
  },
];

const CODE_EXAMPLES = {
  javascript: `// Install SDK
npm install @tradingplatform/bot-sdk

// Import and initialize
const BotSDK = require('@tradingplatform/bot-sdk');
const client = new BotSDK({
  apiKey: 'YOUR_API_KEY',
  apiSecret: 'YOUR_API_SECRET'
});

// List all bots
const bots = await client.bots.list();
console.log(bots);

// Create a new Grid Bot
const newBot = await client.bots.create({
  name: 'My Grid Bot',
  strategy: 'grid',
  pair: 'BTC/USDT',
  config: {
    gridCount: 20,
    upperPrice: 70000,
    lowerPrice: 65000,
    investment: 1000
  }
});

// Subscribe to bot events
client.on('bot.trade', (data) => {
  console.log('New trade:', data);
});`,
  python: `# Install SDK
pip install tradingplatform-bot-sdk

# Import and initialize
from tradingplatform import BotClient

client = BotClient(
    api_key='YOUR_API_KEY',
    api_secret='YOUR_API_SECRET'
)

# List all bots
bots = client.bots.list()
print(bots)

# Create a new DCA Bot
new_bot = client.bots.create(
    name='My DCA Bot',
    strategy='dca',
    pair='BTC/USDT',
    config={
        'amount': 100,
        'frequency': 'weekly'
    }
)

# Subscribe to WebSocket events
@client.on('bot.trade')
def on_trade(data):
    print(f"New trade: {data}")`,
  curl: `# List all bots
curl -X GET https://api.tradingplatform.com/v1/bots \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Create a new bot
curl -X POST https://api.tradingplatform.com/v1/bots \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Grid Bot",
    "strategy": "grid",
    "pair": "BTC/USDT",
    "config": {
      "gridCount": 20,
      "upperPrice": 70000,
      "lowerPrice": 65000,
      "investment": 1000
    }
  }'

# Get bot history
curl -X GET https://api.tradingplatform.com/v1/bots/bot_abc123/history \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
};

export function BotAPIDocumentationPage() {
  const c = useThemeColors();
  const [view, setView] = useState<'endpoints' | 'websocket' | 'examples'>('endpoints');
  const [language, setLanguage] = useState<'javascript' | 'python' | 'curl'>('javascript');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <PageLayout>
      <Header title="API Documentation" back />

      <PageContent>
        {/* Intro */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Code size={24} color="#3B82F6" className="shrink-0" />
            <div>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                Bot API Documentation
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Programmatically create, manage, and monitor trading bots using our REST API and WebSocket connections. 
                Available for Enterprise tier users.
              </p>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <TabBar
          variant="pill"
          tabs={['endpoints', 'websocket', 'examples']}
          active={view}
          onChange={setView as any}
        />

        {/* REST Endpoints */}
        {view === 'endpoints' && (
          <PageSection label="REST API Endpoints">
            <div className="flex flex-col gap-3">
              {API_ENDPOINTS.map((endpoint, idx) => (
                <TrCard key={idx} className="p-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 rounded-md text-xs font-bold"
                      style={{
                        background: endpoint.method === 'GET' ? 'rgba(16,185,129,0.12)' 
                          : endpoint.method === 'POST' ? 'rgba(59,130,246,0.12)'
                          : 'rgba(239,68,68,0.12)',
                        color: endpoint.method === 'GET' ? '#10B981' 
                          : endpoint.method === 'POST' ? '#3B82F6'
                          : '#EF4444',
                      }}>
                      {endpoint.method}
                    </span>
                    <code style={{ color: c.text1, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                      {endpoint.path}
                    </code>
                  </div>
                  <p style={{ color: c.text2, fontSize: 12, marginBottom: 12 }}>
                    {endpoint.description}
                  </p>

                  {/* Parameters */}
                  {endpoint.params.length > 0 && (
                    <div className="mb-3">
                      <p style={{ color: c.text3, fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
                        PARAMETERS:
                      </p>
                      <div className="space-y-2">
                        {endpoint.params.map((param, pIdx) => (
                          <div key={pIdx} className="flex items-start gap-2">
                            <code style={{ color: c.primary, fontSize: 11, fontFamily: 'monospace' }}>
                              {param.name}
                            </code>
                            <span style={{ color: c.text3, fontSize: 11 }}>
                              ({param.type}) {param.required && <strong style={{ color: '#EF4444' }}>*</strong>}
                            </span>
                            <p style={{ color: c.text3, fontSize: 10, flex: 1 }}>— {param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ color: c.text3, fontSize: 10, fontWeight: 700 }}>RESPONSE:</p>
                      <button onClick={() => handleCopy(endpoint.response)}>
                        <Copy size={14} color={c.text3} />
                      </button>
                    </div>
                    <div className="rounded-lg p-3 overflow-x-auto" style={{ background: c.surface2 }}>
                      <pre style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace', lineHeight: 1.6 }}>
                        {endpoint.response}
                      </pre>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {/* WebSocket Events */}
        {view === 'websocket' && (
          <>
            <PageSection label="WebSocket Connection">
              <TrCard className="p-4">
                <p style={{ color: c.text2, fontSize: 12, marginBottom: 8 }}>
                  Connect to real-time bot events:
                </p>
                <div className="rounded-lg p-3" style={{ background: c.surface2 }}>
                  <code style={{ color: c.primary, fontSize: 11, fontFamily: 'monospace' }}>
                    wss://ws.tradingplatform.com/bots?apiKey=YOUR_API_KEY
                  </code>
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Event Types">
              <div className="flex flex-col gap-3">
                {WEBSOCKET_EVENTS.map((event, idx) => (
                  <TrCard key={idx} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={16} color={c.primary} />
                      <code style={{ color: c.primary, fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}>
                        {event.event}
                      </code>
                    </div>
                    <p style={{ color: c.text2, fontSize: 12, marginBottom: 8 }}>
                      {event.description}
                    </p>
                    <div className="rounded-lg p-3" style={{ background: c.surface2 }}>
                      <pre style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace', lineHeight: 1.6 }}>
                        {event.payload}
                      </pre>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>
          </>
        )}

        {/* Code Examples */}
        {view === 'examples' && (
          <>
            <div className="flex gap-2 mb-4">
              {(['javascript', 'python', 'curl'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: language === lang ? c.primary : c.surface,
                    color: language === lang ? '#FFF' : c.text1,
                  }}>
                  {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'cURL'}
                </button>
              ))}
            </div>

            <PageSection label="Quick Start">
              <TrCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} color={c.primary} />
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                      {language === 'javascript' ? 'JavaScript SDK' : language === 'python' ? 'Python SDK' : 'cURL Commands'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleCopy(CODE_EXAMPLES[language])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ background: copiedCode ? 'rgba(16,185,129,0.12)' : c.surface2 }}>
                    {copiedCode ? (
                      <>
                        <CheckCircle2 size={14} color="#10B981" />
                        <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: 11 }}>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="rounded-lg p-4 overflow-x-auto" style={{ background: c.surface2 }}>
                  <pre style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace', lineHeight: 1.7 }}>
                    {CODE_EXAMPLES[language]}
                  </pre>
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {/* Rate Limits */}
        <PageSection label="Rate Limits">
          <TrCard className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: c.text2, fontSize: 12 }}>REST API:</span>
                <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>100 requests / minute</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: c.text2, fontSize: 12 }}>WebSocket:</span>
                <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Unlimited subscriptions</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: c.text2, fontSize: 12 }}>Max bots (API):</span>
                <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Enterprise tier only</span>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Authentication */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <div className="flex items-center gap-2 mb-3">
            <Key size={18} color={c.primary} />
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
              Authentication
            </p>
          </div>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, marginBottom: 8 }}>
            All API requests require an API key. Generate yours in Security Settings. Include in header:
          </p>
          <div className="rounded-lg p-3" style={{ background: c.surface }}>
            <code style={{ color: c.primary, fontSize: 11, fontFamily: 'monospace' }}>
              Authorization: Bearer YOUR_API_KEY
            </code>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}