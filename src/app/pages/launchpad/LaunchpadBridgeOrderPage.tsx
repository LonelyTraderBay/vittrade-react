/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadBridgeOrderPage — Bridge Order Real-Time Status
 * ══════════════════════════════════════════════════════════════
 *  Pattern A — Standard Detail Page
 *  Features: Real-time polling simulation, animated status timeline,
 *            confirmation counter, ETA countdown, retry on failure,
 *            Phase 4.7: WebSocket-style event log panel
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  CheckCircle, Clock, AlertTriangle, X, Info, Copy,
  ArrowRight, RefreshCw, AlertCircle, ExternalLink,
  Zap, Globe, GitBranch, Shield, Fuel,
  CircleDot, Loader, ChevronDown, ChevronUp,
  Terminal, Wifi, WifiOff, Filter, Pause, Play,
} from 'lucide-react';
import {
  loadBridgeHistory, truncateAddress,
  createBridgeOrderDetail, getBridgePollingSequence,
  generateBridgeEventLog,
  type BridgeTxRecord, type BridgeOrderDetail, type BridgePollingStatus, type BridgePollingStep,
  type BridgeWsEvent, type WsEventLevel, type WsConnectionState,
} from './launchpadData';

const STATUS_CONFIG: Record<BridgePollingStatus, { color: string; bg: string; label: string; icon: typeof CheckCircle }> = {
  initiated: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Da tao', icon: Zap },
  approved: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Đã approve', icon: Shield },
  bridging: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Đang bridge', icon: GitBranch },
  confirming: { color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', label: 'Xác nhận', icon: Clock },
  swapping: { color: '#EC4899', bg: 'rgba(236,72,153,0.1)', label: 'Đang swap', icon: RefreshCw },
  finalizing: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Hoàn tất', icon: Loader },
  completed: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Thành công', icon: CheckCircle },
  failed: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'Thất bại', icon: AlertCircle },
};

const WS_LEVEL_COLORS: Record<WsEventLevel, string> = {
  info: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  debug: '#8B95B3',
  system: '#8B5CF6',
};

export function LaunchpadBridgeOrderPage() {
  const c = useThemeColors();
  const { txId } = useParams<{ txId: string }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const location = useLocation();

  const scenario = ((location.state as any)?.scenario as 'success' | 'slow' | 'fail') || 'success';

  const [bridgeTx, setBridgeTx] = useState<BridgeTxRecord | null>(() => {
    const hist = loadBridgeHistory();
    return hist.find(t => t.id === txId) || hist[0] || null;
  });

  const [order, setOrder] = useState<BridgeOrderDetail | null>(() => {
    if (!bridgeTx) return null;
    return createBridgeOrderDetail(bridgeTx, scenario);
  });

  // Polling state
  const [isPolling, setIsPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState(order?.estimatedDuration || 20);
  const [confirmations, setConfirmations] = useState<{ current: number; required: number } | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  // WS Event log state
  const [wsEvents, setWsEvents] = useState<BridgeWsEvent[]>([]);
  const [wsState, setWsState] = useState<WsConnectionState>('connecting');
  const [logExpanded, setLogExpanded] = useState(false);
  const [logPaused, setLogPaused] = useState(false);
  const [logFilter, setLogFilter] = useState<WsEventLevel | 'all'>('all');
  const logEndRef = useRef<HTMLDivElement>(null);
  const wsTimeoutsRef = useRef<number[]>([]);
  const pausedEventsRef = useRef<BridgeWsEvent[]>([]);

  // Simulate polling sequence
  useEffect(() => {
    if (!order || !bridgeTx) return;

    const sequence = getBridgePollingSequence(scenario);
    let cumulativeDelay = 0;

    sequence.forEach(([status, delay], i) => {
      cumulativeDelay += delay;
      const tid = window.setTimeout(() => {
        setPollCount(i + 1);

        setOrder(prev => {
          if (!prev) return prev;
          const now = new Date();
          const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
          const updatedSteps = prev.steps.map(step => {
            if (step.status === status && !step.timestamp) {
              return { ...step, timestamp: ts };
            }
            return step;
          });
          return { ...prev, status, steps: updatedSteps };
        });

        if (status === 'bridging') {
          const step = order.steps.find(s => s.status === 'bridging');
          if (step?.confirmations) {
            const { required } = step.confirmations;
            for (let c = 1; c <= required; c++) {
              const cTid = window.setTimeout(() => {
                setConfirmations({ current: c, required });
              }, c * (delay / required));
              timeoutsRef.current.push(cTid);
            }
          }
        }
        if (status === 'confirming') {
          const step = order.steps.find(s => s.status === 'confirming');
          if (step?.confirmations) {
            const { required } = step.confirmations;
            for (let c = 1; c <= required; c++) {
              const cTid = window.setTimeout(() => {
                setConfirmations({ current: c, required });
              }, c * (delay / required));
              timeoutsRef.current.push(cTid);
            }
          }
        }
        if (status === 'completed' || status === 'failed') {
          setIsPolling(false);
          setConfirmations(null);
        }
      }, cumulativeDelay);
      timeoutsRef.current.push(tid);
    });

    return () => {
      timeoutsRef.current.forEach(t => window.clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // WS Event log simulation
  useEffect(() => {
    if (!order) return;

    const eventSequence = generateBridgeEventLog(order, scenario);
    let cumulativeDelay = 0;

    // Connection state transitions
    window.setTimeout(() => setWsState('connecting'), 100);
    window.setTimeout(() => setWsState('connected'), 900);

    eventSequence.forEach(({ event, delayMs }) => {
      cumulativeDelay += delayMs;
      const tid = window.setTimeout(() => {
        // Refresh timestamp to current time
        const now = new Date();
        const freshEvent = {
          ...event,
          id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          timestamp: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`,
        };

        if (logPaused) {
          pausedEventsRef.current.push(freshEvent);
        } else {
          setWsEvents(prev => [...prev, freshEvent]);
        }

        // Detect ws close
        if (event.source === 'ws' && event.message.includes('ended')) {
          setWsState('disconnected');
        }
      }, cumulativeDelay);
      wsTimeoutsRef.current.push(tid);
    });

    return () => {
      wsTimeoutsRef.current.forEach(t => window.clearTimeout(t));
      wsTimeoutsRef.current = [];
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll log
  useEffect(() => {
    if (logExpanded && logEndRef.current && !logPaused) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [wsEvents, logExpanded, logPaused]);

  // Resume paused events
  const handleResumeLog = useCallback(() => {
    setLogPaused(false);
    if (pausedEventsRef.current.length > 0) {
      setWsEvents(prev => [...prev, ...pausedEventsRef.current]);
      pausedEventsRef.current = [];
    }
  }, []);

  // ETA countdown
  useEffect(() => {
    if (!isPolling || etaSeconds <= 0) return;
    const iv = setInterval(() => {
      setEtaSeconds(prev => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(iv);
  }, [isPolling, etaSeconds]);

  // Retry handler
  const handleRetry = useCallback(() => {
    if (!bridgeTx) return;
    const newOrder = createBridgeOrderDetail(bridgeTx, 'success');
    newOrder.retryCount = (order?.retryCount || 0) + 1;
    setOrder(newOrder);
    setIsPolling(true);
    setPollCount(0);
    setEtaSeconds(newOrder.estimatedDuration);
    setConfirmations(null);
    setWsEvents([]);
    setWsState('connecting');

    // Clear old timeouts
    timeoutsRef.current.forEach(t => window.clearTimeout(t));
    timeoutsRef.current = [];
    wsTimeoutsRef.current.forEach(t => window.clearTimeout(t));
    wsTimeoutsRef.current = [];

    // Re-run polling
    const sequence = getBridgePollingSequence('success');
    let cumDelay = 0;
    sequence.forEach(([status, delay], i) => {
      cumDelay += delay;
      const tid = window.setTimeout(() => {
        setPollCount(i + 1);
        setOrder(prev => {
          if (!prev) return prev;
          const now = new Date();
          const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
          const updatedSteps = prev.steps.map(step =>
            step.status === status && !step.timestamp ? { ...step, timestamp: ts } : step
          );
          return { ...prev, status, steps: updatedSteps };
        });
        if (status === 'completed' || status === 'failed') {
          setIsPolling(false);
          setConfirmations(null);
        }
      }, cumDelay);
      timeoutsRef.current.push(tid);
    });

    // Re-run WS events
    const eventSequence = generateBridgeEventLog(newOrder, 'success');
    let wsCum = 0;
    window.setTimeout(() => setWsState('connecting'), 100);
    window.setTimeout(() => setWsState('connected'), 900);
    eventSequence.forEach(({ event, delayMs }) => {
      wsCum += delayMs;
      const tid = window.setTimeout(() => {
        const now = new Date();
        setWsEvents(prev => [...prev, {
          ...event,
          id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          timestamp: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`,
        }]);
        if (event.source === 'ws' && event.message.includes('ended')) {
          setWsState('disconnected');
        }
      }, wsCum);
      wsTimeoutsRef.current.push(tid);
    });
  }, [bridgeTx, order]);

  if (!order || !bridgeTx) {
    return (
      <PageLayout>
        <Header title="Bridge Order" back />
        <PageContent>
          <TrCard className="p-8 text-center">
            <AlertCircle size={40} color={c.text3} className="mx-auto mb-3" />
            <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>Khong tim thay don</p>
            <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>Giao dich bridge khong ton tai hoac da het han.</p>
          </TrCard>
        </PageContent>
      </PageLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.initiated;
  const StatusIcon = statusCfg.icon;
  const isComplete = order.status === 'completed';
  const isFailed = order.status === 'failed';

  const allStatuses: BridgePollingStatus[] = ['initiated', 'approved', 'bridging', 'confirming', 'swapping', 'finalizing', 'completed'];
  const currentIdx = allStatuses.indexOf(order.status);

  const filteredEvents = logFilter === 'all' ? wsEvents : wsEvents.filter(e => e.level === logFilter);

  return (
    <PageLayout>
      <Header title="Chi tiet Bridge" back />

      <PageContent gap="default">
        {/* Status hero */}
        <TrCard variant={isComplete ? undefined : 'hero'} className="p-5 relative overflow-hidden">
          {!isComplete && !isFailed && (
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full"
              style={{ background: `radial-gradient(circle, ${statusCfg.color}33 0%, transparent 65%)` }} />
          )}

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ background: statusCfg.bg }}>
              {isPolling && !isComplete && !isFailed ? (
                <RefreshCw size={28} color={statusCfg.color} className="animate-spin" />
              ) : (
                <StatusIcon size={28} color={statusCfg.color} />
              )}
            </div>

            <h3 style={{ color: isComplete ? c.text1 : '#fff', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
              {isComplete ? 'Bridge hoàn tất!' : isFailed ? 'Bridge thất bại' : 'Đang xử lý bridge...'}
            </h3>
            <p style={{ color: isComplete ? c.text2 : 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {order.sourceChain} → {order.targetChain}
            </p>

            <div className="flex items-center gap-3 mt-3">
              <div className="text-center">
                <p style={{ color: isComplete ? c.text3 : 'rgba(255,255,255,0.5)', fontSize: 10 }}>Ban</p>
                <p style={{ color: isComplete ? c.text1 : '#fff', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                  ${order.inputAmount.toLocaleString()}
                </p>
                <p style={{ color: isComplete ? c.text3 : 'rgba(255,255,255,0.5)', fontSize: 10 }}>{order.inputToken}</p>
              </div>
              <ArrowRight size={16} color={isComplete ? c.text3 : 'rgba(255,255,255,0.4)'} />
              <div className="text-center">
                <p style={{ color: isComplete ? c.text3 : 'rgba(255,255,255,0.5)', fontSize: 10 }}>Nhan</p>
                <p style={{ color: '#10B981', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                  {order.expectedOutput.toLocaleString()}
                </p>
                <p style={{ color: isComplete ? c.text3 : 'rgba(255,255,255,0.5)', fontSize: 10 }}>{order.outputToken}</p>
              </div>
            </div>

            {isPolling && !isComplete && !isFailed && (
              <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <Clock size={12} color="rgba(255,255,255,0.6)" />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'monospace' }}>
                  ETA ~{etaSeconds}s
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                  Poll #{pollCount}
                </span>
              </div>
            )}
          </div>
        </TrCard>

        {/* Confirmations bar */}
        {confirmations && isPolling && (
          <TrCard className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ color: c.text2, fontSize: 12 }}>Block confirmations</span>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                {confirmations.current}/{confirmations.required}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(confirmations.current / confirmations.required) * 100}%`,
                  background: '#06B6D4',
                }} />
            </div>
          </TrCard>
        )}

        {/* Status timeline */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={15} color={statusCfg.color} />
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Tien trinh</p>
            {isPolling && (
              <div className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(59,130,246,0.1)' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#3B82F6' }} />
                <span style={{ color: '#3B82F6', fontSize: 9, fontWeight: 600 }}>LIVE</span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-[15px] top-3 bottom-3 w-px" style={{ background: c.borderSolid }} />

            {order.steps.filter(s => {
              if (isFailed) {
                const failIdx = order.steps.findIndex(st => st.status === 'failed');
                const thisIdx = order.steps.indexOf(s);
                return thisIdx <= failIdx;
              }
              return true;
            }).map((step, i) => {
              const stepIdx = allStatuses.indexOf(step.status);
              const isDone = stepIdx < currentIdx || (step.status === order.status && (isComplete || isFailed));
              const isActive = step.status === order.status && !isComplete && !isFailed;
              const isFuture = stepIdx > currentIdx;
              const isFailStep = step.status === 'failed';

              const dotColor = isDone ? '#10B981'
                : isActive ? statusCfg.color
                : isFailStep ? '#EF4444'
                : c.borderSolid;

              const StepIcon = isFailStep ? AlertCircle
                : isDone ? CheckCircle
                : isActive ? (STATUS_CONFIG[step.status]?.icon || CircleDot)
                : CircleDot;

              return (
                <div key={step.status + i} className="flex gap-3 relative mb-1" style={{ paddingLeft: 36 }}>
                  <div className="absolute left-0 flex items-center justify-center"
                    style={{ width: 30, top: 10 }}>
                    {isActive && !isComplete ? (
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full" style={{ background: dotColor }} />
                        <div className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
                          style={{ background: dotColor, opacity: 0.4 }} />
                      </div>
                    ) : (
                      <StepIcon size={isDone || isFailStep ? 14 : 10} color={dotColor}
                        style={{ opacity: isFuture ? 0.3 : 1 }} />
                    )}
                  </div>

                  <div className="flex-1 rounded-xl p-2.5 mb-1" style={{
                    background: isActive ? `${statusCfg.color}08` : isFailStep ? 'rgba(239,68,68,0.05)' : c.surface2,
                    border: isActive ? `1px solid ${statusCfg.color}20` : isFailStep ? '1px solid rgba(239,68,68,0.15)' : '1px solid transparent',
                    opacity: isFuture ? 0.5 : 1,
                  }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ color: isFailStep ? '#EF4444' : c.text1, fontSize: 12, fontWeight: 600 }}>
                        {step.label}
                      </span>
                      {step.timestamp && (
                        <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>{step.timestamp}</span>
                      )}
                    </div>
                    <p style={{ color: isFailStep ? '#EF4444' : c.text3, fontSize: 10, lineHeight: 1.4 }}>
                      {step.detail}
                    </p>
                    {step.txHash && (
                      <div className="flex items-center gap-1 mt-1">
                        <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>{step.txHash}</span>
                        <Copy size={9} color={c.text3} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TrCard>

        {/* ═══════════════════════════════════════════════════════════
           WebSocket Event Log Panel (Phase 4.7)
           ═══════════════════════════════════════════════════════════ */}
        <TrCard className="overflow-hidden">
          {/* Log header */}
          <button className="w-full flex items-center justify-between p-3"
            onClick={() => setLogExpanded(!logExpanded)}
            style={{ borderBottom: logExpanded ? `1px solid ${c.border}` : 'none' }}>
            <div className="flex items-center gap-2">
              <Terminal size={14} color="#8B5CF6" />
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Event Log</span>
              <WsStatusBadge state={wsState} />
              <span style={{ color: c.text3, fontSize: 10 }}>
                {wsEvents.length} events
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {logExpanded && wsEvents.length > 0 && (
                <button onClick={e => { e.stopPropagation(); logPaused ? handleResumeLog() : setLogPaused(true); }}
                  className="p-1 rounded-md" style={{ background: c.surface2 }}>
                  {logPaused ? <Play size={11} color="#10B981" /> : <Pause size={11} color="#F59E0B" />}
                </button>
              )}
              {logExpanded ? <ChevronUp size={14} color={c.text3} /> : <ChevronDown size={14} color={c.text3} />}
            </div>
          </button>

          {/* Expanded log */}
          {logExpanded && (
            <div>
              {/* Filter bar */}
              <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto"
                style={{ borderBottom: `1px solid ${c.border}` }}>
                {(['all', 'info', 'success', 'warning', 'error', 'debug', 'system'] as const).map(level => (
                  <button key={level}
                    onClick={() => setLogFilter(level)}
                    className="px-2 py-1 rounded-md whitespace-nowrap"
                    style={{
                      background: logFilter === level
                        ? (level === 'all' ? 'rgba(59,130,246,0.1)' : `${WS_LEVEL_COLORS[level === 'all' ? 'info' : level]}15`)
                        : c.surface2,
                      color: logFilter === level
                        ? (level === 'all' ? '#3B82F6' : WS_LEVEL_COLORS[level === 'all' ? 'info' : level])
                        : c.text3,
                      fontSize: 10, fontWeight: logFilter === level ? 600 : 400,
                    }}>
                    {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                    {level !== 'all' && (
                      <span className="ml-1" style={{ opacity: 0.6 }}>
                        {wsEvents.filter(e => e.level === level).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Log entries — terminal style */}
              <div className="overflow-y-auto" style={{
                maxHeight: 280,
                background: '#0D1117',
                fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
              }}>
                {filteredEvents.length === 0 ? (
                  <div className="p-4 text-center">
                    <Terminal size={20} color="#484F58" className="mx-auto mb-2" />
                    <p style={{ color: '#484F58', fontSize: 11 }}>
                      {wsEvents.length === 0 ? 'Chờ kết nối...' : 'Không có events với filter này'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 flex flex-col gap-px">
                    {filteredEvents.map(event => (
                      <WsLogEntry key={event.id} event={event} />
                    ))}
                    <div ref={logEndRef} />
                  </div>
                )}

                {/* Paused indicator */}
                {logPaused && (
                  <div className="px-3 py-1.5 text-center"
                    style={{ background: 'rgba(245,158,11,0.08)', borderTop: '1px solid rgba(245,158,11,0.15)' }}>
                    <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>
                      ⏸ Log tạm dừng · {pausedEventsRef.current.length} events chờ
                    </span>
                    <button onClick={handleResumeLog} className="ml-2"
                      style={{ color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>
                      Tiếp tục
                    </button>
                  </div>
                )}
              </div>

              {/* Log footer */}
              <div className="px-3 py-2 flex items-center justify-between"
                style={{ background: '#161B22', borderTop: '1px solid #21262D' }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: wsState === 'connected' ? '#10B981' : wsState === 'connecting' ? '#F59E0B' : '#EF4444',
                      boxShadow: wsState === 'connected' ? '0 0 6px #10B981' : 'none',
                    }} />
                  <span style={{ color: '#8B949E', fontSize: 9, fontFamily: 'monospace' }}>
                    wss://bridge-relay.vitrading.io
                  </span>
                </div>
                <span style={{ color: '#484F58', fontSize: 9, fontFamily: 'monospace' }}>
                  {wsEvents.length} msgs
                </span>
              </div>
            </div>
          )}
        </TrCard>

        {/* Order details */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={15} color={c.text2} />
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Chi tiet don</p>
          </div>
          <div className="flex flex-col gap-0">
            {[
              { label: 'Du an', value: order.projectName },
              { label: 'Route', value: order.routeProvider },
              { label: 'Hops', value: `${order.routeHops} buoc` },
              { label: 'Slippage', value: `${order.slippage}%` },
              { label: 'Price Impact', value: `${order.priceImpact}%`, color: order.priceImpact > 1 ? '#F59E0B' : '#10B981' },
              { label: 'Gas', value: order.gasCost },
              { label: 'Tổng phí', value: order.totalFee },
              { label: 'Source Tx', value: order.sourceTxHash, mono: true },
              ...(order.retryCount > 0 ? [{ label: 'So lan thu lai', value: `${order.retryCount}` }] : []),
            ].map(r => (
              <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: 12 }}>{r.label}</span>
                <span style={{
                  color: (r as any).color || c.text1,
                  fontSize: 12, fontWeight: 600,
                  fontFamily: (r as any).mono ? 'monospace' : undefined,
                }}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Actions */}
        {isFailed && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>Bridge that bai</p>
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  {order.failReason || 'Giao dịch đã hết thời gian. Số dư nguồn vẫn an toàn.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(-1)}
                className="flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity active:scale-[0.98]"
                style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: 13, borderRadius: 14, fontWeight: 600 }}>
                Quay lai
              </button>
              <CTAButton className="flex-1" onClick={handleRetry}>
                <RefreshCw size={14} className="inline mr-1" />
                Thu lai
              </CTAButton>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex gap-2">
            <button onClick={() => navigate(`${prefix}/launchpad/${bridgeTx.projectId}`)}
              className="flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity active:scale-[0.98]"
              style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: 13, borderRadius: 14, fontWeight: 600 }}>
              Xem du an
            </button>
            <CTAButton className="flex-1" variant="success" onClick={() => navigate(-1)}>
              Hoàn tất
            </CTAButton>
          </div>
        )}

        {/* Safety note */}
        <div className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Đây là chế độ mô phỏng. Trạng thái được cập nhật tự động mỗi vài giây.
            Giao dich khong duoc gui len blockchain that.
          </p>
        </div>

        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   WsStatusBadge — connection status indicator
   ═══════════════════════════════════════════════════════════ */

function WsStatusBadge({ state }: { state: WsConnectionState }) {
  const cfg: Record<WsConnectionState, { color: string; bg: string; label: string; icon: typeof Wifi }> = {
    connecting: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Connecting', icon: Wifi },
    connected: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Connected', icon: Wifi },
    reconnecting: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Reconnecting', icon: RefreshCw },
    disconnected: { color: '#8B95B3', bg: 'rgba(139,149,179,0.1)', label: 'Closed', icon: WifiOff },
  };
  const c = cfg[state] || cfg.connecting;
  const Icon = c.icon;

  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: c.bg }}>
      <Icon size={8} color={c.color} className={state === 'connecting' ? 'animate-pulse' : ''} />
      <span style={{ color: c.color, fontSize: 8, fontWeight: 600 }}>{c.label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WsLogEntry — single event log line (terminal style)
   ═══════════════════════════════════════════════════════════ */

function WsLogEntry({ event }: { event: BridgeWsEvent }) {
  const levelColor = WS_LEVEL_COLORS[event.level] || '#8B949E';
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group">
      <div className="flex items-start gap-1.5 py-0.5 px-1 rounded hover:bg-white/[0.02] cursor-pointer"
        onClick={() => event.data && setExpanded(!expanded)}>
        {/* Timestamp */}
        <span style={{ color: '#484F58', fontSize: 9, minWidth: 68, fontFamily: 'monospace', flexShrink: 0 }}>
          {event.timestamp}
        </span>
        {/* Level badge */}
        <span className="px-1 py-px rounded" style={{
          background: `${levelColor}15`,
          color: levelColor,
          fontSize: 8,
          fontWeight: 600,
          minWidth: 32,
          textAlign: 'center',
          textTransform: 'uppercase',
          fontFamily: 'monospace',
        }}>
          {event.level.slice(0, 4)}
        </span>
        {/* Source */}
        <span style={{ color: '#8B5CF6', fontSize: 9, minWidth: 38, fontFamily: 'monospace', flexShrink: 0 }}>
          [{event.source}]
        </span>
        {/* Message */}
        <span style={{ color: '#C9D1D9', fontSize: 9, fontFamily: 'monospace', lineHeight: 1.4, wordBreak: 'break-word' }}>
          {event.message}
        </span>
        {/* Tx hash indicator */}
        {event.txHash && (
          <span style={{ color: '#484F58', fontSize: 8, fontFamily: 'monospace', flexShrink: 0 }}>
            tx:{event.txHash.slice(0, 6)}
          </span>
        )}
        {/* Expandable indicator */}
        {event.data && (
          <span style={{ color: '#484F58', fontSize: 8, flexShrink: 0 }}>
            {expanded ? '▾' : '▸'}
          </span>
        )}
      </div>
      {/* Expanded data */}
      {expanded && event.data && (
        <div className="pl-[72px] pb-1">
          <div className="rounded px-2 py-1" style={{ background: '#161B22' }}>
            {Object.entries(event.data).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span style={{ color: '#7EE787', fontSize: 8, fontFamily: 'monospace' }}>{k}:</span>
                <span style={{ color: '#C9D1D9', fontSize: 8, fontFamily: 'monospace' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}