import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { P2P_MY_ADS, P2PAd } from '../../data/mockData';
import { fmtVnd, fmtAmount, fmtCompact } from '../../data/formatNumber';
import { φ, φIcon, φRadius } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { RefreshableSkeletonList } from '../../components/states/RefreshableSkeletonList';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';
import {
  Plus, Pause, Play, Trash2, Edit3, Eye, TrendingUp,
  BarChart3, ChevronRight, AlertTriangle, Clock,
  Settings, BookOpen, UserX,
} from 'lucide-react';

export function P2PMyAdsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const [ads, setAds] = useState<P2PAd[]>(P2P_MY_ADS);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { isLoading, isRefreshing, refresh, lastRefreshedLabel, refreshCount } = useLoadingState();

  const filtered = ads.filter(ad => filter === 'all' || ad.status === filter);
  const activeCount = ads.filter(a => a.status === 'active').length;
  const pausedCount = ads.filter(a => a.status === 'paused').length;
  const totalVolume = ads.reduce((s, a) => s + a.totalVolume30d, 0);

  const toggleAdStatus = (id: string) => {
    const ad = ads.find(a => a.id === id);
    setAds(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } as P2PAd : a));
    actionToast.success(ad?.status === 'active' ? TOAST.P2P.AD_PAUSED : TOAST.P2P.AD_RESUMED, { haptic: 'selection' });
  };

  const deleteAd = (id: string) => {
    setAds(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
    actionToast.warning(TOAST.P2P.AD_DELETED, { haptic: 'error' });
  };

  return (
    <PageLayout>
      <Header title="Quảng cáo của tôi" subtitle="Quảng cáo · P2P" back
        right={
          <button onClick={() => navigate(`${prefix}/p2p/create`)}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Plus size={18} color="#3B82F6" />
          </button>
        }
      />

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="flex-1">
        <PageContent padding="compact">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Đang hoạt động', value: activeCount, color: '#10B981' },
            { label: 'Tạm dừng', value: pausedCount, color: '#F59E0B' },
            { label: 'KL 30 ngày', value: fmtCompact(totalVolume, { prefix: '$' }), color: '#3B82F6' },
          ].map(stat => (
            <TrCard key={stat.label} rounded="sm" className="p-3 text-center">
              <p style={{ color: stat.color, fontSize: φ.md, fontWeight: 700 }}>{stat.value}</p>
              <p style={{ color: c.text3, fontSize: 10 }}>{stat.label}</p>
            </TrCard>
          ))}
        </div>

        {/* Filter */}
        <TabBar
          variant="segment"
          tabs={[
            { id: 'all', label: `Tất cả (${ads.length})` },
            { id: 'active', label: `Hoạt động (${activeCount})` },
            { id: 'paused', label: `Tạm dừng (${pausedCount})` },
          ]}
          active={filter}
          onChange={setFilter}
          className="mb-4"
        />

        {/* Ad List */}
        <RefreshableSkeletonList
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          rows={5}
          isEmpty={filtered.length === 0}
          emptyState={
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: c.surface2 }}>
                <BarChart3 size={36} color={c.borderSolid} />
              </div>
              <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>Chưa có quảng cáo nào</p>
              <button onClick={() => navigate(`${prefix}/p2p/create`)}
                className="px-6 py-3 rounded-2xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)', color: '#fff' }}>
                Đăng quảng cáo đầu tiên
              </button>
            </div>
          }
          lastRefreshedLabel={lastRefreshedLabel}
          refreshCount={refreshCount}
        >
          <div
            key={filter}
            className="flex flex-col gap-3"
          >
            {filtered.map((ad, idx) => (
              <div
                key={ad.id}
              >
                <TrCard className="p-4"
                  style={{ opacity: ad.status === 'paused' ? 0.7 : 1 }}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{ background: ad.type === 'sell' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: ad.type === 'sell' ? '#EF4444' : '#10B981' }}>
                        {ad.type === 'sell' ? 'BÁN' : 'MUA'} {ad.asset}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          background: ad.status === 'active' ? 'rgba(16,185,129,0.1)' : ad.status === 'paused' ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)',
                          color: ad.status === 'active' ? '#10B981' : ad.status === 'paused' ? '#F59E0B' : '#6B7280',
                        }}>
                        {ad.status === 'active' ? 'Hoạt động' : ad.status === 'paused' ? 'Tạm dừng' : 'Hết hạn'}
                      </span>
                      {ad.priceType === 'floating' && (
                        <span style={{ color: '#A855F7', fontSize: 10, fontWeight: 600 }}>Thả nổi</span>
                      )}
                    </div>
                  </div>

                  {/* Price & Info */}
                  <div className="mb-3">
                    <span style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>
                      {fmtVnd(ad.price)}
                    </span>
                    <span style={{ color: c.text3, fontSize: φ.sm, marginLeft: 4 }}>{ad.currency}/{ad.asset}</span>
                    {ad.priceMargin !== undefined && (
                      <span style={{ color: ad.priceMargin >= 0 ? '#10B981' : '#EF4444', fontSize: φ.xs, marginLeft: 8 }}>
                        {ad.priceMargin >= 0 ? '+' : ''}{ad.priceMargin}%
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div>
                      <p style={{ color: c.text3 }}>Khả dụng</p>
                      <p style={{ color: c.text1, fontWeight: 600, fontFamily: 'monospace' }}>{fmtAmount(ad.available)} {ad.asset}</p>
                    </div>
                    <div>
                      <p style={{ color: c.text3 }}>Giới hạn</p>
                      <p style={{ color: c.text1, fontFamily: 'monospace', fontSize: 10 }}>{fmtVnd(ad.minLimit)}-{fmtVnd(ad.maxLimit)}</p>
                    </div>
                    <div>
                      <p style={{ color: c.text3 }}>Thanh toán</p>
                      <p style={{ color: c.text1, fontSize: 10 }}>{ad.paymentMethods.join(', ')}</p>
                    </div>
                  </div>

                  {/* Trading Hours */}
                  {ad.tradingHours && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Clock size={10} color={c.text3} />
                      <span style={{ color: c.text3, fontSize: 10 }}>{ad.tradingHours}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                    <button onClick={() => navigate(`${prefix}/p2p/ad-analytics/${ad.id}`)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)', flex: 1 }}>
                      <BarChart3 size={12} /> Analytics
                    </button>
                    <button onClick={() => toggleAdStatus(ad.id)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, flex: 1 }}>
                      {ad.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                      {ad.status === 'active' ? 'Dừng' : 'Bật'}
                    </button>
                    <button onClick={() => navigate(`${prefix}/p2p/create`)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)', flex: 1 }}>
                      <Edit3 size={12} /> Sửa
                    </button>
                    <button onClick={() => setDeleteConfirm(ad.id)}
                      className="flex items-center justify-center w-10 py-2.5 rounded-xl"
                      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <Trash2 size={14} color="#EF4444" />
                    </button>
                  </div>
                </TrCard>
              </div>
            ))}
          </div>
        </RefreshableSkeletonList>

        {/* ═══ Quick Links ═══ */}
        <div>
          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 9, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>LIÊN KẾT NHANH</p>
            <div className="flex flex-col gap-0">
              {[
                { icon: Settings, label: 'Cài đặt P2P', desc: 'Tùy chọn giao dịch, thông báo', color: '#6B7280', path: `${prefix}/p2p/settings` },
                { icon: UserX, label: 'Danh sách chặn', desc: 'Quản lý người dùng đã chặn', color: '#EF4444', path: `${prefix}/p2p/blacklist` },
                { icon: BookOpen, label: 'Hướng dẫn', desc: 'Mẹo đăng quảng cáo hiệu quả', color: '#8B5CF6', path: `${prefix}/p2p/guide` },
              ].map((link, i) => (
                <button key={link.label}
                  onClick={() => navigate(link.path)}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: i < 2 ? `1px solid ${c.divider}` : 'none' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: link.color + '12' }}>
                    <link.icon size={12} color={link.color} />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{link.label}</p>
                    <p style={{ color: c.text3, fontSize: 9 }}>{link.desc}</p>
                  </div>
                  <ChevronRight size={12} color={c.text3} />
                </button>
              ))}
            </div>
          </TrCard>
        </div>
        </PageContent>
      </PullToRefresh>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) deleteAd(deleteConfirm); }}
        variant="danger"
        icon={<Trash2 size={24} color="#EF4444" />}
        title="Xóa quảng cáo này?"
        description="Quảng cáo sẽ bị xóa vĩnh viễn. Các đơn hàng đang xử lý sẽ không bị ảnh hưởng."
        confirmText="Xóa"
      />
    </PageLayout>
  );
}