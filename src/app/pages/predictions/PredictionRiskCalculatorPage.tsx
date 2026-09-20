/**
 * ══════════════════════════════════════════════════════════════
 *  PredictionRiskCalculatorPage — Prediction Markets Feature 1/4
 * ══════════════════════════════════════════════════════════════
 *  Risk calculation for prediction positions: max loss/gain,
 *  probability analysis, position sizing recommendations
 *  Pattern B — Page with Tabs (Calculator/Scenarios/Guide)
 *  Compliance: §9.4 Trade Safety, §9.6 No hype copy
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
  Calculator, TrendingUp, TrendingDown, AlertTriangle, Info,
  DollarSign, Percent, Target, BarChart3, Shield,
} from 'lucide-react';

const TABS = ['May tinh', 'Kich ban', 'Huong dan'] as const;
type Tab = typeof TABS[number];

interface RiskMetrics {
  maxLoss: number;
  maxGain: number;
  breakEvenPrice: number;
  probabilityOfProfit: number;
  expectedValue: number;
  riskRewardRatio: number;
  kellyBetSize: number;
}

export function PredictionRiskCalculatorPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('May tinh');

  // Calculator inputs
  const [eventName, setEventName] = useState('BTC > $100K by Dec 2026?');
  const [outcome, setOutcome] = useState<'yes' | 'no'>('yes');
  const [shares, setShares] = useState('100');
  const [entryPrice, setEntryPrice] = useState('0.65');
  const [currentPrice, setCurrentPrice] = useState('0.68');
  const [bankroll, setBankroll] = useState('10000');

  const calculateMetrics = (): RiskMetrics => {
    const sh = parseFloat(shares) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const current = parseFloat(currentPrice) || 0;
    const bank = parseFloat(bankroll) || 1;

    const cost = sh * entry;
    const maxLoss = cost;
    const maxGain = sh * (1 - entry);
    const breakEvenPrice = entry;
    const currentValue = sh * current;
    const unrealizedPnL = currentValue - cost;

    // Simple probability estimate from price
    const probabilityOfProfit = current * 100;

    // Expected value: (prob_win * max_gain) - (prob_loss * max_loss)
    const expectedValue = (current * maxGain) - ((1 - current) * maxLoss);

    // Risk/Reward ratio
    const riskRewardRatio = maxLoss > 0 ? maxGain / maxLoss : 0;

    // Kelly criterion for optimal bet size: (p*b - q) / b
    // where p = probability of win, q = 1-p, b = odds (max_gain / max_loss)
    const kellyFraction = riskRewardRatio > 0
      ? (current * riskRewardRatio - (1 - current)) / riskRewardRatio
      : 0;
    const kellyBetSize = Math.max(0, Math.min(1, kellyFraction)) * bank;

    return {
      maxLoss,
      maxGain,
      breakEvenPrice,
      probabilityOfProfit,
      expectedValue,
      riskRewardRatio,
      kellyBetSize,
    };
  };

  const metrics = calculateMetrics();
  const cost = parseFloat(shares) * parseFloat(entryPrice);
  const currentValue = parseFloat(shares) * parseFloat(currentPrice);
  const unrealizedPnL = currentValue - cost;
  const pnlPercent = cost > 0 ? (unrealizedPnL / cost) * 100 : 0;

  return (
    <PageLayout>
      <Header title="Risk Calculator" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'May tinh' && (
          <>
            {/* Input Section */}
            <PageSection label="Thong tin vi the">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Event
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Event name..."
                    className="w-full px-4 py-2.5 rounded-xl outline-none"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                  />
                </div>

                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Outcome
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['yes', 'no'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setOutcome(opt)}
                        className="py-2.5 rounded-xl transition-all"
                        style={{
                          background: outcome === opt ? (opt === 'yes' ? c.buy : c.sell) : c.bg,
                          color: outcome === opt ? '#fff' : c.text1,
                          border: `1px solid ${outcome === opt ? 'transparent' : c.border}`,
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {opt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                      Shares
                    </label>
                    <input
                      type="text"
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl outline-none"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                      Entry Price ($)
                    </label>
                    <input
                      type="text"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-xl outline-none"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                      Current Price ($)
                    </label>
                    <input
                      type="text"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-xl outline-none"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                      Total Bankroll ($)
                    </label>
                    <input
                      type="text"
                      value={bankroll}
                      onChange={(e) => setBankroll(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl outline-none"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>
            </PageSection>

            {/* Position Summary */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Position Summary
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Cost</p>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                    ${cost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Current Value</p>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                    ${currentValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Unrealized P/L</p>
                  <p
                    style={{
                      color: unrealizedPnL >= 0 ? c.buy : c.sell,
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>P/L %</p>
                  <p
                    style={{
                      color: pnlPercent >= 0 ? c.buy : c.sell,
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <PageSection label="Risk Analysis">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="space-y-4">
                  {/* Max Loss */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} color={c.sell} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Max Loss</p>
                    </div>
                    <p style={{ color: c.sell, fontSize: 15, fontWeight: 700 }}>
                      ${metrics.maxLoss.toFixed(2)}
                    </p>
                  </div>

                  {/* Max Gain */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} color={c.buy} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Max Gain</p>
                    </div>
                    <p style={{ color: c.buy, fontSize: 15, fontWeight: 700 }}>
                      ${metrics.maxGain.toFixed(2)}
                    </p>
                  </div>

                  {/* Break-even */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target size={16} color={c.text3} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Break-even Price</p>
                    </div>
                    <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                      ${metrics.breakEvenPrice.toFixed(2)}
                    </p>
                  </div>

                  {/* Probability of Profit */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent size={16} color={c.primary} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Implied Probability</p>
                    </div>
                    <p style={{ color: c.primary, fontSize: 15, fontWeight: 700 }}>
                      {metrics.probabilityOfProfit.toFixed(1)}%
                    </p>
                  </div>

                  {/* Expected Value */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} color={c.text3} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Expected Value</p>
                    </div>
                    <p
                      style={{
                        color: metrics.expectedValue >= 0 ? c.buy : c.sell,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      {metrics.expectedValue >= 0 ? '+' : ''}${metrics.expectedValue.toFixed(2)}
                    </p>
                  </div>

                  {/* Risk/Reward Ratio */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={16} color={c.text3} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Risk/Reward Ratio</p>
                    </div>
                    <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                      1:{metrics.riskRewardRatio.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </PageSection>

            {/* Position Sizing */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <div className="flex items-start gap-2 mb-3">
                <Shield size={16} color={c.primary} style={{ marginTop: 2 }} />
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Kelly Criterion Recommendation
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Optimal bet size based on bankroll and edge
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p style={{ color: c.primary, fontSize: 20, fontWeight: 700 }}>
                  ${metrics.kellyBetSize.toFixed(2)}
                </p>
                <p style={{ color: c.text3, fontSize: 12 }}>
                  ({((metrics.kellyBetSize / parseFloat(bankroll)) * 100).toFixed(1)}% of bankroll)
                </p>
              </div>
            </div>

            {/* Warning */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <AlertTriangle size={14} color={c.warn} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Phan tich rui ro chi mang tinh tham khao. Ket qua thuc te co the khac. Luon quan ly von than trong.
              </p>
            </div>
          </>
        )}

        {tab === 'Kich ban' && (
          <>
            <PageSection label="Scenarios Analysis">
              {[
                { outcome: 'Win (YES resolves)', payout: parseFloat(shares) * 1, probability: parseFloat(currentPrice) * 100 },
                { outcome: 'Loss (NO resolves)', payout: 0, probability: (1 - parseFloat(currentPrice)) * 100 },
              ].map((scenario, idx) => {
                const profit = scenario.payout - cost;
                const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{scenario.outcome}</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          Implied probability: {scenario.probability.toFixed(1)}%
                        </p>
                      </div>
                      {idx === 0 ? (
                        <TrendingUp size={20} color={c.buy} />
                      ) : (
                        <TrendingDown size={20} color={c.sell} />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Payout</p>
                        <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                          ${scenario.payout.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Profit/Loss</p>
                        <p
                          style={{
                            color: profit >= 0 ? c.buy : c.sell,
                            fontSize: 15,
                            fontWeight: 700,
                          }}
                        >
                          {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Return</p>
                        <p
                          style={{
                            color: profitPercent >= 0 ? c.buy : c.sell,
                            fontSize: 15,
                            fontWeight: 700,
                          }}
                        >
                          {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </PageSection>

            {/* Expected Value Breakdown */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Expected Value Calculation
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p style={{ color: c.text3, fontSize: 12 }}>Win EV</p>
                  <p style={{ color: c.buy, fontSize: 13, fontWeight: 600 }}>
                    ${(parseFloat(currentPrice) * metrics.maxGain).toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p style={{ color: c.text3, fontSize: 12 }}>Loss EV</p>
                  <p style={{ color: c.sell, fontSize: 13, fontWeight: 600 }}>
                    -${((1 - parseFloat(currentPrice)) * metrics.maxLoss).toFixed(2)}
                  </p>
                </div>
                <div
                  className="flex justify-between pt-2"
                  style={{ borderTop: `1px solid ${c.border}` }}
                >
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Net Expected Value</p>
                  <p
                    style={{
                      color: metrics.expectedValue >= 0 ? c.buy : c.sell,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {metrics.expectedValue >= 0 ? '+' : ''}${metrics.expectedValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'Huong dan' && (
          <>
            <PageSection label="How to Use">
              <div
                className="rounded-xl p-3 space-y-3"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    1. Input Position Details
                  </p>
                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                    Nhap thong tin vi the: event, outcome, so luong shares, gia entry va current
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    2. Review Risk Metrics
                  </p>
                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                    Xem phan tich rui ro: max loss/gain, break-even, expected value
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    3. Check Position Sizing
                  </p>
                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                    Tham khao Kelly criterion de xac dinh kich thuoc vi the toi uu
                  </p>
                </div>
              </div>
            </PageSection>

            <PageSection label="Key Concepts">
              <div className="space-y-2">
                {[
                  {
                    term: 'Max Loss',
                    definition: 'So tien toi da co the mat neu outcome khong xay ra (= chi phi mua shares)',
                  },
                  {
                    term: 'Max Gain',
                    definition: 'Loi nhuan toi da neu outcome xay ra (= shares × (1 - entry_price))',
                  },
                  {
                    term: 'Expected Value',
                    definition: 'Gia tri ky vong cua vi the, tinh theo xac suat. EV > 0 cho thay co edge.',
                  },
                  {
                    term: 'Kelly Criterion',
                    definition: 'Cong thuc tinh kich thuoc bet toi uu de tang truong von dai han.',
                  },
                ].map((item) => (
                  <div
                    key={item.term}
                    className="rounded-xl p-3"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      {item.term}
                    </p>
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                      {item.definition}
                    </p>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Disclaimer - §9.6 compliance */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <Info size={14} color={c.sell} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Cong cu tinh toan chi la tham khao. Khong dam bao ket qua. Probability khong phai la certainty.
                Luon quan ly rui ro va chi dau tu so tien co the chap nhan mat.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}