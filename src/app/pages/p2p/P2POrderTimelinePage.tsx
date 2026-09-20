/**
 * P2POrderTimelinePage — /p2p/orders/:id/timeline
 * HIGH: Detailed order timeline with real-time updates
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { Clock, CheckCircle, AlertCircle, MessageCircle, DollarSign } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';

const TIMELINE = [
  { id: '1', type: 'created', title: 'Order Created', time: '2026-03-05 14:20:00', status: 'completed', actor: 'You' },
  { id: '2', type: 'matched', title: 'Matched with Seller', time: '2026-03-05 14:20:15', status: 'completed', actor: 'System' },
  { id: '3', type: 'locked', title: 'Funds Locked in Escrow', time: '2026-03-05 14:20:30', status: 'completed', actor: 'Seller' },
  { id: '4', type: 'payment', title: 'Payment Instructions Sent', time: '2026-03-05 14:21:00', status: 'completed', actor: 'Seller' },
  { id: '5', type: 'paid', title: 'Marked as Paid', time: '2026-03-05 14:35:22', status: 'completed', actor: 'You' },
  { id: '6', type: 'confirming', title: 'Awaiting Seller Confirmation', time: '2026-03-05 14:35:30', status: 'pending', actor: 'Seller' },
];

export function P2POrderTimelinePage() {
  const { id } = useParams();
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const [timeline, setTimeline] = useState(TIMELINE);
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'created': return Clock;
      case 'matched': return CheckCircle;
      case 'locked': return DollarSign;
      case 'payment': return MessageCircle;
      case 'paid': return CheckCircle;
      case 'confirming': return Clock;
      default: return AlertCircle;
    }
  };

  const getColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return c.text3;
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title={`Order #${id} Timeline`} subtitle="Đơn hàng · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#3B82F6' }}>
                <Clock size={24} color="#FFFFFF" />
              </div>
              <div className="flex-1">
                <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                  Order Timeline
                </h2>
                <p style={{ color: c.text2, fontSize: φ.xs }}>Real-time status updates</p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: c.borderSolid }} />

            {/* Timeline Events */}
            <div className="flex flex-col gap-4">
              {timeline.map((event, idx) => {
                const Icon = getIcon(event.type);
                const color = getColor(event.status);
                const isLast = idx === timeline.length - 1;

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: hexToRgba(color, 12), border: `2px solid ${color}` }}>
                      <Icon size={18} color={color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <TrCard rounded="md" className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{event.title}</h4>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: hexToRgba(color, 15), color }}>
                            {event.status}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>By: {event.actor}</p>
                        <p style={{ color: c.text3, fontSize: 10 }}>{event.time}</p>
                      </TrCard>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}