/**
 * ══════════════════════════════════════════════════════════
 *  P2PRiskAssessmentPage — /p2p/compliance/risk
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: User risk assessment dashboard
 */

import React from 'react';
import { Shield, TrendingDown, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';

const RISK_PROFILE = {
  overall: 'low',
  score: 15,
  factors: [
    { id: 'kyc', label: 'KYC Level', value: 'Tier 1', risk: 'low', score: 5 },
    { id: 'history', label: 'Transaction History', value: '156 đơn, 97.2% HT', risk: 'low', score: 3 },
    { id: 'aml', label: 'AML Screening', value: 'Passed all checks', risk: 'low', score: 2 },
    { id: 'disputes', label: 'Disputes', value: '1 vụ/156 đơn', risk: 'low', score: 3 },
    { id: 'velocity', label: 'Transaction Velocity', value: 'Normal', risk: 'low', score: 2 },
  ],
};

export function P2PRiskAssessmentPage() {
  const c = useThemeColors();
  const riskColor = RISK_PROFILE.overall === 'low' ? '#10B981' : RISK_PROFILE.overall === 'medium' ? '#F59E0B' : '#EF4444';

  return (
    <PageLayout>
      <Header title="Risk Assessment" subtitle="Rủi ro · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-5" style={{ background: `linear-gradient(135deg, ${riskColor} 0%, ${riskColor}CC 100%)` }}>
          <div className="text-center mb-4">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span style={{ color: '#FFFFFF', fontSize: 32, fontWeight: 700 }}>{RISK_PROFILE.score}</span>
            </div>
            <h2 style={{ color: '#FFFFFF', fontSize: φ.lg, fontWeight: 700, marginBottom: 4 }}>
              {RISK_PROFILE.overall === 'low' ? 'Low Risk' : RISK_PROFILE.overall === 'medium' ? 'Medium Risk' : 'High Risk'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Risk Score: {RISK_PROFILE.score}/100</p>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
            Risk score được tính dựa trên KYC level, transaction history, AML screening, và behavioral patterns.
          </p>
        </div>
      </div>

      <div className="px-5">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Risk Factors</h3>
        <TrCard rounded="lg" className="overflow-hidden">
          {RISK_PROFILE.factors.map((factor, idx) => (
            <div key={factor.id} className="p-4" style={{ borderBottom: idx === RISK_PROFILE.factors.length - 1 ? 'none' : `1px solid ${c.borderSolid}` }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba('#10B981', 12) }}>
                  <CheckCircle size={18} color="#10B981" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>{factor.label}</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>{factor.value}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 700 }}>+{factor.score}</p>
                </div>
              </div>
            </div>
          ))}
        </TrCard>
      </div>
    </PageLayout>
  );
}