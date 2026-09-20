import { useThemeColors } from "../../hooks/useThemeColors";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface Issue {
  category: string;
  original: "fail" | "warn" | "pass";
  variantA: "fail" | "warn" | "pass";
  variantB: "fail" | "warn" | "pass";
  variantC: "fail" | "warn" | "pass";
  description: string;
}

const ISSUES: Issue[] = [
  {
    category: "Visual Hierarchy",
    original: "fail",
    variantA: "pass",
    variantB: "warn",
    variantC: "warn",
    description: "AUM prominence & metric priority",
  },
  {
    category: "Color Semantics",
    original: "fail",
    variantA: "pass",
    variantB: "pass",
    variantC: "pass",
    description: "No misleading green/orange for metrics",
  },
  {
    category: "Trust Transparency",
    original: "fail",
    variantA: "pass",
    variantB: "pass",
    variantC: "fail",
    description: "Timestamp + trend indicators",
  },
  {
    category: "Number Format",
    original: "warn",
    variantA: "pass",
    variantB: "pass",
    variantC: "pass",
    description: "11K not 11.0K, tabular-nums",
  },
  {
    category: "Beginner-First",
    original: "fail",
    variantA: "pass",
    variantB: "pass",
    variantC: "warn",
    description: "Icons, context, explanatory features",
  },
  {
    category: "Accessibility",
    original: "fail",
    variantA: "pass",
    variantB: "pass",
    variantC: "warn",
    description: "Not color-dependent, contrast OK",
  },
  {
    category: "Scanability",
    original: "fail",
    variantA: "pass",
    variantB: "pass",
    variantC: "warn",
    description: "Quick focal point identification",
  },
];

function StatusIcon({ status }: { status: "fail" | "warn" | "pass" }) {
  const c = useThemeColors();

  if (status === "pass") {
    return (
      <CheckCircle2
        className="size-4"
        style={{ color: c.success }}
      />
    );
  }
  if (status === "warn") {
    return (
      <AlertCircle
        className="size-4"
        style={{ color: "#F59E0B" }} // warning orange
      />
    );
  }
  return (
    <XCircle
      className="size-4"
      style={{ color: c.danger }}
    />
  );
}

export function IssueComparisonTable() {
  const c = useThemeColors();

  const calculateScore = (variant: "original" | "variantA" | "variantB" | "variantC") => {
    const scores = { pass: 100, warn: 50, fail: 0 };
    const total = ISSUES.reduce((sum, issue) => sum + scores[issue[variant]], 0);
    return Math.round((total / (ISSUES.length * 100)) * 100);
  };

  const originalScore = calculateScore("original");
  const variantAScore = calculateScore("variantA");
  const variantBScore = calculateScore("variantB");
  const variantCScore = calculateScore("variantC");

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: c.surface }}
    >
      <h3
        className="text-base font-bold mb-4"
        style={{ color: c.text }}
      >
        📊 Compliance Comparison Matrix
      </h3>

      {/* Score Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div
          className="rounded-xl p-3 text-center"
          style={{ backgroundColor: c.danger + "15" }}
        >
          <div
            className="text-xs font-medium mb-1"
            style={{ color: c.textSec }}
          >
            Original
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: c.danger }}
          >
            {originalScore}
          </div>
          <div
            className="text-[10px]"
            style={{ color: c.textTer }}
          >
            /100
          </div>
        </div>
        <div
          className="rounded-xl p-3 text-center border-2"
          style={{
            backgroundColor: c.success + "15",
            borderColor: c.success,
          }}
        >
          <div
            className="text-xs font-medium mb-1"
            style={{ color: c.textSec }}
          >
            Variant A
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: c.success }}
          >
            {variantAScore}
          </div>
          <div
            className="text-[10px]"
            style={{ color: c.textTer }}
          >
            /100 ★
          </div>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ backgroundColor: c.success + "10" }}
        >
          <div
            className="text-xs font-medium mb-1"
            style={{ color: c.textSec }}
          >
            Variant B
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: c.success }}
          >
            {variantBScore}
          </div>
          <div
            className="text-[10px]"
            style={{ color: c.textTer }}
          >
            /100
          </div>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ backgroundColor: "#F59E0B15" }}
        >
          <div
            className="text-xs font-medium mb-1"
            style={{ color: c.textSec }}
          >
            Variant C
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: "#F59E0B" }}
          >
            {variantCScore}
          </div>
          <div
            className="text-[10px]"
            style={{ color: c.textTer }}
          >
            /100
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="h-px my-4"
        style={{ backgroundColor: c.border }}
      />

      {/* Table */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full">
          <thead>
            <tr>
              <th
                className="text-left text-[11px] font-medium uppercase tracking-wide pb-3"
                style={{ color: c.textSec }}
              >
                Issue Category
              </th>
              <th
                className="text-center text-[11px] font-medium uppercase tracking-wide pb-3 px-2"
                style={{ color: c.textSec }}
              >
                Original
              </th>
              <th
                className="text-center text-[11px] font-medium uppercase tracking-wide pb-3 px-2"
                style={{ color: c.textSec }}
              >
                Var A
              </th>
              <th
                className="text-center text-[11px] font-medium uppercase tracking-wide pb-3 px-2"
                style={{ color: c.textSec }}
              >
                Var B
              </th>
              <th
                className="text-center text-[11px] font-medium uppercase tracking-wide pb-3 px-2"
                style={{ color: c.textSec }}
              >
                Var C
              </th>
            </tr>
          </thead>
          <tbody>
            {ISSUES.map((issue, idx) => (
              <tr
                key={idx}
                className="border-t"
                style={{ borderColor: c.border }}
              >
                <td className="py-3">
                  <div
                    className="text-sm font-medium mb-0.5"
                    style={{ color: c.text }}
                  >
                    {issue.category}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: c.textSec }}
                  >
                    {issue.description}
                  </div>
                </td>
                <td className="py-3 text-center px-2">
                  <div className="flex justify-center">
                    <StatusIcon status={issue.original} />
                  </div>
                </td>
                <td className="py-3 text-center px-2">
                  <div className="flex justify-center">
                    <StatusIcon status={issue.variantA} />
                  </div>
                </td>
                <td className="py-3 text-center px-2">
                  <div className="flex justify-center">
                    <StatusIcon status={issue.variantB} />
                  </div>
                </td>
                <td className="py-3 text-center px-2">
                  <div className="flex justify-center">
                    <StatusIcon status={issue.variantC} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        className="mt-4 pt-4 border-t flex items-center justify-center gap-6"
        style={{ borderColor: c.border }}
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle2
            className="size-3.5"
            style={{ color: c.success }}
          />
          <span
            className="text-xs"
            style={{ color: c.textSec }}
          >
            Compliant
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertCircle
            className="size-3.5"
            style={{ color: "#F59E0B" }}
          />
          <span
            className="text-xs"
            style={{ color: c.textSec }}
          >
            Partial
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle
            className="size-3.5"
            style={{ color: c.danger }}
          />
          <span
            className="text-xs"
            style={{ color: c.textSec }}
          >
            Non-compliant
          </span>
        </div>
      </div>
    </div>
  );
}
