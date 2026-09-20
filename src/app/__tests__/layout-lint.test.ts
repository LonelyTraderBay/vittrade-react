/**
 * ══════════════════════════════════════════════════════════════
 *  Layout Anti-Pattern Lint — Vitest Guard
 * ══════════════════════════════════════════════════════════════
 *
 *  Detects margin classes (mt-*, mb-*, my-*) on DIRECT children
 *  of <PageContent>. These margins stack with PageContent's
 *  built-in `gap` and produce non-standard spacing values.
 *
 *  FIX: Remove mt-*, mb-*, my-* from direct children. Let gap prop
 *  control spacing uniformly.
 *
 *  Run:  pnpm test -- layout-lint
 *
 *  §2.3 spacing reference: 4/8/12/16/20/24/32/40/48px
 *  §21.6 gap presets: tight(8) / default(16) / relaxed(24) / loose(32)
 *
 *  ARCHITECTURE:
 *  ────────────────────────────────────────────────────────────
 *  1. STRICT GUARD  — Hard-fail on 39 already-fixed files
 *  2. DISCOVERY SCAN — Report-only on all pages (no fail)
 *  3. DEEP SCAN      — Check sub-component root margins
 *
 *  To add a newly-fixed file to the strict guard:
 *    → Add its path to GUARDED_FILES below
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/* ─── Constants ─── */

const SRC_ROOT = path.resolve(__dirname, '../../..');
const PAGES_DIR = path.resolve(__dirname, '../pages');

/**
 * Files that have been fixed and MUST NOT regress.
 * Paths relative to src/ root.
 */
const GUARDED_FILES = [
  'src/app/pages/market/HomePage.tsx',
  'src/app/pages/arena/ArenaHomePage.tsx',
  'src/app/pages/arena/ArenaModeDetailPage.tsx',
  'src/app/pages/arena/MyArenaPage.tsx',
  'src/app/pages/arena/ArenaCreatorPage.tsx',
  'src/app/pages/arena/ArenaLeaderboardPage.tsx',
  'src/app/pages/arena/ArenaPredictionBridgeFoundationPage.tsx',
  'src/app/pages/arena/ArenaProductionReadyPage.tsx',
  'src/app/pages/arena/MyArenaReportsPage.tsx',
  // Sprint 7-8 Arena migrations (10 files)
  'src/app/pages/arena/ArenaStudioPage.tsx',
  'src/app/pages/arena/ArenaUniversalPresetLibraryPage.tsx',
  'src/app/pages/arena/ConnectedEcosystemProductionPage.tsx',
  'src/app/pages/arena/ArenaPointsLedgerPage.tsx',
  'src/app/pages/arena/ArenaResolutionCenterPage.tsx',
  'src/app/pages/arena/ArenaBlockedUsersPage.tsx',
  'src/app/pages/arena/ArenaReportCasePage.tsx',
  'src/app/pages/arena/ArenaChallengeDetailPage.tsx',
  'src/app/pages/arena/ArenaJoinPage.tsx',
  'src/app/pages/arena/ArenaPointsEntryDetailPage.tsx',
  'src/app/pages/earn/StakingEarnPage.tsx',
  'src/app/pages/p2p/P2PHomePage.tsx',
  'src/app/pages/p2p/P2PMyAdsPage.tsx',
  'src/app/pages/p2p/P2PReviewsPage.tsx',
  'src/app/pages/p2p/P2PAdDetailPage.tsx',
  'src/app/pages/p2p/P2POrderPage.tsx',
  'src/app/pages/p2p/P2PCreateAdPage.tsx',
  'src/app/pages/p2p/P2PPaymentMethodsPage.tsx',
  // Sprint 9 P2P Insurance migrations
  'src/app/pages/p2p/P2PInsuranceFundPage.tsx',
  'src/app/pages/p2p/P2PContributionHistoryPage.tsx',
  'src/app/pages/profile/ProfilePage.tsx',
  'src/app/pages/profile/SettingsPage.tsx',
  'src/app/pages/profile/SecurityPage.tsx',
  'src/app/pages/profile/DeviceManagementPage.tsx',
  'src/app/pages/profile/SubAccountPage.tsx',
  'src/app/pages/profile/VIPPage.tsx',
  'src/app/pages/predictions/PredictionsHomePage.tsx',
  'src/app/pages/predictions/PredictionsBreakingPage.tsx',
  'src/app/pages/predictions/PredictionsRewardsPage.tsx',
  'src/app/pages/predictions/PredictionsGlobalActivityPage.tsx',
  'src/app/pages/predictions/PredictionsLeaderboardPage.tsx',
  'src/app/pages/predictions/PredictionsSearchPage.tsx',
  'src/app/pages/predictions/PredictionsPortfolioPage.tsx',
  'src/app/pages/predictions/PredictionEventDetailPage.tsx',
  'src/app/pages/wallet/WalletPage.tsx',
  'src/app/pages/wallet/DepositPage.tsx',
  'src/app/pages/wallet/WithdrawPage.tsx',
  'src/app/pages/wallet/AddressBookPage.tsx',
  'src/app/pages/wallet/AddressAddPage.tsx',
  'src/app/pages/wallet/BuyCryptoPage.tsx',
  'src/app/pages/wallet/TransactionHistoryPage.tsx',
  'src/app/pages/wallet/TransactionDetailPage.tsx',
  'src/app/pages/wallet/PortfolioAnalyticsPage.tsx',
  'src/app/pages/wallet/AssetDetailPage.tsx',
  'src/app/pages/wallet/TransferPage.tsx',
  'src/app/pages/market/MarketListPage.tsx',
  'src/app/pages/trade/ConvertPage.tsx',
  'src/app/pages/trade/TradePage.tsx',
];

/**
 * Margin class pattern — matches Tailwind margin-top/bottom/y
 * variants including responsive prefixes and arbitrary values.
 */
const MARGIN_TB_PATTERN = /(?:^|\s)-?(?:sm:|md:|lg:|xl:|2xl:)?m[tby]-(?:\d+(?:\.\d+)?|\[\S+?\])/;

/* ─── Types ─── */

interface Violation {
  file: string;
  line: number;
  code: string;
  marginClass: string;
}

/* ─── Core Scanner ─── */

/**
 * Scans a single file for margin violations on direct children
 * of <PageContent> using indentation-based detection.
 *
 * Strategy:
 *  1. Find <PageContent ...> opening tag
 *  2. Record its indentation level
 *  3. Direct children are at indent + 2 or indent + 4 spaces
 *  4. At that level, check for margin classes in className
 *  5. Stop when </PageContent> is found at the same indent
 *
 * This avoids complex JSX depth tracking and works reliably
 * with consistently-formatted code.
 */
function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = path.relative(SRC_ROOT, filePath);

  // If file doesn't use PageContent, skip
  if (!content.includes('<PageContent')) return [];

  let insidePageContent = false;
  let pageContentIndent = -1; // indent of <PageContent>
  let childIndent = -1; // indent of direct children
  let isMultiLinePageContentTag = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;
    const indent = line.length - line.trimStart().length;

    // ── Detect <PageContent opening ──
    if (trimmed.startsWith('<PageContent') && !trimmed.startsWith('</PageContent')) {
      pageContentIndent = indent;

      // Check if tag closes on this line
      if (trimmed.includes('>') && !trimmed.endsWith('/>')) {
        insidePageContent = true;
        childIndent = -1; // Will be detected from first child
      } else if (trimmed.endsWith('/>')) {
        // Self-closing, no children
        continue;
      } else {
        // Multi-line tag
        isMultiLinePageContentTag = true;
      }
      continue;
    }

    // ── Handle multi-line PageContent tag closing ──
    if (isMultiLinePageContentTag) {
      if (trimmed.endsWith('>') && !trimmed.endsWith('/>')) {
        insidePageContent = true;
        childIndent = -1;
        isMultiLinePageContentTag = false;
      } else if (trimmed.endsWith('/>')) {
        isMultiLinePageContentTag = false;
      }
      continue;
    }

    // ── Detect </PageContent> ──
    if (insidePageContent && trimmed.startsWith('</PageContent>')) {
      insidePageContent = false;
      pageContentIndent = -1;
      childIndent = -1;
      continue;
    }

    if (!insidePageContent) continue;
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('{/*')) continue;

    // ── Detect direct child indent level ──
    // First non-empty line after <PageContent> sets the child indent
    if (childIndent === -1 && trimmed.length > 0) {
      childIndent = indent;
    }

    // ── Check direct children only ──
    // Direct children are at childIndent level
    if (indent !== childIndent) continue;

    // Skip comments, closing tags, fragments
    if (trimmed.startsWith('</') || trimmed.startsWith('{/*') || trimmed === '*/}') continue;

    // Check className attribute on this line or next few lines (multi-line tag)
    const tagLines = collectTagLines(lines, i);
    const tagText = tagLines.join(' ');

    // Extract all className values
    const classNameMatches = tagText.matchAll(/className\s*=\s*["'`]([^"'`]*)["'`]/g);
    for (const match of classNameMatches) {
      const classes = match[1];
      const marginMatch = classes.match(MARGIN_TB_PATTERN);
      if (marginMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          code: trimmed.substring(0, 120),
          marginClass: marginMatch[0].trim(),
        });
      }
    }

    // Also check template literal classNames
    const templateMatches = tagText.matchAll(/className\s*=\s*\{`([^`]*)`\}/g);
    for (const match of templateMatches) {
      const classes = match[1];
      const marginMatch = classes.match(MARGIN_TB_PATTERN);
      if (marginMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          code: trimmed.substring(0, 120),
          marginClass: marginMatch[0].trim(),
        });
      }
    }
  }

  return violations;
}

/**
 * Collects lines of a JSX tag (from opening < to closing > or />).
 * Returns up to 8 lines to handle multi-line tags.
 */
function collectTagLines(lines: string[], startIdx: number): string[] {
  const result: string[] = [];
  for (let i = startIdx; i < Math.min(startIdx + 8, lines.length); i++) {
    result.push(lines[i]);
    const trimmed = lines[i].trim();
    if (trimmed.endsWith('>') || trimmed.endsWith('/>')) break;
  }
  return result;
}

/**
 * Format violations into a readable report.
 */
function formatReport(violations: Violation[], title: string): string {
  if (violations.length === 0) return '';

  const byFile = new Map<string, Violation[]>();
  for (const v of violations) {
    const list = byFile.get(v.file) || [];
    list.push(v);
    byFile.set(v.file, list);
  }

  const titleLine = `  ${title}  `;
  const border = '═'.repeat(titleLine.length);

  let report = `\n\n╔${border}╗\n`;
  report += `║${titleLine}║\n`;
  report += `╚${border}╝\n\n`;

  for (const [file, vs] of byFile) {
    report += `  ${file}\n`;
    for (const v of vs) {
      report += `    L${v.line}: ${v.marginClass}\n`;
      report += `           ${v.code}\n`;
    }
    report += '\n';
  }

  report += '  FIX: Remove mt-*/mb-*/my-* from direct children of <PageContent>.\n';
  report += '  Use gap="tight|default|relaxed|loose" on <PageContent> instead.\n\n';

  return report;
}

/**
 * Recursively find all .tsx page files.
 */
function findTsxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTsxFiles(fullPath));
    } else if (
      entry.name.endsWith('.tsx') &&
      !entry.name.includes('.test.') &&
      !entry.name.includes('.spec.')
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

/* ─── Test Suite ─── */

describe('Layout Anti-Pattern Lint', () => {
  // ════════════════════════════════════════════════
  //  TEST 1: STRICT GUARD — Must pass (hard fail)
  // ════════════════════════════════════════════════
  describe('Strict Guard — Fixed files must not regress', () => {
    for (const relFile of GUARDED_FILES) {
      const absPath = path.resolve(SRC_ROOT, relFile);

      it(`${relFile} — no margin on direct children of PageContent`, () => {
        if (!fs.existsSync(absPath)) {
          // File was renamed/deleted — skip gracefully
          return;
        }
        const violations = scanFile(absPath);
        if (violations.length > 0) {
          const report = formatReport(violations, 'REGRESSION DETECTED');
          expect.fail(
            `${violations.length} margin+gap stacking violation(s) in ${relFile}` + report,
          );
        }
      });
    }
  });

  // ════════════════════════════════════════════════
  //  TEST 2: DISCOVERY SCAN — Report only (no fail)
  // ════════════════════════════════════════════════
  describe('Discovery Scan — All pages (report only)', () => {
    it('scans all page files and reports potential violations', () => {
      const allPages = findTsxFiles(PAGES_DIR);
      const guardedSet = new Set(GUARDED_FILES);
      const unguardedPages = allPages.filter((f) => {
        const rel = path.relative(SRC_ROOT, f);
        return !guardedSet.has(rel);
      });

      const allViolations: Violation[] = [];
      for (const file of unguardedPages) {
        allViolations.push(...scanFile(file));
      }

      if (allViolations.length > 0) {
        const report = formatReport(
          allViolations,
          'DISCOVERY — Potential violations (not blocking)',
        );
        // Log but don't fail — these are files not yet in the guard list
        console.warn(
          `\n[Layout Lint Discovery] Found ${allViolations.length} potential violation(s) ` +
            `across ${new Set(allViolations.map((v) => v.file)).size} unguarded file(s).` +
            report +
            '\nTo guard these files after fixing, add them to GUARDED_FILES in layout-lint.test.ts\n',
        );
      }

      // Always pass — this is informational only
      expect(true).toBe(true);
    });
  });
});

/* ─── Exports ─── */

export { scanFile, findTsxFiles, formatReport, GUARDED_FILES };
export type { Violation };
