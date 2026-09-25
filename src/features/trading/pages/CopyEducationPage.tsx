import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Eye } from 'lucide-react';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TabBar } from '@/shared/ui/TabBar';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { CopyEducationHowItWorksTab } from '../components/copy-education/CopyEducationHowItWorksTab';
import { CopyEducationScenarioTab } from '../components/copy-education/CopyEducationScenarioTab';
import { CopyEducationFeesTab } from '../components/copy-education/CopyEducationFeesTab';
import { CopyEducationMistakesTab } from '../components/copy-education/CopyEducationMistakesTab';
import { CopyEducationRegulatoryTab } from '../components/copy-education/CopyEducationRegulatoryTab';

type TabType = 'how-it-works' | 'scenarios' | 'fees' | 'mistakes' | 'regulatory';
export function CopyEducationPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  const [activeTab, setActiveTab] = useState<TabType>('how-it-works');

  return (
    <PageLayout>
      <Header title="Hướng dẫn Copy Trading" back />

      <PageContent gap="relaxed">
        {/* Intro Banner */}
        <div
          className="rounded-2xl p-4 flex gap-3"
          style={{ background: c.primaryAlpha08, border: `1px solid ${c.primary}` }}
        >
          <BookOpen size={24} color={c.primary} className="shrink-0" />
          <div>
            <h3 style={{ color: c.primary, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              Học trước khi đầu tư
            </h3>
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
              Trang này giúp bạn hiểu rõ cơ chế, rủi ro và chi phí của Copy Trading. Không có gì
              thay thế được hiểu biết đầy đủ.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'how-it-works', label: 'Cơ chế' },
            { id: 'scenarios', label: 'Kịch bản' },
            { id: 'fees', label: 'Phí & Chi phí' },
            { id: 'mistakes', label: 'Sai lầm' },
            { id: 'regulatory', label: 'Quy định' },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* Tab Content */}
        {activeTab === 'how-it-works' && <CopyEducationHowItWorksTab />}
        {activeTab === 'scenarios' && <CopyEducationScenarioTab />}
        {activeTab === 'fees' && <CopyEducationFeesTab />}
        {activeTab === 'mistakes' && <CopyEducationMistakesTab />}
        {activeTab === 'regulatory' && <CopyEducationRegulatoryTab />}
        {/* CTA */}
        <button
          onClick={() => navigate(`${prefix}/trade/copy-trading`)}
          className="w-full rounded-xl flex items-center justify-center gap-2"
          style={{
            background: c.primary,
            color: '#fff',
            height: 48,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <Eye size={16} />
          <span>Xem danh sách providers</span>
        </button>
      </PageContent>
    </PageLayout>
  );
}
