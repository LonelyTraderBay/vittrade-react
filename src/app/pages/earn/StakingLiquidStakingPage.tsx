import React, { useState } from 'react';
import { Droplet, ArrowRight, ArrowLeftRight, TrendingUp, Shield, Zap, AlertCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';

interface LiquidToken {
  id: string;
  name: string;
  symbol: string;
  underlyingAsset: string;
  exchangeRate: number;
  apy: number;
  totalSupply: number;
  tvl: number;
  protocol: string;
  risks: string[];
  benefits: string[];
}

const LIQUID_TOKENS: LiquidToken[] = [
  {
    id: 'steth',
    name: 'Lido Staked ETH',
    symbol: 'stETH',
    underlyingAsset: 'ETH',
    exchangeRate: 1.002,
    apy: 4.2,
    totalSupply: 9500000,
    tvl: 26600000000,
    protocol: 'Lido',
    risks: ['Smart contract risk', 'Slippage khi swap', 'Depegging risk'],
    benefits: ['Thanh khoản tức thì', 'Có thể dùng làm collateral', 'Nhận rewards liên tục'],
  },
  {
    id: 'reth',
    name: 'Rocket Pool ETH',
    symbol: 'rETH',
    underlyingAsset: 'ETH',
    exchangeRate: 1.058,
    apy: 4.5,
    totalSupply: 580000,
    tvl: 1624000000,
    protocol: 'Rocket Pool',
    risks: ['Phí swap cao hơn', 'Thanh khoản thấp hơn stETH', 'Phụ thuộc node operators'],
    benefits: ['Decentralized hơn', 'APY cao hơn', 'Hỗ trợ mini-pool'],
  },
  {
    id: 'cbeth',
    name: 'Coinbase Wrapped Staked ETH',
    symbol: 'cbETH',
    underlyingAsset: 'ETH',
    exchangeRate: 1.045,
    apy: 3.8,
    totalSupply: 450000,
    tvl: 1260000000,
    protocol: 'Coinbase',
    risks: ['Centralized (Coinbase custody)', 'Thanh khoản trung bình'],
    benefits: ['Uy tín cao (Coinbase)', 'Dễ dàng onboarding', 'Regulated'],
  },
];

export function StakingLiquidStakingPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'stake' | 'swap' | 'holdings'>('stake');
  const [selectedToken, setSelectedToken] = useState<LiquidToken | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [swapFrom, setSwapFrom] = useState('stETH');
  const [swapTo, setSwapTo] = useState('ETH');
  const [swapAmount, setSwapAmount] = useState('');

  const stToken = LIQUID_TOKENS.find(t => t.symbol === swapFrom);
  const receiveAmount = parseFloat(swapAmount || '0') * (stToken?.exchangeRate || 1);
  const slippage = 0.3; // 0.3%
  const minReceive = receiveAmount * (1 - slippage / 100);

  return (
    <PageLayout>
      <Header title="Liquid Staking" back />

      {/* Token Detail Bottom Sheet */}
      <BottomSheetV2
        open={!!selectedToken}
        onClose={() => setSelectedToken(null)}
        title={selectedToken?.name || ''}>
        {selectedToken && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <BottomSheetRow
                label="Exchange Rate"
                value={`1 ${selectedToken.symbol} = ${selectedToken.exchangeRate} ${selectedToken.underlyingAsset}`}
              />
              <BottomSheetRow label="APY" value={`${selectedToken.apy}%`} valueColor="#10B981" />
              <BottomSheetRow
                label="Total Supply"
                value={`${fmtAmount(selectedToken.totalSupply)} ${selectedToken.symbol}`}
              />
              <BottomSheetRow label="TVL" value={fmtUsd(selectedToken.tvl)} highlight />
              <BottomSheetRow label="Protocol" value={selectedToken.protocol} />
            </div>

            <div>
              <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Lợi ích</p>
              <div className="flex flex-col gap-2">
                {selectedToken.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: '#10B981' }} />
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Rủi ro</p>
              <div className="flex flex-col gap-2">
                {selectedToken.risks.map((risk, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: '#EF4444' }} />
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{risk}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </BottomSheetV2>

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Droplet size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Về Liquid Staking
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Stake và nhận liquid token (stToken) có thể giao dịch ngay lập tức. Bạn vẫn nhận phần thưởng staking trong khi giữ thanh khoản 100%.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'stake', label: 'Stake' },
            { id: 'swap', label: 'Swap' },
            { id: 'holdings', label: 'Holdings' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'stake' && (
          <>
            <PageSection label="Chọn Liquid Token">
              <div className="flex flex-col gap-3">
                {LIQUID_TOKENS.map(token => (
                  <TrCard key={token.id} hover className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                        style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
                        💧
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                            {token.symbol}
                          </p>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                            style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                            {token.protocol}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          1 {token.symbol} = {token.exchangeRate} {token.underlyingAsset}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                          {token.apy}%
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>TVL</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          ${(token.tvl / 1e9).toFixed(1)}B
                        </p>
                      </div>
                      <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Supply</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {(token.totalSupply / 1e6).toFixed(1)}M
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedToken(token)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: c.surface2, color: c.text1 }}>
                        Chi tiết
                      </button>
                      <button
                        className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                        style={{ background: c.primary, color: '#FFF' }}>
                        Stake <ArrowRight size={14} />
                      </button>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex gap-2">
                <AlertCircle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  <strong>Lưu ý:</strong> Liquid token có rủi ro smart contract và depegging (mất peg so với asset gốc). Chỉ stake số lượng bạn có thể chấp nhận rủi ro.
                </p>
              </div>
            </div>
          </>
        )}

        {tab === 'swap' && (
          <>
            <TrCard className="p-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 8 }}>
                    Từ
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={swapFrom}
                      onChange={e => setSwapFrom(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl outline-none"
                      style={{
                        background: c.surface2,
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text1,
                        fontSize: 14,
                      }}>
                      <option value="stETH">stETH</option>
                      <option value="rETH">rETH</option>
                      <option value="cbETH">cbETH</option>
                    </select>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.0"
                      value={swapAmount}
                      onChange={e => setSwapAmount(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl outline-none text-right"
                      style={{
                        background: c.surface2,
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text1,
                        fontSize: 16,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>

                <button className="w-10 h-10 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                  <ArrowLeftRight size={18} color={c.text1} />
                </button>

                <div>
                  <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 8 }}>
                    Sang
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={swapTo}
                      onChange={e => setSwapTo(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl outline-none"
                      style={{
                        background: c.surface2,
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text1,
                        fontSize: 14,
                      }}>
                      <option value="ETH">ETH</option>
                      <option value="stETH">stETH</option>
                      <option value="rETH">rETH</option>
                      <option value="cbETH">cbETH</option>
                    </select>
                    <div className="flex-1 px-4 py-3 rounded-xl text-right"
                      style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                      <span style={{ color: c.text1, fontSize: 16, fontFamily: 'monospace', fontWeight: 700 }}>
                        {swapAmount ? receiveAmount.toFixed(6) : '0.0'}
                      </span>
                    </div>
                  </div>
                </div>

                {swapAmount && (
                  <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
                    <BottomSheetRow label="Exchange Rate" value={`1 ${swapFrom} = ${stToken?.exchangeRate} ${swapTo}`} />
                    <BottomSheetRow label="Slippage Tolerance" value={`${slippage}%`} />
                    <BottomSheetRow
                      label="Minimum Received"
                      value={`${minReceive.toFixed(6)} ${swapTo}`}
                      valueColor="#F59E0B"
                    />
                    <BottomSheetRow label="Gas Fee" value="~$2.50" />
                  </div>
                )}
              </div>
            </TrCard>

            <button
              disabled={!swapAmount || parseFloat(swapAmount) <= 0}
              className="w-full py-3.5 rounded-xl font-semibold"
              style={{
                background: (!swapAmount || parseFloat(swapAmount) <= 0) ? c.surface2 : c.primary,
                color: (!swapAmount || parseFloat(swapAmount) <= 0) ? c.text3 : '#FFF',
                opacity: (!swapAmount || parseFloat(swapAmount) <= 0) ? 0.5 : 1,
              }}>
              Swap {swapFrom} → {swapTo}
            </button>

            <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                💡 <strong>Gợi ý:</strong> Swap qua DEX aggregator (1inch, Paraswap) để có rate tốt nhất. Slippage có thể cao hơn trong thời điểm thị trường biến động.
              </p>
            </div>
          </>
        )}

        {tab === 'holdings' && (
          <>
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>
                    Tổng giá trị Liquid Staking
                  </p>
                  <p style={{ color: c.text1, fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtUsd(0)}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '2px solid rgba(59,130,246,0.3)' }}>
                  <Droplet size={28} color="#3B82F6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>stETH Balance</p>
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>0.0000</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>rETH Balance</p>
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>0.0000</p>
                </div>
              </div>
            </TrCard>

            <div className="flex flex-col items-center justify-center py-12">
              <Droplet size={64} color={c.text3} style={{ opacity: 0.3 }} />
              <p style={{ color: c.text3, fontSize: 14, marginTop: 12 }}>
                Bạn chưa có liquid token nào
              </p>
              <button
                onClick={() => setTab('stake')}
                className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: c.primary, color: '#FFF' }}>
                Stake ngay
              </button>
            </div>
          </>
        )}

        {/* Benefits Grid */}
        <PageSection label="Lợi ích Liquid Staking">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Zap, label: 'Thanh khoản tức thì', desc: 'Swap bất kỳ lúc nào' },
              { icon: TrendingUp, label: 'Nhận rewards liên tục', desc: 'APY auto-compound' },
              { icon: Shield, label: 'Làm collateral', desc: 'Vay/cho vay DeFi' },
              { icon: ArrowLeftRight, label: 'Swap dễ dàng', desc: 'Uniswap, Curve' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <TrCard key={idx} className="p-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
                    <Icon size={20} color="#3B82F6" />
                  </div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    {item.label}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    {item.desc}
                  </p>
                </TrCard>
              );
            })}
          </div>
        </PageSection>
      </PageContent>
    </PageLayout>
  );
}
