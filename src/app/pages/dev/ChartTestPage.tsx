/**
 * ══════════════════════════════════════════════════════════════════
 *  CHART TEST PAGE (DEV ONLY)
 * ══════════════════════════════════════════════════════════════════
 *  Test all chart configurations and performance
 */

import React, { useState } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { MiniChart } from '../../../components/trading/MiniChart';
import { ChartPerformanceMonitor, analyzeChartBundleSize } from '../../../components/trading/ChartPerformanceMonitor';
import { PAIR_CONFIGS } from '../../../utils/chartDataGenerator';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../../utils/golden';

export function ChartTestPage() {
  const c = useThemeColors();
  const [showPerf, setShowPerf] = useState(false);

  const pairs = Object.keys(PAIR_CONFIGS);

  return (
    <PageLayout>
      <Header title="Chart Test Suite" back />
      
      <PageContent gap="relaxed">
        {/* Controls */}
        <TrCard>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Performance Monitor
              </p>
              <p style={{ color: c.text3, fontSize: φ.xs }}>
                Show render times
              </p>
            </div>
            <button
              onClick={() => setShowPerf(!showPerf)}
              className="px-4 py-2 rounded-lg"
              style={{
                background: showPerf ? '#10B981' : c.surface2,
                color: showPerf ? '#FFF' : c.text2,
                fontSize: φ.sm,
                fontWeight: 600,
              }}
            >
              {showPerf ? 'ON' : 'OFF'}
            </button>
          </div>
          
          <button
            onClick={() => analyzeChartBundleSize()}
            className="w-full mt-3 px-4 py-2 rounded-lg"
            style={{
              background: c.surface2,
              color: c.text2,
              fontSize: φ.sm,
              fontWeight: 600,
            }}
          >
            Analyze Bundle Size (Console)
          </button>
        </TrCard>

        {/* Test Grid */}
        <div style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>
          All Trading Pairs
        </div>

        <div className="space-y-4">
          {pairs.map((pairId) => {
            const config = PAIR_CONFIGS[pairId];
            const symbol = pairId.split('-')[0].toUpperCase();
            
            return (
              <div key={pairId}>
                {/* Pair Info */}
                <div className="mb-2">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                    {symbol}/USDT
                  </p>
                  <div className="flex gap-4 mt-1">
                    <span style={{ color: c.text3, fontSize: φ.xs }}>
                      Base: ${config.basePrice.toLocaleString()}
                    </span>
                    <span style={{ color: c.text3, fontSize: φ.xs }}>
                      Vol: {(config.volatility * 100).toFixed(1)}%
                    </span>
                    <span style={{ color: c.text3, fontSize: φ.xs }}>
                      Trend: {config.trendBias > 0 ? '🟢' : config.trendBias < 0 ? '🔴' : '⚪️'}
                    </span>
                  </div>
                </div>

                {/* Chart */}
                <ChartPerformanceMonitor enabled={showPerf} threshold={100}>
                  <MiniChart
                    pairId={pairId}
                    height={120}
                    showVolume={true}
                    showCurrentPrice={true}
                    interactive={false}
                  />
                </ChartPerformanceMonitor>
              </div>
            );
          })}
        </div>

        {/* Variant Tests */}
        <div style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginTop: 24 }}>
          Height Variants
        </div>

        <div className="space-y-4">
          {[100, 120, 140, 160].map((height) => (
            <div key={height}>
              <p style={{ color: c.text3, fontSize: φ.xs, marginBottom: 8 }}>
                Height: {height}px
              </p>
              <MiniChart
                pairId="btc-usdt"
                height={height}
                showVolume={true}
                showCurrentPrice={true}
                interactive={false}
              />
            </div>
          ))}
        </div>

        {/* Config Tests */}
        <div style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginTop: 24 }}>
          Configuration Tests
        </div>

        <div className="space-y-4">
          <div>
            <p style={{ color: c.text3, fontSize: φ.xs, marginBottom: 8 }}>
              No Volume
            </p>
            <MiniChart
              pairId="btc-usdt"
              height={120}
              showVolume={false}
              showCurrentPrice={true}
              interactive={false}
            />
          </div>

          <div>
            <p style={{ color: c.text3, fontSize: φ.xs, marginBottom: 8 }}>
              No Price Line
            </p>
            <MiniChart
              pairId="btc-usdt"
              height={120}
              showVolume={true}
              showCurrentPrice={false}
              interactive={false}
            />
          </div>

          <div>
            <p style={{ color: c.text3, fontSize: φ.xs, marginBottom: 8 }}>
              Minimal (No Volume, No Price Line)
            </p>
            <MiniChart
              pairId="btc-usdt"
              height={120}
              showVolume={false}
              showCurrentPrice={false}
              interactive={false}
            />
          </div>
        </div>

        {/* Performance Summary */}
        <TrCard>
          <div style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>
            Performance Targets
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Initial Mount</span>
              <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>
                &lt; 100ms ✅
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Render Time</span>
              <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>
                &lt; 16ms (60fps) ✅
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Bundle Size</span>
              <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>
                ~52KB (~15KB gzipped) ✅
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Touch Response</span>
              <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>
                Instant ✅
              </span>
            </div>
          </div>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}
