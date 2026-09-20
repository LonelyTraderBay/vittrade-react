/**
 * ══════════════════════════════════════════════════════════════════
 *  TOKEN INFO / FUNDAMENTALS PAGE — P0 Enterprise Market Foundation
 * ══════════════════════════════════════════════════════════════════
 *  Token economics, supply distribution, on-chain metrics,
 *  project info, contract addresses, ATH/ATL.
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Globe, FileText, Github, Twitter, Send,
  TrendingUp, TrendingDown, Copy, Check, ExternalLink,
  ArrowUpRight, ArrowDownRight, Info, ChevronRight,
  Activity, Users, Layers, Shield, Clock, BarChart3,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { fmtPrice, fmtPct, fmtCompact, fmtUsd } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { CRYPTO_PAIRS } from '../../data/mockData';
import { getTokenFundamentals, type TokenFundamentals } from '../../data/marketOverviewData';

const TABS = ['Tổng quan', 'On-chain', 'Dự án'];

/* ─── Info Row ─── */
function InfoRow({
  label, value, valueColor, suffix, icon: Icon, iconColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
  suffix?: string;
  icon?: React.ElementType;
  iconColor?: string;
}) {
  const c = useThemeColors();
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={12} color={iconColor ?? c.text3} />}
        <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span style={{
          fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold,
          color: valueColor ?? c.text1, fontFamily: 'monospace',
        }}>
          {value}
        </span>
        {suffix && (
          <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Supply Distribution Pie Chart (CSS-only) ─── */
function SupplyPieChart({ distribution }: { distribution: TokenFundamentals['supplyDistribution'] }) {
  const c = useThemeColors();

  // Build conic gradient
  let cumulative = 0;
  const gradientParts = distribution.map(d => {
    const start = cumulative;
    cumulative += d.percentage;
    return `${d.color} ${start}% ${cumulative}%`;
  });
  const gradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="flex items-center gap-4">
      <div
        className="shrink-0 rounded-full"
        style={{
          width: 80, height: 80,
          background: gradient,
          position: 'relative',
        }}
      >
        {/* Inner circle for donut effect */}
        <div
          className="absolute rounded-full"
          style={{
            top: 16, left: 16, right: 16, bottom: 16,
            background: c.surface,
          }}
        />
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {distribution.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text2, flex: 1 }}>{d.label}</span>
            <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
              {d.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Contract Address Row ─── */
function ContractRow({ network, address }: { network: string; address: string }) {
  const c = useThemeColors();
  const [copied, setCopied] = useState(false);
  const toast = useActionToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(address).catch(() => {});
    setCopied(true);
    toast.info('Đã sao chép địa chỉ');
    setTimeout(() => setCopied(false), 2000);
  };

  const masked = `${address.slice(0, 8)}...${address.slice(-6)}`;

  return (
    <div className="flex items-center gap-2 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
      <Shield size={12} color={c.text3} />
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>{network}</p>
        <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, color: c.text1, fontFamily: 'monospace' }}>
          {masked}
        </p>
      </div>
      <button onClick={handleCopy} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: c.surface2 }}>
        {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} color={c.text3} />}
      </button>
    </div>
  );
}

/* ─── Link Button ─── */
function LinkButton({ icon: Icon, label, url, color }: {
  icon: React.ElementType; label: string; url: string; color: string;
}) {
  const c = useThemeColors();
  if (!url) return null;

  return (
    <TrCard
      as="button"
      hover
      className="p-3 flex items-center gap-2"
      onClick={() => window.open(url, '_blank')}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}12` }}>
        <Icon size={14} color={color} />
      </div>
      <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, color: c.text1, flex: 1, textAlign: 'left' }}>
        {label}
      </span>
      <ExternalLink size={12} color={c.text3} />
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export function TokenInfoPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { pairId } = useParams();
  const { hapticSelection } = useHaptic();
  const [tab, setTab] = useState(TABS[0]);

  const pair = CRYPTO_PAIRS.find(p => p.id === pairId) ?? CRYPTO_PAIRS[0];
  const fundamentals = getTokenFundamentals(pairId ?? '');

  // Fallback if no fundamentals data
  if (!fundamentals) {
    return (
      <PageLayout>
        <Header title={`${pair.baseAsset} - Thông tin`} back />
        <PageContent gap="default">
          <TrCard className="p-6 flex flex-col items-center gap-3">
            <Info size={32} color={c.text3} />
            <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
              Chưa có dữ liệu chi tiết
            </p>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, textAlign: 'center' }}>
              Thông tin cơ bản về {pair.baseAsset} sẽ được cập nhật sớm.
              Bạn có thể xem biểu đồ giá và sổ lệnh tại trang chi tiết.
            </p>
            <button
              onClick={() => navigate(`${prefix}/pair/${pairId}`)}
              className="rounded-xl px-4 py-2 mt-2"
              style={{ background: c.chipActiveBg, color: c.chipActiveText, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}
            >
              Xem biểu đồ giá
            </button>
          </TrCard>

          {/* Basic stats from pair */}
          <PageSection label="Thông tin cơ bản" accentColor={pair.logoColor}>
            <TrCard className="px-4">
              <InfoRow label="Giá hiện tại" value={fmtPrice(pair.price)} />
              <InfoRow label="Thay đổi 24h" value={fmtPct(pair.change24h)} valueColor={pair.change24h >= 0 ? '#10B981' : '#EF4444'} />
              <InfoRow label="Cao 24h" value={fmtPrice(pair.high24h)} valueColor="#10B981" />
              <InfoRow label="Thấp 24h" value={fmtPrice(pair.low24h)} valueColor="#EF4444" />
              <InfoRow label="Khối lượng 24h" value={fmtCompact(pair.volume24h, { prefix: '$' })} />
              <InfoRow label="Vốn hóa thị trường" value={fmtCompact(pair.marketCap, { prefix: '$' })} />
            </TrCard>
          </PageSection>
        </PageContent>
      </PageLayout>
    );
  }

  const f = fundamentals;
  const supplyPct = f.maxSupply ? ((f.circulatingSupply / f.maxSupply) * 100) : null;
  const athDropPct = ((pair.price - f.allTimeHigh) / f.allTimeHigh) * 100;
  const atlGainPct = ((pair.price - f.allTimeLow) / f.allTimeLow) * 100;

  return (
    <PageLayout>
      <Header title={`${f.symbol} - Thông tin`} back />
      <TabBar
        tabs={TABS}
        active={tab}
        onChange={(t) => { setTab(t); hapticSelection(); }}
        variant="underline"
      />
      <PageContent gap="default">

        {/* ─── Tab: Tổng quan ─── */}
        {tab === 'Tổng quan' && (
          <>
            {/* Hero Price Card */}
            <TrCard variant="hero" className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: `${pair.logoColor}20` }}
                >
                  <span style={{ fontSize: 14, fontWeight: FONT_WEIGHT.bold, color: pair.logoColor }}>
                    {f.symbol}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                    {f.name}
                  </p>
                  <p style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                    {f.consensus}
                  </p>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <span style={{ fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                  {fmtPrice(pair.price)}
                </span>
                <span
                  className="rounded-lg px-2 py-0.5 mb-1"
                  style={{
                    fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold,
                    color: pair.change24h >= 0 ? '#10B981' : '#EF4444',
                    background: pair.change24h >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  }}
                >
                  {pair.change24h >= 0 ? '▲' : '▼'} {fmtPct(Math.abs(pair.change24h))}
                </span>
              </div>
            </TrCard>

            {/* Market Stats */}
            <PageSection label="Thống kê thị trường" accentColor={pair.logoColor}>
              <TrCard className="px-4">
                <InfoRow label="Vốn hóa thị trường" value={fmtCompact(pair.marketCap, { prefix: '$' })} icon={BarChart3} iconColor="#3B82F6" />
                <InfoRow label="FDV" value={fmtCompact(f.fullyDilutedValuation, { prefix: '$' })} icon={Layers} iconColor="#8B5CF6" />
                <InfoRow label="Khối lượng 24h" value={fmtCompact(pair.volume24h, { prefix: '$' })} icon={Activity} iconColor="#10B981" />
                <InfoRow label="Vol/MCap" value={((pair.volume24h / pair.marketCap) * 100).toFixed(2) + '%'} icon={TrendingUp} iconColor="#F59E0B" />
                <InfoRow label="ROI 1 năm" value={fmtPct(f.roi1y)} valueColor={f.roi1y >= 0 ? '#10B981' : '#EF4444'} icon={ArrowUpRight} iconColor={f.roi1y >= 0 ? '#10B981' : '#EF4444'} />
              </TrCard>
            </PageSection>

            {/* Supply */}
            <PageSection label="Cung token" accentColor="#3B82F6">
              <TrCard className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Lưu hành</span>
                    <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                      {fmtCompact(f.circulatingSupply)} {f.symbol}
                    </span>
                  </div>
                  {supplyPct !== null && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: c.surface2 }}>
                        <div className="rounded-full" style={{ width: `${supplyPct}%`, height: '100%', background: pair.logoColor }} />
                      </div>
                      <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, fontFamily: 'monospace' }}>
                        {supplyPct.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Tổng cung</span>
                    <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
                      {fmtCompact(f.totalSupply)} {f.symbol}
                    </span>
                  </div>
                  {f.maxSupply !== null && (
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Cung tối đa</span>
                      <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
                        {fmtCompact(f.maxSupply)} {f.symbol}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Tỷ lệ lạm phát</span>
                    <span style={{
                      fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold,
                      color: f.inflationRate > 0 ? '#F59E0B' : '#10B981', fontFamily: 'monospace',
                    }}>
                      {f.inflationRate > 0 ? '+' : ''}{f.inflationRate}%
                    </span>
                  </div>
                </div>
              </TrCard>
            </PageSection>

            {/* Distribution */}
            <PageSection label="Phân bổ cung" accentColor="#8B5CF6">
              <TrCard className="p-4">
                <SupplyPieChart distribution={f.supplyDistribution} />
              </TrCard>
            </PageSection>

            {/* ATH / ATL */}
            <PageSection label="Kỷ lục giá" accentColor="#F59E0B">
              <div className="grid grid-cols-2 gap-3">
                <TrCard className="p-3" accentBorder="rgba(16,185,129,0.15)">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={12} color="#10B981" />
                    <span style={{ fontSize: FONT_SCALE.micro, color: '#10B981', fontWeight: FONT_WEIGHT.semibold }}>
                      ATH
                    </span>
                  </div>
                  <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                    {fmtPrice(f.allTimeHigh)}
                  </p>
                  <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
                    {f.allTimeHighDate}
                  </p>
                  <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: '#EF4444', fontFamily: 'monospace', marginTop: 4 }}>
                    {athDropPct.toFixed(1)}% so với ATH
                  </p>
                </TrCard>

                <TrCard className="p-3" accentBorder="rgba(239,68,68,0.15)">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={12} color="#EF4444" />
                    <span style={{ fontSize: FONT_SCALE.micro, color: '#EF4444', fontWeight: FONT_WEIGHT.semibold }}>
                      ATL
                    </span>
                  </div>
                  <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                    {fmtPrice(f.allTimeLow)}
                  </p>
                  <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
                    {f.allTimeLowDate}
                  </p>
                  <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: '#10B981', fontFamily: 'monospace', marginTop: 4 }}>
                    +{fmtCompact(atlGainPct)}% so với ATL
                  </p>
                </TrCard>
              </div>
            </PageSection>

            {/* Navigate to chart */}
            <TrCard
              as="button"
              hover
              className="p-4 flex items-center gap-3"
              onClick={() => navigate(`${prefix}/pair/${pairId}`)}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                <BarChart3 size={18} color="#3B82F6" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                  Xem biểu đồ & giao dịch
                </p>
                <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
                  Chart, sổ lệnh, giao dịch gần đây
                </p>
              </div>
              <ChevronRight size={14} color={c.text3} />
            </TrCard>
          </>
        )}

        {/* ─── Tab: On-chain ─── */}
        {tab === 'On-chain' && (
          <>
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} color="#10B981" />
                <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2 }}>
                  Hoạt động mạng lưới (24h)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Địa chỉ hoạt động</p>
                  <p style={{ fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                    {fmtCompact(f.activeAddresses24h)}
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Giao dịch</p>
                  <p style={{ fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                    {fmtCompact(f.txCount24h)}
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Tổng holders</p>
                  <p style={{ fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                    {fmtCompact(f.holders)}
                  </p>
                </div>
                {f.tvl !== undefined && (
                  <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                    <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>TVL</p>
                    <p style={{ fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                      {fmtCompact(f.tvl, { prefix: '$' })}
                    </p>
                  </div>
                )}
              </div>
            </TrCard>

            {/* Network Info */}
            <PageSection label="Thông tin mạng lưới" accentColor="#3B82F6">
              <TrCard className="px-4">
                <InfoRow label="Mạng lưới" value={f.network} icon={Globe} iconColor="#3B82F6" />
                <InfoRow label="Đồng thuận" value={f.consensus} icon={Shield} iconColor="#8B5CF6" />
                <InfoRow label="Ngày ra mắt" value={f.launchDate} icon={Clock} iconColor="#F59E0B" />
              </TrCard>
            </PageSection>

            {/* Contract Addresses */}
            {f.contractAddresses.length > 0 && (
              <PageSection label="Địa chỉ hợp đồng" accentColor="#10B981">
                <TrCard className="px-4">
                  {f.contractAddresses.map((ca, i) => (
                    <ContractRow key={i} network={ca.network} address={ca.address} />
                  ))}
                </TrCard>
              </PageSection>
            )}

            {/* Empty state for no contract */}
            {f.contractAddresses.length === 0 && (
              <TrCard className="p-4">
                <div className="flex items-center gap-2">
                  <Info size={14} color={c.text3} />
                  <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                    {f.symbol === 'BTC' ? 'Bitcoin là blockchain gốc, không có hợp đồng token.' : 'Chưa có thông tin hợp đồng.'}
                  </span>
                </div>
              </TrCard>
            )}
          </>
        )}

        {/* ─── Tab: Dự án ─── */}
        {tab === 'Dự án' && (
          <>
            {/* Description */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} color="#3B82F6" />
                <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2 }}>
                  Giới thiệu
                </span>
              </div>
              <p style={{ fontSize: FONT_SCALE.sm, color: c.text1, lineHeight: 1.6 }}>
                {f.description}
              </p>
            </TrCard>

            {/* Links */}
            <PageSection label="Liên kết" accentColor="#3B82F6">
              <div className="flex flex-col gap-2">
                <LinkButton icon={Globe} label="Website" url={f.website} color="#3B82F6" />
                <LinkButton icon={FileText} label="Whitepaper" url={f.whitepaper} color="#8B5CF6" />
                <LinkButton icon={Github} label="GitHub" url={f.github} color="#6B7280" />
                <LinkButton icon={Twitter} label="Twitter" url={f.twitter} color="#1DA1F2" />
                {f.telegram && <LinkButton icon={Send} label="Telegram" url={f.telegram} color="#0088CC" />}
              </div>
            </PageSection>

            {/* Key Metrics Summary */}
            <PageSection label="Chỉ số quan trọng" accentColor="#10B981">
              <TrCard className="px-4">
                <InfoRow label="Vốn hóa" value={fmtCompact(pair.marketCap, { prefix: '$' })} />
                <InfoRow label="FDV" value={fmtCompact(f.fullyDilutedValuation, { prefix: '$' })} />
                <InfoRow label="Cung lưu hành" value={`${fmtCompact(f.circulatingSupply)} ${f.symbol}`} />
                <InfoRow label="Tổng cung" value={`${fmtCompact(f.totalSupply)} ${f.symbol}`} />
                {f.maxSupply && <InfoRow label="Cung tối đa" value={`${fmtCompact(f.maxSupply)} ${f.symbol}`} />}
                <InfoRow label="ROI 1 năm" value={`${f.roi1y > 0 ? '+' : ''}${f.roi1y}%`} valueColor={f.roi1y >= 0 ? '#10B981' : '#EF4444'} />
              </TrCard>
            </PageSection>
          </>
        )}

        {/* Footer disclaimer */}
        <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="flex items-start gap-2">
            <Info size={12} color="#F59E0B" className="shrink-0 mt-1" />
            <p style={{ fontSize: FONT_SCALE.micro, color: '#F59E0B', lineHeight: 1.5 }}>
              Thông tin mang tính tham khảo, không phải lời khuyên đầu tư.
              Hãy tự nghiên cứu trước khi đưa ra quyết định.
            </p>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}