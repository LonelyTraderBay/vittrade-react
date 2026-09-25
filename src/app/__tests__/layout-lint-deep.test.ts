/**
 * ══════════════════════════════════════════════════════════════
 *  Layout Anti-Pattern Lint — Deep Scan (Sub-Component Roots)
 * ══════════════════════════════════════════════════════════════
 *
 *  Companion to layout-lint.test.ts.
 *
 *  Catches a subtler pattern: sub-components defined in the
 *  SAME file as PageContent that return root elements with
 *  mt-*, mb-* margins. These are often rendered as direct
 *  children of PageContent (e.g., via className="contents").
 *
 *  Example violation:
 *    function HeroCard() {
 *      return (
 *        <div className="mt-6 ...">  // stacks with gap
 *    }
 *    // Used as:
 *    <PageContent>
 *      <HeroCard />  // root div gets gap(16) + mt-6(24) = 40px
 *
 *  Run:  pnpm test -- layout-lint-deep
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_ROOT = path.resolve(__dirname, '../../..');

/**
 * Same guarded files as layout-lint.test.ts.
 * Only hard-fail on files we've already fixed.
 */
const GUARDED_FILES = [
  'src/features/market/pages/MarketHomePage.tsx',
  'src/dev/legacy/arena/ArenaHomePage.tsx',
  'src/features/arena/pages/ArenaContractPages.tsx',
  'src/dev/legacy/arena/MyArenaPage.tsx',
  'src/dev/legacy/arena/ArenaCreatorPage.tsx',
  'src/dev/legacy/arena/ArenaLeaderboardPage.tsx',
  'src/dev/legacy/arena/ArenaPredictionBridgeFoundationPage.tsx',
  'src/dev/legacy/arena/ArenaProductionReadyPage.tsx',
  'src/dev/legacy/arena/MyArenaReportsPage.tsx',
  // Sprint 7-8 Arena migrations (10 files)
  'src/dev/legacy/arena/ArenaStudioPage.tsx',
  'src/dev/legacy/arena/ArenaUniversalPresetLibraryPage.tsx',
  'src/dev/legacy/arena/ConnectedEcosystemProductionPage.tsx',
  'src/dev/legacy/arena/ArenaPointsLedgerPage.tsx',
  'src/dev/legacy/arena/ArenaResolutionCenterPage.tsx',
  'src/dev/legacy/arena/ArenaBlockedUsersPage.tsx',
  'src/dev/legacy/arena/ArenaReportCasePage.tsx',
  'src/dev/legacy/arena/ArenaJoinPage.tsx',
  'src/dev/legacy/arena/ArenaPointsEntryDetailPage.tsx',
  'src/features/earn/pages/EarnPage.tsx',
  'src/app/pages/p2p/P2PHomePage.tsx',
  'src/features/p2p/pages/P2PMyAdsContractPage.tsx',
  'src/features/p2p/pages/P2PReviewsPage.tsx',
  // Sprint 9 P2P Insurance migrations
  'src/dev/legacy/p2p/P2PInsuranceFundPage.tsx',
  'src/dev/legacy/p2p/P2PContributionHistoryPage.tsx',
  'src/features/profile/pages/ProfileContractPage.tsx',
  'src/dev/legacy/profile/SettingsPage.tsx',
  'src/features/profile/pages/SecurityContractPage.tsx',
  'src/features/profile/pages/DeviceManagementContractPage.tsx',
  'src/features/profile/pages/SubAccountContractPage.tsx',
  'src/dev/legacy/profile/VIPPage.tsx',
];

const MARGIN_TB_PATTERN = /(?:^|\s)-?(?:sm:|md:|lg:|xl:|2xl:)?m[tby]-(?:\d+(?:\.\d+)?|\[\S+?\])/;

interface DeepViolation {
  file: string;
  componentName: string;
  line: number;
  code: string;
  marginClass: string;
}

/**
 * Detect sub-components that return root elements with margin classes.
 *
 * Strategy:
 * 1. Find function/const component declarations (PascalCase)
 * 2. Skip the main page component (the one containing <PageContent>)
 * 3. Find the first `return (` and check root element for margins
 */
function deepScanFile(filePath: string): DeepViolation[] {
  const violations: DeepViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');

  // Only scan files that use PageContent
  if (!content.includes('<PageContent')) return [];

  const lines = content.split('\n');
  const relPath = path.relative(SRC_ROOT, filePath);

  // Find all component declarations
  const components: { name: string; startLine: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // function ComponentName(
    const fnMatch = trimmed.match(/^(?:export\s+)?function\s+([A-Z][A-Za-z0-9]*)\s*\(/);
    if (fnMatch) {
      components.push({ name: fnMatch[1], startLine: i });
      continue;
    }

    // const ComponentName = (
    const constMatch = trimmed.match(
      /^(?:export\s+)?const\s+([A-Z][A-Za-z0-9]*)\s*=\s*(?:\(|function)/,
    );
    if (constMatch) {
      components.push({ name: constMatch[1], startLine: i });
    }
  }

  for (const comp of components) {
    // Check if this component contains <PageContent> → skip (it's the main page)
    let containsPageContent = false;
    let braceCount = 0;
    let inBody = false;
    const bodyEnd = lines.length;

    for (let i = comp.startLine; i < bodyEnd; i++) {
      const line = lines[i];
      for (const ch of line) {
        if (ch === '{') {
          braceCount++;
          inBody = true;
        }
        if (ch === '}') braceCount--;
      }
      if (inBody && braceCount <= 0) break;

      if (line.includes('<PageContent') || line.includes('<PageLayout')) {
        containsPageContent = true;
        break;
      }
    }

    if (containsPageContent) continue;

    // Find first return statement and check root element
    let foundReturn = false;
    braceCount = 0;
    inBody = false;

    for (let i = comp.startLine; i < bodyEnd; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      for (const ch of line) {
        if (ch === '{') {
          braceCount++;
          inBody = true;
        }
        if (ch === '}') braceCount--;
      }
      if (inBody && braceCount <= 0) break;

      if (
        trimmed.startsWith('return (') ||
        trimmed.startsWith('return(') ||
        trimmed === 'return ('
      ) {
        foundReturn = true;
        continue;
      }

      if (foundReturn) {
        // Skip empty lines and comments
        if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('{/*')) continue;

        // First JSX element after return
        if (trimmed.startsWith('<') && !trimmed.startsWith('</')) {
          // Collect tag lines for multi-line check
          const tagLines: string[] = [];
          for (let j = i; j < Math.min(i + 6, lines.length); j++) {
            tagLines.push(lines[j]);
            const t = lines[j].trim();
            if (t.endsWith('>') || t.endsWith('/>')) break;
          }
          const tagText = tagLines.join(' ');

          const classNameMatches = tagText.matchAll(/className\s*=\s*["'`]([^"'`]*)["'`]/g);
          for (const match of classNameMatches) {
            const classes = match[1];
            const marginMatch = classes.match(MARGIN_TB_PATTERN);
            if (marginMatch) {
              violations.push({
                file: relPath,
                componentName: comp.name,
                line: i + 1,
                code: trimmed.substring(0, 120),
                marginClass: marginMatch[0].trim(),
              });
            }
          }
        }

        // Only check first element after return
        break;
      }
    }
  }

  return violations;
}

/* ─── Test Suite ─── */

describe('Layout Anti-Pattern Lint — Deep Scan', () => {
  describe('Strict Guard — Sub-component roots in fixed files', () => {
    for (const relFile of GUARDED_FILES) {
      const absPath = path.resolve(SRC_ROOT, relFile);

      it(`${relFile} — sub-components should not return root with margin`, () => {
        if (!fs.existsSync(absPath)) return;
        const violations = deepScanFile(absPath);
        if (violations.length > 0) {
          let report = '\n\n';
          for (const v of violations) {
            report += `  L${v.line}: ${v.componentName}() → root has ${v.marginClass}\n`;
            report += `         ${v.code}\n`;
          }
          report += '\n  FIX: Remove margin from sub-component root element.\n';
          report += '  PageContent gap handles spacing between children.\n';
          expect.fail(`${violations.length} sub-component root margin(s) in ${relFile}` + report);
        }
      });
    }
  });
});

export { deepScanFile };
export type { DeepViolation };
