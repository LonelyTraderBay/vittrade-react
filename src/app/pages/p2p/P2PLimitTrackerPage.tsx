/**
 * P2PLimitTrackerPage — /p2p/limit-tracker
 * CRITICAL: Real-time limit usage tracker with charts
 */

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Calendar, BarChart3, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { fmtAmount } from '../../data/formatNumber';

const USAGE_DATA = {
  daily: { used: 35_000_000, limit: 50_000_000, percentage: 70 },
  weekly: { used: 180_000_000, limit: 300_000_000, percentage: 60 },
  monthly: { used: 650_000_000, limit: 1_000_000_000, percentage: 65 },
};

const DAILY_BREAKDOWN = [
  { date: '05/03', buy: 20_000_000, sell: 15_000_000 },
  { date: '04/03', buy: 30_000_000, sell: 10_000_000 },
  { date: '03/03', buy: 25_000_000, sell: 20_000_000 },
  { date: '02/03', buy: 15_000_000, sell: 25_000_000 },
];

export function P2PLimitTrackerPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const data = USAGE_DATA[period];

  return (
    <PageLayout>
      <Header title="Limit Tracker" subtitle="Hạn mức · P2P" back />

      <div className="px-5 py-4">
        <div className="flex gap-2 mb-4">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-4 py-2 rounded-lg font-semibold text-xs flex-1"
              style={{ background: period === p ? '#3B82F6' : c.surface2, color: period === p ? '#FFFFFF' : c.text2 }}
            >
              {p === 'daily' ? 'Hôm nay' : p === 'weekly' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>

        <TrCard rounded="lg" className="p-5" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginBottom: 8 }}>Đã dùng</p>
          <h2 style={{ color: '#FFFFFF', fontSize: φ.xl, fontWeight: 700, marginBottom: 12 }}>
            {fmtAmount(data.used, 0)} VND
          </h2>
          <div className="h-2 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="h-full rounded-full" style={{ width: `${data.percentage}%`, background: '#FFFFFF' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11 }}>
            {data.percentage}% / {fmtAmount(data.limit, 0)} VND
          </p>
        </TrCard>
      </div>

      <div className="px-5 mb-4">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Lịch sử gần đây</h3>
        <div className="flex flex-col gap-2">
          {DAILY_BREAKDOWN.map((day, i) => (
            <TrCard key={i} rounded="md" className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={12} color={c.text3} />
                  <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{day.date}</p>
                </div>
                <p style={{ color: c.text3, fontSize: 11 }}>
                  Tổng: {fmtAmount((day.buy + day.sell) / 1_000_000, 0)}M
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 p-2 rounded" style={{ background: hexToRgba('#10B981', 10) }}>
                  <p style={{ color: '#10B981', fontSize: 9, marginBottom: 2 }}>MUA</p>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 700 }}>
                    {fmtAmount(day.buy / 1_000_000, 0)}M
                  </p>
                </div>
                <div className="flex-1 p-2 rounded" style={{ background: hexToRgba('#EF4444', 10) }}>
                  <p style={{ color: '#EF4444', fontSize: 9, marginBottom: 2 }}>BÁN</p>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 700 }}>
                    {fmtAmount(day.sell / 1_000_000, 0)}M
                  </p>
                </div>
              </div>
            </TrCard>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}