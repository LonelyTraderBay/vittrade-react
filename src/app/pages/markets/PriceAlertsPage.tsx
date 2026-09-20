import { useThemeColors } from '../../hooks/useThemeColors';
import { fmtUsd } from '../../data/formatNumber';
import React, { useState } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PRICE_ALERTS, PriceAlert, CRYPTO_PAIRS } from '../../data/mockData';
import { TrCard } from '../../components/ui/TrCard';
import { PageLayout } from '../../components/layout/PageLayout';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';

export function PriceAlertsPage() {
  const c = useThemeColors();
  const [alerts, setAlerts] = useState(PRICE_ALERTS);
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered'>('all');

  const filtered = alerts.filter(a => {
    if (filter === 'active') return a.isActive;
    if (filter === 'triggered') return !a.isActive && a.triggeredAt;
    return true;
  });

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const renderAlert = (alert: PriceAlert) => {
    const pair = CRYPTO_PAIRS.find(p => p.id === alert.pairId);
    const isAbove = alert.condition === 'above';
    const progress = (alert.currentPrice / alert.targetPrice) * 100;
    const isTriggered = !alert.isActive && alert.triggeredAt;

    return (
      <TrCard key={alert.id} className="px-4 py-3 mb-3"
        accentBorder={isTriggered ? 'rgba(16,185,129,0.2)' : undefined}
        style={{ background: isTriggered ? 'rgba(16,185,129,0.05)' : undefined }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: (pair?.logoColor || '#3B82F6') + '22' }}>
              <span style={{ color: pair?.logoColor || '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                {alert.symbol.split('/')[0].slice(0, 3)}
              </span>
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                {alert.symbol}
              </p>
              <div className="flex items-center gap-1">
                {isAbove ? <TrendingUp size={14} color="#10B981" /> : <TrendingDown size={14} color="#EF4444" />}
                <span style={{ color: isAbove ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  {isAbove ? 'Trên' : 'Dưới'} {fmtUsd(alert.targetPrice)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isTriggered ? (
              <span className="px-2 py-1 rounded-lg min-h-9"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                Đã kích hoạt
              </span>
            ) : (
              <button onClick={() => toggleAlert(alert.id)}>
                {alert.isActive
                  ? <ToggleRight size={28} color="#10B981" />
                  : <ToggleLeft size={28} color={c.text3} />
                }
              </button>
            )}
            <button onClick={() => deleteAlert(alert.id)} className="p-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.08)' }}>
              <Trash2 size={14} color="#EF4444" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Giá hiện tại</span>
              <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                {fmtUsd(alert.currentPrice)}
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  background: isAbove
                    ? progress >= 100 ? '#10B981' : '#3B82F6'
                    : progress <= 100 ? '#10B981' : '#EF4444',
                }} />
            </div>
          </div>
          <div className="text-right">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Mục tiêu</p>
            <p style={{ color: isAbove ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {fmtUsd(alert.targetPrice)}
            </p>
          </div>
        </div>

        {/* Triggered info */}
        {isTriggered && alert.triggeredAt && (
          <div className="mt-2 pt-2 flex items-center gap-2" style={{ borderTop: `1px solid ${c.divider}` }}>
            <Bell size={14} color="#10B981" />
            <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
              Kích hoạt lúc {new Date(alert.triggeredAt).toLocaleString('vi-VN')}
            </span>
          </div>
        )}
      </TrCard>
    );
  };

  return (
    <PageLayout>
      <Header title="Cảnh báo giá" subtitle="Cảnh báo · Markets" back />

      {/* Filter tabs */}
      <div className="px-5 py-3" style={{ background: c.surface, borderBottom: `1px solid ${c.divider}` }}>
        <div className="flex gap-2">
          {([
            { id: 'all' as const, label: 'Tất cả' },
            { id: 'active' as const, label: 'Đang hoạt động' },
            { id: 'triggered' as const, label: 'Đã kích hoạt' },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className="px-3 py-2 rounded-xl min-h-9"
              style={{
                background: filter === tab.id ? c.chipActiveBg : c.chipBg,
                color: filter === tab.id ? c.chipActiveText : c.chipText,
                border: `1px solid ${filter === tab.id ? c.chipActiveBorder : c.chipBorder}`,
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.semibold,
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="px-5 mt-4 mb-3 flex gap-3">
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Tổng</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>{alerts.length}</p>
        </div>
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Hoạt động</p>
          <p style={{ color: '#10B981', fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>{alerts.filter(a => a.isActive).length}</p>
        </div>
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Đã kích hoạt</p>
          <p style={{ color: '#3B82F6', fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>{alerts.filter(a => !a.isActive && a.triggeredAt).length}</p>
        </div>
      </div>

      {/* Alert list */}
      <div className="px-5 flex flex-col">
        {filtered.length === 0 ? (
          <TrCard className="py-12 text-center">
            <Bell size={32} color={c.text3} className="mx-auto mb-2" />
            <p style={{ color: c.text3, fontSize: FONT_SCALE.sm }}>Chưa có cảnh báo nào</p>
          </TrCard>
        ) : (
          filtered.map(renderAlert)
        )}
      </div>

      {/* Add button */}
      <div className="px-5 mt-4">
        <button className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
          onClick={() => alert('Tạo cảnh báo mới - Tính năng sẽ được bổ sung')}>
          <Plus size={16} color="#3B82F6" />
          <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Tạo cảnh báo mới</span>
        </button>
      </div>
    </PageLayout>
  );
}