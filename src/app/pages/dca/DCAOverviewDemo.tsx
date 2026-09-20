/**
 * DCA Overview Demo Page
 * 
 * Demo page showcasing DCAOverviewCard component with different scenarios
 * 
 * @module pages/dca
 */

import { DCAOverviewCard, DCAOverviewData } from '../../components/dca/DCAOverviewCard';
import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * Mock Data: Profitable Portfolio
 */
const profitableData: DCAOverviewData = {
  currentValue: 42_350_000,
  totalInvested: 35_500_000,
  profitLoss: 6_850_000,
  profitLossPercent: 19.3,
  activePlans: 3,
  pausedPlans: 0,
  errorPlans: 0,
  nextExecution: {
    relativeTime: '2 ngày',
    amount: 500_000,
  },
};

/**
 * Mock Data: Loss Portfolio
 */
const lossData: DCAOverviewData = {
  currentValue: 28_900_000,
  totalInvested: 35_500_000,
  profitLoss: -6_600_000,
  profitLossPercent: -18.6,
  activePlans: 2,
  pausedPlans: 1,
  errorPlans: 0,
  nextExecution: {
    relativeTime: '5 giờ',
    amount: 250_000,
  },
};

/**
 * Mock Data: With Errors
 */
const errorData: DCAOverviewData = {
  currentValue: 15_200_000,
  totalInvested: 18_000_000,
  profitLoss: -2_800_000,
  profitLossPercent: -15.6,
  activePlans: 1,
  pausedPlans: 1,
  errorPlans: 2,
  nextExecution: {
    relativeTime: '15/03/2026',
    amount: 1_000_000,
  },
};

/**
 * Mock Data: No Next Execution
 */
const noNextData: DCAOverviewData = {
  currentValue: 95_800_000,
  totalInvested: 80_000_000,
  profitLoss: 15_800_000,
  profitLossPercent: 19.75,
  activePlans: 0,
  pausedPlans: 5,
  errorPlans: 0,
  nextExecution: null,
};

/**
 * Mock Data: Large Portfolio
 */
const largeData: DCAOverviewData = {
  currentValue: 1_450_000_000,
  totalInvested: 1_200_000_000,
  profitLoss: 250_000_000,
  profitLossPercent: 20.8,
  activePlans: 8,
  pausedPlans: 2,
  errorPlans: 1,
  nextExecution: {
    relativeTime: '1 ngày',
    amount: 5_000_000,
  },
};

/** Sparkline mock data */
const sparklineProfit = [30, 32, 31, 35, 34, 36, 38, 37, 40, 39, 41, 43, 42, 45, 44, 46, 48, 47, 50, 52, 51, 54, 53, 56, 55, 58, 57, 60, 62];
const sparklineLoss = [60, 58, 57, 55, 56, 53, 52, 50, 48, 46, 44, 43, 41, 40, 38, 37, 35, 34, 32, 31, 30, 28, 29, 27, 26, 25, 24, 23, 22];

/**
 * DCA Overview Demo Page Component
 */
export default function DCAOverviewDemo() {
  const [showLoading, setShowLoading] = useState(false);
  const c = useThemeColors();

  return (
    <PageLayout>
      {/* Header */}
      <Header
        title="DCA Overview Card Demo"
        subtitle="Demo · DCA"
        back
        right={
          <button
            onClick={() => setShowLoading(!showLoading)}
            className="px-3 py-1.5 rounded-xl text-[12px] font-medium"
            style={{
              background: showLoading ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
              color: showLoading ? '#EF4444' : '#3B82F6',
            }}
          >
            {showLoading ? 'Hide Loading' : 'Show Loading'}
          </button>
        }
      />

      {/* Content */}
      <PageContent gap="loose">
        {/* Loading Skeleton Demo */}
        {showLoading && (
          <Section
            title="Loading State (Skeleton Shimmer)"
            description="Hiệu ứng shimmer khi data đang tải."
          >
            <DCAOverviewCard data={profitableData} isLoading />
          </Section>
        )}

        {/* Scenario 1: Profitable with sparkline + actions */}
        <Section
          title="Scenario 1: Lãi (Profitable) + Sparkline + Actions"
          description="Portfolio đang có lãi +19.3%, sparkline animated, action buttons đầy đủ."
        >
          <DCAOverviewCard
            data={profitableData}
            sparklineData={sparklineProfit}
            onSparklineTap={() => console.log('Sparkline tapped')}
            actions={{
              onCreatePlan: () => console.log('Create plan'),
              onPauseAll: () => console.log('Pause all'),
              onViewChart: () => console.log('View chart'),
              onViewHistory: () => console.log('View history'),
            }}
          />
        </Section>

        {/* Scenario 2: Loss with sparkline */}
        <Section
          title="Scenario 2: Lỗ (Loss) + Sparkline"
          description="Portfolio đang lỗ -18.6%, có 1 kế hoạch bị pause."
        >
          <DCAOverviewCard
            data={lossData}
            sparklineData={sparklineLoss}
            actions={{
              onCreatePlan: () => console.log('Create plan'),
              onPauseAll: () => console.log('Pause all'),
              onViewChart: () => console.log('View chart'),
              onViewHistory: () => console.log('View history'),
            }}
          />
        </Section>

        {/* Scenario 3: With Errors */}
        <Section
          title="Scenario 3: Có Lỗi (With Errors)"
          description="Portfolio lỗ -15.6%, có 2 kế hoạch bị lỗi cần xử lý."
        >
          <DCAOverviewCard
            data={errorData}
            actions={{
              onCreatePlan: () => console.log('Create plan'),
              onPauseAll: () => console.log('Pause all'),
              onViewChart: () => console.log('View chart'),
              onViewHistory: () => console.log('View history'),
            }}
          />
        </Section>

        {/* Scenario 4: No Next Execution */}
        <Section
          title="Scenario 4: Không Có Lịch Mua (No Next Execution)"
          description="Tất cả 5 kế hoạch đều bị pause, không có lần mua tiếp theo."
        >
          <DCAOverviewCard data={noNextData} onClick={() => console.log('Clicked: No Next')} />
        </Section>

        {/* Scenario 5: Large Portfolio */}
        <Section
          title="Scenario 5: Portfolio Lớn (Large Portfolio)"
          description="Portfolio giá trị >1 tỷ VND, nhiều kế hoạch đang chạy."
        >
          <DCAOverviewCard
            data={largeData}
            sparklineData={sparklineProfit}
            actions={{
              onCreatePlan: () => console.log('Create plan'),
              onPauseAll: () => console.log('Pause all'),
              onViewChart: () => console.log('View chart'),
              onViewHistory: () => console.log('View history'),
            }}
          />
        </Section>

        {/* Mobile Preview */}
        <Section
          title="Mobile Preview (360px width)"
          description="Xem preview trên màn hình nhỏ (responsive)."
        >
          <div className="max-w-[360px] mx-auto border-2 border-dashed rounded-2xl p-2" style={{ borderColor: c.border }}>
            <DCAOverviewCard
              data={profitableData}
              sparklineData={sparklineProfit}
              actions={{
                onCreatePlan: () => console.log('Create plan'),
                onPauseAll: () => console.log('Pause all'),
                onViewChart: () => console.log('View chart'),
                onViewHistory: () => console.log('View history'),
              }}
            />
          </div>
        </Section>
      </PageContent>

      {/* Footer Info */}
      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: c.surface, borderTop: `1px solid ${c.border}` }}>
        <div className="text-center text-[12px]" style={{ color: c.text3 }}>
          Component: <code className="px-2 py-1 rounded" style={{ background: c.surface2 }}>DCAOverviewCard</code>
          {' • '}
          Location: <code className="px-2 py-1 rounded" style={{ background: c.surface2 }}>/src/app/components/dca/DCAOverviewCard.tsx</code>
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Section Component (for demo organization)
 */
interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  const c = useThemeColors();
  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div>
        <h2 className="text-[18px] font-semibold mb-1" style={{ color: c.text1 }}>
          {title}
        </h2>
        <p className="text-[14px]" style={{ color: c.text2 }}>
          {description}
        </p>
      </div>

      {/* Section Content */}
      <div>{children}</div>
    </div>
  );
}