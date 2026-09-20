import React, { useState } from 'react';
import { Calculator, TrendingUp, AlertTriangle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export function StakingRiskScoreCalculatorPage() {
  const c = useThemeColors();
  const [amount, setAmount] = useState('10000');
  const [duration, setDuration] = useState('flexible');
  const [asset, setAsset] = useState('ETH');
  const [diversification, setDiversification] = useState(3);

  const calculateRisk = () => {
    let score = 0;
    if (parseFloat(amount) > 50000) score += 20;
    else if (parseFloat(amount) > 10000) score += 10;
    if (duration === 'fixed-180') score += 15;
    else if (duration === 'fixed-90') score += 10;
    if (asset === 'SOL') score += 15;
    else if (asset === 'ETH') score += 5;
    if (diversification < 3) score += 20;
    return score;
  };

  const riskScore = calculateRisk();
  const riskLabel =
    riskScore < 25 ? 'Low Risk' :
    riskScore < 50 ? 'Moderate Risk' :
    riskScore < 75 ? 'High Risk' : 'Critical Risk';
  const riskColor =
    riskScore < 25 ? '#10B981' :
    riskScore < 50 ? '#F59E0B' :
    riskScore < 75 ? '#F97316' : '#EF4444';

  const radarData = [
    { subject: 'Amount', value: parseFloat(amount) > 50000 ? 80 : parseFloat(amount) > 10000 ? 40 : 20, fullMark: 100 },
    { subject: 'Duration', value: duration === 'fixed-180' ? 75 : duration === 'fixed-90' ? 50 : 25, fullMark: 100 },
    { subject: 'Asset Volatility', value: asset === 'SOL' ? 75 : asset === 'ETH' ? 45 : 20, fullMark: 100 },
    { subject: 'Diversification', value: diversification < 3 ? 80 : diversification < 5 ? 40 : 20, fullMark: 100 },
    { subject: 'Market Risk', value: 45, fullMark: 100 },
  ];

  return (
    <PageLayout variant="flush">
      <Header title="Risk Calculator" back />

      <PageContent grow padding="relaxed">
        {/* Input Form */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Scenario Inputs
          </p>

          <div className="space-y-4">
            <div>
              <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>
                Stake Amount (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-3 rounded-xl text-sm"
                style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}
              />
            </div>

            <div>
              <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>
                Asset
              </label>
              <select
                value={asset}
                onChange={e => setAsset(e.target.value)}
                className="w-full p-3 rounded-xl text-sm"
                style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}>
                <option value="USDT">USDT (Stablecoin)</option>
                <option value="BTC">BTC (Low Volatility)</option>
                <option value="ETH">ETH (Medium Volatility)</option>
                <option value="SOL">SOL (High Volatility)</option>
              </select>
            </div>

            <div>
              <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>
                Lock-up Period
              </label>
              <select
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full p-3 rounded-xl text-sm"
                style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}>
                <option value="flexible">Flexible (No lock)</option>
                <option value="fixed-30">Fixed 30 Days</option>
                <option value="fixed-60">Fixed 60 Days</option>
                <option value="fixed-90">Fixed 90 Days</option>
                <option value="fixed-180">Fixed 180 Days</option>
              </select>
            </div>

            <div>
              <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>
                Number of Validators: {diversification}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={diversification}
                onChange={e => setDiversification(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${c.primary} 0%, ${c.primary} ${(diversification - 1) / 9 * 100}%, ${c.surface2} ${(diversification - 1) / 9 * 100}%, ${c.surface2} 100%)`,
                }}
              />
            </div>
          </div>
        </TrCard>

        {/* Risk Score Result */}
        <TrCard className="p-5">
          <div className="text-center mb-4">
            <p style={{ color: c.text3, fontSize: 12, marginBottom: 8 }}>Calculated Risk Score</p>
            <div
              className="w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ background: `${riskColor}22`, border: `4px solid ${riskColor}` }}>
              <div>
                <p style={{ color: riskColor, fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                  {riskScore}
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>/ 100</p>
              </div>
            </div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: `${riskColor}22` }}>
              <AlertTriangle size={16} color={riskColor} />
              <p style={{ color: riskColor, fontSize: 14, fontWeight: 700 }}>
                {riskLabel}
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid key="polar-grid" stroke={c.borderSolid} />
              <PolarAngleAxis key="polar-angle" dataKey="subject" tick={{ fill: c.text3, fontSize: 10 }} />
              <Radar key="radar" name="Risk Profile" dataKey="value" stroke={riskColor} fill={riskColor} fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </TrCard>

        {/* Recommendations */}
        <PageSection label="Recommendations">
          <div className="flex flex-col gap-2">
            {riskScore >= 50 && (
              <TrCard className="p-3" style={{ background: 'rgba(245,158,11,0.08)' }}>
                <p style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  ⚠️ Consider Reducing Risk
                </p>
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Diversify across more validators or reduce lock-up duration.
                </p>
              </TrCard>
            )}
            {parseFloat(amount) > 50000 && (
              <TrCard className="p-3" style={{ background: 'rgba(59,130,246,0.08)' }}>
                <p style={{ color: '#3B82F6', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  💡 Large Position
                </p>
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Consider splitting across multiple products.
                </p>
              </TrCard>
            )}
            {riskScore < 25 && (
              <TrCard className="p-3" style={{ background: 'rgba(16,185,129,0.08)' }}>
                <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  ✅ Well-Balanced Portfolio
                </p>
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Your scenario has low risk. Good diversification!
                </p>
              </TrCard>
            )}
          </div>
        </PageSection>
      </PageContent>

      <StickyFooter>
        <button
          className="w-full py-3 rounded-[14px] text-sm font-semibold"
          style={{ background: c.primary, color: '#FFF' }}>
          Proceed with This Configuration
        </button>
      </StickyFooter>
    </PageLayout>
  );
}