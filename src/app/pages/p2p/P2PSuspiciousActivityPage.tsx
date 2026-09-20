/**
 * P2PSuspiciousActivityPage — /p2p/security/suspicious
 * CRITICAL: Suspicious activity alerts & review
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, MapPin, Clock, Shield, Eye, X } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';

const ALERTS = [
  { id: '1', type: 'login', message: 'Đăng nhập từ vị trí lạ: Singapore', timestamp: '2026-03-05 14:20', severity: 'high', reviewed: false },
  { id: '2', type: 'transaction', message: 'Giao dịch bất thường: 100M VND', timestamp: '2026-03-04 18:30', severity: 'medium', reviewed: false },
  { id: '3', type: 'device', message: 'Thiết bị mới: Unknown Android', timestamp: '2026-03-03 09:15', severity: 'low', reviewed: true },
];

export function P2PSuspiciousActivityPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const [alerts, setAlerts] = useState(ALERTS);
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

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, reviewed: true } : a));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#3B82F6';
      default: return c.text3;
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Suspicious Activity" subtitle="An toàn · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba('#F59E0B', 20) }}>
                <AlertTriangle size={24} color="#F59E0B" />
              </div>
              <div className="flex-1">
                <h2 style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                  {alerts.filter(a => !a.reviewed).length} cảnh báo mới
                </h2>
                <p style={{ color: c.text2, fontSize: φ.xs }}>Xem lại hoạt động đáng ngờ</p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5 flex flex-col gap-3">
          {alerts.map(alert => (
            <TrCard key={alert.id} rounded="md" className="p-4" accentBorder={!alert.reviewed ? getSeverityColor(alert.severity) : undefined}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(getSeverityColor(alert.severity), 12) }}>
                  <AlertTriangle size={18} color={getSeverityColor(alert.severity)} />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock size={10} color={c.text3} />
                    <p style={{ color: c.text3, fontSize: 10 }}>{alert.timestamp}</p>
                  </div>
                  {alert.reviewed && (
                    <div className="mt-2 px-2 py-1 rounded-md inline-block" style={{ background: hexToRgba('#10B981', 10) }}>
                      <p style={{ color: '#10B981', fontSize: 9, fontWeight: 700 }}>✓ Đã xem lại</p>
                    </div>
                  )}
                </div>
                {!alert.reviewed && (
                  <button onClick={() => handleDismiss(alert.id)} className="p-2">
                    <X size={16} color={c.text3} />
                  </button>
                )}
              </div>
            </TrCard>
          ))}
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}