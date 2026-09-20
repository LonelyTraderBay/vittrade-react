/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadContractPage — Multi-chain Contract Interaction (Phase 4)
 * ══════════════════════════════════════════════════════════════
 *  Pattern A — Standard Page with tabs
 *  Features: Network selector, contract functions, tx simulation,
 *            state change preview, risk indicators
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Globe, ChevronDown, Code2, Play, Eye, ShieldAlert,
  AlertTriangle, CheckCircle, X, Info, Fuel, FileCode,
  ArrowRight, Copy, ExternalLink, Shield, AlertCircle,
  Zap, Lock, RefreshCw, CircleDot, Database,
  Scan, Binary, Tag,
} from 'lucide-react';
import {
  BRIDGE_NETWORKS, CONTRACT_FUNCTIONS, MOCK_TX_SIMULATIONS,
  getProject, truncateAddress, simulateABIDetection,
  type BridgeNetwork, type ContractFunction, type ContractParam, type TxSimulation, type StateChange,
  type ABIDetectionResult, type DetectedFunction, type SecurityFlag,
} from './launchpadData';

const TABS = ['Functions', 'ABI Scanner', 'Mô phỏng', 'Lịch sử'] as const;
type ContractTab = typeof TABS[number];

export function LaunchpadContractPage() {
  const c = useThemeColors();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  const project = getProject(id || '');
  const [tab, setTab] = useState<ContractTab>('Functions');
  const [selectedNetwork, setSelectedNetwork] = useState<BridgeNetwork>(
    () => {
      if (!project) return BRIDGE_NETWORKS[0];
      const found = BRIDGE_NETWORKS.find(n => n.name.toLowerCase().includes(project.chain.toLowerCase()));
      return found || BRIDGE_NETWORKS[0];
    }
  );
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [selectedFn, setSelectedFn] = useState<ContractFunction | null>(null);
  const [fnParams, setFnParams] = useState<Record<string, string>>({});
  const [simulation, setSimulation] = useState<TxSimulation | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [abiResult, setAbiResult] = useState<ABIDetectionResult | null>(null);
  const [abiScanning, setAbiScanning] = useState(false);
  const [abiScanStep, setAbiScanStep] = useState(0);

  const contractType = project?.type === 'launchpool' ? 'launchpool' : 'ido';
  const functions = CONTRACT_FUNCTIONS[contractType] || CONTRACT_FUNCTIONS.ido;

  const handleSelectFn = (fn: ContractFunction) => {
    setSelectedFn(fn);
    setFnParams({});
    setSimulation(null);
  };

  const handleParamChange = (name: string, value: string) => {
    setFnParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSimulate = useCallback(() => {
    if (!selectedFn) return;
    setSimulating(true);
    setSimulation(null);

    setTimeout(() => {
      // Find matching mock or generate one
      const mock = MOCK_TX_SIMULATIONS.find(s => s.functionName === selectedFn.name) || {
        id: `sim_${Date.now()}`,
        functionName: selectedFn.name,
        chain: selectedNetwork.name,
        contractAddress: project?.contractAddress || '0x...',
        params: fnParams,
        status: 'success' as const,
        gasEstimate: selectedFn.estimatedGas || '50,000',
        gasPrice: '5 Gwei',
        totalCost: selectedNetwork.gasEstimate,
        expectedOutput: `${selectedFn.name}() executed successfully`,
        warnings: [],
        errors: [],
        stateChanges: [],
      };
      setSimulation({
        ...mock,
        chain: selectedNetwork.name,
        params: fnParams,
      });
      setSimulating(false);
    }, 1500);
  }, [selectedFn, fnParams, selectedNetwork, project]);

  if (!project) {
    return (
      <PageLayout>
        <Header title="Contract" back />
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
    <PageLayout>
      {/* Network selector sheet */}
      {showNetworkSelector && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowNetworkSelector(false)}>
          <div className="w-full rounded-t-3xl"
            style={{ background: c.surface, maxWidth: 440, margin: '0 auto', maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} /></div>
            <div className="px-5 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Chọn mạng</h3>
                <button onClick={() => setShowNetworkSelector(false)}><X size={20} color={c.text3} /></button>
              </div>
              <div className="flex flex-col gap-2">
                {BRIDGE_NETWORKS.map(n => (
                  <button key={n.id} onClick={() => { setSelectedNetwork(n); setShowNetworkSelector(false); }}
                    className="w-full flex items-center gap-3 rounded-xl p-3"
                    style={{
                      background: selectedNetwork.id === n.id ? `${n.color}10` : c.surface2,
                      border: `1px solid ${selectedNetwork.id === n.id ? n.color + '40' : 'transparent'}`,
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: n.color + '22', color: n.color }}>
                      {n.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{n.name}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}>Gas: {n.gasEstimate} · {n.avgTime}</p>
                    </div>
                    {selectedNetwork.id === n.id && <CheckCircle size={18} color={n.color} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm execution sheet */}
      {showConfirm && selectedFn && simulation && (
        <ConfirmExecutionSheet
          fn={selectedFn}
          simulation={simulation}
          network={selectedNetwork}
          project={project}
          onClose={() => setShowConfirm(false)}
        />
      )}

      <Header title="Smart Contract" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* Contract header */}
        <TrCard className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: project.logoColor + '22', color: project.logoColor }}>
              {project.logo}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{project.name} Contract</p>
              <div className="flex items-center gap-1.5">
                <FileCode size={11} color={c.text3} />
                <span style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace' }}>
                  {truncateAddress(project.contractAddress)}
                </span>
                <button onClick={() => navigator.clipboard?.writeText(project.contractAddress)}>
                  <Copy size={11} color={c.text3} />
                </button>
              </div>
            </div>
          </div>

          {/* Network selector */}
          <button onClick={() => setShowNetworkSelector(true)}
            className="w-full flex items-center gap-3 rounded-xl p-2.5"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: selectedNetwork.color + '22', color: selectedNetwork.color }}>
              {selectedNetwork.icon}
            </div>
            <div className="flex-1 text-left">
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{selectedNetwork.name}</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Gas: {selectedNetwork.gasEstimate}</p>
            </div>
            <ChevronDown size={14} color={c.text3} />
          </button>
        </TrCard>

        {/* Functions tab */}
        {tab === 'Functions' && (
          <div className="flex flex-col gap-3">
            {/* Read functions */}
            <PageSection label="Read Functions" accentColor="#3B82F6">
              {functions.filter(fn => fn.type === 'read').map(fn => (
                <FunctionCard key={fn.name} fn={fn} selected={selectedFn?.name === fn.name}
                  onSelect={() => handleSelectFn(fn)} />
              ))}
            </PageSection>

            {/* Write functions */}
            <PageSection label="Write Functions" accentColor="#F59E0B">
              {functions.filter(fn => fn.type === 'write').map(fn => (
                <FunctionCard key={fn.name} fn={fn} selected={selectedFn?.name === fn.name}
                  onSelect={() => handleSelectFn(fn)} />
              ))}
            </PageSection>

            {/* Selected function details */}
            {selectedFn && (
              <TrCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code2 size={16} color={selectedFn.type === 'read' ? '#3B82F6' : '#F59E0B'} />
                    <h4 style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{selectedFn.name}()</h4>
                  </div>
                  <RiskBadge level={selectedFn.riskLevel} />
                </div>

                <p style={{ color: c.text2, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                  {selectedFn.description}
                </p>

                {/* Parameters */}
                {selectedFn.params.length > 0 && (
                  <div className="flex flex-col gap-3 mb-4">
                    {selectedFn.params.map(param => (
                      <div key={param.name}>
                        <div className="flex items-center justify-between mb-1">
                          <label style={{ color: c.text2, fontSize: 12 }}>
                            {param.label}
                            {param.required && <span style={{ color: '#EF4444' }}> *</span>}
                          </label>
                          <span className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: c.surface2, color: c.text3, fontSize: 9 }}>
                            {param.type}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={fnParams[param.name] || ''}
                          onChange={e => handleParamChange(param.name, e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-transparent outline-none"
                          style={{
                            color: c.text1, fontSize: 13, fontFamily: 'monospace',
                            border: `1px solid ${c.borderSolid}`,
                          }}
                          placeholder={param.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Gas estimate */}
                {selectedFn.estimatedGas && (
                  <div className="flex items-center gap-2 mb-4 rounded-xl p-2.5" style={{ background: c.surface2 }}>
                    <Fuel size={13} color={c.text3} />
                    <span style={{ color: c.text3, fontSize: 11 }}>Gas ước tính: </span>
                    <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                      {selectedFn.estimatedGas}
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {selectedFn.type === 'read' ? (
                    <CTAButton className="flex-1" loading={simulating} onClick={handleSimulate}>
                      <Eye size={16} className="inline mr-1.5" />
                      Đọc dữ liệu
                    </CTAButton>
                  ) : (
                    <>
                      <button onClick={handleSimulate}
                        className="flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity active:scale-[0.98]"
                        style={{
                          background: c.surface2, color: c.text2,
                          border: `1px solid ${c.borderSolid}`,
                          fontSize: 13, borderRadius: 14, fontWeight: 600,
                        }}>
                        {simulating ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                        Mô phỏng
                      </button>
                      <CTAButton className="flex-1"
                        disabled={!simulation || simulation.status === 'failed'}
                        onClick={() => setShowConfirm(true)}>
                        <Zap size={16} className="inline mr-1.5" />
                        Thực thi
                      </CTAButton>
                    </>
                  )}
                </div>
              </TrCard>
            )}

            {/* Simulation result */}
            {simulation && (
              <SimulationResultCard simulation={simulation} />
            )}
          </div>
        )}

        {/* ABI Scanner tab */}
        {tab === 'ABI Scanner' && (
          <ABIScannerTab
            contractAddress={project.contractAddress}
            chain={selectedNetwork.name}
            result={abiResult}
            scanning={abiScanning}
            scanStep={abiScanStep}
            onScan={() => {
              setAbiScanning(true);
              setAbiScanStep(0);
              setAbiResult(null);
              const scanSteps = [1, 2, 3, 4, 5];
              scanSteps.forEach((s, i) => {
                setTimeout(() => {
                  setAbiScanStep(s);
                  if (s === 5) {
                    const r = simulateABIDetection(project.contractAddress, selectedNetwork.name);
                    setAbiResult(r);
                    setAbiScanning(false);
                  }
                }, (i + 1) * 400);
              });
            }}
          />
        )}

        {/* Simulation tab */}
        {tab === 'Mô phỏng' && (
          <div className="flex flex-col gap-3">
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Play size={16} color="#8B5CF6" />
                <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>Mô phỏng giao dịch</p>
              </div>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
                Mô phỏng cho phép xem trước kết quả giao dịch mà không cần gửi on-chain.
                Bao gồm thay đổi state, gas, và cảnh báo rõ ràng.
              </p>

              <div className="flex flex-col gap-2">
                {[
                  { icon: Shield, label: 'Phát hiện rủi ro', desc: 'Cảnh báo approve không giới hạn, contract chưa verify', color: '#EF4444' },
                  { icon: Database, label: 'State changes', desc: 'Xem trước thay đổi số dư, allowance, state', color: '#3B82F6' },
                  { icon: Fuel, label: 'Gas estimation', desc: 'Ước tính chi phí gas chính xác trước khi gửi', color: '#F59E0B' },
                ].map(f => (
                  <div key={f.label} className="flex items-start gap-3 rounded-xl p-3" style={{ background: c.surface2 }}>
                    <f.icon size={16} color={f.color} className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{f.label}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Mock simulation history */}
            <PageSection label="Lịch sử mô phỏng gần đây">
              {MOCK_TX_SIMULATIONS.map(sim => (
                <SimulationResultCard key={sim.id} simulation={sim} />
              ))}
            </PageSection>
          </div>
        )}

        {/* History tab */}
        {tab === 'Lịch sử' && (
          <div className="flex flex-col gap-3">
            <TrCard className="p-8 text-center">
              <Database size={40} color={c.text3} className="mx-auto mb-3" />
              <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Chưa có giao dịch nào
              </p>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                Lịch sử giao dịch on-chain sẽ hiển thị ở đây sau khi bạn thực hiện giao dịch.
              </p>
            </TrCard>

            <div className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Đây là chế độ mô phỏng. Giao dịch không được gửi lên blockchain thật.
                Mọi dữ liệu là minh họa cho mục đích prototype.
              </p>
            </div>
          </div>
        )}

        {/* Safety disclaimer */}
        <div className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <ShieldAlert size={14} color="#EF4444" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Cảnh báo bảo mật</p>
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              Luôn kiểm tra địa chỉ contract trước khi tương tác. Không approve không giới hạn cho contract là.
              Chỉ tương tác với contract đã được audit.
            </p>
          </div>
        </div>

        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   FunctionCard — contract function selector
   ═══════════════════════════════════════════════════════════ */

function FunctionCard({ fn, selected, onSelect }: {
  fn: ContractFunction; selected: boolean; onSelect: () => void;
}) {
  const c = useThemeColors();
  const isRead = fn.type === 'read';

  return (
    <button onClick={onSelect}
      className="w-full flex items-center gap-3 rounded-xl p-3 mb-2 text-left"
      style={{
        background: selected ? (isRead ? 'rgba(59,130,246,0.06)' : 'rgba(245,158,11,0.06)') : c.surface2,
        border: `1px solid ${selected ? (isRead ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)') : 'transparent'}`,
      }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: isRead ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)' }}>
        {isRead ? <Eye size={14} color="#3B82F6" /> : <Code2 size={14} color="#F59E0B" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
            {fn.name}()
          </span>
          <RiskBadge level={fn.riskLevel} small />
        </div>
        <p style={{ color: c.text3, fontSize: 11 }} className="truncate">{fn.description}</p>
      </div>
      <ChevronDown size={14} color={c.text3} style={{ transform: selected ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   RiskBadge — risk level indicator
   ═══════════════════════════════════════════════════════════ */

function RiskBadge({ level, small }: { level: 'low' | 'medium' | 'high'; small?: boolean }) {
  const config = {
    low: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Low' },
    medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Medium' },
    high: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'High' },
  }[level];

  return (
    <span className="px-1.5 py-0.5 rounded"
      style={{ background: config.bg, color: config.color, fontSize: small ? 9 : 10, fontWeight: 600 }}>
      {config.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   SimulationResultCard — tx simulation output
   ═══════════════════════════════════════════════════════════ */

function SimulationResultCard({ simulation }: { simulation: TxSimulation }) {
  const c = useThemeColors();
  const statusConfig = {
    simulating: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Đang mô phỏng...' },
    success: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Thành công' },
    warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Cảnh báo' },
    failed: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'Thất bại' },
  }[simulation.status];

  return (
    <TrCard className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Code2 size={14} color={c.text2} />
          <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
            {simulation.functionName}()
          </span>
        </div>
        <div className="px-2 py-0.5 rounded-lg" style={{ background: statusConfig.bg }}>
          <span style={{ color: statusConfig.color, fontSize: 10, fontWeight: 600 }}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Expected output */}
      {simulation.expectedOutput && (
        <div className="rounded-xl p-2.5 mb-3" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Kết quả dự kiến</p>
          <p style={{ color: c.text1, fontSize: 12, fontFamily: 'monospace' }}>{simulation.expectedOutput}</p>
        </div>
      )}

      {/* Gas info */}
      <div className="flex gap-3 mb-3">
        {[
          { label: 'Gas', value: simulation.gasEstimate, icon: Fuel },
          { label: 'Gas price', value: simulation.gasPrice, icon: CircleDot },
          { label: 'Chi phí', value: simulation.totalCost, icon: Zap },
        ].map(r => (
          <div key={r.label} className="flex-1 rounded-xl p-2 text-center" style={{ background: c.surface2 }}>
            <r.icon size={12} color={c.text3} className="mx-auto mb-1" />
            <p style={{ color: c.text3, fontSize: 9 }}>{r.label}</p>
            <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</p>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {simulation.warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {simulation.warnings.map((w, i) => (
            <div key={i} className="rounded-xl p-2.5 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: '#F59E0B', fontSize: 11, lineHeight: 1.4 }}>{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {simulation.errors.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {simulation.errors.map((e, i) => (
            <div key={i} className="rounded-xl p-2.5 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertCircle size={12} color="#EF4444" className="shrink-0 mt-0.5" />
              <p style={{ color: '#EF4444', fontSize: 11, lineHeight: 1.4 }}>{e}</p>
            </div>
          ))}
        </div>
      )}

      {/* State changes */}
      {simulation.stateChanges.length > 0 && (
        <div>
          <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Thay đổi state</p>
          <div className="flex flex-col gap-1.5">
            {simulation.stateChanges.map((sc, i) => (
              <StateChangeRow key={i} change={sc} />
            ))}
          </div>
        </div>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   StateChangeRow — individual state change
   ═══════════════════════════════════════════════════════════ */

function StateChangeRow({ change }: { change: StateChange }) {
  const c = useThemeColors();
  const typeColors = {
    balance: '#3B82F6',
    allowance: '#F59E0B',
    state: '#8B5CF6',
  };
  const color = typeColors[change.type];

  return (
    <div className="rounded-lg p-2.5 flex items-center gap-2" style={{ background: c.surface2 }}>
      <div className="w-1 h-8 rounded-full" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text2, fontSize: 11 }}>{change.description}</p>
        <div className="flex items-center gap-1.5">
          <span style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace' }}>{change.before}</span>
          <ArrowRight size={10} color={c.text3} />
          <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{change.after}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ConfirmExecutionSheet — destructive confirm for write calls
   ═══════════════════════════════════════════════════════════ */

function ConfirmExecutionSheet({ fn, simulation, network, project, onClose }: {
  fn: ContractFunction;
  simulation: TxSimulation;
  network: BridgeNetwork;
  project: { name: string; contractAddress: string };
  onClose: () => void;
}) {
  const c = useThemeColors();
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleExecute = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto', maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} /></div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          {!done ? (
            <>
              <div className="flex items-center justify-between">
                <h3 style={{ color: fn.riskLevel === 'high' ? '#EF4444' : c.text1, fontSize: 18, fontWeight: 800 }}>
                  Xác nhận giao dịch
                </h3>
                <button onClick={onClose}><X size={20} color={c.text3} /></button>
              </div>

              {fn.riskLevel === 'high' && (
                <div className="rounded-xl p-4 text-center"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertTriangle size={28} color="#EF4444" className="mx-auto mb-2" />
                  <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    Giao dịch có rủi ro cao
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Hành động này sẽ thay đổi state on-chain và không thể hoàn tác.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'Function', value: `${fn.name}()` },
                  { label: 'Contract', value: truncateAddress(project.contractAddress) },
                  { label: 'Mạng', value: network.name },
                  { label: 'Gas ước tính', value: simulation.totalCost },
                  { label: 'Risk level', value: fn.riskLevel.toUpperCase() },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text2, fontSize: 12 }}>{r.label}</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {simulation.warnings.length > 0 && (
                <div className="rounded-xl p-2.5 flex items-start gap-2"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                  <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
                  <p style={{ color: '#F59E0B', fontSize: 11 }}>{simulation.warnings[0]}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 h-12 rounded-2xl font-bold"
                  style={{ background: c.surface2, color: c.text2, fontSize: 14, borderRadius: 14, fontWeight: 600 }}>
                  Hủy
                </button>
                <CTAButton
                  className="flex-1"
                  variant={fn.riskLevel === 'high' ? 'danger' : 'primary'}
                  loading={processing}
                  onClick={handleExecute}>
                  Thực thi
                </CTAButton>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <CheckCircle size={32} color="#10B981" />
                </div>
                <h3 style={{ color: c.text1, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Giao dịch đã gửi!</h3>
                <p style={{ color: c.text2, fontSize: 12 }}>
                  Tx hash: <span style={{ fontFamily: 'monospace' }}>0x7f8a...b2c9</span>
                </p>
              </div>

              <div className="rounded-xl p-3 flex items-start gap-2"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Đây là chế độ mô phỏng. Giao dịch không được gửi lên blockchain thật.
                </p>
              </div>

              <CTAButton variant="success" onClick={onClose}>
                Hoàn tất
              </CTAButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ABIScannerTab — ABI auto-detection simulation
   ═══════════════════════════════════════════════════════════ */

function ABIScannerTab({ contractAddress, chain, result, scanning, scanStep, onScan }: {
  contractAddress: string; chain: string;
  result: ABIDetectionResult | null; scanning: boolean; scanStep: number;
  onScan: () => void;
}) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const scanLabels = [
    'Kết nối node RPC...',
    'Truy vấn bytecode...',
    'Phân tích function selectors...',
    'Đối chiếu verified source...',
    'Kiểm tra security patterns...',
  ];
  const severityColors: Record<string, { color: string; bg: string }> = {
    info: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
    low: { color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    high: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
    critical: { color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  };

  return (
    <div className="flex flex-col gap-4">
      {!result && !scanning && (
        <TrCard className="p-5 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.12)' }}>
            <Scan size={28} color="#8B5CF6" />
          </div>
          <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 800, marginBottom: 4 }}>ABI Auto-Detection</h3>
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
            Tự động phát hiện ABI, function selectors, proxy pattern và security flags
            từ bytecode on-chain và verified source code.
          </p>
          <CTAButton onClick={onScan}>
            <Scan size={16} className="inline mr-1.5" />
            Bắt đầu quét contract
          </CTAButton>
        </TrCard>
      )}

      {scanning && (
        <TrCard className="p-5">
          <div className="text-center mb-4">
            <RefreshCw size={24} color="#8B5CF6" className="mx-auto mb-2 animate-spin" />
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Đang quét contract...</p>
            <p style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace' }}>{truncateAddress(contractAddress)}</p>
          </div>
          <div className="flex flex-col gap-2">
            {scanLabels.map((label, i) => {
              const done = scanStep > i;
              const active = scanStep === i;
              return (
                <div key={i} className="flex items-center gap-2.5 rounded-lg p-2"
                  style={{ background: done ? 'rgba(16,185,129,0.05)' : active ? 'rgba(139,92,246,0.05)' : 'transparent' }}>
                  {done ? <CheckCircle size={14} color="#10B981" /> :
                    active ? <RefreshCw size={14} color="#8B5CF6" className="animate-spin" /> :
                    <CircleDot size={14} color={c.text3} style={{ opacity: 0.3 }} />}
                  <span style={{
                    color: done ? '#10B981' : active ? '#8B5CF6' : c.text3,
                    fontSize: 12, fontWeight: done || active ? 600 : 400,
                  }}>{label}</span>
                </div>
              );
            })}
          </div>
        </TrCard>
      )}

      {result && (
        <>
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>Contract verified</span>
              <span style={{ color: c.text3, fontSize: 10 }}>({Math.round(result.detectionTime)}ms)</span>
            </div>
            <div className="flex flex-col gap-1.5 mb-3">
              {[
                { label: 'Contract', value: result.contractName },
                { label: 'Compiler', value: result.compiler },
                { label: 'Optimization', value: result.optimization ? 'Enabled' : 'Disabled' },
                { label: 'License', value: result.license },
                { label: 'Proxy', value: result.proxyType === 'none' ? 'No proxy' : result.proxyType },
                ...(result.implementationAddress ? [{ label: 'Impl', value: result.implementationAddress }] : []),
              ].map(r => (
                <div key={r.label} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${c.border}` }}>
                  <span style={{ color: c.text3, fontSize: 11 }}>{r.label}</span>
                  <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {result.detectedStandards.map(s => (
                <span key={s} className="px-2 py-0.5 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontSize: 10, fontWeight: 600 }}>
                  {s}
                </span>
              ))}
            </div>
          </TrCard>

          <TrCard className="p-4">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              Functions ({result.readFunctions.length + result.writeFunctions.length})
            </p>
            {result.readFunctions.length > 0 && (
              <div className="mb-3">
                <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Read ({result.readFunctions.length})</p>
                {result.readFunctions.map(fn => (
                  <DetectedFnRow key={fn.selector} fn={fn} type="read" />
                ))}
              </div>
            )}
            {result.writeFunctions.length > 0 && (
              <div>
                <p style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Write ({result.writeFunctions.length})</p>
                {result.writeFunctions.map(fn => (
                  <DetectedFnRow key={fn.selector} fn={fn} type="write" />
                ))}
              </div>
            )}
          </TrCard>

          <TrCard className="p-4">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Events ({result.events.length})</p>
            <div className="flex flex-col gap-1">
              {result.events.map(ev => (
                <div key={ev} className="flex items-center gap-2 rounded-lg p-2" style={{ background: c.surface2 }}>
                  <Tag size={11} color={c.text3} />
                  <span style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace' }}>{ev}</span>
                </div>
              ))}
            </div>
          </TrCard>

          <TrCard className="p-4">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Security ({result.securityFlags.length})</p>
            <div className="flex flex-col gap-2">
              {result.securityFlags.map((flag, i) => {
                const sc = severityColors[flag.severity] || severityColors.info;
                return (
                  <div key={i} className="rounded-xl p-3" style={{ background: sc.bg, border: `1px solid ${sc.color}18` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded" style={{ background: sc.color + '20', color: sc.color, fontSize: 9, fontWeight: 700 }}>
                        {flag.severity.toUpperCase()}
                      </span>
                      <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{flag.code}</span>
                    </div>
                    <p style={{ color: c.text2, fontSize: 11, marginBottom: 4 }}>{flag.message}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>→ {flag.recommendation}</p>
                  </div>
                );
              })}
            </div>
          </TrCard>

          <button onClick={onScan}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            <RefreshCw size={13} color={c.text2} />
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Quét lại</span>
          </button>

          {/* ABI Diff button — proxy upgrade comparison */}
          {result && result.proxyType !== 'none' && (
            <button
              onClick={() => navigate(`${prefix}/launchpad/abi-diff/${encodeURIComponent(contractAddress)}`)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <Code2 size={13} color="#8B5CF6" />
              <span style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 600 }}>Xem ABI Diff (Proxy Upgrade)</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

function DetectedFnRow({ fn, type }: { fn: DetectedFunction; type: 'read' | 'write' }) {
  const c = useThemeColors();
  const color = type === 'read' ? '#3B82F6' : '#F59E0B';
  return (
    <div className="flex items-center gap-2 rounded-lg p-2 mb-1" style={{ background: c.surface2 }}>
      <Binary size={11} color={color} />
      <div className="flex-1 min-w-0">
        <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
          {fn.name}({fn.inputs.map(i => i.type).join(', ')})
        </span>
        {fn.outputs.length > 0 && (
          <span style={{ color: c.text3, fontSize: 10, marginLeft: 4 }}>→ {fn.outputs.map(o => o.type).join(', ')}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>{fn.selector}</span>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: fn.confidence >= 95 ? '#10B981' : fn.confidence >= 80 ? '#F59E0B' : '#EF4444' }} />
        <span style={{ color: c.text3, fontSize: 9 }}>{fn.confidence}%</span>
      </div>
    </div>
  );
}