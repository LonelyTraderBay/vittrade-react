/**
 * ══════════════════════════════════════════════════════════
 *  P2PComplianceOverviewPage — /p2p/compliance
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Compliance dashboard overview
 */

import React from 'react';
import { useNavigate } from 'react-router';
import { Shield, FileText, DollarSign, TrendingUp, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';

const COMPLIANCE_ITEMS = [
  { id: 'kyc', label: 'KYC Status', value: 'Tier 1 Basic', status: 'active', icon: Shield, path: '/p2p/kyc/status' },
  { id: 'aml', label: 'AML Screening', value: 'Low Risk', status: 'active', icon: FileText, path: '/p2p/compliance/aml' },
  { id: 'limits', label: 'Transaction Limits', value: '50M/ngày', status: 'active', icon: TrendingUp, path: '/p2p/limits' },
  { id: 'sof', label: 'Source of Funds', value: 'Đã khai báo', status: 'active', icon: DollarSign, path: '/p2p/compliance/source-of-funds' },
];

export function P2PComplianceOverviewPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();

  return (
    <PageLayout>
      <Header title="Compliance Overview" subtitle="Tuân thủ · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Shield size={24} color="#FFFFFF" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Compliance Active</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Tài khoản tuân thủ đầy đủ quy định</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Compliance Checklist</h3>
        <TrCard rounded="lg" className="overflow-hidden">
          {COMPLIANCE_ITEMS.map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <button key={item.id} onClick={() => { hapticSelection(); navigate(`${prefix}${item.path}`); }} className="w-full p-4 text-left flex items-center gap-3" style={{ borderBottom: idx === COMPLIANCE_ITEMS.length - 1 ? 'none' : `1px solid ${c.borderSolid}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba('#10B981', 12) }}>
                  <ItemIcon size={18} color="#10B981" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>{item.label}</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>{item.value}</p>
                </div>
                <ChevronRight size={18} color={c.text3} />
              </button>
            );
          })}
        </TrCard>
      </div>
    </PageLayout>
  );
}