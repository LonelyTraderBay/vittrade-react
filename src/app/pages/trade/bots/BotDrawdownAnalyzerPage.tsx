import React from 'react';
import { TrendingDown, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

const UNDERWATER_DATA = [
  { date: '2025-09-01', underwater: 0 },
  { date: '2025-09-15', underwater: -2.3 },
  { date: '2025-10-01', underwater: 0 },
  { date: '2025-10-15', underwater: -4.5 },
  { date: '2025-10-30', underwater: -8.2 },
  { date: '2025-11-10', underwater: 0 },
  { date: '2025-11-25', underwater: -3.1 },
  { date: '2025-12-05', underwater: 0 },
  { date: '2025-12-20', underwater: -6.7 },
  { date: '2026-01-05', underwater: -10.3 },
  { date: '2026-01-20', underwater: 0 },
  { date: '2026-02-01', underwater: -2.8 },
  { date: '2026-02-15', underwater: 0 },
  { date: '2026-03-01', underwater: -5.4 },
  { date: '2026-03-08', underwater: -3.2 },
];

const DD_DURATION_DATA = [
  { range: '<1 week', count: 8 },
  { range: '1-2 weeks', count: 5 },
  { range: '2-4 weeks', count: 3 },
  { range: '>1 month', count: 1 },
];

const DD_EVENTS = [
  { id: 1, start: '2025-09-10', end: '2025-09-30', depth: -2.3, duration: '20 days', recovery: '21 days' },
  { id: 2, start: '2025-10-10', end: '2025-11-08', depth: -8.2, duration: '29 days', recovery: '2 days' },
  { id: 3, start: '2025-11-20', end: '2025-12-03', depth: -3.1, duration: '13 days', recovery: '2 days' },
  { id: 4, start: '2025-12-15', end: '2026-01-18', depth: -10.3, duration: '34 days', recovery: '2 days' },
  { id: 5, start: '2026-02-28', end: '2026-03-08', depth: -5.4, duration: '8 days', recovery: 'Ongoing' },
];

export function BotDrawdownAnalyzerPage() {
  const c = useThemeColors();

  const maxDD = Math.min(...UNDERWATER_DATA.map(d => d.underwater));
  const avgDD = UNDERWATER_DATA.filter(d => d.underwater < 0).reduce((sum, d) => sum + d.underwater, 0) / UNDERWATER_DATA.filter(d => d.underwater < 0).length;
  const ddDays = UNDERWATER_DATA.filter(d => d.underwater < 0).length;
  const totalDays = UNDERWATER_DATA.length;

  return (
    <PageLayout>
      <Header title="Drawdown Analyzer" back />

      <PageContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-4">
            <TrendingDown size={20} color="#EF4444" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 11 }}>Max Drawdown</p>
            <p style={{ color: '#EF4444', fontSize: 20, fontWeight: 700 }}>{maxDD}%</p>
          </TrCard>
          <TrCard className="p-4">
            <BarChart3 size={20} color="#F59E0B" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 11 }}>Avg Drawdown</p>
            <p style={{ color: '#F59E0B', fontSize: 20, fontWeight: 700 }}>{avgDD.toFixed(1)}%</p>
          </TrCard>
          <TrCard className="p-4">
            <Clock size={20} color={c.primary} className="mb-2" />
            <p style={{ color: c.text3, fontSize: 11 }}>Drawdown Days</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{ddDays}</p>
            <p style={{ color: c.text3, fontSize: 11 }}>of {totalDays} days</p>
          </TrCard>
          <TrCard className="p-4">
            <AlertTriangle size={20} color="#10B981" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 11 }}>DD Frequency</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>5</p>
            <p style={{ color: c.text3, fontSize: 11 }}>events</p>
          </TrCard>
        </div>

        {/* Underwater Equity Chart */}
        <PageSection label="Underwater Equity">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={UNDERWATER_DATA}>
                <defs key="gradient-defs">
                  <linearGradient id="uwGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  key="x-axis-dd"
                  dataKey="date" 
                  stroke={c.text3} 
                  style={{ fontSize: 9 }}
                  tickLine={false}
                  tickFormatter={val => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis 
                  key="y-axis-dd"
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={val => `${val}%`}
                />
                <Tooltip
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                  formatter={(value: any) => [`${value}%`, 'Drawdown']}
                />
                <Area 
                  key="area-dd"
                  type="monotone" 
                  dataKey="underwater" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fill="url(#uwGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            <p style={{ color: c.text3, fontSize: 10, textAlign: 'center', marginTop: 8 }}>
              Below zero = in drawdown (underwater)
            </p>
          </TrCard>
        </PageSection>

        {/* Duration Histogram */}
        <PageSection label="Drawdown Duration Distribution">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={DD_DURATION_DATA}>
                <XAxis 
                  key="x-axis-dur"
                  dataKey="range" 
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis 
                  key="y-axis-dur"
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                  formatter={(value: any) => [`${value} events`, 'Count']}
                />
                <Bar key="bar-count" dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>

        {/* Drawdown Events */}
        <PageSection label="Major Drawdown Events">
          <div className="flex flex-col gap-2">
            {DD_EVENTS.map((event, idx) => (
              <TrCard key={event.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ color: c.text3, fontSize: 11 }}>Event #{idx + 1}</span>
                    {Math.abs(event.depth) > 8 && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                        Severe
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#EF4444', fontSize: 16, fontWeight: 700 }}>{event.depth}%</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 9 }}>Start</p>
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                      {new Date(event.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 9 }}>Duration</p>
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{event.duration}</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 9 }}>Recovery</p>
                    <p style={{ color: event.recovery === 'Ongoing' ? '#F59E0B' : '#10B981', fontSize: 11, fontWeight: 600 }}>
                      {event.recovery}
                    </p>
                  </div>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Analysis */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            Drawdown Analysis
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span style={{ color: '#10B981' }}>✓</span>
              <p style={{ color: c.text2, fontSize: 11 }}>Max drawdown (-10.3%) is within acceptable range (&lt;15%)</p>
            </li>
            <li className="flex gap-2">
              <span style={{ color: '#10B981' }}>✓</span>
              <p style={{ color: c.text2, fontSize: 11 }}>Average recovery time is short (2-21 days)</p>
            </li>
            <li className="flex gap-2">
              <span style={{ color: '#F59E0B' }}>!</span>
              <p style={{ color: c.text2, fontSize: 11 }}>Currently in drawdown (-3.2%), monitor closely</p>
            </li>
            <li className="flex gap-2">
              <span style={{ color: '#10B981' }}>✓</span>
              <p style={{ color: c.text2, fontSize: 11 }}>Most drawdowns are short-term (&lt;1 week)</p>
            </li>
          </ul>
        </div>
      </PageContent>
    </PageLayout>
  );
}