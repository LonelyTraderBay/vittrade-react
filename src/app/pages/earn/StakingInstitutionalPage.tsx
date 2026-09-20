import React, { useState } from 'react';
import { Building2, Shield, Users, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { toast } from 'sonner';

interface BatchOperation {
  id: string;
  type: 'stake' | 'unstake' | 'claim';
  operations: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'executed';
  created: string;
  approvals: number;
  requiredApprovals: number;
}

const PENDING_BATCHES: BatchOperation[] = [
  { id: 'b1', type: 'stake', operations: 12, totalAmount: 500, status: 'pending', created: '2026-03-07 14:30', approvals: 1, requiredApprovals: 3 },
  { id: 'b2', type: 'claim', operations: 8, totalAmount: 24.5, status: 'approved', created: '2026-03-07 13:15', approvals: 3, requiredApprovals: 3 },
];

const EXECUTED_BATCHES: BatchOperation[] = [
  { id: 'e1', type: 'stake', operations: 15, totalAmount: 750, status: 'executed', created: '2026-03-06 16:20', approvals: 3, requiredApprovals: 3 },
  { id: 'e2', type: 'unstake', operations: 5, totalAmount: 150, status: 'executed', created: '2026-03-05 11:45', approvals: 3, requiredApprovals: 3 },
];

const SIGNERS = [
  { name: 'Alice Chen', role: 'CFO', address: '0x1234...5678', status: 'approved' },
  { name: 'Bob Martinez', role: 'CTO', address: '0xabcd...ef01', status: 'approved' },
  { name: 'Carol Wu', role: 'COO', address: '0x9876...5432', status: 'pending' },
];

export function StakingInstitutionalPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'pending' | 'executed'>('pending');
  const [showBatchSheet, setShowBatchSheet] = useState(false);

  const getStatusColor = (status: BatchOperation['status']) => {
    if (status === 'pending') return { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' };
    if (status === 'approved') return { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' };
    return { bg: 'rgba(16,185,129,0.12)', color: '#10B981' };
  };

  return (
    <PageLayout>
      <Header title="Institutional Dashboard" back />

      <BottomSheetV2 open={showBatchSheet} onClose={() => setShowBatchSheet(false)} title="Create Batch Operation">
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Operation Type</label>
            <select className="w-full p-3 rounded-xl text-sm" style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}>
              <option>Batch Stake</option>
              <option>Batch Unstake</option>
              <option>Batch Claim Rewards</option>
              <option>Batch Validator Change</option>
            </select>
          </div>
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Upload CSV File</label>
            <div className="border-2 border-dashed rounded-xl p-4 text-center" style={{ borderColor: c.borderSolid }}>
              <FileText size={32} color={c.text3} className="mx-auto mb-2" />
              <p style={{ color: c.text2, fontSize: 12 }}>Drop CSV or click to upload</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Format: address, amount, validator</p>
            </div>
          </div>
          <button
            onClick={() => {
              toast.success('Batch operation created! Awaiting approvals.');
              setShowBatchSheet(false);
            }}
            className="w-full py-3 rounded-[14px] text-sm font-semibold"
            style={{ background: c.primary, color: '#FFF' }}>
            Submit for Approval
          </button>
        </div>
      </BottomSheetV2>

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)' }}>
          <div className="flex gap-3">
            <Building2 size={20} color="#8B5CF6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Enterprise Staking Platform
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Batch operations, multi-signature approvals, and institutional-grade custody for large-scale staking.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)' }}>
              <Building2 size={20} color="#8B5CF6" className="mx-auto mb-2" />
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>$25.6M</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Total Staked</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <Users size={20} color={c.text3} className="mx-auto mb-2" />
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>3/5</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Multi-Sig</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <Shield size={20} color="#10B981" className="mx-auto mb-2" />
              <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>SOC 2</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Certified</p>
            </div>
          </div>
        </TrCard>

        {/* Quick Actions */}
        <button
          onClick={() => setShowBatchSheet(true)}
          className="w-full py-3 rounded-[14px] text-sm font-semibold"
          style={{ background: c.primary, color: '#FFF' }}>
          Create Batch Operation
        </button>

        {/* Tabs */}
        <TabBar
          tabs={[
            { id: 'pending', label: 'Pending' },
            { id: 'executed', label: 'Executed' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {/* Batch Operations */}
        <PageSection label={tab === 'pending' ? 'Pending Approvals' : 'Executed Batches'}>
          <div className="flex flex-col gap-2">
            {(tab === 'pending' ? PENDING_BATCHES : EXECUTED_BATCHES).map(batch => {
              const statusStyle = getStatusColor(batch.status);
              return (
                <TrCard key={batch.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                        Batch {batch.type.charAt(0).toUpperCase() + batch.type.slice(1)}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {batch.operations} operations • {batch.totalAmount} ETH
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-md text-xs font-bold"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}>
                      {batch.status === 'pending' ? 'Pending' : batch.status === 'approved' ? 'Approved' : 'Executed'}
                    </span>
                  </div>

                  {/* Approval Progress */}
                  {batch.status !== 'executed' && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p style={{ color: c.text3, fontSize: 11 }}>Approvals</p>
                        <p style={{ color: c.text2, fontSize: 11, fontWeight: 700 }}>
                          {batch.approvals}/{batch.requiredApprovals}
                        </p>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                        <div
                          className="h-full"
                          style={{
                            background: batch.approvals === batch.requiredApprovals ? '#10B981' : '#F59E0B',
                            width: `${(batch.approvals / batch.requiredApprovals) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: c.borderSolid }}>
                    <div className="flex items-center gap-1">
                      <Clock size={12} color={c.text3} />
                      <p style={{ color: c.text3, fontSize: 10 }}>{batch.created}</p>
                    </div>
                    {batch.status === 'pending' && (
                      <button
                        onClick={() => toast.success('Approval submitted!')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: c.primary, color: '#FFF' }}>
                        Approve
                      </button>
                    )}
                    {batch.status === 'approved' && (
                      <button
                        onClick={() => toast.success('Batch executed!')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: '#10B981', color: '#FFF' }}>
                        Execute
                      </button>
                    )}
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Multi-Sig Signers */}
        <PageSection label="Authorized Signers">
          <TrCard className="p-4">
            <div className="space-y-3">
              {SIGNERS.map((signer, idx) => (
                <div key={idx} className="flex items-center justify-between pb-3 border-b last:border-b-0" style={{ borderColor: c.borderSolid }}>
                  <div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      {signer.name}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {signer.role} • {signer.address}
                    </p>
                  </div>
                  {signer.status === 'approved' ? (
                    <CheckCircle2 size={20} color="#10B981" />
                  ) : (
                    <Clock size={20} color="#F59E0B" />
                  )}
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Enterprise Features */}
        <PageSection label="Enterprise Features">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield, title: 'Cold Storage', desc: '95% of funds in cold wallets' },
              { icon: FileText, title: 'Audit Trail', desc: 'Complete transaction logs' },
              { icon: Users, title: 'RBAC', desc: 'Role-based access control' },
              { icon: Building2, title: 'Custody', desc: 'Fireblocks integration' },
            ].map((feature, idx) => (
              <TrCard key={idx} className="p-3">
                <feature.icon size={20} color={c.text3} className="mb-2" />
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                  {feature.title}
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>{feature.desc}</p>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Compliance Note */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Shield size={18} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Institutional Compliance
              </p>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                SOC 2 Type II certified. MiFID II compliant. Multi-signature custody with Fireblocks. 24/7 institutional support. Dedicated account manager for AUM &gt; $10M.
              </p>
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
