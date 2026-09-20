import React, { useState, useMemo } from 'react';
import {
  Sparkles, TrendingUp, Shield, Zap, Target, ArrowRight, AlertCircle,
  PiggyBank, Lock, Unlock, Calculator, ChevronRight, BarChart3, Clock,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */

interface UserSavingsProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  liquidityNeeds: 'high' | 'medium' | 'low';
  totalAvailable: number;
  preferredAssets: string[];
  hasCompletedAssessment: boolean;
  assessmentDate: string;
}

interface SavingsStrategy {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  matchScore: number;
  allocation: { product: string; asset: string; type: 'flexible' | 'locked'; percentage: number; apy: number; lockDays: number | null; color: string }[];
  expectedAPY: number;
  riskLevel: 'low' | 'medium' | 'high';
  liquidityRatio: number;
  pros: string[];
  cons: string[];
  bestFor: string[];
}

const USER_PROFILE: UserSavingsProfile = {
  riskTolerance: 'moderate',
  investmentHorizon: 'medium',
  liquidityNeeds: 'medium',
  totalAvailable: 15000,
  preferredAssets: ['USDT', 'BTC', 'ETH'],
  hasCompletedAssessment: true,
  assessmentDate: '05/03/2026',
};

const STRATEGIES: SavingsStrategy[] = [
  {
    id: 'stable-yield',
    title: 'Lãi suất Ổn định',
    subtitle: 'Bảo toàn vốn, thanh khoản cao',
    description: 'Ưu tiên stablecoin linh hoạt và cố định ngắn hạn. Phù hợp cho người mới hoặc cần dùng tiền bất kỳ lúc nào.',
    matchScore: 72,
    allocation: [
      { product: 'USDT Linh hoạt', asset: 'USDT', type: 'flexible', percentage: 60, apy: 4.5, lockDays: null, color: '#26A17B' },
      { product: 'USDT Cố định 30D', asset: 'USDT', type: 'locked', percentage: 25, apy: 7.2, lockDays: 30, color: '#26A17B' },
      { product: 'BTC Linh hoạt', asset: 'BTC', type: 'flexible', percentage: 15, apy: 1.8, lockDays: null, color: '#F7931A' },
    ],
    expectedAPY: 4.7,
    riskLevel: 'low',
    liquidityRatio: 75,
    pros: [
      '75% thanh khoản tức thì (rút bất kỳ lúc nào)',
      'Stablecoin chiếm 85% — rủi ro biến động giá cực thấp',
      'APY ổn định, không phụ thuộc thị trường crypto',
      'Phù hợp số tiền lớn (>$10,000)',
    ],
    cons: [
      'APY thấp nhất trong các chiến lược',
      'Phụ thuộc hoàn toàn vào stablecoin (USDT counterparty risk)',
      'Không tận dụng được upside khi thị trường crypto tăng',
    ],
    bestFor: [
      'Người mới bắt đầu gửi tiết kiệm',
      'Cần thanh khoản cao, có thể dùng tiền bất kỳ lúc nào',
      'Tổng số tiền gửi lớn (>$10,000)',
      'Không quen thuộc với biến động crypto',
    ],
  },
  {
    id: 'balanced-growth',
    title: 'Tăng trưởng Cân bằng',
    subtitle: 'Mix linh hoạt + cố định, APY cao hơn',
    description: 'Cân bằng giữa thanh khoản và lợi suất. Kết hợp stablecoin, BTC, và altcoin top — phù hợp đa số users.',
    matchScore: 94,
    allocation: [
      { product: 'USDT Linh hoạt', asset: 'USDT', type: 'flexible', percentage: 30, apy: 4.5, lockDays: null, color: '#26A17B' },
      { product: 'USDT Cố định 90D', asset: 'USDT', type: 'locked', percentage: 25, apy: 9.8, lockDays: 90, color: '#26A17B' },
      { product: 'BTC Cố định 60D', asset: 'BTC', type: 'locked', percentage: 25, apy: 3.5, lockDays: 60, color: '#F7931A' },
      { product: 'SOL Cố định 30D', asset: 'SOL', type: 'locked', percentage: 20, apy: 6.5, lockDays: 30, color: '#9945FF' },
    ],
    expectedAPY: 6.1,
    riskLevel: 'medium',
    liquidityRatio: 30,
    pros: [
      'APY cao hơn ~30% so với chiến lược An toàn',
      'Đa dạng hóa tốt (stablecoin + BTC + SOL)',
      'Vẫn giữ 30% thanh khoản tức thì',
      'Kỳ hạn khác nhau → dòng tiền liên tục khi đáo hạn',
    ],
    cons: [
      'Rủi ro giá crypto (BTC, SOL) ảnh hưởng tổng giá trị',
      '70% locked — không rút ngay được',
      'Cần theo dõi kỳ hạn đáo hạn',
    ],
    bestFor: [
      'Users có kinh nghiệm crypto cơ bản',
      'Tổng tiền $5,000-50,000',
      'Chấp nhận rủi ro vừa phải, ưu tiên lợi suất',
      'Không cần dùng tiền gấp trong 1-3 tháng',
    ],
  },
  {
    id: 'max-yield',
    title: 'Tối đa Lợi suất',
    subtitle: 'Lock dài hạn, APY cao nhất',
    description: 'Tối ưu APY bằng cách lock dài hạn và altcoin. Phù hợp cho tiền dư dài hạn, không cần thanh khoản.',
    matchScore: 58,
    allocation: [
      { product: 'USDT Cố định 90D', asset: 'USDT', type: 'locked', percentage: 30, apy: 9.8, lockDays: 90, color: '#26A17B' },
      { product: 'BTC Cố định 60D', asset: 'BTC', type: 'locked', percentage: 25, apy: 3.5, lockDays: 60, color: '#F7931A' },
      { product: 'SOL Cố định 30D', asset: 'SOL', type: 'locked', percentage: 25, apy: 6.5, lockDays: 30, color: '#9945FF' },
      { product: 'ETH Linh hoạt', asset: 'ETH', type: 'flexible', percentage: 20, apy: 2.1, lockDays: null, color: '#627EEA' },
    ],
    expectedAPY: 6.0,
    riskLevel: 'high',
    liquidityRatio: 20,
    pros: [
      'APY cao nhất — tối đa hóa lợi suất',
      '80% locked → cam kết dài hạn, lãi suất cao hơn',
      'Đa dạng hóa nhiều loại crypto',
      'Phù hợp chiến lược "tiết kiệm và quên đi"',
    ],
    cons: [
      'Chỉ 20% thanh khoản tức thì',
      'Rủi ro giá crypto cao (BTC, SOL, ETH)',
      'Rút sớm sản phẩm cố định sẽ mất toàn bộ lãi',
      'Cần kiến thức crypto cơ bản',
    ],
    bestFor: [
      'Experienced crypto users',
      'Số tiền nhỏ-trung bình ($1,000-10,000)',
      'Không cần dùng tiền trong 3+ tháng',
      'Sẵn sàng chấp nhận rủi ro biến động giá',
    ],
  },
];

const PERSONALIZED_INSIGHTS = [
  {
    icon: Target,
    title: 'Phù hợp nhất với bạn',
    desc: 'Moderate risk + Medium horizon → Tăng trưởng Cân bằng (Match 94%)',
    color: '#3B82F6',
  },
  {
    icon: Calculator,
    title: 'Ước tính thu nhập',
    desc: `Với $${USER_PROFILE.totalAvailable.toLocaleString()}, bạn có thể kiếm ~$${Math.round(USER_PROFILE.totalAvailable * 0.061)}/năm`,
    color: '#10B981',
  },
  {
    icon: Shield,
    title: 'Lưu ý rủi ro',
    desc: 'APY có thể thay đổi. Sản phẩm cố định không rút sớm được mà không mất lãi.',
    color: '#F59E0B',
  },
  {
    icon: Clock,
    title: 'Đáo hạn đa kỳ',
    desc: 'Chọn nhiều kỳ hạn khác nhau để có dòng tiền liên tục khi đáo hạn.',
    color: '#8B5CF6',
  },
];

const RISK_LABELS: Record<string, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
const RISK_COLORS: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

/* ═══════════════════════════════════════════════════════════ */
export function SavingsRecommendationsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight } = useHaptic();

  const [selectedStrategy, setSelectedStrategy] = useState<SavingsStrategy | null>(null);
  const [customAmount, setCustomAmount] = useState(USER_PROFILE.totalAvailable.toString());
  const [showCompare, setShowCompare] = useState(false);

  const amountNum = parseFloat(customAmount) || 0;

  return (
    <PageLayout>
      {/* ─── Strategy Detail BottomSheet ─── */}
      <BottomSheetV2
        open={!!selectedStrategy}
        onClose={() => setSelectedStrategy(null)}
        title={selectedStrategy?.title || ''}>
        {selectedStrategy && (
          <div className="flex flex-col gap-4">
            {/* Match score badge */}
            <div className="flex items-center gap-2" style={{ marginTop: -4 }}>
              <div className="px-2.5 py-1 rounded-lg"
                style={{ background: selectedStrategy.matchScore >= 80 ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)' }}>
                <span style={{
                  color: selectedStrategy.matchScore >= 80 ? '#10B981' : '#3B82F6',
                  fontSize: 12, fontWeight: 700,
                }}>
                  Match {selectedStrategy.matchScore}%
                </span>
              </div>
              <span className="px-2 py-0.5 rounded"
                style={{
                  background: RISK_COLORS[selectedStrategy.riskLevel] + '15',
                  color: RISK_COLORS[selectedStrategy.riskLevel],
                  fontSize: 10, fontWeight: 700,
                }}>
                Rủi ro {RISK_LABELS[selectedStrategy.riskLevel]}
              </span>
            </div>

            {/* Key metrics */}
            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <BottomSheetRow
                label="APY trung bình"
                value={`${selectedStrategy.expectedAPY}%`}
                valueColor="#10B981"
                highlight />
              <BottomSheetRow
                label="Thanh khoản tức thì"
                value={`${selectedStrategy.liquidityRatio}%`}
                valueColor={selectedStrategy.liquidityRatio >= 50 ? '#10B981' : '#F59E0B'} />
              <BottomSheetRow
                label={`Ước tính lãi/năm (${fmtUsd(amountNum)})`}
                value={`+${fmtUsd(amountNum * selectedStrategy.expectedAPY / 100)}`}
                valueColor="#10B981" />
              <BottomSheetRow
                label="Ước tính lãi/tháng"
                value={`+${fmtUsd(amountNum * selectedStrategy.expectedAPY / 100 / 12)}`}
                valueColor="#10B981" />
            </div>

            {/* Allocation breakdown */}
            <div>
              <p style={{ color: c.text2, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Phân bổ chi tiết
              </p>
              {selectedStrategy.allocation.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: item.color + '22', border: `1px solid ${item.color}44` }}>
                    <span style={{ color: item.color, fontSize: 8, fontWeight: 700 }}>
                      {item.asset}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.product}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.type === 'flexible'
                        ? <Unlock size={10} color="#10B981" />
                        : <Lock size={10} color="#F59E0B" />}
                      <span style={{ color: c.text3, fontSize: 11 }}>
                        {item.type === 'flexible' ? 'Linh hoạt' : `Cố định ${item.lockDays}D`}
                      </span>
                      <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                        {item.apy}% APY
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                      {item.percentage}%
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {fmtUsd(amountNum * item.percentage / 100)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Allocation bar */}
            <div className="h-3 rounded-full flex overflow-hidden">
              {selectedStrategy.allocation.map((item, idx) => (
                <div key={idx}
                  style={{
                    width: `${item.percentage}%`,
                    background: item.color,
                    opacity: 0.8,
                  }} />
              ))}
            </div>

            {/* Pros */}
            <div>
              <p style={{ color: c.text2, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Ưu điểm
              </p>
              <div className="flex flex-col gap-2">
                {selectedStrategy.pros.map((pro, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#10B981' }} />
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{pro}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cons */}
            <div>
              <p style={{ color: c.text2, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Lưu ý / Nhược điểm
              </p>
              <div className="flex flex-col gap-2">
                {selectedStrategy.cons.map((con, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#EF4444' }} />
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{con}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Best for */}
            <div>
              <p style={{ color: c.text2, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Phù hợp với
              </p>
              <div className="flex flex-col gap-2">
                {selectedStrategy.bestFor.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#3B82F6' }} />
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <CTAButton onClick={() => {
              setSelectedStrategy(null);
              navigate(`${prefix}/earn/savings`);
            }}>
              Đăng ký sản phẩm theo chiến lược
            </CTAButton>
          </div>
        )}
      </BottomSheetV2>

      {/* ─── Compare BottomSheet ─── */}
      <BottomSheetV2
        open={showCompare}
        onClose={() => setShowCompare(false)}
        title="So sánh Chiến lược">
        <div className="flex flex-col gap-4">
          {/* Comparison table header */}
          <div className="grid grid-cols-4 gap-2">
            <div />
            {STRATEGIES.map(s => (
              <div key={s.id} className="text-center">
                <p style={{ color: c.text1, fontSize: 10, fontWeight: 700, lineHeight: 1.3 }}>
                  {s.title.split(' ')[0]}
                </p>
              </div>
            ))}
          </div>

          {/* Rows */}
          {[
            { label: 'APY', key: 'expectedAPY', suffix: '%', color: '#10B981' },
            { label: 'Thanh khoản', key: 'liquidityRatio', suffix: '%', color: '#3B82F6' },
            { label: 'Match', key: 'matchScore', suffix: '%', color: '#8B5CF6' },
          ].map(row => (
            <div key={row.label} className="grid grid-cols-4 gap-2 items-center py-2"
              style={{ borderBottom: `1px solid ${c.divider}` }}>
              <p style={{ color: c.text3, fontSize: 11 }}>{row.label}</p>
              {STRATEGIES.map(s => (
                <div key={s.id} className="text-center">
                  <span style={{ color: row.color, fontSize: 14, fontWeight: 700 }}>
                    {(s as any)[row.key]}{row.suffix}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {/* Risk */}
          <div className="grid grid-cols-4 gap-2 items-center py-2"
            style={{ borderBottom: `1px solid ${c.divider}` }}>
            <p style={{ color: c.text3, fontSize: 11 }}>Rủi ro</p>
            {STRATEGIES.map(s => (
              <div key={s.id} className="flex justify-center">
                <span className="px-1.5 py-0.5 rounded text-center"
                  style={{
                    background: RISK_COLORS[s.riskLevel] + '15',
                    color: RISK_COLORS[s.riskLevel],
                    fontSize: 9, fontWeight: 700,
                  }}>
                  {RISK_LABELS[s.riskLevel]}
                </span>
              </div>
            ))}
          </div>

          {/* Estimated yearly earning */}
          <div className="grid grid-cols-4 gap-2 items-center py-2">
            <p style={{ color: c.text3, fontSize: 11 }}>Lãi/năm</p>
            {STRATEGIES.map(s => (
              <div key={s.id} className="text-center">
                <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                  +{fmtUsd(amountNum * s.expectedAPY / 100)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </BottomSheetV2>

      {/* ─── Header ─── */}
      <Header title="Gợi ý Tiết kiệm" back />

      <PageContent gap="default">
        {/* ─── Hero Banner ─── */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)' }}>
          <div className="flex gap-3">
            <Sparkles size={20} color="#8B5CF6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Gợi ý Tiết kiệm Cá nhân hóa
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Dựa trên mức chấp nhận rủi ro, thời gian đầu tư, và nhu cầu thanh khoản,
                chúng tôi đề xuất chiến lược tiết kiệm tối ưu cho bạn.
              </p>
            </div>
          </div>
        </div>

        {/* ─── User Profile Summary ─── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
              Hồ sơ của bạn
            </p>
            {USER_PROFILE.hasCompletedAssessment && (
              <span className="px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                Đã đánh giá {USER_PROFILE.assessmentDate}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Mức rủi ro</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                {USER_PROFILE.riskTolerance === 'conservative' ? 'Thận trọng' :
                 USER_PROFILE.riskTolerance === 'moderate' ? 'Trung bình' : 'Tích cực'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Thời gian đầu tư</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                {USER_PROFILE.investmentHorizon === 'short' ? 'Ngắn hạn' :
                 USER_PROFILE.investmentHorizon === 'medium' ? 'Trung hạn' : 'Dài hạn'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Nhu cầu thanh khoản</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                {USER_PROFILE.liquidityNeeds === 'high' ? 'Cao' :
                 USER_PROFILE.liquidityNeeds === 'medium' ? 'Trung bình' : 'Thấp'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Tài sản yêu thích</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                {USER_PROFILE.preferredAssets.join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => { navigate(`${prefix}/earn/savings/risk-assessment`); hapticSelection(); }}
            className="w-full mt-3 py-2 rounded-xl text-xs"
            style={{ background: c.surface2, color: c.text1, fontWeight: 600 }}>
            {USER_PROFILE.hasCompletedAssessment ? 'Làm lại đánh giá rủi ro' : 'Đánh giá rủi ro'}
          </button>
        </TrCard>

        {/* ─── Amount Simulator ─── */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator size={14} color={c.text2} />
            <p style={{ color: c.text2, fontSize: 13, fontWeight: 600 }}>
              Mô phỏng với số tiền khác
            </p>
          </div>
          <input
            type="number"
            inputMode="decimal"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{
              background: c.surface2,
              border: `1.5px solid ${c.borderSolid}`,
              color: c.text1,
              fontSize: 16,
              fontFamily: 'monospace',
              fontWeight: 700,
            }}
          />
          <div className="flex gap-2 mt-2">
            {[1000, 5000, 10000, 50000].map(v => (
              <button key={v}
                onClick={() => { setCustomAmount(v.toString()); hapticLight(); }}
                className="flex-1 py-1.5 rounded-lg text-xs"
                style={{
                  background: amountNum === v ? c.chipActiveBg : c.chipBg,
                  color: amountNum === v ? c.chipActiveText : c.chipText,
                  border: `1px solid ${amountNum === v ? c.chipActiveBorder : c.chipBorder}`,
                  fontWeight: 600,
                }}>
                {v >= 1000 ? `$${v / 1000}K` : `$${v}`}
              </button>
            ))}
          </div>
        </TrCard>

        {/* ─── Compare button ─── */}
        <button
          onClick={() => { setShowCompare(true); hapticSelection(); }}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 12, fontWeight: 600, border: '1px solid rgba(59,130,246,0.2)' }}>
          <BarChart3 size={14} />
          So sánh tất cả chiến lược
        </button>

        {/* ─── Strategy Cards ─── */}
        <PageSection label="Chiến lược được Đề xuất" accentColor="#8B5CF6">
          <div className="flex flex-col gap-3">
            {STRATEGIES.map((strategy, idx) => {
              const isRecommended = idx === 1;
              return (
                <TrCard
                  key={strategy.id}
                  hover
                  className="p-4"
                  onClick={() => { setSelectedStrategy(strategy); hapticSelection(); }}
                  style={isRecommended ? { border: `2px solid ${c.primary}` } : undefined}>

                  {/* Recommended badge */}
                  {isRecommended && (
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={13} color={c.primary} />
                      <span className="px-2 py-0.5 rounded-md text-xs"
                        style={{ background: `${c.primary}22`, color: c.primary, fontWeight: 700 }}>
                        Phù hợp nhất với bạn
                      </span>
                    </div>
                  )}

                  {/* Title + APY */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                        {strategy.title}
                      </p>
                      <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                        {strategy.subtitle}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                        {strategy.expectedAPY}%
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
                    </div>
                  </div>

                  {/* Allocation mini-bar */}
                  <div className="h-2 rounded-full flex overflow-hidden mb-3">
                    {strategy.allocation.map((item, itemIdx) => (
                      <div key={itemIdx}
                        style={{
                          width: `${item.percentage}%`,
                          background: item.color,
                          opacity: 0.7,
                        }} />
                    ))}
                  </div>

                  {/* Mini allocation chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {strategy.allocation.map((item, itemIdx) => (
                      <span key={itemIdx}
                        className="px-2 py-1 rounded-lg"
                        style={{ background: c.surface2, fontSize: 10, color: c.text2, fontWeight: 600 }}>
                        {item.asset} {item.percentage}%
                      </span>
                    ))}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Match score */}
                      <span className="px-2 py-0.5 rounded-md text-xs"
                        style={{
                          background: strategy.matchScore >= 80 ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                          color: strategy.matchScore >= 80 ? '#10B981' : '#3B82F6',
                          fontWeight: 700,
                        }}>
                        Match {strategy.matchScore}%
                      </span>
                      {/* Risk badge */}
                      <span className="px-2 py-0.5 rounded-md text-xs"
                        style={{
                          background: RISK_COLORS[strategy.riskLevel] + '15',
                          color: RISK_COLORS[strategy.riskLevel],
                          fontWeight: 700,
                        }}>
                        {RISK_LABELS[strategy.riskLevel]}
                      </span>
                      {/* Estimated earning */}
                      <span style={{ color: c.text3, fontSize: 11 }}>
                        +{fmtUsd(amountNum * strategy.expectedAPY / 100)}/năm
                      </span>
                    </div>
                    <ChevronRight size={16} color={c.text3} />
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* ─── Personalized Insights ─── */}
        <PageSection label="Gợi ý Cá nhân hóa" accentColor="#10B981">
          <div className="flex flex-col gap-3">
            {PERSONALIZED_INSIGHTS.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <TrCard key={idx} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${insight.color}18`, border: `1.5px solid ${insight.color}33` }}>
                      <Icon size={18} color={insight.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                        {insight.title}
                      </p>
                      <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                        {insight.desc}
                      </p>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* ─── Quick links ─── */}
        <div className="flex gap-2">
          <button
            onClick={() => { navigate(`${prefix}/earn/savings/risk-assessment`); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 12, fontWeight: 600, border: '1px solid rgba(245,158,11,0.2)' }}>
            <Shield size={14} />
            Đánh giá rủi ro
          </button>
          <button
            onClick={() => { navigate(`${prefix}/earn/savings`); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>
            <PiggyBank size={14} />
            Tất cả sản phẩm
          </button>
        </div>

        {/* ─── Disclaimer ─── */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="flex gap-2">
            <AlertCircle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
              <strong>Lưu ý:</strong> Đây chỉ là gợi ý dựa trên hồ sơ của bạn, không phải tư vấn tài chính.
              APY có thể thay đổi theo điều kiện thị trường. Sản phẩm cố định rút sớm sẽ mất toàn bộ lãi.
              Bạn nên tự đánh giá và chịu trách nhiệm cho quyết định đầu tư.
            </p>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}