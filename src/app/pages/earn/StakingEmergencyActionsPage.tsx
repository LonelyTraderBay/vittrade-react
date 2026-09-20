import React, { useState } from 'react';
import { AlertTriangle, Pause, ArrowDownCircle, RefreshCw, Shield } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { toast } from 'sonner';

export function StakingEmergencyActionsPage() {
  const c = useThemeColors();
  const [showPauseSheet, setShowPauseSheet] = useState(false);
  const [showWithdrawSheet, setShowWithdrawSheet] = useState(false);

  return (
    <PageLayout>
      <Header title="Emergency Actions" back />

      <BottomSheetV2 open={showPauseSheet} onClose={() => setShowPauseSheet(false)} title="Pause All Staking">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
              This will pause all new staking transactions. Existing stakes will continue earning rewards. You can resume anytime.
            </p>
          </div>
          <button
            onClick={() => {
              toast.success('All staking paused');
              setShowPauseSheet(false);
            }}
            className="w-full py-3 rounded-[14px] text-sm font-semibold"
            style={{ background: '#F59E0B', color: '#FFF' }}>
            Confirm Pause
          </button>
        </div>
      </BottomSheetV2>

      <BottomSheetV2 open={showWithdrawSheet} onClose={() => setShowWithdrawSheet(false)} title="Emergency Withdrawal">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
              ⚠️ <strong>Warning:</strong> Emergency withdrawal may incur penalties and take 2-7 days depending on network.
            </p>
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
              • Fixed-term stakes: 5% early withdrawal penalty<br />
              • Flexible stakes: Standard 2-day unstaking period<br />
              • Rewards earned to date will be included
            </p>
          </div>
          <button
            onClick={() => {
              toast.success('Withdrawal initiated');
              setShowWithdrawSheet(false);
            }}
            className="w-full py-3 rounded-[14px] text-sm font-semibold"
            style={{ background: '#EF4444', color: '#FFF' }}>
            Confirm Emergency Withdrawal
          </button>
        </div>
      </BottomSheetV2>

      <PageContent>
        {/* Warning Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
          <div className="flex gap-3">
            <AlertTriangle size={20} color="#EF4444" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Emergency Actions Only
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Use these actions only in critical situations (smart contract exploits, validator failures, extreme market events). Normal unstaking is available anytime via Dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Actions */}
        <PageSection label="Available Actions">
          <div className="flex flex-col gap-3">
            <TrCard hover className="p-4" onClick={() => setShowPauseSheet(true)}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <Pause size={24} color="#F59E0B" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    Pause All Staking
                  </p>
                  <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5, marginBottom: 6 }}>
                    Temporarily halt all new staking transactions. Existing stakes continue earning.
                  </p>
                  <p style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>
                    ⚠️ Moderate Impact • Reversible
                  </p>
                </div>
              </div>
            </TrCard>

            <TrCard hover className="p-4" onClick={() => setShowWithdrawSheet(true)}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(239,68,68,0.12)' }}>
                  <ArrowDownCircle size={24} color="#EF4444" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    Emergency Withdrawal
                  </p>
                  <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5, marginBottom: 6 }}>
                    Immediately unstake all positions. May incur penalties for fixed-term stakes.
                  </p>
                  <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}>
                    🚨 High Impact • Penalties Apply
                  </p>
                </div>
              </div>
            </TrCard>

            <TrCard hover className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(59,130,246,0.12)' }}>
                  <RefreshCw size={24} color="#3B82F6" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    Auto-Rebalance Validators
                  </p>
                  <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5, marginBottom: 6 }}>
                    Automatically move stakes from underperforming validators to healthy ones.
                  </p>
                  <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                    ℹ️ Low Impact • Recommended
                  </p>
                </div>
              </div>
            </TrCard>
          </div>
        </PageSection>

        {/* When to Use */}
        <PageSection label="When to Use Emergency Actions">
          <TrCard className="p-4">
            <div className="space-y-3">
              {[
                { title: 'Smart Contract Exploit', severity: 'critical', desc: 'Immediate withdrawal if contract vulnerability discovered' },
                { title: 'Validator Mass Failure', severity: 'high', desc: 'Multiple validators going offline simultaneously' },
                { title: 'Extreme Market Event', severity: 'high', desc: 'Black swan event with >50% asset price drop' },
                { title: 'Regulatory Action', severity: 'medium', desc: 'Government ban or restriction on staking' },
              ].map((item, idx) => (
                <div key={idx} className="pb-3 border-b last:border-b-0" style={{ borderColor: c.borderSolid }}>
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle
                      size={16}
                      color={
                        item.severity === 'critical' ? '#EF4444' :
                        item.severity === 'high' ? '#F59E0B' : '#3B82F6'
                      }
                      className="shrink-0 mt-0.5"
                    />
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                      {item.title}
                    </p>
                  </div>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Current Status */}
        <PageSection label="Current Status">
          <TrCard className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)' }}>
                <Shield size={20} color="#10B981" className="mb-2" />
                <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                  All Systems Normal
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>No emergency action needed</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Last Emergency</p>
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                  Never
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>No history</p>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Footer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Emergency actions are monitored and logged. Abuse may result in account restrictions. For non-emergency unstaking, use the Dashboard. Contact support before taking emergency actions.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
