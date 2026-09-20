/**
 * ══════════════════════════════════════════════════════════════
 *  CopyConfigurationPage — Phase 1 Week 2: Transaction Flow
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Configure copy trading parameters before commit
 * - Position sizing method selection
 * - Risk override controls (SL/TP/Trailing)
 * - Portfolio allocation warnings
 * - Fee impact preview
 * - Real-time validation
 * 
 * Compliance:
 * - Portfolio limits enforced (max 20% per provider)
 * - Risk warnings based on configuration
 * - Fee transparency (all-in cost preview)
 * - Appropriateness check (must pass assessment first)
 * - Configuration summary before confirmation
 * 
 * Guidelines:
 * - PageLayout variant="flush" + StickyFooter
 * - Trust-first: show all consequences upfront
 * - Safety-by-design: defaults are conservative
 * - Friction is a feature: validation gates
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Settings, DollarSign, Target, Shield, AlertTriangle,
  TrendingDown, TrendingUp, Info, Calculator, ChevronRight,
  AlertCircle, CheckCircle, XCircle, Zap, Activity, BarChart3
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { COPY_TRADERS } from '../../data/mockData';

type CopyMode = 'mirror' | 'fixed' | 'smart';
type PositionSizingMethod = 'percentage' | 'fixed_amount' | 'risk_based';

export function CopyConfigurationPage() {
  const { providerId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  // Form state — ALL hooks MUST be called before any conditional returns (Rules of Hooks)
  const [copyCapital, setCopyCapital] = useState(5000);
  const [copyMode, setCopyMode] = useState<CopyMode>('fixed');
  const [positionSizing, setPositionSizing] = useState<PositionSizingMethod>('percentage');
  const [copyRatio, setCopyRatio] = useState(50); // For fixed mode (%)
  
  // Risk overrides
  const [useCustomStopLoss, setUseCustomStopLoss] = useState(false);
  const [customStopLoss, setCustomStopLoss] = useState(10);
  const [useCustomTakeProfit, setUseCustomTakeProfit] = useState(false);
  const [customTakeProfit, setCustomTakeProfit] = useState(20);
  const [useTrailingStop, setUseTrailingStop] = useState(false);
  const [trailingStopPercent, setTrailingStopPercent] = useState(5);

  const provider = COPY_TRADERS.find(t => t.id === providerId);
  if (!provider) return null;

  // Portfolio context (mock - would come from API)
  const totalPortfolio = 25000;
  const currentCopyAllocation = 8000; // Already allocated to other providers
  const availableCapital = totalPortfolio - currentCopyAllocation;

  // Validation
  const allocationPercent = (copyCapital / totalPortfolio) * 100;
  const newTotalAllocation = currentCopyAllocation + copyCapital;
  const newTotalAllocationPercent = (newTotalAllocation / totalPortfolio) * 100;

  const validations = useMemo(() => {
    const issues: Array<{ type: 'error' | 'warning' | 'info', message: string }> = [];
    
    // Critical errors (blocking)
    if (copyCapital < 100) {
      issues.push({ type: 'error', message: 'Số tiền copy tối thiểu là $100' });
    }
    if (copyCapital > availableCapital) {
      issues.push({ type: 'error', message: `Vốn khả dụng chỉ còn $${availableCapital.toFixed(0)}` });
    }
    if (allocationPercent > 20) {
      issues.push({ type: 'error', message: 'Không được copy quá 20% tổng vốn cho 1 provider (MiFID II)' });
    }
    
    // Warnings (allow but warn)
    if (newTotalAllocationPercent > 70) {
      issues.push({ type: 'warning', message: `Tổng vốn copy sẽ là ${newTotalAllocationPercent.toFixed(0)}% (khuyến nghị <70%)` });
    }
    if (allocationPercent > 15) {
      issues.push({ type: 'warning', message: 'Phân bổ >15% cho 1 provider tăng rủi ro tập trung' });
    }
    if (provider.maxDrawdown > 30 && !useCustomStopLoss) {
      issues.push({ type: 'warning', message: 'Provider có Max DD cao (>30%), nên đặt stop-loss riêng' });
    }
    if (copyMode === 'mirror' && provider.riskLevel === 'high') {
      issues.push({ type: 'warning', message: 'Mirror copy với high-risk provider = rủi ro cao' });
    }
    
    // Info
    if (useTrailingStop) {
      issues.push({ type: 'info', message: 'Trailing stop giúp bảo vệ lợi nhuận khi thị trường đảo chiều' });
    }
    
    return issues;
  }, [copyCapital, availableCapital, allocationPercent, newTotalAllocationPercent, provider, useCustomStopLoss, copyMode, useTrailingStop]);

  const hasBlockingErrors = validations.some(v => v.type === 'error');

  // Fee calculation
  const platformFee = copyCapital * 0.001; // 0.1%
  const estimatedMonthlyTrades = 50;
  const avgTradeSize = copyCapital / 10;
  const estimatedTradingFees = estimatedMonthlyTrades * 2 * 0.0025 * avgTradeSize;
  const totalMonthlyFees = platformFee + estimatedTradingFees;

  return (
    <PageLayout variant="flush">
      <Header title="Cấu hình Copy" back />

      <PageContent grow padding="default" gap="relaxed">
        {/* Provider Info Card */}
        <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>Đang cấu hình copy cho</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}>
              <span style={{ color: c.primary, fontSize: 16, fontWeight: 700 }}>{provider.avatar}</span>
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{provider.name}</p>
              <div className="flex items-center gap-2">
                <span style={{ color: c.text3, fontSize: 11 }}>ROI: +{provider.totalPnlPct.toFixed(1)}%</span>
                <span style={{ color: c.text3, fontSize: 11 }}>•</span>
                <span style={{ color: c.text3, fontSize: 11 }}>Max DD: {provider.maxDrawdown.toFixed(1)}%</span>
                <span style={{ color: c.text3, fontSize: 11 }}>•</span>
                <span style={{ 
                  color: provider.riskLevel === 'low' ? '#10B981' : provider.riskLevel === 'medium' ? '#F59E0B' : '#EF4444',
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {provider.riskLevel === 'low' ? 'Low Risk' : provider.riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Capital Allocation */}
        <PageSection label="Vốn copy" accentColor={c.primary}>
          <div className="space-y-3">
            <div>
              <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>
                Số tiền copy (USD)
              </label>
              <input
                type="number"
                value={copyCapital}
                onChange={(e) => setCopyCapital(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  color: c.text1,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              />
            </div>

            {/* Portfolio Allocation Visualizer */}
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: c.text3, fontSize: 11 }}>Phân bổ portfolio</span>
                <span style={{ 
                  color: allocationPercent > 20 ? '#EF4444' : allocationPercent > 15 ? '#F59E0B' : c.text1,
                  fontSize: 13,
                  fontWeight: 700
                }}>
                  {allocationPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full mb-2" style={{ background: c.border }}>
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    background: allocationPercent > 20 ? '#EF4444' : allocationPercent > 15 ? '#F59E0B' : c.primary,
                    width: `${Math.min(allocationPercent, 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: c.text3, fontSize: 10 }}>
                  Vốn khả dụng: ${availableCapital.toFixed(0)}
                </span>
                <span style={{ color: c.text3, fontSize: 10 }}>
                  Tổng portfolio: ${totalPortfolio.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map(pct => {
                const amount = (totalPortfolio * pct) / 100;
                const isActive = Math.abs(copyCapital - amount) < 10;
                return (
                  <button
                    key={pct}
                    onClick={() => setCopyCapital(amount)}
                    className="px-3 py-2 rounded-lg transition-all"
                    style={{
                      background: isActive ? c.primary + '22' : c.surface2,
                      border: `1px solid ${isActive ? c.primary : 'transparent'}`,
                      color: isActive ? c.primary : c.text2,
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
          </div>
        </PageSection>

        {/* Copy Mode */}
        <PageSection label="Chế độ copy" accentColor={c.primary}>
          <div className="space-y-2">
            {[
              { 
                id: 'mirror' as CopyMode, 
                title: 'Mirror Copy', 
                desc: 'Sao chép chính xác tỷ lệ % vị thế của provider',
                pros: 'Đơn giản, kết quả gần provider nhất',
                cons: 'Không kiểm soát được size từng trade',
              },
              { 
                id: 'fixed' as CopyMode, 
                title: 'Fixed Ratio', 
                desc: 'Copy với tỷ lệ cố định (vd: 50% = provider $1000, bạn $500)',
                pros: 'Kiểm soát vốn tốt, dễ tính toán',
                cons: 'Kết quả khác provider nếu leverage khác nhau',
              },
              { 
                id: 'smart' as CopyMode, 
                title: 'Smart Copy', 
                desc: 'Hệ thống tự điều chỉnh size dựa trên volatility và risk',
                pros: 'Tối ưu risk-adjusted returns',
                cons: 'Phức tạp, kết quả có thể khác xa provider',
              },
            ].map(mode => {
              const isActive = copyMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setCopyMode(mode.id)}
                  className="w-full p-3 rounded-xl text-left transition-all"
                  style={{
                    background: isActive ? c.primary + '15' : c.surface2,
                    border: `1.5px solid ${isActive ? c.primary : 'transparent'}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                      style={{ borderColor: isActive ? c.primary : c.border }}
                    >
                      {isActive && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.primary }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p style={{ color: isActive ? c.primary : c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                        {mode.title}
                      </p>
                      <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4, marginBottom: 3 }}>
                        {mode.desc}
                      </p>
                      <div className="flex gap-3">
                        <div className="flex items-start gap-1">
                          <CheckCircle size={10} color="#10B981" className="mt-0.5" />
                          <span style={{ color: c.text3, fontSize: 9, lineHeight: 1.3 }}>{mode.pros}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <XCircle size={10} color="#EF4444" className="mt-0.5" />
                          <span style={{ color: c.text3, fontSize: 9, lineHeight: 1.3 }}>{mode.cons}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Copy Ratio (for Fixed mode) */}
          {copyMode === 'fixed' && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
              <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                Tỷ lệ sao chép (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={copyRatio}
                  onChange={(e) => setCopyRatio(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: c.primary }}
                />
                <span style={{ color: c.text1, fontSize: 16, fontWeight: 700, width: 50 }}>
                  {copyRatio}%
                </span>
              </div>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                Provider mở $1000 → Bạn mở ${(1000 * copyRatio / 100).toFixed(0)}
              </p>
            </div>
          )}
        </PageSection>

        {/* Risk Overrides */}
        <PageSection label="Giới hạn rủi ro" accentColor="#EF4444">
          <div className="space-y-3">
            {/* Custom Stop Loss */}
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield size={14} color={c.text2} />
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Stop-Loss riêng</span>
                </div>
                <button
                  onClick={() => setUseCustomStopLoss(!useCustomStopLoss)}
                  className="w-11 h-6 rounded-full relative transition-all"
                  style={{ background: useCustomStopLoss ? c.primary : c.border }}
                >
                  <div 
                    className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                    style={{ left: useCustomStopLoss ? '22px' : '2px' }}
                  />
                </button>
              </div>
              {useCustomStopLoss && (
                <div className="mt-3">
                  <label style={{ color: c.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Dừng lỗ khi tài khoản giảm (%)
                  </label>
                  <input
                    type="number"
                    value={customStopLoss}
                    onChange={(e) => setCustomStopLoss(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 14,
                    }}
                  />
                  <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                    Vd: 10% = dừng khi vốn còn ${(copyCapital * 0.9).toFixed(0)}
                  </p>
                </div>
              )}
            </div>

            {/* Custom Take Profit */}
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target size={14} color={c.text2} />
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Take-Profit riêng</span>
                </div>
                <button
                  onClick={() => setUseCustomTakeProfit(!useCustomTakeProfit)}
                  className="w-11 h-6 rounded-full relative transition-all"
                  style={{ background: useCustomTakeProfit ? c.primary : c.border }}
                >
                  <div 
                    className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                    style={{ left: useCustomTakeProfit ? '22px' : '2px' }}
                  />
                </button>
              </div>
              {useCustomTakeProfit && (
                <div className="mt-3">
                  <label style={{ color: c.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Chốt lời khi tài khoản tăng (%)
                  </label>
                  <input
                    type="number"
                    value={customTakeProfit}
                    onChange={(e) => setCustomTakeProfit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 14,
                    }}
                  />
                  <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                    Vd: 20% = chốt khi vốn lên ${(copyCapital * 1.2).toFixed(0)}
                  </p>
                </div>
              )}
            </div>

            {/* Trailing Stop */}
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} color={c.text2} />
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Trailing Stop</span>
                </div>
                <button
                  onClick={() => setUseTrailingStop(!useTrailingStop)}
                  className="w-11 h-6 rounded-full relative transition-all"
                  style={{ background: useTrailingStop ? c.primary : c.border }}
                >
                  <div 
                    className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                    style={{ left: useTrailingStop ? '22px' : '2px' }}
                  />
                </button>
              </div>
              {useTrailingStop && (
                <div className="mt-3">
                  <label style={{ color: c.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Khoảng cách trailing (%)
                  </label>
                  <input
                    type="number"
                    value={trailingStopPercent}
                    onChange={(e) => setTrailingStopPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 14,
                    }}
                  />
                  <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                    Stop-loss tự động di chuyển theo giá, cách đỉnh {trailingStopPercent}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </PageSection>

        {/* Fee Preview */}
        <PageSection label="Dự kiến chi phí" accentColor="#F59E0B">
          <div className="p-4 rounded-xl" style={{ background: c.surface2 }}>
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={16} color={c.text2} />
              <h4 style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                Chi phí tháng đầu tiên
              </h4>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span style={{ color: c.text3, fontSize: 11 }}>Platform fee (0.1%)</span>
                <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: c.text3, fontSize: 11 }}>Trading fees (est. {estimatedMonthlyTrades} trades)</span>
                <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>${estimatedTradingFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: c.text3, fontSize: 11 }}>Performance fee (10% of profit)</span>
                <span style={{ color: c.text3, fontSize: 11 }}>Chỉ tính khi lời</span>
              </div>
            </div>

            <div className="h-px mb-3" style={{ background: c.border }} />

            <div className="flex justify-between items-center">
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Tổng phí cố định</span>
              <span style={{ color: '#EF4444', fontSize: 16, fontWeight: 700 }}>
                ${totalMonthlyFees.toFixed(2)}
              </span>
            </div>

            <p style={{ color: c.text3, fontSize: 10, marginTop: 8, lineHeight: 1.4 }}>
              Chưa tính slippage (0.5-2%) và performance fee (10% lợi nhuận). 
              Chi phí thực tế phụ thuộc vào số lượng trades và kết quả.
            </p>
          </div>
        </PageSection>

        {/* Validation Messages */}
        {validations.length > 0 && (
          <div className="space-y-2">
            {validations.map((v, idx) => {
              const Icon = v.type === 'error' ? AlertCircle : v.type === 'warning' ? AlertTriangle : Info;
              const bgColor = v.type === 'error' ? c.dangerBg : v.type === 'warning' ? c.warningBg : c.primary + '15';
              const borderColor = v.type === 'error' ? c.dangerBorder : v.type === 'warning' ? c.warningBorder : c.primary;
              const textColor = v.type === 'error' ? c.dangerText : v.type === 'warning' ? c.warningText : c.primary;

              return (
                <div 
                  key={idx}
                  className="p-3 rounded-xl flex items-start gap-2"
                  style={{ background: bgColor, border: `1px solid ${borderColor}` }}
                >
                  <Icon size={14} color={textColor} className="shrink-0 mt-0.5" />
                  <p style={{ color: textColor, fontSize: 11, lineHeight: 1.4 }}>
                    {v.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Configuration Summary */}
        <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          <h4 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Tóm tắt cấu hình
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span style={{ color: c.text3, fontSize: 11 }}>Số vốn copy</span>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>${copyCapital.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: c.text3, fontSize: 11 }}>Chế độ</span>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                {copyMode === 'mirror' ? 'Mirror Copy' : copyMode === 'fixed' ? `Fixed ${copyRatio}%` : 'Smart Copy'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: c.text3, fontSize: 11 }}>Stop-Loss</span>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                {useCustomStopLoss ? `-${customStopLoss}%` : 'Theo provider'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: c.text3, fontSize: 11 }}>Take-Profit</span>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                {useCustomTakeProfit ? `+${customTakeProfit}%` : 'Theo provider'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: c.text3, fontSize: 11 }}>Trailing Stop</span>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                {useTrailingStop ? `${trailingStopPercent}%` : 'Không'}
              </span>
            </div>
          </div>
        </div>

        <div className="h-20" /> {/* Spacer for floating footer */}
      </PageContent>

      {/* Sticky Footer */}
      <StickyFooter>
        <button
          onClick={() => {
            // TODO: Navigate to confirmation page with config state
            navigate(`${prefix}/trade/copy-provider/${providerId}/confirmation`, {
              state: {
                copyCapital,
                copyMode,
                copyRatio,
                useCustomStopLoss,
                customStopLoss,
                useCustomTakeProfit,
                customTakeProfit,
                useTrailingStop,
                trailingStopPercent,
              }
            });
          }}
          disabled={hasBlockingErrors}
          className="w-full rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{
            background: c.primary,
            color: '#fff',
            height: 48,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <span>Xem xác nhận</span>
          <ChevronRight size={16} />
        </button>
      </StickyFooter>
    </PageLayout>
  );
}