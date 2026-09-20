/**
 * P2PAMLScreeningPage — /p2p/compliance/aml
 * CRITICAL: AML screening status & compliance check
 */

import React, { useEffect, useRef } from 'react';
import { Shield, CheckCircle, Clock, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';

const AML_STATUS = {
  overall: 'clear',
  lastCheck: '2026-03-05 10:00',
  nextCheck: '2026-03-12 10:00',
  checks: [
    { name: 'Sanctions List', status: 'pass', detail: 'No match found' },
    { name: 'PEP Check', status: 'pass', detail: 'Not a PEP' },
    { name: 'Adverse Media', status: 'pass', detail: 'No negative news' },
    { name: 'Transaction Pattern', status: 'review', detail: 'Under periodic review' },
  ],
};

export function P2PAMLScreeningPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pass': return { color: '#10B981', icon: CheckCircle, label: 'Pass' };
      case 'review': return { color: '#F59E0B', icon: Clock, label: 'Review' };
      case 'fail': return { color: '#EF4444', icon: AlertTriangle, label: 'Fail' };
      default: return { color: c.text3, icon: FileText, label: 'N/A' };
    }
  };

  return (
    <PageLayout>
      <Header title="AML Screening" subtitle="Tuân thủ · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Shield size={24} color="#FFFFFF" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                AML Status: Clear
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>
                Tài khoản đã qua kiểm tra AML
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Kiểm tra gần nhất</p>
              <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{AML_STATUS.lastCheck}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Kiểm tra tiếp theo</p>
              <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{AML_STATUS.nextCheck}</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Chi tiết kiểm tra</h3>
        <TrCard rounded="lg" className="overflow-hidden">
          {AML_STATUS.checks.map((check, i) => {
            const config = getStatusConfig(check.status);
            const StatusIcon = config.icon;
            const isLast = i === AML_STATUS.checks.length - 1;

            return (
              <div key={i} className="p-4" style={{ borderBottom: isLast ? 'none' : `1px solid ${c.borderSolid}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(config.color, 12) }}>
                    <StatusIcon size={18} color={config.color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{check.name}</h4>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: hexToRgba(config.color, 15), color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                    <p style={{ color: c.text3, fontSize: 11 }}>{check.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </TrCard>
      </div>

      <div className="px-5">
        <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <FileText size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Về AML Screening</p>
            <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
              Chúng tôi thực hiện kiểm tra AML định kỳ để tuân thủ quy định chống rửa tiền. Nếu có vấn đề, team Compliance sẽ liên hệ.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}