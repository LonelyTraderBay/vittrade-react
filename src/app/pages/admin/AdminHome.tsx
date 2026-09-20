/**
 * Admin Home - Dashboard Navigation Hub
 * 
 * Central hub for accessing all admin dashboards and tools:
 * - Analytics Dashboard
 * - A/B Test Dashboard
 * - Funnel Dashboard
 * - Real-time Metrics
 * 
 * @module pages/admin/AdminHome
 * @version 1.0 (Phase 2 - Sprint 3)
 */

import { useNavigate } from 'react-router';
import { 
  BarChart3, 
  Beaker, 
  Filter,
  Zap,
  Settings,
  ChevronRight,
  Activity,
  TrendingUp
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { RealTimeMetrics } from '../../components/admin/RealTimeMetrics';
import { φ } from '../../utils/golden';
import { dcaAnalytics } from '../../services/DCAAnalyticsService';
import { abTestAnalytics } from '../../services/ABTestAnalytics';
import { funnelTracker } from '../../services/ConversionFunnelTracker';
import { AB_TESTS } from '../../config/abTests';
import { CONVERSION_FUNNELS } from '../../config/dcaFunnels';

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function AdminHome() {
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const c = useThemeColors();

  // Quick stats
  const totalEvents = dcaAnalytics.getQueue().length;
  const activeTests = AB_TESTS.filter(test => {
    const results = abTestAnalytics.getTestResults(test);
    return !results.hasSignificance;
  }).length;
  
  const completedFunnels = CONVERSION_FUNNELS.reduce((sum, funnel) => {
    const analytics = funnelTracker.getFunnelAnalytics(funnel.id);
    return sum + analytics.completedSessions;
  }, 0);

  const dashboards = [
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Event volume, top events, trends',
      icon: BarChart3,
      color: '#8B5CF6',
      path: `${routePrefix}/admin/analytics`,
      stat: `${totalEvents} events`,
    },
    {
      id: 'abtests',
      title: 'A/B Test Dashboard',
      description: 'Test results, statistical significance',
      icon: Beaker,
      color: '#3B82F6',
      path: `${routePrefix}/admin/abtests`,
      stat: `${activeTests} active`,
    },
    {
      id: 'funnels',
      title: 'Funnel Dashboard',
      description: 'Conversion funnels, dropout analysis',
      icon: Filter,
      color: '#10B981',
      path: `${routePrefix}/admin/funnels`,
      stat: `${completedFunnels} completed`,
    },
  ];

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Admin Dashboard"
        subtitle="DCA Analytics & Monitoring"
        right={
          <button
            onClick={() => navigate(`${routePrefix}/admin/settings`)}
            className="flex items-center justify-center hover-ghost"
            style={{ width: 36, height: 36, borderRadius: 10, background: c.searchBg, border: `1px solid ${c.border}` }}
            aria-label="Settings"
          >
            <Settings size={18} color={c.text2} />
          </button>
        }
      />

      <PageContent gap="default">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} color="#8B5CF6" />
              <p style={{ color: c.text3, fontSize: 10 }}>Events</p>
            </div>
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
              {totalEvents}
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Beaker size={14} color="#3B82F6" />
              <p style={{ color: c.text3, fontSize: 10 }}>Tests</p>
            </div>
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
              {AB_TESTS.length}
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Filter size={14} color="#10B981" />
              <p style={{ color: c.text3, fontSize: 10 }}>Funnels</p>
            </div>
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
              {CONVERSION_FUNNELS.length}
            </p>
          </TrCard>
        </div>

        {/* Real-Time Metrics */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Real-Time Metrics
            </h2>
          </div>
          <RealTimeMetrics />
        </div>

        {/* Dashboard Links */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Dashboards
            </h2>
          </div>

          <div className="space-y-3">
            {dashboards.map((dashboard) => (
              <TrCard
                key={dashboard.id}
                hover
                as="button"
                onClick={() => navigate(dashboard.path)}
                className="w-full p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: dashboard.color + '15' }}
                  >
                    <dashboard.icon size={24} color={dashboard.color} />
                  </div>

                  <div className="flex-1 text-left">
                    <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>
                      {dashboard.title}
                    </h3>
                    <p style={{ color: c.text3, fontSize: 11 }}>
                      {dashboard.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p style={{ color: dashboard.color, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                        {dashboard.stat}
                      </p>
                    </div>
                    <ChevronRight size={20} color={c.text3} />
                  </div>
                </div>
              </TrCard>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <TrCard className="p-4">
          <div className="text-center">
            <p style={{ color: c.text3, fontSize: 11 }}>
              Admin Dashboard v1.0 • Phase 2 Sprint 3
            </p>
            <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
              Last updated: {new Date().toLocaleString('vi-VN')}
            </p>
          </div>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}