import React, { useState, useEffect } from 'react';
import { Zap, Lock, Unlock, ChevronRight, X, CheckCircle, TrendingUp, Gift, Shield, Clock, PiggyBank } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { useThemeColors } from '../../hooks/useThemeColors';
import { fmtUsd } from '../../data/formatNumber';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useLoadingState } from '../../hooks/useLoadingState';
import { TrCard } from '../../components/ui/TrCard';

/** ─── Skeleton loader while fetching data ─── */
function SkeletonList({ rows }: { rows: number }) {
  const c = useThemeColors();
  return (
    <div className="contents">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: c.surface2 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl" style={{ background: c.borderSolid }} />
            <div className="flex-1">
              <div className="h-3 rounded mb-1.5" style={{ background: c.borderSolid, width: '60%' }} />
              <div className="h-2 rounded" style={{ background: c.borderSolid, width: '40%' }} />
            </div>
            <div className="h-4 w-12 rounded" style={{ background: c.borderSolid }} />
          </div>
          <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }} />
        </div>
      ))}
    </div>
  );
}

interface StakingProduct { id: string; asset: string; name: string; type: 'fixed' | 'flexible' | 'defi'; apy: number; apyBoost?: number; minAmount: number; lockDays: number | null; totalStaked: string; participants: number; color: string; isHot?: boolean; isNew?: boolean; riskLevel: 'low' | 'medium' | 'high'; }
interface MyPosition { id: string; product: string; asset: string; amount: number; earned: number; apy: number; startDate: string; endDate: string | null; color: string; type: 'fixed' | 'flexible' | 'defi'; }

const STAKING_PRODUCTS: StakingProduct[] = [
  { id: 'btc-fixed-90', asset: 'BTC', name: 'Bitcoin Fixed', type: 'fixed', apy: 5.8, minAmount: 0.001, lockDays: 90, totalStaked: '12,450 BTC', participants: 8432, color: '#F7931A', isHot: true, riskLevel: 'low' },
  { id: 'eth-flexible', asset: 'ETH', name: 'Ethereum Flexible', type: 'flexible', apy: 4.2, minAmount: 0.01, lockDays: null, totalStaked: '48,234 ETH', participants: 23140, color: '#627EEA', riskLevel: 'low' },
  { id: 'sol-fixed-30', asset: 'SOL', name: 'Solana Fixed 30D', type: 'fixed', apy: 8.5, apyBoost: 12.3, minAmount: 1, lockDays: 30, totalStaked: '234,120 SOL', participants: 14230, color: '#9945FF', isNew: true, riskLevel: 'medium' },
  { id: 'usdt-flexible', asset: 'USDT', name: 'USDT Savings', type: 'flexible', apy: 6.5, minAmount: 10, lockDays: null, totalStaked: '$45.2M', participants: 67890, color: '#26A17B', isHot: true, riskLevel: 'low' },
  { id: 'bnb-fixed-60', asset: 'BNB', name: 'BNB Fixed 60D', type: 'fixed', apy: 9.2, minAmount: 0.1, lockDays: 60, totalStaked: '12,450 BNB', participants: 5210, color: '#F3BA2F', riskLevel: 'medium' },
  { id: 'defi-pool-1', asset: 'ETH/USDT', name: 'ETH-USDT LP Pool', type: 'defi', apy: 18.7, apyBoost: 24.5, minAmount: 100, lockDays: null, totalStaked: '$8.2M', participants: 3420, color: '#06B6D4', riskLevel: 'high' },
];

/** Stable progress percentages for staking products (avoid Math.random in render) */
const STAKING_PROGRESS: Record<string, number> = {
  'btc-fixed-90': 72, 'eth-flexible': 85, 'sol-fixed-30': 45,
  'usdt-flexible': 91, 'bnb-fixed-60': 58, 'defi-pool-1': 63,
};

const MY_POSITIONS: MyPosition[] = [
  { id: 'p1', product: 'Bitcoin Fixed', asset: 'BTC', amount: 0.05, earned: 0.00029, apy: 5.8, startDate: '01/01/2026', endDate: '01/04/2026', color: '#F7931A', type: 'fixed' },
  { id: 'p2', product: 'USDT Savings', asset: 'USDT', amount: 2500, earned: 18.74, apy: 6.5, startDate: '15/01/2026', endDate: null, color: '#26A17B', type: 'flexible' },
];

const RISK_LABELS = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
const RISK_COLORS = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

export function StakingEarnPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<'products' | 'positions'>('products');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fixed' | 'flexible' | 'defi'>('all');
  const [selectedProduct, setSelectedProduct] = useState<StakingProduct | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [agreed, setAgreed] = useState(false);
  const { hapticSelection, hapticSuccess, hapticLight } = useHaptic();
  const { isLoading } = useLoadingState({ loadOnly: true, initialDelay: 600 });

  useEffect(() => { setStakeAmount(''); setAgreed(false); }, [selectedProduct]);

  const filtered = STAKING_PRODUCTS.filter(p => typeFilter === 'all' || p.type === typeFilter);
  const totalEarned = MY_POSITIONS.reduce((s, p) => s + (p.asset === 'USDT' ? p.earned : p.earned * 67543), 0);
  const amountNum = parseFloat(stakeAmount || '0');
  const estimatedEarning = selectedProduct ? amountNum * (selectedProduct.apy / 100) * ((selectedProduct.lockDays ?? 365) / 365) : 0;
  const canStake = selectedProduct ? amountNum >= selectedProduct.minAmount && agreed : false;

  const handleStakeConfirm = () => { if (!canStake) return; hapticSuccess(); setSelectedProduct(null); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); };

  return (
    <PageLayout>
      <BottomSheetV2 open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Đăng ký Staking">
        {selectedProduct && (
          <div className="flex flex-col gap-4">
            <p style={{ color: c.text2, fontSize: 13, marginTop: -8 }}>{selectedProduct.name}</p>
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p style={{ color: c.text3, fontSize: 12 }}>APY hiện tại</p>
              <p style={{ color: '#10B981', fontSize: 32, fontWeight: 800 }}>{selectedProduct.apy}%</p>
              {selectedProduct.apyBoost && <p style={{ color: '#F59E0B', fontSize: 12 }}>🔥 Boost: {selectedProduct.apyBoost}% với VIP</p>}
            </div>
            <BottomSheetRow label="Loại" value={selectedProduct.type === 'fixed' ? `Cố định ${selectedProduct.lockDays} ngày` : selectedProduct.type === 'flexible' ? 'Linh hoạt' : 'DeFi Pool'} />
            <BottomSheetRow label="Tối thiểu" value={`${selectedProduct.minAmount} ${selectedProduct.asset}`} />
            <BottomSheetRow label="Rủi ro" value={RISK_LABELS[selectedProduct.riskLevel]} valueColor={RISK_COLORS[selectedProduct.riskLevel]} />
            <div>
              <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 6 }}>Số lượng ({selectedProduct.asset})</label>
              <div className="flex items-center gap-3 rounded-2xl px-4" style={{ background: c.surface2, border: '1.5px solid rgba(16,185,129,0.3)', height: 52, borderRadius: 14 }}>
                <input type="number" inputMode="decimal" placeholder={`Tối thiểu ${selectedProduct.minAmount}`} value={stakeAmount} onChange={e => setStakeAmount(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 16, flex: 1, fontFamily: 'monospace' }} />
                <span style={{ color: c.text2, fontSize: 13 }}>{selectedProduct.asset}</span>
              </div>
            </div>
            {amountNum > 0 && (
              <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
                <BottomSheetRow label="Dự kiến nhận về" value={`+${estimatedEarning.toFixed(6)} ${selectedProduct.asset}`} valueColor="#10B981" highlight />
                <BottomSheetRow label="Thời gian" value={selectedProduct.lockDays ? `${selectedProduct.lockDays} ngày` : 'Linh hoạt'} />
              </div>
            )}
            <button onClick={() => { setAgreed(!agreed); hapticLight(); }} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5"
                style={{ borderColor: agreed ? '#10B981' : c.borderSolid, background: agreed ? '#10B981' : 'transparent' }}>
                {agreed && <CheckCircle size={13} color="#fff" />}
              </div>
              <span style={{ color: c.text2, fontSize: 12, lineHeight: 1.5, textAlign: 'left' }}>
                Tôi đã đọc và đồng ý với <span style={{ color: '#3B82F6' }}>điều khoản Staking</span>. Tôi hiểu các rủi ro liên quan.
              </span>
            </button>
            <button onClick={handleStakeConfirm} disabled={!canStake}
              className="w-full rounded-2xl flex items-center justify-center font-bold text-white ripple"
              style={{ height: 52, borderRadius: 14, background: canStake ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : c.surface2, color: canStake ? '#fff' : c.text3, boxShadow: canStake ? '0 4px 20px rgba(16,185,129,0.3)' : 'none', fontSize: 16 }}>
              {canStake ? `Staking ngay` : 'Nhập số lượng'}
            </button>
          </div>
        )}
      </BottomSheetV2>

      {showSuccess && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: c.surface, border: '1px solid #10B981', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto' }}>
          <CheckCircle size={20} color="#10B981" />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Đăng ký thành công!</p>
            <p style={{ color: c.text2, fontSize: 12 }}>Staking đã được kích hoạt, lãi tính từ hôm nay</p>
          </div>
          <button onClick={() => setShowSuccess(false)}><X size={16} color={c.text3} /></button>
        </div>
      )}

      <Header title="Staking & Earn" subtitle="Earn · Tài chính" back />

      <PageContent padding="compact">
      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: c.portfolioBg, border: `1px solid ${c.portfolioBorder}`, boxShadow: c.portfolioShadow }}>
        {/* Decorative glows — green accent */}
        <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 65%)' }} />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />

        <div className="flex gap-4 relative z-10">
          <div className="flex-1">
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>Tổng thu nhập (USD)</p>
            <p style={{ color: '#34D399', fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>+{fmtUsd(totalEarned)}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>Tích luỹ từ trước đến nay</p>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <div className="rounded-2xl px-3.5 py-2 text-center"
              style={{
                background: c.portfolioBtnGhost,
                border: `1px solid ${c.portfolioBtnGhostBorder}`,
                backdropFilter: 'blur(8px)',
              }}>
              <p style={{ color: '#34D399', fontSize: 18, fontWeight: 700 }}>{MY_POSITIONS.length}</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>Vị thế hoạt động</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-4 relative z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: c.portfolioBtnGhost, border: `1px solid ${c.portfolioBtnGhostBorder}` }}>
            <Zap size={13} color="#FBBF24" />
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>APY tối đa 24.5%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: c.portfolioBtnGhost, border: `1px solid ${c.portfolioBtnGhostBorder}` }}>
            <Shield size={13} color="#34D399" />
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>Bảo hiểm quỹ</span>
          </div>
          <button onClick={() => navigate(`${prefix}/earn/savings`)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: c.portfolioBtnGhost, border: `1px solid ${c.portfolioBtnGhostBorder}` }}>
            <PiggyBank size={13} color="#93C5FD" />
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>Tiết kiệm</span>
            <ChevronRight size={11} color="rgba(255,255,255,0.35)" />
          </button>
        </div>
      </div>

      <TabBar
        variant="segment"
        tabs={[
          { id: 'products', label: '📦 Sản phẩm' },
          { id: 'positions', label: `💼 Của tôi (${MY_POSITIONS.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'products' && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {[{ id: 'all', label: 'Tất cả' }, { id: 'fixed', label: '🔒 Cố định' }, { id: 'flexible', label: '🔓 Linh hoạt' }, { id: 'defi', label: '⚡ DeFi' }].map(f => (
              <button key={f.id} onClick={() => { setTypeFilter(f.id as any); hapticSelection(); }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold hover-chip"
                style={{ background: typeFilter === f.id ? c.chipActiveBg : c.chipBg, color: typeFilter === f.id ? c.chipActiveText : c.chipText, border: `1px solid ${typeFilter === f.id ? c.chipActiveBorder : c.chipBorder}` }}>
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? <SkeletonList rows={3} /> : filtered.map(product => (
            <TrCard key={product.id} hover className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: product.color + '22', border: `1.5px solid ${product.color}44` }}>
                  <span style={{ color: product.color, fontSize: 10, fontWeight: 700 }}>{product.asset.slice(0, 4)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-truncate" style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{product.name}</span>
                    {product.isHot && <span className="px-1.5 py-0.5 rounded-md text-xs font-bold shrink-0" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>HOT</span>}
                    {product.isNew && <span className="px-1.5 py-0.5 rounded-md text-xs font-bold shrink-0" style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>MỚI</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {product.type === 'fixed' ? <Lock size={11} color="#F59E0B" /> : product.type === 'flexible' ? <Unlock size={11} color="#10B981" /> : <Zap size={11} color="#06B6D4" />}
                    <span style={{ color: c.text2, fontSize: 12 }}>{product.lockDays ? `${product.lockDays} ngày` : 'Linh hoạt'} • {product.participants.toLocaleString()} người</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p style={{ color: '#10B981', fontSize: 20, fontWeight: 800 }}>{product.apy}%</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
                  {product.apyBoost && <p style={{ color: '#F59E0B', fontSize: 10 }}>🔥 Max {product.apyBoost}%</p>}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between mb-1">
                  <span style={{ color: c.text3, fontSize: 11 }}>Đã staking: {product.totalStaked}</span>
                  <span style={{ color: RISK_COLORS[product.riskLevel], fontSize: 11 }}>Rủi ro: {RISK_LABELS[product.riskLevel]}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }}>
                  <div className="h-full rounded-full" style={{ background: product.color, width: `${STAKING_PROGRESS[product.id] ?? 50}%` }} />
                </div>
              </div>
            </TrCard>
          ))}
        </div>
      )}

      {tab === 'positions' && (
        <div className="flex flex-col gap-3">
          {MY_POSITIONS.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}><Zap size={32} color={c.text3} /></div>
              <p style={{ color: c.text3, fontSize: 14 }}>Chưa có vị thế nào</p>
              <button onClick={() => setTab('products')} className="px-6 py-3 rounded-2xl font-semibold text-white" style={{ background: '#3B82F6' }}>Khám phá sản phẩm</button>
            </div>
          ) : (
            <div className="contents">
              {MY_POSITIONS.map(pos => {
                const daysLeft = pos.endDate ? Math.ceil((new Date(pos.endDate.split('/').reverse().join('-')).getTime() - Date.now()) / 86400000) : null;
                const progress = daysLeft != null ? Math.max(0, Math.min(100, ((pos.endDate ? 90 - daysLeft : 0) / 90) * 100)) : null;
                return (
                  <TrCard key={pos.id} hover className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: pos.color + '22', border: `1.5px solid ${pos.color}44` }}>
                        <span style={{ color: pos.color, fontSize: 9, fontWeight: 700 }}>{pos.asset.slice(0,3)}</span>
                      </div>
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{pos.product}</p>
                        <div className="flex items-center gap-1">
                          {pos.type === 'fixed' ? <Lock size={10} color="#F59E0B" /> : <Unlock size={10} color="#10B981" />}
                          <span style={{ color: c.text2, fontSize: 11 }}>{pos.type === 'fixed' ? 'Cố định' : 'Linh hoạt'}</span>
                        </div>
                      </div>
                      <div className="text-right"><p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>{pos.apy}% APY</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[{ label: 'Đang staking', value: `${pos.amount} ${pos.asset}` }, { label: 'Đã nhận', value: `+${pos.earned} ${pos.asset}`, color: '#10B981' },
                        { label: 'Bắt đầu', value: pos.startDate }, { label: pos.endDate ? 'Kết thúc' : 'Trạng thái', value: pos.endDate ?? 'Đang hoạt động' }].map(r => (
                        <div key={r.label} className="rounded-xl p-2" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 10 }}>{r.label}</p>
                          <p style={{ color: (r as any).color ?? c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</p>
                        </div>
                      ))}
                    </div>
                    {progress !== null && (
                      <div className="mb-3">
                        <div className="flex justify-between mb-1"><span style={{ color: c.text3, fontSize: 11 }}>Tiến trình</span><span style={{ color: c.text2, fontSize: 11 }}>Còn {daysLeft} ngày</span></div>
                        <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }}><div className="h-full rounded-full" style={{ background: pos.color, width: `${progress}%` }} /></div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-xl text-xs font-semibold hover-chip" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}><Gift size={12} className="inline mr-1" />Nhận lãi</button>
                      {pos.type === 'flexible' && <button className="flex-1 py-2 rounded-xl text-xs font-semibold hover-chip" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>Rút sớm</button>}
                    </div>
                  </TrCard>
                );
              })}
              <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
                <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} color="#10B981" /><p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>Tổng thu nhập ước tính</p></div>
                <div className="flex justify-between">
                  {[{ l: 'Hàng ngày', v: '+$1.42' }, { l: 'Hàng tháng', v: '+$42.60' }, { l: 'Hàng năm', v: '+$511.20' }].map(r => (
                    <div key={r.l}><p style={{ color: c.text3, fontSize: 11 }}>{r.l}</p><p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>{r.v}</p></div>
                  ))}
                </div>
              </TrCard>
            </div>
          )}
        </div>
      )}
      </PageContent>
    </PageLayout>
  );
}