/**
 * P2PPaymentMethodHistoryPage
 * /p2p/payment-methods/:id/history
 * CRITICAL: Transaction history using specific payment method
 */

import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { CreditCard, TrendingUp, TrendingDown, Clock, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';
import { fmtVnd } from '../../data/formatNumber';

const TRANSACTIONS = [
  { id: '1', orderId: '#45892', type: 'buy', amount: 36_000_000, status: 'completed', timestamp: '2026-03-05 14:20' },
  { id: '2', orderId: '#45880', type: 'buy', amount: 24_000_000, status: 'completed', timestamp: '2026-03-05 13:45' },
  { id: '3', orderId: '#45870', type: 'sell', amount: 16_800_000, status: 'completed', timestamp: '2026-03-04 10:30' },
  { id: '4', orderId: '#45860', type: 'buy', amount: 25_000_000, status: 'cancelled', timestamp: '2026-03-03 16:20' },
];

const STATS = {
  totalTransactions: 45,
  totalVolume: 1_250_000_000,
  successRate: 96.5,
};

export function P2PPaymentMethodHistoryPage() {
  const { id } = useParams();
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const { isRefreshing, handleRefresh } = useRefresh({
    onRefresh: async () => {
      await new Promise(res => setTimeout(res, 1000));
      if (mountedRef.current) hapticSuccess();
    },
  });

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Payment History" subtitle="Thanh toán · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>{STATS.totalTransactions}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>Giao dịch</p>
              </div>
              <div>
                <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>
                  {fmtVnd(STATS.totalVolume / 1_000_000)}M
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>Tổng khối lượng</p>
              </div>
              <div>
                <p style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700 }}>{STATS.successRate}%</p>
                <p style={{ color: c.text3, fontSize: 10 }}>Thành công</p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5 flex flex-col gap-3">
          {TRANSACTIONS.map(tx => {
            const isBuy = tx.type === 'buy';
            const Icon = isBuy ? TrendingUp : TrendingDown;
            const color = tx.status === 'completed' ? (isBuy ? '#10B981' : '#EF4444') : c.text3;

            return (
              <TrCard key={tx.id} rounded="md" className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(color, 12) }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
                        {tx.orderId}
                      </p>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: hexToRgba(color, 15), color }}>
                        {isBuy ? 'MUA' : 'BÁN'}
                      </span>
                    </div>
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>
                      {fmtVnd(tx.amount)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock size={10} color={c.text3} />
                      <p style={{ color: c.text3, fontSize: 10 }}>{tx.timestamp}</p>
                      {tx.status === 'cancelled' && (
                        <>
                          <span style={{ color: c.text3, fontSize: 10 }}>•</span>
                          <p style={{ color: c.text3, fontSize: 10 }}>Đã hủy</p>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} color={c.text3} />
                </div>
              </TrCard>
            );
          })}
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}