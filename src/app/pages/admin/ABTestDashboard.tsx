/**
 * A/B Test Dashboard - Test Results Visualization
 *
 * Comprehensive A/B test dashboard showing:
 * - Active tests overview
 * - Variant performance comparison
 * - Statistical significance
 * - Winner recommendation
 *
 * @module pages/admin/ABTestDashboard
 * @version 1.0 (Phase 2 - Sprint 3)
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  Beaker,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Target,
  BarChart2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../utils/golden';
import { abTestAnalytics } from '../../services/ABTestAnalytics';
import { AB_TESTS } from '../../config/abTests';
import type { ABTest, ABTestResults } from '../../config/abTests';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface TestSummary {
  testId: string;
  testName: string;
  status: 'active' | 'completed' | 'archived';
  variants: VariantSummary[];
  winner: string | null;
  confidence: number;
  sampleSize: number;
}

interface VariantSummary {
  variant: string;
  exposures: number;
  conversions: number;
  conversionRate: number;
  isControl: boolean;
  isWinner: boolean;
}

/**
 * Page-local extended view of ABTestResults — the service type only carries
 * `significance`/`confidence` and per-variant exposures, so the aggregate and
 * statistical fields this dashboard renders are derived here.
 */
type ABTestResultsView = ABTestResults & {
  hasSignificance: boolean;
  totalExposures: number;
  zScore: number;
  pValue: number;
};

function toResultsView(test: ABTest, results: ABTestResults): ABTestResultsView {
  const totalExposures = results.variants.reduce((sum, v) => sum + v.exposures, 0);
  const hasSignificance = results.significance >= test.targetSignificance;

  // Two-proportion z-test between the best variant and control (same formula
  // the service uses internally for winner determination).
  const sorted = [...results.variants].sort((a, b) => b.conversionRate - a.conversionRate);
  const best = sorted[0];
  const control = results.variants[0];
  let zScore = 0;
  if (best && control && best.exposures > 0 && control.exposures > 0) {
    const pPool =
      (best.conversionRate * best.exposures + control.conversionRate * control.exposures) /
      (best.exposures + control.exposures);
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / best.exposures + 1 / control.exposures));
    if (se > 0) {
      zScore = Math.abs(best.conversionRate - control.conversionRate) / se;
    }
  }

  return {
    ...results,
    hasSignificance,
    totalExposures,
    zScore,
    pValue: Math.max(0, 1 - results.confidence),
  };
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function ABTestDashboard() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  // Get all test summaries
  const testSummaries = useMemo(() => {
    const summaries: TestSummary[] = [];

    for (const test of AB_TESTS) {
      const results = toResultsView(test, abTestAnalytics.getTestResults(test));

      const variants: VariantSummary[] = results.variants.map((v) => ({
        variant: v.variantId,
        exposures: v.exposures,
        conversions: v.conversions,
        conversionRate: v.conversionRate,
        isControl: v.variantId === test.variants[0].id,
        isWinner: v.variantId === results.winner,
      }));

      summaries.push({
        testId: test.id,
        testName: test.name,
        status: results.hasSignificance ? 'completed' : 'active',
        variants,
        winner: results.winner ?? null,
        confidence: results.confidence,
        sampleSize: results.totalExposures,
      });
    }

    return summaries;
  }, []);

  const selectedTestData = useMemo(() => {
    if (!selectedTest) return null;

    const test = AB_TESTS.find((t) => t.id === selectedTest);
    if (!test) return null;

    const results = toResultsView(test, abTestAnalytics.getTestResults(test));

    return {
      test,
      results,
    };
  }, [selectedTest]);

  // Active tests count
  const activeTestsCount = testSummaries.filter((t) => t.status === 'active').length;

  return (
    <PageLayout>
      <Header
        variant="page"
        title="A/B Test Dashboard"
        subtitle="Test Results & Analysis"
        back
        breadcrumb
      />

      <PageContent gap="default">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.12)' }}
              >
                <Beaker size={20} color="#3B82F6" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text3, fontSize: 11 }}>Tests đang chạy</p>
                <p
                  style={{ color: c.text1, fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}
                >
                  {activeTestsCount}
                </p>
              </div>
            </div>
          </TrCard>

          <TrCard className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)' }}
              >
                <Award size={20} color="#10B981" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text3, fontSize: 11 }}>Có kết quả</p>
                <p
                  style={{ color: c.text1, fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}
                >
                  {testSummaries.filter((t) => t.winner).length}
                </p>
              </div>
            </div>
          </TrCard>
        </div>

        {/* Test List */}
        <div className="space-y-3">
          <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>Tất cả A/B Tests</h2>

          {testSummaries.map((test) => {
            const isSelected = selectedTest === test.testId;
            const controlVariant = test.variants.find((v) => v.isControl);
            const treatmentVariant = test.variants.find((v) => !v.isControl);

            return (
              <TrCard
                key={test.testId}
                hover
                as="button"
                onClick={() => setSelectedTest(isSelected ? null : test.testId)}
                className="w-full p-4"
                accentBorder={isSelected ? 'rgba(139,92,246,0.3)' : undefined}
              >
                {/* Test Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Beaker size={16} color="#8B5CF6" />
                      <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                        {test.testName}
                      </h3>
                    </div>
                    <p style={{ color: c.text3, fontSize: 11 }}>{test.testId}</p>
                  </div>

                  {/* Status Badge */}
                  <div
                    className="px-2 py-1 rounded"
                    style={{
                      background:
                        test.status === 'active'
                          ? 'rgba(59,130,246,0.12)'
                          : 'rgba(16,185,129,0.12)',
                    }}
                  >
                    <span
                      style={{
                        color: test.status === 'active' ? '#3B82F6' : '#10B981',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {test.status === 'active' ? 'ĐANG CHẠY' : 'HOÀN THÀNH'}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded-lg" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 10 }}>Mẫu</p>
                    <p
                      style={{
                        color: c.text1,
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                      }}
                    >
                      {test.sampleSize}
                    </p>
                  </div>

                  <div className="text-center p-2 rounded-lg" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 10 }}>Độ tin cậy</p>
                    <p
                      style={{
                        color: c.text1,
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                      }}
                    >
                      {(test.confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="text-center p-2 rounded-lg" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 10 }}>Lift</p>
                    <p
                      style={{
                        color:
                          treatmentVariant &&
                          controlVariant &&
                          treatmentVariant.conversionRate > controlVariant.conversionRate
                            ? '#10B981'
                            : c.text1,
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                      }}
                    >
                      {controlVariant && treatmentVariant
                        ? `${(((treatmentVariant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100).toFixed(1)}%`
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Variant Comparison */}
                <div className="space-y-2">
                  {test.variants.map((variant) => (
                    <div key={variant.variant}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text2, fontSize: 12, fontWeight: 500 }}>
                            {variant.variant === 'control'
                              ? 'Control'
                              : `Variant ${variant.variant.toUpperCase()}`}
                          </span>
                          {variant.isWinner && <Award size={14} color="#10B981" />}
                        </div>
                        <span
                          style={{
                            color: c.text1,
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: 'monospace',
                          }}
                        >
                          {(variant.conversionRate * 100).toFixed(1)}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: c.surface2 }}
                      >
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${variant.conversionRate * 100}%`,
                            background: variant.isWinner
                              ? '#10B981'
                              : variant.isControl
                                ? '#3B82F6'
                                : '#8B5CF6',
                          }}
                        />
                      </div>

                      <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                        {variant.conversions} / {variant.exposures} conversions
                      </p>
                    </div>
                  ))}
                </div>

                {/* Winner Badge */}
                {test.winner && (
                  <div
                    className="mt-3 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.08)' }}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} color="#10B981" />
                      <p style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                        Winner:{' '}
                        {test.winner === 'control'
                          ? 'Control'
                          : `Variant ${test.winner.toUpperCase()}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {isSelected && selectedTestData && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: c.divider }}>
                    {/* Statistical Details */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Z-Score</p>
                          <p
                            style={{
                              color: c.text1,
                              fontSize: 15,
                              fontWeight: 600,
                              fontFamily: 'monospace',
                            }}
                          >
                            {selectedTestData.results.zScore.toFixed(3)}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>P-Value</p>
                          <p
                            style={{
                              color: c.text1,
                              fontSize: 15,
                              fontWeight: 600,
                              fontFamily: 'monospace',
                            }}
                          >
                            {selectedTestData.results.pValue.toFixed(4)}
                          </p>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          background: selectedTestData.results.hasSignificance
                            ? 'rgba(16,185,129,0.08)'
                            : 'rgba(245,158,11,0.08)',
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {selectedTestData.results.hasSignificance ? (
                            <CheckCircle size={16} color="#10B981" />
                          ) : (
                            <AlertCircle size={16} color="#F59E0B" />
                          )}
                          <div className="flex-1">
                            <p
                              style={{
                                color: selectedTestData.results.hasSignificance
                                  ? '#10B981'
                                  : '#F59E0B',
                                fontSize: 12,
                                fontWeight: 600,
                                marginBottom: 2,
                              }}
                            >
                              {selectedTestData.results.hasSignificance
                                ? '✅ Kết quả có ý nghĩa thống kê'
                                : '⏳ Cần thêm dữ liệu'}
                            </p>
                            <p style={{ color: c.text3, fontSize: 11 }}>
                              {selectedTestData.results.hasSignificance
                                ? `Độ tin cậy ${(selectedTestData.results.confidence * 100).toFixed(1)}% > 95%`
                                : `Độ tin cậy ${(selectedTestData.results.confidence * 100).toFixed(1)}% < 95%`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Sample Size Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p style={{ color: c.text2, fontSize: 12 }}>Kích thước mẫu</p>
                          <p
                            style={{
                              color: c.text1,
                              fontSize: 12,
                              fontWeight: 600,
                              fontFamily: 'monospace',
                            }}
                          >
                            {selectedTestData.results.totalExposures} /{' '}
                            {selectedTestData.test.minSampleSize}
                          </p>
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: c.surface2 }}
                        >
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${Math.min(100, (selectedTestData.results.totalExposures / selectedTestData.test.minSampleSize) * 100)}%`,
                              background:
                                selectedTestData.results.totalExposures >=
                                selectedTestData.test.minSampleSize
                                  ? '#10B981'
                                  : '#3B82F6',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TrCard>
            );
          })}
        </div>

        {testSummaries.length === 0 && (
          <TrCard className="p-8">
            <div className="text-center">
              <Beaker size={48} color={c.text3} className="mx-auto mb-3" />
              <p style={{ color: c.text2, fontSize: φ.base, fontWeight: 600, marginBottom: 8 }}>
                Chưa có A/B test nào
              </p>
              <p style={{ color: c.text3, fontSize: φ.sm }}>Tạo test mới để bắt đầu thử nghiệm</p>
            </div>
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}
