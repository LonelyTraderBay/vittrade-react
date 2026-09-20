import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, DollarSign, TrendingUp, FileText, Clock } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';

interface InsurancePlan {
  id: string;
  name: string;
  coverage: number;
  premium: number;
  maxClaim: number;
  cooldown: number;
  features: string[];
}

interface Position {
  id: string;
  product: string;
  asset: string;
  amount: number;
  usdValue: number;
  insured: boolean;
  insurancePlan?: string;
}

const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: 'basic',
    name: 'Basic Coverage',
    coverage: 25,
    premium: 0.5,
    maxClaim: 5000,
    cooldown: 7,
    features: ['Bồi thường 25% thiệt hại', 'Claim trong 7 ngày', 'Tối đa $5,000/claim'],
  },
  {
    id: 'standard',
    name: 'Standard Coverage',
    coverage: 50,
    premium: 1.0,
    maxClaim: 25000,
    cooldown: 3,
    features: ['Bồi thường 50% thiệt hại', 'Claim trong 3 ngày', 'Tối đa $25,000/claim', 'Priority support'],
  },
  {
    id: 'premium',
    name: 'Premium Coverage',
    coverage: 75,
    premium: 1.5,
    maxClaim: 100000,
    cooldown: 1,
    features: ['Bồi thường 75% thiệt hại', 'Claim trong 24 giờ', 'Tối đa $100,000/claim', 'Priority support', 'Legal assistance'],
  },
];

const POSITIONS: Position[] = [
  { id: 'p1', product: 'BTC Fixed 90D', asset: 'BTC', amount: 0.05, usdValue: 3377, insured: true, insurancePlan: 'standard' },
  { id: 'p2', product: 'USDT Flexible', asset: 'USDT', amount: 2500, usdValue: 2500, insured: false },
  { id: 'p3', product: 'ETH Fixed 60D', asset: 'ETH', amount: 1.5, usdValue: 4200, insured: true, insurancePlan: 'premium' },
  { id: 'p4', product: 'SOL Fixed 30D', asset: 'SOL', amount: 50, usdValue: 6500, insured: false },
];

const CLAIM_HISTORY = [
  {
    id: 'c1',
    date: '15/02/2026',
    position: 'ETH Fixed 60D',
    reason: 'Validator downtime (48h)',
    loss: 125.50,
    coverage: 50,
    payout: 62.75,
    status: 'approved' as const,
  },
  {
    id: 'c2',
    date: '03/01/2026',
    position: 'BTC Fixed 90D',
    reason: 'Slashing penalty (0.01%)',
    loss: 3.38,
    coverage: 50,
    payout: 1.69,
    status: 'approved' as const,
  },
];

export function StakingInsurancePage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'overview' | 'plans' | 'positions' | 'claims'>('overview');
  const [selectedPlan, setSelectedPlan] = useState<InsurancePlan | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);

  const insuredPositions = POSITIONS.filter(p => p.insured).length;
  const totalInsuredValue = POSITIONS.filter(p => p.insured).reduce((sum, p) => sum + p.usdValue, 0);
  const totalPremium = POSITIONS.filter(p => p.insured).reduce((sum, p) => {
    const plan = INSURANCE_PLANS.find(pl => pl.id === p.insurancePlan);
    return sum + (plan ? (p.usdValue * plan.premium / 100) : 0);
  }, 0);

  return (
    <PageLayout>
      <Header title="Slashing Insurance" back />

      {/* Plan Detail Bottom Sheet */}
      <BottomSheetV2
        open={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title={selectedPlan?.name || ''}>
        {selectedPlan && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <BottomSheetRow label="Coverage" value={`${selectedPlan.coverage}%`} valueColor="#10B981" />
              <BottomSheetRow label="Premium" value={`${selectedPlan.premium}% APY`} />
              <BottomSheetRow label="Max Claim" value={fmtUsd(selectedPlan.maxClaim)} highlight />
              <BottomSheetRow label="Claim Processing" value={`${selectedPlan.cooldown} ngày`} />
            </div>

            <div>
              <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Tính năng</p>
              <div className="flex flex-col gap-2">
                {selectedPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 size={16} color="#10B981" className="shrink-0 mt-0.5" />
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                <strong>Ví dụ:</strong> Nếu bạn stake $10,000 với plan này, phí bảo hiểm sẽ là ${(10000 * selectedPlan.premium / 100).toFixed(0)}/năm ({selectedPlan.premium}% APY). Nếu bị slashing mất $1,000, bạn sẽ được bồi thường ${(1000 * selectedPlan.coverage / 100).toFixed(0)}.
              </p>
            </div>

            <button
              className="w-full py-3.5 rounded-xl font-semibold"
              style={{ background: c.primary, color: '#FFF' }}>
              Chọn plan này
            </button>
          </div>
        )}
      </BottomSheetV2>

      {/* Claim Form Bottom Sheet */}
      <BottomSheetV2
        open={showClaimForm}
        onClose={() => setShowClaimForm(false)}
        title="File Claim">
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 8 }}>
              Chọn vị thế
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 14,
              }}>
              {POSITIONS.filter(p => p.insured).map(pos => (
                <option key={pos.id} value={pos.id}>{pos.product}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 8 }}>
              Lý do claim
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 14,
              }}>
              <option>Slashing penalty</option>
              <option>Validator downtime</option>
              <option>Smart contract bug</option>
              <option>Khác</option>
            </select>
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 8 }}>
              Số lượng bị mất (USD)
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 15,
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 8 }}>
              Mô tả chi tiết
            </label>
            <textarea
              rows={4}
              placeholder="Mô tả sự cố và cung cấp bằng chứng..."
              className="w-full px-4 py-3 rounded-xl outline-none resize-none"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 13,
              }}
            />
          </div>

          <button
            className="w-full py-3.5 rounded-xl font-semibold"
            style={{ background: c.primary, color: '#FFF' }}>
            Submit Claim
          </button>

          <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              💡 Claim sẽ được xem xét trong vòng {selectedPlan?.cooldown || 3} ngày. Bạn cần cung cấp bằng chứng (transaction hash, screenshot, audit report) để hỗ trợ claim.
            </p>
          </div>
        </div>
      </BottomSheetV2>

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
          <div className="flex gap-3">
            <Shield size={20} color="#10B981" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Bảo vệ Slashing
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Insurance bồi thường 25-75% thiệt hại nếu validator bị slashing. Phí bảo hiểm chỉ 0.5-1.5% APY.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'plans', label: 'Plans' },
            { id: 'positions', label: 'Vị thế' },
            { id: 'claims', label: 'Claims' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'overview' && (
          <>
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>
                    Giá trị được bảo hiểm
                  </p>
                  <p style={{ color: c.text1, fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtUsd(totalInsuredValue)}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)' }}>
                  <Shield size={28} color="#10B981" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Vị thế có BH</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                    {insuredPositions}/{POSITIONS.length}
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Phí/năm</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtUsd(totalPremium)}
                  </p>
                </div>
              </div>
            </TrCard>

            <PageSection label="Lợi ích Bảo hiểm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shield, label: 'Bảo vệ vốn', desc: 'Bồi thường 25-75%', color: '#10B981' },
                  { icon: Clock, label: 'Xử lý nhanh', desc: 'Claim trong 1-7 ngày', color: '#3B82F6' },
                  { icon: DollarSign, label: 'Phí thấp', desc: 'Chỉ 0.5-1.5% APY', color: '#F59E0B' },
                  { icon: CheckCircle2, label: 'Minh bạch', desc: 'Smart contract audit', color: '#8B5CF6' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <TrCard key={idx} className="p-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                        style={{ background: `${item.color}22`, border: `1.5px solid ${item.color}44` }}>
                        <Icon size={20} color={item.color} />
                      </div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                        {item.label}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {item.desc}
                      </p>
                    </TrCard>
                  );
                })}
              </div>
            </PageSection>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex gap-2">
                <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    ⚠️ Lưu ý quan trọng
                  </p>
                  <ul style={{ color: c.text2, fontSize: 11, lineHeight: 1.6, paddingLeft: 16 }}>
                    <li>Bảo hiểm KHÔNG cover mất giá asset (market risk)</li>
                    <li>Chỉ cover slashing penalty, downtime loss, smart contract bug</li>
                    <li>Phí bảo hiểm được trừ trực tiếp từ APY nhận được</li>
                    <li>Claim phải có bằng chứng rõ ràng</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'plans' && (
          <PageSection label="Chọn Plan Bảo hiểm">
            <div className="flex flex-col gap-3">
              {INSURANCE_PLANS.map(plan => (
                <TrCard key={plan.id} hover className="p-4" onClick={() => setSelectedPlan(plan)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                        {plan.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                          {plan.coverage}% Coverage
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                          style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                          {plan.cooldown}d Claim
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p style={{ color: '#F59E0B', fontSize: 18, fontWeight: 700 }}>
                        {plan.premium}%
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>Premium</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Max Claim</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {fmtUsd(plan.maxClaim)}
                      </p>
                    </div>
                    <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Processing</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {plan.cooldown} ngày
                      </p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {tab === 'positions' && (
          <PageSection label="Vị thế Staking">
            <div className="flex flex-col gap-3">
              {POSITIONS.map(position => {
                const plan = position.insurancePlan ? INSURANCE_PLANS.find(p => p.id === position.insurancePlan) : null;
                return (
                  <TrCard key={position.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                          {position.product}
                        </p>
                        <p style={{ color: c.text3, fontSize: 12 }}>
                          {position.amount} {position.asset} • {fmtUsd(position.usdValue)}
                        </p>
                      </div>
                      {position.insured ? (
                        <div className="flex items-center gap-2">
                          <Shield size={18} color="#10B981" />
                          <span className="px-2 py-1 rounded-lg text-xs font-bold"
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                            Insured
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-xs font-bold"
                          style={{ background: c.surface2, color: c.text3 }}>
                          No Insurance
                        </span>
                      )}
                    </div>

                    {position.insured && plan && (
                      <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                        <div className="flex justify-between mb-2">
                          <span style={{ color: c.text3, fontSize: 11 }}>Plan:</span>
                          <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{plan.name}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span style={{ color: c.text3, fontSize: 11 }}>Coverage:</span>
                          <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>{plan.coverage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: c.text3, fontSize: 11 }}>Premium/year:</span>
                          <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                            {fmtUsd(position.usdValue * plan.premium / 100)}
                          </span>
                        </div>
                      </div>
                    )}

                    {!position.insured && (
                      <button
                        className="w-full py-2 rounded-xl text-xs font-semibold"
                        style={{ background: c.primary, color: '#FFF' }}>
                        Thêm bảo hiểm
                      </button>
                    )}
                  </TrCard>
                );
              })}
            </div>
          </PageSection>
        )}

        {tab === 'claims' && (
          <>
            <div className="flex items-center justify-between">
              <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                Claim History
              </p>
              <button
                onClick={() => setShowClaimForm(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background: c.primary, color: '#FFF' }}>
                File Claim
              </button>
            </div>

            <PageSection label="">
              {CLAIM_HISTORY.length === 0 ? (
                <TrCard className="p-8">
                  <div className="flex flex-col items-center gap-3">
                    <FileText size={48} color={c.text3} />
                    <p style={{ color: c.text3, fontSize: 14 }}>
                      Chưa có claim nào
                    </p>
                  </div>
                </TrCard>
              ) : (
                <div className="flex flex-col gap-3">
                  {CLAIM_HISTORY.map(claim => (
                    <TrCard key={claim.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                            {claim.position}
                          </p>
                          <p style={{ color: c.text3, fontSize: 11 }}>
                            {claim.date} • {claim.reason}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-lg text-xs font-bold"
                          style={{
                            background: claim.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                            color: claim.status === 'approved' ? '#10B981' : '#F59E0B',
                          }}>
                          {claim.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Loss</p>
                          <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                            -${claim.loss.toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Coverage</p>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                            {claim.coverage}%
                          </p>
                        </div>
                        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Payout</p>
                          <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                            +${claim.payout.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </TrCard>
                  ))}
                </div>
              )}
            </PageSection>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
