import { PageLayout } from "../../components/layout/PageLayout";
import { PageContent } from "../../components/layout/PageContent";
import { Header } from "../../components/layout/Header";
import { CopyTradingCard } from "../../components/cards/CopyTradingCard";
import { IssueComparisonTable } from "../../components/demo/IssueComparisonTable";
import { useThemeColors } from "../../hooks/useThemeColors";

export default function CopyTradingCardDemo() {
  const c = useThemeColors();

  const mockData = {
    traders: 5,
    copiers: 11000,
    aum: 19250000, // $19.25M
    aumTrend: 12.3, // +12.3%
    lastUpdated: "2 mins ago",
  };

  return (
    <PageLayout>
      <Header title="Copy Trading Card Analysis" back />
      <PageContent gap="relaxed">
        {/* Analysis Header */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: c.surface }}
        >
          <h2
            className="text-lg font-bold mb-2"
            style={{ color: c.text }}
          >
            📊 Enterprise Fintech Card Analysis
          </h2>
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: c.textSec }}
          >
            Below are 3 variants designed to address enterprise-level fintech
            standards: visual hierarchy, trust-first principles, and regulatory
            compliance.
          </p>
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: c.bg }}
          >
            <p
              className="text-xs leading-relaxed"
              style={{ color: c.textTer }}
            >
              <strong style={{ color: c.text }}>Key Improvements:</strong>
              <br />
              • AUM gets featured treatment (centered, 28px bold)
              <br />
              • Trend appears BELOW value with arrow (↑ 12.3% vs last month)
              <br />
              • Removed color semantics confusion (neutral metrics)
              <br />
              • Added transparency (timestamp visible)
              <br />
              • Typography hierarchy follows information priority
              <br />• Number formatting optimized (11K not 11.0K)
            </p>
          </div>
        </div>

        {/* Variant A: Hero Metric (RECOMMENDED) */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h3
              className="text-base font-bold"
              style={{ color: c.text }}
            >
              Variant A: Hero Metric Pattern
            </h3>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: c.success + "20",
                color: c.success,
              }}
            >
              RECOMMENDED
            </span>
          </div>
          <CopyTradingCard
            {...mockData}
            variant="hero"
          />
          <div
            className="mt-2 p-3 rounded-xl"
            style={{ backgroundColor: c.surface }}
          >
            <p
              className="text-xs leading-relaxed"
              style={{ color: c.textSec }}
            >
              <strong style={{ color: c.text }}>Why better:</strong>
              <br />
              ✅ AUM (primary metric) gets largest visual weight
              <br />
              ✅ Trend indicator adds context → trust-first
              <br />
              ✅ Icons replace color coding → accessible
              <br />
              ✅ Clear 3-tier hierarchy: hero → secondary → metadata
              <br />✅ Timestamp provides transparency
            </p>
          </div>
        </div>

        {/* Variant B: Tabular Pattern */}
        <div>
          <h3
            className="text-base font-bold mb-3"
            style={{ color: c.text }}
          >
            Variant B: Financial Dashboard Pattern
          </h3>
          <CopyTradingCard
            {...mockData}
            variant="tabular"
          />
          <div
            className="mt-2 p-3 rounded-xl"
            style={{ backgroundColor: c.surface }}
          >
            <p
              className="text-xs leading-relaxed"
              style={{ color: c.textSec }}
            >
              <strong style={{ color: c.text }}>Why better:</strong>
              <br />
              ✅ Scannable tabular layout (fintech standard)
              <br />
              ✅ Right-aligned numbers → easy comparison
              <br />
              ✅ No color semantics → neutral, professional
              <br />
              ✅ Explicit timestamp + info button → transparency
              <br />✅ Follows "Clarity over density" principle
            </p>
          </div>
        </div>

        {/* Variant C: Compact Refined */}
        <div>
          <h3
            className="text-base font-bold mb-3"
            style={{ color: c.text }}
          >
            Variant C: Compact (Original Structure Refined)
          </h3>
          <CopyTradingCard
            {...mockData}
            variant="compact"
          />
          <div
            className="mt-2 p-3 rounded-xl"
            style={{ backgroundColor: c.surface }}
          >
            <p
              className="text-xs leading-relaxed"
              style={{ color: c.textSec }}
            >
              <strong style={{ color: c.text }}>Changes from original:</strong>
              <br />
              ✅ Removed colored values (blue/green/orange) → neutral text
              <br />
              ✅ AUM gets subtle highlight (border accent) to show priority
              <br />
              ✅ Number format: "11K" instead of "11.0K"
              <br />
              ✅ Tabular-nums font for alignment
              <br />✅ Equal spacing following 8pt grid
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <IssueComparisonTable />

        {/* Original Issue Analysis */}
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: c.danger + "10",
            borderLeft: `4px solid ${c.danger}`,
          }}
        >
          <h3
            className="text-base font-bold mb-3"
            style={{ color: c.danger }}
          >
            ❌ Original Card Issues (Enterprise Standards)
          </h3>
          <div className="space-y-3">
            <div>
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: c.text }}
              >
                1. Visual Hierarchy
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: c.textSec }}
              >
                • AUM ($19.25M) = most critical metric but equal weight with
                others
                <br />• No focal point → unclear information priority
              </p>
            </div>
            <div>
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: c.text }}
              >
                2. Color Semantics (Critical)
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: c.textSec }}
              >
                • Green (COPIERS) → misleading: green = profit in fintech
                <br />
                • Orange (AUM) → confusing: orange = warning/caution
                <br />• Violates guideline: "icon không được chỉ dựa vào màu"
              </p>
            </div>
            <div>
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: c.text }}
              >
                3. Number Formatting
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: c.textSec }}
              >
                • "11.0K" → .0 is unnecessary, should be "11K"
                <br />• No tabular-nums → misaligned in dynamic updates
              </p>
            </div>
            <div>
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: c.text }}
              >
                4. Trust & Transparency
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: c.textSec }}
              >
                • No timestamp → "AUM $19.25M as of when?"
                <br />
                • No trend indicator → context missing
                <br />• No info/tooltip for metric definitions
              </p>
            </div>
            <div>
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: c.text }}
              >
                5. Typography Hierarchy
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: c.textSec }}
              >
                • All values same size → no visual guidance
                <br />• Labels OK but values don't reflect importance
              </p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: c.success + "10",
            borderLeft: `4px solid ${c.success}`,
          }}
        >
          <h3
            className="text-base font-bold mb-3"
            style={{ color: c.success }}
          >
            ✅ Final Recommendation
          </h3>
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: c.text }}
          >
            <strong>Use Variant A (Hero Metric Pattern)</strong> for production
            deployment:
          </p>
          <ul className="space-y-2">
            {[
              "Aligns with fintech best practices (featured primary metric)",
              "Follows Guidelines §1 Trust-first + §6 No dark patterns",
              "Clear hierarchy guides user attention correctly",
              "Transparency features (timestamp, trend) build trust",
              "Accessible (icons + text, not color-dependent)",
              "Responsive to future requirements (easy to add tooltips/modals)",
            ].map((item, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs"
              >
                <span style={{ color: c.success }}>✓</span>
                <span style={{ color: c.textSec }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Guidelines Reference */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: c.surface }}
        >
          <h3
            className="text-base font-bold mb-3"
            style={{ color: c.text }}
          >
            📋 Guidelines Compliance
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: c.primary + "20",
                  color: c.primary,
                }}
              >
                §1
              </span>
              <p
                className="text-xs leading-relaxed flex-1"
                style={{ color: c.textSec }}
              >
                <strong style={{ color: c.text }}>Trust-first:</strong> Added
                timestamp, trend, info access
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: c.primary + "20",
                  color: c.primary,
                }}
              >
                §3
              </span>
              <p
                className="text-xs leading-relaxed flex-1"
                style={{ color: c.textSec }}
              >
                <strong style={{ color: c.text }}>Clarity over density:</strong>{" "}
                Hierarchy prioritizes scanability
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: c.primary + "20",
                  color: c.primary,
                }}
              >
                §4.2
              </span>
              <p
                className="text-xs leading-relaxed flex-1"
                style={{ color: c.textSec }}
              >
                <strong style={{ color: c.text }}>Readability:</strong> Icon ≠
                color-only, contrast optimized
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: c.primary + "20",
                  color: c.primary,
                }}
              >
                §3.3
              </span>
              <p
                className="text-xs leading-relaxed flex-1"
                style={{ color: c.textSec }}
              >
                <strong style={{ color: c.text }}>Number clarity:</strong>{" "}
                Tabular-nums, formatted, thousands separators
              </p>
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}