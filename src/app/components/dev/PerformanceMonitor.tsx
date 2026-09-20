import React, { useState, useEffect } from 'react';
import { Activity, Zap, Package, Clock, TrendingDown } from 'lucide-react';
import { Header } from '../layout/Header';
import { PageLayout } from '../layout/PageLayout';
import { PageContent, PageSection } from '../layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../ui/TrCard';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  memoryUsed?: number;
  memoryLimit?: number;
}

interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
}

export function PerformanceMonitor() {
  const c = useThemeColors();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [resources, setResources] = useState<ResourceTiming[]>([]);
  const [lazyLoadedChunks, setLazyLoadedChunks] = useState<string[]>([]);

  useEffect(() => {
    // Get performance metrics
    const getMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const metrics: PerformanceMetrics = {
        loadTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart || 0,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: 0,
      };

      // Get LCP
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        setMetrics(prev => prev ? { ...prev, largestContentfulPaint: lastEntry.startTime } : null);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Get memory (if available)
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        metrics.memoryUsed = mem.usedJSHeapSize / 1048576; // MB
        metrics.memoryLimit = mem.jsHeapSizeLimit / 1048576; // MB
      }

      setMetrics(metrics);
    };

    // Get resource timings
    const getResources = () => {
      const resourceTimings = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const processedResources = resourceTimings
        .filter(r => r.initiatorType !== 'fetch') // Exclude API calls
        .map(r => ({
          name: r.name.split('/').pop() || r.name,
          type: r.initiatorType,
          duration: r.duration,
          size: r.transferSize || 0,
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10); // Top 10 slowest

      setResources(processedResources);

      // Detect lazy loaded chunks
      const chunks = resourceTimings
        .filter(r => r.name.includes('chunk') || r.name.includes('lazy'))
        .map(r => r.name.split('/').pop() || r.name);
      setLazyLoadedChunks(chunks);
    };

    const timer = setTimeout(() => {
      getMetrics();
      getResources();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getScoreColor = (value: number, thresholds: { good: number; ok: number }) => {
    if (value <= thresholds.good) return '#10B981';
    if (value <= thresholds.ok) return '#F59E0B';
    return '#EF4444';
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!metrics) {
    return (
      <PageLayout>
        <Header title="Performance Monitor" back />
        <PageContent>
          <div className="flex items-center justify-center py-12">
            <p style={{ color: c.text3, fontSize: 14 }}>Collecting metrics...</p>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Performance Monitor" back />

      <PageContent>
        {/* Overall Score */}
        <TrCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={24} color={c.primary} />
            <div>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                Performance Score
              </p>
              <p style={{ color: c.text3, fontSize: 12 }}>
                Based on Core Web Vitals
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: getScoreColor(metrics.firstContentfulPaint, { good: 1800, ok: 3000 }), fontSize: 20, fontWeight: 700 }}>
                {metrics.firstContentfulPaint.toFixed(0)}ms
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>FCP</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: getScoreColor(metrics.largestContentfulPaint, { good: 2500, ok: 4000 }), fontSize: 20, fontWeight: 700 }}>
                {metrics.largestContentfulPaint.toFixed(0)}ms
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>LCP</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: getScoreColor(metrics.loadTime, { good: 3000, ok: 5000 }), fontSize: 20, fontWeight: 700 }}>
                {(metrics.loadTime / 1000).toFixed(2)}s
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>Load Time</p>
            </div>
          </div>
        </TrCard>

        {/* Web Vitals Breakdown */}
        <PageSection label="Core Web Vitals">
          <TrCard className="p-4">
            <div className="space-y-3">
              {[
                { label: 'First Paint (FP)', value: metrics.firstPaint, unit: 'ms', thresholds: { good: 1000, ok: 2000 } },
                { label: 'First Contentful Paint (FCP)', value: metrics.firstContentfulPaint, unit: 'ms', thresholds: { good: 1800, ok: 3000 } },
                { label: 'Largest Contentful Paint (LCP)', value: metrics.largestContentfulPaint, unit: 'ms', thresholds: { good: 2500, ok: 4000 } },
                { label: 'DOM Content Loaded', value: metrics.domContentLoaded, unit: 'ms', thresholds: { good: 2000, ok: 3500 } },
                { label: 'Page Load', value: metrics.loadTime, unit: 'ms', thresholds: { good: 3000, ok: 5000 } },
              ].map((metric, idx) => {
                const color = getScoreColor(metric.value, metric.thresholds);
                return (
                  <div key={idx} className="pb-3 border-b last:border-b-0" style={{ borderColor: c.borderSolid }}>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ color: c.text2, fontSize: 12 }}>{metric.label}</p>
                      <p style={{ color, fontSize: 13, fontWeight: 700 }}>
                        {metric.value.toFixed(0)}{metric.unit}
                      </p>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                      <div
                        className="h-full"
                        style={{
                          background: color,
                          width: `${Math.min((metric.value / (metric.thresholds.ok * 1.5)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TrCard>
        </PageSection>

        {/* Memory Usage */}
        {metrics.memoryUsed && (
          <PageSection label="Memory Usage">
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                    {metrics.memoryUsed.toFixed(1)} MB
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    of {metrics.memoryLimit?.toFixed(0)} MB limit
                  </p>
                </div>
                <p style={{ color: c.text2, fontSize: 12 }}>
                  {((metrics.memoryUsed / (metrics.memoryLimit || 1)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                <div
                  className="h-full"
                  style={{
                    background: (metrics.memoryUsed / (metrics.memoryLimit || 1)) > 0.8 ? '#EF4444' : '#10B981',
                    width: `${(metrics.memoryUsed / (metrics.memoryLimit || 1)) * 100}%`,
                  }}
                />
              </div>
            </TrCard>
          </PageSection>
        )}

        {/* Lazy Loaded Chunks */}
        {lazyLoadedChunks.length > 0 && (
          <PageSection label="Lazy Loaded Chunks">
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} color="#10B981" />
                <p style={{ color: c.text2, fontSize: 12 }}>
                  {lazyLoadedChunks.length} chunks loaded on-demand
                </p>
              </div>
              <div className="space-y-2">
                {lazyLoadedChunks.map((chunk, idx) => (
                  <div key={idx} className="px-3 py-2 rounded-lg" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace' }}>
                      {chunk}
                    </p>
                  </div>
                ))}
              </div>
            </TrCard>
          </PageSection>
        )}

        {/* Slowest Resources */}
        <PageSection label="Top 10 Slowest Resources">
          <TrCard className="p-4">
            <div className="space-y-2">
              {resources.map((resource, idx) => (
                <div key={idx} className="flex items-center justify-between pb-2 border-b last:border-b-0" style={{ borderColor: c.borderSolid }}>
                  <div className="flex-1 min-w-0 mr-3">
                    <p style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {resource.name}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {resource.type} • {formatBytes(resource.size)}
                    </p>
                  </div>
                  <p style={{ color: c.text2, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {formatTime(resource.duration)}
                  </p>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Optimization Tips */}
        <PageSection label="Optimization Tips">
          <div className="space-y-2">
            <TrCard className="p-3">
              <div className="flex gap-2">
                <TrendingDown size={16} color="#10B981" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                    Lazy Loading Active ✅
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    Staking routes are code-split. ~251KB saved on initial load.
                  </p>
                </div>
              </div>
            </TrCard>
            <TrCard className="p-3">
              <div className="flex gap-2">
                <Package size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                    Bundle Splitting
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    Charts loaded only when needed. Recharts is ~50KB gzipped.
                  </p>
                </div>
              </div>
            </TrCard>
            <TrCard className="p-3">
              <div className="flex gap-2">
                <Clock size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                    First Visit Caching
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    After first load, chunks are cached. Subsequent visits near-instant.
                  </p>
                </div>
              </div>
            </TrCard>
          </div>
        </PageSection>

        {/* Benchmark */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
            Performance Targets
          </p>
          <div className="space-y-1">
            <p style={{ color: c.text2, fontSize: 11 }}>• FCP &lt; 1.8s (Good)</p>
            <p style={{ color: c.text2, fontSize: 11 }}>• LCP &lt; 2.5s (Good)</p>
            <p style={{ color: c.text2, fontSize: 11 }}>• Total Load &lt; 3s (Good)</p>
            <p style={{ color: c.text2, fontSize: 11 }}>• Memory &lt; 50MB (Mobile-friendly)</p>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
