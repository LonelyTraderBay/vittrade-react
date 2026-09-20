/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadIDOBridgePage — IDO via DEX Bridge (Phase 4)
 * ══════════════════════════════════════════════════════════════
 *  Pattern C — Form/Wizard with Bottom CTA
 *  Features: Cross-chain swap, route selection, bridge simulation,
 *            slippage settings, fee breakdown
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  ArrowDown, ArrowRight, ChevronDown, ChevronRight, Clock,
  AlertTriangle, CheckCircle, Shield, Info, X, Zap,
  RefreshCw, Settings, Fuel, GitBranch, ArrowUpDown,
  AlertCircle, Globe, Layers, Route, History,
} from 'lucide-react';
import {
  BRIDGE_NETWORKS, MOCK_SWAP_ROUTES, getProject, MOCK_USER, truncateAddress,
  loadBridgeHistory, addBridgeTx,
  type BridgeNetwork, type SwapRoute, type LaunchProject, type BridgeTxRecord,
} from './launchpadData';

type BridgeStep = 'configure' | 'routes' | 'review' | 'processing' | 'success' | 'history';

export function LaunchpadIDOBridgePage() {
  const c = useThemeColors();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  const project = getProject(id || '');

  const [step, setStep] = useState<BridgeStep>('configure');
  const [sourceChain, setSourceChain] = useState<BridgeNetwork>(BRIDGE_NETWORKS[0]);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<SwapRoute | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [bridgeHistory, setBridgeHistory] = useState<BridgeTxRecord[]>(() => loadBridgeHistory());

  const numAmount = parseFloat(inputAmount) || 0;
  const targetChain = project ? BRIDGE_NETWORKS.find(n => n.name.toLowerCase().includes(project.chain.toLowerCase())) || BRIDGE_NETWORKS[2] : BRIDGE_NETWORKS[2];

  // Simulate routes based on amount
  const routes = useMemo(() => {
    if (numAmount <= 0) return [];
    return MOCK_SWAP_ROUTES.map(r => ({
      ...r,
      estimatedOutput: Math.round(r.estimatedOutput * (numAmount / 1000)),
    }));
  }, [numAmount]);

  const handleFindRoutes = () => {
    if (numAmount <= 0) return;
    setStep('routes');
  };

  const handleSelectRoute = (route: SwapRoute) => {
    setSelectedRoute(route);
    setStep('review');
  };

  const handleConfirm = () => {
    setStep('processing');
    setProcessing(true);
    setProcessingStep(0);

    // Simulate multi-step processing
    const steps = [1, 2, 3, 4];
    steps.forEach((s, i) => {
      setTimeout(() => {
        setProcessingStep(s);
        if (s === 4) {
          setProcessing(false);
          setTimeout(() => setStep('success'), 500);
        }
      }, (i + 1) * 1200);
    });
  };

  if (!project) {
    return (
      <PageLayout>
        <Header title="IDO Bridge" back />
        <PageContent>
          <TrCard className="p-8 text-center">
            <AlertCircle size={40} color={c.text3} className="mx-auto mb-3" />
            <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>Dự án không tồn tại</p>
          </TrCard>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="flush">
      {/* Network selector sheet */}
      {showSourceSelector && (
        <NetworkSelectorSheet
          networks={BRIDGE_NETWORKS}
          selected={sourceChain}
          onSelect={n => { setSourceChain(n); setShowSourceSelector(false); }}
          onClose={() => setShowSourceSelector(false)}
        />
      )}

      {/* Slippage settings sheet */}
      {showSlippageSettings && (
        <SlippageSettingsSheet
          slippage={slippage}
          onApply={s => { setSlippage(s); setShowSlippageSettings(false); }}
          onClose={() => setShowSlippageSettings(false)}
        />
      )}

      <Header
        title="IDO via DEX Bridge"
        back
        action={{ icon: Settings, onClick: () => setShowSlippageSettings(true) }}
      />

      <PageContent grow gap="default" style={{ paddingBottom: 100 }}>
        {/* Project header */}
        <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: c.surface2 }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: project.logoColor + '22', color: project.logoColor }}>
            {project.logo}
          </div>
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{project.name}</p>
            <p style={{ color: c.text3, fontSize: 11 }}>IDO · {project.chain} · ${project.symbol}</p>
          </div>
          <div className="text-right">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>${project.price}</p>
            <p style={{ color: c.text3, fontSize: 10 }}>Giá IDO</p>
          </div>
        </div>

        {step === 'configure' && (
          <>
            {/* Source chain */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: 12, marginBottom: 8 }}>Từ chuỗi</p>
              <button onClick={() => setShowSourceSelector(true)}
                className="w-full flex items-center gap-3 rounded-xl p-3 hover:opacity-90 transition-opacity"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: sourceChain.color + '22', color: sourceChain.color }}>
                  {sourceChain.icon}
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{sourceChain.name}</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>Gas: {sourceChain.gasEstimate} · {sourceChain.avgTime}</p>
                </div>
                <ChevronDown size={16} color={c.text3} />
              </button>

              {/* Arrow */}
              <div className="flex justify-center py-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                  <ArrowDown size={16} color={c.text2} />
                </div>
              </div>

              {/* Target chain (fixed) */}
              <p style={{ color: c.text2, fontSize: 12, marginBottom: 8 }}>Đến chuỗi</p>
              <div className="w-full flex items-center gap-3 rounded-xl p-3"
                style={{ background: `${targetChain.color}08`, border: `1px solid ${targetChain.color}20` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: targetChain.color + '22', color: targetChain.color }}>
                  {targetChain.icon}
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{targetChain.name}</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>Chuỗi của dự án IDO</p>
                </div>
                <div className="px-2 py-0.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>Target</span>
                </div>
              </div>
            </TrCard>

            {/* Amount input */}
            <TrCard className="p-4">
              <div className="flex justify-between mb-2">
                <span style={{ color: c.text2, fontSize: 12 }}>Số lượng bán</span>
                <span style={{ color: c.text3, fontSize: 11 }}>
                  Có sẵn: <span style={{ fontWeight: 600, color: c.text1 }}>${MOCK_USER.usdtBalance.toLocaleString()}</span>
                </span>
              </div>
              <div className="flex rounded-xl overflow-hidden mb-2" style={{ border: `1px solid ${c.borderSolid}` }}>
                <input type="number" value={inputAmount} onChange={e => setInputAmount(e.target.value)}
                  className="flex-1 px-3 py-3 bg-transparent outline-none"
                  style={{ color: c.text1, fontSize: 20, fontWeight: 600, fontFamily: 'monospace' }}
                  placeholder="0.00" />
                <div className="flex items-center gap-2 px-3" style={{ background: c.surface2 }}>
                  <button onClick={() => setInputAmount(Math.min(project.maxBuy, MOCK_USER.usdtBalance).toString())}
                    className="px-2 py-0.5 rounded-lg"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>
                    MAX
                  </button>
                  <span style={{ color: c.text3, fontSize: 12 }}>USDT</span>
                </div>
              </div>

              <div className="flex gap-2">
                {[100, 250, 500, 1000].map(v => (
                  <button key={v} onClick={() => setInputAmount(v.toString())}
                    className="flex-1 py-1.5 rounded-lg"
                    style={{
                      background: inputAmount === v.toString() ? 'rgba(59,130,246,0.1)' : c.surface2,
                      color: inputAmount === v.toString() ? '#3B82F6' : c.text3,
                      fontSize: 12, fontWeight: 600,
                    }}>
                    ${v}
                  </button>
                ))}
              </div>

              {numAmount > 0 && (
                <div className="mt-3 rounded-xl p-2.5 flex items-center justify-between"
                  style={{ background: c.surface2 }}>
                  <span style={{ color: c.text3, fontSize: 11 }}>Nhận được (ước tính)</span>
                  <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                    ~{Math.round(numAmount / project.price).toLocaleString()} {project.symbol}
                  </span>
                </div>
              )}
            </TrCard>

            {/* Settings summary */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Info size={12} color={c.text3} />
                <span style={{ color: c.text3, fontSize: 11 }}>Slippage: {slippage}%</span>
              </div>
              <button onClick={() => setShowSlippageSettings(true)}
                style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                Chỉnh sửa
              </button>
            </div>

            {/* Bridge disclaimer */}
            <div className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <Shield size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Giao dịch cross-chain cần thời gian xử lý. Giá có thể thay đổi trong quá trình bridge.
                Luôn kiểm tra địa chỉ contract trước khi giao dịch.
              </p>
            </div>
          </>
        )}

        {step === 'routes' && (
          <>
            <div className="flex items-center justify-between mb-1">
              <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Chọn đường đi</h3>
              <button onClick={() => setStep('configure')} style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>
                Quay lại
              </button>
            </div>
            <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>
              {routes.length} routes tìm thấy cho ${numAmount.toLocaleString()} USDT → {project.symbol}
            </p>

            {/* Compare routes button */}
            <button
              onClick={() => navigate(`${prefix}/launchpad/bridge-compare`, {
                state: {
                  sourceChain: sourceChain.name,
                  targetChain: targetChain.name,
                  inputToken: 'USDT',
                  outputToken: project.symbol,
                  inputAmount: numAmount,
                },
              })}
              className="w-full rounded-xl p-3 flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] mb-1"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <Layers size={14} color="#6366F1" />
              <span style={{ color: '#6366F1', fontSize: 12, fontWeight: 600 }}>So sánh chi tiết tất cả routes</span>
              <ChevronRight size={12} color="#6366F1" className="ml-auto" />
            </button>

            <div className="flex flex-col gap-3">
              {routes.map((route, idx) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  projectSymbol={project.symbol}
                  onSelect={() => handleSelectRoute(route)}
                  rank={idx + 1}
                />
              ))}
            </div>
          </>
        )}

        {step === 'review' && selectedRoute && (
          <>
            <div className="flex items-center justify-between mb-1">
              <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Xem lại giao dịch</h3>
              <button onClick={() => setStep('routes')} style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>
                Đổi route
              </button>
            </div>

            {/* Swap summary */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-1"
                    style={{ background: sourceChain.color + '15', border: `1px solid ${sourceChain.color}25` }}>
                    <span style={{ color: sourceChain.color, fontSize: 12, fontWeight: 700 }}>{sourceChain.icon}</span>
                  </div>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>${numAmount.toLocaleString()}</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>USDT · {sourceChain.name}</p>
                </div>

                <div className="flex flex-col items-center gap-1 px-4">
                  <ArrowRight size={20} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: 9 }}>{selectedRoute.estimatedTime}</span>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-1"
                    style={{ background: project.logoColor + '15', border: `1px solid ${project.logoColor}25` }}>
                    <span style={{ color: project.logoColor, fontSize: 12, fontWeight: 700 }}>{project.logo}</span>
                  </div>
                  <p style={{ color: '#10B981', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                    {selectedRoute.estimatedOutput.toLocaleString()}
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>{project.symbol} · {targetChain.name}</p>
                </div>
              </div>

              {/* Route path */}
              <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Route size={12} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: 11 }}>Đường đi ({selectedRoute.path.length} bước)</span>
                </div>
                {selectedRoute.path.map((hop, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{hop.fromToken}</span>
                    <ArrowRight size={10} color={c.text3} />
                    <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{hop.toToken}</span>
                    <span className="ml-auto" style={{ color: c.text3, fontSize: 10 }}>{hop.dex} · {hop.chain}</span>
                  </div>
                ))}
              </div>

              {/* Fee breakdown */}
              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'Route', value: selectedRoute.provider },
                  { label: 'Gas (ước tính)', value: selectedRoute.gasCost },
                  { label: 'Tổng phí', value: selectedRoute.totalFee },
                  { label: 'Price impact', value: `${selectedRoute.priceImpact}%`, color: selectedRoute.priceImpact > 1 ? '#EF4444' : c.text1 },
                  { label: 'Slippage tolerance', value: `${slippage}%` },
                  { label: 'Thời gian ước tính', value: selectedRoute.estimatedTime },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text2, fontSize: 12 }}>{r.label}</span>
                    <span style={{ color: (r as any).color || c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Contract info */}
            <div className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <Globe size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Contract IDO</p>
                <p style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace' }}>
                  {truncateAddress(project.contractAddress)}
                </p>
              </div>
            </div>

            {/* Risk warning */}
            <div className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertTriangle size={13} color="#EF4444" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Cross-chain swap có rủi ro về giá, thời gian xử lý và lỗi kỹ thuật.
                Chỉ tham gia với số tiền bạn sẵn sàng chấp nhận rủi ro.
              </p>
            </div>
          </>
        )}

        {step === 'processing' && (
          <TrCard className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse"
                style={{ background: 'rgba(59,130,246,0.15)' }}>
                <RefreshCw size={28} color="#3B82F6" className="animate-spin" />
              </div>
              <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Đang xử lý...</h3>
              <p style={{ color: c.text2, fontSize: 12 }}>Vui lòng không đóng trang này</p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { step: 1, label: 'Kiểm tra số dư & approve', icon: Shield },
                { step: 2, label: 'Bridge token qua chuỗi', icon: GitBranch },
                { step: 3, label: 'Swap trên DEX đích', icon: ArrowUpDown },
                { step: 4, label: 'Xác nhận giao dịch', icon: CheckCircle },
              ].map(s => {
                const isDone = processingStep >= s.step;
                const isCurrent = processingStep === s.step - 1;
                return (
                  <div key={s.step} className="flex items-center gap-3 rounded-xl p-3"
                    style={{
                      background: isDone ? 'rgba(16,185,129,0.06)' : isCurrent ? 'rgba(59,130,246,0.06)' : c.surface2,
                      border: `1px solid ${isDone ? 'rgba(16,185,129,0.15)' : isCurrent ? 'rgba(59,130,246,0.15)' : 'transparent'}`,
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: isDone ? 'rgba(16,185,129,0.15)' : isCurrent ? 'rgba(59,130,246,0.15)' : c.surface2,
                      }}>
                      {isDone ? (
                        <CheckCircle size={16} color="#10B981" />
                      ) : (
                        <s.icon size={16} color={isCurrent ? '#3B82F6' : c.text3} className={isCurrent ? 'animate-pulse' : ''} />
                      )}
                    </div>
                    <span style={{
                      color: isDone ? '#10B981' : isCurrent ? '#3B82F6' : c.text3,
                      fontSize: 13, fontWeight: isDone || isCurrent ? 600 : 400,
                    }}>
                      {s.label}
                    </span>
                    {isDone && <span className="ml-auto" style={{ color: '#10B981', fontSize: 10 }}>Done</span>}
                  </div>
                );
              })}
            </div>
          </TrCard>
        )}

        {step === 'success' && selectedRoute && (
          <>
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <CheckCircle size={40} color="#10B981" />
              </div>
              <h3 style={{ color: c.text1, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Giao dịch thành công!</h3>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.5 }}>
                Bạn đã swap ${numAmount.toLocaleString()} USDT thành {selectedRoute.estimatedOutput.toLocaleString()} {project.symbol}
              </p>
            </div>

            <TrCard className="p-4">
              {[
                { label: 'Chuỗi nguồn', value: sourceChain.name },
                { label: 'Chuỗi đích', value: targetChain.name },
                { label: 'Bán', value: `$${numAmount.toLocaleString()} USDT` },
                { label: 'Nhận', value: `${selectedRoute.estimatedOutput.toLocaleString()} ${project.symbol}` },
                { label: 'Route', value: selectedRoute.provider },
                { label: 'Tổng phí', value: selectedRoute.totalFee },
                { label: 'Tx Hash', value: '0x7a8b...c3d4' },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                  <span style={{ color: c.text2, fontSize: 12 }}>{r.label}</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
                </div>
              ))}
            </TrCard>

            <div className="flex gap-2">
              <button onClick={() => {
                // Persist this tx to history
                const now = new Date();
                const ts = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                const record: BridgeTxRecord = {
                  id: `btx_${Date.now()}`, projectId: project.id, projectName: project.name, projectSymbol: project.symbol,
                  projectLogoColor: project.logoColor, sourceChain: sourceChain.name, targetChain: targetChain.name,
                  inputToken: 'USDT', outputToken: project.symbol, inputAmount: numAmount, outputAmount: selectedRoute.estimatedOutput,
                  routeProvider: selectedRoute.provider, routeHops: selectedRoute.path.length,
                  gasCost: selectedRoute.gasCost, totalFee: selectedRoute.totalFee,
                  slippage, priceImpact: selectedRoute.priceImpact,
                  status: 'completed', txHash: '0x7a8b...c3d4', createdAt: ts, completedAt: ts,
                };
                const updated = addBridgeTx(record);
                setBridgeHistory(updated);
                // Navigate to bridge order page for live tracking
                navigate(`${prefix}/launchpad/bridge-order/${record.id}`, { state: { scenario: 'success' } });
              }}
                className="flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity active:scale-[0.98]"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 13, borderRadius: 14, fontWeight: 600 }}>
                <History size={14} />
                Theo dõi đơn
              </button>
              <CTAButton className="flex-1" variant="success" onClick={() => navigate(`${prefix}/launchpad/${project.id}`)}>
                Xem dự án
              </CTAButton>
            </div>
          </>
        )}

        {step === 'history' && (
          <BridgeHistoryView history={bridgeHistory} onBack={() => setStep('configure')} />
        )}
      </PageContent>

      {/* Sticky footer CTA */}
      {step === 'configure' && (
        <StickyFooter>
          <CTAButton disabled={numAmount <= 0} onClick={handleFindRoutes}>
            <Zap size={16} className="inline mr-1.5" />
            Tìm đường swap tốt nhất
          </CTAButton>
        </StickyFooter>
      )}

      {step === 'review' && (
        <StickyFooter>
          <CTAButton onClick={handleConfirm}>
            <Shield size={16} className="inline mr-1.5" />
            Xác nhận & Swap
          </CTAButton>
        </StickyFooter>
      )}

      {step === 'success' && (
        <StickyFooter>
          <CTAButton onClick={() => setStep('history')}>
            <History size={16} className="inline mr-1.5" />
            Xem lịch sử
          </CTAButton>
        </StickyFooter>
      )}
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   RouteCard — swap route option
   ═══════════════════════════════════════════════════════════ */

function RouteCard({ route, projectSymbol, onSelect, rank }: {
  route: SwapRoute; projectSymbol: string; onSelect: () => void; rank: number;
}) {
  const c = useThemeColors();
  return (
    <TrCard overflow hover>
      <button className="w-full text-left p-4" onClick={onSelect}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {route.recommended && (
              <div className="px-2 py-0.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>Tốt nhất</span>
              </div>
            )}
            <span style={{ color: c.text2, fontSize: 12 }}>{route.provider}</span>
          </div>
          <span style={{ color: c.text3, fontSize: 11 }}>{route.estimatedTime}</span>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p style={{ color: c.text3, fontSize: 10 }}>Bạn nhận được</p>
            <p style={{ color: '#10B981', fontSize: 20, fontWeight: 800, fontFamily: 'monospace' }}>
              {route.estimatedOutput.toLocaleString()} <span style={{ fontSize: 12 }}>{projectSymbol}</span>
            </p>
          </div>
          {route.savingsVsBest !== 0 && (
            <span style={{
              color: route.savingsVsBest > 0 ? '#10B981' : '#EF4444',
              fontSize: 11, fontWeight: 600,
            }}>
              {route.savingsVsBest > 0 ? '+' : ''}{route.savingsVsBest}%
            </span>
          )}
        </div>

        {/* Route hops */}
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {route.path.map((hop, i) => (
            <React.Fragment key={i}>
              <span className="px-1.5 py-0.5 rounded text-xs"
                style={{ background: c.surface2, color: c.text2, fontSize: 10 }}>
                {hop.fromToken}
              </span>
              <ArrowRight size={10} color={c.text3} />
              {i === route.path.length - 1 && (
                <span className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 10 }}>
                  {hop.toToken}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex gap-4">
          <div>
            <span style={{ color: c.text3, fontSize: 10 }}>Gas</span>
            <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{route.gasCost}</p>
          </div>
          <div>
            <span style={{ color: c.text3, fontSize: 10 }}>Tổng phí</span>
            <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{route.totalFee}</p>
          </div>
          <div>
            <span style={{ color: c.text3, fontSize: 10 }}>Impact</span>
            <p style={{ color: route.priceImpact > 1 ? '#EF4444' : c.text1, fontSize: 11, fontWeight: 600 }}>
              {route.priceImpact}%
            </p>
          </div>
          <div>
            <span style={{ color: c.text3, fontSize: 10 }}>Bước</span>
            <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{route.path.length}</p>
          </div>
        </div>
      </button>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   NetworkSelectorSheet — chain picker
   ═══════════════════════════════════════════════════════════ */

function NetworkSelectorSheet({ networks, selected, onSelect, onClose }: {
  networks: BridgeNetwork[]; selected: BridgeNetwork; onSelect: (n: BridgeNetwork) => void; onClose: () => void;
}) {
  const c = useThemeColors();
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto', maxHeight: '80vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} /></div>
        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Chọn chuỗi nguồn</h3>
            <button onClick={onClose}><X size={20} color={c.text3} /></button>
          </div>

          <div className="flex flex-col gap-2">
            {networks.map(n => (
              <button key={n.id} onClick={() => onSelect(n)}
                className="w-full flex items-center gap-3 rounded-xl p-3 hover:opacity-90 transition-opacity"
                style={{
                  background: selected.id === n.id ? `${n.color}10` : c.surface2,
                  border: `1px solid ${selected.id === n.id ? n.color + '40' : 'transparent'}`,
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ background: n.color + '22', color: n.color }}>
                  {n.icon}
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{n.name}</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    Gas: {n.gasEstimate} · {n.avgTime} · {n.confirmations} confirms
                  </p>
                </div>
                {selected.id === n.id && <CheckCircle size={18} color={n.color} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SlippageSettingsSheet
   ═══════════════════════════════════════════════════════════ */

function SlippageSettingsSheet({ slippage, onApply, onClose }: {
  slippage: number; onApply: (s: number) => void; onClose: () => void;
}) {
  const c = useThemeColors();
  const [value, setValue] = useState(slippage);
  const [custom, setCustom] = useState('');

  const presets = [0.1, 0.5, 1.0, 3.0];
  const isCustom = !presets.includes(value);

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} /></div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Slippage Tolerance</h3>
            <button onClick={onClose}><X size={20} color={c.text3} /></button>
          </div>

          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
            Slippage là sai lệch giá tối đa bạn chấp nhận khi giao dịch được thực hiện.
          </p>

          <div className="flex gap-2">
            {presets.map(p => (
              <button key={p} onClick={() => { setValue(p); setCustom(''); }}
                className="flex-1 py-2.5 rounded-xl"
                style={{
                  background: value === p ? 'rgba(59,130,246,0.1)' : c.surface2,
                  border: `1px solid ${value === p ? 'rgba(59,130,246,0.3)' : c.borderSolid}`,
                  color: value === p ? '#3B82F6' : c.text2,
                  fontSize: 14, fontWeight: 600,
                }}>
                {p}%
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${c.borderSolid}` }}>
            <input type="number" value={custom} onChange={e => { setCustom(e.target.value); setValue(parseFloat(e.target.value) || 0); }}
              className="flex-1 px-3 py-2.5 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: 14 }}
              placeholder="Tự nhập..." step="0.1" min="0.01" max="50" />
            <span className="flex items-center px-3" style={{ color: c.text3, fontSize: 12, background: c.surface2 }}>%</span>
          </div>

          {value > 5 && (
            <div className="rounded-xl p-2.5 flex items-center gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <AlertTriangle size={12} color="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: 11 }}>Slippage cao có thể dẫn đến mất giá lớn</span>
            </div>
          )}

          <CTAButton onClick={() => onApply(value)}>
            Áp dụng ({value}%)
          </CTAButton>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BridgeHistoryView — view bridge history
   ═══════════════════════════════════════════════════════════ */

function BridgeHistoryView({ history, onBack }: { history: BridgeTxRecord[], onBack: () => void }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Chờ xử lý' },
    bridging: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Đang bridge' },
    swapping: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Đang swap' },
    completed: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Hoàn tất' },
    failed: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'Thất bại' },
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Lịch sử Bridge</h3>
        <button onClick={onBack} style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>Giao dịch mới</button>
      </div>

      {history.length === 0 ? (
        <TrCard className="p-8 text-center">
          <History size={36} color={c.text3} className="mx-auto mb-3" />
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Chưa có giao dịch</p>
          <p style={{ color: c.text3, fontSize: 12 }}>Thực hiện swap đầu tiên để bắt đầu</p>
        </TrCard>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map(tx => {
            const st = statusConfig[tx.status] || statusConfig.completed;
            return (
              <TrCard key={tx.id} className="p-4" onClick={() => navigate(`${prefix}/launchpad/bridge-order/${tx.id}`, {
                state: { scenario: tx.status === 'failed' ? 'fail' : 'success' },
              })}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: tx.projectLogoColor + '22', color: tx.projectLogoColor }}>
                    {tx.projectSymbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{tx.projectName}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{tx.sourceChain} → {tx.targetChain}</p>
                  </div>
                  <div className="px-2 py-0.5 rounded-lg" style={{ background: st.bg }}>
                    <span style={{ color: st.color, fontSize: 10, fontWeight: 600 }}>{st.label}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-1.5">
                  <span style={{ color: c.text3, fontSize: 11 }}>Bán</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                    ${tx.inputAmount.toLocaleString()} {tx.inputToken}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1.5">
                  <span style={{ color: c.text3, fontSize: 11 }}>Nhận</span>
                  <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                    {tx.outputAmount.toLocaleString()} {tx.outputToken}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text3, fontSize: 10 }}>{tx.createdAt}</span>
                  <span style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>{tx.txHash}</span>
                </div>
                {tx.status === 'failed' && tx.failReason && (
                  <div className="mt-2 rounded-lg p-2 flex items-start gap-1.5"
                    style={{ background: 'rgba(239,68,68,0.06)' }}>
                    <AlertCircle size={11} color="#EF4444" className="shrink-0 mt-0.5" />
                    <p style={{ color: '#EF4444', fontSize: 10, lineHeight: 1.4 }}>{tx.failReason}</p>
                  </div>
                )}
              </TrCard>
            );
          })}
        </div>
      )}
    </div>
  );
}