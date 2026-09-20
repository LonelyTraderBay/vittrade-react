import React from 'react';
import { Wallet, TrendingUp, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router';

const PORTFOLIO_DATA = {
  totalEquity: 3245,
  totalInvestment: 2500,
  totalPnL: 745,
  pnlPercent: 29.8,
  portfolioSharpe: 1.92,
  diversificationScore: 78,
  activeBots: 3,
  totalTrades: 479,
};

const ALLOCATION_DATA = [
  { strategy: 'DCA', value: 1000, pnl: 84, color: '#3B82F6' },
  { strategy: 'Grid', value: 500, pnl: 127, color: '#F59E0B' },
  { strategy: 'Momentum', value: 500, pnl: -12, color: '#10B981' },
  { strategy: 'Cash Reserve', value: 1245, pnl: 0, color: c => c.text3 },
];

const PORTFOLIO_EQUITY = [
  { date: 'Sep', equity: 2500 },
  { date: 'Oct', equity: 2587 },
  { date: 'Nov', equity: 2734 },
  { date: 'Dec', equity: 2898 },
  { date: 'Jan', equity: 3045 },
  { date: 'Feb', equity: 3178 },
  { date: 'Mar', equity: 3245 },
];

const CORRELATION_MATRIX = [
  { bot: 'DCA', dca: 1, grid: 0.34, momentum: 0.12 },
  { bot: 'Grid', dca: 0.34, grid: 1, momentum: -0.08 },
  { bot: 'Momentum', dca: 0.12, grid: -0.08, momentum: 1 },
];

export function BotPortfolioDashboardPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  return (
    <PageLayout>
      <Header title="Portfolio Dashboard" back />

      <PageContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-4">
            <Wallet size={20} color={c.primary} className="mb-2" />
            <p style={{ color: c.text3, fontSize: 11 }}>Total Equity</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
              ${PORTFOLIO_DATA.totalEquity.toLocaleString()}
            </p>
          </TrCard>
          <TrCard className="p-4">
            <TrendingUp size={20} color="#10B981" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 11 }}>Total PnL</p>
            <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
              +${PORTFOLIO_DATA.totalPnL}
            </p>
            <p style={{ color: '#10B981', fontSize: 11 }}>+{PORTFOLIO_DATA.pnlPercent}%</p>
          </TrCard>
          <TrCard className="p-4">
            <Activity size={20} color={c.primary} className="mb-2" />
            <p style={{ color: c.text3, fontSize: 11 }}>Portfolio Sharpe</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
              {PORTFOLIO_DATA.portfolioSharpe}
            </p>
            <p style={{ color: '#10B981', fontSize: 11 }}>Excellent</p>
          </TrCard>
          <TrCard className="p-4">
            <PieChartIcon size={20} color="#F59E0B" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 11 }}>Diversification</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
              {PORTFOLIO_DATA.diversificationScore}/100
            </p>
            <p style={{ color: '#F59E0B', fontSize: 11 }}>Good</p>
          </TrCard>
        </div>

        {/* Portfolio Equity */}
        <PageSection label="Portfolio Equity Curve">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={PORTFOLIO_EQUITY}>
                <XAxis key="x-axis" dataKey="date" stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} />
                <YAxis key="y-axis" stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                  formatter={(value: any) => [`$${value}`, 'Equity']}
                />
                <Line key="line-equity" type="monotone" dataKey="equity" stroke="#10B981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>

        {/* Allocation Pie */}
        <PageSection label="Allocation Breakdown">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ALLOCATION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value">
                  {ALLOCATION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={typeof entry.color === 'function' ? entry.color(c) : entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                  formatter={(value: any) => [`$${value}`, 'Value']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {ALLOCATION_DATA.map(item => (
                <div key={item.strategy} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: typeof item.color === 'function' ? item.color(c) : item.color }} />
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{item.strategy}</p>
                    <p style={{ color: c.text3, fontSize: 9 }}>${item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Bot Correlation Matrix */}
        <PageSection label="Bot Correlation Matrix">
          <TrCard className="p-4">
            <table className="w-full">
              <thead>
                <tr>
                  <th style={{ color: c.text3, fontSize: 10, textAlign: 'left', paddingBottom: 8 }}>Bot</th>
                  {CORRELATION_MATRIX.map(row => (
                    <th key={row.bot} style={{ color: c.text3, fontSize: 10, textAlign: 'center', paddingBottom: 8 }}>
                      {row.bot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CORRELATION_MATRIX.map(row => (
                  <tr key={row.bot}>
                    <td style={{ color: c.text1, fontSize: 11, fontWeight: 600, paddingTop: 6, paddingBottom: 6 }}>
                      {row.bot}
                    </td>
                    {Object.entries(row).filter(([key]) => key !== 'bot').map(([key, val]) => {
                      const color = Math.abs(val) < 0.2 ? '#10B981' : Math.abs(val) < 0.5 ? '#F59E0B' : '#EF4444';
                      return (
                        <td key={key} style={{ textAlign: 'center', paddingTop: 6, paddingBottom: 6 }}>
                          <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: `${color}15`, color }}>
                            {val.toFixed(2)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ color: c.text3, fontSize: 10, marginTop: 12, textAlign: 'center' }}>
              Low correlation (&lt;0.2) = Good diversification 🟢
            </p>
          </TrCard>
        </PageSection>

        {/* Recommendations */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
            ✅ Portfolio Health: Excellent
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span style={{ color: c.text3 }}>•</span>
              <p style={{ color: c.text2, fontSize: 11 }}>Strong diversification (correlation &lt; 0.4)</p>
            </li>
            <li className="flex gap-2">
              <span style={{ color: c.text3 }}>•</span>
              <p style={{ color: c.text2, fontSize: 11 }}>Healthy cash reserve (38% allocation)</p>
            </li>
            <li className="flex gap-2">
              <span style={{ color: c.text3 }}>•</span>
              <p style={{ color: c.text2, fontSize: 11 }}>Portfolio Sharpe above 1.5 (excellent risk-adjusted returns)</p>
            </li>
          </ul>
        </div>
      </PageContent>
    </PageLayout>
  );
}