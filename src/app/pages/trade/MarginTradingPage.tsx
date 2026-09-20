import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, ChevronDown, X, Sliders, BarChart3, Target, Zap } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { MARGIN_POSITIONS, MARGIN_ACCOUNT, CRYPTO_PAIRS } from '../../data/mockData';
import { fmtUsd, fmtPrice, fmtPct, fmtSignedUsd, fmtAmount } from '../../data/formatNumber';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { FONT_SCALE, FONT_WEIGHT, LETTER_SPACING } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, OPACITY, withAlpha } from '../../constants/colors';
import {
  MarginLevelAlert,
  PriceComparison,
  MarginRequirement,
  ADLIndicator,
  CostBreakdown,
  NegativeBalanceProtection,
  LeverageWarning,
} from '../../components/trading/MarginSafetyComponents';
import {
  AppropriatenessTest,
  ClientCategoryBanner,
  getMaxAllowedLeverage,
  LeverageBlocker,
  MarginCloseoutWarning,
  BestExecutionDisclosure,
} from '../../components/trading/RegulatoryCompliance';

const LEVERAGE_OPTIONS = [2, 3, 5, 10, 20, 50];

export function MarginTradingPage() {
  const c = useThemeColors();
  const [mode, setMode] = useState<'cross' | 'isolated'>('cross');
  const [tab, setTab] = useState<'trade' | 'positions' | 'orders'>('trade');
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(5);
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState('67543.21');
  const [amount, setAmount] = useState('');
  const [showLeverageSheet, setShowLeverageSheet] = useState(false);
  const [selectedPair] = useState('BTC/USDT');

  // P0 Safety states
  const [showAppropriatenessTest, setShowAppropriatenessTest] = useState(false);
  const [showLeverageBlocker, setShowLeverageBlocker] = useState(false);
  const [pendingLeverage, setPendingLeverage] = useState<number | null>(null);
  const [hasPassedTest, setHasPassedTest] = useState<Record<number, boolean>>({
    5: true, // Default levels don't need test
    10: false,
    20: false,
    50: false,
  });

  // User profile (mock - in real app from context/API)
  const userRegion: 'EU' | 'UK' | 'SG' | 'US' | 'OTHER' = 'OTHER';
  const userCategory: 'retail' | 'professional' | 'eligible_counterparty' = 'retail';
  const maxAllowedLeverage = getMaxAllowedLeverage({
    region: userRegion,
    clientCategory: userCategory,
    assetClass: 'crypto',
  });

  const pair = CRYPTO_PAIRS.find(p => p.symbol === selectedPair.replace('/', ''));
  const positions = MARGIN_POSITIONS.filter(p => p.mode === mode);
  const totalUnrealizedPnl = positions.reduce((s, p) => s + p.pnl, 0);

  // Calculate mark price (simulated - in real app from websocket)
  const markPrice = pair?.price ?? 67543.21;
  const lastPrice = markPrice * (1 + (Math.random() - 0.5) * 0.001); // Slight variation
  const indexPrice = markPrice * 0.9998;

  // Calculate equity percentage for 50% rule
  const equityPercentage = (MARGIN_ACCOUNT.totalEquity / MARGIN_ACCOUNT.totalMargin) * 100;

  /* ─── Margin level color ─── */
  const mlColor = MARGIN_ACCOUNT.marginLevel > 150 ? c.buy : MARGIN_ACCOUNT.marginLevel > 100 ? c.warn : c.sell;

  /* ─── Leverage change with appropriateness test ─── */
  const handleLeverageChange = (newLeverage: number) => {
    // Check if exceeds regional limit
    if (newLeverage > maxAllowedLeverage) {
      setPendingLeverage(newLeverage);
      setShowLeverageBlocker(true);
      return;
    }

    // Check if user needs appropriateness test
    if (newLeverage > 5 && !hasPassedTest[newLeverage]) {
      setPendingLeverage(newLeverage);
      setShowAppropriatenessTest(true);
      return;
    }

    // All checks passed
    setLeverage(newLeverage);
    setShowLeverageSheet(false);
  };

  const handleTestPass = () => {
    if (pendingLeverage) {
      setHasPassedTest(prev => ({ ...prev, [pendingLeverage]: true }));
      setLeverage(pendingLeverage);
      setPendingLeverage(null);
      setShowLeverageSheet(false);
    }
  };

  const handleTestFail = () => {
    setPendingLeverage(null);
  };

  // Calculate position size and costs
  const positionSize = parseFloat(amount || '0') * (pair?.price ?? 0);
  const tradingFeeRate = 0.0005; // 0.05%
  const borrowInterestDaily = 0.02; // 2% per day for margin borrowing

  return (
    <PageLayout>
      <Header title="Margin Trading" subtitle="Ký quỹ · Giao dịch" back />

      <PageContent gap="default">
        {/* ═══ Client Category Banner ═══ */}
        <ClientCategoryBanner
          category={userCategory}
          onRequestUpgrade={() => {}}
        />

        {/* ═══ Mode Toggle ═══ */}
        <div className="flex rounded-2xl p-1 gap-1" style={{ background: c.surface2 }}>
          {(['cross', 'isolated'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-3 rounded-xl transition-all"
              style={{
                background: mode === m ? c.primary : 'transparent',
                color: mode === m ? '#FFFFFF' : c.text3,
                fontSize: FONT_SCALE.xs,
                fontWeight: mode === m ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
                boxShadow: mode === m ? `0 2px 8px ${withAlpha(c.primary, ALPHA.medium)}` : 'none',
              }}>
              {m === 'cross' ? 'Cross Margin' : 'Isolated Margin'}
            </button>
          ))}
        </div>

        {/* ═══ Margin Level Alert ═══ */}
        <MarginLevelAlert marginLevel={MARGIN_ACCOUNT.marginLevel} />

        {/* ═══ 50% Close-out Warning (EU/UK) ═══ */}
        {(userRegion === 'EU' || userRegion === 'UK') && (
          <MarginCloseoutWarning equityPercentage={equityPercentage} />
        )}

        {/* ═══ Hero Account Summary ═══ */}
        <TrCard variant="hero" className="p-5">
          {/* Row 1: Main stats */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.xs, marginBottom: 4 }}>Tổng vốn ký quỹ</p>
              <p style={{ color: '#FFFFFF', fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace', letterSpacing: LETTER_SPACING.tight }}>
                {fmtUsd(MARGIN_ACCOUNT.totalEquity)}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: totalUnrealizedPnl >= 0 ? withAlpha('#10B981', ALPHA.muted) : withAlpha('#EF4444', ALPHA.muted) }}>
              {totalUnrealizedPnl >= 0
                ? <TrendingUp size={ICON_SIZE.sm} color="#10B981" strokeWidth={ICON_STROKE.standard} />
                : <TrendingDown size={ICON_SIZE.sm} color="#EF4444" strokeWidth={ICON_STROKE.standard} />}
              <span style={{
                color: totalUnrealizedPnl >= 0 ? '#10B981' : '#EF4444',
                fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace',
              }}>{fmtSignedUsd(totalUnrealizedPnl)}</span>
            </div>
          </div>

          {/* Row 2: Stat boxes */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <TrCardStat>
              <p style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>Margin đã dùng</p>
              <p style={{ color: '#F59E0B', fontSize: FONT_SCALE.sm + 1, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace', marginTop: 2 }}>
                {fmtUsd(MARGIN_ACCOUNT.totalMargin)}
              </p>
            </TrCardStat>
            <TrCardStat>
              <p style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>Khả dụng</p>
              <p style={{ color: '#FFFFFF', fontSize: FONT_SCALE.sm + 1, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace', marginTop: 2 }}>
                {fmtUsd(MARGIN_ACCOUNT.availableMargin)}
              </p>
            </TrCardStat>
            <TrCardStat>
              <p style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>PnL chưa chốt</p>
              <p style={{
                color: totalUnrealizedPnl >= 0 ? '#10B981' : '#EF4444',
                fontSize: FONT_SCALE.sm + 1, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace', marginTop: 2,
              }}>{fmtSignedUsd(totalUnrealizedPnl)}</p>
            </TrCardStat>
          </div>

          {/* Row 3: Margin Level bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span style={{ color: c.portfolioTextDim, fontSize: FONT_SCALE.xs }}>Margin Level</span>
              <span style={{ color: mlColor, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                {MARGIN_ACCOUNT.marginLevel.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: `rgba(255,255,255,${OPACITY.muted})` }}>
              <div className="h-full rounded-full transition-all" style={{
                width: `${Math.min(100, MARGIN_ACCOUNT.marginLevel / 3)}%`,
                background: `linear-gradient(90deg, ${mlColor}, ${mlColor}cc)`,
                boxShadow: `0 0 8px ${mlColor}40`,
              }} />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ color: c.portfolioTextMuted, fontSize: 10 }}>0%</span>
              <span style={{ color: c.portfolioTextMuted, fontSize: 10 }}>300%</span>
            </div>
          </div>
        </TrCard>

        {/* ═══ Tab Switcher ═══ */}
        <TabBar
          variant="segment"
          tabs={[
            { id: 'trade', label: 'Giao dịch' },
            { id: 'positions', label: `Vị thế (${positions.length})` },
            { id: 'orders', label: 'Lệnh chờ' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* ═══════════════ Trade Panel ═══════════════ */}
        {tab === 'trade' && (
          <div className="flex flex-col gap-3">
            {/* ═══ Mark Price vs Last Price ═══ */}
            <PriceComparison
              markPrice={markPrice}
              lastPrice={lastPrice}
              indexPrice={indexPrice}
            />

            {/* ═══ IMR/MMR Disclosure ═══ */}
            {positionSize > 0 && (
              <MarginRequirement
                leverage={leverage}
                positionSize={positionSize}
                mode={mode}
              />
            )}

            {/* Pair + Price */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.lg - 3, fontWeight: FONT_WEIGHT.bold }}>{selectedPair}</span>
                  <span className="px-2 py-1 rounded-lg" style={{
                    background: mode === 'cross' ? withAlpha(c.primary, ALPHA.soft) : withAlpha(c.warn, ALPHA.soft),
                    color: mode === 'cross' ? c.primary : c.warn,
                    fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold,
                  }}>{mode.toUpperCase()}</span>
                </div>
                <div className="px-2 py-1 rounded-lg" style={{
                  background: pair && pair.change24h >= 0 ? withAlpha('#10B981', ALPHA.hover) : withAlpha('#EF4444', ALPHA.hover),
                }}>
                  <span style={{
                    color: pair && pair.change24h >= 0 ? '#10B981' : '#EF4444',
                    fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace',
                  }}>{pair ? fmtPct(pair.change24h) : ''}</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span style={{ color: c.text1, fontSize: 26, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace', letterSpacing: LETTER_SPACING.tight }}>
                  {pair ? fmtPrice(pair.price) : '—'}
                </span>
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 3 }}>USDT</span>
              </div>
            </TrCard>

            {/* Long / Short toggle */}
            <div className="flex rounded-2xl p-1 gap-1" style={{ background: c.surface2 }}>
              <button onClick={() => setSide('long')}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: side === 'long' ? withAlpha('#10B981', ALPHA.muted) : 'transparent',
                  border: side === 'long' ? `1px solid ${withAlpha('#10B981', ALPHA.border)}` : '1px solid transparent',
                  boxShadow: side === 'long' ? `0 2px 8px ${withAlpha('#10B981', ALPHA.muted)}` : 'none',
                }}>
                <TrendingUp size={ICON_SIZE.sm} color={side === 'long' ? '#10B981' : c.text3} strokeWidth={ICON_STROKE.standard} />
                <span style={{ color: side === 'long' ? '#10B981' : c.text3, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Long</span>
              </button>
              <button onClick={() => setSide('short')}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: side === 'short' ? withAlpha('#EF4444', ALPHA.muted) : 'transparent',
                  border: side === 'short' ? `1px solid ${withAlpha('#EF4444', ALPHA.border)}` : '1px solid transparent',
                  boxShadow: side === 'short' ? `0 2px 8px ${withAlpha('#EF4444', ALPHA.muted)}` : 'none',
                }}>
                <TrendingDown size={ICON_SIZE.sm} color={side === 'short' ? '#EF4444' : c.text3} strokeWidth={ICON_STROKE.standard} />
                <span style={{ color: side === 'short' ? '#EF4444' : c.text3, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Short</span>
              </button>
            </div>

            {/* Leverage selector */}
            <TrCard as="button" hover onClick={() => setShowLeverageSheet(!showLeverageSheet)} className="p-4 flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: withAlpha('#F59E0B', ALPHA.soft) }}>
                  <Sliders size={ICON_SIZE.sm} color="#F59E0B" strokeWidth={ICON_STROKE.standard} />
                </div>
                <div className="text-left">
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Đòn bẩy</span>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Nhân {leverage}x giá trị vị thế</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg" style={{
                  background: leverage >= 20 ? withAlpha('#EF4444', ALPHA.soft) : withAlpha('#F59E0B', ALPHA.soft),
                  color: leverage >= 20 ? '#EF4444' : '#F59E0B',
                  fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold,
                }}>{leverage}x</span>
                <ChevronDown size={ICON_SIZE.sm} color={c.text3} strokeWidth={ICON_STROKE.standard} style={{
                  transform: showLeverageSheet ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease',
                }} />
              </div>
            </TrCard>

            {/* Leverage sheet (inner pattern) */}
            {showLeverageSheet && (
              <TrCard variant="inner" className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Chọn đòn bẩy</span>
                  <button onClick={() => setShowLeverageSheet(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: c.surface3 }}>
                    <X size={ICON_SIZE.sm} color={c.text3} strokeWidth={ICON_STROKE.standard} />
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {LEVERAGE_OPTIONS.map(lev => (
                    <button key={lev} onClick={() => handleLeverageChange(lev)}
                      className="py-3 rounded-xl transition-all"
                      style={{
                        background: leverage === lev ? c.primary : c.surface,
                        color: leverage === lev ? '#FFF' : c.text2,
                        fontSize: FONT_SCALE.xs,
                        fontWeight: FONT_WEIGHT.bold,
                        boxShadow: leverage === lev ? `0 2px 8px ${withAlpha(c.primary, ALPHA.border)}` : 'none',
                        border: leverage === lev ? 'none' : `1px solid ${c.cardBorder}`,
                      }}>{lev}x</button>
                  ))}
                </div>
                {/* Risk slider visualization */}
                <div className="mt-3 h-1.5 rounded-full overflow-hidden flex">
                  {LEVERAGE_OPTIONS.map((lev, i) => (
                    <div key={lev} className="flex-1 transition-all" style={{
                      background: lev <= leverage
                        ? lev <= 5 ? '#10B981' : lev <= 10 ? '#F59E0B' : '#EF4444'
                        : c.surface3,
                      marginLeft: i > 0 ? 2 : 0,
                      borderRadius: 4,
                    }} />
                  ))}
                </div>
                {leverage >= 20 && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-3 rounded-xl" style={{ background: withAlpha('#EF4444', ALPHA.muted), border: `1px solid ${withAlpha('#EF4444', ALPHA.muted)}` }}>
                    <AlertTriangle size={ICON_SIZE.sm} color="#EF4444" strokeWidth={ICON_STROKE.standard} />
                    <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs }}>Đòn bẩy cao = rủi ro thanh lý cao</span>
                  </div>
                )}
              </TrCard>
            )}

            {/* Order type */}
            <div className="flex gap-2">
              {(['limit', 'market'] as const).map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  className="flex-1 py-3 rounded-xl transition-all"
                  style={{
                    background: orderType === t ? c.chipActiveBg : 'transparent',
                    color: orderType === t ? c.chipActiveText : c.chipText,
                    border: `1px solid ${orderType === t ? c.chipActiveBorder : c.chipBorder}`,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.semibold,
                  }}>{t === 'limit' ? 'Limit Order' : 'Market Order'}</button>
              ))}
            </div>

            {/* Price input */}
            {orderType === 'limit' && (
              <TrCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Giá đặt lệnh</span>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>USDT</span>
                </div>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }} />
              </TrCard>
            )}

            {/* Amount input */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Số lượng (BTC)</span>
                <button onClick={() => setAmount(String((MARGIN_ACCOUNT.availableMargin * leverage / (pair?.price ?? 67543)).toFixed(6)))}
                  className="px-3 py-1 rounded-lg"
                  style={{ background: withAlpha(c.primary, ALPHA.hover), color: c.primary, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  Tối đa
                </button>
              </div>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-transparent outline-none"
                style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }} />
              {amount && parseFloat(amount) > 0 && (
                <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                  <div className="flex-1">
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Margin cần</p>
                    <p style={{ color: c.warn, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                      ~{fmtUsd(parseFloat(amount || '0') * (pair?.price ?? 0) / leverage)}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Giá trị vị thế</p>
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                      ~{fmtUsd(parseFloat(amount || '0') * (pair?.price ?? 0))}
                    </p>
                  </div>
                </div>
              )}
            </TrCard>

            {/* Order summary */}
            <TrCard variant="inner" className="px-4 py-3 flex flex-col gap-2">
              {[
                { label: 'Margin khả dụng', value: fmtUsd(MARGIN_ACCOUNT.availableMargin), color: c.text1 },
                { label: 'Giá thanh lý (ước tính)', value: amount && parseFloat(amount) > 0 ? fmtPrice(parseFloat(price) * (side === 'long' ? (1 - 0.9 / leverage) : (1 + 0.9 / leverage))) : '—', color: '#EF4444' },
                { label: 'Phí giao dịch (0.05%)', value: amount && parseFloat(amount) > 0 ? fmtUsd(parseFloat(amount || '0') * (pair?.price ?? 0) * 0.0005) : '—', color: c.text2 },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{row.label}</span>
                  <span style={{ color: row.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>{row.value}</span>
                </div>
              ))}
            </TrCard>

            <CTAButton
              onClick={() => {}}
              disabled={!amount || parseFloat(amount) <= 0}
              variant={side === 'long' ? 'success' : 'danger'}
            >
              {side === 'long' ? 'Mở Long' : 'Mở Short'} {selectedPair} ({leverage}x)
            </CTAButton>

            {/* ═══ Cost Breakdown (MiFID II Transparency) ═══ */}
            {positionSize > 0 && (
              <CostBreakdown
                positionSize={positionSize}
                tradingFeeRate={tradingFeeRate}
                borrowInterest={borrowInterestDaily}
                holdDuration={24}
              />
            )}

            {/* ═══ Leverage Warning ═══ */}
            <LeverageWarning leverage={leverage} region={userRegion} />

            {/* ═══ Negative Balance Protection ═══ */}
            <NegativeBalanceProtection />

            {/* ═══ Best Execution Disclosure ═══ */}
            <BestExecutionDisclosure />
          </div>
        )}

        {/* ═══════════════ Positions Tab ═══════════════ */}
        {tab === 'positions' && (
          <div className="flex flex-col gap-3">
            {positions.length === 0 && (
              <TrCard className="py-12 text-center">
                <BarChart3 size={ICON_SIZE.xl + 2} color={c.text3} strokeWidth={ICON_STROKE.standard} className="mx-auto mb-3" />
                <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Chưa có vị thế</p>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginTop: 4 }}>
                  {mode === 'cross' ? 'Cross' : 'Isolated'} margin positions sẽ hiển thị tại đây
                </p>
              </TrCard>
            )}
            {positions.map(pos => {
              const isProfit = pos.pnl >= 0;
              const accentColor = isProfit ? withAlpha('#10B981', ALPHA.muted) : withAlpha('#EF4444', ALPHA.muted);
              const accentBorderColor = isProfit ? withAlpha('#10B981', ALPHA.soft) : withAlpha('#EF4444', ALPHA.soft);
              return (
                <TrCard key={pos.id} hover accentBorder={accentBorderColor} className="p-4 overflow-hidden relative">
                  {/* Position accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{
                    background: isProfit ? '#10B981' : '#EF4444',
                    borderRadius: '0 0 2px 2px',
                  }} />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{pos.pair}</span>
                      <span className="px-2 py-1 rounded-lg" style={{
                        background: pos.side === 'long' ? withAlpha('#10B981', ALPHA.soft) : withAlpha('#EF4444', ALPHA.soft),
                        color: pos.side === 'long' ? '#10B981' : '#EF4444',
                        fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold,
                      }}>{pos.side === 'long' ? 'LONG' : 'SHORT'} {pos.leverage}x</span>
                      <span className="px-2 py-1 rounded-md" style={{
                        background: withAlpha(c.primary, ALPHA.hover),
                        color: c.primary, fontSize: 10, fontWeight: FONT_WEIGHT.semibold,
                      }}>{pos.mode.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* PnL highlight */}
                  <div className="rounded-xl p-3 mb-3" style={{ background: accentColor }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Lợi nhuận chưa chốt</p>
                        <p style={{
                          color: isProfit ? '#10B981' : '#EF4444',
                          fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace',
                        }}>{fmtSignedUsd(pos.pnl)}</p>
                      </div>
                      <div className="px-3 py-2 rounded-xl" style={{
                        background: isProfit ? withAlpha('#10B981', ALPHA.muted) : withAlpha('#EF4444', ALPHA.muted),
                        border: `1px solid ${isProfit ? withAlpha('#10B981', ALPHA.soft) : withAlpha('#EF4444', ALPHA.soft)}`,
                      }}>
                        <span style={{
                          color: isProfit ? '#10B981' : '#EF4444',
                          fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace',
                        }}>{fmtPct(pos.pnlPct)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-3 gap-x-3 gap-y-3 mb-3">
                    {[
                      { label: 'Entry Price', value: fmtPrice(pos.entryPrice), color: c.text1 },
                      { label: 'Mark Price', value: fmtPrice(pos.markPrice), color: c.text1 },
                      { label: 'Size', value: fmtAmount(pos.size), color: c.text1 },
                      { label: 'Margin', value: fmtUsd(pos.margin), color: c.text2 },
                      { label: 'Liq. Price', value: fmtPrice(pos.liquidationPrice), color: '#EF4444' },
                      { label: 'Margin Ratio', value: `${pos.marginRatio}%`, color: pos.marginRatio > 10 ? '#10B981' : '#F59E0B' },
                    ].map(d => (
                      <div key={d.label}>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>{d.label}</p>
                        <p style={{ color: d.color, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>{d.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                    <button className="flex-1 py-3 rounded-xl transition-all"
                      style={{ background: withAlpha(c.primary, ALPHA.muted), border: `1px solid ${withAlpha(c.primary, ALPHA.muted)}`, color: c.primary, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      TP/SL
                    </button>
                    <button className="flex-1 py-3 rounded-xl transition-all"
                      style={{ background: withAlpha('#EF4444', ALPHA.muted), border: `1px solid ${withAlpha('#EF4444', ALPHA.muted)}`, color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      Đóng vị thế
                    </button>
                  </div>
                </TrCard>
              );
            })}
          </div>
        )}

        {/* ═══════════════ Orders Tab ═══════════════ */}
        {tab === 'orders' && (
          <TrCard className="py-12 text-center">
            <Target size={ICON_SIZE.xl + 2} color={c.text3} strokeWidth={ICON_STROKE.standard} className="mx-auto mb-3" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Không có lệnh chờ</p>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginTop: 4 }}>Các lệnh limit đang chờ khớp sẽ hiển thị tại đây</p>
          </TrCard>
        )}
      </PageContent>

      {/* ═══════════════ REGULATORY DIALOGS ═══════════════ */}
      {/* Appropriateness Test */}
      <AppropriatenessTest
        leverageRequested={pendingLeverage ?? 5}
        onPass={handleTestPass}
        onFail={handleTestFail}
        open={showAppropriatenessTest}
        onClose={() => setShowAppropriatenessTest(false)}
      />

      {/* Leverage Blocker (Regional Limits) */}
      <LeverageBlocker
        requestedLeverage={pendingLeverage ?? 5}
        maxAllowed={maxAllowedLeverage}
        reason={`Theo quy định ${userRegion}, tài khoản ${userCategory === 'retail' ? 'cá nhân' : 'professional'} chỉ được sử dụng đòn bẩy tối đa ${maxAllowedLeverage}x cho crypto derivatives.`}
        open={showLeverageBlocker}
        onClose={() => setShowLeverageBlocker(false)}
      />
    </PageLayout>
  );
}