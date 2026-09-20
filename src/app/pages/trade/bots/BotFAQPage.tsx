import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { TabBar } from '../../../components/layout/TabBar';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';

const FAQ_CATEGORIES = {
  general: [
    {
      q: 'What is a trading bot?',
      a: 'A trading bot is an automated program that executes buy and sell orders based on predefined rules and strategies. It trades 24/7 without human intervention, following your configured parameters.',
    },
    {
      q: 'Are trading bots profitable?',
      a: 'Profitability depends on market conditions, strategy, and parameters. Bots can be profitable but are NOT guaranteed to make money. Past performance does not predict future results. You may lose some or all of your capital.',
    },
    {
      q: 'How much money do I need to start?',
      a: 'You can start with as little as $50-100 for testing. For serious trading, we recommend $500-1,000 minimum to handle market volatility and trading fees. Grid bots need more capital (splits across multiple orders).',
    },
    {
      q: 'Do I need coding skills?',
      a: 'No coding required! Our bots use a simple configuration interface. Just select strategy, set parameters (amount, price range, etc.), and start. Advanced users can use API for custom strategies.',
    },
    {
      q: 'Can I lose more than I invest?',
      a: 'No. Bots only trade with your available balance. You cannot lose more than your deposited amount. However, you can lose your entire investment if the market moves against you. Always use stop-loss limits.',
    },
  ],
  safety: [
    {
      q: 'What happens if the exchange goes down?',
      a: 'If the exchange API fails, the bot stops executing new orders until connection is restored. Open orders remain on exchange books. We recommend using exchanges with 99.9%+ uptime (Binance, Coinbase Pro).',
    },
    {
      q: 'Can hackers steal my funds?',
      a: 'We never have custody of your funds - they stay on the exchange. We only use API keys with trade permissions (not withdrawal). Enable IP whitelisting and 2FA for maximum security. Never share your API keys.',
    },
    {
      q: 'How do I stop a bot in emergency?',
      a: 'Go to Risk Dashboard → Emergency Stop, or use the stop button on bot detail page. This immediately stops new orders and optionally closes open positions. You can also delete API keys to instantly disable all bots.',
    },
    {
      q: 'What if I find a bug?',
      a: 'Use the emergency stop immediately. Report the bug to support@tradingplatform.com with screenshots and bot ID. We have insurance coverage for verified bugs causing losses (see Insurance Fund policy).',
    },
    {
      q: 'Are my API keys stored securely?',
      a: 'Yes. API keys are encrypted using AES-256 and stored in secure vaults. We use separate encryption keys per user. Keys are never logged or displayed in plain text after creation. Enable IP whitelisting for extra security.',
    },
  ],
  technical: [
    {
      q: 'How accurate is backtesting?',
      a: 'Backtests use historical data but cannot predict future performance. Expect real results to be 10-20% worse due to: slippage (1-2%), trading fees (0.1-0.5%), network delays, partial fills. Use backtests as guidelines, not guarantees.',
    },
    {
      q: 'What fees apply to bot trading?',
      a: 'Exchange trading fees (0.1-0.5% per trade) apply to every order. Our platform charges no extra fees for bot usage (Free tier: 1 bot, Pro tier: unlimited bots). High-frequency strategies can rack up fees - aim for profit > 2x fees.',
    },
    {
      q: 'Can I edit a running bot?',
      a: 'No. You must stop the bot, edit parameters, then restart. This prevents strategy corruption mid-cycle. Changes take effect on next run. For Grid bots, editing resets all grid levels (may cause losses).',
    },
    {
      q: 'Why did my order not fill?',
      a: 'Common reasons: 1) Insufficient liquidity at your limit price, 2) Price moved too fast (slippage), 3) Exchange rejected order (balance/limits), 4) Network latency. Check order history for exact error message.',
    },
    {
      q: 'What is slippage and how do I reduce it?',
      a: 'Slippage = difference between expected and actual execution price. Reduce by: 1) Trading liquid pairs (BTC/USDT, ETH/USDT), 2) Using limit orders, 3) Splitting large orders, 4) Avoiding low-volume periods.',
    },
  ],
  strategies: [
    {
      q: 'Which bot strategy is best for beginners?',
      a: 'DCA (Dollar Cost Averaging) is simplest and safest for beginners. It removes emotion, reduces timing risk, and works well long-term. Start with $100/week buying BTC or ETH. Avoid Martingale until experienced.',
    },
    {
      q: 'When should I use a Grid Bot?',
      a: 'Use Grid Bots in sideways/ranging markets (price bouncing in a channel). Best for pairs with high volatility but no clear trend. Not recommended during strong bull/bear runs (price breaks out of range).',
    },
    {
      q: 'What is the Martingale risk?',
      a: 'Martingale doubles position after each loss, requiring exponential capital. After 5 losses, you need 32x initial capital. Can blow up account if trend continues. Max drawdown can exceed -30%. Only for experts with large capital.',
    },
    {
      q: 'How do I choose the right parameters?',
      a: 'Start with recommended defaults, then adjust based on: 1) Backtest results, 2) Your risk tolerance, 3) Market conditions. Use the Optimization tool to find best parameters. Avoid over-optimizing (overfitting).',
    },
    {
      q: 'Can I run multiple bots at once?',
      a: 'Yes! Free tier: 1 bot, Pro tier: 5 bots, Enterprise: unlimited. Diversify across strategies and pairs for lower risk. Use Portfolio Dashboard to monitor correlation and avoid over-exposure.',
    },
  ],
  troubleshooting: [
    {
      q: 'My bot is losing money - what should I do?',
      a: 'First, check if losses are within expected drawdown (-10 to -20% is normal). If exceeding limits: 1) Stop the bot, 2) Review backtest results, 3) Check if market conditions changed (trending vs sideways), 4) Adjust parameters or switch strategy.',
    },
    {
      q: 'Bot stopped working after I changed settings',
      a: 'You likely have insufficient balance for new parameters. Check: 1) Wallet balance, 2) Locked funds in other bots, 3) Min/max order sizes. Reduce investment amount or deposit more funds.',
    },
    {
      q: 'Why is my Grid Bot not executing trades?',
      a: 'Grid Bots only trade when price crosses grid levels. If price is stable, no trades execute (this is normal). Check: 1) Price is within grid range, 2) Grid spacing is not too wide, 3) Sufficient liquidity.',
    },
    {
      q: 'How long should I run a bot before stopping?',
      a: 'Minimum 7 days for DCA, 30 days for Grid/Momentum. Bots need time to complete cycles. Stopping too early prevents recovery from temporary drawdowns. Check Equity Curve to see if trend is improving.',
    },
    {
      q: 'Can I transfer funds while bot is running?',
      a: 'Withdrawing funds may cause bot to stop if balance drops below minimum. Depositing is safe. Best practice: keep 20% extra buffer in wallet to handle volatility and fees.',
    },
  ],
};

export function BotFAQPage() {
  const c = useThemeColors();
  const [category, setCategory] = useState<keyof typeof FAQ_CATEGORIES>('general');
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentFAQs = FAQ_CATEGORIES[category];
  
  const filteredFAQs = searchQuery
    ? currentFAQs.filter(faq => 
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentFAQs;

  return (
    <PageLayout>
      <Header title="Trading Bots FAQ" back />

      <PageContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} color={c.text3} className="absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
            style={{ background: c.surface, color: c.text1, border: `1px solid ${c.borderSolid}` }}
          />
        </div>

        {/* Category Tabs */}
        <TabBar
          variant="pill"
          tabs={['general', 'safety', 'technical', 'strategies', 'troubleshooting']}
          active={category}
          onChange={setCategory as any}
        />

        {/* FAQ List */}
        <PageSection label={`${category.charAt(0).toUpperCase() + category.slice(1)} (${filteredFAQs.length})`}>
          {filteredFAQs.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <HelpCircle size={48} color={c.text3} />
              <p style={{ color: c.text3, fontSize: 14 }}>No FAQs found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredFAQs.map((faq, idx) => {
                const isExpanded = expandedQ === idx;
                return (
                  <TrCard key={idx} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedQ(isExpanded ? null : idx)}
                      className="w-full p-4 text-left flex items-start gap-3">
                      <HelpCircle size={20} color={c.primary} className="shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
                          {faq.q}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={20} color={c.text3} className="shrink-0" />
                      ) : (
                        <ChevronDown size={20} color={c.text3} className="shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-14">
                        <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.7 }}>
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    )}
                  </TrCard>
                );
              })}
            </div>
          )}
        </PageSection>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-4 text-center">
            <p style={{ color: c.text3, fontSize: 11 }}>Total FAQs</p>
            <p style={{ color: c.text1, fontSize: 24, fontWeight: 700 }}>
              {Object.values(FAQ_CATEGORIES).reduce((sum, cat) => sum + cat.length, 0)}
            </p>
          </TrCard>
          <TrCard className="p-4 text-center">
            <p style={{ color: c.text3, fontSize: 11 }}>Categories</p>
            <p style={{ color: c.text1, fontSize: 24, fontWeight: 700 }}>
              {Object.keys(FAQ_CATEGORIES).length}
            </p>
          </TrCard>
        </div>

        {/* Still Need Help */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
            Still need help?
          </p>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, marginBottom: 8 }}>
            Can't find your answer? Our support team is here to help 24/7.
          </p>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: c.surface2, color: c.text1 }}>
              Live Chat
            </button>
            <button className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: c.primary, color: '#FFF' }}>
              Contact Support
            </button>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}