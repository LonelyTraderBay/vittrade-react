import React from 'react';
import { Lock, Shield, Info } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../utils/golden';

export function VerifiedChallengesPage() {
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Verified Challenges" subtitle="Đã xác minh · Open Arena" back />

      <PageContent gap="default" padding="relaxed">
        <div className="flex flex-col items-center justify-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Lock size={36} color="#8B5CF6" />
          </div>

          <p style={{ color: c.text1, fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
            Verified Challenges
          </p>
          <p style={{ color: c.text2, fontSize: φ.sm, textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
            Sẽ mở trong tương lai cho challenge xác thực cao hơn với cơ chế verify on-chain và prize pool lớn hơn.
          </p>

          <span
            className="px-4 py-2 rounded-xl mb-8"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: φ.sm, fontWeight: 700, border: '1px solid rgba(139,92,246,0.2)' }}
          >
            Coming Soon
          </span>

          <TrCard className="p-4 flex items-start gap-3 w-full">
            <Info size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
                Điều gì sẽ khác?
              </p>
              <ul className="flex flex-col gap-1.5">
                {[
                  'Challenge được verify bởi hệ thống Oracle',
                  'Prize pool lớn hơn với cơ chế escrow',
                  'Leaderboard riêng cho verified players',
                  'Creator badges và trust score nâng cao',
                ].map((item, i) => (
                  <li key={i} style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
                    <Shield size={9} color="#8B5CF6" className="inline mr-1" style={{ verticalAlign: 'middle' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </TrCard>
        </div>
      </PageContent>
    </PageLayout>
  );
}