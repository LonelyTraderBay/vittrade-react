import React, { useState } from 'react';
import { AlertOctagon, Pause, X, CheckCircle2, Shield } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const ACTIVE_BOTS = [
  { id: 'bot1', name: 'DCA Bot #1', pair: 'BTC/USDT', profit: 84.20, status: 'running' },
  { id: 'bot2', name: 'Grid Bot #1', pair: 'ETH/USDT', profit: 127.40, status: 'running' },
  { id: 'bot3', name: 'Momentum Bot #1', pair: 'SOL/USDT', profit: -12.30, status: 'running' },
];

export function BotEmergencyStopPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [closePositions, setClosePositions] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [stopping, setStopping] = useState(false);

  const handleEmergencyStop = async () => {
    setStopping(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`All ${ACTIVE_BOTS.length} bots stopped successfully`);
    navigate('/trade/bots');
  };

  return (
    <PageLayout variant="flush">
      <Header title="Emergency Stop" back />

      <PageContent grow>
        {/* Warning Banner */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)' }}>
          <div className="flex gap-4">
            <AlertOctagon size={32} color="#EF4444" className="shrink-0" />
            <div>
              <p style={{ color: '#EF4444', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                EMERGENCY STOP
              </p>
              <p style={{ color: c.text1, fontSize: 13, lineHeight: 1.6 }}>
                This will immediately stop all running bots and cancel pending orders. Use this only in emergency situations 
                (market crash, technical issues, unauthorized activity).
              </p>
            </div>
          </div>
        </div>

        {/* Affected Bots */}
        <PageSection label={`Bots to Stop (${ACTIVE_BOTS.length})`}>
          <div className="flex flex-col gap-2">
            {ACTIVE_BOTS.map(bot => (
              <TrCard key={bot.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{bot.name}</p>
                      <span className="px-2 py-1 rounded-md text-xs font-bold"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                        Running
                      </span>
                    </div>
                    <p style={{ color: c.text3, fontSize: 12 }}>{bot.pair}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: bot.profit >= 0 ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 700 }}>
                      {bot.profit >= 0 ? '+' : ''}{bot.profit.toFixed(2)} USDT
                    </p>
                  </div>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Reason Selection */}
        <PageSection label="Reason for Emergency Stop">
          <div className="flex flex-col gap-2">
            {[
              { id: 'crash', label: 'Market crash / extreme volatility', icon: '📉' },
              { id: 'bug', label: 'Technical bug / unexpected behavior', icon: '🐛' },
              { id: 'unauthorized', label: 'Unauthorized access detected', icon: '🚨' },
              { id: 'drawdown', label: 'Drawdown limit approaching', icon: '⚠️' },
              { id: 'other', label: 'Other reason', icon: '❓' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setReason(r.id)}
                className="w-full p-3 rounded-xl text-left flex items-center gap-3"
                style={{
                  background: reason === r.id ? 'rgba(239,68,68,0.08)' : c.surface,
                  border: `2px solid ${reason === r.id ? '#EF4444' : c.borderSolid}`,
                }}>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: reason === r.id ? '#EF4444' : c.borderSolid }}>
                  {reason === r.id && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444' }} />
                  )}
                </div>
                <span className="text-lg">{r.icon}</span>
                <p style={{ color: reason === r.id ? '#EF4444' : c.text1, fontSize: 13 }}>{r.label}</p>
              </button>
            ))}
          </div>
        </PageSection>

        {/* Close Positions Option */}
        <PageSection label="Additional Actions">
          <button 
            onClick={() => setClosePositions(!closePositions)}
            className="w-full p-4 rounded-xl text-left flex items-start gap-3"
            style={{ background: c.surface2 }}>
            <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-1"
              style={{ 
                borderColor: closePositions ? '#EF4444' : c.borderSolid, 
                background: closePositions ? '#EF4444' : 'transparent',
              }}>
              {closePositions && <CheckCircle2 size={16} color="#FFF" />}
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Also close all open positions (market sell)
              </p>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                ⚠️ WARNING: This will sell all holdings at market price. Only use if you need to exit immediately. 
                May incur slippage.
              </p>
            </div>
          </button>
        </PageSection>

        {/* Confirmation */}
        <PageSection label="Confirmation">
          <button 
            onClick={() => setConfirmed(!confirmed)}
            className="w-full p-4 rounded-xl text-left flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)' }}>
            <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-1"
              style={{ 
                borderColor: confirmed ? '#EF4444' : 'rgba(239,68,68,0.4)', 
                background: confirmed ? '#EF4444' : 'transparent',
              }}>
              {confirmed && <CheckCircle2 size={16} color="#FFF" />}
            </div>
            <div className="flex-1">
              <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                I understand this is a destructive action
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                All running bots will stop immediately. Pending orders will be cancelled. This action cannot be undone. 
                I take full responsibility for this decision.
              </p>
            </div>
          </button>
        </PageSection>

        {/* Support Notification */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <div className="flex gap-3">
            <Shield size={16} color={c.text3} className="shrink-0 mt-1" />
            <div>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Support Will Be Notified
              </p>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.6 }}>
                Our security team will be automatically notified of this emergency stop for review and assistance. 
                You'll receive a confirmation email within 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </PageContent>

      <StickyFooter>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-[14px] text-sm font-semibold"
            style={{ background: c.surface2, color: c.text1 }}>
            Cancel
          </button>
          <button
            onClick={handleEmergencyStop}
            disabled={!reason || !confirmed || stopping}
            className="flex-1 py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2"
            style={{
              background: (reason && confirmed && !stopping) ? '#EF4444' : c.surface2,
              color: (reason && confirmed && !stopping) ? '#FFF' : c.text3,
              cursor: (reason && confirmed && !stopping) ? 'pointer' : 'not-allowed',
            }}>
            {stopping ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Pause size={16} />
                Stop All Bots Now
              </>
            )}
          </button>
        </div>
      </StickyFooter>
    </PageLayout>
  );
}