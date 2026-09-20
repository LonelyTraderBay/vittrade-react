import React, { useState } from 'react';
import { Sparkles, TrendingUp, Shield, Zap, Target, ArrowRight, AlertCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';

interface UserProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  liquidityNeeds: 'high' | 'medium' | 'low';
  totalPortfolio: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  allocation: { product: string; percentage: number; apy: number }[];
  expectedAPY: number;
  riskLevel: 'low' | 'medium' | 'high';
  pros: string[];
  cons: string[];
  bestFor: string[];
}

const USER_PROFILE: UserProfile = {
  riskTolerance: 'moderate',
  investmentHorizon: 'medium',
  liquidityNeeds: 'medium',
  totalPortfolio: 10000,
};

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'conservative',
    title: 'Chiến lược An toàn',
    description: 'Ưu tiên bảo toàn vốn với APY ổn định. Phù hợp beginners và người không thích rủi ro.',
    allocation: [
      { product: 'USDT Flexible', percentage: 50, apy: 6.5 },
      { product: 'BTC Fixed 60D', percentage: 30, apy: 5.8 },
      { product: 'ETH Fixed 30D', percentage: 20, apy: 4.5 },
    ],
    expectedAPY: 5.8,
    riskLevel: 'low',
    pros: [
      'Rủi ro thấp nhất (stablecoin + top crypto)',
      '50% thanh khoản tức thì (Flexible)',
      'APY ổn định, không biến động',
    ],
    cons: [
      'APY thấp hơn chiến lược khác',
      'Phụ thuộc stablecoin (USDT risk)',
    ],
    bestFor: [
      'Beginners mới bắt đầu staking',
      'Số lượng lớn (&gt;$50,000)',
      'Người không thích rủi ro',
    ],
  },
  {
    id: 'balanced',
    title: 'Chiến lược Cân bằng',
    description: 'Cân bằng giữa APY và rủi ro. Phù hợp nhất cho đa số users.',
    allocation: [
      { product: 'USDT Flexible', percentage: 30, apy: 6.5 },
      { product: 'ETH Fixed 60D', percentage: 35, apy: 7.2 },
      { product: 'SOL Fixed 30D', percentage: 25, apy: 9.8 },
      { product: 'stETH Liquid', percentage: 10, apy: 4.2 },
    ],
    expectedAPY: 7.2,
    riskLevel: 'medium',
    pros: [
      'APY cao hơn 25% so với Conservative',
      'Vẫn có 30% thanh khoản tức thì',
      'Đa dạng hóa tốt (stablecoin + top alts)',
    ],
    cons: [
      'Rủi ro giá altcoin (ETH, SOL)',
      'Liquid staking có depegging risk',
    ],
    bestFor: [
      'Users có kinh nghiệm crypto',
      'Số lượng $5,000-50,000',
      'Người chấp nhận rủi ro vừa phải',
    ],
  },
  {
    id: 'aggressive',
    title: 'Chiến lược Tăng trưởng',
    description: 'Tối đa hóa APY với rủi ro cao hơn. Phù hợp cho risk-seekers và số lượng nhỏ.',
    allocation: [
      { product: 'SOL Fixed 90D', percentage: 35, apy: 10.5 },
      { product: 'ETH-USDT LP (DeFi)', percentage: 30, apy: 18.7 },
      { product: 'rETH Liquid', percentage: 20, apy: 4.5 },
      { product: 'USDT Flexible', percentage: 15, apy: 6.5 },
    ],
    expectedAPY: 11.3,
    riskLevel: 'high',
    pros: [
      'APY cao nhất (+95% so với Conservative)',
      'Tận dụng DeFi liquidity mining',
      'Vẫn giữ 15% stablecoin an toàn',
    ],
    cons: [
      'Rủi ro smart contract (DeFi)',
      'Chỉ 15% thanh khoản tức thì',
      'Rủi ro giá altcoin cao',
    ],
    bestFor: [
      'Experienced traders',
      'Số lượng nhỏ (&lt;$5,000)',
      'Người sẵn sàng chấp nhận rủi ro',
    ],
  },
];

const PERSONALIZED_TIPS = [
  {
    icon: Target,
    title: 'Dựa trên Profile của bạn',
    desc: 'Moderate risk + Medium horizon → Balanced Strategy phù hợp nhất',
    color: '#3B82F6',
  },
  {
    icon: Zap,
    title: 'Tối ưu hóa nhanh',
    desc: 'Bật Auto-compound cho tất cả vị thế để tăng APY thêm 5-10%',
    color: '#10B981',
  },
  {
    icon: Shield,
    title: 'Giảm rủi ro',
    desc: 'Với $10,000 portfolio, nên mua Standard Insurance Plan ($100/năm)',
    color: '#F59E0B',
  },
];

export function StakingRecommendationsPage() {
  const c = useThemeColors();
  const [selectedStrategy, setSelectedStrategy] = useState<Recommendation | null>(null);
  const [customAmount, setCustomAmount] = useState('10000');

  const handleApplyStrategy = (strategy: Recommendation) => {
    alert(`Đang áp dụng chiến lược "${strategy.title}"...\n\nBạn sẽ được chuyển đến trang Staking để thực hiện các bước tiếp theo.`);
  };

  return (
    <PageLayout>
      <Header title="Gợi ý Staking" back />

      {/* Strategy Detail Bottom Sheet */}
      <BottomSheetV2
        open={!!selectedStrategy}
        onClose={() => setSelectedStrategy(null)}
        title={selectedStrategy?.title || ''}>
        {selectedStrategy && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <BottomSheetRow
                label="Expected APY"
                value={`${selectedStrategy.expectedAPY}%`}
                valueColor="#10B981"
                highlight
              />
              <BottomSheetRow
                label="Risk Level"
                value={
                  selectedStrategy.riskLevel === 'low' ? 'Thấp' :
                  selectedStrategy.riskLevel === 'medium' ? 'Trung bình' : 'Cao'
                }
                valueColor={
                  selectedStrategy.riskLevel === 'low' ? '#10B981' :
                  selectedStrategy.riskLevel === 'medium' ? '#F59E0B' : '#EF4444'
                }
              />
              <BottomSheetRow
                label="Với $10,000"
                value={`~$${(USER_PROFILE.totalPortfolio * selectedStrategy.expectedAPY / 100).toFixed(0)}/năm`}
                valueColor="#10B981"
              />
            </div>

            <div>
              <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Phân bổ chi tiết</p>
              {selectedStrategy.allocation.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      {item.product}
                    </p>
                    <p style={{ color: c.text3, fontSize: 11 }}>
                      APY: {item.apy}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                      {item.percentage}%
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {fmtUsd((parseFloat(customAmount) * item.percentage / 100))}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Ưu điểm</p>
              <div className="flex flex-col gap-2">
                {selectedStrategy.pros.map((pro, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: '#10B981' }} />
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{pro}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Nhược điểm</p>
              <div className="flex flex-col gap-2">
                {selectedStrategy.cons.map((con, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: '#EF4444' }} />
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{con}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Phù hợp với</p>
              <div className="flex flex-col gap-2">
                {selectedStrategy.bestFor.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: '#3B82F6' }} />
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleApplyStrategy(selectedStrategy)}
              className="w-full py-3.5 rounded-xl font-semibold"
              style={{ background: c.primary, color: '#FFF' }}>
              Áp dụng chiến lược này
            </button>
          </div>
        )}
      </BottomSheetV2>

      <PageContent>
        {/* Hero Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)' }}>
          <div className="flex gap-3">
            <Sparkles size={20} color="#8B5CF6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Gợi ý Staking Cá nhân hóa
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Dựa trên risk tolerance, investment horizon, và portfolio size của bạn, chúng tôi đề xuất chiến lược tối ưu.
              </p>
            </div>
          </div>
        </div>

        {/* User Profile Summary */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Profile của bạn
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Risk Tolerance</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                {USER_PROFILE.riskTolerance === 'conservative' ? 'Thận trọng' :
                 USER_PROFILE.riskTolerance === 'moderate' ? 'Trung bình' : 'Tích cực'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Investment Horizon</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                {USER_PROFILE.investmentHorizon === 'short' ? '&lt;3 tháng' :
                 USER_PROFILE.investmentHorizon === 'medium' ? '3-12 tháng' : '&gt;12 tháng'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Liquidity Needs</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                {USER_PROFILE.liquidityNeeds === 'high' ? 'Cao' :
                 USER_PROFILE.liquidityNeeds === 'medium' ? 'Trung bình' : 'Thấp'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Portfolio Size</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                {fmtUsd(USER_PROFILE.totalPortfolio)}
              </p>
            </div>
          </div>
          <button
            className="w-full mt-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: c.surface2, color: c.text1 }}>
            Cập nhật Profile
          </button>
        </TrCard>

        {/* Amount Simulator */}
        <TrCard className="p-4">
          <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>
            Mô phỏng với số lượng khác
          </p>
          <input
            type="number"
            inputMode="decimal"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{
              background: c.surface2,
              border: `1px solid ${c.borderSolid}`,
              color: c.text1,
              fontSize: 16,
              fontFamily: 'monospace',
              fontWeight: 700,
            }}
          />
        </TrCard>

        {/* Recommended Strategies */}
        <PageSection label="Chiến lược được Đề xuất">
          <div className="flex flex-col gap-3">
            {RECOMMENDATIONS.map((strategy, idx) => (
              <TrCard
                key={strategy.id}
                hover
                className="p-4"
                onClick={() => setSelectedStrategy(strategy)}
                style={{
                  border: idx === 1 ? `2px solid ${c.primary}` : `1px solid ${c.borderSolid}`,
                }}>
                {idx === 1 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} color={c.primary} />
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{ background: `${c.primary}22`, color: c.primary }}>
                      Được đề xuất
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                      {strategy.title}
                    </p>
                    <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                      {strategy.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                      {strategy.expectedAPY}%
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {strategy.allocation.slice(0, 3).map((item, itemIdx) => (
                    <div key={itemIdx} className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>
                        {item.product.split(' ')[0]}
                      </p>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>
                        {item.percentage}%
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{
                        background: strategy.riskLevel === 'low' ? 'rgba(16,185,129,0.15)' :
                                   strategy.riskLevel === 'medium' ? 'rgba(245,158,11,0.15)' :
                                   'rgba(239,68,68,0.15)',
                        color: strategy.riskLevel === 'low' ? '#10B981' :
                               strategy.riskLevel === 'medium' ? '#F59E0B' : '#EF4444',
                      }}>
                      {strategy.riskLevel === 'low' ? 'Rủi ro thấp' :
                       strategy.riskLevel === 'medium' ? 'Rủi ro TB' : 'Rủi ro cao'}
                    </span>
                    <p style={{ color: c.text3, fontSize: 11 }}>
                      ~{fmtUsd((parseFloat(customAmount) * strategy.expectedAPY / 100))}/năm
                    </p>
                  </div>
                  <ArrowRight size={18} color={c.text3} />
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Personalized Tips */}
        <PageSection label="Tips Cá nhân hóa">
          <div className="flex flex-col gap-3">
            {PERSONALIZED_TIPS.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <TrCard key={idx} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${tip.color}22`, border: `1.5px solid ${tip.color}44` }}>
                      <Icon size={20} color={tip.color} />
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                        {tip.title}
                      </p>
                      <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                        {tip.desc}
                      </p>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Disclaimer */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="flex gap-2">
            <AlertCircle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              <strong>Disclaimer:</strong> Đây chỉ là gợi ý dựa trên profile. Không phải tư vấn tài chính. Bạn nên tự nghiên cứu (DYOR) và chịu trách nhiệm cho quyết định đầu tư. APY có thể thay đổi theo thị trường.
            </p>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
