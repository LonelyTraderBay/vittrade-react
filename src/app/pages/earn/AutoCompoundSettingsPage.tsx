import React, { useState } from 'react';
import {
  RefreshCw, TrendingUp, Shield, AlertTriangle, Info, Check,
  ChevronRight, Clock, Zap, Settings, Calculator, CheckCircle, X,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════
   Mock: User positions with compound settings
   ═══════════════════════════════════════════════════════════ */

interface CompoundPosition {
  id: string;
  product: string;
  asset: string;
  amount: number;
  earned: number;
  apy: number;
  color: string;
  type: 'flexible' | 'locked';
  autoCompound: boolean;
  compoundFrequency: 'daily' | 'weekly' | 'monthly';
  compoundThreshold: number;
  lastCompounded: string;
  totalCompounded: number;
  compoundCount: number;
  estimatedBoost: number; // basis points extra APY from compounding
}

const POSITIONS: CompoundPosition[] = [
  {
    id: 'cp1', product: 'USDT Linh hoạt', asset: 'USDT', amount: 3500,
    earned: 14.58, apy: 4.5, color: '#26A17B', type: 'flexible',
    autoCompound: true, compoundFrequency: 'daily', compoundThreshold: 0.1,
    lastCompounded: '09/03/2026 08:00', totalCompounded: 12.32, compoundCount: 45,
    estimatedBoost: 9,
  },
  {
    id: 'cp2', product: 'BTC Linh hoạt', asset: 'BTC', amount: 0.05,
    earned: 0.000042, apy: 1.8, color: '#F7931A', type: 'flexible',
    autoCompound: false, compoundFrequency: 'weekly', compoundThreshold: 0.00001,
    lastCompounded: '—', totalCompounded: 0, compoundCount: 0,
    estimatedBoost: 3,
  },
  {
    id: 'cp3', product: 'ETH Linh hoạt', asset: 'ETH', amount: 1.5,
    earned: 0.0028, apy: 2.1, color: '#627EEA', type: 'flexible',
    autoCompound: true, compoundFrequency: 'weekly', compoundThreshold: 0.001,
    lastCompounded: '07/03/2026 12:00', totalCompounded: 0.0019, compoundCount: 8,
    estimatedBoost: 5,
  },
];

const FREQUENCIES = [
  { id: 'daily' as const, label: 'Hàng ngày', desc: 'Compound mỗi 24h', boost: 'Tốt nhất' },
  { id: 'weekly' as const, label: 'Hàng tuần', desc: 'Compound mỗi 7 ngày', boost: 'Khá tốt' },
  { id: 'monthly' as const, label: 'Hàng tháng', desc: 'Compound mỗi 30 ngày', boost: 'Cơ bản' },
];

/* ═══════════════════════════════════════════════════════════
   Toggle Switch Component
   ═══════════════════════════════════════════════════════════ */

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const c = useThemeColors();
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative shrink-0"
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? '#10B981' : c.toggleTrackOff,
        transition: 'background 0.2s',
      }}
    >
      <div
        className="absolute top-1 rounded-full bg-white"
        style={{
          width: 16, height: 16,
          left: on ? 24 : 4,
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */

export function AutoCompoundSettingsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticSuccess, hapticLight } = useHaptic();

  const [positions, setPositions] = useState<CompoundPosition[]>(POSITIONS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const editingPosition = positions.find(p => p.id === editingId) ?? null;

  /* Handlers */
  const toggleCompound = (id: string) => {
    hapticSelection();
    setPositions(prev => prev.map(p =>
      p.id === id ? { ...p, autoCompound: !p.autoCompound } : p
    ));
  };

  const updateFrequency = (id: string, freq: 'daily' | 'weekly' | 'monthly') => {
    hapticLight();
    setPositions(prev => prev.map(p =>
      p.id === id ? { ...p, compoundFrequency: freq } : p
    ));
  };

  const updateThreshold = (id: string, threshold: number) => {
    setPositions(prev => prev.map(p =>
      p.id === id ? { ...p, compoundThreshold: threshold } : p
    ));
  };

  const saveSettings = () => {
    hapticSuccess();
    setEditingId(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  /* Computed */
  const activeCount = positions.filter(p => p.autoCompound).length;
  const totalCompounded = positions.reduce((s, p) => {
    const usdVal = p.asset === 'USDT' ? p.totalCompounded
      : p.asset === 'BTC' ? p.totalCompounded * 67543
      : p.asset === 'ETH' ? p.totalCompounded * 2800
      : p.totalCompounded * 130;
    return s + usdVal;
  }, 0);
  const totalCompoundEvents = positions.reduce((s, p) => s + p.compoundCount, 0);

  /* Threshold presets per asset */
  const getThresholdPresets = (asset: string) => {
    switch (asset) {
      case 'USDT': return [0.1, 0.5, 1, 5];
      case 'BTC': return [0.00001, 0.0001, 0.001, 0.01];
      case 'ETH': return [0.001, 0.005, 0.01, 0.05];
      default: return [0.1, 0.5, 1, 5];
    }
  };

  return (
    <PageLayout>
      {/* ─── Edit Settings Sheet ─── */}
      <BottomSheetV2
        open={!!editingPosition}
        onClose={() => setEditingId(null)}
        title={`Cài đặt lãi kép — ${editingPosition?.product ?? ''}`}
      >
        {editingPosition && (() => {
          const pos = editingPosition;
          const thresholds = getThresholdPresets(pos.asset);
          const effectiveAPY = pos.autoCompound
            ? (pos.apy + pos.estimatedBoost / 100).toFixed(2)
            : pos.apy.toFixed(2);

          return (
            <div className="flex flex-col gap-4">
              {/* Product info */}
              <div className="flex items-center gap-3" style={{ marginTop: -4 }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: pos.color + '22', border: `1.5px solid ${pos.color}44` }}
                >
                  <span style={{ color: pos.color, fontSize: 10, fontWeight: 700 }}>
                    {pos.asset.slice(0, 3)}
                  </span>
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{pos.product}</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>
                    Số dư: {fmtAmount(pos.amount)} {pos.asset}
                  </p>
                </div>
              </div>

              {/* Toggle */}
              <div
                className="flex items-center justify-between p-3 rounded-2xl"
                style={{ background: c.surface2 }}
              >
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} color={pos.autoCompound ? '#10B981' : c.text3} />
                  <div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Tự động lãi kép</p>
                    <p style={{ color: c.text3, fontSize: 11 }}>
                      Lãi tự động cộng vào gốc
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  on={pos.autoCompound}
                  onChange={() => toggleCompound(pos.id)}
                />
              </div>

              {/* Frequency */}
              {pos.autoCompound && (
                <>
                  <div>
                    <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                      Tần suất compound
                    </p>
                    <div className="flex flex-col gap-2">
                      {FREQUENCIES.map(freq => (
                        <button
                          key={freq.id}
                          onClick={() => updateFrequency(pos.id, freq.id)}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{
                            background: pos.compoundFrequency === freq.id ? 'rgba(16,185,129,0.08)' : c.surface2,
                            border: `1.5px solid ${pos.compoundFrequency === freq.id ? 'rgba(16,185,129,0.3)' : 'transparent'}`,
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{
                              border: `2px solid ${pos.compoundFrequency === freq.id ? '#10B981' : c.borderSolid}`,
                              background: pos.compoundFrequency === freq.id ? '#10B981' : 'transparent',
                            }}
                          >
                            {pos.compoundFrequency === freq.id && <Check size={11} color="#fff" />}
                          </div>
                          <div className="flex-1 text-left">
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{freq.label}</p>
                            <p style={{ color: c.text3, fontSize: 11 }}>{freq.desc}</p>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-md"
                            style={{
                              background: freq.id === 'daily' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.08)',
                              color: freq.id === 'daily' ? '#10B981' : '#3B82F6',
                              fontSize: 9, fontWeight: 700,
                            }}
                          >
                            {freq.boost}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Threshold */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>
                        Ngưỡng tối thiểu
                      </p>
                      <span style={{ color: c.text3, fontSize: 10 }}>
                        Compound khi lãi ≥ ngưỡng
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {thresholds.map(t => (
                        <button
                          key={t}
                          onClick={() => updateThreshold(pos.id, t)}
                          className="flex-1 py-2 rounded-xl text-center"
                          style={{
                            background: pos.compoundThreshold === t ? 'rgba(16,185,129,0.12)' : c.chipBg,
                            color: pos.compoundThreshold === t ? '#10B981' : c.chipText,
                            border: `1px solid ${pos.compoundThreshold === t ? 'rgba(16,185,129,0.3)' : c.chipBorder}`,
                            fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
                          }}
                        >
                          {fmtAmount(t)}
                        </button>
                      ))}
                    </div>
                    <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                      Đơn vị: {pos.asset}. Lãi dưới ngưỡng sẽ tích luỹ cho kỳ sau.
                    </p>
                  </div>
                </>
              )}

              {/* APY comparison */}
              <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
                <BottomSheetRow
                  label="APY cơ bản"
                  value={`${pos.apy}%`}
                />
                <BottomSheetRow
                  label="APY thực tế (compound)"
                  value={pos.autoCompound ? `~${effectiveAPY}%` : `${pos.apy}% (không compound)`}
                  valueColor={pos.autoCompound ? '#10B981' : c.text2}
                  highlight
                />
                {pos.autoCompound && (
                  <BottomSheetRow
                    label="Lợi ích thêm"
                    value={`+${(pos.estimatedBoost / 100).toFixed(2)}% APY`}
                    valueColor="#10B981"
                  />
                )}
              </div>

              {/* History stats */}
              {pos.compoundCount > 0 && (
                <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
                  <BottomSheetRow label="Tổng đã compound" value={`${fmtAmount(pos.totalCompounded)} ${pos.asset}`} />
                  <BottomSheetRow label="Số lần compound" value={`${pos.compoundCount} lần`} />
                  <BottomSheetRow label="Lần gần nhất" value={pos.lastCompounded} />
                </div>
              )}

              {/* Save CTA */}
              <CTAButton onClick={saveSettings}>
                Lưu cài đặt
              </CTAButton>
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ─── Info Sheet ─── */}
      <BottomSheetV2 open={showInfo} onClose={() => setShowInfo(false)} title="Lãi kép là gì?">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(16,185,129,0.06)' }}>
            <RefreshCw size={32} color="#10B981" className="mx-auto mb-2" />
            <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>Auto-Compound</p>
            <p style={{ color: c.text2, fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
              Lãi kép tự động cộng phần lãi kiếm được vào số gốc,
              giúp bạn kiếm lãi trên cả lãi — tạo hiệu ứng tăng trưởng nhanh hơn theo thời gian.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: TrendingUp, color: '#10B981', title: 'APY thực tế cao hơn', desc: 'Compound hàng ngày có thể tăng APY thêm 0.03-0.15%' },
              { icon: Clock, color: '#3B82F6', title: 'Hoàn toàn tự động', desc: 'Hệ thống tự compound theo tần suất bạn chọn' },
              { icon: Shield, color: '#8B5CF6', title: 'Không phí phát sinh', desc: 'Auto-compound miễn phí, không tính phí giao dịch' },
              { icon: Zap, color: '#F59E0B', title: 'Ngưỡng tùy chỉnh', desc: 'Chỉ compound khi lãi đạt mức tối thiểu bạn đặt' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: item.color + '15' }}
                >
                  <item.icon size={16} color={item.color} />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.title}</p>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4, marginTop: 2 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-xl p-3"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertTriangle size={13} color="#F59E0B" className="mt-0.5 shrink-0" />
            <span style={{ color: '#F59E0B', fontSize: 11, lineHeight: 1.5 }}>
              Auto-compound chỉ áp dụng cho sản phẩm linh hoạt (flexible).
              Sản phẩm cố định (locked) trả lãi cuối kỳ, không hỗ trợ compound giữa kỳ.
            </span>
          </div>
        </div>
      </BottomSheetV2>

      {/* ─── Success Toast ─── */}
      {showSuccess && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: c.surface, border: '1px solid #10B981',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto',
          }}>
          <CheckCircle size={20} color="#10B981" />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Đã lưu cài đặt!</p>
            <p style={{ color: c.text2, fontSize: 12 }}>Compound sẽ áp dụng từ kỳ tiếp theo.</p>
          </div>
          <button onClick={() => setShowSuccess(false)}><X size={16} color={c.text3} /></button>
        </div>
      )}

      {/* ─── Header ─── */}
      <Header
        title="Lãi kép tự động"
        back
        action={{ icon: Info, onClick: () => setShowInfo(true) }}
      />

      <PageContent gap="default">
        {/* ─── Summary Card ─── */}
        <TrCard variant="hero" rounded="lg" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={18} color={c.primary} />
            <span style={{ color: c.text2, fontSize: 12 }}>Auto-Compound Overview</span>
          </div>
          <div className="flex gap-3">
            <TrCardStat className="flex-1">
              <p style={{ color: c.text3, fontSize: 10 }}>Đang bật</p>
              <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                {activeCount}/{positions.length}
              </p>
            </TrCardStat>
            <TrCardStat className="flex-1">
              <p style={{ color: c.text3, fontSize: 10 }}>Đã compound (USD)</p>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtUsd(totalCompounded)}
              </p>
            </TrCardStat>
            <TrCardStat className="flex-1">
              <p style={{ color: c.text3, fontSize: 10 }}>Tổng lần</p>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                {totalCompoundEvents}
              </p>
            </TrCardStat>
          </div>
        </TrCard>

        {/* ─── Positions List ─── */}
        <PageSection label="Vị thế tiết kiệm" accentColor="#10B981">
          <div className="flex flex-col gap-3">
            {positions.map(pos => {
              const effectiveAPY = pos.autoCompound
                ? (pos.apy + pos.estimatedBoost / 100).toFixed(2)
                : pos.apy.toFixed(1);

              return (
                <TrCard key={pos.id} hover className="p-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: pos.color + '22', border: `1.5px solid ${pos.color}44` }}
                    >
                      <span style={{ color: pos.color, fontSize: 10, fontWeight: 700 }}>
                        {pos.asset.slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{pos.product}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace' }}>
                          {fmtAmount(pos.amount)} {pos.asset}
                        </span>
                        <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                          {effectiveAPY}% APY
                        </span>
                      </div>
                    </div>
                    <ToggleSwitch on={pos.autoCompound} onChange={() => toggleCompound(pos.id)} />
                  </div>

                  {/* Compound details */}
                  {pos.autoCompound && (
                    <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: 11 }}>
                            {pos.compoundFrequency === 'daily' ? 'Hàng ngày' : pos.compoundFrequency === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
                          </span>
                        </div>
                        <span style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                          Ngưỡng: {fmtAmount(pos.compoundThreshold)} {pos.asset}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: c.text2, fontSize: 11 }}>
                          Đã compound: <span style={{ color: '#10B981', fontWeight: 600 }}>
                            {fmtAmount(pos.totalCompounded)} {pos.asset}
                          </span>
                        </span>
                        <span style={{ color: c.text3, fontSize: 10 }}>
                          {pos.compoundCount} lần
                        </span>
                      </div>
                      {pos.lastCompounded !== '—' && (
                        <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                          Gần nhất: {pos.lastCompounded}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Disabled state */}
                  {!pos.autoCompound && (
                    <div
                      className="rounded-xl p-3 mb-3 flex items-center gap-2"
                      style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
                    >
                      <AlertTriangle size={12} color="#F59E0B" />
                      <span style={{ color: '#F59E0B', fontSize: 11 }}>
                        Auto-compound đang tắt — lãi sẽ tích luỹ riêng, không cộng vào gốc
                      </span>
                    </div>
                  )}

                  {/* APY boost indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={12} color={pos.autoCompound ? '#10B981' : c.text3} />
                      <span style={{ color: c.text2, fontSize: 11 }}>
                        {pos.autoCompound
                          ? `+${(pos.estimatedBoost / 100).toFixed(2)}% APY từ compound`
                          : 'Bật compound để tăng APY'}
                      </span>
                    </div>
                    <button
                      onClick={() => { setEditingId(pos.id); hapticSelection(); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
                      style={{ background: c.surface2 }}
                    >
                      <Settings size={12} color={c.text2} />
                      <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Cài đặt</span>
                    </button>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* ─── Compound Calculator Preview ─── */}
        <PageSection label="Mô phỏng hiệu quả" accentColor="#8B5CF6">
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={14} color="#8B5CF6" />
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Ví dụ: 1,000 USDT × 4.5% APY</span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 10 }}>Không compound</p>
                <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>$45.00</p>
                <p style={{ color: c.text3, fontSize: 10 }}>sau 1 năm</p>
              </div>
              <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <p style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>Compound hàng ngày</p>
                <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>$46.03</p>
                <p style={{ color: '#10B981', fontSize: 10 }}>+$1.03 thêm</p>
              </div>
            </div>
            <p style={{ color: c.text3, fontSize: 10, marginTop: 8, lineHeight: 1.5, textAlign: 'center' }}>
              Hiệu quả compound tăng theo thời gian và số vốn lớn hơn.
              Số liệu mô phỏng, APY thực tế có thể thay đổi.
            </p>
          </TrCard>
        </PageSection>

        {/* ─── Locked Products Note ─── */}
        <div
          className="flex items-start gap-2 rounded-xl p-3"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <Info size={13} color="#3B82F6" className="mt-0.5 shrink-0" />
          <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Auto-compound chỉ khả dụng cho sản phẩm <strong>linh hoạt</strong>. Sản phẩm cố định
            trả lãi cuối kỳ và không hỗ trợ compound giữa kỳ. Phí compound: miễn phí.
          </span>
        </div>
      </PageContent>
    </PageLayout>
  );
}
