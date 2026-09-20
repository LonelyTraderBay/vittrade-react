import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, Zap, Clock, DollarSign, Shield, CheckCircle2 } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const RISK_CATEGORIES = [
  {
    id: 'market',
    icon: TrendingDown,
    title: 'Market Volatility Risk',
    color: '#EF4444',
    description: 'Cryptocurrency markets are extremely volatile and can move rapidly against your positions.',
    examples: [
      'Bitcoin dropped 30% in a single day during flash crashes',
      'Altcoins can lose 50-90% of value in bear markets',
      'News events can cause sudden price swings of 10-20% in minutes',
    ],
    mitigation: 'Use stop-loss orders, diversify across assets, and never invest more than you can afford to lose.',
  },
  {
    id: 'leverage',
    icon: Zap,
    title: 'Leverage & Martingale Risk',
    color: '#F59E0B',
    description: 'Strategies that increase position size (like Martingale) can amplify losses exponentially.',
    examples: [
      'Martingale can require 10x initial capital after 3-4 consecutive losses',
      'Liquidation can occur if market moves against you before recovery',
      'Compound losses can exceed total account balance',
    ],
    mitigation: 'Set strict maximum position size limits, use conservative multipliers, and monitor drawdown closely.',
  },
  {
    id: 'liquidity',
    icon: DollarSign,
    title: 'Liquidity & Slippage Risk',
    color: '#8B5CF6',
    description: 'Low liquidity markets may not execute your orders at expected prices.',
    examples: [
      'Limit orders may not fill during volatile periods',
      'Market orders can execute 2-5% worse than displayed price',
      'Large orders can move the market against you',
    ],
    mitigation: 'Trade liquid pairs (BTC/USDT, ETH/USDT), use limit orders, and split large orders into smaller chunks.',
  },
  {
    id: 'technical',
    icon: AlertTriangle,
    title: 'Technical Failure Risk',
    color: '#EF4444',
    description: 'System bugs, network issues, or exchange downtime can cause unexpected bot behavior.',
    examples: [
      'Exchange API failures can prevent bot execution',
      'Network latency can cause missed opportunities or double orders',
      'Software bugs may execute unintended trades',
    ],
    mitigation: 'Enable emergency stop alerts, monitor bot activity regularly, and test strategies in demo mode first.',
  },
  {
    id: 'timing',
    icon: Clock,
    title: 'Execution & Timing Risk',
    color: '#3B82F6',
    description: 'Delays between signal generation and order execution can reduce profitability.',
    examples: [
      'Backtest results assume instant execution (unrealistic)',
      'Real trading incurs 0.1-1 second delays affecting entry/exit prices',
      'High-frequency strategies are most sensitive to timing issues',
    ],
    mitigation: 'Account for realistic execution delays in backtests, avoid over-optimized strategies, and use VPS for stable connectivity.',
  },
  {
    id: 'regulatory',
    icon: Shield,
    title: 'Regulatory & Legal Risk',
    color: '#10B981',
    description: 'Changes in regulations may affect your ability to trade or access funds.',
    examples: [
      'Automated trading may be restricted in certain jurisdictions',
      'KYC/AML requirements can freeze withdrawals pending verification',
      'Tax reporting obligations apply to all bot trades',
    ],
    mitigation: 'Ensure compliance with local laws, keep detailed trade records, and consult a tax professional.',
  },
];

export function BotRiskDisclosurePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAcknowledge = () => {
    localStorage.setItem('bot_risk_acknowledged', new Date().toISOString());
    toast.success('Risk disclosure acknowledged');
    navigate('/trade/bots/suitability');
  };

  return (
    <PageLayout>
      <Header title="Risk Disclosure" back />

      <PageContent>
        {/* Critical Warning Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.3)' }}>
          <div className="flex gap-3">
            <AlertTriangle size={24} color="#EF4444" className="shrink-0" />
            <div>
              <p style={{ color: '#EF4444', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                HIGH RISK WARNING
              </p>
              <p style={{ color: c.text1, fontSize: 13, lineHeight: 1.7 }}>
                Trading Bots are <strong>complex financial products</strong> involving significant risk of loss. 
                You may lose your entire investment. Only use capital you can afford to lose completely.
              </p>
            </div>
          </div>
        </div>

        {/* Past Performance Disclaimer */}
        <TrCard className="p-4">
          <div className="flex gap-3">
            <TrendingDown size={20} color={c.text3} className="shrink-0 mt-1" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                Past Performance Disclaimer
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Backtest results and historical performance <strong>do not guarantee future results</strong>. 
                Market conditions change, and strategies that worked in the past may fail in the future. 
                Always assume actual performance will be worse than backtests due to slippage, fees, and execution delays.
              </p>
            </div>
          </div>
        </TrCard>

        {/* Risk Categories */}
        <PageSection label="Risk Categories">
          <div className="flex flex-col gap-3">
            {RISK_CATEGORIES.map(risk => (
              <TrCard key={risk.id} className="p-4">
                <div className="flex gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${risk.color}15` }}>
                    <risk.icon size={24} color={risk.color} />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: risk.color, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                      {risk.title}
                    </p>
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                      {risk.description}
                    </p>
                  </div>
                </div>

                {/* Examples */}
                <div className="mb-3">
                  <p style={{ color: c.text3, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    REAL EXAMPLES:
                  </p>
                  <ul className="space-y-2">
                    {risk.examples.map((example, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span style={{ color: c.text3, fontSize: 20, lineHeight: 1 }}>•</span>
                        <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{example}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mitigation */}
                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
                    HOW TO MITIGATE:
                  </p>
                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                    {risk.mitigation}
                  </p>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Additional Warnings */}
        <PageSection label="Additional Warnings">
          <TrCard className="p-4">
            <div className="space-y-3">
              {[
                {
                  title: 'No Guarantee of Profit',
                  text: 'Bots can lose money consistently. A strategy that works in backtests may fail in live trading due to changing market conditions.',
                },
                {
                  title: 'Fees Compound Losses',
                  text: 'Every trade incurs exchange fees (0.1-0.5%). High-frequency bots can lose money purely from fees even if price moves are neutral.',
                },
                {
                  title: 'Market Manipulation',
                  text: 'Cryptocurrency markets are less regulated and more susceptible to manipulation, wash trading, and pump-and-dump schemes.',
                },
                {
                  title: 'Account Liquidation',
                  text: 'If using margin or leverage, your entire account can be liquidated if the market moves against you before stop-loss triggers.',
                },
                {
                  title: 'No Recourse for Losses',
                  text: 'Unlike traditional finance, crypto trading is largely uninsured. Lost funds cannot be recovered through deposit insurance schemes.',
                },
              ].map((warning, idx) => (
                <div key={idx} className="pb-3 border-b last:border-b-0" style={{ borderColor: c.borderSolid }}>
                  <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    ⚠️ {warning.title}
                  </p>
                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                    {warning.text}
                  </p>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Regulatory Compliance */}
        <PageSection label="Regulatory Notice">
          <TrCard className="p-4">
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              MiFID II / ESMA / SEC Compliance
            </p>
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
              Trading Bots are classified as <strong>complex financial products</strong> under European (MiFID II) 
              and US (SEC) regulations. You must complete an appropriateness assessment to ensure you understand 
              the risks before using this service.
            </p>
            <div className="space-y-2">
              {[
                'EU residents: Subject to ESMA leverage limits and negative balance protection',
                'US residents: May be restricted based on accredited investor status',
                'UK residents: FCA appropriateness test required for complex products',
              ].map((note, idx) => (
                <div key={idx} className="flex gap-2">
                  <span style={{ color: c.text3 }}>•</span>
                  <p style={{ color: c.text3, fontSize: 12 }}>{note}</p>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Acknowledgment */}
        <PageSection label="Acknowledgment">
          <button 
            onClick={() => setAcknowledged(!acknowledged)} 
            className="flex items-start gap-3 w-full text-left p-4 rounded-xl"
            style={{ background: c.surface2 }}>
            <div className="w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-1"
              style={{ 
                borderColor: acknowledged ? '#EF4444' : c.borderSolid, 
                background: acknowledged ? '#EF4444' : 'transparent',
              }}>
              {acknowledged && <CheckCircle2 size={16} color="#FFF" />}
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                I acknowledge and accept all risks disclosed above
              </p>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                I understand that Trading Bots are high-risk, I may lose my entire investment, and past performance 
                does not guarantee future results. I accept full responsibility for my trading decisions.
              </p>
            </div>
          </button>
        </PageSection>

        {/* CTA */}
        <button
          onClick={handleAcknowledge}
          disabled={!acknowledged}
          className="w-full py-3 rounded-[14px] text-sm font-semibold"
          style={{
            background: acknowledged ? '#EF4444' : c.surface2,
            color: acknowledged ? '#FFF' : c.text3,
            cursor: acknowledged ? 'pointer' : 'not-allowed',
          }}>
          {acknowledged ? 'I Understand the Risks - Continue' : 'Acknowledge Risks to Continue'}
        </button>

        {/* Help */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Need Help Understanding Risks?
          </p>
          <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
            If you don't fully understand these risks, we recommend consulting a financial advisor before proceeding.
          </p>
          <button className="text-xs font-semibold" style={{ color: c.primary }}>
            View Risk Education Guide →
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}