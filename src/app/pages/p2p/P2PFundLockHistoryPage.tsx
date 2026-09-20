/**
 * P2PFundLockHistoryPage — /p2p/wallet/fund-locks
 * CRITICAL: History of all fund locks/unlocks
 */

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Clock, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';
import { fmtAmount, fmtVnd } from '../../data/formatNumber';

const HISTORY = [
  { id: '1', type: 'lock', asset: 'USDT', amount: 1500, reason: 'Order #45892 created', timestamp: '2026-03-05 14:20' },
  { id: '2', type: 'unlock', asset: 'USDT', amount: 1000, reason: 'Order #45880 completed', timestamp: '2026-03-05 13:45' },
  { id: '3', type: 'lock', asset: 'BTC', amount: 0.01, reason: 'Order #45870 created', timestamp: '2026-03-05 10:30' },
  { id: '4', type: 'unlock', asset: 'VND', amount: 12000000, reason: 'Order #45850 released', timestamp: '2026-03-04 16:20' },
];

export function P2PFundLockHistoryPage() {
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

  const formatAmount = (asset: string, amount: number) => {
    if (asset === 'BTC') return fmtAmount(amount, 8);
    if (asset === 'VND') return fmtVnd(amount);
    return fmtAmount(amount, 2);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Fund Lock History" subtitle="Escrow · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Lock size={24} color="#FFFFFF" />
              </div>
              <div className="flex-1">
                <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                  Lịch sử khóa tiền
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>
                  {HISTORY.length} giao dịch gần đây
                </p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5 flex flex-col gap-3">
          {HISTORY.map(item => {
            const isLock = item.type === 'lock';
            const Icon = isLock ? Lock : Unlock;
            const color = isLock ? '#F59E0B' : '#10B981';

            return (
              <TrCard key={item.id} rounded="md" className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(color, 12) }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                        {formatAmount(item.asset, item.amount)} {item.asset}
                      </p>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: hexToRgba(color, 15), color }}>
                        {isLock ? 'Khóa' : 'Mở'}
                      </span>
                    </div>
                    <p style={{ color: c.text2, fontSize: 11, marginBottom: 4 }}>{item.reason}</p>
                    <div className="flex items-center gap-1">
                      <Clock size={10} color={c.text3} />
                      <p style={{ color: c.text3, fontSize: 10 }}>{item.timestamp}</p>
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