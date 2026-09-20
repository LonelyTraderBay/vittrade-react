/**
 * ══════════════════════════════════════════════════════════════
 *  CopyConfirmationPage — Phase 1 Week 2: Final Transaction Gate
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Final review before copy activation
 * - Complete fee breakdown
 * - Risk scenario projections
 * - Legal disclosures & consents
 * - Terms & Conditions acceptance
 * - Destructive action confirmation
 * 
 * Compliance (MiFID II Critical):
 * - Full configuration summary
 * - Best/worst/realistic scenario disclosure
 * - All fees itemized (no hidden costs)
 * - "You can lose all capital" statement
 * - Cooling-off period reminder
 * - Explicit consent checkboxes (required)
 * - Audit trail creation
 * 
 * Guidelines:
 * - PageLayout variant="flush" + StickyFooter
 * - Trust-first: show ALL consequences upfront
 * - Friction is a feature: make user read & check
 * - Destructive action: big warning, explicit confirm
 * - No dark patterns: no pre-checked boxes
 */

import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { 
  AlertTriangle, Shield, DollarSign, TrendingUp, TrendingDown,
  FileText, CheckCircle, Info, Clock, AlertCircle, Activity,
  Target, Zap, BarChart3, Eye, ChevronRight, ChevronDown
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { COPY_TRADERS } from '../../data/mockData';

interface ConfigState {
  copyCapital: number;
  copyMode: 'mirror' | 'fixed' | 'smart';
  copyRatio?: number;
  useCustomStopLoss: boolean;
  customStopLoss?: number;
  useCustomTakeProfit: boolean;
  customTakeProfit?: number;
  useTrailingStop: boolean;
  trailingStopPercent?: number;
}

export function CopyConfirmationPage() {
  const { providerId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const location = useLocation();

  // ALL hooks MUST be called before any conditional returns (Rules of Hooks)
  // Consent states (all must be true to proceed)
  const [agreedToRisks, setAgreedToRisks] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToLossRisk, setAgreedToLossRisk] = useState(false);
  const [agreedToFees, setAgreedToFees] = useState(false);
  
  // Expandable sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const config = (location.state as ConfigState) || {
    copyCapital: 5000,
    copyMode: 'fixed' as const,
    copyRatio: 50,
    useCustomStopLoss: false,
    useCustomTakeProfit: false,
    useTrailingStop: false,
  };

  const provider = COPY_TRADERS.find(t => t.id === providerId);
  if (!provider) return null;

  const canProceed = agreedToRisks && agreedToTerms && agreedToLossRisk && agreedToFees;

  // Fee calculations (detailed)
  const platformFee = config.copyCapital * 0.001; // 0.1%
  const estimatedMonthlyTrades = 50;
  const avgTradeSize = config.copyCapital / 10;
  const tradingFeePerTrade = avgTradeSize * 0.0025; // 0.25% per side
  const estimatedMonthlyTradingFees = estimatedMonthlyTrades * 2 * tradingFeePerTrade;
  const totalFixedFees = platformFee + estimatedMonthlyTradingFees;

  // Scenario projections (30-day)
  const optimisticReturn = 0.15; // +15%
  const realisticReturn = 0.05; // +5%
  const pessimisticReturn = -0.10; // -10%
  
  const calculateScenario = (returnPct: number) => {
    const grossPnL = config.copyCapital * returnPct;
    const performanceFee = grossPnL > 0 ? grossPnL * 0.1 : 0; // 10% of profit only
    const slippageLoss = Math.abs(grossPnL) * 0.015; // 1.5% slippage
    const netPnL = grossPnL - performanceFee - slippageLoss - totalFixedFees;
    const finalBalance = config.copyCapital + netPnL;
    
    return {
      grossPnL,
      performanceFee,
      slippageLoss,
      fixedFees: totalFixedFees,
      totalCost: performanceFee + slippageLoss + totalFixedFees,
      netPnL,
      finalBalance,
      netReturnPct: (netPnL / config.copyCapital) * 100,
    };
  };

  const optimistic = calculateScenario(optimisticReturn);
  const realistic = calculateScenario(realisticReturn);
  const pessimistic = calculateScenario(pessimisticReturn);

  // Max loss scenario
  const maxLossScenario = config.useCustomStopLoss 
    ? config.copyCapital * (config.customStopLoss! / 100)
    : config.copyCapital; // Could lose everything

  return (
    <PageLayout variant="flush">
      <Header title="Xác nhận Copy" back />

      <PageContent grow padding="default" gap="relaxed">
        {/* Critical Warning Banner */}
        <div className="rounded-2xl p-4" style={{ background: '#FEF2F2', border: '2px solid #EF4444' }}>
          <div className="flex gap-3">
            <AlertTriangle size={24} color="#EF4444" className="shrink-0" />
            <div>
              <h3 style={{ color: '#EF4444', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Cảnh báo rủi ro quan trọng
              </h3>
              <p style={{ color: '#991B1B', fontSize: 12, lineHeight: 1.5 }}>
                Copy Trading là hoạt động đầu tư có rủi ro cao. Bạn có thể <strong>mất toàn bộ</strong> số tiền 
                ${config.copyCapital.toFixed(0)} đã cam kết. Hiệu suất quá khứ của provider không đảm bảo 
                kết quả tương lai. Chỉ đầu tư số tiền bạn có thể chấp nhận mất.
              </p>
            </div>
          </div>
        </div>

        {/* Provider Summary */}
        <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>Bạn sắp copy</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}>
              <span style={{ color: c.primary, fontSize: 18, fontWeight: 700 }}>{provider.avatar}</span>
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{provider.name}</p>
              <div className="flex items-center gap-2">
                <span style={{ 
                  color: provider.riskLevel === 'low' ? '#10B981' : provider.riskLevel === 'medium' ? '#F59E0B' : '#EF4444',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {provider.riskLevel === 'low' ? 'Low Risk' : provider.riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg text-center" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Total ROI</p>
              <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>+{provider.totalPnlPct.toFixed(1)}%</p>
            </div>
            <div className="p-2 rounded-lg text-center" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Max DD</p>
              <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>{provider.maxDrawdown.toFixed(1)}%</p>
            </div>
            <div className="p-2 rounded-lg text-center" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Sharpe</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{provider.sharpeRatio.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Configuration Summary */}
        <PageSection label="Cấu hình" accentColor={c.primary}>
          <div className="p-4 rounded-xl" style={{ background: c.surface2 }}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: c.text3, fontSize: 12 }}>Số vốn copy</span>
                <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>${config.copyCapital.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: c.text3, fontSize: 12 }}>Chế độ copy</span>
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  {config.copyMode === 'mirror' ? 'Mirror Copy' : 
                   config.copyMode === 'fixed' ? `Fixed ${config.copyRatio}%` : 
                   'Smart Copy'}
                </span>
              </div>
              <div className="h-px" style={{ background: c.border }} />
              <div className="flex justify-between items-center">
                <span style={{ color: c.text3, fontSize: 12 }}>Stop-Loss</span>
                <span style={{ color: config.useCustomStopLoss ? '#EF4444' : c.text2, fontSize: 13, fontWeight: 600 }}>
                  {config.useCustomStopLoss ? `-${config.customStopLoss}%` : 'Theo provider'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: c.text3, fontSize: 12 }}>Take-Profit</span>
                <span style={{ color: config.useCustomTakeProfit ? '#10B981' : c.text2, fontSize: 13, fontWeight: 600 }}>
                  {config.useCustomTakeProfit ? `+${config.customTakeProfit}%` : 'Theo provider'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: c.text3, fontSize: 12 }}>Trailing Stop</span>
                <span style={{ color: config.useTrailingStop ? c.primary : c.text2, fontSize: 13, fontWeight: 600 }}>
                  {config.useTrailingStop ? `${config.trailingStopPercent}%` : 'Không'}
                </span>
              </div>
            </div>
          </div>
        </PageSection>

        {/* Fee Breakdown (Expandable) */}
        <div className="rounded-xl overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          <button
            onClick={() => setExpandedSection(expandedSection === 'fees' ? null : 'fees')}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <DollarSign size={16} color={c.text1} />
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Chi phí & Phí</span>
            </div>
            <ChevronDown 
              size={16} 
              color={c.text3} 
              className="transition-transform"
              style={{ transform: expandedSection === 'fees' ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {expandedSection === 'fees' && (
            <div className="px-4 pb-4" style={{ borderTop: `1px solid ${c.border}` }}>
              <div className="pt-4 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ color: c.text3, fontSize: 11 }}>Platform fee (0.1%)</span>
                    <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>${platformFee.toFixed(2)}</span>
                  </div>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3 }}>Phí 1 lần khi bắt đầu copy</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ color: c.text3, fontSize: 11 }}>Trading fees (est. {estimatedMonthlyTrades} trades/month)</span>
                    <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>${estimatedMonthlyTradingFees.toFixed(2)}</span>
                  </div>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3 }}>
                    0.25% mỗi lần mở/đóng lệnh (${tradingFeePerTrade.toFixed(2)}/trade)
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ color: c.text3, fontSize: 11 }}>Performance fee (10% of profit)</span>
                    <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Chỉ khi lời</span>
                  </div>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3 }}>
                    High-water mark: chỉ tính trên profit vượt đỉnh cũ
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ color: c.text3, fontSize: 11 }}>Slippage (ước tính 1.5%)</span>
                    <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Không phải phí</span>
                  </div>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3 }}>
                    Chênh lệch giá do execution delay (0.5-3s)
                  </p>
                </div>

                <div className="h-px" style={{ background: c.border }} />

                <div className="flex justify-between items-center">
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Tổng phí cố định tháng đầu</span>
                  <span style={{ color: '#EF4444', fontSize: 16, fontWeight: 700 }}>
                    ${totalFixedFees.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scenario Projections (Expandable) */}
        <div className="rounded-xl overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          <button
            onClick={() => setExpandedSection(expandedSection === 'scenarios' ? null : 'scenarios')}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={16} color={c.text1} />
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Kịch bản dự kiến (30 ngày)</span>
            </div>
            <ChevronDown 
              size={16} 
              color={c.text3} 
              className="transition-transform"
              style={{ transform: expandedSection === 'scenarios' ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {expandedSection === 'scenarios' && (
            <div className="px-4 pb-4" style={{ borderTop: `1px solid ${c.border}` }}>
              <div className="pt-4 space-y-3">
                {/* Optimistic */}
                <div className="p-3 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #10B981' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} color="#10B981" />
                    <span style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>Kịch bản tốt (+15%)</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#166534', fontSize: 10 }}>P/L gross</span>
                      <span style={{ color: '#166534', fontSize: 11, fontWeight: 600 }}>+${optimistic.grossPnL.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#166534', fontSize: 10 }}>- Performance fee</span>
                      <span style={{ color: '#166534', fontSize: 11 }}>-${optimistic.performanceFee.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#166534', fontSize: 10 }}>- Slippage</span>
                      <span style={{ color: '#166534', fontSize: 11 }}>-${optimistic.slippageLoss.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#166534', fontSize: 10 }}>- Fixed fees</span>
                      <span style={{ color: '#166534', fontSize: 11 }}>-${optimistic.fixedFees.toFixed(0)}</span>
                    </div>
                    <div className="h-px my-1" style={{ background: '#10B981' }} />
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#166534', fontSize: 11, fontWeight: 700 }}>P/L net</span>
                      <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>+${optimistic.netPnL.toFixed(0)} ({optimistic.netReturnPct.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>

                {/* Realistic */}
                <div className="p-3 rounded-lg" style={{ background: '#FFFBEB', border: '1px solid #F59E0B' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} color="#F59E0B" />
                    <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700 }}>Kịch bản thực tế (+5%)</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#92400E', fontSize: 10 }}>P/L gross</span>
                      <span style={{ color: '#92400E', fontSize: 11, fontWeight: 600 }}>+${realistic.grossPnL.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#92400E', fontSize: 10 }}>- Performance fee</span>
                      <span style={{ color: '#92400E', fontSize: 11 }}>-${realistic.performanceFee.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#92400E', fontSize: 10 }}>- Slippage</span>
                      <span style={{ color: '#92400E', fontSize: 11 }}>-${realistic.slippageLoss.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#92400E', fontSize: 10 }}>- Fixed fees</span>
                      <span style={{ color: '#92400E', fontSize: 11 }}>-${realistic.fixedFees.toFixed(0)}</span>
                    </div>
                    <div className="h-px my-1" style={{ background: '#F59E0B' }} />
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#92400E', fontSize: 11, fontWeight: 700 }}>P/L net</span>
                      <span style={{ color: realistic.netPnL >= 0 ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 700 }}>
                        {realistic.netPnL >= 0 ? '+' : ''}${realistic.netPnL.toFixed(0)} ({realistic.netReturnPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pessimistic */}
                <div className="p-3 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #EF4444' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={14} color="#EF4444" />
                    <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 700 }}>Kịch bản xấu (-10%)</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#991B1B', fontSize: 10 }}>P/L gross</span>
                      <span style={{ color: '#991B1B', fontSize: 11, fontWeight: 600 }}>${pessimistic.grossPnL.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#991B1B', fontSize: 10 }}>- Performance fee</span>
                      <span style={{ color: '#991B1B', fontSize: 11 }}>$0 (chỉ khi lời)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#991B1B', fontSize: 10 }}>- Slippage</span>
                      <span style={{ color: '#991B1B', fontSize: 11 }}>-${pessimistic.slippageLoss.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#991B1B', fontSize: 10 }}>- Fixed fees</span>
                      <span style={{ color: '#991B1B', fontSize: 11 }}>-${pessimistic.fixedFees.toFixed(0)}</span>
                    </div>
                    <div className="h-px my-1" style={{ background: '#EF4444' }} />
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#991B1B', fontSize: 11, fontWeight: 700 }}>P/L net</span>
                      <span style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>
                        ${pessimistic.netPnL.toFixed(0)} ({pessimistic.netReturnPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-lg" style={{ background: c.warningBg }}>
                  <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4, textAlign: 'center' }}>
                    <strong>Disclaimer:</strong> Đây chỉ là ước tính. Kết quả thực tế có thể tốt hơn hoặc tệ hơn đáng kể.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Max Loss Disclosure */}
        <div className="p-4 rounded-2xl" style={{ background: '#FEF2F2', border: '2px solid #EF4444' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} color="#EF4444" />
            <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>Kịch bản mất vốn tối đa</span>
          </div>
          <p style={{ color: '#991B1B', fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
            {config.useCustomStopLoss ? (
              <>Với stop-loss {config.customStopLoss}%, bạn có thể mất tối đa <strong style={{ fontSize: 16 }}>${maxLossScenario.toFixed(0)}</strong>.</>
            ) : (
              <>Không có stop-loss riêng, bạn có thể <strong style={{ fontSize: 16 }}>mất toàn bộ ${config.copyCapital.toFixed(0)}</strong> nếu provider có drawdown 100%.</>
            )}
          </p>
          {!config.useCustomStopLoss && (
            <div className="p-2 rounded-lg" style={{ background: '#FEE2E2' }}>
              <p style={{ color: '#991B1B', fontSize: 10, lineHeight: 1.4 }}>
                ⚠️ Bạn chưa đặt stop-loss riêng. Provider có Max DD {provider.maxDrawdown.toFixed(1)}%, 
                nghĩa là trong quá khứ tài khoản đã giảm tối đa {provider.maxDrawdown.toFixed(1)}%.
              </p>
            </div>
          )}
        </div>

        {/* Legal Disclosures & Consents */}
        <PageSection label="Xác nhận & Đồng ý" accentColor="#EF4444">
          <div className="space-y-3">
            {/* Risk Acknowledgment */}
            <button
              onClick={() => setAgreedToRisks(!agreedToRisks)}
              className="w-full p-3 rounded-xl text-left flex items-start gap-3 transition-all"
              style={{
                background: agreedToRisks ? c.primary + '15' : c.surface2,
                border: `1.5px solid ${agreedToRisks ? c.primary : c.border}`,
              }}
            >
              <div 
                className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5"
                style={{ 
                  borderColor: agreedToRisks ? c.primary : c.border,
                  background: agreedToRisks ? c.primary : 'transparent'
                }}
              >
                {agreedToRisks && <CheckCircle size={14} color="#fff" />}
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 12, lineHeight: 1.5 }}>
                  Tôi hiểu rằng Copy Trading có rủi ro cao và tôi có thể <strong>mất toàn bộ vốn đầu tư</strong>. 
                  Hiệu suất quá khứ của provider không đảm bảo lợi nhuận tương lai.
                </p>
              </div>
            </button>

            {/* Fee Acknowledgment */}
            <button
              onClick={() => setAgreedToFees(!agreedToFees)}
              className="w-full p-3 rounded-xl text-left flex items-start gap-3 transition-all"
              style={{
                background: agreedToFees ? c.primary + '15' : c.surface2,
                border: `1.5px solid ${agreedToFees ? c.primary : c.border}`,
              }}
            >
              <div 
                className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5"
                style={{ 
                  borderColor: agreedToFees ? c.primary : c.border,
                  background: agreedToFees ? c.primary : 'transparent'
                }}
              >
                {agreedToFees && <CheckCircle size={14} color="#fff" />}
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 12, lineHeight: 1.5 }}>
                  Tôi đã đọc và hiểu <strong>tất cả các khoản phí</strong> (platform fee, trading fee, performance fee, slippage). 
                  Chi phí thực tế có thể cao hơn ước tính.
                </p>
              </div>
            </button>

            {/* Capital Loss Acknowledgment */}
            <button
              onClick={() => setAgreedToLossRisk(!agreedToLossRisk)}
              className="w-full p-3 rounded-xl text-left flex items-start gap-3 transition-all"
              style={{
                background: agreedToLossRisk ? c.primary + '15' : c.surface2,
                border: `1.5px solid ${agreedToLossRisk ? c.primary : c.border}`,
              }}
            >
              <div 
                className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5"
                style={{ 
                  borderColor: agreedToLossRisk ? c.primary : c.border,
                  background: agreedToLossRisk ? c.primary : 'transparent'
                }}
              >
                {agreedToLossRisk && <CheckCircle size={14} color="#fff" />}
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 12, lineHeight: 1.5 }}>
                  Tôi xác nhận rằng số tiền <strong>${config.copyCapital.toFixed(0)}</strong> là số tiền tôi 
                  <strong> có thể chấp nhận mất hoàn toàn</strong> mà không ảnh hưởng đến cuộc sống tài chính của tôi.
                </p>
              </div>
            </button>

            {/* Terms & Conditions */}
            <button
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className="w-full p-3 rounded-xl text-left flex items-start gap-3 transition-all"
              style={{
                background: agreedToTerms ? c.primary + '15' : c.surface2,
                border: `1.5px solid ${agreedToTerms ? c.primary : c.border}`,
              }}
            >
              <div 
                className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5"
                style={{ 
                  borderColor: agreedToTerms ? c.primary : c.border,
                  background: agreedToTerms ? c.primary : 'transparent'
                }}
              >
                {agreedToTerms && <CheckCircle size={14} color="#fff" />}
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 12, lineHeight: 1.5 }}>
                  Tôi đã đọc và đồng ý với <span className="underline cursor-pointer" style={{ color: c.primary }}>Điều khoản sử dụng</span> và <span className="underline cursor-pointer" style={{ color: c.primary }}>Chính sách Copy Trading</span>.
                </p>
              </div>
            </button>
          </div>
        </PageSection>

        {/* Cooling-off Reminder */}
        <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
          <div className="flex gap-2 items-start">
            <Clock size={14} color={c.primary} className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.primary, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                Thời gian suy nghĩ (24h)
              </p>
              <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.4 }}>
                Đây là lần đầu bạn copy. Sau khi xác nhận, bạn có <strong>24 giờ</strong> để review lại 
                quyết định trước khi copy chính thức kích hoạt.
              </p>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          <h4 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Điều gì xảy ra tiếp theo?
          </h4>
          <div className="space-y-3">
            {[
              { step: 1, title: 'Khóa vốn', desc: `$${config.copyCapital.toFixed(0)} sẽ được khóa trong tài khoản copy`, icon: Shield },
              { step: 2, title: 'Thời gian chờ', desc: '24h cooling-off period (chỉ lần đầu)', icon: Clock },
              { step: 3, title: 'Kích hoạt', desc: 'Sau 24h, copy tự động bắt đầu sao chép lệnh của provider', icon: Zap },
              { step: 4, title: 'Theo dõi', desc: 'Bạn có thể xem real-time P/L và dừng copy bất cứ lúc nào', icon: Eye },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex items-start gap-3">
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: c.primary + '15' }}
                  >
                    <span style={{ color: c.primary, fontSize: 12, fontWeight: 700 }}>{item.step}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={12} color={c.text1} />
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.title}</p>
                    </div>
                    <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-24" /> {/* Spacer for footer */}
      </PageContent>

      {/* Sticky Footer */}
      <StickyFooter>
        <button
          onClick={() => {
            // TODO: Submit copy configuration to backend
            // TODO: Create audit trail entry
            // TODO: Navigate to active copies page
            navigate(`${prefix}/trade/copy-trading/active`);
          }}
          disabled={!canProceed}
          className="w-full rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{
            background: canProceed ? '#EF4444' : c.border,
            color: '#fff',
            height: 48,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <Shield size={16} />
          <span>Xác nhận & Bắt đầu Copy</span>
        </button>

        {!canProceed && (
          <p style={{ color: c.text3, fontSize: 10, textAlign: 'center', marginTop: 8 }}>
            Bạn cần đồng ý với tất cả 4 điều khoản để tiếp tục
          </p>
        )}
      </StickyFooter>
    </PageLayout>
  );
}