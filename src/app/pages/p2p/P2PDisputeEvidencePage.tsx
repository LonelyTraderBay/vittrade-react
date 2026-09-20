/**
 * P2PDisputeEvidencePage — /p2p/disputes/:id/evidence
 * HIGH: Upload & manage dispute evidence
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Upload, FileText, Image, CheckCircle, X, ChevronLeft } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { toast } from 'sonner';

const EVIDENCE_TYPES = [
  { id: 'payment', label: 'Payment Receipt', icon: FileText, uploaded: true },
  { id: 'chat', label: 'Chat Screenshot', icon: Image, uploaded: true },
  { id: 'transaction', label: 'Transaction Proof', icon: FileText, uploaded: false },
];

export function P2PDisputeEvidencePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const [evidence, setEvidence] = useState(EVIDENCE_TYPES);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleUpload = (docId: string) => {
    setEvidence(prev => prev.map(e => e.id === docId ? { ...e, uploaded: true } : e));
    hapticSuccess();
    toast.success('Đã upload evidence');
  };

  return (
    <PageLayout>
      <Header title="Bằng chứng tranh chấp" subtitle="Tranh chấp · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
          <p style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Dispute #{id}</p>
          <p style={{ color: c.text2, fontSize: φ.xs }}>Upload tài liệu chứng minh</p>
        </TrCard>
      </div>
      <div className="px-5 flex flex-col gap-3">
        {evidence.map(ev => {
          const EvIcon = ev.icon;
          return (
            <TrCard key={ev.id} rounded="md" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: ev.uploaded ? hexToRgba('#10B981', 12) : hexToRgba('#3B82F6', 12) }}>
                  {ev.uploaded ? <CheckCircle size={18} color="#10B981" /> : <EvIcon size={18} color="#3B82F6" />}
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{ev.label}</p>
                  {ev.uploaded && <p style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>✓ Uploaded</p>}
                </div>
                {!ev.uploaded && (
                  <button onClick={() => handleUpload(ev.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: hexToRgba('#3B82F6', 12), color: '#3B82F6' }}>
                    Upload
                  </button>
                )}
              </div>
            </TrCard>
          );
        })}
      </div>
      <div className="px-5 mt-6">
        <CTAButton onClick={() => { toast.success('Đã gửi bằng chứng'); navigate(`${prefix}/p2p/dispute/detail/${id}`); }}>
          Gửi bằng chứng
        </CTAButton>
      </div>
    </PageLayout>
  );
}